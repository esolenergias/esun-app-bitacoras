import React from 'react';
import { 
  Package, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle2, 
  Building2, ArrowUpRight, ArrowDownRight, ShieldCheck, CreditCard, Layers, RefreshCw
} from 'lucide-react';
import type { KpisFinancieros } from '../../types/adminTypes';

interface AdminKpisHeaderProps {
  kpis: KpisFinancieros;
  onRefresh?: () => void;
}

export const AdminKpisHeader: React.FC<AdminKpisHeaderProps> = ({ kpis, onRefresh }) => {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      {/* 6 Tarjetas de KPIs Principales en Tema Oscuro Carbono / Oro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 select-none">
        
        {/* 1. Inventario Disponible */}
        <div className="bg-dark-2 border border-dark-4 hover:border-gold/50 rounded-2xl p-4 transition-all duration-300 shadow-lg group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold text-cream-muted uppercase tracking-wider">
              Inventario Disp.
            </span>
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-cream tracking-tight group-hover:text-gold transition-colors font-mono">
            {kpis.inventario_disponible.toLocaleString('es-MX')}
          </div>
          <div className="text-[10px] text-cream-dim mt-1">Piezas / Unidades en stock</div>
        </div>

        {/* 2. Valor de Inventario */}
        <div className="bg-dark-2 border border-dark-4 hover:border-gold/50 rounded-2xl p-4 transition-all duration-300 shadow-lg group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold text-cream-muted uppercase tracking-wider">
              Valor Inventario
            </span>
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-gold tracking-tight font-mono">
            {formatMoney(kpis.valor_inventario)}
          </div>
          <div className="text-[10px] text-cream-dim mt-1">Valuación a costo real</div>
        </div>

        {/* 3. Cuentas por Cobrar */}
        <div className="bg-dark-2 border border-dark-4 hover:border-green-500/50 rounded-2xl p-4 transition-all duration-300 shadow-lg group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold text-cream-muted uppercase tracking-wider">
              Cuentas x Cobrar
            </span>
            <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-green-400 tracking-tight font-mono">
            {formatMoney(kpis.cuentas_por_cobrar)}
          </div>
          <div className="text-[10px] text-cream-dim mt-1">Saldos activos de clientes</div>
        </div>

        {/* 4. Cuentas por Pagar */}
        <div className="bg-dark-2 border border-dark-4 hover:border-amber-500/50 rounded-2xl p-4 transition-all duration-300 shadow-lg group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold text-cream-muted uppercase tracking-wider">
              Cuentas x Pagar
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-400 tracking-tight font-mono">
            {formatMoney(kpis.cuentas_por_pagar)}
          </div>
          <div className="text-[10px] text-cream-dim mt-1">Pasivos a proveedores</div>
        </div>

        {/* 5. Ingresos Registrados */}
        <div className="bg-dark-2 border border-dark-4 hover:border-green-500/50 rounded-2xl p-4 transition-all duration-300 shadow-lg group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold text-cream-muted uppercase tracking-wider">
              Ingresos Cobrados
            </span>
            <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-cream tracking-tight font-mono">
            {formatMoney(kpis.ingresos_registrados)}
          </div>
          <div className="text-[10px] text-cream-dim mt-1">Cobros efectivos ingresados</div>
        </div>

        {/* 6. Egresos Registrados */}
        <div className="bg-dark-2 border border-dark-4 hover:border-red-500/50 rounded-2xl p-4 transition-all duration-300 shadow-lg group hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold text-cream-muted uppercase tracking-wider">
              Egresos Pagados
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-cream tracking-tight font-mono">
            {formatMoney(kpis.egresos_registrados)}
          </div>
          <div className="text-[10px] text-cream-dim mt-1">Pagos operativos liquidados</div>
        </div>
      </div>

      {/* Barra de Liquidez y Tesorería */}
      <div className="bg-dark-2/90 border border-dark-4 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cream-dim">
              Liquidez Total Disponible en Cajas y Bancos
            </span>
            <div className="text-2xl font-black font-mono text-gold">
              {formatMoney(kpis.total_liquidez)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <div className="bg-dark-1/80 border border-dark-4 px-3 py-2 rounded-xl">
            <span className="text-cream-dim text-[9.5px] uppercase font-bold block">Caja Chica</span>
            <span className="font-mono font-bold text-cream">{formatMoney(kpis.saldo_caja_chica)}</span>
          </div>
          <div className="bg-dark-1/80 border border-dark-4 px-3 py-2 rounded-xl">
            <span className="text-cream-dim text-[9.5px] uppercase font-bold block">Caja Grande</span>
            <span className="font-mono font-bold text-cream">{formatMoney(kpis.saldo_caja_grande)}</span>
          </div>
          <div className="bg-dark-1/80 border border-gold/30 px-3 py-2 rounded-xl">
            <span className="text-gold text-[9.5px] uppercase font-bold block">Cuentas Bancarias</span>
            <span className="font-mono font-black text-gold-light">{formatMoney(kpis.saldo_bancos)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
