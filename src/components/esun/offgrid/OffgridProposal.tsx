import React, { useState, useEffect } from 'react';
import { Settings, Battery, Zap, Sun, ShieldCheck } from 'lucide-react';
import { calculateOffGridSystem, type OffGridSystemResult } from '../lib/offgridCalculator';
import type { LoadProfile } from '../esunTypes';
import { getInsumos } from '../../../lib/cotizadorService';
import { SOLAR_CONSTANTS } from '../lib/solarConstants';

interface OffgridProposalProps {
  loadProfile: LoadProfile;
  system?: any;
  onUpdate: (systemResult: any) => void;
}

export default function OffgridProposal({ loadProfile, system, onUpdate }: OffgridProposalProps) {
  const [panelOptions, setPanelOptions] = useState<any[]>([]);
  const [inverterOptions, setInverterOptions] = useState<any[]>([]);
  const [batteryOptions, setBatteryOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Settings
  const [selectedPanelId, setSelectedPanelId] = useState(system?.panel_id || '');
  const [selectedInverterId, setSelectedInverterId] = useState(system?.inverter_id || '');
  const [selectedBatteryId, setSelectedBatteryId] = useState(system?.battery_id || '');
  const [autonomyDays, setAutonomyDays] = useState(system?.autonomyDays || 1);
  const [batteryDoD, setBatteryDoD] = useState(system?.batteryDoD || 0.8);
  const [systemVoltage, setSystemVoltage] = useState(system?.systemVoltage || 48);

  const [manualPanels, setManualPanels] = useState<number | ''>(system?.num_panels || '');
  const [manualInverters, setManualInverters] = useState<number | ''>(system?.num_inverters || '');
  const [manualBatteries, setManualBatteries] = useState<number | ''>(system?.num_batteries || '');

  useEffect(() => {
    async function loadData() {
      try {
        const insumosData = await getInsumos();
        
        const panels = insumosData.filter(i => i.subcategory === 'Panel solar');
        const inverters = insumosData.filter(i => i.subcategory === 'Inversor');
        const batteries = insumosData.filter(i => i.subcategory === 'Material electrico DC' && i.description?.toLowerCase().includes('bater'));

        setPanelOptions(panels);
        setInverterOptions(inverters);
        setBatteryOptions(batteries);

        if (!selectedPanelId && panels.length > 0) setSelectedPanelId(panels[0].id);
        if (!selectedInverterId && inverters.length > 0) setSelectedInverterId(inverters.find(i => i.description.toLowerCase().includes('off-grid'))?.id || inverters[0].id);
        if (!selectedBatteryId && batteries.length > 0) setSelectedBatteryId(batteries[0].id);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading offgrid insumos:", err);
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading || !selectedPanelId || !selectedInverterId || !selectedBatteryId) return;

    const panel = panelOptions.find(p => p.id === selectedPanelId);
    const inverter = inverterOptions.find(i => i.id === selectedInverterId);
    const battery = batteryOptions.find(b => b.id === selectedBatteryId);

    // Extract wattage from panel string
    let panelW = 550;
    if (panel) {
      const match = panel.description.match(/(\d+)W/);
      if (match) panelW = parseInt(match[1]);
    }

    const hsp = SOLAR_CONSTANTS.PSH['default'] || 5.0;
    const result = calculateOffGridSystem({
      loadProfile,
      autonomyDays,
      batteryDoD,
      systemVoltage,
      hsp,
      inverterSurgeFactor: 1.25,
      panelWattage: panelW
    });

    const finalPanels = manualPanels !== '' ? manualPanels : result.numberOfPanels;
    const finalInverters = manualInverters !== '' ? manualInverters : 1;
    const recommendedBatQty = Math.ceil(result.requiredBatteryCapacityAh / 100);
    const finalBatteries = manualBatteries !== '' ? manualBatteries : recommendedBatQty;

    const system_kWp = (finalPanels * panelW) / 1000;
    // Real generation based on installed panels, HSP and system efficiency (0.75)
    const daily_generation_kWh = system_kWp * hsp * 0.75;
    const annual_production_kWh = daily_generation_kWh * 365;

    onUpdate({
      ...result,
      projectType: 'off-grid',
      panel_id: selectedPanelId,
      panel_name: panel?.description || panel?.code,
      panel_code: panel?.code,
      panel_price: Number(panel?.cost_price || panel?.cost || 0),
      inverter_id: selectedInverterId,
      inverter_name: inverter?.description || inverter?.code,
      inverter_code: inverter?.code,
      inverter_price: Number(inverter?.cost_price || inverter?.cost || 0),
      battery_id: selectedBatteryId,
      battery_name: battery?.description || battery?.code,
      battery_code: battery?.code,
      battery_price: Number(battery?.cost_price || battery?.cost || 0),
      autonomyDays,
      batteryDoD,
      systemVoltage,
      panelWattage: panelW,
      num_panels: finalPanels,
      num_inverters: finalInverters,
      num_batteries: finalBatteries,
      recommended_panels: result.numberOfPanels,
      recommended_inverters: 1,
      recommended_batteries: recommendedBatQty,
      system_kWp,
      installed_kWp: system_kWp,
      daily_generation_kWh,
      annual_production_kWh,
      area_m2: finalPanels * 2.58
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPanelId, selectedInverterId, selectedBatteryId, autonomyDays, batteryDoD, systemVoltage,
    manualPanels, manualInverters, manualBatteries,
    isLoading, loadProfile
  ]);

  if (isLoading) {
    return <div className="text-gold text-center py-4">Cargando catálogo...</div>;
  }

  return (
    <div className="bg-dark-2/90 border border-dark-4 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-dark-1 border border-dark-4 rounded-2xl shadow-inner">
          <Settings className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-black text-cream">Dimensionamiento Aislado</h2>
          <p className="text-sm text-cream-muted">Ajuste de componentes para sistema Off-Grid</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="space-y-1">
          <label className="text-xs text-cream-muted uppercase font-bold">Panel Solar</label>
          <select 
            value={selectedPanelId}
            onChange={e => setSelectedPanelId(e.target.value)}
            className="w-full bg-dark-1 border border-dark-4 text-cream p-2.5 rounded-xl focus:border-gold"
          >
            {panelOptions.map(p => <option key={p.id} value={p.id}>{p.description}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-cream-muted uppercase font-bold">Inversor Aislado</label>
          <select 
            value={selectedInverterId}
            onChange={e => setSelectedInverterId(e.target.value)}
            className="w-full bg-dark-1 border border-dark-4 text-cream p-2.5 rounded-xl focus:border-gold"
          >
            {inverterOptions.map(i => <option key={i.id} value={i.id}>{i.description}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-cream-muted uppercase font-bold">Batería</label>
          <select 
            value={selectedBatteryId}
            onChange={e => setSelectedBatteryId(e.target.value)}
            className="w-full bg-dark-1 border border-dark-4 text-cream p-2.5 rounded-xl focus:border-gold"
          >
            {batteryOptions.map(b => <option key={b.id} value={b.id}>{b.description}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-cream-muted uppercase font-bold">Días de Autonomía</label>
          <select 
            value={autonomyDays}
            onChange={e => setAutonomyDays(parseFloat(e.target.value))}
            className="w-full bg-dark-1 border border-dark-4 text-cream p-2.5 rounded-xl focus:border-gold"
          >
            <option value={0.5}>Medio Día (12h)</option>
            <option value={1}>1 Día (24h)</option>
            <option value={2}>2 Días (48h)</option>
            <option value={3}>3 Días (72h)</option>
          </select>
        </div>
      </div>

      {system && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-dark-4 pt-6">
          <div className="bg-dark-1 border border-dark-4 p-4 rounded-2xl flex items-start gap-4">
            <Sun className="w-8 h-8 text-gold shrink-0 mt-1" />
            <div className="w-full">
              <div className="flex justify-between items-center w-full mb-2">
                <p className="text-xs text-cream-muted uppercase font-bold tracking-wider">Arreglo FV</p>
                <span className="text-[9px] bg-dark-4 text-cream-muted px-2 py-0.5 rounded uppercase tracking-widest font-bold">Ref: {system.recommended_panels} pz</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="number"
                  min="0"
                  value={manualPanels === '' ? system.recommended_panels : manualPanels}
                  onChange={e => setManualPanels(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  onFocus={e => e.target.select()}
                  className="w-16 bg-dark-2 border border-dark-4 focus:border-gold/50 text-cream px-2 py-1 rounded-lg focus:outline-none text-center font-bold"
                />
                <span className="text-sm font-bold text-cream">Paneles</span>
              </div>
              <p className="text-xs text-gold">{(system.system_kWp).toFixed(2)} kWp instalados</p>
            </div>
          </div>

          <div className="bg-dark-1 border border-dark-4 p-4 rounded-2xl flex items-start gap-4">
            <Zap className="w-8 h-8 text-emerald-400 shrink-0 mt-1" />
            <div className="w-full">
              <div className="flex justify-between items-center w-full mb-2">
                <p className="text-xs text-cream-muted uppercase font-bold tracking-wider">Inversores</p>
                <span className="text-[9px] bg-dark-4 text-cream-muted px-2 py-0.5 rounded uppercase tracking-widest font-bold">Ref: {system.recommended_inverters} pz</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="number"
                  min="0"
                  value={manualInverters === '' ? system.recommended_inverters : manualInverters}
                  onChange={e => setManualInverters(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  onFocus={e => e.target.select()}
                  className="w-16 bg-dark-2 border border-dark-4 focus:border-gold/50 text-cream px-2 py-1 rounded-lg focus:outline-none text-center font-bold"
                />
                <span className="text-sm font-bold text-cream">Piezas</span>
              </div>
              <p className="text-xs text-emerald-400">Demanda pico: {(system.requiredInverterW / 1000).toFixed(1)} kW</p>
            </div>
          </div>

          <div className="bg-dark-1 border border-dark-4 p-4 rounded-2xl flex items-start gap-4">
            <Battery className="w-8 h-8 text-blue-400 shrink-0 mt-1" />
            <div className="w-full">
              <div className="flex justify-between items-center w-full mb-2">
                <p className="text-xs text-cream-muted uppercase font-bold tracking-wider">Baterías</p>
                <span className="text-[9px] bg-dark-4 text-cream-muted px-2 py-0.5 rounded uppercase tracking-widest font-bold">Ref: {system.recommended_batteries} pz</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="number"
                  min="0"
                  value={manualBatteries === '' ? system.recommended_batteries : manualBatteries}
                  onChange={e => setManualBatteries(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  onFocus={e => e.target.select()}
                  className="w-16 bg-dark-2 border border-dark-4 focus:border-gold/50 text-cream px-2 py-1 rounded-lg focus:outline-none text-center font-bold"
                />
                <span className="text-sm font-bold text-cream">Piezas</span>
              </div>
              <p className="text-xs text-blue-400">Req: {(system.requiredBatteryCapacityWh / 1000).toFixed(1)} kWh</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
