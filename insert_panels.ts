import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';

const supabase = createClient(supabaseUrl, supabaseKey);

const panels = [
  { code: 'PAN-CS-600W', type: 'material', subcategory: 'Panel solar', description: 'Panel Canadian Solar 600W Monocristalino (Voltaje: 40.0 Voc)', unit: 'pz', cost: 3500 },
  { code: 'PAN-CS-620W', type: 'material', subcategory: 'Panel solar', description: 'Panel Canadian Solar 620W Monocristalino (Voltaje: 40.5 Voc)', unit: 'pz', cost: 3600 },
  { code: 'PAN-CS-640W', type: 'material', subcategory: 'Panel solar', description: 'Panel Canadian Solar 640W Monocristalino (Voltaje: 41.0 Voc)', unit: 'pz', cost: 3750 },
  { code: 'PAN-CS-660W', type: 'material', subcategory: 'Panel solar', description: 'Panel Canadian Solar 660W Monocristalino (Voltaje: 41.5 Voc)', unit: 'pz', cost: 3900 },
  { code: 'PAN-CS-680W', type: 'material', subcategory: 'Panel solar', description: 'Panel Canadian Solar 680W Monocristalino (Voltaje: 42.0 Voc)', unit: 'pz', cost: 4100 },
  { code: 'PAN-CS-700W', type: 'material', subcategory: 'Panel solar', description: 'Panel Canadian Solar 700W Monocristalino (Voltaje: 42.5 Voc)', unit: 'pz', cost: 4300 },
  { code: 'PAN-CS-710W', type: 'material', subcategory: 'Panel solar', description: 'Panel Canadian Solar 710W Monocristalino (Voltaje: 43.0 Voc)', unit: 'pz', cost: 4450 },
];

async function insertPanels() {
  for (const pan of panels) {
    const { error } = await supabase.from('insumos').upsert(pan, { onConflict: 'code' });
    if (error) {
      console.error(`Error inserting ${pan.code}:`, error.message);
    } else {
      console.log(`Successfully inserted ${pan.code}`);
    }
  }
}

insertPanels().catch(console.error);
