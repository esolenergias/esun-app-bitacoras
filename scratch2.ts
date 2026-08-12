import { createClient } from '@supabase/supabase-js';

// I will run this via a terminal command that imports the env from .env
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Querying...");
  const { data, error } = await supabase
    .from('visitas_mantenimiento_poliza')
    .select(`
      *,
      poliza:poliza_id (*)
    `)
    .eq('estado', 'Completada');
  
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}
run();
