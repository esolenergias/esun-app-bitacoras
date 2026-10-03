import React from 'react';
import { CheckCircle, Clock, DollarSign } from 'lucide-react';
import { formatCurrency } from './cotizadorExpressPdf';

interface CotizadorKpisProps {
  totalEmitidas: number;
  totalBorradores: number;
  montoTotalEmitido: number;
}

export const CotizadorKpis: React.FC<CotizadorKpisProps> = ({
  totalEmitidas,
  totalBorradores,
  montoTotalEmitido
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-dark-2 border border-dark-4 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-cream-dim uppercase tracking-wider">Propuestas Emitidas</div>
          <div className="text-2xl font-black text-cream mt-1">{totalEmitidas}</div>
          <div className="text-[10px] text-gold mt-0.5">Folios oficiales COT-ESOL</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-dark-2 border border-dark-4 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-cream-dim uppercase tracking-wider">Borradores en Curso</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{totalBorradores}</div>
          <div className="text-[10px] text-amber-300/70 mt-0.5">Pendientes de emisión oficial</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-dark-2 border border-dark-4 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-cream-dim uppercase tracking-wider">Monto Total Cotizado</div>
          <div className="text-2xl font-black text-cream mt-1 font-mono">{formatCurrency(montoTotalEmitido)}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Cartera propuesta activa</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
