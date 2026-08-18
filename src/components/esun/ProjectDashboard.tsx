import React, { useState } from 'react';
import {
  ArrowLeft, Plus, Edit2, FileText, Zap, Battery, DollarSign, Calendar, RefreshCcw,
  Tv, Printer, FileSpreadsheet, Save, CheckCircle2
} from 'lucide-react';
import type { SolarProject, Proposal } from './esunTypes';
import CFEDataForm from './CFEDataForm';
import CFEUploader from './CFEUploader';
import SystemProposal from './SystemProposal';
import FinancialAnalysis, { getInitialAutoConcepts, getEffectiveConcepts } from './FinancialAnalysis';
import EnvironmentalImpact from './EnvironmentalImpact';
import InteractivePresentationModal from './InteractivePresentationModal';
import { buildPremiumPDF } from './lib/pdfProposalBuilder';
import { calculateFinancials } from './lib/financialEngine';
import { SOLAR_CONSTANTS } from './lib/solarConstants';
import { savePresupuesto, getMatrices, calculateMatrixDirectCost, calculateMatrixSellingPrice, getPresupuestoDetails } from '../../lib/cotizadorService';
import ErrorBoundary from '../ErrorBoundary';
interface ProjectDashboardProps {
  project: SolarProject;
  onUpdateProject: (updated: SolarProject) => void;
  onBack: () => void;
}

