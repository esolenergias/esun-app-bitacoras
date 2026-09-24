// Scheduled background sync for Huawei FusionSolar PV Systems
// Runs 2 times a day (11:00 AM & 5:00 PM) to update Supabase snapshots

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runScheduledSync() {
  console.log(`[${new Date().toISOString()}] === INICIANDO SINCRONIZACIÓN PROGRAMADA (11 AM / 5 PM) ===`);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wmsokhorxuqaczcliqjd.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';

  let token = null;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const loginRes = await fetch('https://la5.fusionsolar.huawei.com/thirdData/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: 'esol_api', systemCode: 'Esol2025' }),
      });

      const body = await loginRes.json().catch(() => ({}));
      if (body?.failCode === 407) {
        console.log(`Rate limit 407 en login (Intento ${attempt}/5). Esperando 10s...`);
        await sleep(10000);
        continue;
      }

      token = loginRes.headers.get('xsrf-token');
      if (token) {
        console.log('Login oficial en Huawei FusionSolar OK!');
        break;
      }
    } catch (e) {
      console.warn(`Error en intento de login ${attempt}:`, e.message);
      await sleep(5000);
    }
  }

  if (!token) {
    console.error('No se pudo obtener token de Huawei tras varios intentos. Se usará el snapshot anterior.');
    return;
  }

  const sysRes = await fetch(`${supabaseUrl}/rest/v1/esun_pv_systems?select=*`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  const systems = await sysRes.json();
  console.log(`Total sistemas a sincronizar: ${systems.length}`);

  let existingSnapshots = {};
  try {
    const snapRes = await fetch(`${supabaseUrl}/rest/v1/cms_content?key=eq.monitoreo_full_plant_snapshots`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const snapJson = await snapRes.json();
    if (snapJson && snapJson.length > 0 && snapJson[0].value) {
      existingSnapshots = snapJson[0].value;
    }
  } catch (e) {
    console.warn('Sin snapshots previos:', e.message);
  }

  for (let i = 0; i < systems.length; i++) {
    const sys = systems[i];
    console.log(`[${i + 1}/${systems.length}] Sincronizando ${sys.plant_name} (${sys.plant_id})...`);

    await sleep(4000);

    try {
      const realRes = await fetch('https://la5.fusionsolar.huawei.com/thirdData/getStationRealKpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xsrf-token': token },
        body: JSON.stringify({ stationCodes: sys.plant_id, collectTime: Date.now() }),
      });
      const realJson = await realRes.json();

      if (realJson?.data && Array.isArray(realJson.data) && realJson.data.length > 0) {
        const m = realJson.data[0].dataItemMap || {};
        const dayKwh = parseFloat(m.day_power ?? 0) || 0;
        const monthKwh = parseFloat(m.month_power ?? 0) || 0;
        const totalKwh = parseFloat(m.total_power ?? 0) || 0;
        const healthState = parseInt(m.real_health_state ?? 3);
        const yearKwh = Math.round(monthKwh * 12 * 100) / 100;

        existingSnapshots[sys.id] = {
          system_id: sys.id,
          plant_id: sys.plant_id,
          plant_name: sys.plant_name,
          kwhToday: dayKwh,
          kwhMonth: monthKwh,
          kwhYear: yearKwh,
          kwhTotal: totalKwh,
          realHealthState: healthState,
          updated_at: new Date().toISOString(),
        };
        console.log(`   -> OK: Hoy=${dayKwh} kWh | Mes=${monthKwh} kWh | Total=${totalKwh} kWh`);
      }
    } catch (err) {
      console.warn(`   -> Err sincronizando ${sys.plant_name}:`, err.message);
    }
  }

  // Guardar snapshots actualizados en cms_content
  await fetch(`${supabaseUrl}/rest/v1/cms_content`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      key: 'monitoreo_full_plant_snapshots',
      value: existingSnapshots,
      updated_at: new Date().toISOString(),
    }),
  });

  console.log(`[${new Date().toISOString()}] === SINCRONIZACIÓN DE PLANTAS COMPLETADA CON ÉXITO ===`);
}

runScheduledSync().catch(console.error);
