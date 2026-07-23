import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: presupuestos, error } = await supabase
    .from('presupuestos')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(3);
    
  if (error) {
    console.error(error);
    return;
  }
  
  for (const p of presupuestos) {
    console.log(`\n--- Presupuesto: ${p.name} ---`);
    const { data: conceptos } = await supabase
      .from('presupuesto_conceptos')
      .select('description, quantity')
      .eq('presupuesto_id', p.id);
      
    if (conceptos) {
      conceptos.forEach(c => {
        console.log(`- QTY: ${c.quantity} | DESC: ${c.description}`);
      });
    }
  }
}

check();
