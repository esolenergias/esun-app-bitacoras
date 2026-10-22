import React from 'react';
import { 
  Calendar, Clock, CheckCircle, ExternalLink, Printer, DollarSign, Edit3, Trash2, Send, XCircle, Ban, AlertCircle 
} from 'lucide-react';
import type { CotizacionExpressData, EstadoCotizacionExpress } from '../../types/cotizadorExpress';
import { formatCurrency } from './cotizadorExpressPdf';

interface CotizadorTablaProps {
  cotizaciones: CotizacionExpressData[];
  generatingPdf: boolean;
  onPrint: (cot: CotizacionExpressData) => void;
  onEmitir?: (cot: CotizacionExpressData) => void;
  onMandarACobrar: (cot: CotizacionExpressData) => void;
  onEdit: (cot: CotizacionExpressData) => void;
  onDelete: (cot: CotizacionExpressData) => void;
  onUpdateEstado?: (cot: CotizacionExpressData, nuevoEstado: EstadoCotizacionExpress) => void;
}

export const CotizadorTabla: React.FC<CotizadorTablaProps> = ({
  cotizaciones,
  generatingPdf,
  onPrint,
  onEmitir,
  onMandarACobrar,
  onEdit,
  onDelete,
  onUpdateEstado
}) => {
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'aceptado':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 focus:border-emerald-400';
      case 'emitido':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 focus:border-blue-400';
      case 'borrador':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 focus:border-amber-400';
      case 'rechazado':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 focus:border-rose-400';
      case 'cancelado':
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40 focus:border-zinc-400';
      default:
        return 'bg-dark-3 text-cream border-dark-4';
    }
  };

  return (
    <div className="w-full">
      <table className="w-full text-left text-xs table-auto">
        <thead className="bg-dark-3 text-cream-dim uppercase font-bold text-[10px] tracking-wider border-b border-dark-4">
          <tr>
            <th className="py-2.5 px-3">Folio / Fecha</th>
            <th className="py-2.5 px-3">Cliente</th>
            <th className="py-2.5 px-3">Asunto</th>
            <th className="py-2.5 px-3 text-right">Total</th>
            <th className="py-2.5 px-2 text-center">Hojas</th>
            <th className="py-2.5 px-2 text-center">Estado</th>
            <th className="py-2.5 px-2 text-center">Drive</th>
            <th className="py-2.5 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-4">
          {cotizaciones.map(cot => {
            const isBorrador = cot.estado === 'borrador';
            const isAceptada = cot.estado === 'aceptado';
            const cantHojas = (cot.incluir_condiciones_servicio !== false ? 1 : 0) + 1 + (cot.incluir_condiciones_trabajo !== false ? 1 : 0);
            
            return (
              <tr key={cot.id} className="hover:bg-dark-3/50 transition-colors">
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="font-mono font-bold text-cream text-xs flex items-center gap-1.5">
                    <span className={isBorrador ? 'text-amber-400' : isAceptada ? 'text-emerald-400' : 'text-gold'}>
                      {cot.folio || 'BORRADOR'}
                    </span>
                  </div>
                  <div className="text-[10px] text-cream-dim flex items-center gap-1 mt-0.5">
                    <Calendar className="w-2.5 h-2.5 text-gold/60" />
                    <span>{cot.fecha}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-bold text-cream line-clamp-1" title={cot.cliente_nombre || 'Sin Cliente'}>
                    {cot.cliente_nombre || 'Sin Cliente'}
                  </div>
                  {cot.cliente_atencion && (
                    <div className="text-[10px] text-cream-dim line-clamp-1" title={cot.cliente_atencion}>
                      Att: {cot.cliente_atencion}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-cream-muted">
                  <span className="text-cream font-medium block line-clamp-1" title={cot.asunto || 'Cotización'}>
                    {cot.asunto || 'Cotización'}
                  </span>
                  <span className="text-[9.5px] text-cream-dim capitalize">
                    {(cot.tipo_servicio || 'servicios_profesionales').replace('_', ' ')}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-cream whitespace-nowrap">
                  {formatCurrency(cot.total || 0)}
                </td>
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded bg-dark-3 border border-dark-4 text-cream-muted">
                    {cantHojas} {cantHojas === 1 ? 'Hoja' : 'Hojas'}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  {onUpdateEstado ? (
                    <div className="inline-block relative">
                      <select
                        value={cot.estado || 'borrador'}
                        onChange={(e) => onUpdateEstado(cot, e.target.value as EstadoCotizacionExpress)}
                        className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border cursor-pointer outline-none transition-all shadow-sm ${getStatusColor(cot.estado)}`}
                        title="Cambiar estado de la cotización"
                      >
                        <option value="emitido" className="bg-dark-1 text-blue-300">Emitido</option>
                        <option value="borrador" className="bg-dark-1 text-amber-300">Borrador</option>
                        <option value="rechazado" className="bg-dark-1 text-rose-400">Rechazado</option>
                        <option value="cancelado" className="bg-dark-1 text-zinc-400">Cancelado</option>
                        <option value="aceptado" className="bg-dark-1 text-emerald-400">Aceptado</option>
                      </select>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusColor(cot.estado)}`}>
                      {cot.estado}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  {cot.drive_url ? (
                    <a
                      href={cot.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-gold hover:underline font-mono"
                      title="Abrir expediente en Google Drive"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Drive</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-cream-dim/50">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {/* Imprimir / Ver PDF */}
                    <button
                      onClick={() => onPrint(cot)}
                      disabled={generatingPdf}
                      title={`Generar PDF Oficial (${cantHojas} ${cantHojas === 1 ? 'Hoja' : 'Hojas'})`}
                      className="p-1 bg-dark-3 hover:bg-gold/20 text-gold border border-dark-4 hover:border-gold/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Botón directo para Emitir Borrador y asignarle folio oficial */}
                    {isBorrador && onEmitir && (
                      <button
                        onClick={() => onEmitir(cot)}
                        title="Emitir oficialmente esta cotización y asignarle folio definitivo"
                        className="px-1.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[9.5px]"
                      >
                        <Send className="w-3 h-3" />
                        <span>Emitir</span>
                      </button>
                    )}

                    {/* Pasar a Ingresos en Tesorería si está emitida */}
                    {!isBorrador && !cot.ingreso_id && (
                      <button
                        onClick={() => onMandarACobrar(cot)}
                        title="Enviar a Tesorería / Cuentas por Cobrar (CxC)"
                        className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Editar */}
                    <button
                      onClick={() => onEdit(cot)}
                      title="Editar"
                      className="p-1 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => onDelete(cot)}
                      title="Eliminar"
                      className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
