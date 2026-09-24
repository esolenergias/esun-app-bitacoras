const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wmsokhorxuqaczcliqjd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM');

supabase.from('insumos').select('*').limit(1).then(res => {
  if (res.data && res.data.length > 0) {
    console.log(Object.keys(res.data[0]));
  } else {
    console.log("No data");
  }
}).catch(console.error);
