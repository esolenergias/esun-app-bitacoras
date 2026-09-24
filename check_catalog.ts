import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCatalog() {
  const { data: insumos } = await supabase.from('insumos').select('*').limit(20);
  console.log("INSUMOS SAMPLE:", insumos);

  const { data: matrices } = await supabase.from('matrices').select('*').limit(20);
  console.log("MATRICES SAMPLE:", matrices);

  const { data: presupuestos } = await supabase.from('presupuestos').select('*').limit(20);
  console.log("PRESUPUESTOS SAMPLE:", presupuestos);
}

checkCatalog().catch(console.error);
