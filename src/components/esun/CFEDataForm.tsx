import React, { useState, useEffect } from 'react';
import { Save, FileText, ArrowRight, Zap, Info } from 'lucide-react';
import type { CFEData, CFEHistoricPeriod } from './lib/cfeParser';

// Helper to auto-generate CFE-like historic periods retroactively based on current month/year
const generateDefaultPeriods = (isBim: boolean, currentKwh: number, currentAmount: number): CFEHistoricPeriod[] => {
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const result: CFEHistoricPeriod[] = [];
  const now = new Date();
  let currentMonthIdx = now.getMonth();
  let currentYear = now.getFullYear() % 100;
  
  const count = isBim ? 6 : 12;
  const step = isBim ? 2 : 1;
  
  for (let i = 0; i < count; i++) {
    const mStr = months[currentMonthIdx];
    const yStr = String(currentYear).padStart(2, '0');
    result.push({
      period: `${mStr} ${yStr}`,
      kwh: currentKwh || 1200,
      amount: currentAmount || 5400,
      status: "PAGADO"
    });
    
    currentMonthIdx -= step;
    if (currentMonthIdx < 0) {
      currentMonthIdx += 12;
      currentYear -= 1;
    }
  }
  return result;
};

interface CFEDataFormProps {
  data: CFEData;
  onSubmit: (finalData: CFEData) => void;
}

