const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim().replace(/['"]/g, '') : '';
const key = keyMatch ? keyMatch[1].trim().replace(/['"]/g, '') : '';

// Create client with explicit anon role
const supabase = createClient(url, key, {
  auth: {
    persistSession: false
  }
});

async function testAnonInsert() {
  console.log('Testing anon insert...');
  const { data, error, status, statusText } = await supabase
    .from('subcontratistas')
    .insert([{
      razon_social: 'Prueba Anon ' + Date.now(),
      representante_legal: 'Rep Test',
      rfc: 'TEST999999',
      domicilio_fiscal: 'Domicilio Test',
      repse: '123'
    }])
    .select();

  console.log('Insert Result:', { data, error, status, statusText });

  console.log('Testing anon update...');
  if (data && data.length > 0) {
    const resUpdate = await supabase
      .from('subcontratistas')
      .update({ rfc: 'UPDATED999' })
      .eq('id', data[0].id)
      .select();
    console.log('Update Result:', resUpdate);
  }
}

testAnonInsert();
