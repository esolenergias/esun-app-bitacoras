import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { HuaweiAdapter } from "./adapters/huawei.adapter.ts";
import { GrowattAdapter } from "./adapters/growatt.adapter.ts";
import { HoymilesAdapter } from "./adapters/hoymiles.adapter.ts";
import { IInverterAdapter } from "./adapters/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Estimación base: Consumo promedio diario de un hogar Tarifa DAC ~ 15-20 kWh
const ESTIMATED_DAILY_CONSUMPTION_KWH = 18;

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

    // 1. Fetch all PV systems with accounts
    const { data: systems, error: systemsError } = await supabase
      .from('esun_pv_systems')
      .select(`
        *,
        account:account_id (*)
      `);

    if (systemsError) throw systemsError;

    const todayDate = new Date().toISOString().split('T')[0];
    const results = [];

    // 2. Iterar y sincronizar
    for (const sys of systems || []) {
      const account = sys.account;
      if (!account) continue;

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

      if (adapter) {
        try {
          const prod = await adapter.getDailyProduction(sys.plant_id, todayDate);
          
          // Lógica básica CFE (Fase 3 simplificada)
          const netEnergy = prod.generated_kwh - ESTIMATED_DAILY_CONSUMPTION_KWH;
          
          // Guardar en log
          const { error: logError } = await supabase
            .from('esun_production_logs')
            .upsert({
              system_id: sys.id,
              date: todayDate,
              generated_kwh: prod.generated_kwh,
              estimated_consumption_kwh: ESTIMATED_DAILY_CONSUMPTION_KWH,
              status_code: prod.status_code
            }, { onConflict: 'system_id, date' });
            
          if (logError) console.error("Error saving log:", logError);

          results.push({ system_id: sys.id, brand: account.brand, result: prod, net_energy: netEnergy });
        } catch (e: any) {
          console.error(`Error processing system ${sys.id}:`, e);
          results.push({ system_id: sys.id, brand: account.brand, error: e.message });
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: "Sync completed", 
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
