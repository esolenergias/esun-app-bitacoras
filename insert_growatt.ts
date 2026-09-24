import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';

const supabase = createClient(supabaseUrl, supabaseKey);

const inverters = [
  { code: 'INV-GRWT-3K', type: 'material', subcategory: 'Inversor', description: 'Growatt MIN 3000TL-X (3kW, Max 500Vdc, 1P)', unit: 'equipo', cost: 6500 },
  { code: 'INV-GRWT-5K', type: 'material', subcategory: 'Inversor', description: 'Growatt MIN 5000TL-X (5kW, Max 550Vdc, 1P)', unit: 'equipo', cost: 9200 },
  { code: 'INV-GRWT-10K', type: 'material', subcategory: 'Inversor', description: 'Growatt MIN 10000TL-X (10kW, Max 600Vdc, 1P)', unit: 'equipo', cost: 15500 },
  { code: 'INV-GRWT-15K', type: 'material', subcategory: 'Inversor', description: 'Growatt MAC 15KTL3-XL (15kW, Max 1100Vdc, 3P)', unit: 'equipo', cost: 22000 },
  { code: 'INV-GRWT-30K', type: 'material', subcategory: 'Inversor', description: 'Growatt MAC 30KTL3-X (30kW, Max 1100Vdc, 3P)', unit: 'equipo', cost: 38000 },
  { code: 'INV-GRWT-50K', type: 'material', subcategory: 'Inversor', description: 'Growatt MAC 50KTL3-X LV (50kW, Max 1100Vdc, 3P)', unit: 'equipo', cost: 62000 },
  { code: 'INV-GRWT-80K', type: 'material', subcategory: 'Inversor', description: 'Growatt MAX 80KTL3-LV (80kW, Max 1100Vdc, 3P)', unit: 'equipo', cost: 95000 },
  { code: 'INV-GRWT-100K', type: 'material', subcategory: 'Inversor', description: 'Growatt MAX 100KTL3-X LV (100kW, Max 1100Vdc, 3P)', unit: 'equipo', cost: 125000 }
];

async function insertInverters() {
  for (const inv of inverters) {
    const { error } = await supabase.from('insumos').upsert(inv, { onConflict: 'code' });
    if (error) {
      console.error(`Error inserting ${inv.code}:`, error.message);
    } else {
      console.log(`Successfully inserted ${inv.code}`);
    }
  }
}

insertInverters().catch(console.error);
