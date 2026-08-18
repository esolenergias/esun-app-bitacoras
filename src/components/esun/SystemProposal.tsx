import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, AlertOctagon, Sun, Maximize2, Zap, Landmark } from 'lucide-react';
import { SOLAR_CONSTANTS } from './lib/solarConstants';
import { calculateSizing, type SizingResult } from './lib/solarCalculator';
import type { CFEData } from './lib/cfeParser';
import { useApp } from '../../context/AppContext';
import { parsePanelSpecs, parseInverterSpecs } from './lib/productParser';
import { getInsumos } from '../../lib/cotizadorService';
import type { Insumo } from '../../types/cotizador';

interface SystemProposalProps {
  cfeData: CFEData;
  system?: any; // Loaded quote system settings
  onUpdate: (systemResult: any) => void;
}

export default function SystemProposal({ cfeData, system, onUpdate }: SystemProposalProps) {
  
  const [panelOptions, setPanelOptions] = useState<any[]>([]);
  const [allInverters, setAllInverters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInsumos() {
      try {
        const insumosData = await getInsumos();
        
        // Panels
        const panels = insumosData
          .filter(i => i.subcategory === 'Panel solar')
          .map(i => ({
            id: i.id,
            name: i.description || i.code,
            category: 'Paneles Solares',
            description: i.description
          }));
          
        // Inverters
        const inverters = insumosData
          .filter(i => i.subcategory === 'Inversor')
          .map(i => ({
            id: i.id,
            name: i.description || i.code,
            category: i.description.toLowerCase().includes('micro') ? 'Microinversores' : 'Inversores',
            description: i.description
          }));

        setPanelOptions(panels);
        setAllInverters(inverters);
      } catch (err) {
        console.error("Failed to load insumos for sizing:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInsumos();
  }, []);

  // Try to match city from CFE data to PSH constants (fallback to CDMX)
  let initialCity = system?.city || 'CDMX';
  if (!system?.city && cfeData.city) {
    const cfeCity = cfeData.city.toUpperCase();
    const match = Object.keys(SOLAR_CONSTANTS.PSH).find(c => cfeCity.includes(c.toUpperCase()));
    if (match) initialCity = match;
  }

  const [city, setCity] = useState(initialCity);

  // Auto sync city based on location from CFE data or system prop
  useEffect(() => {
    let targetCity = system?.city;
    if (!targetCity && cfeData?.city) {
      const cfeCity = cfeData.city.toUpperCase();
      const match = Object.keys(SOLAR_CONSTANTS.PSH).find(c => cfeCity.includes(c.toUpperCase()));
      if (match) targetCity = match;
    }
    if (targetCity && targetCity !== city) {
      setCity(targetCity);
    }
  }, [system?.city, cfeData?.city]);
  
  const [selectedPanelId, setSelectedPanelId] = useState<string>(system?.panel_id || 'manual');
  const [selectedInverterId, setSelectedInverterId] = useState<string>(system?.inverter_id || 'manual');

  // Sync selected defaults when options load
  useEffect(() => {
    if (!system?.panel_id && panelOptions.length > 0 && selectedPanelId === 'manual') {
      setSelectedPanelId(panelOptions[0].id);
    }
  }, [panelOptions, system?.panel_id, selectedPanelId]);

  useEffect(() => {
    if (!system?.inverter_id && allInverters.length > 0 && selectedInverterId === 'manual') {
      // The auto-selection logic below will handle selecting the BEST inverter
      // instead of just selecting the first one here.
    }
  }, [allInverters, system?.inverter_id, selectedInverterId]);

  // Manual States
  const [manualPanelWp, setManualPanelWp] = useState(system?.panel_Wp || 550);
  const [manualPanelVoc, setManualPanelVoc] = useState(system?.panel_Voc || 50);
  const [manualInverterKw, setManualInverterKw] = useState(system?.inverter_kw || 5);
  const [manualInverterMaxVdc, setManualInverterMaxVdc] = useState(system?.inverter_max_vdc || 600);

  // Quantity Overrides
  const [overrideNumPanels, setOverrideNumPanels] = useState<number | undefined>(system?.override_num_panels);
  const [overrideNumInverters, setOverrideNumInverters] = useState<number | undefined>(system?.override_num_inverters);

  // Derived specs from selected products
  const selectedPanel = panelOptions.find(p => p.id === selectedPanelId);
  const parsedPanel = selectedPanel ? parsePanelSpecs(selectedPanel) : null;
  const panelSpecs = {
    wp: selectedPanelId === 'manual' ? manualPanelWp : (parsedPanel?.wp || manualPanelWp),
    voc: selectedPanelId === 'manual' ? manualPanelVoc : (parsedPanel?.voc || manualPanelVoc)
  };
  
  const selectedInverter = allInverters.find(p => p.id === selectedInverterId);
  const parsedInverter = selectedInverter ? parseInverterSpecs(selectedInverter) : null;
  
  // Calculate target capacity
  const psh = SOLAR_CONSTANTS.PSH[city] || SOLAR_CONSTANTS.PSH['default'];
  const targetkWp = (cfeData.monthly_kWh * SOLAR_CONSTANTS.SIZING_MARGIN) / (psh * SOLAR_CONSTANTS.DAYS_IN_MONTH * SOLAR_CONSTANTS.PR_DEFAULT);
  const targetInverterKw = parseFloat((targetkWp / SOLAR_CONSTANTS.DC_AC_RATIO).toFixed(2));

  const inverterSpecs = {
    kw: selectedInverterId === 'manual' ? manualInverterKw : (parsedInverter?.kw || targetInverterKw),
    maxVdc: selectedInverterId === 'manual' ? manualInverterMaxVdc : (parsedInverter?.maxVdc || manualInverterMaxVdc),
    isMicro: selectedInverterId === 'manual' ? false : (parsedInverter?.isMicro || false)
  };

  // Auto-select Inverter if not manually set and not explicitly manual
  useEffect(() => {
    if (!system?.inverter_id && allInverters.length > 0) {
      // Find the inverter that is closest to targetInverterKw and >= targetInverterKw
      const validInverters = allInverters.map(inv => ({ inv, specs: parseInverterSpecs(inv) }));
      const suitable = validInverters.filter(item => item.specs.kw >= targetInverterKw);
      
      if (suitable.length > 0) {
        // Sort by how close they are to target (smallest difference first)
        suitable.sort((a, b) => a.specs.kw - b.specs.kw);
        setSelectedInverterId(suitable[0].inv.id);
      } else {
        // If none is big enough, select the biggest one
        validInverters.sort((a, b) => b.specs.kw - a.specs.kw);
        setSelectedInverterId(validInverters[0].inv.id);
      }
    } else if (!system?.inverter_id && allInverters.length === 0) {
       setSelectedInverterId('manual');
       setManualInverterKw(targetInverterKw);
    }
  }, [targetInverterKw, allInverters.length, system?.inverter_id]);

  const sizingResult = calculateSizing({
    monthly_kWh: cfeData.monthly_kWh,
    city,
    panel_Wp: panelSpecs.wp,
    panel_Voc: panelSpecs.voc,
    inverter_max_vdc: inverterSpecs.maxVdc,
    inverter_kw: inverterSpecs.kw,
    historic_periods: cfeData.historic_periods,
    override_num_panels: overrideNumPanels,
    override_num_inverters: overrideNumInverters
  });

  // Run calculation whenever inputs change
  useEffect(() => {
    if (isLoading) return; // Prevent saving premature 'manual' state to parent

    onUpdate({
      ...sizingResult,
      panel_id: selectedPanelId,
      panel_name: selectedPanel ? selectedPanel.name : `Panel Solar ${panelSpecs.wp}W`,
      panel_Wp: panelSpecs.wp,
      panel_Voc: panelSpecs.voc,
      inverter_id: selectedInverterId,
      inverter_name: selectedInverter ? selectedInverter.name : `Inversor ${inverterSpecs.kw}kW`,
      inverter_kw: inverterSpecs.kw,
      inverter_max_vdc: inverterSpecs.maxVdc,
      city,
      override_num_panels: overrideNumPanels,
      override_num_inverters: overrideNumInverters
    });
  }, [
    cfeData.monthly_kWh, city, selectedPanelId, selectedInverterId, cfeData.historic_periods, 
    manualPanelWp, manualPanelVoc, manualInverterKw, manualInverterMaxVdc, 
    overrideNumPanels, overrideNumInverters, onUpdate, sizingResult.num_panels, sizingResult.num_inverters,
    sizingResult.system_kWp, sizingResult.installed_kWp, sizingResult.panels_per_string, sizingResult.num_strings,
    sizingResult.string_Voc, sizingResult.is_electrical_safe, sizingResult.area_m2, sizingResult.annual_production_kWh,
    sizingResult.monthly_production_kWh,
    isLoading
  ]);

  const cityOptions = Object.keys(SOLAR_CONSTANTS.PSH).filter(c => c !== 'default').sort();

  const coveragePct = sizingResult.system_kWp > 0
    ? (sizingResult.installed_kWp / sizingResult.system_kWp) * 100
    : 0;
  const coverageColor = coveragePct >= 95 ? 'text-emerald-400' : coveragePct >= 80 ? 'text-gold' : 'text-red-400';

  if (isLoading) {
    return (
      <div className="p-6 bg-dark-1 border border-dark-4 rounded-2xl shadow-2xl h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold mb-4"></div>
        <p className="text-cream-muted text-sm font-medium animate-pulse">Cargando catálogo de insumos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-dark-1 border border-dark-4 rounded-2xl shadow-2xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dark-4">
          <div className="p-2 bg-[#C49825]/10 rounded-lg text-gold border border-[#C49825]/20">
            <Zap className="h-6 w-6 text-[#C49825]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gold uppercase tracking-wide">Dimensionamiento del Sistema</h2>
            <p className="text-cream-muted text-xs">
              Configura y optimiza los parámetros de diseño fotovoltaico.
            </p>
          </div>
        </div>

        {/* Inputs section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Panel Selection from Inventory */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Panel Solar (Catálogo)</label>
            <select
              value={selectedPanelId}
              onChange={(e) => setSelectedPanelId(e.target.value)}
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2 rounded-xl focus:outline-none transition-colors cursor-pointer text-sm font-medium truncate"
            >
              {panelOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="manual">Personalizado (Manual)</option>
            </select>
            
            {selectedPanelId === 'manual' ? (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  value={manualPanelWp}
                  onChange={(e) => setManualPanelWp(Number(e.target.value) || 0)}
                  placeholder="Potencia (Wp)"
                  className="w-1/2 bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-1.5 rounded-lg focus:outline-none transition-colors font-mono text-xs"
                />
                <input
                  type="number"
                  value={manualPanelVoc}
                  onChange={(e) => setManualPanelVoc(Number(e.target.value) || 0)}
                  placeholder="Voc (V)"
                  className="w-1/2 bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-1.5 rounded-lg focus:outline-none transition-colors font-mono text-xs"
                />
              </div>
            ) : (
              <div className="flex gap-4 px-1">
                <p className="text-[10px] text-cream-muted">Potencia: <span className="text-cream font-mono">{panelSpecs.wp}W</span></p>
                <p className="text-[10px] text-cream-muted">Voc: <span className="text-cream font-mono">{panelSpecs.voc}V</span></p>
              </div>
            )}
          </div>

          {/* Inverter Selection from Inventory */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide flex justify-between">
              <span>Inversor (Catálogo)</span>
              <span className="text-gold text-[10px]">Ideal: {targetInverterKw}kW</span>
            </label>
            <select
              value={selectedInverterId}
              onChange={(e) => setSelectedInverterId(e.target.value)}
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2 rounded-xl focus:outline-none transition-colors cursor-pointer text-sm font-medium truncate"
            >
              <optgroup label="Inversores y Microinversores">
                {allInverters.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
              <option value="manual">Personalizado (Manual)</option>
            </select>
            
            {selectedInverterId === 'manual' ? (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  step="0.1"
                  value={manualInverterKw}
                  onChange={(e) => setManualInverterKw(Number(e.target.value) || 0)}
                  placeholder="Capacidad (kW)"
                  className="w-1/2 bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-1.5 rounded-lg focus:outline-none transition-colors font-mono text-xs"
                />
                <input
                  type="number"
                  value={manualInverterMaxVdc}
                  onChange={(e) => setManualInverterMaxVdc(Number(e.target.value) || 0)}
                  placeholder="Vdc Máx (V)"
                  className="w-1/2 bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-1.5 rounded-lg focus:outline-none transition-colors font-mono text-xs"
                />
              </div>
            ) : (
              <div className="flex gap-4 px-1">
                <p className="text-[10px] text-cream-muted">Capacidad: <span className="text-cream font-mono">{inverterSpecs.kw}kW</span></p>
                <p className="text-[10px] text-cream-muted">Vdc Máx: <span className="text-cream font-mono">{inverterSpecs.maxVdc}V</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Structured Results Display Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Capacity Card */}
          <div className="p-4 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Capacidad del Sistema</span>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-black font-mono text-gold">{sizingResult.installed_kWp.toFixed(2)}</span>
                <span className="text-xs text-gold ml-0.5">kWp</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-cream-muted block">Objetivo</span>
                <span className="text-xs font-mono font-bold text-cream">{sizingResult.system_kWp.toFixed(2)} kWp</span>
                <span className={`text-[11px] font-mono font-bold block mt-0.5 ${coverageColor}`}>
                  {coveragePct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Panels Card */}
          <div className="p-4 bg-dark-1/55 border border-dark-4 rounded-xl space-y-2 relative group">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Total Paneles</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={overrideNumPanels !== undefined ? overrideNumPanels : sizingResult.num_panels}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setOverrideNumPanels(val);
                }}
                className={`w-16 bg-transparent border-b-2 ${overrideNumPanels !== undefined ? 'border-gold text-gold' : 'border-dark-4 text-cream'} focus:border-gold/50 outline-none text-2xl font-black font-mono text-center transition-colors`}
              />
              <span className="text-xs text-cream-muted">módulos</span>
            </div>
            <span className="text-[10px] text-cream-muted block">de {panelSpecs.wp}W c/u</span>
            {overrideNumPanels !== undefined && (
              <button 
                onClick={() => setOverrideNumPanels(undefined)}
                className="absolute top-2 right-2 text-[9px] text-red-400 hover:text-red-300 font-bold bg-red-400/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Reset
              </button>
            )}
          </div>

          {/* Inverters Card */}
          <div className="p-4 bg-dark-1/55 border border-dark-4 rounded-xl space-y-2 relative group">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Total Inversores</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={overrideNumInverters !== undefined ? overrideNumInverters : sizingResult.num_inverters}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setOverrideNumInverters(val);
                }}
                className={`w-16 bg-transparent border-b-2 ${overrideNumInverters !== undefined ? 'border-gold text-gold' : 'border-dark-4 text-cream'} focus:border-gold/50 outline-none text-2xl font-black font-mono text-center transition-colors`}
              />
              <span className="text-xs text-cream-muted">equipos</span>
            </div>
            <span className="text-[10px] text-cream-muted block">de {inverterSpecs.kw}kW c/u</span>
            {overrideNumInverters !== undefined && (
              <button 
                onClick={() => setOverrideNumInverters(undefined)}
                className="absolute top-2 right-2 text-[9px] text-red-400 hover:text-red-300 font-bold bg-red-400/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Reset
              </button>
            )}
          </div>

          {/* Electrical Strings Breakdown Card */}
          <div className="p-4 bg-dark-1/55 border border-dark-4 rounded-xl space-y-2 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Configuración de Strings</span>
              {sizingResult.is_electrical_safe ? (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Seguro (Voc ok)
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-full text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <AlertOctagon className="h-3 w-3" /> ¡Peligro! Excede inversor
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-dark-3/30 border border-dark-4 rounded-lg">
                <span className="text-[9px] text-cream-muted uppercase block font-semibold">Cadenas</span>
                <span className="text-lg font-black text-cream font-mono">{sizingResult.num_strings}</span>
              </div>
              <div className="p-2 bg-dark-3/30 border border-dark-4 rounded-lg">
                <span className="text-[9px] text-cream-muted uppercase block font-semibold">Paneles/Str</span>
                <span className="text-lg font-black text-cream font-mono">{sizingResult.panels_per_string}</span>
              </div>
              <div className="p-2 bg-dark-3/30 border border-dark-4 rounded-lg">
                <span className="text-[9px] text-cream-muted uppercase block font-semibold">Voc String</span>
                <span className={`text-lg font-black font-mono ${sizingResult.is_electrical_safe ? 'text-cream' : 'text-red-400'}`}>
                  {Math.round(sizingResult.string_Voc)}V
                </span>
              </div>
            </div>
          </div>

          {/* Roof Space needed */}
          <div className="p-4 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Espacio en Techo</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black font-mono text-cream">{Math.round(sizingResult.area_m2)}</span>
              <span className="text-xs text-cream-muted">m²</span>
            </div>
            <span className="text-[10px] text-cream-muted block">Área estimada (+15% espaciado)</span>
          </div>

          {/* Annual Production */}
          <div className="p-4 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Producción Anual</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black font-mono text-gold">{Math.round(sizingResult.annual_production_kWh).toLocaleString()}</span>
              <span className="text-xs text-gold">kWh</span>
            </div>
            <span className="text-[10px] text-cream-muted block">Generación estimada 1er año</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-dark-4 flex items-center justify-between text-xs text-cream-muted">
        <div className="flex items-center gap-1.5">
          <Sun className="h-4 w-4 text-gold/60" />
          <span>Radiación: <strong className="text-cream">{psh} hrs solar pico</strong></span>
        </div>
        <div>
          <span>PR: <strong className="text-cream">{(SOLAR_CONSTANTS.PR_DEFAULT * 100).toFixed(0)}%</strong></span>
        </div>
      </div>
    </div>
  );
}
