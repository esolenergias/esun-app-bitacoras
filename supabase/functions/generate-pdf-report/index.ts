import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib';

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

    // 1. Fetch system details
    const { data: system, error: sysError } = await supabase
      .from('esun_pv_systems')
      .select('*')
      .eq('id', system_id)
      .single();

    if (sysError || !system) throw sysError || new Error("System not found");

    // 2. Fetch AI Alerts for this system
    const { data: alerts } = await supabase
      .from('esun_monitoring_alerts')
      .select('*')
      .eq('system_id', system_id)
      .order('created_at', { ascending: false })
      .limit(3);

    // 3. Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('Reporte Mensual de Energía Fotovoltaica', {
      x: 50,
      y: height - 50,
      size: 24,
      font: helveticaBold,
      color: rgb(0.1, 0.4, 0.8),
    });

    page.drawText(`Planta: ${system.plant_name} (Capacidad: ${system.capacity_kwp} kWp)`, {
      x: 50, y: height - 90, size: 14, font: helveticaFont
    });

    page.drawText(`Tarifa CFE: ${system.cfe_tariff || 'N/A'}`, {
      x: 50, y: height - 110, size: 14, font: helveticaFont
    });

    page.drawText('Diagnóstico de Inteligencia Artificial (Gemini):', {
      x: 50, y: height - 160, size: 16, font: helveticaBold, color: rgb(0.2, 0.2, 0.2)
    });

    let currentY = height - 190;
    if (alerts && alerts.length > 0) {
      alerts.forEach((alert: any) => {
        page.drawText(`• Gravedad: ${alert.severity}`, { x: 50, y: currentY, size: 12, font: helveticaBold });
        page.drawText(`  ${alert.ai_description}`, { x: 50, y: currentY - 15, size: 11, font: helveticaFont });
        page.drawText(`  Rec: ${alert.ai_recommendation}`, { x: 50, y: currentY - 30, size: 11, font: helveticaFont, color: rgb(0.1, 0.6, 0.1) });
        currentY -= 60;
      });
    } else {
      page.drawText('El sistema operó en condiciones óptimas durante este periodo.', { x: 50, y: currentY, size: 12, font: helveticaFont });
    }

    const pdfBytes = await pdfDoc.save();

    // 4. Upload to Supabase Storage
    const fileName = `report_${system_id}_${year}_${month}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('reports')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('reports').getPublicUrl(fileName);
    const pdfUrl = publicUrlData.publicUrl;

    // 5. Send Email via Resend (Mock for now, but fully wired)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailStatus = "Not Sent (Missing RESEND_API_KEY)";

    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Esolenergias <noreply@esolenergias.com>',
          to: ['cliente@ejemplo.com'], // In a real scenario, this comes from the system/account
          subject: `Reporte Mensual Fotovoltaico - ${system.plant_name}`,
          html: `
            <h2>Hola,</h2>
            <p>Adjuntamos el enlace para descargar tu reporte de monitoreo fotovoltaico del mes de ${month}/${year}.</p>
            <p><a href="${pdfUrl}">Descargar Reporte PDF</a></p>
            <br/>
            <p>Atentamente,<br/>El equipo de Esolenergias</p>
          `
        })
      });
      
      if (emailResponse.ok) {
        emailStatus = "Sent Successfully";
      } else {
        emailStatus = `Failed: ${await emailResponse.text()}`;
      }
    }

    return new Response(JSON.stringify({ 
      message: "PDF generated successfully", 
      url: pdfUrl,
      emailStatus
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
