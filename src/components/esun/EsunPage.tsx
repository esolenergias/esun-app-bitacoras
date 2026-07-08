import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import CFEUploader from './CFEUploader';
import CFEDataForm from './CFEDataForm';
import SystemProposal from './SystemProposal';
import FinancialAnalysis from './FinancialAnalysis';
import EnvironmentalImpact from './EnvironmentalImpact';
import { calculateFinancials } from './lib/financialEngine';
import { SOLAR_CONSTANTS } from './lib/solarConstants';

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
  }, []);

  const saveQuote = (cfe: any, sys: any, finParams: any) => {
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
  };

  // Auto-save quote in results view when system or cfeData updates
  useEffect(() => {
    if (view === 'results' && cfeData && system) {
      saveQuote(cfeData, system, financialParams);
    }
  }, [view, cfeData, system, financialParams]);

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
    setTimeout(() => {
      // PDF download action will be connected in Task 6
      setView('results');
    }, 2000);
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
