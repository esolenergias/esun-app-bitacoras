import React from 'react';
import { CheckCircle, Clock, DollarSign } from 'lucide-react';
import { formatCurrency } from './cotizadorExpressPdf';

interface CotizadorKpisProps {
  totalAceptadas: number;
  montoTotalAceptado: number;
  totalCotizaciones: number;
  totalBorradores: number;
}

export const CotizadorKpis: React.FC<CotizadorKpisProps> = ({
  totalAceptadas,
  montoTotalAceptado,
  totalCotizaciones,
  totalBorradores
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-dark-2 border border-dark-4 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Cotizaciones Aceptadas</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{totalAceptadas}</div>
          <div className="text-[10px] text-cream-dim mt-0.5">De {totalCotizaciones} cotizaciones totales</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-dark-2 border border-dark-4 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-cream-dim uppercase tracking-wider">Monto Total Aceptado</div>
          <div className="text-2xl font-black text-gold mt-1 font-mono">{formatCurrency(montoTotalAceptado)}</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Suma exclusiva de estatus "Aceptado"</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-sm">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-dark-2 border border-dark-4 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-cream-dim uppercase tracking-wider">Borradores en Curso</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{totalBorradores}</div>
          <div className="text-[10px] text-amber-300/70 mt-0.5">Pendientes de emisión</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