export default function ProjectDashboard({ project, onUpdateProject, onBack }: ProjectDashboardProps) {
  const [view, setView] = useState<'dashboard' | 'edit_cfe' | 'upload_cfe' | 'edit_proposal' | 'exporting'>('dashboard');
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);

  // Modals and action states
  const [showPresentation, setShowPresentation] = useState(false);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  const [presupuestoSuccess, setPresupuestoSuccess] = useState<string | null>(null);
  const [isSavingPresupuesto, setIsSavingPresupuesto] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Temporary state for when editing a proposal
  const [currentSystem, setCurrentSystem] = useState<any>(null);
  const [currentFinParams, setCurrentFinParams] = useState<any>(null);
  const [proposalName, setProposalName] = useState<string>('');

  const handleGeneratePDF = async () => {
    setIsGeneratingQuote(true);
    try {
      const currentProposal = project.proposals.find(p => p.id === editingProposalId) || project.proposals[0];
      if (currentSystem && currentProposal) {
        let presupuestoItems = [];
        if (currentFinParams?.linked_presupuesto_id) {
          try {
            const pres = await getPresupuestoDetails(currentFinParams.linked_presupuesto_id);
            presupuestoItems = pres.conceptos || [];
          } catch(e) {
            console.error("Error al obtener presupuesto para PDF", e);
          }
        }
        
        if (!presupuestoItems || presupuestoItems.length === 0) {
          const localConcepts = getEffectiveConcepts(currentFinParams?.customConcepts, currentSystem);
          presupuestoItems = localConcepts.map(c => ({
            quantity: c.quantity,
            concepto_name: c.category || 'Concepto',
            code: c.code || '',
            description: c.description,
            unit: c.unit,
            type: 'concept'
          }));
        }

        await buildPremiumPDF(project, {
          ...currentProposal,
          system: currentSystem,
          financialParams: currentFinParams,
          name: proposalName,
          financial: calculateFinancials({
            system_kWp: currentSystem?.system_kWp || 0,
            installed_kWp: currentSystem?.installed_kWp || 0,
            annual_production_kWh: currentSystem?.annual_production_kWh || 0,
            monthly_consumption_kWh: project.cfe_data?.monthly_kWh || 0,
            tariff_rate_mxn: project.cfe_data?.tariff_rate || 0,
            custom_cost: currentFinParams?.manualCost,
            historic_periods: project.cfe_data?.historic_periods,
            is_bimonthly: project.cfe_data?.is_bimonthly,
            tariff_name: project.cfe_data?.tariff,
            demand_kw: project.cfe_data?.demand_kw
          })
        }, presupuestoItems, () => setIsGeneratingQuote(false));
      } else {
        setIsGeneratingQuote(false);
      }
    } catch(err) {
      console.error(err);
      setIsGeneratingQuote(false);
    }
  };

  const handleEditCFE = () => setView('edit_cfe');
  const handleUploadCFE = () => setView('upload_cfe');

  const syncWithESOL = async () => {
    if (!currentFinParams?.linked_presupuesto_id) return;
    setIsSyncing(true);
    try {
      const esolBudget = await getPresupuestoDetails(currentFinParams.linked_presupuesto_id);
      if (esolBudget && esolBudget.conceptos) {
        const autoCodes = ['APU-PANEL-550', 'APU-INVER-15K', 'INV 5KW GROW', 'EST-K2-2N-COMP', 'MO - MO - BT', 'ELC-MAT-DC', 'ELC-MAT-AC', 'TR - TRAMITE - CFE'];
        
        let newPanels = currentSystem?.num_panels;
        let newInverters = currentSystem?.num_inverters;

        const syncedConcepts = esolBudget.conceptos.map((c: any) => {
          const directCost = calculateMatrixDirectCost(c.matriz?.insumos || [], Number(c.quantity || 1));
          const sellingPrice = calculateMatrixSellingPrice(
            directCost,
            Number(c.indirect_percentage || 10),
            Number(c.utility_percentage || 8)
          );
          
          const code = c.matriz?.code || '';
          
          if (code === 'APU-PANEL-550') newPanels = Number(c.quantity);
          if (code === 'APU-INVER-15K' || code === 'INV 5KW GROW') newInverters = Number(c.quantity);
          
          return {
            id: c.id,
            category: c.matriz?.subcategory || 'Concepto ESOL',
            code: code,
            quantity: Number(c.quantity || 1),
            unit: c.unit || 'pza',
            description: c.description,
            unit_price: sellingPrice || Number(c.cost_price || 0),
            matriz_id: c.matriz_id || undefined,
            is_auto: autoCodes.includes(code)
          };
        });

        setCurrentFinParams((prev: any) => ({
          ...prev,
          customConcepts: syncedConcepts
        }));
        
        // Reflect panel and inverter quantity changes directly into the system installation sizing!
        if (currentSystem && (newPanels !== currentSystem.num_panels || newInverters !== currentSystem.num_inverters)) {
          const updatedSystem = { ...currentSystem };
          updatedSystem.num_panels = newPanels;
          updatedSystem.num_inverters = newInverters;
          if (updatedSystem.panel_Wp) {
            updatedSystem.installed_kWp = (newPanels * updatedSystem.panel_Wp) / 1000;
            updatedSystem.annual_production_kWh = updatedSystem.installed_kWp * (updatedSystem.hsp || 5.2) * 365 * (updatedSystem.efficiency || 0.8);
          }
          setCurrentSystem(updatedSystem);
        }
        
        console.log("Synchronized from ESOL:", esolBudget.id);
      }
    } catch (e) {
      console.error("Error syncing with ESOL:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync with ESOL if a linked budget exists
  React.useEffect(() => {
    if (view === 'edit_proposal' && currentFinParams?.linked_presupuesto_id) {
      syncWithESOL();
    }
  }, [view, currentFinParams?.linked_presupuesto_id]);

  const [isEditingClientName, setIsEditingClientName] = useState(false);
  const [tempClientName, setTempClientName] = useState(project.client_name || '');

  // Keep tempClientName in sync with project.client_name
  React.useEffect(() => {
    setTempClientName(project.client_name || '');
  }, [project.client_name]);

  const saveCFEData = (newCfe: any) => {
    const updated = { 
      ...project, 
      client_name: newCfe.client_name || project.client_name,
      cfe_data: newCfe 
    };
    
    // Automatically recalculate all existing proposals with the new CFE data
    const recalculatedProposals = updated.proposals.map(prop => {
      const finResult = calculateFinancials({
        system_kWp: prop.system.system_kWp,
        installed_kWp: prop.system.installed_kWp,
        annual_production_kWh: prop.system.annual_production_kWh,
        monthly_consumption_kWh: newCfe.monthly_kWh,
        tariff_rate_mxn: newCfe.tariff_rate,
        custom_cost: prop.financialParams.manualCost,
      });
      return { ...prop, financial: finResult };
    });
    
    updated.proposals = recalculatedProposals;
    onUpdateProject(updated);
    setView('dashboard');
  };

  const handleSaveInlineClientName = () => {
    if (!tempClientName.trim()) return;
    const updated = {
      ...project,
      client_name: tempClientName.trim(),
      cfe_data: {
        ...project.cfe_data,
        client_name: tempClientName.trim()
      }
    };
    onUpdateProject(updated);
    setIsEditingClientName(false);
  };

  const createProposal = () => {
    setEditingProposalId(null);
    setCurrentSystem(null);
    setCurrentFinParams({ isCredit: false, interestRate: 15, termMonths: 36 });
    setProposalName(`Propuesta ${project.proposals.length + 1}`);
    setView('edit_proposal');
  };

  const editProposal = (prop: Proposal) => {
    setEditingProposalId(prop.id);
    setCurrentSystem(prop.system);
    setCurrentFinParams(prop.financialParams);
    setProposalName(prop.name);
    setView('edit_proposal');
  };

  const saveProposal = (preventNavigation = false) => {
    if (!currentSystem) return;
    
    const finResult = calculateFinancials({
      system_kWp: currentSystem.system_kWp,
      installed_kWp: currentSystem.installed_kWp,
      annual_production_kWh: currentSystem.annual_production_kWh,
      monthly_consumption_kWh: project.cfe_data.monthly_kWh,
      tariff_rate_mxn: project.cfe_data.tariff_rate,
      custom_cost: currentFinParams.manualCost,
      historic_periods: project.cfe_data.historic_periods,
      is_bimonthly: project.cfe_data.is_bimonthly,
      tariff_name: project.cfe_data.tariff,
      demand_kw: project.cfe_data.demand_kw
    });

    const totalProduction25yr = currentSystem.annual_production_kWh * SOLAR_CONSTANTS.SYSTEM_LIFE;
    const co2SavedKg = totalProduction25yr * SOLAR_CONSTANTS.CO2_FACTOR;

    const newProposal: Proposal = {
      id: editingProposalId || Math.random().toString(36).substring(2, 9),
      name: proposalName,
      created_at: new Date().toISOString(),
      system: currentSystem,
      financialParams: currentFinParams,
      financial: finResult,
      environmental: {
        co2_kg_25yr: co2SavedKg,
        trees_25yr: co2SavedKg / SOLAR_CONSTANTS.CO2_PER_TREE_KG,
        cars_25yr: (co2SavedKg / 1000) / SOLAR_CONSTANTS.CO2_PER_CAR_TONS,
        coal_ton_25yr: (co2SavedKg / 1000) / SOLAR_CONSTANTS.CO2_PER_COAL_TON,
      }
    };

    let updatedProposals = [...project.proposals];
    if (editingProposalId) {
      const idx = updatedProposals.findIndex(p => p.id === editingProposalId);
      if (idx !== -1) updatedProposals[idx] = newProposal;
    } else {
      updatedProposals.push(newProposal);
    }

    onUpdateProject({ ...project, proposals: updatedProposals });
    if (!preventNavigation) {
      setView('dashboard');
    }
    return newProposal;
  };

  const handleGenerarPresupuesto = async () => {
    if (!currentSystem) return;
    setIsSavingPresupuesto(true);
    try {
      const savedProp = saveProposal();
      if (!savedProp) return;

      // Ensure concept list is populated using the same logic that FinancialAnalysis uses
      const activeConcepts = getEffectiveConcepts(currentFinParams?.customConcepts, currentSystem);

      // Fetch master matrices from Supabase to associate matrix_id
      const masterMatrices = await getMatrices().catch(() => []);
      
      const conceptoRows = activeConcepts.map((c: any, i: number) => {
        const matchedMatrix = masterMatrices.find(m =>
          (c.code && m.code.toLowerCase().trim() === c.code.toLowerCase().trim()) ||
          (c.matriz_id && m.id === c.matriz_id)
        );

        let indirectPct = matchedMatrix ? Number(matchedMatrix.indirect_percentage || 10) : 10;
        let utilityPct = matchedMatrix ? Number(matchedMatrix.utility_percentage || 8) : 8;
        
        let finalDirectCost = 0;

        if (matchedMatrix && c.is_auto !== false) {
          // If a matrix is matched and concept hasn't been manually decoupled, strictly use matrix base cost
          finalDirectCost = calculateMatrixDirectCost(matchedMatrix.insumos || [], Number(c.quantity || 1));
        } else {
          // If manually edited or proportionally scaled, trust the UI unit_price as the target selling price.
          // Reverse engineer the direct cost so that selling price matches perfectly when Budget opens.
          const sellingPrice = Number(c.unit_price || 0);
          finalDirectCost = sellingPrice / ((1 + indirectPct / 100) * (1 + utilityPct / 100));
        }

        return {
          matriz_id: matchedMatrix ? matchedMatrix.id : (c.matriz_id || null),
          quantity: Number(c.quantity || 1),
          description: matchedMatrix && c.is_auto !== false ? matchedMatrix.description : (c.description || c.category),
          unit: matchedMatrix && c.is_auto !== false ? matchedMatrix.unit : (c.unit || 'pza'),
          cost_price: finalDirectCost,
          indirect_percentage: indirectPct,
          utility_percentage: utilityPct,
          order_index: i,
          type: 'concept'
        };
      });

      const budgetData = {
        id: currentFinParams?.linked_presupuesto_id || undefined, // UPDATE if exists, INSERT if not
        name: `${proposalName || 'Propuesta Fotovoltaica'} - ${project.client_name}`,
        client_name: project.client_name,
        status: 'borrador' as const,
        produccion: false,
        ubicacion: project.city || 'Tepic, Nayarit',
        indirect_percentage: 10,
        utility_percentage: 8
      };

      const savedBudget = await savePresupuesto(budgetData, conceptoRows);
      
      // Link the budget ID back to the proposal so it can sync bidirectionally
      const updatedParams = { ...currentFinParams, linked_presupuesto_id: savedBudget.id };
      setCurrentFinParams(updatedParams);
      
      // Also update it in the project tree immediately
      const newProposal = {
        id: editingProposalId || Math.random().toString(36).substring(2, 9),
        name: proposalName,
        created_at: new Date().toISOString(),
        system: currentSystem,
        financialParams: updatedParams,
        financial: calculateFinancials({
          system_kWp: currentSystem.system_kWp,
          installed_kWp: currentSystem.installed_kWp,
          annual_production_kWh: currentSystem.annual_production_kWh,
          monthly_consumption_kWh: project.cfe_data.monthly_kWh,
          tariff_rate_mxn: project.cfe_data.tariff_rate,
          custom_cost: updatedParams.manualCost,
        }),
        environmental: { co2_kg_25yr: 0, trees_25yr: 0, cars_25yr: 0, coal_ton_25yr: 0 } // mock for speed
      };
      
      let updatedProposals = [...project.proposals];
      if (editingProposalId) {
        const idx = updatedProposals.findIndex(p => p.id === editingProposalId);
        if (idx !== -1) updatedProposals[idx] = newProposal;
      }
      onUpdateProject({ ...project, proposals: updatedProposals });

      setPresupuestoSuccess(`¡Presupuesto sincronizado exitosamente con ESOL! (ID: ${savedBudget.id.substring(0, 8)})`);
      setTimeout(() => setPresupuestoSuccess(null), 6000);
    } catch (e: any) {
      console.error("Error al generar presupuesto:", e);
      alert("Error al enviar cotización a Presupuestos ESOL: " + (e.message || e));
    } finally {
      setIsSavingPresupuesto(false);
    }
  };



  const deleteProposal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm("¿Seguro que deseas eliminar esta propuesta?")) {
      const updated = project.proposals.filter(p => p.id !== id);
      onUpdateProject({ ...project, proposals: updated });
    }
  };

  if (view === 'edit_cfe') {
    return (
      <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-dark-3 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-cream-muted" />
          </button>
          <h2 className="text-xl font-display font-bold text-cream">Editar Consumos de CFE</h2>
        </div>
        <CFEDataForm data={project.cfe_data} onSubmit={saveCFEData} />
      </div>
    );
  }

  if (view === 'upload_cfe') {
    return (
      <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-dark-3 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-cream-muted" />
          </button>
          <h2 className="text-xl font-display font-bold text-cream">Subir Nuevo Recibo CFE</h2>
        </div>
        <CFEUploader onParsed={saveCFEData} />
      </div>
    );
  }

  if (view === 'edit_proposal') {
    return (
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        {/* Success Toast */}
        {presupuestoSuccess && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 font-bold text-xs flex items-center justify-between shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{presupuestoSuccess}</span>
            </div>
            <button onClick={() => setPresupuestoSuccess(null)} className="text-emerald-400/70 hover:text-emerald-400">
              ✕
            </button>
          </div>
        )}

        {/* Header Editor */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-dark-2/50 border border-dark-4 p-4 rounded-2xl backdrop-blur-md relative">
          {isSyncing && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gold/20 overflow-hidden rounded-t-2xl">
              <div className="h-full bg-gold w-1/3 animate-[slide_1s_ease-in-out_infinite]" />
            </div>
          )}
          <div className="flex items-center gap-4">
            <button onClick={() => setView('dashboard')} className="p-2 bg-dark-3/50 hover:bg-dark-3 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5 text-cream-muted hover:text-cream" />
            </button>
            <div>
              <p className="text-[10px] text-cream-muted font-bold uppercase tracking-wider">Nombre de Propuesta</p>
              <input 
                type="text" 
                value={proposalName}
                onChange={(e) => setProposalName(e.target.value)}
                className="bg-transparent border-none outline-none text-xl font-display font-bold text-gold placeholder-gold/50 p-0 focus:ring-0 w-64"
                placeholder="Ej. Opción 100% Cobertura"
              />
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-2.5">
            {currentFinParams?.linked_presupuesto_id && (
              <button 
                onClick={syncWithESOL}
                disabled={isSyncing}
                title="Sincronizar cambios desde Presupuestos ESOL"
                className="px-3 py-2 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 border border-dark-4 disabled:opacity-50"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>
            )}
            <button
              onClick={handleGenerarPresupuesto}
              disabled={isSavingPresupuesto}
              className="px-4 py-2.5 bg-dark-3 hover:bg-dark-4 border border-gold/40 hover:border-gold text-gold font-bold rounded-xl transition-all uppercase tracking-wider text-xs flex items-center gap-2 shadow-md"
              title="Mandar cotización a Presupuestos ESOL con comunicación bilateral"
            >
              <FileSpreadsheet className="w-4 h-4 text-gold" />
              <span>{isSavingPresupuesto ? 'Enviando...' : 'Generar Presupuesto'}</span>
            </button>

            {/* 2. Presentación (Interactive HTML Pitch Deck) */}
            <button
              onClick={() => setShowPresentation(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all uppercase tracking-wider text-xs flex items-center gap-2 shadow-md hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              title="Generar presentación interactiva HTML para el cliente"
            >
              <Tv className="w-4 h-4 text-white" />
              <span>Presentación</span>
            </button>

            {/* 3. Propuesta económica (1-Page Letter Sheet) */}
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingQuote}
              className="px-4 py-2.5 bg-dark-3 hover:bg-dark-4 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 font-bold rounded-xl transition-all uppercase tracking-wider text-xs flex items-center gap-2 shadow-md disabled:opacity-50"
              title="Resumen ejecutivo numérico en 1 hoja carta"
            >
              {isGeneratingQuote ? <RefreshCcw className="w-4 h-4 text-emerald-400 animate-spin" /> : <Printer className="w-4 h-4 text-emerald-400" />}
              <span>{isGeneratingQuote ? 'Generando...' : 'Propuesta económica'}</span>
            </button>



            {/* 4. Guardar Propuesta */}
            <button
              onClick={() => saveProposal()}
              className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light text-dark-1 font-bold rounded-xl shadow-[0_0_20px_rgba(196,152,37,0.3)] hover:shadow-[0_0_30px_rgba(196,152,37,0.5)] transition-all uppercase tracking-wider text-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Propuesta</span>
            </button>
          </div>
        </div>

        <ErrorBoundary>
          <div className="space-y-6">
            <SystemProposal
              key={editingProposalId || 'new'}
              cfeData={project.cfe_data}
              system={currentSystem}
              onUpdate={setCurrentSystem}
            />
            {currentSystem && (
              <FinancialAnalysis
                system={currentSystem}
                cfeData={project.cfe_data}
                financialParams={currentFinParams}
                onChangeFinancialParams={setCurrentFinParams}
              />
            )}
          </div>
        </ErrorBoundary>

        {/* Modals (rendered inside edit_proposal return) */}
        {showPresentation && currentSystem && (
          <InteractivePresentationModal
            project={project}
            proposal={{
              id: editingProposalId || 'current',
              name: proposalName,
              created_at: new Date().toISOString(),
              system: currentSystem,
              financialParams: currentFinParams,
              financial: calculateFinancials({
                system_kWp: currentSystem.system_kWp,
                installed_kWp: currentSystem.installed_kWp,
                annual_production_kWh: currentSystem.annual_production_kWh,
                monthly_consumption_kWh: project.cfe_data.monthly_kWh,
                tariff_rate_mxn: project.cfe_data.tariff_rate,
                custom_cost: currentFinParams.manualCost,
                historic_periods: project.cfe_data.historic_periods,
                is_bimonthly: project.cfe_data.is_bimonthly,
                tariff_name: project.cfe_data.tariff,
                demand_kw: project.cfe_data.demand_kw
              }),
              environmental: {
                co2_kg_25yr: currentSystem.annual_production_kWh * 25 * 0.45,
                trees_25yr: (currentSystem.annual_production_kWh * 25 * 0.45) / 20,
                cars_25yr: (currentSystem.annual_production_kWh * 25 * 0.45) / 4600,
                coal_ton_25yr: ((currentSystem.annual_production_kWh * 25 * 0.45) / 1000) / 1
              }
            }}
            onShare={(method) => {
              try {
                const savedProp = saveProposal(true);
                if (!savedProp) {
                  alert("Error interno: La propuesta no se pudo procesar porque faltan datos del sistema.");
                  return;
                }
                const url = `${window.location.origin}/?esun_propuesta=${project.id}_${savedProp.id}`;
                
                if (method === 'whatsapp') {
                  const text = `Hola ${project.client_name}, te comparto la Propuesta Técnica y Financiera de tu sistema de paneles solares diseñada por ESOL Energías:\n\n${url}`;
                  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  const newWindow = window.open(waUrl, '_blank');
                  if (!newWindow) {
                    alert('Tu navegador bloqueó la ventana emergente de WhatsApp. Te redirigiremos en esta misma ventana.');
                    window.location.href = waUrl;
                  }
                } else if (method === 'copy') {
                  if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(url).then(() => {
                      alert('Enlace copiado al portapapeles:\n' + url);
                    }).catch(err => {
                      alert('No se pudo copiar el enlace. Error: ' + String(err));
                    });
                  } else {
                    // Fallback for non-HTTPS or unsupported browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    textArea.style.position = 'fixed'; // Avoid scrolling
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                      document.execCommand('copy');
                      alert('Enlace copiado al portapapeles (Fallback):\n' + url);
                    } catch (err) {
                      alert('Tu navegador no soporta copiado automático. Por favor, copia este enlace manualmente:\n\n' + url);
                    }
                    document.body.removeChild(textArea);
                  }
                }
              } catch (err: any) {
                console.error(err);
                alert("Error al intentar compartir: " + err.message);
              }
            }}
            onClose={() => setShowPresentation(false)}
          />
        )}


      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-2 to-dark-1 border border-dark-4 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-dark-3/50 hover:bg-dark-3 border border-dark-4 rounded-xl transition-all group">
              <ArrowLeft className="w-5 h-5 text-cream-muted group-hover:text-cream transition-colors" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                {isEditingClientName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempClientName}
                      onChange={(e) => setTempClientName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineClientName()}
                      autoFocus
                      className="bg-dark-1 border border-gold/50 text-cream px-3 py-1.5 rounded-xl font-display font-bold text-xl focus:outline-none"
                    />
                    <button
                      onClick={handleSaveInlineClientName}
                      className="p-2 bg-gold hover:bg-gold-light text-dark-1 rounded-xl transition-all font-bold text-xs flex items-center gap-1"
                      title="Guardar nombre"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-3xl font-display font-black text-cream">{project.client_name}</h1>
                    <button
                      onClick={() => setIsEditingClientName(true)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-dark-3 rounded-lg transition-all text-cream-muted hover:text-gold"
                      title="Editar nombre del cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <span className="px-3 py-1 bg-gold/10 border border-gold/20 text-gold rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Cotización Activa
                </span>
              </div>
              <p className="text-sm text-cream-muted mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Creado el {new Date(project.created_at).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-dark-3/30 p-2 rounded-2xl border border-dark-4 backdrop-blur-sm">
            <button onClick={handleEditCFE} className="flex items-center gap-2 px-4 py-2 hover:bg-dark-3/80 rounded-xl transition-all text-xs font-bold text-cream-muted hover:text-cream uppercase tracking-wider">
              <Edit2 className="w-4 h-4" /> Editar Datos
            </button>
            <div className="w-px h-8 bg-dark-4"></div>
            <button onClick={handleUploadCFE} className="flex items-center gap-2 px-4 py-2 hover:bg-gold/10 hover:text-gold rounded-xl transition-all text-xs font-bold text-cream-muted uppercase tracking-wider">
              <RefreshCcw className="w-4 h-4" /> Resubir Recibo
            </button>
          </div>
        </div>

        {/* CFE Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-dark-3/40 border border-dark-4/50 rounded-2xl p-4">
            <p className="text-[10px] text-cream-muted font-bold uppercase tracking-wider mb-1">Tarifa CFE</p>
            <p className="text-xl font-display font-bold text-gold flex items-center gap-2"><Zap className="w-5 h-5" /> {project.cfe_data.tariff}</p>
          </div>
          <div className="bg-dark-3/40 border border-dark-4/50 rounded-2xl p-4">
            <p className="text-[10px] text-cream-muted font-bold uppercase tracking-wider mb-1">Consumo Bimestral</p>
            <p className="text-xl font-display font-bold text-cream">{project.cfe_data.bimonthly_kWh.toLocaleString()} <span className="text-sm text-cream-muted font-normal">kWh</span></p>
          </div>
          <div className="bg-dark-3/40 border border-dark-4/50 rounded-2xl p-4">
            <p className="text-[10px] text-cream-muted font-bold uppercase tracking-wider mb-1">Pago Promedio</p>
            <p className="text-xl font-display font-bold text-green-400 flex items-center"><DollarSign className="w-5 h-5 opacity-70" /> {project.cfe_data.total_mxn.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
          </div>
          <div className="bg-dark-3/40 border border-dark-4/50 rounded-2xl p-4">
            <p className="text-[10px] text-cream-muted font-bold uppercase tracking-wider mb-1">Costo / kWh</p>
            <p className="text-xl font-display font-bold text-cream">${project.cfe_data.tariff_rate.toFixed(2)} <span className="text-sm text-cream-muted font-normal">MXN</span></p>
          </div>
        </div>
      </div>

      {/* Proposals Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-display font-bold text-cream flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" /> Propuestas del Proyecto
            </h2>
            <p className="text-xs text-cream-muted mt-1">Crea diferentes opciones de dimensionamiento para este cliente.</p>
          </div>
          <button onClick={createProposal} className="flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-xs transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(196,152,37,0.2)]">
            <Plus className="w-4 h-4" /> Nueva Propuesta
          </button>
        </div>

        {project.proposals.length === 0 ? (
          <div className="border-2 border-dashed border-dark-4/50 rounded-3xl p-12 text-center bg-dark-2/30">
            <Battery className="w-12 h-12 text-dark-4 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-cream mb-2">Aún no hay propuestas</h3>
            <p className="text-sm text-cream-muted max-w-md mx-auto mb-6">Genera la primera propuesta de sistema fotovoltaico para este proyecto usando los consumos extraídos de CFE.</p>
            <button onClick={createProposal} className="px-6 py-2.5 bg-dark-3 hover:bg-dark-4 text-cream font-bold rounded-xl text-sm transition-all border border-dark-4 hover:border-gold/30">
              Crear Primera Propuesta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.proposals.map(prop => (
              <div key={prop.id} onClick={() => editProposal(prop)} className="group cursor-pointer bg-dark-2 border border-dark-4 hover:border-gold/50 p-6 rounded-3xl shadow-lg hover:shadow-[0_10px_40px_rgba(196,152,37,0.1)] transition-all relative overflow-hidden flex flex-col h-full">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h3 className="text-lg font-bold text-cream group-hover:text-gold transition-colors">{prop.name}</h3>
                  <button onClick={(e) => deleteProposal(e, prop.id)} className="p-1.5 bg-dark-3/50 hover:bg-red-500/20 text-cream-muted hover:text-red-400 rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                
                <div className="space-y-4 flex-1 relative z-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-black text-cream">{prop.system.installed_kWp.toFixed(1)}</span>
                    <span className="text-xs text-cream-muted uppercase font-bold">kWp</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-dark-3/30 p-3 rounded-xl border border-dark-4/50">
                      <p className="text-[10px] text-cream-muted uppercase font-bold mb-1">Paneles</p>
                      <p className="font-bold text-cream">{prop.system.num_panels} <span className="font-normal text-xs text-cream-muted">mods</span></p>
                    </div>
                    <div className="bg-dark-3/30 p-3 rounded-xl border border-dark-4/50">
                      <p className="text-[10px] text-cream-muted uppercase font-bold mb-1">Inversión</p>
                      <p className="font-bold text-green-400">${(prop.financial.investment_mxn / 1000).toFixed(0)}k <span className="font-normal text-xs text-cream-muted">MXN</span></p>
                    </div>
                    <div className="bg-dark-3/30 p-3 rounded-xl border border-dark-4/50">
                      <p className="text-[10px] text-cream-muted uppercase font-bold mb-1">Generación</p>
                      <p className="font-bold text-cream">{Math.round(prop.system.annual_production_kWh).toLocaleString()} <span className="font-normal text-xs text-cream-muted">kWh/a</span></p>
                    </div>
                    <div className="bg-dark-3/30 p-3 rounded-xl border border-dark-4/50">
                      <p className="text-[10px] text-cream-muted uppercase font-bold mb-1">ROI</p>
                      <p className="font-bold text-gold">{prop.financial.roi_pct.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-dark-4 flex justify-between items-center relative z-10">
                  <span className="text-[10px] text-cream-muted uppercase tracking-wider font-bold">Ver / Editar Propuesta</span>
                  <ArrowLeft className="w-4 h-4 text-gold rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
