import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';
const supabase = createClient(supabaseUrl, supabaseKey);

const items = [
  { 
    code: 'PAN-CS-465W', 
    type: 'material', 
    subcategory: 'Panel solar', 
    description: 'Panel Canadian Solar 465W Monocristalino (Voltaje: 41.0 Voc)', 
    unit: 'pz', 
    cost: 2800 
  },
  { 
    code: 'INV-HM-1500', 
    type: 'material', 
    subcategory: 'Inversor', 
    description: 'Microinversor Hoymiles HM-1500 (1.5kW, Max 60Vdc)', 
    unit: 'equipo', 
    cost: 4500 
  },
  { 
    code: 'INV-HM-2000', 
    type: 'material', 
    subcategory: 'Inversor', 
    description: 'Microinversor Hoymiles HMS-2000 (2.0kW, Max 60Vdc)', 
    unit: 'equipo', 
    cost: 5800 
  }
];

async function insertItems() {
  for (const item of items) {
    const { error } = await supabase.from('insumos').upsert(item, { onConflict: 'code' });
    if (error) {
      console.error(`Error inserting ${item.code}:`, error.message);
    } else {
      console.log(`Successfully inserted ${item.code}`);
    }
  }
}

insertItems().catch(console.error);
