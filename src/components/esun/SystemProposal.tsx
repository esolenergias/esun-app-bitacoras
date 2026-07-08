import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, AlertOctagon, Sun, Maximize2, Zap, Landmark } from 'lucide-react';
import { SOLAR_CONSTANTS } from './lib/solarConstants';
import { calculateSizing, type SizingResult } from './lib/solarCalculator';
import type { CFEData } from './lib/cfeParser';

interface SystemProposalProps {
  cfeData: CFEData;
  system?: any; // Loaded quote system settings
  onUpdate: (systemResult: any) => void;
}

export default function SystemProposal({ cfeData, system, onUpdate }: SystemProposalProps) {
  const [panelVocStr, setPanelVocStr] = useState(String(system?.panel_Voc || 50));
  const [panelWpStr, setPanelWpStr] = useState(String(system?.panel_Wp || 550));
  const [inverterMaxVdcStr, setInverterMaxVdcStr] = useState(String(system?.inverter_max_vdc || 600));

  const [city, setCity] = useState(system?.city || 'CDMX');
  const [panelWp, setPanelWp] = useState(system?.panel_Wp || 550);
  const [panelVoc, setPanelVoc] = useState(system?.panel_Voc || 50);
  const [inverterMaxVdc, setInverterMaxVdc] = useState(system?.inverter_max_vdc || 600);

  // We can calculate target inverter kW automatically
  // Inverter kW ≈ system_kWp / DC_AC_RATIO
  const psh = SOLAR_CONSTANTS.PSH[city] || SOLAR_CONSTANTS.PSH['default'];
  const targetkWp = (cfeData.monthly_kWh * SOLAR_CONSTANTS.SIZING_MARGIN) / (psh * SOLAR_CONSTANTS.DAYS_IN_MONTH * SOLAR_CONSTANTS.PR_DEFAULT);
  const targetInverterKw = parseFloat((targetkWp / SOLAR_CONSTANTS.DC_AC_RATIO).toFixed(2));

  const sizingResult = calculateSizing({
    monthly_kWh: cfeData.monthly_kWh,
    city,
    panel_Wp: panelWp,
    panel_Voc: panelVoc,
    inverter_max_vdc: inverterMaxVdc,
    inverter_kw: targetInverterKw,
    historic_consumptions: cfeData.historic_consumptions
  });

  // Run calculation whenever inputs change
  useEffect(() => {
    onUpdate({
      ...sizingResult,
      panel_Wp: panelWp,
      panel_Voc: panelVoc,
      inverter_max_vdc: inverterMaxVdc,
      city
    });
  }, [cfeData.monthly_kWh, city, panelWp, panelVoc, inverterMaxVdc, cfeData.historic_consumptions, onUpdate]);

  const cityOptions = Object.keys(SOLAR_CONSTANTS.PSH).filter(c => c !== 'default').sort();

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
          {/* City */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Ciudad (PSH)</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2 rounded-xl focus:outline-none transition-colors cursor-pointer text-sm font-medium"
            >
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c} ({SOLAR_CONSTANTS.PSH[c]} PSH)
                </option>
              ))}
              <option value="default">
                Otro (Promedio México: {SOLAR_CONSTANTS.PSH['default']} PSH)
              </option>
            </select>
          </div>

          {/* Panel Wp */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Potencia del Panel (Wp)</label>
            <select
              value={panelWpStr}
              onChange={(e) => {
                const val = e.target.value;
                setPanelWpStr(val);
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed) && parsed > 0) {
                  setPanelWp(parsed);
                }
              }}
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2 rounded-xl focus:outline-none transition-colors cursor-pointer text-sm font-medium"
            >
              <option value={400}>400W</option>
              <option value={440}>440W</option>
              <option value={550}>550W</option>
              <option value={600}>600W</option>
              <option value={635}>635W</option>
            </select>
          </div>

          {/* Panel Voc */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Voc del Panel (V)</label>
            <input
              type="number"
              value={panelVocStr}
              onChange={(e) => {
                const val = e.target.value;
                setPanelVocStr(val);
                const parsed = parseFloat(val);
                if (!isNaN(parsed) && parsed > 0) {
                  setPanelVoc(parsed);
                }
              }}
              placeholder="Ej. 50"
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2 rounded-xl focus:outline-none transition-colors font-mono text-sm"
            />
          </div>

          {/* Inverter Max Vdc */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Voltaje Máx Inversor (Vdc)</label>
            <input
              type="number"
              value={inverterMaxVdcStr}
              onChange={(e) => {
                const val = e.target.value;
                setInverterMaxVdcStr(val);
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed) && parsed > 0) {
                  setInverterMaxVdc(parsed);
                }
              }}
              placeholder="Ej. 600"
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2 rounded-xl focus:outline-none transition-colors font-mono text-sm"
            />
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
              </div>
            </div>
          </div>

          {/* Panels Card */}
          <div className="p-4 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Total Paneles</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-cream">{sizingResult.num_panels}</span>
              <span className="text-xs text-cream-muted">módulos</span>
            </div>
            <span className="text-[10px] text-cream-muted block">de {panelWp}W c/u</span>
          </div>

          {/* Electrical Strings Breakdown Card */}
          <div className="p-4 bg-dark-1/55 border border-dark-4 rounded-xl space-y-2 sm:col-span-2">
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
