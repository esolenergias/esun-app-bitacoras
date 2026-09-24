import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';

const supabase = createClient(supabaseUrl, supabaseKey);

const offgridItems = [
  // Baterías
  { code: 'BAT-PYLON-3.5', type: 'material', subcategory: 'Material electrico DC', description: 'Batería Pylontech US3000C Litio 3.5kWh 48V', unit: 'pz', cost: 18500 },
  { code: 'BAT-GROW-4.8', type: 'material', subcategory: 'Material electrico DC', description: 'Batería Growatt HOPE 4.8L-C1 Litio 4.8kWh 48V', unit: 'pz', cost: 24000 },
  { code: 'BAT-GEL-200AH', type: 'material', subcategory: 'Material electrico DC', description: 'Batería Gel Ciclo Profundo 12V 200Ah (2.4kWh)', unit: 'pz', cost: 5800 },
  
  // Inversores Off-Grid / Híbridos
  { code: 'INV-SPF-3000', type: 'material', subcategory: 'Inversor', description: 'Inversor Growatt SPF 3000 ES Off-Grid 3kW 48V', unit: 'equipo', cost: 10500 },
  { code: 'INV-SPF-5000', type: 'material', subcategory: 'Inversor', description: 'Inversor Growatt SPF 5000 ES Off-Grid 5kW 48V', unit: 'equipo', cost: 13800 },
  { code: 'INV-HYB-5000', type: 'material', subcategory: 'Inversor', description: 'Inversor Híbrido Growatt SPH 5000 5kW', unit: 'equipo', cost: 22000 },
  
  // Accesorios
  { code: 'ACC-RACK-4', type: 'material', subcategory: 'Material electrico DC', description: 'Gabinete Rack para hasta 4 Baterías Pylontech/Growatt', unit: 'pz', cost: 3500 },
  { code: 'ACC-CBL-BAT', type: 'material', subcategory: 'Material electrico DC', description: 'Kit de Cables para Batería 4/0 AWG con terminales', unit: 'kit', cost: 1200 },
];

const matrices = [
  {
    code: 'APU-BATERIA-LITIO',
    description: 'Suministro e instalación de batería de litio para sistema de respaldo',
    unit: 'pz',
    subcategory: 'Sistemas Aislados',
    indirect_percentage: 15,
    utility_percentage: 15,
    items: [
      { code: 'BAT-PYLON-3.5', quantity: 1 },
      { code: 'ACC-CBL-BAT', quantity: 1 }
    ]
  },
  {
    code: 'APU-INV-OFFGRID',
    description: 'Suministro e instalación de Inversor Cargador Off-Grid con protecciones DC/AC integradas',
    unit: 'pz',
    subcategory: 'Sistemas Aislados',
    indirect_percentage: 15,
    utility_percentage: 15,
    items: [
      { code: 'INV-SPF-5000', quantity: 1 }
    ]
  }
];

async function insertData() {
  console.log("Insertando insumos...");
  for (const item of offgridItems) {
    const { error } = await supabase.from('insumos').upsert(item, { onConflict: 'code' });
    if (error) console.error(`Error ${item.code}:`, error.message);
    else console.log(`Insumo OK: ${item.code}`);
  }

  // Fetch insumos to get IDs
  const { data: dbInsumos } = await supabase.from('insumos').select('id, code');
  const insumoMap = {};
  dbInsumos?.forEach(i => insumoMap[i.code] = i.id);

  console.log("\nInsertando Matrices...");
  for (const matriz of matrices) {
    const { items, ...matrizData } = matriz;
    
    // Check if matrix exists
    const { data: existingMatrix } = await supabase.from('matrices').select('id').eq('code', matrizData.code).single();
    
    let matrizId;
    if (existingMatrix) {
      const { data, error } = await supabase.from('matrices').update(matrizData).eq('id', existingMatrix.id).select('id').single();
      if (error) console.error(`Error Matrix ${matrizData.code}:`, error.message);
      else matrizId = data.id;
    } else {
      const { data, error } = await supabase.from('matrices').insert(matrizData).select('id').single();
      if (error) console.error(`Error Matrix ${matrizData.code}:`, error.message);
      else matrizId = data.id;
    }

    if (matrizId && items) {
      // clear old items
      await supabase.from('matriz_insumos').delete().eq('matriz_id', matrizId);
      
      for (const item of items) {
        const insumo_id = insumoMap[item.code];
        if (insumo_id) {
          await supabase.from('matriz_insumos').insert({
            matriz_id: matrizId,
            insumo_id: insumo_id,
            quantity: item.quantity
          });
        }
      }
      console.log(`Matrix OK: ${matrizData.code}`);
    }
  }
}

insertData().catch(console.error);
