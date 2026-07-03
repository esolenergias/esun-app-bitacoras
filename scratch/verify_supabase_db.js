import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse the local .env file
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Missing credentials in .env file.");
  process.exit(1);
}

console.log("Connecting to Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuery(tableName) {
  console.log(`\nQuerying table "${tableName}"...`);
  const { data, error } = await supabase.from(tableName).select('*').limit(3);
  if (error) {
    console.error(`❌ Error querying table "${tableName}":`, error.message);
    return false;
  } else {
    console.log(`✅ Table "${tableName}" is queryable! Found ${data.length} records.`);
    if (data.length > 0) {
      // Print first record preview
      console.log("Preview:", JSON.stringify(data[0], null, 2).slice(0, 300) + (JSON.stringify(data[0]).length > 300 ? "..." : ""));
    }
    return true;
  }
}

async function run() {
  const tables = ['profiles', 'cms_content', 'ai_agents', 'pro_agents', 'pro_agent_tasks', 'leads', 'projects'];
  let allSuccess = true;
  for (const table of tables) {
    const success = await testQuery(table);
    if (!success) allSuccess = false;
  }
  
  if (allSuccess) {
    console.log("\n🎉 ALL TESTS PASSED! Supabase database schema and seed data are fully functional!");
  } else {
    console.log("\n⚠️ SOME TESTS FAILED. Please review the errors above.");
    process.exit(1);
  }
}

run();
