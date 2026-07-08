import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { DollarSign, Landmark, TrendingUp, Calendar, ShieldCheck, Edit3 } from 'lucide-react';
import { SOLAR_CONSTANTS } from './lib/solarConstants';
import { calculateFinancials, FinancialResult } from './lib/financialEngine';
import { CFEData } from './lib/cfeParser';

interface FinancialAnalysisProps {
  system: any;
  cfeData: CFEData;
  financialParams: any;
  onChangeFinancialParams: (params: any) => void;
}

export default function FinancialAnalysis({
  system,
  cfeData,
  financialParams,
  onChangeFinancialParams
}: FinancialAnalysisProps) {
  const { isCredit, interestRate, termMonths, manualCost } = financialParams;
  const [isEditingCost, setIsEditingCost] = useState(false);

  // Compute financials based on system inputs
  const finInput = {
    system_kWp: system.system_kWp,
    installed_kWp: system.installed_kWp,
    annual_production_kWh: system.annual_production_kWh,
    monthly_consumption_kWh: cfeData.monthly_kWh,
    tariff_rate_mxn: cfeData.tariff_rate,
    custom_cost: manualCost
  };

  const results = calculateFinancials(finInput);

  // Calculate Credit Payment parameters
  const investment = results.investment_mxn;
  const r = (interestRate / 100) / 12;
  const n = termMonths;
  const monthlyCreditPayment = r > 0 
    ? (investment * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    : investment / n;

  // Yearly credit payment breakdown
  const creditPaymentsYr: number[] = [];
  let totalCreditPaid = 0;
  for (let yr = 1; yr <= 25; yr++) {
    let activeMonths = 0;
    const startMonth = (yr - 1) * 12;
    const endMonth = yr * 12;

    if (startMonth < n) {
      activeMonths = Math.min(n, endMonth) - startMonth;
    }
    const payment = monthlyCreditPayment * activeMonths;
    creditPaymentsYr.push(payment);
    totalCreditPaid += payment;
  }

  // Adjust metrics for cash vs credit
  const displayInvestment = isCredit ? 0 : investment;
  const displaySavingsYr1 = isCredit 
    ? results.annual_savings_yr1 - creditPaymentsYr[0]
    : results.annual_savings_yr1;

  // NPV under credit: cashflows discounted subtracting credit payments
  let displayNPV = results.npv;
  let displayPayback = results.payback_years;
  let displayROI = results.roi_pct;

  if (isCredit) {
    let npvCredit = 0;
    let cumulativeNetSavings = 0;
    let firstPositiveYr = -1;
    let totalSavingsWithCredit = 0;

    results.cashflows_25yr.forEach((savings, t) => {
      const netSavings = savings - creditPaymentsYr[t];
      totalSavingsWithCredit += netSavings;
      npvCredit += netSavings / Math.pow(1 + SOLAR_CONSTANTS.DISCOUNT_RATE, t + 1);

      cumulativeNetSavings += netSavings;
      if (cumulativeNetSavings > 0 && firstPositiveYr === -1) {
        firstPositiveYr = t + 1;
      }
    });

    displayNPV = npvCredit;
    displayPayback = firstPositiveYr !== -1 ? firstPositiveYr : 99;
    displayROI = totalCreditPaid > 0 ? (totalSavingsWithCredit / totalCreditPaid) * 100 : 0;
  }

  // Minimum fee logic
  const minAnnualFee = cfeData.is_bimonthly ? 600 : 1200;
  const annualCFEPaymentBase = cfeData.total_mxn * (cfeData.is_bimonthly ? 6 : 12);

  // Generate charts data
  const chartsData = Array.from({ length: 25 }, (_, i) => {
    const yr = i + 1;
    const savings = results.cashflows_25yr[i];
    const creditPayment = isCredit ? creditPaymentsYr[i] : 0;
    const netSavings = savings - creditPayment;

    // Cumulative Savings
    let accumulative = 0;
    for (let j = 0; j < yr; j++) {
      accumulative += results.cashflows_25yr[j] - (isCredit ? creditPaymentsYr[j] : 0);
    }
    if (!isCredit) {
      accumulative -= investment; // Subtract initial investment for net balance
    }

    // Line Chart: CFE Payments
    const paymentWithoutSolar = annualCFEPaymentBase * Math.pow(1 + SOLAR_CONSTANTS.TARIFF_ESCALATION, yr - 1);
    const paymentWithSolar = Math.max(
      minAnnualFee * Math.pow(1 + SOLAR_CONSTANTS.TARIFF_ESCALATION, yr - 1),
      paymentWithoutSolar - savings
    );

    return {
      year: yr,
      'Ahorro Neto Anual': netSavings,
      'Ahorro Acumulado': accumulative,
      'Sin Solar': paymentWithoutSolar,
      'Con Solar': paymentWithSolar,
      'Inversión': investment
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-dark-4 p-3.5 rounded-xl shadow-xl font-body">
          <p className="text-xs font-black text-cream mb-2 uppercase tracking-wider">Año {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs font-semibold font-mono flex items-center justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>${Math.round(entry.value).toLocaleString('es-MX')} MXN</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-dark-1 border border-dark-4 rounded-2xl shadow-2xl space-y-6">
      {/* Header and Manual Cost Edit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dark-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#C49825]/10 rounded-lg text-gold border border-[#C49825]/20">
            <TrendingUp className="h-6 w-6 text-[#C49825]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gold uppercase tracking-wide">Análisis Financiero</h2>
            <p className="text-cream-muted text-xs">Proyecciones y retorno de inversión a 25 años.</p>
          </div>
        </div>

        {/* Cost Override Form */}
        <div className="flex items-center gap-2">
          {isEditingCost ? (
            <div className="flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
              <input
                type="number"
                value={manualCost !== undefined ? manualCost : Math.round(investment)}
                onChange={(e) => {
                  const costVal = parseInt(e.target.value) || 0;
                  onChangeFinancialParams({ ...financialParams, manualCost: costVal });
                }}
                placeholder="Costo MXN"
                className="w-32 bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream text-xs px-2.5 py-1.5 rounded-lg focus:outline-none font-mono"
              />
              <button
                onClick={() => setIsEditingCost(false)}
                className="px-2.5 py-1.5 bg-gold text-dark-1 font-bold text-xs rounded-lg hover:bg-gold-light transition-all cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingCost(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-dark-4 bg-dark-3/30 hover:border-gold/30 text-cream-muted hover:text-gold rounded-lg text-xs transition-all cursor-pointer"
            >
              <Edit3 className="h-3 w-3" />
              <span>Ajustar Costo</span>
            </button>
          )}
        </div>
      </div>

      {/* Financing Type Toggles */}
      <div className="flex justify-between items-center bg-dark-3/20 border border-dark-4 p-3 rounded-xl">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChangeFinancialParams({ ...financialParams, isCredit: false })}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              !isCredit 
                ? 'bg-[#C49825] text-dark-1 shadow-md shadow-gold/10' 
                : 'text-cream-muted hover:text-cream hover:bg-dark-3/50'
            }`}
          >
            Contado
          </button>
          <button
            type="button"
            onClick={() => onChangeFinancialParams({ ...financialParams, isCredit: true })}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              isCredit 
                ? 'bg-[#C49825] text-dark-1 shadow-md shadow-gold/10' 
                : 'text-cream-muted hover:text-cream hover:bg-dark-3/50'
            }`}
          >
            Crédito Solar
          </button>
        </div>
        
        {/* Credit Options Slider Panel */}
        {isCredit && (
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-cream-muted font-semibold uppercase tracking-wider text-[10px]">Tasa:</span>
              <span className="text-gold font-bold font-mono">{interestRate}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-cream-muted font-semibold uppercase tracking-wider text-[10px]">Plazo:</span>
              <span className="text-cream font-bold font-mono">{termMonths}m</span>
            </div>
          </div>
        )}
      </div>

      {/* Credit configuration sliders details (Mobile/Responsive expanded view) */}
      {isCredit && (
        <div className="p-4 bg-dark-3/30 border border-dark-4 rounded-xl space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Term Months Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-cream-muted font-semibold uppercase tracking-wider text-[10px]">Plazo de Financiamiento</span>
                <span className="text-cream font-bold font-mono">{termMonths} meses</span>
              </div>
              <input
                type="range"
                min={12}
                max={72}
                step={12}
                value={termMonths}
                onChange={(e) => onChangeFinancialParams({ ...financialParams, termMonths: Number(e.target.value) })}
                className="w-full h-1.5 bg-dark-4 rounded-lg appearance-none cursor-pointer accent-[#C49825]"
              />
              <div className="flex justify-between text-[9px] text-cream-muted font-mono">
                <span>12m</span>
                <span>36m</span>
                <span>72m</span>
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-cream-muted font-semibold uppercase tracking-wider text-[10px]">Tasa de Interés Anual</span>
                <span className="text-gold font-bold font-mono">{interestRate}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={20}
                step={0.5}
                value={interestRate}
                onChange={(e) => onChangeFinancialParams({ ...financialParams, interestRate: Number(e.target.value) })}
                className="w-full h-1.5 bg-dark-4 rounded-lg appearance-none cursor-pointer accent-[#C49825]"
              />
              <div className="flex justify-between text-[9px] text-cream-muted font-mono">
                <span>10%</span>
                <span>15%</span>
                <span>20%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2.5 border-t border-dark-4 text-xs font-semibold">
            <span className="text-cream-muted">Mensualidad Crédito:</span>
            <span className="text-gold font-mono font-black text-sm">
              ${Math.round(monthlyCreditPayment).toLocaleString('es-MX')} MXN
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Investment */}
        <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
          <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">
            {isCredit ? 'Inversión Inicial' : 'Inversión Contado'}
          </span>
          <span className="text-base font-black font-mono text-cream block leading-tight">
            {isCredit ? '$0' : `$${Math.round(displayInvestment).toLocaleString('es-MX')}`}
          </span>
          {isCredit && <span className="text-[9px] text-emerald-400 block font-bold">100% Financiado</span>}
        </div>

        {/* Year 1 Savings */}
        <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
          <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">
            {isCredit ? 'Ahorro Año 1 (Neto)' : 'Ahorro Año 1'}
          </span>
          <span className="text-base font-black font-mono text-gold block leading-tight">
            ${Math.round(displaySavingsYr1).toLocaleString('es-MX')}
          </span>
          <span className="text-[9px] text-cream-muted block font-mono">
            ${Math.round(displaySavingsYr1 / 12).toLocaleString('es-MX')}/mes
          </span>
        </div>

        {/* Payback */}
        <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
          <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">Retorno de Inversión</span>
          <span className="text-base font-black font-mono text-cream block leading-tight">
            {displayPayback === 0 ? 'Inmediato' : `${displayPayback.toFixed(1)}`}
          </span>
          <span className="text-[9px] text-cream-muted block">años en recuperarse</span>
        </div>

        {/* ROI */}
        <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
          <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">ROI Acumulado</span>
          <span className="text-base font-black font-mono text-cream block leading-tight">
            {displayROI.toFixed(0)}%
          </span>
          <span className="text-[9px] text-cream-muted block font-mono">de retorno total</span>
        </div>

        {/* NPV */}
        <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1 col-span-2 md:col-span-1">
          <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">Valor Presente Neto</span>
          <span className={`text-base font-black font-mono block leading-tight ${displayNPV >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${Math.round(displayNPV).toLocaleString('es-MX')}
          </span>
          <span className="text-[9px] text-cream-muted block font-mono">VAN a 10% tasa desc</span>
        </div>
      </div>

      {/* Recharts Graphical Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Chart of Savings */}
        <div className="p-4 bg-dark-1/45 border border-dark-4 rounded-xl space-y-3">
          <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Ahorro Neto Acumulado vs Inversión (MXN)</span>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Ahorro Acumulado" name="Balance Net" fill="#C49825" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Line Chart CFE Projections */}
        <div className="p-4 bg-dark-1/45 border border-dark-4 rounded-xl space-y-3">
          <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Proyección de Pagos a CFE (Anual)</span>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, fontFamily: 'sans-serif' }} />
                <Line type="monotone" dataKey="Sin Solar" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Con Solar" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
