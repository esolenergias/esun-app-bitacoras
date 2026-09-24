import html2pdf from 'html2pdf.js';
import type { SolarProject, Proposal } from '../esunTypes';
import { generarFolioCentralizado } from '../../../utils/folioGenerator';
import { getSeasonalSolarMultiplier } from './solarConstants';

function numeroALetras(num: number): string {
  if (num === 0) return 'CERO PESOS 00/100 M.N.';
  const unidades = ['', 'UN ', 'DOS ', 'TRES ', 'CUATRO ', 'CINCO ', 'SEIS ', 'SIETE ', 'OCHO ', 'NUEVE '];
  const decenas = ['', 'DIEZ ', 'VEINTE ', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA '];
  const centenas = ['', 'CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ', 'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS '];
  const especiales = { 11: 'ONCE ', 12: 'DOCE ', 13: 'TRECE ', 14: 'CATORCE ', 15: 'QUINCE ', 16: 'DIECISEIS ', 17: 'DIECISIETE ', 18: 'DIECIOCHO ', 19: 'DIECINUEVE ', 21: 'VEINTIUN ', 22: 'VEINTIDOS ', 23: 'VEINTITRES ', 24: 'VEINTICUATRO ', 25: 'VEINTICINCO ', 26: 'VEINTISEIS ', 27: 'VEINTISIETE ', 28: 'VEINTIOCHO ', 29: 'VEINTINUEVE ' };

  function convertirGrupo(n: number): string {
    if (n === 100) return 'CIEN ';
    let output = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (c > 0) output += centenas[c];
    const du = n % 100;
    if (du > 0) {
      if (du >= 11 && du <= 29 && du !== 20) {
        output += especiales[du as keyof typeof especiales];
      } else {
        if (d > 0) output += decenas[d] + (d >= 3 && u > 0 ? 'Y ' : '');
        if (u > 0) output += unidades[u];
      }
    }
    return output;
  }

  const millones = Math.floor(num / 1000000);
  const miles = Math.floor((num % 1000000) / 1000);
  const restos = Math.floor(num % 1000);
  let texto = '';
  
  if (millones > 0) {
    if (millones === 1) texto += 'UN MILLON ';
    else texto += convertirGrupo(millones) + 'MILLONES ';
  }
  if (miles > 0) {
    if (miles === 1) texto += 'MIL ';
    else texto += convertirGrupo(miles) + 'MIL ';
  }
  if (restos > 0) {
    texto += convertirGrupo(restos);
  }

  const centavos = Math.round((num - Math.floor(num)) * 100);
  return `${texto.trim()} PESOS ${centavos.toString().padStart(2, '0')}/100 M.N.`;
}



export const buildPremiumPDF = async (project: SolarProject, proposal: Proposal, presupuestoItems: any[] = [], onComplete?: () => void) => {
  try {
    const isCredit = proposal.financialParams?.isCredit;
    const rate = proposal.financialParams?.interestRate || 15;
    const term = proposal.financialParams?.termMonths || 36;
    const inv = proposal.financial?.investment_mxn || 0;
    
    // Generar Folio
    const folio = generarFolioCentralizado('COT', project.client_name, proposal.id, proposal.created_at);
    // Generar Fecha de Emisión
    const fechaEmision = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    const r = (rate / 100) / 12;
    const monthlyCreditPayment = isCredit ? (r > 0 ? (inv * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1) : inv / term) : 0;
    const yr1Savings = proposal.financial?.annual_savings_yr1 || 0;

    const installedkWp = proposal.system?.installed_kWp || 0;
    const totalPanels = proposal.system?.num_panels || 0;
    const panelWp = proposal.system?.panel_Wp || 0;
    const breakdown = proposal.financial?.monthly_breakdown || [];
    const tablePeriods = breakdown.slice(0, 6); // Regla: máximo 6 periodos para diseño consistente
    
    // Recuperar cfe (necesario para mostrar la tarifa más abajo)
    const cfe = project.cfe_data || { historic_periods: [], bimonthly_kWh: 0, total_mxn: 0, tariff: '01', is_bimonthly: true };

    const isOffGrid = project.project_type === 'off-grid';
    
    let middleSectionHtml = '';
    
    if (isOffGrid) {
      // Off-Grid Layout
      const appliances = project.load_profile?.appliances || [];
      const totalKwh = appliances.reduce((sum: number, d: any) => sum + ((d.quantity * d.watts * d.hoursPerDay * ((d.daysPerWeek || 7) / 7)) / 1000), 0);
      
      const rowsHtml = appliances.slice(0, 6).map((d: any) => `
        <tr>
          <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">${d.quantity}</td>
          <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; color: #475569;">${d.name}</td>
          <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">${d.watts}W</td>
          <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">${d.hoursPerDay}h</td>
          <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #ef4444; font-weight: 600;">${((d.quantity * d.watts * d.hoursPerDay * ((d.daysPerWeek || 7) / 7)) / 1000).toFixed(2)}</td>
        </tr>
      `).join('');

      const dailyGen = proposal.financial?.daily_generation_kWh || 0;
      const dailyCons = (project.load_profile?.daily_Wh || 0) / 1000;
      const genW = dailyGen * 7;
      const consW = dailyCons * 7;
      const genM = dailyGen * 30;
      const consM = dailyCons * 30;

      const chartW = 200;
      const chartH = 140;
      const maxVal = Math.max(genM, consM, 10);
      
      const calcY = (val: number) => chartH - ((val / maxVal) * chartH) + 10;
      
      const x1 = 25, x2 = 100, x3 = 175;
      
      const consPoints = `${x1},${calcY(consW/7)} ${x2},${calcY(consW)} ${x3},${calcY(consM)}`;
      const genPoints = `${x1},${calcY(genW/7)} ${x2},${calcY(genW)} ${x3},${calcY(genM)}`;

      const svgChart = `
        <svg width="100%" height="100%" viewBox="0 0 200 180" preserveAspectRatio="none" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 180px;">
          <!-- Rejilla -->
          <line x1="0" y1="10" x2="200" y2="10" stroke="#e2e8f0" stroke-width="1" />
          <line x1="0" y1="${chartH/2 + 10}" x2="200" y2="${chartH/2 + 10}" stroke="#e2e8f0" stroke-width="1" />
          <line x1="0" y1="${chartH + 10}" x2="200" y2="${chartH + 10}" stroke="#cbd5e1" stroke-width="2" />
          
          <!-- Lineas -->
          <polyline fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${consPoints}" />
          <polyline fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${genPoints}" />
          
          <!-- Puntos -->
          <circle cx="${x1}" cy="${calcY(consW/7)}" r="4" fill="#ef4444" />
          <circle cx="${x2}" cy="${calcY(consW)}" r="4" fill="#ef4444" />
          <circle cx="${x3}" cy="${calcY(consM)}" r="4" fill="#ef4444" />
          
          <circle cx="${x1}" cy="${calcY(genW/7)}" r="4" fill="#10b981" />
          <circle cx="${x2}" cy="${calcY(genW)}" r="4" fill="#10b981" />
          <circle cx="${x3}" cy="${calcY(genM)}" r="4" fill="#10b981" />
          
          <!-- Etiquetas X -->
          <text x="${x1}" y="${chartH + 25}" font-size="9" fill="#64748b" text-anchor="middle" font-weight="600">Día</text>
          <text x="${x2}" y="${chartH + 25}" font-size="9" fill="#64748b" text-anchor="middle" font-weight="600">Semana</text>
          <text x="${x3}" y="${chartH + 25}" font-size="9" fill="#64748b" text-anchor="middle" font-weight="600">Mes</text>

          <!-- Leyenda -->
          <rect x="15" y="${chartH + 40}" width="10" height="10" fill="#ef4444" rx="2" />
          <text x="30" y="${chartH + 48}" font-size="8" fill="#475569" font-weight="bold">Consumo</text>
          <rect x="90" y="${chartH + 40}" width="10" height="10" fill="#10b981" rx="2" />
          <text x="105" y="${chartH + 48}" font-size="8" fill="#475569" font-weight="bold">Generación</text>
        </svg>
      `;

      middleSectionHtml = `
          <!-- Fila Central (Consumos, Proyección, Gráfica en 3 columnas) -->
          <div style="display: flex; gap: 16px; margin-bottom: 32px; height: 210px;">
            <!-- Columna 1 (Datos de Consumo) -->
            <div style="flex: 1.2; display: flex; flex-direction: column;">
              <h3 style="font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 12px 0; border-left: 4px solid #C49825; padding-left: 8px;">Datos de Consumo</h3>
              <table style="width: 100%; font-size: 8.5px; border-collapse: collapse; height: 100%;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 4px; text-align: left; font-weight: 700; color: #475569; text-transform: uppercase;">Cant.</th>
                    <th style="padding: 4px; text-align: left; font-weight: 700; color: #475569; text-transform: uppercase;">Aparato</th>
                    <th style="padding: 4px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">W</th>
                    <th style="padding: 4px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">Hrs</th>
                    <th style="padding: 4px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">kWh/D</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1;">
                    <td colspan="4" style="padding: 4px; color: #0f172a;">TOTAL ESTIMADO DIARIO</td>
                    <td style="padding: 4px; text-align: right; color: #ef4444;">${totalKwh.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Columna 2 (Tabla Proyección) -->
            <div style="flex: 0.9; display: flex; flex-direction: column;">
              <h3 style="font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 12px 0; border-left: 4px solid #C49825; padding-left: 8px;">Proyección de Energía</h3>
              <table style="width: 100%; font-size: 9px; border-collapse: collapse; height: 100%;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 6px; text-align: left; font-weight: 700; color: #475569; text-transform: uppercase;">Periodo</th>
                    <th style="padding: 6px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">Consumo</th>
                    <th style="padding: 6px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">Generación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Diario</td>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #ef4444;">${(consW / 7).toFixed(2)}</td>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #10b981; font-weight: 600;">${(genW / 7).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Semanal</td>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #ef4444;">${consW.toFixed(2)}</td>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #10b981; font-weight: 600;">${genW.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Mensual</td>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #ef4444;">${consM.toFixed(2)}</td>
                    <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #10b981; font-weight: 600;">${genM.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Columna 3 (Gráfica) -->
            <div style="flex: 0.9; display: flex; flex-direction: column;">
              <h3 style="font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 12px 0; border-left: 4px solid #C49825; padding-left: 8px;">Proyección Visual</h3>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                ${svgChart}
              </div>
            </div>
          </div>
      `;

    } else {
      // Grid-Tied Layout
      const totalConsumo = Math.round(tablePeriods.reduce((sum: number, r: any) => sum + (r.kwh || 0), 0));
      const totalPago = Math.round(tablePeriods.reduce((sum: number, r: any) => sum + (r.original_mxn || 0), 0));
      const totalNuevo = Math.round(tablePeriods.reduce((sum: number, r: any) => sum + (r.new_mxn || 0), 0));
      const totalAhorro = Math.round(tablePeriods.reduce((sum: number, r: any) => sum + (r.savings_mxn || 0), 0));

      const rowsHtml = tablePeriods.map((row: any) => {
        return `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">${row.month || ''}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">${Math.round(row.kwh || 0).toLocaleString('es-MX')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #ef4444;">$${Math.round(row.original_mxn || 0).toLocaleString('es-MX')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #10b981; font-weight: 600;">$${Math.round(row.new_mxn || 0).toLocaleString('es-MX')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #f59e0b; font-weight: 600;">$${Math.round(row.savings_mxn || 0).toLocaleString('es-MX')}</td>
        </tr>
        `;
      }).join('');

      const chartPeriods = [...tablePeriods].reverse();
      const basePeriodGenKwh = (proposal.system?.annual_production_kWh || 0) / (cfe.is_bimonthly ? 6 : 12);
      
      const rawPoints = chartPeriods.map((p: any, i: number) => {
        const periodStr = p.month || p.period || '';
        const seasonalMultiplier = getSeasonalSolarMultiplier(periodStr, i);
        const periodGenKwh = Math.round(basePeriodGenKwh * seasonalMultiplier);
        return {
          month: periodStr.substring(0, 3).toUpperCase(),
          kwh: p.kwh || 0,
          genKwh: periodGenKwh,
          periodStr
        };
      });

      const rawMaxK = Math.max(
        ...rawPoints.map(d => d.kwh),
        ...rawPoints.map(d => d.genKwh),
        100
      );
      const maxK = rawMaxK * 1.25; // 25% de margen superior para evitar cualquier traslape con la leyenda
      
      const svgWidth = 420;
      const svgHeight = 210;
      const paddingLeft = 28;
      const paddingRight = 28;
      const plotWidth = svgWidth - paddingLeft - paddingRight;
      const plotTop = 50; // Espacio superior protegido para la leyenda
      const plotBottom = 165; // Línea base para datos
      const plotHeight = plotBottom - plotTop;
      
      const xStep = plotWidth / Math.max(1, rawPoints.length - 1);

      const pointsData = rawPoints.map((d, i) => {
        const x = paddingLeft + (i * xStep);
        const yActual = plotBottom - ((d.kwh / maxK) * plotHeight);
        const yGen = plotBottom - ((d.genKwh / maxK) * plotHeight);
        const yPaneles = plotBottom - 3;
        
        // Prevención inteligente de colisión de etiquetas si consumo y generación están muy cerca
        const isClose = Math.abs(yActual - yGen) < 14;
        const actualLabelY = isClose ? (yActual < yGen ? yActual - 7 : yActual + 11) : yActual - 7;
        const genLabelY = isClose ? (yGen < yActual ? yGen - 7 : yGen + 11) : yGen - 7;

        return { 
          ...d,
          x, 
          yActual, 
          yGen, 
          yPaneles, 
          actualLabelY, 
          genLabelY 
        };
      });

      const currentPoints = pointsData.map(d => `${d.x},${d.yActual}`).join(' ');
      const genPoints = pointsData.map(d => `${d.x},${d.yGen}`).join(' ');
      const newPoints = pointsData.map(d => `${d.x},${d.yPaneles}`).join(' ');
      
      const svgChart = `
        <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 210px;">
          <defs>
            <linearGradient id="redAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ef4444" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#ef4444" stop-opacity="0.01" />
            </linearGradient>
            <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.01" />
            </linearGradient>
          </defs>

          <!-- ENCABEZADO / LEYENDA (Espacio Protegido y Separado en 3 Columnas) -->
          <rect x="0" y="0" width="${svgWidth}" height="38" fill="#f1f5f9" rx="8" />
          <line x1="0" y1="38" x2="${svgWidth}" y2="38" stroke="#e2e8f0" stroke-width="1" />
          
          <rect x="16" y="14" width="10" height="10" fill="#ef4444" rx="2" />
          <text x="30" y="23" font-size="9" fill="#334155" font-weight="700">Consumo CFE</text>
          
          <rect x="140" y="14" width="10" height="10" fill="#f59e0b" rx="2" />
          <text x="154" y="23" font-size="9" fill="#334155" font-weight="700">Generación Solar</text>

          <rect x="275" y="14" width="10" height="10" fill="#10b981" rx="2" />
          <text x="289" y="23" font-size="9" fill="#334155" font-weight="700">Con Paneles Solares</text>

          <!-- LÍNEAS GUÍA HORIZONTALES (Eje Y) -->
          <line x1="${paddingLeft}" y1="${plotTop}" x2="${svgWidth - paddingRight}" y2="${plotTop}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
          <line x1="${paddingLeft}" y1="${plotTop + plotHeight / 2}" x2="${svgWidth - paddingRight}" y2="${plotTop + plotHeight / 2}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
          <line x1="${paddingLeft}" y1="${plotBottom}" x2="${svgWidth - paddingRight}" y2="${plotBottom}" stroke="#94a3b8" stroke-width="1.5" />

          <!-- LÍNEAS GUÍA PARALELAS EN X (Eje X en cada dato de consumo) -->
          ${pointsData.map(d => `<line x1="${d.x}" y1="${plotTop - 4}" x2="${d.x}" y2="${plotBottom}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2" />`).join('')}

          <!-- LÍNEAS DE DATOS -->
          <!-- 1. Generación Solar Proyectada (Amarillo) -->
          <polyline fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${genPoints}" />

          <!-- 2. Consumo Histórico CFE (Rojo) -->
          <polyline fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${currentPoints}" />

          <!-- 3. Nuevo Consumo Remanente (Verde) -->
          <polyline fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${newPoints}" />

          <!-- PUNTOS Y ETIQUETAS DE CONSUMO (kWh) -->
          ${pointsData.map(d => `
            <!-- Punto Verde Paneles -->
            <circle cx="${d.x}" cy="${d.yPaneles}" r="3" fill="#10b981" stroke="#ffffff" stroke-width="1" />

            <!-- Punto Amarillo Generación Solar -->
            <circle cx="${d.x}" cy="${d.yGen}" r="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />
            <text x="${d.x}" y="${d.genLabelY}" font-size="8" fill="#d97706" font-weight="800" text-anchor="middle">${d.genKwh}</text>

            <!-- Punto Rojo Consumo CFE -->
            <circle cx="${d.x}" cy="${d.yActual}" r="4" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
            <text x="${d.x}" y="${d.actualLabelY}" font-size="8" fill="#dc2626" font-weight="800" text-anchor="middle">${Math.round(d.kwh)}</text>
          `).join('')}

          <!-- ETIQUETAS DEL EJE X (Meses / Periodos) -->
          ${pointsData.map(d => `
            <text x="${d.x}" y="${plotBottom + 16}" font-size="9" fill="#475569" text-anchor="middle" font-weight="700">${d.month}</text>
            <text x="${d.x}" y="${plotBottom + 26}" font-size="7" fill="#94a3b8" text-anchor="middle">kWh</text>
          `).join('')}
        </svg>
      `;

      middleSectionHtml = `
          <!-- Fila Central (Consumos y Gráfica) -->
          <div style="display: flex; gap: 32px; margin-bottom: 32px;">
            <!-- Columna Izquierda (Análisis de Consumo) -->
            <div style="flex: 1; display: flex; flex-direction: column;">
              <h3 style="font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 12px 0; border-left: 4px solid #C49825; padding-left: 8px;">Análisis de Consumo</h3>
              <table style="width: 100%; font-size: 10px; border-collapse: collapse; height: 100%;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 8px; text-align: left; font-weight: 700; color: #475569; text-transform: uppercase;">Periodo</th>
                    <th style="padding: 8px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">kWh</th>
                    <th style="padding: 8px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">Actual</th>
                    <th style="padding: 8px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">Nuevo</th>
                    <th style="padding: 8px; text-align: right; font-weight: 700; color: #475569; text-transform: uppercase;">Ahorro</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1;">
                    <td style="padding: 8px; color: #0f172a;">TOTAL</td>
                    <td style="padding: 8px; text-align: right; color: #0f172a;">${totalConsumo.toLocaleString('es-MX')}</td>
                    <td style="padding: 8px; text-align: right; color: #ef4444;">$${totalPago.toLocaleString('es-MX')}</td>
                    <td style="padding: 8px; text-align: right; color: #10b981;">$${totalNuevo.toLocaleString('es-MX')}</td>
                    <td style="padding: 8px; text-align: right; color: #f59e0b;">$${totalAhorro.toLocaleString('es-MX')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Columna Derecha (Proyección Visual) -->
            <div style="flex: 1; display: flex; flex-direction: column;">
              <h3 style="font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 12px 0; border-left: 4px solid #C49825; padding-left: 8px;">Proyección Visual</h3>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                ${svgChart}
              </div>
            </div>
          </div>
      `;
    }

    // Presupuesto
    let budgetRows = '';
    
    if (presupuestoItems && presupuestoItems.length > 0) {
      budgetRows = presupuestoItems.map((c, index, arr) => {
        if (c.type === 'category') {
          return `
            <tr>
              <td colspan="4" style="background: #f1f5f9; padding: 2px; font-weight: 800; color: #1e293b; text-transform: uppercase;">${c.description}</td>
            </tr>
          `;
        }
        if (c.type === 'discount') return ''; // Ocultar descuentos si no se quieren mostrar

        // Mapeo unificado para BD (c.matriz) y Local (c.concepto_name)
        const category = c.concepto_name || c.matriz?.subcategory || 'Concepto ESOL';
        const code = c.code || c.matriz?.code || '';
        const longDesc = c.description || c.matriz?.description || 'Suministro e instalación';
        const unit = c.unit || c.matriz?.unit || 'pza';

        let radiusStyle = '';
        if (index === 0) radiusStyle += 'border-top-left-radius: 8px; border-top-right-radius: 8px; ';
        if (index === arr.length - 1) radiusStyle += 'border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; ';

        // Elemento normal (4 columnas)
        return `
          <tr>
            <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #334155;">${Number(c.quantity).toFixed(0)}</td>
            <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${unit}</td>
            <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">
              <div style="color: #C49825;">${category}</div>
              ${code ? `<div style="font-size: 8px; color: #94a3b8; font-family: monospace; margin-top: 2px;">${code}</div>` : ''}
            </td>
            <td style="padding: 4px 8px; border-bottom: 1px solid #cbd5e1; background-color: #cbd5e1; color: #1e293b; font-size: 8.5px; line-height: 1.2; vertical-align: middle; ${radiusStyle}">
              ${longDesc}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      // Fallback
      budgetRows = `
        <tr>
          <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #334155;">${totalPanels}</td>
          <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">pza</td>
          <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #C49825;">Paneles Solares</td>
          <td style="padding: 4px 8px; border-bottom: 1px solid #cbd5e1; background-color: #cbd5e1; color: #1e293b; font-size: 8.5px; line-height: 1.2; vertical-align: middle; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            ${proposal.system?.panel_name || `Módulo Solar de ${panelWp}W`}
          </td>
        </tr>
        <tr>
          <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #334155;">${proposal.system?.num_inverters || 1}</td>
          <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">pza</td>
          <td style="padding: 3px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #C49825;">Inversor(es)</td>
          <td style="padding: 4px 8px; border-bottom: 1px solid #cbd5e1; background-color: #cbd5e1; color: #1e293b; font-size: 8.5px; line-height: 1.2; vertical-align: middle; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
            ${proposal.system?.inverter_name || 'Inversor Interconectado'}
          </td>
        </tr>
      `;
    }

    const htmlString = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
      </style>
      <div style="width: 816px; height: 1056px; background-color: #ffffff; color: #0f172a; font-family: 'Montserrat', sans-serif; position: relative; display: flex; flex-direction: column; box-sizing: border-box;">
        
        <!-- Franja superior de diseño (Listón Dorado Metálico Premium) -->
        <div style="width: 100%; height: 48px; background: linear-gradient(90deg, #8B6508 0%, #C49825 20%, #FEE180 50%, #C49825 80%, #8B6508 100%); border-bottom: 3px solid #1e293b; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); z-index: 50;"></div>
        
        <div style="padding: 32px 48px 40px 48px; flex: 1; display: flex; flex-direction: column;">
          
          <!-- Encabezado Profesional -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
            <div>
              <img src="${window.location.origin}/Logo_esol_b.png" alt="Esol Energías" style="height: 48px;" />
            </div>
            <div style="text-align: right;">
              <h1 style="font-size: 20px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Propuesta Económica</h1>
              <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0; font-weight: 600;">Folio: <span style="color: #0f172a;">${folio}</span></p>
            </div>
          </div>

          <!-- Línea Dorada 1px -->
          <div style="width: 100%; border-top: 1px solid #C49825; margin-bottom: 12px;"></div>

          <!-- Resumen del Cliente -->
          <div style="display: flex; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 24px; margin-bottom: 24px; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase;">${project.client_name}</p>
              <p style="font-size: 12px; color: #475569; margin: 2px 0 0 0;">${project.city || 'Tepic, Nayarit'} • Tarifa: <strong style="color: #1e293b;">${cfe.tariff}</strong></p>
            </div>
            <div style="text-align: right; border-left: 2px solid #e2e8f0; padding-left: 24px;">
              <p style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0; letter-spacing: 0.5px;">Capacidad del Sistema</p>
              <p style="font-size: 18px; font-weight: 800; color: #C49825; margin: 0;">${installedkWp.toFixed(2)} kWp</p>
            </div>
          </div>

          ${middleSectionHtml}

          <!-- Conceptos del Proyecto a todo el ancho -->
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 12px 0; border-left: 4px solid #C49825; padding-left: 8px;">Conceptos del Proyecto</h3>
            <table style="width: 100%; font-size: 10px; border-collapse: separate; border-spacing: 0;">
              <thead>
                <tr>
                  <th style="background: #f1f5f9; padding: 2px; text-align: center; font-weight: 700; color: #475569; width: 40px; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Cant.</th>
                  <th style="background: #f1f5f9; padding: 2px; text-align: center; font-weight: 700; color: #475569; width: 50px;">Unidad</th>
                  <th style="background: #f1f5f9; padding: 2px; text-align: left; font-weight: 700; color: #475569; width: 140px;">Concepto / Código</th>
                  <th style="background: #f1f5f9; padding: 2px; text-align: left; font-weight: 700; color: #475569; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Descripción</th>
                </tr>
              </thead>
              <tbody>
                ${budgetRows}
              </tbody>
            </table>
          </div>

          <!-- Bloque Medio: Firmas e Inversión -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            
            <!-- Columna Izquierda: Firmas (alineadas al fondo) -->
            <div style="display: flex; gap: 32px; padding-bottom: 4px;">
              <!-- Firma Cliente -->
              <div style="text-align: center; width: 160px;">
                <hr style="border: none; border-top: 1px solid #0f172a; margin: 0 0 4px 0; width: 100%;" />
                <p style="font-size: 10px; font-weight: 700; color: #0f172a; margin: 0;">Firma de Aceptación</p>
                <p style="font-size: 9px; color: #64748b; margin: 2px 0 0 0;">${project.client_name || 'Cliente'}</p>
              </div>
              <!-- Firma Esol -->
              <div style="text-align: center; width: 160px;">
                <hr style="border: none; border-top: 1px solid #0f172a; margin: 0 0 4px 0; width: 100%;" />
                <p style="font-size: 10px; font-weight: 700; color: #0f172a; margin: 0;">Autorización</p>
                <p style="font-size: 9px; color: #64748b; margin: 2px 0 0 0;">Esol Energías</p>
              </div>
            </div>

            <!-- Columna Derecha: Inversión -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 360px;">
              <p style="font-size: 13px; color: #C49825; font-weight: 900; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 0.5px; text-align: center;">INVERSIÓN TOTAL LLAVE EN MANO</p>
              <div style="background: #0f172a; color: #ffffff; border-radius: 12px; padding: 12px 24px; border: 2px solid #C49825; position: relative; overflow: hidden; width: 100%; box-sizing: border-box; text-align: center;">
                <div style="position: absolute; top: -50px; left: -50px; width: 100px; height: 100px; background: #C49825; opacity: 0.2; border-radius: 50%; filter: blur(20px);"></div>
                <div style="position: relative; z-index: 10;">
                  <p style="font-size: 30px; font-weight: 900; color: #ffffff; margin: 0 0 4px 0; line-height: 1; letter-spacing: 1px;">
                    $${Math.round(inv).toLocaleString('es-MX')}
                  </p>
                  <p style="font-size: 9px; color: #e2e8f0; font-weight: 600; margin: 0 0 2px 0; text-transform: uppercase;">(${numeroALetras(Math.round(inv))})</p>
                  <p style="font-size: 8px; color: #94a3b8; margin: 0;">(I.V.A. no incluido)</p>
                </div>
              </div>
            </div>

          </div>

          <!-- Notas Importantes (Full width at bottom) -->
          <div style="margin-top: auto; padding-top: 12px; margin-bottom: 38px; font-size: 9px; color: #64748b; line-height: 1.4; border-top: 2px solid #e2e8f0; width: 100%;">
            <p style="font-weight: 800; color: #475569; margin: 0 0 2px 0; text-transform: uppercase;">Notas Importantes</p>
            <p style="margin: 0;">• Cotización válida por 7 días naturales a partir del <strong>${fechaEmision}</strong>. Precios sujetos a cambios sin previo aviso.</p>
            <p style="margin: 0;">• ${isOffGrid ? 'La proyección de generación es una estimación técnica basada en radiación solar histórica y puede variar.' : 'El análisis de ahorro es una estimación técnica basada en el historial de consumos y puede variar.'}</p>
            <p style="margin: 0;">• Equipos con certificaciones internacionales y garantía extendida directa (Paneles 25 años).</p>
          </div>

        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlString;

    const opt = {
      margin:       0,
      filename:     `Propuesta_Económica_${project.client_name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
    onComplete();

  } catch (err) {
    console.error("Error al construir PDF para Impresión:", err);
    alert("Ocurrió un error al generar la Propuesta. Por favor intenta de nuevo.");
    onComplete();
  }
};
