const fs = require('fs');
const env = fs.readFileSync('C:/Users/mafre/Esolenergias/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch[1].trim().replace(/['"]/g, '');
const key = keyMatch[1].trim().replace(/['"]/g, '');
fetch(url + '/rest/v1/registros_app?limit=3', {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
}).then(r => r.json()).then(data => console.log(JSON.stringify(data, null, 2)));
