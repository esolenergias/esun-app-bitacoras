import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';

const supabase = createClient(supabaseUrl, supabaseKey);

const inverters = [
  { code: 'INV-HUA-3K-L1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-3KTL-L1 (3kW, Monofásico 220V)', unit: 'equipo', cost: 12000 },
  { code: 'INV-HUA-4K-L1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-4KTL-L1 (4kW, Monofásico 220V)', unit: 'equipo', cost: 13500 },
  { code: 'INV-HUA-5K-L1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-5KTL-L1 (5kW, Monofásico 220V)', unit: 'equipo', cost: 15000 },
  { code: 'INV-HUA-6K-L1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-6KTL-L1 (6kW, Monofásico 220V)', unit: 'equipo', cost: 17000 },
  
  { code: 'INV-HUA-3K-M1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-3KTL-M1 (3kW, Trifásico 220V/380V)', unit: 'equipo', cost: 18000 },
  { code: 'INV-HUA-4K-M1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-4KTL-M1 (4kW, Trifásico 220V/380V)', unit: 'equipo', cost: 20000 },
  { code: 'INV-HUA-5K-M1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-5KTL-M1 (5kW, Trifásico 220V/380V)', unit: 'equipo', cost: 22000 },
  { code: 'INV-HUA-6K-M1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-6KTL-M1 (6kW, Trifásico 220V/380V)', unit: 'equipo', cost: 24000 },
  { code: 'INV-HUA-8K-M1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-8KTL-M1 (8kW, Trifásico 220V/380V)', unit: 'equipo', cost: 28000 },
  { code: 'INV-HUA-10K-M1', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-10KTL-M1 (10kW, Trifásico 220V/380V)', unit: 'equipo', cost: 32000 },
  { code: 'INV-HUA-12K-M2', type: 'material', subcategory: 'Inversor', description: 'Huawei SUN2000-12KTL-M2 (12kW, Trifásico 220V/380V)', unit: 'equipo', cost: 36000 }
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
