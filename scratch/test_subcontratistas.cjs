const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim().replace(/['"]/g, '') : '';
const key = keyMatch ? keyMatch[1].trim().replace(/['"]/g, '') : '';

const supabase = createClient(url, key);

async function testUpdate() {
  const { data: list } = await supabase.from('subcontratistas').select('*');
  console.log('List:', list);
  if (list && list.length > 0) {
    const targetId = list[0].id;
    console.log('Testing update on id:', targetId);
    const resUpdate = await supabase.from('subcontratistas').update({
      representante_legal: 'Juan Perez Updated'
    }).eq('id', targetId);
    console.log('Update result:', resUpdate);
  }
}

testUpdate();
