import html2pdf from 'html2pdf.js';
import type { SolarProject, Proposal } from '../esunTypes';

export const generateProposalPDF = (project: SolarProject, proposal: Proposal, onComplete: () => void) => {
  const element = document.createElement('div');
  element.style.padding = "24px";
  element.style.color = "#1e293b";
  element.style.backgroundColor = "#ffffff";
  element.style.fontFamily = "sans-serif";
  
  const isCredit = proposal.financialParams?.isCredit;
  const rate = proposal.financialParams?.interestRate || 15;
  const term = proposal.financialParams?.termMonths || 36;
  const inv = proposal.financial?.investment_mxn || 0;
  const r = (rate / 100) / 12;
  const monthlyCreditPayment = isCredit ? (r > 0 ? (inv * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1) : inv / term) : 0;
  
  element.innerHTML = `
    <div style="border-bottom: 2px solid #C49825; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="color: #C49825; font-size: 24px; font-weight: 800; margin: 0;">eSol Energías</h1>
        <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Propuesta de Sistema Solar Fotovoltaico — ${proposal.name}</p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 11px; font-weight: bold; color: #0f172a; margin: 0;">Fecha: ${new Date().toLocaleDateString('es-MX')}</p>
        <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Servicio: ${project.cfe_data?.service_number || 'N/A'}</p>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Datos del Cliente</h2>
      <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Cliente:</span> ${project.client_name}</td>
          <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Consumo Bimestral:</span> ${project.cfe_data?.bimonthly_kWh} kWh</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Tarifa CFE:</span> ${project.cfe_data?.tariff}</td>
          <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Pago Promedio CFE:</span> $${project.cfe_data?.total_mxn?.toLocaleString('es-MX')} MXN</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Propuesta Técnica del Sistema</h2>
      <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Capacidad Instalada:</span> ${proposal.system?.installed_kWp?.toFixed(2)} kWp</td>
          <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Arreglo Eléctrico:</span> ${proposal.system?.num_strings} strings de ${proposal.system?.panels_per_string} paneles</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Cantidad de Paneles:</span> ${proposal.system?.num_panels} módulos de ${proposal.system?.panel_Wp}W</td>
          <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Producción Anual Estimada:</span> ${Math.round(proposal.system?.annual_production_kWh || 0)?.toLocaleString('es-MX')} kWh</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Análisis Financiero y Retorno</h2>
      <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Inversión Total:</span> $${proposal.financial?.investment_mxn?.toLocaleString('es-MX')} MXN</td>
          <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Valor Presente Neto (NPV):</span> $${proposal.financial?.npv?.toLocaleString('es-MX')} MXN</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Ahorro Año 1:</span> $${proposal.financial?.annual_savings_yr1?.toLocaleString('es-MX')} MXN</td>
          <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">ROI 25 años:</span> ${proposal.financial?.roi_pct?.toFixed(0)}%</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Período de Retorno:</span> ${proposal.financial?.payback_years?.toFixed(1)} años</td>
          <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Esquema:</span> ${isCredit ? `Crédito (${term} meses, Tasa ${rate}%)` : 'Contado'}</td>
        </tr>
      </table>
      ${isCredit ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #C49825; padding: 12px; border-radius: 8px; font-size: 10px;">
        <p style="margin: 0; font-weight: bold; color: #0f172a;">Detalles del Financiamiento:</p>
        <p style="margin: 4px 0 0 0; color: #334155;">Mensualidad del Crédito: <strong>$${Math.round(monthlyCreditPayment).toLocaleString('es-MX')} MXN</strong>. El ahorro neto anual ya deduce el costo del crédito.</p>
      </div>
      ` : ''}
    </div>

    <div style="border-top: 1px solid #cbd5e1; padding-top: 12px; text-align: center; font-size: 9px; color: #64748b; margin-top: 32px;">
      <p style="margin: 0;">Este documento es una estimación del dimensionamiento técnico preliminar. eSol Energías Renovables es responsable de la ejecución técnica definitiva.</p>
      <p style="margin: 2px 0 0 0; font-weight: bold; color: #C49825;">eSol Energías Renovables — Hermosillo, Sonora</p>
    </div>
  `;

  const opt = {
    margin:       15,
    filename:     `Propuesta_${proposal.name.replace(/\s+/g, '_')}_${project.client_name.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().from(element).set(opt).save()
    .then(onComplete)
    .catch((err: any) => {
      console.error("Error al exportar PDF:", err);
      onComplete();
    });
};
