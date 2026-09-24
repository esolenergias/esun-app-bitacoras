import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmsokhorxuqaczcliqjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkItems() {
  const { data, error } = await supabase.from('insumos').select('*').in('code', ['PAN-CS-465W', 'INV-HM-1500', 'INV-HM-2000']);
  console.log(JSON.stringify(data, null, 2));
}

checkItems().catch(console.error);
