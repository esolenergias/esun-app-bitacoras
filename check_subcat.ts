import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('insumos').select('subcategory, description');
  
  const subs = new Set(data?.map(d => d.subcategory));
  console.log("Subcategories:", Array.from(subs));

  const micros = data?.filter(d => d.description.toLowerCase().includes('micro'));
  console.log("Micros:", micros);
}

run().catch(console.error);
