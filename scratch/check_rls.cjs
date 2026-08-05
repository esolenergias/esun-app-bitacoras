const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim().replace(/['"]/g, '') : '';
const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim().replace(/['"]/g, '') : '';

const supabaseAdmin = createClient(url, serviceKey);

async function checkRLS() {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', {
    sql: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'subcontratistas';`
  });
  console.log('PG class query:', { data, error });
}

checkRLS();
