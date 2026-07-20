const fs = require('fs');
const env = fs.readFileSync('C:/Users/mafre/Esolenergias/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch[1].trim().replace(/['"]/g, '');
const key = keyMatch[1].trim().replace(/['"]/g, '');

fetch(url + '/rest/v1/registros_app', {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({
    site_name: 'Test',
    date: '2026-07-20',
    weather: 'Soleado',
    crew_count: 1,
    description: 'Test',
    physical_progress: 0,
    financial_progress: 0,
    budget_estimate: 0,
    latitude: 0,
    longitude: 0,
    photo_uri: null,
    concepto_id: '123',
    concepto: 'Test Concepto',
    timestamp: Date.now()
  })
}).then(r => r.text()).then(data => console.log(data)).catch(console.error);
