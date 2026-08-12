import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual simple .env parser
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.replace(/(^['"]|['"]$)/g, ''); // remove quotes
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncMantenimientos() {
  console.log("Iniciando sincronización de pólizas de mantenimiento...");

  // 1. Obtener todas las pólizas
  const { data: polizas, error: errorPolizas } = await supabase
    .from('polizas_garantia')
    .select('*');

  if (errorPolizas) {
    console.error("Error obteniendo pólizas:", errorPolizas);
    return;
  }

  console.log(`Se encontraron ${polizas.length} pólizas.`);

  for (const poliza of polizas) {
    console.log(`Sincronizando póliza: ${poliza.folio} - ${poliza.nombre_obra}`);

    // 2. Obtener todas las visitas de la póliza
    const { data: visitas, error: errorVisitas } = await supabase
      .from('visitas_mantenimiento_poliza')
      .select('*')
      .eq('poliza_id', poliza.id)
      .order('fecha_programada', { ascending: true });

    if (errorVisitas) {
      console.error(`Error obteniendo visitas para ${poliza.folio}:`, errorVisitas);
      continue;
    }

    if (!visitas || visitas.length === 0) {
      console.log(`  No tiene visitas programadas. Se omite.`);
      continue;
    }

    // 3. Determinar la próxima visita pendiente
    const pendingVisitas = visitas.filter((v: any) => v.estado !== 'completada');

    let newEstado = 'Terminado';
    let newProximaFecha = null;

    if (pendingVisitas.length > 0) {
      newEstado = 'En proceso';
      newProximaFecha = pendingVisitas[0].fecha_programada;
    }

    // 4. Actualizar la póliza si cambió
    if (poliza.estado_mantenimiento !== newEstado || poliza.fecha_proximo_mantenimiento !== newProximaFecha) {
      const { error: errorUpdate } = await supabase
        .from('polizas_garantia')
        .update({
          estado_mantenimiento: newEstado,
          fecha_proximo_mantenimiento: newProximaFecha
        })
        .eq('id', poliza.id);

      if (errorUpdate) {
        console.error(`  Error actualizando ${poliza.folio}:`, errorUpdate);
      } else {
        console.log(`  Actualizado: Estado -> ${newEstado}, Próxima Fecha -> ${newProximaFecha}`);
      }
    } else {
      console.log(`  Sin cambios necesarios.`);
    }
  }

  console.log("Sincronización completada.");
}

syncMantenimientos();
