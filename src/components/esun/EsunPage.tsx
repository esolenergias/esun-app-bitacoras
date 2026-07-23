import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import CFEUploader from './CFEUploader';
import CFEDataForm from './CFEDataForm';
import SystemProposal from './SystemProposal';
import FinancialAnalysis from './FinancialAnalysis';
import EnvironmentalImpact from './EnvironmentalImpact';
import { calculateFinancials } from './lib/financialEngine';
import { SOLAR_CONSTANTS } from './lib/solarConstants';
import html2pdf from 'html2pdf.js';
import { supabase } from '../../context/supabase';

export default function EsunPage() {
  const [view, setView] = useState<'upload' | 'form' | 'results' | 'export'>('upload');
  const [cfeData, setCfeData] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [financialParams, setFinancialParams] = useState<any>({
    isCredit: false,
    interestRate: 15,
    termMonths: 36,
    manualCost: undefined
  });

  // Load quotes from localStorage
  const loadQuotes = () => {
    try {
      const stored = localStorage.getItem('esun_quotes');
      if (stored) {
        setQuotes(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading quotes:", e);
    }
  };

  useEffect(() => {
    loadQuotes();
    
    // Check if we were redirected here to edit a specific quote
    setTimeout(() => {
      const targetId = localStorage.getItem('esun_target_quote_id');
      if (targetId) {
        const stored = localStorage.getItem('esun_quotes');
        if (stored) {
          try {
            const qs = JSON.parse(stored);
            const q = qs.find((x: any) => x.id === targetId);
            if (q) {
              loadQuote(q);
            }
          } catch(e) {}
        }
        localStorage.removeItem('esun_target_quote_id');
      }
    }, 100);
  }, []);

  const saveQuote = useCallback((cfe: any, sys: any, finParams: any) => {
    if (!cfe || !sys) return;
    
    const finResult = calculateFinancials({
      system_kWp: sys.system_kWp,
      installed_kWp: sys.installed_kWp,
      annual_production_kWh: sys.annual_production_kWh,
      monthly_consumption_kWh: cfe.monthly_kWh,
      tariff_rate_mxn: cfe.tariff_rate,
      custom_cost: finParams.manualCost, // Pass manual cost override
    });

    const totalProduction25yr = sys.annual_production_kWh * SOLAR_CONSTANTS.SYSTEM_LIFE;
    const co2SavedKg = totalProduction25yr * SOLAR_CONSTANTS.CO2_FACTOR;

    const quoteId = currentQuoteId || Math.random().toString(36).substring(2, 9);
    
    const newQuote = {
      id: quoteId,
      created_at: new Date().toISOString(),
      client_name: cfe.client_name || 'Sin Nombre',
      city: sys.city,
      cfe_data: cfe,
      system: sys,
      financialParams: finParams, // Persist overrides
      financial: finResult,
      environmental: {
        co2_kg_25yr: co2SavedKg,
        trees_25yr: co2SavedKg / SOLAR_CONSTANTS.CO2_PER_TREE_KG,
        cars_25yr: (co2SavedKg / 1000) / SOLAR_CONSTANTS.CO2_PER_CAR_TONS,
        coal_ton_25yr: (co2SavedKg / 1000) / SOLAR_CONSTANTS.CO2_PER_COAL_TON,
      },
      status: 'draft'
    };

    const existingQuotes = JSON.parse(localStorage.getItem('esun_quotes') || '[]');
    const index = existingQuotes.findIndex((q: any) => q.id === newQuote.id);
    if (index !== -1) {
      existingQuotes[index] = newQuote;
    } else {
      existingQuotes.push(newQuote);
    }
    localStorage.setItem('esun_quotes', JSON.stringify(existingQuotes));
    setCurrentQuoteId(newQuote.id);
    setQuotes(existingQuotes);

    // Auto-create client in CRM if they have a name
    if (newQuote.client_name && newQuote.client_name !== 'Sin Nombre') {
      supabase
        .from('clientes')
        .select('id')
        .ilike('nombre_razon_social', newQuote.client_name)
        .limit(1)
        .then(({ data: existingClients }) => {
          if (!existingClients || existingClients.length === 0) {
            supabase.from('clientes').insert({
              nombre_razon_social: newQuote.client_name,
              origen: 'Esun Solar',
              estatus: 'Prospecto'
            }).then(() => {
              console.log('Cliente automático creado en CRM desde Esun Solar');
            }).catch(e => console.error('Error creando cliente:', e));
          }
        })
        .catch(e => console.error('Error verificando cliente:', e));
    }
  }, [currentQuoteId]);

  // Auto-save quote in results view when system or cfeData updates
  useEffect(() => {
    if (view === 'results' && cfeData && system) {
      saveQuote(cfeData, system, financialParams);
    }
  }, [view, cfeData, system, financialParams, saveQuote]);

  const loadQuote = (quote: any) => {
    setCurrentQuoteId(quote.id);
    setCfeData(quote.cfe_data);
    setSystem(quote.system);
    setFinancialParams(quote.financialParams || {
      isCredit: false,
      interestRate: 15,
      termMonths: 36,
      manualCost: undefined
    });
    setView('results');
  };

  const deleteQuote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = quotes.filter((q) => q.id !== id);
    localStorage.setItem('esun_quotes', JSON.stringify(updated));
    setQuotes(updated);
    if (currentQuoteId === id) {
      handleReset();
    }
  };

  const handleReset = () => {
    setView('upload');
    setCfeData(null);
    setSystem(null);
    setCurrentQuoteId(null);
    setFinancialParams({
      isCredit: false,
      interestRate: 15,
      termMonths: 36,
      manualCost: undefined
    });
  };

  const handleTriggerExport = () => {
    setView('export');
    
    // Retrieve quote data
    const quoteData = quotes.find(q => q.id === currentQuoteId) || {
      client_name: cfeData?.client_name || 'Sin Nombre',
      city: system?.city || 'CDMX',
      system: system,
      cfe_data: cfeData,
      financial: calculateFinancials({
        system_kWp: system?.system_kWp,
        installed_kWp: system?.installed_kWp,
        annual_production_kWh: system?.annual_production_kWh,
        monthly_consumption_kWh: cfeData?.monthly_kWh,
        tariff_rate_mxn: cfeData?.tariff_rate,
        custom_cost: financialParams.manualCost,
      }),
      financialParams: financialParams
    };

    // Create the container element for printing
    const element = document.createElement('div');
    element.style.padding = "24px";
    element.style.color = "#1e293b";
    element.style.backgroundColor = "#ffffff";
    element.style.fontFamily = "sans-serif";
    
    const isCredit = quoteData.financialParams?.isCredit;
    const rate = quoteData.financialParams?.interestRate || 15;
    const term = quoteData.financialParams?.termMonths || 36;
    const inv = quoteData.financial?.investment_mxn || 0;
    const r = (rate / 100) / 12;
    const monthlyCreditPayment = isCredit ? (r > 0 ? (inv * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1) : inv / term) : 0;
    
    element.innerHTML = `
      <div style="border-bottom: 2px solid #C49825; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="color: #C49825; font-size: 24px; font-weight: 800; margin: 0;">eSol Energías</h1>
          <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Propuesta de Sistema Solar Fotovoltaico — Esun</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 11px; font-weight: bold; color: #0f172a; margin: 0;">Fecha: ${new Date().toLocaleDateString('es-MX')}</p>
          <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Servicio: ${quoteData.cfe_data?.service_number || 'N/A'}</p>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; tracking: 0.05em;">Datos del Cliente</h2>
        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Cliente:</span> ${quoteData.client_name}</td>
            <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Consumo Bimestral:</span> ${quoteData.cfe_data?.bimonthly_kWh} kWh</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Tarifa CFE:</span> ${quoteData.cfe_data?.tariff}</td>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Pago Promedio CFE:</span> $${quoteData.cfe_data?.total_mxn?.toLocaleString('es-MX')} MXN</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Ciudad:</span> ${quoteData.city}</td>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Costo promedio/kWh:</span> $${quoteData.cfe_data?.tariff_rate?.toFixed(2)} MXN</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; tracking: 0.05em;">Propuesta Técnica del Sistema</h2>
        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Capacidad Instalada:</span> ${quoteData.system?.installed_kWp?.toFixed(2)} kWp</td>
            <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Arreglo Eléctrico:</span> ${quoteData.system?.num_strings} strings de ${quoteData.system?.panels_per_string} paneles</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Cantidad de Paneles:</span> ${quoteData.system?.num_panels} módulos de ${quoteData.system?.panel_Wp}W</td>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Voltaje de String Voc:</span> ${quoteData.system?.string_Voc?.toFixed(1)} VDC (${quoteData.system?.is_electrical_safe ? 'Eléctricamente Seguro' : 'Excede límites'})</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Superficie Techo:</span> ${quoteData.system?.area_m2?.toFixed(1)} m²</td>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Producción Anual Estimada:</span> ${Math.round(quoteData.system?.annual_production_kWh || 0)?.toLocaleString('es-MX')} kWh</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; tracking: 0.05em;">Análisis Financiero y Retorno</h2>
        <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Inversión Total:</span> $${quoteData.financial?.investment_mxn?.toLocaleString('es-MX')} MXN</td>
            <td style="padding: 4px 0; width: 50%;"><span style="font-weight: bold; color: #475569;">Valor Presente Neto (NPV):</span> $${quoteData.financial?.npv?.toLocaleString('es-MX')} MXN</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Ahorro Año 1:</span> $${quoteData.financial?.annual_savings_yr1?.toLocaleString('es-MX')} MXN</td>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">ROI 25 años:</span> ${quoteData.financial?.roi_pct?.toFixed(0)}%</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><span style="font-weight: bold; color: #475569;">Período de Retorno:</span> ${quoteData.financial?.payback_years?.toFixed(1)} años</td>
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

      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; tracking: 0.05em;">Proyección de Ahorro Acumulado</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 6px; width: 10%;">Año</th>
              <th style="padding: 6px; width: 22.5%;">Ahorro Anual</th>
              <th style="padding: 6px; width: 22.5%;">Pago Sin Solar (6% Inf)</th>
              <th style="padding: 6px; width: 22.5%;">Pago Con Solar</th>
              <th style="padding: 6px; width: 22.5%;">Ahorro Neto Acum.</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 5, 10, 15, 20, 25].map(yr => {
              const annualSavings = quoteData.financial?.cashflows_25yr[yr - 1] || 0;
              const bimonthlyTotal = quoteData.cfe_data?.total_mxn || 0;
              const yearlyPaymentWithoutSolar = (bimonthlyTotal * (quoteData.cfe_data?.is_bimonthly ? 6 : 12)) * Math.pow(1.06, yr - 1);
              const minAnnualFee = quoteData.cfe_data?.is_bimonthly ? 600 : 1200;
              const yearlyPaymentWithSolar = Math.max(minAnnualFee, yearlyPaymentWithoutSolar - annualSavings);
              
              // Sum up cashflows up to yr
              let cumulative = 0;
              for (let i = 0; i < yr; i++) {
                cumulative += (quoteData.financial?.cashflows_25yr[i] || 0);
              }
              // Calculate bimonthly/credit cumulative paid
              let totalCreditPaidSoFar = 0;
              if (isCredit) {
                const nMonths = Math.min(term, yr * 12);
                totalCreditPaidSoFar = monthlyCreditPayment * nMonths;
              }
              const netCumulative = cumulative - (isCredit ? totalCreditPaidSoFar : inv);

              return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px; font-weight: bold;">Año ${yr}</td>
                  <td style="padding: 6px;">$${Math.round(annualSavings).toLocaleString('es-MX')} MXN</td>
                  <td style="padding: 6px; color: #dc2626;">$${Math.round(yearlyPaymentWithoutSolar).toLocaleString('es-MX')} MXN</td>
                  <td style="padding: 6px; color: #16a34a;">$${Math.round(yearlyPaymentWithSolar).toLocaleString('es-MX')} MXN</td>
                  <td style="padding: 6px; font-weight: bold; color: #0f172a;">$${Math.round(netCumulative).toLocaleString('es-MX')} MXN</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 14px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; tracking: 0.05em;">Beneficios Ecológicos en 25 Años</h2>
        <div style="display: flex; gap: 12px; justify-content: space-between;">
          <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
            <p style="font-size: 18px; font-weight: 800; color: #16a34a; margin: 0;">${(quoteData.environmental?.co2_kg_25yr / 1000).toFixed(1)} t</p>
            <p style="font-size: 9px; color: #166534; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">CO2 Evitado</p>
          </div>
          <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
            <p style="font-size: 18px; font-weight: 800; color: #16a34a; margin: 0;">${Math.round(quoteData.environmental?.trees_25yr || 0)}</p>
            <p style="font-size: 9px; color: #166534; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">Árboles Plantados</p>
          </div>
          <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
            <p style="font-size: 18px; font-weight: 800; color: #16a34a; margin: 0;">${Math.round(quoteData.environmental?.cars_25yr || 0)}</p>
            <p style="font-size: 9px; color: #166534; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">Autos Evitados</p>
          </div>
          <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
            <p style="font-size: 18px; font-weight: 800; color: #16a34a; margin: 0;">${Math.round(quoteData.environmental?.coal_ton_25yr || 0)}</p>
            <p style="font-size: 9px; color: #166534; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">Tons Carbón</p>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #cbd5e1; padding-top: 12px; text-align: center; font-size: 9px; color: #64748b; margin-top: 32px;">
        <p style="margin: 0;">Este documento es una estimación del dimensionamiento técnico preliminar. eSol Energías Renovables es responsable de la ejecución técnica definitiva.</p>
        <p style="margin: 2px 0 0 0; font-weight: bold; color: #C49825;">eSol Energías Renovables — Hermosillo, Sonora</p>
      </div>
    `;

    const opt = {
      margin:       15,
      filename:     `Propuesta_Solar_${quoteData.client_name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save()
      .then(() => {
        setView('results');
      })
      .catch((err) => {
        console.error("Error al exportar PDF:", err);
        setView('results');
      });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full text-cream font-body">
      {/* Sidebar - Cotizaciones Guardadas */}
      <div className="w-full lg:w-64 bg-dark-1 border border-dark-4 p-5 rounded-2xl flex flex-col justify-between shrink-0 space-y-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-dark-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gold">Cotizaciones</span>
            <button
              onClick={handleReset}
              className="p-1.5 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg border border-gold/20 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block mb-1">Guardadas en Historial</span>
            {quotes.length === 0 ? (
              <p className="text-[11px] text-cream-muted leading-relaxed py-2">No hay cotizaciones guardadas aún.</p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {quotes.map((q) => {
                  const isActive = q.id === currentQuoteId;
                  const dateStr = new Date(q.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'short'
                  });
                  return (
                    <div
                      key={q.id}
                      onClick={() => loadQuote(q)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${
                        isActive
                          ? 'bg-gold/10 border-gold/40 text-gold'
                          : 'bg-dark-3/20 border border-dark-4 text-cream-muted hover:border-cream/25 hover:text-cream'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{q.client_name}</p>
                        <p className="text-[10px] text-cream-muted mt-0.5 flex items-center gap-1.5 font-mono">
                          <span>{q.system?.installed_kWp?.toFixed(1) || 0} kWp</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteQuote(e, q.id)}
                        className="p-1 bg-transparent hover:bg-red-500/10 text-cream-muted hover:text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-dark-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-gold uppercase tracking-wide">ESUN — Cotizador Solar</h1>
            <p className="text-cream-muted text-xs">Propuesta y dimensionamiento solar fotovoltaico instantáneo</p>
          </div>

          <div className="flex items-center gap-2">
            {view === 'results' && (
              <button
                onClick={handleTriggerExport}
                className="px-4 py-1.5 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-xs transition-all cursor-pointer uppercase tracking-wider shadow-[0_0_15px_rgba(196,152,37,0.3)] hover:scale-[1.02]"
              >
                Exportar Propuesta PDF
              </button>
            )}

            {view !== 'upload' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-dark-4 bg-dark-3/30 hover:border-gold/30 text-cream-muted hover:text-gold rounded-xl text-xs transition-all cursor-pointer font-bold uppercase tracking-wider"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Atrás / Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Views */}
        {view === 'upload' && (
          <div className="animate-[fadeIn_0.2s_ease-out]">
            <CFEUploader
              onParsed={(data) => {
                setCfeData(data);
                setView('form');
              }}
            />
          </div>
        )}

        {view === 'form' && cfeData && (
          <div className="animate-[fadeIn_0.2s_ease-out]">
            <CFEDataForm
              data={cfeData}
              onSubmit={(finalData) => {
                setCfeData(finalData);
                setView('results');
              }}
            />
          </div>
        )}

        {view === 'results' && cfeData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-[fadeIn_0.3s_ease-out] items-start">
            {/* Left Column - Sizing proposal */}
            <div className="space-y-6">
              <SystemProposal
                key={currentQuoteId || 'new'}
                cfeData={cfeData}
                system={system}
                onUpdate={setSystem}
              />
            </div>

            {/* Right Column - Financial & Env analysis */}
            <div className="space-y-6">
              {system && (
                <>
                  <FinancialAnalysis
                    key={currentQuoteId || 'new-fin'}
                    system={system}
                    cfeData={cfeData}
                    financialParams={financialParams}
                    onChangeFinancialParams={setFinancialParams}
                  />
                  <EnvironmentalImpact
                    system={system}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {view === 'export' && (
          <div className="bg-dark-2 border border-dark-4 p-8 rounded-2xl flex flex-col items-center justify-center space-y-6 py-20 animate-[fadeIn_0.2s_ease-out]">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold"></div>
              <div className="absolute font-display text-gold text-lg font-black uppercase">eSol</div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-display text-gold">Generando Reporte de Cotización</h3>
              <p className="text-xs text-cream-muted max-w-sm">Compilando gráficos, matrices de insumo y equivalencias de carbono en formato PDF de alta calidad...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
