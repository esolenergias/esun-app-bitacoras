import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function analyzeWithGemini(apiKey: string, logs: any[], systemData: any) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `
    Eres un experto en energía solar. Analiza el historial de producción de un sistema fotovoltaico en los últimos 30 días.
    
    Datos del sistema:
    - Capacidad: ${systemData.capacity_kwp} kWp
    
    Historial (Día, Generación kWh, Estado):
    ${logs.map(l => `${l.date} | ${l.generated_kwh} kWh | ${l.status_code}`).join('\n')}
    
    Analiza la tendencia. Si notas que la producción ha bajado consistentemente sin errores de estado ('OK'), podría ser sombreamiento o suciedad.
    Si hay errores ('COMM_ERROR' o 'INVERTER_FAULT'), es una falla técnica.
    
    Responde estrictamente en formato JSON válido con esta estructura:
    {
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "ai_description": "Breve explicación del problema detectado",
      "ai_recommendation": "Recomendación para el cliente o equipo de mantenimiento"
    }
  `;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${errText}`);
  }

  const result = await response.json();
  const jsonString = result.candidates[0].content.parts[0].text;
  return JSON.parse(jsonString);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error("Missing environment variables");
    }

    const { system_id } = await req.json();
    if (!system_id) throw new Error("system_id is required");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch System Info
    const { data: system, error: sysError } = await supabase
      .from('esun_pv_systems')
      .select('*')
      .eq('id', system_id)
      .single();

    if (sysError || !system) throw sysError || new Error("System not found");

    // 2. Fetch last 30 days logs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: logs, error: logsError } = await supabase
      .from('esun_production_logs')
      .select('*')
      .eq('system_id', system_id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (logsError) throw logsError;

    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({ message: "Not enough logs to analyze" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Analyze with Gemini
    const analysis = await analyzeWithGemini(geminiApiKey, logs, system);

    // 4. Save Alert
    const { data: alert, error: alertError } = await supabase
      .from('esun_monitoring_alerts')
      .insert({
        system_id,
        severity: analysis.severity,
        ai_description: analysis.ai_description,
        ai_recommendation: analysis.ai_recommendation,
        is_resolved: false
      })
      .select()
      .single();

    if (alertError) throw alertError;

    return new Response(JSON.stringify({ message: "Analysis complete", alert }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in analyze-production:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
