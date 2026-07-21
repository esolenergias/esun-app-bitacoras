const fs = require('fs');
const env = fs.readFileSync('C:/Users/mafre/Esolenergias/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const url = urlMatch[1].trim().replace(/['"]/g, '');
const key = keyMatch[1].trim().replace(/['"]/g, '');
fetch(url + '/rest/v1/registros_app', {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
}).then(r => r.json()).then(data => {
  console.log('Total rows:', data.length);
  const fields = ['id', 'site_name', 'date', 'weather', 'crew_count', 'description', 'physical_progress', 'financial_progress', 'budget_estimate', 'latitude', 'longitude', 'timestamp'];
  data.forEach((row, i) => {
    fields.forEach(f => {
      if (row[f] === null || row[f] === undefined) {
        console.log(`Row ${i+1} (${row.site_name} - ${row.date}): Field "${f}" is NULL`);
      }
    });
  });
}).catch(console.error);
