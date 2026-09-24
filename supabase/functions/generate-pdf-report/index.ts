import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const { system_id, month, year } = await req.json();
    if (!system_id) throw new Error("system_id is required");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch system details WITH the linked account (to get the real email)
    const { data: system, error: sysError } = await supabase
      .from('esun_pv_systems')
      .select(`
        *,
        account:account_id (
          id,
          username,
          brand
        )
      `)
      .eq('id', system_id)
      .single();

    if (sysError || !system) throw sysError || new Error("System not found");

    // Derive recipient email from the linked inverter account's username
    const recipientEmail: string | null = system.account?.username ?? null;

    // 2. Fetch AI Alerts for this system
    const { data: alerts } = await supabase
      .from('esun_monitoring_alerts')
      .select('*')
      .eq('system_id', system_id)
      .order('created_at', { ascending: false })
      .limit(3);

    // 3. Fetch production logs for recent metrics
    const { data: logs } = await supabase
      .from('esun_production_logs')
      .select('generated_kwh, estimated_consumption_kwh, date')
      .eq('system_id', system_id)
      .order('date', { ascending: false })
      .limit(30);

    const totalGenerated = (logs || []).reduce((acc: number, l: any) => acc + (parseFloat(l.generated_kwh) || 0), 0);

    // 4. Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header Gold/Anthracite
    page.drawRectangle({
      x: 0,
      y: height - 90,
      width,
      height: 90,
      color: rgb(0.08, 0.08, 0.06),
    });

    page.drawText('eSol Energías · Telemetría Solar', {
      x: 50,
      y: height - 40,
      size: 20,
      font: helveticaBold,
      color: rgb(0.77, 0.60, 0.15), // Gold
    });

    page.drawText(`Reporte Mensual Fotovoltaico · Periodo ${month}/${year}`, {
      x: 50,
      y: height - 65,
      size: 11,
      font: helveticaFont,
      color: rgb(0.94, 0.94, 0.91),
    });

    // System Info Box
    page.drawRectangle({
      x: 50,
      y: height - 200,
      width: width - 100,
      height: 90,
      color: rgb(0.96, 0.96, 0.94),
      borderColor: rgb(0.85, 0.85, 0.80),
      borderWidth: 1,
    });

    page.drawText(`Planta: ${system.plant_name}`, {
      x: 65, y: height - 135, size: 14, font: helveticaBold, color: rgb(0.08, 0.08, 0.06)
    });
    page.drawText(`ID de Planta: ${system.plant_id}  |  Marca: ${system.account?.brand || 'Huawei'}`, {
      x: 65, y: height - 155, size: 10, font: helveticaFont, color: rgb(0.3, 0.3, 0.3)
    });
    page.drawText(`Capacidad Instalada: ${system.capacity_kwp} kWp  |  Tarifa CFE: ${system.cfe_tariff || 'DAC'}`, {
      x: 65, y: height - 175, size: 10, font: helveticaFont, color: rgb(0.3, 0.3, 0.3)
    });
    page.drawText(`Generación 30 Días: ${totalGenerated.toFixed(1)} kWh`, {
      x: 65, y: height - 192, size: 10, font: helveticaBold, color: rgb(0.77, 0.60, 0.15)
    });

    // Section IA Diagnostics
    page.drawText('Diagnóstico de Inteligencia Artificial (Gemini):', {
      x: 50, y: height - 230, size: 13, font: helveticaBold, color: rgb(0.1, 0.1, 0.1)
    });

    let currentY = height - 260;
    if (alerts && alerts.length > 0) {
      alerts.forEach((alert: any) => {
        page.drawText(`• Severidad: ${alert.severity}`, { x: 50, y: currentY, size: 11, font: helveticaBold, color: rgb(0.8, 0.2, 0.2) });
        page.drawText(`  ${alert.ai_description}`, { x: 50, y: currentY - 15, size: 9.5, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });
        if (alert.ai_recommendation) {
          page.drawText(`  Acción: ${alert.ai_recommendation}`, { x: 50, y: currentY - 30, size: 9.5, font: helveticaFont, color: rgb(0.1, 0.5, 0.1) });
        }
        currentY -= 50;
      });
    } else {
      page.drawText('El sistema fotovoltaico opera en condiciones óptimas sin anomalías.', { x: 50, y: currentY, size: 10, font: helveticaFont, color: rgb(0.2, 0.6, 0.2) });
    }

    const pdfBytes = await pdfDoc.save();

    // Convert PDF bytes to base64
    let binary = '';
    const bytes = new Uint8Array(pdfBytes);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const pdfBase64 = btoa(binary);

    return new Response(JSON.stringify({ 
      message: "PDF generated successfully", 
      pdf_base64: pdfBase64,
      filename: `Reporte_${system.plant_name.replace(/\s+/g, '_')}_${month}_${year}.pdf`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
