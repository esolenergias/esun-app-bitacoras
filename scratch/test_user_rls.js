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
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Generating login link for corona.gustavoc@gmail.com...");
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'corona.gustavoc@gmail.com'
  });

  if (linkError) {
    console.error("❌ Failed to generate link:", linkError.message);
    return;
  }

  // Extract access token from action link
  const actionLink = linkData.properties.action_link;
  console.log("Action link generated successfully:", actionLink);
  console.log("All properties:", linkData.properties);
  
  // Parse hash parameters from the link or query
  const queryPart = actionLink.includes('?') ? actionLink.split('?')[1] : '';
  const hashPart = actionLink.includes('#') ? actionLink.split('#')[1] : '';
  const params = new URLSearchParams(queryPart || hashPart);
  const accessToken = params.get('access_token') || linkData.properties.hashed_token;
  
  if (!accessToken) {
    console.error("❌ Could not find access token in link hash.");
    return;
  }

  console.log("Initializing client as authenticated user (corona.gustavoc@gmail.com)...");
  // Create a new client with the user's access token
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  // Set the session
  await userClient.auth.setSession({
    access_token: accessToken,
    refresh_token: params.get('refresh_token') || ''
  });

  // Query profiles table
  console.log("Querying profiles table as authenticated user...");
  const { data: profiles, error: selectError } = await userClient.from('profiles').select('*');
  
  if (selectError) {
    console.error("❌ SELECT error:", selectError.message);
    console.error("Error details:", selectError);
  } else {
    console.log("✅ SELECT succeeded! Found profiles count:", profiles.length);
    console.log("Profiles list:", profiles);
  }
}

run();
