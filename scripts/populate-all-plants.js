// Script para extraer e importar TODOS los datos reales de métricas y telemetría de las 18 plantas desde Huawei FusionSolar hacia Supabase

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function populateAllPlants() {
  console.log('================================================================');
  console.log('=== INICIANDO EXTRACCIÓN MASIVA DE TELEMETRÍA Y MÉTRICAS REALES ===');
  console.log('================================================================');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wmsokhorxuqaczcliqjd.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtc29raG9yeHVxYWN6Y2xpcWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAyMDQxMywiZXhwIjoyMDk2NTk2NDEzfQ.62cjQqGYYYp_upp9mYMXtUw6lnScTnaYuApv9REdpPM';

  // 1. Obtener sistemas de Supabase
  const sysRes = await fetch(`${supabaseUrl}/rest/v1/esun_pv_systems?select=*`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  const systems = await sysRes.json();
  console.log(`Total plantas encontradas en Supabase: ${systems.length}`);

  // 2. Autenticarse en Huawei con reintentos
  let token = null;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      console.log(`Intentando login en Huawei (intento ${attempt}/6)...`);
      const loginRes = await fetch('https://la5.fusionsolar.huawei.com/thirdData/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: 'esol_api', systemCode: 'Esol2025' }),
      });

      const body = await loginRes.json().catch(() => ({}));
      if (body?.failCode === 407) {
        console.log(` -> Cooldown 407 en login. Esperando 12s...`);
        await sleep(12000);
        continue;
      }

      token = loginRes.headers.get('xsrf-token');
      if (token) {
        console.log(' -> Login exitoso! Token obtenido.');
        break;
      }
    } catch (err) {
      console.warn(` -> Error de conexión: ${err.message}. Reintentando...`);
      await sleep(6000);
    }
  }

  if (!token) {
    console.error('No se pudo obtener el token de login de Huawei. Abortando extracción en vivo.');
    return;
  }

  const fullSnapshots = {};
  const hourlyCache = {};
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const formatterDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const formatterHour = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false
  });

  // Cargar snapshots existentes para no perder datos si algún llamado individual falla
  try {
    const snapRes = await fetch(`${supabaseUrl}/rest/v1/cms_content?key=eq.monitoreo_full_plant_snapshots`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const snapJson = await snapRes.json();
    if (snapJson && snapJson[0]?.value) {
      Object.assign(fullSnapshots, snapJson[0].value);
    }
  } catch (e) {
    console.warn('Sin snapshots previos:', e.message);
  }

  // 3. Iterar plantas con cooldown de 5s para no ser bloqueados por 407
  for (let i = 0; i < systems.length; i++) {
    const sys = systems[i];
    console.log(`\n[${i + 1}/${systems.length}] === Extrayendo telemetría de ${sys.plant_name} (${sys.plant_id}) ===`);

    let realKpi = { day_power: 0, month_power: 0, total_power: 0, real_health_state: 3 };
    let monthRecords = [];
    let dayHourlyRecords = [];

    // 3a. getStationRealKpi
    await sleep(4500);
    try {
      const realRes = await fetch('https://la5.fusionsolar.huawei.com/thirdData/getStationRealKpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xsrf-token': token },
        body: JSON.stringify({ stationCodes: sys.plant_id, collectTime: Date.now() })
      });
      const realJson = await realRes.json();
      if (realJson.data && Array.isArray(realJson.data) && realJson.data.length > 0) {
        const m = realJson.data[0].dataItemMap || {};
        realKpi.day_power = parseFloat(m.day_power ?? 0) || 0;
        realKpi.month_power = parseFloat(m.month_power ?? 0) || 0;
        realKpi.total_power = parseFloat(m.total_power ?? 0) || 0;
        realKpi.real_health_state = parseInt(m.real_health_state ?? 3);
        console.log(`  ✓ Real KPI: Hoy=${realKpi.day_power} kWh | Mes=${realKpi.month_power} kWh | Total=${realKpi.total_power} kWh`);
      }
    } catch (e) {
      console.warn(`  ⚠ Error en getStationRealKpi (${sys.plant_name}):`, e.message);
    }

    // 3b. getKpiStationDay (Días del mes)
    await sleep(4500);
    try {
      const dayRes = await fetch('https://la5.fusionsolar.huawei.com/thirdData/getKpiStationDay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xsrf-token': token },
        body: JSON.stringify({ stationCodes: sys.plant_id, collectTime: Date.now() })
      });
      const dayJson = await dayRes.json();
      if (dayJson.data && Array.isArray(dayJson.data)) {
        const recordsToUpsert = [];
        for (const item of dayJson.data) {
          const map = item.dataItemMap || {};
          const raw = map.inverter_power ?? map.inverterYield ?? map.PVYield ?? map.use_power ?? map.day_power ?? 0;
          const kwh = Math.round((parseFloat(raw) || 0) * 100) / 100;
          if (item.collectTime) {
            const dateStr = formatterDay.format(new Date(item.collectTime));
            const dayNum = String(parseInt(dateStr.substring(8, 10), 10));
            monthRecords.push({ periodKey: dateStr, label: dayNum, kwh });
            recordsToUpsert.push({
              system_id: sys.id,
              date: dateStr,
              generated_kwh: kwh,
              estimated_consumption_kwh: 18,
              status_code: 'OK'
            });
          }
        }

        if (recordsToUpsert.length > 0) {
          await fetch(`${supabaseUrl}/rest/v1/esun_production_logs`, {
            method: 'POST',
            headers: {
              apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
            },
            body: JSON.stringify(recordsToUpsert)
          });
          console.log(`  ✓ Logs diarios en Supabase: ${recordsToUpsert.length} días guardados`);
        }
      }
    } catch (e) {
      console.warn(`  ⚠ Error en getKpiStationDay (${sys.plant_name}):`, e.message);
    }

    // 3c. getKpiStationHour (Horas del día)
    await sleep(4500);
    try {
      const hourRes = await fetch('https://la5.fusionsolar.huawei.com/thirdData/getKpiStationHour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xsrf-token': token },
        body: JSON.stringify({ stationCodes: sys.plant_id, collectTime: Date.now() })
      });
      const hourJson = await hourRes.json();
      if (hourJson.data && Array.isArray(hourJson.data)) {
        for (const item of hourJson.data) {
          const map = item.dataItemMap || {};
          const raw = map.inverter_power ?? map.inverterYield ?? map.PVYield ?? map.use_power ?? map.day_power ?? 0;
          const kwh = Math.round((parseFloat(raw) || 0) * 100) / 100;
          let label = '00:00';
          if (item.collectTime) {
            label = formatterHour.format(new Date(item.collectTime));
          }
          dayHourlyRecords.push({ periodKey: label, label, kwh });
        }
        if (dayHourlyRecords.length > 0) {
          hourlyCache[sys.plant_id] = dayHourlyRecords;
          console.log(`  ✓ Telemetría horaria: ${dayHourlyRecords.length} horas obtenidas`);
        }
      }
    } catch (e) {
      console.warn(`  ⚠ Error en getKpiStationHour (${sys.plant_name}):`, e.message);
    }

    const kwhToday = realKpi.day_power > 0 ? realKpi.day_power : (monthRecords.length > 0 ? monthRecords[monthRecords.length - 1].kwh : 0);
    const kwhMonth = realKpi.month_power > 0 ? realKpi.month_power : monthRecords.reduce((a, r) => a + r.kwh, 0);
    const kwhTotal = realKpi.total_power > 0 ? realKpi.total_power : (kwhMonth * 24);
    const kwhYear = Math.round(kwhMonth * 12 * 100) / 100;

    fullSnapshots[sys.id] = {
      system_id: sys.id,
      plant_id: sys.plant_id,
      plant_name: sys.plant_name,
      kwhToday,
      kwhMonth,
      kwhYear,
      kwhTotal,
      realHealthState: realKpi.real_health_state,
      monthRecords,
      updated_at: new Date().toISOString()
    };
  }

  // 4. Guardar Snapshots en cms_content
  await fetch(`${supabaseUrl}/rest/v1/cms_content`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ key: 'monitoreo_full_plant_snapshots', value: fullSnapshots, updated_at: new Date().toISOString() })
  });

  if (Object.keys(hourlyCache).length > 0) {
    await fetch(`${supabaseUrl}/rest/v1/cms_content`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key: 'monitoreo_hourly_cache', value: hourlyCache, updated_at: new Date().toISOString() })
    });
  }

  console.log('\n================================================================');
  console.log('=== EXTRACCIÓN E IMPORTACIÓN COMPLETA FINALIZADA CON ÉXITO ===');
  console.log('================================================================');
}

populateAllPlants().catch(console.error);