export default function CFEDataForm({ data, onSubmit }: CFEDataFormProps) {
  const [clientName, setClientName] = useState(data.client_name || '');
  const [serviceNumber, setServiceNumber] = useState(data.service_number || '');
  const [tariff, setTariff] = useState(data.tariff || 'DAC');
  const [isBimonthly, setIsBimonthly] = useState(data.is_bimonthly);
  const [monthlyKWh, setMonthlyKWh] = useState(data.monthly_kWh || 0);
  const [bimonthlyKWh, setBimonthlyKWh] = useState(data.bimonthly_kWh || 0);
  const [totalMxnStr, setTotalMxnStr] = useState(String(data.total_mxn || 0));
  const [tariffRateStr, setTariffRateStr] = useState(String(data.tariff_rate || 4.50));

  const [totalMxn, setTotalMxn] = useState(data.total_mxn || 0);
  const [tariffRate, setTariffRate] = useState(data.tariff_rate || 4.50);
  const [demandKw, setDemandKw] = useState(data.demand_kw || 0);
  const [powerFactor, setPowerFactor] = useState(data.power_factor || 0);
  const [demandKwStr, setDemandKwStr] = useState(data.demand_kw ? String(data.demand_kw) : '');
  const [powerFactorStr, setPowerFactorStr] = useState(data.power_factor ? String(data.power_factor) : '');

  // New fields: Last payment info (derived automatically from the first period of the historic list)
  const [lastPaymentDate, setLastPaymentDate] = useState(data.last_payment_date || '');
  const [lastPaymentAmountStr, setLastPaymentAmountStr] = useState(data.last_payment_amount ? String(data.last_payment_amount) : '');
  const [lastPaymentAmount, setLastPaymentAmount] = useState(data.last_payment_amount || 0);

  // New fields: Historic periods list
  const isBimTariff = !tariff.startsWith('GDM') && !tariff.startsWith('APM') && !tariff.startsWith('RAM') && !tariff.startsWith('DIS') && !tariff.startsWith('DI');
  const initialPeriods = data.historic_periods && data.historic_periods.length === (isBimTariff ? 6 : 12)
    ? data.historic_periods
    : generateDefaultPeriods(isBimTariff, isBimTariff ? (data.bimonthly_kWh || 1200) : (data.monthly_kWh || 600), data.total_mxn || 5400);

  const [historicPeriods, setHistoricPeriods] = useState<CFEHistoricPeriod[]>(initialPeriods);
  const [historicKwhStr, setHistoricKwhStr] = useState<string[]>(initialPeriods.map(p => String(p.kwh)));
  const [historicAmountStr, setHistoricAmountStr] = useState<string[]>(initialPeriods.map(p => String(p.amount)));

  // Sync is_bimonthly and adapt historic periods length when tariff changes
  useEffect(() => {
    const isBim = !tariff.startsWith('GDM') && !tariff.startsWith('APM') && !tariff.startsWith('RAM') && !tariff.startsWith('DIS') && !tariff.startsWith('DI');
    setIsBimonthly(isBim);
    
    // Sync monthly/bimonthly kWh fields
    if (isBim) {
      setMonthlyKWh(Math.round(bimonthlyKWh / 2));
    } else {
      setMonthlyKWh(bimonthlyKWh);
    }

    const requiredLength = isBim ? 6 : 12;
    if (historicPeriods.length !== requiredLength) {
      const fresh = generateDefaultPeriods(isBim, isBim ? bimonthlyKWh : monthlyKWh, totalMxn);
      setHistoricPeriods(fresh);
      setHistoricKwhStr(fresh.map(p => String(p.kwh)));
      setHistoricAmountStr(fresh.map(p => String(p.amount)));
    }
  }, [tariff, bimonthlyKWh]);

  // Sync last payment date and amount automatically from the most recent period (index 0) of the table
  useEffect(() => {
    if (historicPeriods.length > 0) {
      const latest = historicPeriods[0];
      setLastPaymentDate(latest.period);
      setLastPaymentAmount(latest.amount);
      setLastPaymentAmountStr(String(latest.amount));
    }
  }, [historicPeriods]);

  // Handle bimonthly kWh changes
  const handleBimonthlyChange = (val: number) => {
    setBimonthlyKWh(val);
    if (isBimonthly) {
      setMonthlyKWh(Math.round(val / 2));
    } else {
      setMonthlyKWh(val);
    }
  };

  // Handle monthly kWh changes
  const handleMonthlyChange = (val: number) => {
    setMonthlyKWh(val);
    if (isBimonthly) {
      setBimonthlyKWh(val * 2);
    } else {
      setBimonthlyKWh(val);
    }
  };

  // Auto calculate tariff rate when consumption or total MXN changes
  const handleAutoCalculateRate = () => {
    const divisor = isBimonthly ? bimonthlyKWh : monthlyKWh;
    if (divisor > 0 && totalMxn > 0) {
      const calculated = parseFloat((totalMxn / divisor).toFixed(2));
      setTariffRate(calculated);
      setTariffRateStr(String(calculated));
    }
  };

  // Handle cell edits inside historic periods table
  const handleHistoricCellChange = (index: number, field: 'period' | 'kwh' | 'amount' | 'status', value: string) => {
    const updatedPeriods = [...historicPeriods];
    
    if (field === 'kwh') {
      const shadowKwh = [...historicKwhStr];
      shadowKwh[index] = value;
      setHistoricKwhStr(shadowKwh);

      const parsed = parseInt(value) || 0;
      updatedPeriods[index] = { ...updatedPeriods[index], kwh: parsed };
    } else if (field === 'amount') {
      const shadowAmount = [...historicAmountStr];
      shadowAmount[index] = value;
      setHistoricAmountStr(shadowAmount);

      const parsed = parseFloat(value) || 0;
      updatedPeriods[index] = { ...updatedPeriods[index], amount: parsed };
    } else if (field === 'period') {
      updatedPeriods[index] = { ...updatedPeriods[index], period: value.toUpperCase() };
    } else if (field === 'status') {
      updatedPeriods[index] = { ...updatedPeriods[index], status: value.toUpperCase() };
    }

    setHistoricPeriods(updatedPeriods);

    // Recalculate average consumption of the main field based on historic inputs
    if (field === 'kwh') {
      const sum = updatedPeriods.reduce((acc, p) => acc + p.kwh, 0);
      const avg = Math.round(sum / updatedPeriods.length);
      if (isBimonthly) {
        setBimonthlyKWh(avg);
        setMonthlyKWh(Math.round(avg / 2));
      } else {
        setMonthlyKWh(avg);
        setBimonthlyKWh(avg);
      }
    }
  };

  const showDemand = tariff === 'PDBT' || tariff === 'GDBT' || tariff === 'GDMTH';
  const showPowerFactor = showDemand && demandKw > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData: CFEData = {
      client_name: clientName,
      service_number: serviceNumber || undefined,
      tariff,
      monthly_kWh: monthlyKWh,
      bimonthly_kWh: bimonthlyKWh,
      total_mxn: parseFloat(totalMxnStr) || 0,
      tariff_rate: parseFloat(tariffRateStr) || 0,
      demand_kw: showDemand ? demandKw : undefined,
      power_factor: showPowerFactor ? powerFactor : undefined,
      is_bimonthly: isBimonthly,
      last_payment_date: lastPaymentDate || undefined,
      last_payment_amount: lastPaymentAmount || undefined,
      historic_periods: historicPeriods
    };
    onSubmit(finalData);
  };

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 bg-dark-1 border border-dark-4 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dark-4">
        <div className="p-2 bg-[#C49825]/10 rounded-lg text-gold border border-[#C49825]/20">
          <FileText className="h-6 w-6 text-[#C49825]" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-gold uppercase tracking-wide">Verificar Datos del Recibo</h2>
          <p className="text-cream-muted text-xs">
            Revisa y ajusta los valores detectados del recibo de CFE.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Nombre del Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              required
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors"
            />
          </div>

          {/* Service Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Número de Servicio</label>
            <input
              type="text"
              value={serviceNumber}
              onChange={(e) => setServiceNumber(e.target.value.replace(/\D/g, ''))}
              maxLength={18}
              placeholder="Ej. 123456789012"
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Tariff */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Tarifa CFE</label>
            <select
              value={tariff}
              onChange={(e) => setTariff(e.target.value)}
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors cursor-pointer"
            >
              <option value="1">Tarifa 1 (Residencial Básica)</option>
              <option value="1A">Tarifa 1A (Residencial Climas Cálidos)</option>
              <option value="1B">Tarifa 1B (Residencial Climas Cálidos)</option>
              <option value="1C">Tarifa 1C (Residencial Climas Cálidos)</option>
              <option value="1D">Tarifa 1D (Residencial Climas Cálidos)</option>
              <option value="1E">Tarifa 1E (Residencial Climas Cálidos)</option>
              <option value="1F">Tarifa 1F (Residencial Climas Cálidos)</option>
              <option value="DAC">Tarifa DAC (Doméstica de Alto Consumo)</option>
              <option value="PDBT">Tarifa PDBT (Pequeña Demanda Baja Tensión)</option>
              <option value="GDBT">Tarifa GDBT (Gran Demanda Baja Tensión)</option>
              <option value="GDMTO">Tarifa GDMTO (Gran Demanda Media Tensión Ordinaria)</option>
              <option value="GDMTH">Tarifa GDMTH (Gran Demanda Media Tensión Horaria)</option>
            </select>
          </div>

          {/* Billing Period (Read-only status derived from Tariff) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Frecuencia de Facturación</label>
            <div className="w-full bg-dark-1/55 border border-dark-4 text-cream-muted px-3.5 py-2.5 rounded-xl flex items-center gap-2">
              <Info className="h-4 w-4 text-gold/60" />
              <span className="text-sm font-medium">
                {isBimonthly ? 'Bimestral (Residencial)' : 'Mensual (Comercial / Industrial)'}
              </span>
            </div>
          </div>

          {/* Bimonthly Consumption - Hidden/Disabled if monthly */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">
              Consumo Bimestral (kWh)
            </label>
            <input
              type="number"
              value={bimonthlyKWh || ''}
              onChange={(e) => handleBimonthlyChange(parseInt(e.target.value) || 0)}
              disabled={!isBimonthly}
              placeholder={isBimonthly ? "Ej. 1200" : "N/A (Mensual)"}
              className={`w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors font-mono ${
                !isBimonthly ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Monthly Consumption */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">
              Consumo Mensual Equivalente (kWh)
            </label>
            <input
              type="number"
              value={monthlyKWh || ''}
              onChange={(e) => handleMonthlyChange(parseInt(e.target.value) || 0)}
              placeholder="Ej. 600"
              required
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Total CFE Invoice MXN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Total a Pagar ($ MXN)</label>
            <input
              type="number"
              step="0.01"
              value={totalMxnStr}
              onChange={(e) => {
                const val = e.target.value;
                setTotalMxnStr(val);
                const parsed = parseFloat(val);
                if (!isNaN(parsed) && parsed >= 0) {
                  setTotalMxn(parsed);
                }
              }}
              placeholder="Ej. 2500"
              required
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Tariff Rate per kWh */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-cream uppercase tracking-wide">Tarifa Promedio ($ MXN/kWh)</label>
              {(totalMxn > 0 && (isBimonthly ? bimonthlyKWh : monthlyKWh) > 0) && (
                <button
                  type="button"
                  onClick={handleAutoCalculateRate}
                  className="text-[10px] font-bold text-gold hover:text-gold-light hover:underline uppercase tracking-wide"
                >
                  Auto-calcular
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              value={tariffRateStr}
              onChange={(e) => {
                const val = e.target.value;
                setTariffRateStr(val);
                const parsed = parseFloat(val);
                if (!isNaN(parsed) && parsed >= 0) {
                  setTariffRate(parsed);
                }
              }}
              placeholder="Ej. 4.50"
              required
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Demand KW (visible for PDBT, GDBT, GDMTH) */}
          {showDemand && (
            <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
              <label className="text-xs font-semibold text-cream uppercase tracking-wide">Demanda Contratada (kW)</label>
              <input
                type="number"
                step="0.1"
                value={demandKwStr}
                onChange={(e) => {
                  const val = e.target.value;
                  setDemandKwStr(val);
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed) && parsed >= 0) {
                    setDemandKw(parsed);
                  } else {
                    setDemandKw(0);
                  }
                }}
                placeholder="Ej. 15.5"
                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
              />
            </div>
          )}

          {/* Power Factor (visible if demand exists) */}
          {showPowerFactor && (
            <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
              <label className="text-xs font-semibold text-cream uppercase tracking-wide">Factor de Potencia (%)</label>
              <input
                type="number"
                step="0.1"
                max={100}
                min={0}
                value={powerFactorStr}
                onChange={(e) => {
                  const val = e.target.value;
                  setPowerFactorStr(val);
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed) && parsed >= 0) {
                    setPowerFactor(parsed);
                  } else {
                    setPowerFactor(0);
                  }
                }}
                placeholder="Ej. 95"
                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
              />
            </div>
          )}

          {/* Last Payment Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Fecha del Último Pago</label>
            <input
              type="text"
              value={lastPaymentDate}
              onChange={(e) => setLastPaymentDate(e.target.value)}
              placeholder="Ej. 15 ENE 26 o 2026-01-15"
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors"
            />
          </div>

          {/* Last Payment Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cream uppercase tracking-wide">Monto del Último Pago ($ MXN)</label>
            <input
              type="number"
              step="0.01"
              value={lastPaymentAmountStr}
              onChange={(e) => {
                const val = e.target.value;
                setLastPaymentAmountStr(val);
                const parsed = parseFloat(val);
                if (!isNaN(parsed) && parsed >= 0) {
                  setLastPaymentAmount(parsed);
                } else {
                  setLastPaymentAmount(0);
                }
              }}
              placeholder="Ej. 3450"
              className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors font-mono"
            />
          </div>
        </div>

        {/* Historic Consumptions Section */}
        <div className="border-t border-dark-4 pt-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gold uppercase tracking-wide">Historial de Consumo y Pagos (Último Año)</h3>
            <p className="text-cream-muted text-[11px] mt-0.5 leading-relaxed">
              Edita directamente la tabla histórica del recibo de CFE. El primer periodo (Fila 1) representa el periodo facturado actual y actualizará el campo de "Último Pago" automáticamente.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-dark-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-dark-2 text-gold border-b border-dark-4 select-none">
                  <th className="p-3 font-semibold uppercase tracking-wider">Periodo</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-center">kWh Consumidos</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-center">Importe ($ MXN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4 bg-dark-1/30">
                {historicPeriods.map((p, idx) => (
                  <tr key={idx} className="hover:bg-dark-2/45 transition-colors">
                    {/* Period Input */}
                    <td className="p-2 w-1/3">
                      <input
                        type="text"
                        value={p.period}
                        onChange={(e) => handleHistoricCellChange(idx, 'period', e.target.value)}
                        placeholder="Ej. ENE 26"
                        required
                        className="w-full bg-transparent focus:bg-dark-1 border border-transparent focus:border-gold/30 text-cream px-2 py-1.5 rounded focus:outline-none transition-colors font-mono font-bold uppercase"
                      />
                    </td>
                    {/* kWh Input */}
                    <td className="p-2 w-1/3">
                      <input
                        type="number"
                        value={historicKwhStr[idx] || ''}
                        onChange={(e) => handleHistoricCellChange(idx, 'kwh', e.target.value)}
                        placeholder="kWh"
                        required
                        className="w-full bg-transparent focus:bg-dark-1 border border-transparent focus:border-gold/30 text-cream px-2 py-1.5 rounded focus:outline-none transition-colors font-mono text-center"
                      />
                    </td>
                    {/* Amount Input */}
                    <td className="p-2 w-1/3">
                      <input
                        type="number"
                        step="0.01"
                        value={historicAmountStr[idx] || ''}
                        onChange={(e) => handleHistoricCellChange(idx, 'amount', e.target.value)}
                        placeholder="Importe"
                        required
                        className="w-full bg-transparent focus:bg-dark-1 border border-transparent focus:border-gold/30 text-cream px-2 py-1.5 rounded focus:outline-none transition-colors font-mono text-center text-gold"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-dark-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#C49825] hover:bg-gold-light text-dark-1 font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-gold/10"
          >
            Generar Propuesta
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
