import React from 'react';
import type { PVSystemWithHealth } from '../types/monitoreo.types';
import { Zap, HeartPulse, DollarSign, TrendingUp } from 'lucide-react';

interface SystemMetricsCardsProps {
  system: PVSystemWithHealth;
  kwhTodayValue: number;
  kwhMonthValue: number;
  kwhYearValue: number;
  kwhTotalValue: number;
  currentPowerKwValue: number;
  healthStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  totalSavingsMxn: number;
  projectedAnnualSavingsMxn: number;
  tariffRate: number;
}

export const SystemMetricsCards: React.FC<SystemMetricsCardsProps> = ({
  system,
  kwhTodayValue,
  kwhMonthValue,
  kwhYearValue,
  kwhTotalValue,
  currentPowerKwValue,
  healthStatus,
  totalSavingsMxn,
  projectedAnnualSavingsMxn,
  tariffRate,
}) => {
  return (
    <div className="space-y-6">
      {/* ── BANNER DE MÉTRICAS CLAVE REGISTRADAS DE FUSIONSOLAR ── */}
      <div className="bg-dark-1 border border-dark-4 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-dark-4">
          <span className="text-xs font-black text-gold uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" />
            Métricas Registradas en Supabase (Oficiales)
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
              healthStatus === 'OPTIMAL'
                ? 'bg-green-500/10 text-green-500 border-green-500/30'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
            }`}>
              {healthStatus === 'OPTIMAL' ? '● Normal / Operativo' : '⚠ Alarma / Revisión'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          {/* Rendimiento Hoy */}
          <div className="bg-dark-2/60 p-3 rounded-xl border border-dark-4">
            <span className="text-[10px] font-bold text-cream-muted uppercase block">Rendimiento Hoy</span>
            <p className="text-xl font-black text-gold mt-1">
              {kwhTodayValue > 0 ? `${kwhTodayValue.toFixed(2)} kWh` : '0.00 kWh'}
            </p>
            <span className="text-[9px] text-green-500 font-bold">● Base de Datos</span>
          </div>

          {/* Rendimiento Este Mes */}
          <div className="bg-dark-2/60 p-3 rounded-xl border border-dark-4">
            <span className="text-[10px] font-bold text-cream-muted uppercase block">Rendimiento Este Mes</span>
            <p className="text-xl font-black text-cream mt-1">
              {kwhMonthValue > 0 ? `${kwhMonthValue.toFixed(2)} kWh` : '0.00 kWh'}
            </p>
            <span className="text-[9px] text-green-500 font-bold">● Base de Datos</span>
          </div>

          {/* Energía Anual */}
          <div className="bg-dark-2/60 p-3 rounded-xl border border-dark-4">
            <span className="text-[10px] font-bold text-cream-muted uppercase block">Energía Anual</span>
            <p className="text-xl font-black text-cream mt-1">
              {kwhYearValue > 0 ? `${(kwhYearValue / 1000).toFixed(2)} MWh` : '0.00 MWh'}
            </p>
            <span className="text-[9px] text-green-500 font-bold">● Base de Datos</span>
          </div>

          {/* Rendimiento Total */}
          <div className="bg-dark-2/60 p-3 rounded-xl border border-dark-4">
            <span className="text-[10px] font-bold text-cream-muted uppercase block">Rendimiento Total</span>
            <p className="text-xl font-black text-green-500 mt-1">
              {kwhTotalValue > 0 ? `${(kwhTotalValue / 1000).toFixed(2)} MWh` : '0.00 MWh'}
            </p>
            <span className="text-[9px] text-green-500 font-bold">● Base de Datos</span>
          </div>

          {/* Potencia Actual */}
          <div className="bg-dark-2/60 p-3 rounded-xl border border-dark-4 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-cream-muted uppercase block">Potencia Estimada</span>
            <p className="text-xl font-black text-gold mt-1">
              {currentPowerKwValue > 0 ? `${currentPowerKwValue.toFixed(2)} kW` : '0.00 kW'}
            </p>
            <span className="text-[9px] text-cream-dim">kWh hoy ÷ 5 hrs pico</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-1 border border-dark-4 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-cream-muted flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-green-500" /> Health Score
          </span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-cream">{system.healthScore || 95} <span className="text-xs text-cream-dim">/ 100</span></span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
              healthStatus === 'OPTIMAL' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
            }`}>
              {healthStatus}
            </span>
          </div>
          <p className="text-[10px] text-cream-dim">Estado operativo registrado</p>
        </div>

        <div className="bg-dark-1 border border-dark-4 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-cream-muted flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-gold" /> Generación Este Mes
          </span>
          <p className="text-2xl font-black text-cream pt-1">
            {kwhMonthValue >= 1000 ? `${(kwhMonthValue / 1000).toFixed(2)} MWh` : `${kwhMonthValue.toFixed(1)} kWh`}
          </p>
          <p className="text-[10px] text-cream-dim">Almacenado en Supabase</p>
        </div>

        <div className="bg-dark-1 border border-dark-4 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-cream-muted flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-gold" /> Ahorro Estimado Mes
          </span>
          <p className="text-2xl font-black text-gold pt-1">
            ${totalSavingsMxn.toLocaleString('es-MX')} <span className="text-xs text-cream-muted">MXN</span>
          </p>
          <p className="text-[10px] text-cream-dim">Tarifa {system.cfe_tariff || 'DAC'} (${tariffRate} MXN/kWh)</p>
        </div>

        <div className="bg-dark-1 border border-dark-4 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-cream-muted flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Ahorro Anual Proyectado
          </span>
          <p className="text-2xl font-black text-cream pt-1">
            ${projectedAnnualSavingsMxn.toLocaleString('es-MX')} <span className="text-xs text-cream-muted">MXN</span>
          </p>
          <p className="text-[10px] text-cream-dim">Retorno económico anual CFE</p>
        </div>
      </div>
    </div>
  );
};
