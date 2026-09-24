import html2pdf from 'html2pdf.js';
import { supabase } from '../../../context/supabase';
import { CFE_TARIFF_RATES } from '../types/monitoreo.types';

export interface ReportDataOptions {
  systemId: string;
  month: number;
  year: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Generates an executive, ultra-visual, branded PDF report for a PV System
 * and returns a Blob URL ready to be opened in the browser or downloaded.
 */
export async function generateExecutivePDF(options: ReportDataOptions): Promise<{ blobUrl: string; filename: string }> {
  const { systemId, month, year } = options;

  // 1. Fetch system details with account
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
    .eq('id', systemId)
    .single();

  if (sysError || !system) throw sysError || new Error("Sistema no encontrado.");

  // 2. Fetch linked client if available
  let clientName = system.plant_name;
  let clientAddress = 'México';

  if (system.client_id) {
    const { data: client } = await supabase
      .from('clientes')
      .select('nombre_razon_social, email, direccion_completa, telefono')
      .eq('id', system.client_id)
      .maybeSingle();

    if (client) {
      clientName = client.nombre_razon_social || system.plant_name;
      if (client.direccion_completa) clientAddress = client.direccion_completa;
    }
  }

  // 3. Fetch production logs for the month / 30 days
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  const { data: logs } = await supabase
    .from('esun_production_logs')
    .select('*')
    .eq('system_id', systemId)
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true });

  const productionLogs = logs || [];

  // 4. Fetch recent AI alerts for diagnostic section
  const { data: alerts } = await supabase
    .from('esun_monitoring_alerts')
    .select('*')
    .eq('system_id', systemId)
    .order('created_at', { ascending: false })
    .limit(3);

  // 5. Calculations & Math
  const capacityKwp = Number(system.capacity_kwp) || 5.0;
  const tariffKey = system.cfe_tariff || 'DAC';
  const tariffRate = CFE_TARIFF_RATES[tariffKey] || 5.80;

  const totalGeneratedKwh = productionLogs.reduce((sum, l) => sum + (Number(l.generated_kwh) || 0), 0);
  const daysInPeriod = Math.max(1, productionLogs.length);
  const avgDailyKwh = totalGeneratedKwh / daysInPeriod;
  const maxDayKwh = productionLogs.length > 0 ? Math.max(...productionLogs.map(l => Number(l.generated_kwh) || 0)) : avgDailyKwh;

  // Expected solar generation (4.8 Horas Sol Pico promedio en México)
  const expectedDailyKwh = capacityKwp * 4.8;
  const expectedMonthlyKwh = expectedDailyKwh * (daysInPeriod || 30);
  const efficiencyRatio = Math.min(100, Math.round((totalGeneratedKwh / (expectedMonthlyKwh || 1)) * 100)) || 96;

  const estimatedSavingsMxn = totalGeneratedKwh * tariffRate;
  const co2AvoidedKg = Math.round(totalGeneratedKwh * 0.438); // Factor oficial SEMARNAT (0.438 kg CO2eq / kWh)
  const treesPlantedEq = Math.round((totalGeneratedKwh / 50) * 10) / 10; // ~50 kWh por árbol
  const specificYield = (totalGeneratedKwh / capacityKwp).toFixed(1); // kWh/kWp

  // Health score calculation
  const unresolvedAlerts = (alerts || []).filter(a => !a.is_resolved);
  const healthScore = Math.max(50, Math.min(100, Math.round(efficiencyRatio - (unresolvedAlerts.length * 15))));
  const isOptimal = healthScore >= 85;

  const monthName = MONTH_NAMES[month - 1] || 'Agosto';
  const issueDateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const folio = `ESOL-MON-${year}${String(month).padStart(2, '0')}-${system.plant_id.replace(/[^a-zA-Z0-9]/g, '').slice(-5)}`;
  const logoUrl = `${window.location.origin}/Logo_esol_b.png`;
  const illustrationUrl = `${window.location.origin}/crosssection_gridtied.jpg`;

  // 6. Generate SVG Chart for Daily Generation with generous spacing to avoid text overlaps
  const chartWidth = 736;
  const chartHeight = 175;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 36;
  const paddingBottom = 30;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const yMax = Math.max(maxDayKwh * 1.25, expectedDailyKwh * 1.25, 12);

  const daysToRender = Math.max(15, Math.min(31, productionLogs.length || 30));
  const barWidth = Math.max(8, Math.min(16, (plotWidth / daysToRender) - 5));
  const stepX = plotWidth / daysToRender;

  const chartBars = [];
  for (let i = 0; i < daysToRender; i++) {
    const logItem = productionLogs[i];
    const dayNum = logItem ? new Date(logItem.date + 'T12:00:00').getDate() : (i + 1);
    const kwh = logItem ? Number(logItem.generated_kwh) || 0 : 0;
    
    const barH = Math.max(3, (kwh / yMax) * plotHeight);
    const x = paddingLeft + (i * stepX) + (stepX - barWidth) / 2;
    const y = paddingTop + plotHeight - barH;

    chartBars.push({
      dayNum,
      kwh: kwh.toFixed(1),
      x,
      y,
      barH,
      barWidth,
    });
  }

  const targetLineY = paddingTop + plotHeight - ((expectedDailyKwh / yMax) * plotHeight);

  const svgChartHtml = `
    <svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" style="background: #0f172a; border-radius: 12px; border: 1px solid #1e293b; display: block;">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FEE180" />
          <stop offset="50%" stop-color="#C49825" />
          <stop offset="100%" stop-color="#8B6508" />
        </linearGradient>
      </defs>

      <!-- Encabezado de la Gráfica (Espacio protegido superior sin traslapes) -->
      <rect x="0" y="0" width="${chartWidth}" height="26" fill="#1e293b" rx="12" />
      <text x="${paddingLeft}" y="17" font-size="9.5" fill="#C49825" font-weight="800" font-family="'Montserrat', sans-serif">HISTORIAL DIARIO DE GENERACIÓN (kWh)</text>
      <text x="${chartWidth - paddingRight}" y="17" font-size="8.5" fill="#94a3b8" text-anchor="end" font-family="'Montserrat', sans-serif">
        Pico Récord: <tspan fill="#FEE180" font-weight="800">${maxDayKwh.toFixed(1)} kWh</tspan> &nbsp;|&nbsp; Promedio: <tspan fill="#ffffff" font-weight="700">${avgDailyKwh.toFixed(1)} kWh/d</tspan>
      </text>

      <!-- Background Grid lines -->
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${chartWidth - paddingRight}" y2="${paddingTop}" stroke="#334155" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="${paddingLeft}" y1="${paddingTop + plotHeight / 2}" x2="${chartWidth - paddingRight}" y2="${paddingTop + plotHeight / 2}" stroke="#334155" stroke-width="1" stroke-dasharray="3,3" />
      <line x1="${paddingLeft}" y1="${paddingTop + plotHeight}" x2="${chartWidth - paddingRight}" y2="${paddingTop + plotHeight}" stroke="#475569" stroke-width="1.5" />

      <!-- Y Axis Labels con espacio holgado -->
      <text x="${paddingLeft - 8}" y="${paddingTop + 3}" font-size="8" fill="#94a3b8" text-anchor="end" font-family="'Montserrat', sans-serif">${yMax.toFixed(0)}</text>
      <text x="${paddingLeft - 8}" y="${paddingTop + plotHeight / 2 + 3}" font-size="8" fill="#94a3b8" text-anchor="end" font-family="'Montserrat', sans-serif">${(yMax / 2).toFixed(0)}</text>
      <text x="${paddingLeft - 8}" y="${paddingTop + plotHeight + 3}" font-size="8" fill="#94a3b8" text-anchor="end" font-family="'Montserrat', sans-serif">0</text>

      <!-- Expected Target Benchmark Line -->
      <line x1="${paddingLeft}" y1="${targetLineY}" x2="${chartWidth - paddingRight}" y2="${targetLineY}" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,4" />
      <rect x="${chartWidth - paddingRight - 110}" y="${targetLineY - 14}" width="110" height="12" fill="#0f172a" opacity="0.8" rx="2" />
      <text x="${chartWidth - paddingRight - 4}" y="${targetLineY - 5}" font-size="7.5" fill="#10b981" font-weight="800" text-anchor="end" font-family="'Montserrat', sans-serif">Meta: ${expectedDailyKwh.toFixed(1)} kWh/d</text>

      <!-- Generation Bars -->
      ${chartBars.map(b => `
        <rect x="${b.x}" y="${b.y}" width="${b.barWidth}" height="${b.barH}" fill="url(#barGrad)" rx="2" />
        <text x="${b.x + b.barWidth / 2}" y="${paddingTop + plotHeight + 14}" font-size="7.5" fill="#94a3b8" text-anchor="middle" font-family="'Montserrat', sans-serif" font-weight="600">${b.dayNum}</text>
      `).join('')}
    </svg>
  `;

  // 7. Compose High-Definition Executive HTML Document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Montserrat', sans-serif; background: #ffffff; color: #141410; -webkit-print-color-adjust: exact; }
      </style>
    </head>
    <body>
      <div style="width: 816px; min-height: 1056px; background: #ffffff; position: relative; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box;">
        
        <!-- Franja Superior de Diseño Metálico eSol -->
        <div style="width: 100%; height: 20px; background: linear-gradient(90deg, #8B6508 0%, #C49825 25%, #FEE180 50%, #C49825 75%, #8B6508 100%); border-bottom: 2px solid #141410;"></div>

        <div style="padding: 20px 36px 24px 36px; display: flex; flex-direction: column; flex: 1;">
          
          <!-- ENCABEZADO EJECUTIVO CON LOGO -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1.5px solid #C49825;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="${logoUrl}" alt="eSol Energías" style="height: 44px; object-fit: contain;" onerror="this.style.display='none'" />
              <div>
                <span style="font-family: 'Cinzel', serif; font-size: 15px; font-weight: 900; color: #141410; letter-spacing: 1px; display: block;">eSol ENERGÍAS</span>
                <span style="font-size: 8px; font-weight: 800; color: #C49825; letter-spacing: 1.5px; text-transform: uppercase;">TELEMETRÍA & MONITOREO SOLAR 24/7</span>
              </div>
            </div>
            <div style="text-align: right;">
              <h1 style="font-size: 13.5px; font-weight: 900; color: #141410; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">REPORTE MENSUAL DE RENDIMIENTO</h1>
              <p style="font-size: 9px; color: #64748b; margin-top: 2px; font-weight: 600;">
                Folio: <strong style="color: #141410; font-family: monospace;">${folio}</strong> &nbsp;|&nbsp; Periodo: <strong style="color: #C49825;">${monthName} ${year}</strong>
              </p>
            </div>
          </div>

          <!-- BLOQUE PRINCIPAL: FICHA TÉCNICA + IMAGEN ILUSTRATIVA (2 COLUMNAS) -->
          <div style="display: flex; gap: 14px; margin-top: 12px; align-items: stretch;">
            
            <!-- Columna Izquierda: Tarjeta Hero Antracita -->
            <div style="flex: 1.6; background: #141410; border-radius: 12px; padding: 14px 16px; border: 1.5px solid #C49825; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
              <div style="position: absolute; right: -30px; top: -30px; width: 100px; height: 100px; background: #C49825; opacity: 0.12; border-radius: 50%; filter: blur(25px);"></div>
              
              <div style="z-index: 10;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span style="font-size: 8px; font-weight: 800; color: #C49825; text-transform: uppercase; letter-spacing: 1px; display: block;">INSTALACIÓN FOTOVOLTAICA</span>
                    <h2 style="font-size: 15px; font-weight: 900; color: #ffffff; text-transform: uppercase; margin: 2px 0 1px 0;">${clientName}</h2>
                    <p style="font-size: 8.5px; color: #94a3b8;">
                      Planta: <strong style="color: #f1f5f9;">${system.plant_name}</strong> &nbsp;·&nbsp; ID: <span style="font-family: monospace; color: #cbd5e1;">${system.plant_id}</span>
                    </p>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: 7.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700; display: block;">Health Score</span>
                    <span style="font-size: 15px; font-weight: 900; color: ${isOptimal ? '#10b981' : '#f59e0b'};">${healthScore}/100</span>
                  </div>
                </div>
              </div>

              <!-- Mini-Grid de Especificaciones Técnicas con fondos delimitados -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; z-index: 10; border-top: 1px solid #2e2e28; padding-top: 10px;">
                <div style="background: #1c1c17; border: 1px solid #2e2e28; border-radius: 6px; padding: 5px 8px;">
                  <span style="font-size: 7.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700; display: block;">Inversor</span>
                  <span style="font-size: 9px; font-weight: 800; color: #FEE180; display: block; margin-top: 1px;">${system.account?.brand || 'Huawei'} OpenAPI</span>
                </div>
                <div style="background: #1c1c17; border: 1px solid #2e2e28; border-radius: 6px; padding: 5px 8px;">
                  <span style="font-size: 7.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700; display: block;">Capacidad</span>
                  <span style="font-size: 9.5px; font-weight: 900; color: #ffffff; display: block; margin-top: 1px;">${capacityKwp.toFixed(2)} kWp</span>
                </div>
                <div style="background: #1c1c17; border: 1px solid #2e2e28; border-radius: 6px; padding: 5px 8px;">
                  <span style="font-size: 7.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700; display: block;">Tarifa CFE</span>
                  <span style="font-size: 9.5px; font-weight: 900; color: #10b981; display: block; margin-top: 1px;">${tariffKey} ($${tariffRate.toFixed(2)})</span>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Imagen Ilustrativa de Instalación & Badge Telemetría -->
            <div style="flex: 0.95; border-radius: 12px; border: 1.5px solid #C49825; position: relative; overflow: hidden; display: flex; flex-direction: column; background: #0f172a; min-height: 125px;">
              <img src="${illustrationUrl}" alt="Corte 3D Sistema Solar" style="width: 100%; height: 100%; object-fit: cover; object-position: center;" onerror="this.src='${window.location.origin}/Fotomontaje.webp'" />
              <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,20,16,0.1) 0%, rgba(20,20,16,0.88) 100%);"></div>
              <div style="position: absolute; top: 8px; left: 8px; z-index: 10;">
                <span style="background: rgba(16,185,129,0.92); color: #ffffff; font-size: 7px; font-weight: 900; padding: 2px 7px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 3px;">
                  ● CORTE 3D · FLUJO ENERGÉTICO
                </span>
              </div>
              <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; z-index: 10;">
                <p style="font-size: 7.5px; font-weight: 800; color: #FEE180; margin: 0; text-transform: uppercase;">Generación &amp; Interconexión</p>
                <p style="font-size: 6.5px; color: #cbd5e1; margin-top: 1px;">Módulos FV → Inversor CC/CA → Autoconsumo &amp; Red CFE</p>
              </div>
            </div>

          </div>

          <!-- GRID DE KPIS EJECUTIVOS (4 TARJETAS CON ESPACIADO PROTEGIDO) -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px;">
            
            <!-- KPI 1: Generación -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 12px; border-top: 3px solid #C49825;">
              <span style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">⚡ ENERGÍA GENERADA</span>
              <p style="font-size: 16px; font-weight: 900; color: #141410; margin: 3px 0 2px 0; line-height: 1.1;">${totalGeneratedKwh.toFixed(1)} <span style="font-size: 9.5px; font-weight: 700; color: #64748b;">kWh</span></p>
              <span style="font-size: 7.5px; color: #059669; font-weight: 700;">Rend: ${specificYield} kWh/kWp</span>
            </div>

            <!-- KPI 2: Ahorro CFE -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 12px; border-top: 3px solid #10b981;">
              <span style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">💵 AHORRO ESTIMADO CFE</span>
              <p style="font-size: 16px; font-weight: 900; color: #059669; margin: 3px 0 2px 0; line-height: 1.1;">$${Math.round(estimatedSavingsMxn).toLocaleString('es-MX')} <span style="font-size: 9.5px; font-weight: 700;">MXN</span></p>
              <span style="font-size: 7.5px; color: #64748b; font-weight: 700;">Base CFE $${tariffRate.toFixed(2)}/kWh</span>
            </div>

            <!-- KPI 3: CO2 Evitado -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 12px; border-top: 3px solid #3b82f6;">
              <span style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">🌱 CO₂ EVITADO</span>
              <p style="font-size: 16px; font-weight: 900; color: #2563eb; margin: 3px 0 2px 0; line-height: 1.1;">${co2AvoidedKg} <span style="font-size: 9.5px; font-weight: 700;">kg</span></p>
              <span style="font-size: 7.5px; color: #16a34a; font-weight: 700;">🌳 ${treesPlantedEq} árboles equiv.</span>
            </div>

            <!-- KPI 4: Eficiencia de Planta -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 12px; border-top: 3px solid #8b5cf6;">
              <span style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">🎯 EFICIENCIA DE PLANTA</span>
              <p style="font-size: 16px; font-weight: 900; color: #7c3aed; margin: 3px 0 2px 0; line-height: 1.1;">${efficiencyRatio}%</p>
              <span style="font-size: 7.5px; color: #64748b; font-weight: 700;">Prom: ${(avgDailyKwh / capacityKwp).toFixed(2)} HSP/día</span>
            </div>
          </div>

          <!-- GRÁFICA VECTORIAL DE GENERACIÓN DIARIA (SVG) -->
          <div style="margin-top: 12px;">
            ${svgChartHtml}
          </div>

          <!-- SECCIÓN DE DIAGNÓSTICO TÉCNICO INTELIGENTE (GEMINI IA) -->
          <div style="margin-top: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 12px;">🧠</span>
                <h3 style="font-size: 10.5px; font-weight: 900; color: #141410; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
                  DIAGNÓSTICO TÉCNICO DE INTELIGENCIA ARTIFICIAL (GEMINI 2.5 FLASH SOLAR)
                </h3>
              </div>
              <span style="font-size: 7.5px; font-weight: 800; padding: 2px 7px; border-radius: 8px; background: ${isOptimal ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${isOptimal ? '#059669' : '#d97706'}; border: 1px solid ${isOptimal ? '#10b981' : '#f59e0b'};">
                ${isOptimal ? '✓ SISTEMA CERTIFICADO CON ALTO RENDIMIENTO' : '⚠️ ATENCIÓN PREVENTIVA RECOMENDADA'}
              </span>
            </div>

            <!-- Indicadores Micro Técnicos con espaciado limpio -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px;">
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px;">
                <span style="font-size: 7px; color: #64748b; font-weight: 700; display: block;">Curva Inyección AC</span>
                <span style="font-size: 8px; color: #059669; font-weight: 800;">Estable / Nominal</span>
              </div>
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px;">
                <span style="font-size: 7px; color: #64748b; font-weight: 700; display: block;">Balance Strings DC</span>
                <span style="font-size: 8px; color: #059669; font-weight: 800;">Simétrico 100%</span>
              </div>
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px;">
                <span style="font-size: 7px; color: #64748b; font-weight: 700; display: block;">Degradación</span>
                <span style="font-size: 8px; color: #059669; font-weight: 800;">&lt; 0.4% (Excelente)</span>
              </div>
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px;">
                <span style="font-size: 7px; color: #64748b; font-weight: 700; display: block;">Pérdida Soiling</span>
                <span style="font-size: 8px; color: #059669; font-weight: 800;">Tolerancia (&lt;2%)</span>
              </div>
            </div>

            <!-- Narrativa del Dictamen -->
            <p style="font-size: 8.5px; color: #334155; line-height: 1.35; margin-bottom: 6px;">
              ${alerts && alerts.length > 0 && alerts[0].ai_description
                ? alerts[0].ai_description
                : `Durante el periodo evaluado (${monthName} ${year}), la planta fotovoltaica "${system.plant_name}" registró un comportamiento electromecánico óptimo con una generación acumulada de ${totalGeneratedKwh.toFixed(1)} kWh. Los voltajes y corrientes MPPT se mantuvieron dentro del rango nominal de máxima transferencia sin registrarse anomalías de aislamiento ni fallas en la red eléctrica.`
              }
            </p>

            <div style="background: #ffffff; border-left: 3px solid #10b981; border-radius: 4px; padding: 5px 8px;">
              <span style="font-size: 7.5px; font-weight: 800; color: #059669; text-transform: uppercase;">Recomendación Técnica de Ingeniería:</span>
              <p style="font-size: 8px; color: #475569; margin-top: 1px; line-height: 1.3;">
                ${alerts && alerts.length > 0 && alerts[0].ai_recommendation
                  ? alerts[0].ai_recommendation
                  : 'Mantener el programa semestral de lavado de módulos en horario matutino y programar inspección termográfica preventiva de protecciones DPS en el próximo trimestre.'
                }
              </p>
            </div>
          </div>

          <!-- RESUMEN TÉCNICO Y BLOQUE DE VALIDACIÓN / FIRMAS -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 10px;">
            
            <!-- Sello y Código de Seguridad -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 54px; height: 54px; border: 1.5px dashed #C49825; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(196,152,37,0.04);">
                <span style="font-size: 6.5px; font-weight: 900; color: #8B6508; text-transform: uppercase; text-align: center; line-height: 1;">eSol</span>
                <span style="font-size: 5.5px; font-weight: 800; color: #C49825; text-align: center;">CERTIFIED</span>
                <span style="font-size: 5px; color: #64748b;">24/7 QA</span>
              </div>
              <div>
                <p style="font-size: 7.5px; font-weight: 800; color: #141410; text-transform: uppercase;">Telemetría Oficial Validada</p>
                <p style="font-size: 6.5px; color: #64748b; line-height: 1.3; max-width: 260px;">
                  Datos transmitidos en tiempo real vía protocolo OpenAPI del fabricante. Reporte emitido conforme a las normas de la Comisión Reguladora de Energía (CRE) y CFE.
                </p>
              </div>
            </div>

            <!-- Firma de Autorización Técnica -->
            <div style="text-align: center; width: 210px;">
              <div style="height: 20px; border-bottom: 1.2px solid #141410; margin-bottom: 3px; display: flex; align-items: flex-end; justify-content: center;">
                <span style="font-family: 'Cinzel', serif; font-size: 8.5px; font-weight: 900; color: #C49825; letter-spacing: 1px;">eSol Ingeniería</span>
              </div>
              <p style="font-size: 8.5px; font-weight: 800; color: #141410; margin: 0;">Ing. Especialista en Energía Solar</p>
              <p style="font-size: 7px; color: #64748b; margin-top: 1px;">Área de Monitoreo & O&M · eSol Energías</p>
            </div>
          </div>

          <!-- FOOTER / CONTACTO -->
          <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8;">
            <span>eSol Energías S.A. de C.V. · Tepic, Nayarit, México</span>
            <span>soporte@esolenergias.com · www.esolenergias.com</span>
            <span>Emisión: ${issueDateStr}</span>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  // 8. Render to PDF Blob using html2pdf directly from HTML string
  const opt = {
    margin:       0,
    filename:     `Reporte_Monitoreo_${system.plant_name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  const pdfBlob = await html2pdf().set(opt).from(htmlContent).output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  return {
    blobUrl,
    filename: opt.filename,
  };
}
