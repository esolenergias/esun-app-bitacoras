import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnum() {
  const { data, error } = await supabase.rpc('get_insumos_subcategories'); // might not exist
  if (error) {
    const { data: d2 } = await supabase.from('insumos').select('subcategory').limit(100);
    const unique = [...new Set(d2?.map(x => x.subcategory))];
    console.log("Subcategorias encontradas:", unique);
  }
}
checkEnum();
