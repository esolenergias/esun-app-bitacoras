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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log("Checking database functions and RLS...");
  
  // We can run a query to check pg_proc for is_admin_or_master
  // Since we cannot run raw SQL directly without RPC, let's check if we can query it using a trick
  // Or check if the triggers are working by querying profiles
  const { data, error } = await supabase.from('profiles').select('id, role');
  console.log("Profiles count:", data ? data.length : 'error', error);
  
  // Let's create an RPC to inspect pg_proc if possible?
  // Usually we don't have an RPC for that, but we can check if we can fetch policies
  // Let's check if we can write a quick PostgreSQL query by creating a temporary function/RPC if we have superuser,
  // but via Service Key we can't run DDL unless we have an RPC that executes SQL.
  // Wait, let's see if we can check if is_admin_or_master is defined correctly.
  // Let's test the is_admin_or_master function directly if it's exposed, or test it by querying a table that uses it.
  // The table 'leads' uses is_admin_or_master(auth.uid()).
  // Let's see if we get recursion when querying 'leads' with the anon client.
  console.log("Data profiles:", data);
}

check();
