import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { HuaweiAdapter, PeriodKpiRecord } from "./adapters/huawei.adapter.ts";
import { GrowattAdapter } from "./adapters/growatt.adapter.ts";
import { HoymilesAdapter } from "./adapters/hoymiles.adapter.ts";
import { IInverterAdapter } from "./adapters/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ESTIMATED_DAILY_CONSUMPTION_KWH = 18;

function getMexicoDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function getMexicoTimestamp(): number {
  return Date.now();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    // ─── MODO 1: AUTO-DESCUBRIMIENTO DE PLANTAS (action === 'discover') ───────
    if (body.action === 'discover') {
      const { account_id } = body;
      if (!account_id) throw new Error("account_id is required for discovery");

      const { data: account, error: accError } = await supabase
        .from('esun_inverter_accounts')
        .select('*')
        .eq('id', account_id)
        .single();

      if (accError || !account) throw accError || new Error("Account not found");

      let adapter: IInverterAdapter | null = null;
      switch (account.brand) {
        case 'Huawei':
          adapter = new HuaweiAdapter(account.username, account.encrypted_password);
          break;
        case 'Growatt':
          adapter = new GrowattAdapter(account.username, account.api_token);
          break;
        case 'Hoymiles':
          adapter = new HoymilesAdapter(account.username, account.encrypted_password);
          break;
      }

      if (!adapter || !adapter.listPlants) {
        throw new Error(`Auto-discovery is not supported for brand ${account.brand}`);
      }

      const discovered = await adapter.listPlants();

      const { data: existingSystems } = await supabase
        .from('esun_pv_systems')
        .select('plant_id')
        .eq('account_id', account_id);

      const existingPlantIds = new Set((existingSystems || []).map((s: any) => s.plant_id));
      const plantsWithStatus = discovered.map((p) => ({
        ...p,
        already_registered: existingPlantIds.has(p.plant_id),
      }));

      return new Response(JSON.stringify({
        message: "Plants discovered successfully",
        account_id,
        brand: account.brand,
        plants: plantsWithStatus,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // ─── MODO 2: DETALLES EN TIEMPO REAL Y PERIODOS (action === 'getPlantDetails') ───
    if (body.action === 'getPlantDetails') {
      const { system_id, period = 'month' } = body;
      if (!system_id) throw new Error("system_id is required");

      const { data: sys, error: sysErr } = await supabase
        .from('esun_pv_systems')
        .select(`*, account:account_id (*)`)
        .eq('id', system_id)
        .single();

      if (sysErr || !sys) throw sysErr || new Error("System not found");

      const account = sys.account;
      if (!account) throw new Error("Account not found for system");

      let adapter: any = null;
      switch (account.brand) {
        case 'Huawei':
          adapter = new HuaweiAdapter(account.username, account.encrypted_password, account.api_token);
          adapter.onTokenUpdate = async (newToken: string) => {
            await supabase
              .from('esun_inverter_accounts')
              .update({ api_token: newToken })
              .eq('id', account.id);
          };
          break;
        case 'Growatt':
          adapter = new GrowattAdapter(account.username, account.api_token);
          break;
        case 'Hoymiles':
          adapter = new HoymilesAdapter(account.username, account.encrypted_password);
          break;
      }

      if (!adapter) throw new Error(`Adapter not supported for ${account.brand}`);

      await adapter.authenticate();

      let kwhToday = 0;
      let kwhMonth = 0;
      let kwhTotal = 0;
      let kwhYear = 0;
      let realHealthState = 3;
      let periodRecords: PeriodKpiRecord[] = [];

      if (account.brand === 'Huawei') {
        const huawei = adapter as HuaweiAdapter;

        // 1. Obtener los registros del periodo solicitado
        if (period === 'day') {
          periodRecords = await huawei.getHourlyKpi(sys.plant_id).catch(() => []);
          const sumHourly = periodRecords.reduce((acc, r) => acc + (r.kwh || 0), 0);
          if (sumHourly > 0) kwhToday = Math.round(sumHourly * 100) / 100;
        } else if (period === 'year') {
          periodRecords = await huawei.getMonthlyKpi(sys.plant_id).catch(() => []);
          const sumMonthly = periodRecords.reduce((acc, r) => acc + (r.kwh || 0), 0);
          if (sumMonthly > 0) kwhYear = Math.round(sumMonthly * 100) / 100;
        } else if (period === 'total') {
          periodRecords = await huawei.getYearlyKpi(sys.plant_id).catch(() => []);
          const sumYearlyMwh = periodRecords.reduce((acc, r) => acc + (r.kwh || 0), 0);
          if (sumYearlyMwh > 0) kwhTotal = Math.round(sumYearlyMwh * 1000 * 100) / 100;
        } else {
          // Default: 'month' (días del mes)
          periodRecords = await huawei.getDailyKpi(sys.plant_id).catch(() => []);
          const sumDaily = periodRecords.reduce((acc, r) => acc + (r.kwh || 0), 0);
          if (sumDaily > 0) kwhMonth = Math.round(sumDaily * 100) / 100;
          if (periodRecords.length > 0) {
            kwhToday = periodRecords[periodRecords.length - 1].kwh || 0;
          }

          // Guardar los registros diarios reales en esun_production_logs
          if (periodRecords.length > 0) {
            const recordsToUpsert = periodRecords
              .filter(r => r.periodKey)
              .map((r: any) => ({
                system_id: sys.id,
                date: r.periodKey,
                generated_kwh: r.kwh,
                estimated_consumption_kwh: ESTIMATED_DAILY_CONSUMPTION_KWH,
                status_code: 'OK'
              }));

            if (recordsToUpsert.length > 0) {
              await supabase
                .from('esun_production_logs')
                .upsert(recordsToUpsert, { onConflict: 'system_id, date' });
            }
          }
        }

        // 2. Resumen oficial de FusionSolar (getStationRealKpi)
        await new Promise(r => setTimeout(r, 700));
        const realKpi = await huawei.getRealKpi(sys.plant_id).catch(() => null);
        if (realKpi && (realKpi.day_power > 0 || realKpi.month_power > 0 || realKpi.total_power > 0)) {
          if (realKpi.day_power > 0) kwhToday = realKpi.day_power;
          if (realKpi.month_power > 0) kwhMonth = realKpi.month_power;
          if (realKpi.total_power > 0) kwhTotal = realKpi.total_power;
          realHealthState = realKpi.real_health_state || 3;
        }

        if (kwhYear === 0) {
          kwhYear = Math.round(kwhMonth * 12 * 100) / 100;
        }
      }

      return new Response(JSON.stringify({
        system_id,
        plant_id: sys.plant_id,
        plant_name: sys.plant_name,
        period,
        kwhToday,
        kwhMonth,
        kwhYear,
        kwhTotal,
        realHealthState,
        periodRecords
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // ─── MODO 3: SINCRONIZACIÓN GENERAL DE PRODUCCIÓN ────────────────────────
    const { data: systems, error: systemsError } = await supabase
      .from('esun_pv_systems')
      .select(`*, account:account_id (*)`);

    if (systemsError) throw systemsError;

    const todayDate = getMexicoDate();
    const nowTs = getMexicoTimestamp();
    const results = [];

    const accountSystems = new Map<string, { account: any; systems: any[] }>();
    for (const sys of systems || []) {
      if (!sys.account) continue;
      const aid = sys.account_id;
      if (!accountSystems.has(aid)) {
        accountSystems.set(aid, { account: sys.account, systems: [] });
      }
      accountSystems.get(aid)!.systems.push(sys);
    }

    for (const [_accountId, { account, systems: acctSystems }] of accountSystems) {
      let adapter: any = null;

      switch (account.brand) {
        case 'Huawei':
          adapter = new HuaweiAdapter(account.username, account.encrypted_password, account.api_token);
          adapter.onTokenUpdate = async (newToken: string) => {
            await supabase
              .from('esun_inverter_accounts')
              .update({ api_token: newToken })
              .eq('id', account.id);
          };
          break;
        case 'Growatt':
          adapter = new GrowattAdapter(account.username, account.api_token);
          break;
        case 'Hoymiles':
          adapter = new HoymilesAdapter(account.username, account.encrypted_password);
          break;
      }

      if (!adapter) continue;

      try {
        await adapter.authenticate();
      } catch (authErr: any) {
        console.error(`Auth failed for account ${account.username}:`, authErr.message);
        for (const sys of acctSystems) {
          results.push({ system_id: sys.id, brand: account.brand, error: `Auth failed: ${authErr.message}` });
        }
        continue;
      }

      if (account.brand === 'Huawei') {
        const huaweiAdapter = adapter as HuaweiAdapter;

        try {
          const allPlantIds = acctSystems.map((s: any) => s.plant_id).join(',');
          const batchData = await huaweiAdapter.postRequestPublic('getStationRealKpi', {
            stationCodes: allPlantIds,
            collectTime: nowTs
          });

          const kpiMap = new Map<string, any>();
          if (batchData?.data && Array.isArray(batchData.data)) {
            for (const station of batchData.data) {
              kpiMap.set(station.stationCode, station.dataItemMap || {});
            }
          }

          for (const sys of acctSystems) {
            const map = kpiMap.get(sys.plant_id) || {};
            const dayKwh = parseFloat(map.day_power ?? 0) || 0;
            const monthKwh = parseFloat(map.month_power ?? 0) || 0;
            const totalKwh = parseFloat(map.total_power ?? 0) || 0;
            const healthState = parseInt(map.real_health_state ?? 1);
            const statusCode = healthState === 3 ? 'OK' : healthState === 2 ? 'INVERTER_FAULT' : 'COMM_ERROR';

            // Guardar log de hoy
            await supabase
              .from('esun_production_logs')
              .upsert([{
                system_id: sys.id,
                date: todayDate,
                generated_kwh: dayKwh,
                estimated_consumption_kwh: ESTIMATED_DAILY_CONSUMPTION_KWH,
                status_code: statusCode,
              }], { onConflict: 'system_id, date' });

            results.push({
              system_id: sys.id,
              plant_name: sys.plant_name,
              plant_id: sys.plant_id,
              brand: account.brand,
              day_kwh: dayKwh,
              month_kwh: monthKwh,
              total_kwh: totalKwh,
              health_state: healthState,
              status: statusCode,
            });
          }
        } catch (batchErr: any) {
          console.error(`Batch KPI error for account ${account.username}:`, batchErr.message);
          for (const sys of acctSystems) {
            results.push({ system_id: sys.id, brand: account.brand, error: batchErr.message });
          }
        }

        continue;
      }

      // Non-Huawei adapters
      for (const sys of acctSystems) {
        try {
          let dailyRecords: any[] = [];
          if (adapter.getMultipleDailyProduction) {
            dailyRecords = await adapter.getMultipleDailyProduction(sys.plant_id);
          }
          if (dailyRecords.length === 0) {
            const singleProd = await adapter.getDailyProduction(sys.plant_id, todayDate);
            dailyRecords = [singleProd];
          }

          const recordsToUpsert = dailyRecords.map((r: any) => ({
            system_id: sys.id,
            date: r.date,
            generated_kwh: r.generated_kwh,
            estimated_consumption_kwh: ESTIMATED_DAILY_CONSUMPTION_KWH,
            status_code: r.status_code
          }));

          await supabase
            .from('esun_production_logs')
            .upsert(recordsToUpsert, { onConflict: 'system_id, date' });

          const latestRecord = dailyRecords[dailyRecords.length - 1] || { generated_kwh: 0 };
          results.push({
            system_id: sys.id,
            plant_name: sys.plant_name,
            brand: account.brand,
            logs_synced: dailyRecords.length,
            latest_kwh: latestRecord.generated_kwh,
          });
        } catch (e: any) {
          console.error(`Error processing system ${sys.id}:`, e.message);
          results.push({ system_id: sys.id, brand: account.brand, error: e.message });
        }
      }
    }

    return new Response(JSON.stringify({
      message: "Sync completed",
      timezone: "America/Mexico_City",
      date: todayDate,
      processed: results.length,
      details: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in sync-inverters:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
