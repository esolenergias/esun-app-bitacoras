import React, { useState } from 'react';
import type { ProyectoReal, ValeEntrega, SolicitudMaterial, OficioData } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import { OficioErpModal } from '../oficios/OficioErpModal';
import { 
  FolderCheck, CheckCircle2, DollarSign, TrendingUp, TrendingDown, FileText, 
  Search, ShieldCheck, PieChart, ArrowUpRight, CheckCircle
} from 'lucide-react';

interface CierreProyectosTabProps {
  proyectos: ProyectoReal[];
  vales: ValeEntrega[];
  solicitudesMaterial: SolicitudMaterial[];
  userRole?: string;
  userName?: string;
  canEdit?: boolean;
  onRefresh: () => void;
  onNavigateToOficios?: (folioOficio?: string) => void;
}

export const CierreProyectosTab: React.FC<CierreProyectosTabProps> = ({
  proyectos,
  vales,
  solicitudesMaterial,
  userRole = 'master',
  userName = 'Administrador',
  canEdit = true,
  onRefresh,
  onNavigateToOficios
}) => {
  const isAllowedToEdit = canEdit && userRole !== 'visor';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoReal | null>(null);
  const [selectedOficio, setSelectedOficio] = useState<OficioData | null>(null);
  const [actaObservaciones, setActaObservaciones] = useState('');

  // Proyectos calculados
  const proyectosConAuditoria = proyectos.map(p => {
    // Calcular costo real consumido sumando los vales de este proyecto
    const valesProyecto = vales.filter(v => v.proyecto_id === p.id);
    const costoMaterialesReal = valesProyecto.reduce((acc, v) => acc + (v.total_costo || 0), 0);
    
    const costoMaterialesPresupuestado = p.costo_directo || (p.total * 0.65); // Si no tiene CD especificado
    const precioVentaCobrado = p.total;
    const utilidadEstimada = precioVentaCobrado - costoMaterialesReal;
    const margenUtilidad = precioVentaCobrado > 0 ? (utilidadEstimada / precioVentaCobrado) * 100 : 0;
    const desviacionCosto = costoMaterialesReal - costoMaterialesPresupuestado;

    return {
      ...p,
      valesCount: valesProyecto.length,
      costoMaterialesReal,
      costoMaterialesPresupuestado,
      utilidadEstimada,
      margenUtilidad,
      desviacionCosto,
      isCerrado: p.estatus === 'cerrado' || p.estatus === 'aprobado'
    };
  });

  const handleEmitirCierre = (proyecto: ProyectoReal, observacionesExtra?: string) => {
    const oficio = adminDbService.generarOficioCierre(proyecto);
    if (observacionesExtra) {
      oficio.cuerpo += `\n\nOBSERVACIONES ADICIONALES DE CIERRE:\n${observacionesExtra}`;
    }
    setSelectedOficio(oficio);
    setSelectedProyecto(null);
  };

  const filteredProyectos = proyectosConAuditoria.filter(p => {
    return (
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.folio && p.folio.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
              Paso 10 del Flujo (Cierre)
            </span>
            <h2 className="text-xl font-bold text-cream">Cierre de Proyecto y Conciliación Administrativa</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Audita el costo presupuestado vs los materiales realmente entregados en los Vales de Entrega. Genera el Acta de Entrega con Oficio formal.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por proyecto o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla de Cierre y Auditoría */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        {filteredProyectos.length === 0 ? (
          <div className="text-center py-12">
            <FolderCheck className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay proyectos para auditar</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              Los proyectos provienen directamente de la tabla de Presupuestos del sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Proyecto / Obra</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-right">Venta Total</th>
                  <th className="py-3 px-4 text-right">Costo Presupuesto</th>
                  <th className="py-3 px-4 text-right">Costo Real (Vales)</th>
                  <th className="py-3 px-4 text-right">Margen Real</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredProyectos.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-dark-3/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-cream">{p.titulo}</div>
                        <div className="text-xs text-cream-dim font-mono">Folio: {p.folio || p.id.slice(0, 8)}</div>
                      </td>
                      <td className="py-3 px-4 text-cream/90 font-medium">
                        {p.cliente_nombre}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cream">
                        ${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-cream-muted">
                        ${p.costoMaterialesPresupuestado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gold">
                        ${p.costoMaterialesReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        <div className="text-[10px] text-cream-dim font-normal">{p.valesCount} vales de salida</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                          p.margenUtilidad >= 25 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.margenUtilidad.toFixed(1)}% (${p.utilidadEstimada.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedProyecto(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-dark-3 hover:bg-dark-4 text-cream rounded-lg transition-colors border border-dark-4"
                            title="Auditoría de Costos"
                          >
                            <FolderCheck className="w-3.5 h-3.5 text-blue-400" />
                            Auditoría
                          </button>
                          <button
                            onClick={() => handleEmitirCierre(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-gold/15 hover:bg-gold/25 text-gold rounded-lg transition-colors border border-gold/30"
                            title="Emitir / Ver Acta de Finiquito y Cierre Oficial"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Acta Cierre
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Auditoría y Acta de Cierre */}
      {selectedProyecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <span className="text-xs font-mono font-bold text-cream-muted bg-dark-4 px-2 py-0.5 rounded-full">
                  Auditoría Administrativa
                </span>
                <h3 className="text-lg font-bold text-cream mt-1">{selectedProyecto.titulo}</h3>
              </div>
              <button onClick={() => setSelectedProyecto(null)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-dark-3 p-4 rounded-xl text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cream-dim block">Venta Cobrada</span>
                  <span className="font-mono font-bold text-cream text-sm">${selectedProyecto.total.toLocaleString('es-MX')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-cream-dim block">Costo Teórico</span>
                  <span className="font-mono font-bold text-cream-muted text-sm">${(selectedProyecto as any).costoMaterialesPresupuestado.toLocaleString('es-MX')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gold block">Costo Real Insumos</span>
                  <span className="font-mono font-bold text-gold-light text-sm">${(selectedProyecto as any).costoMaterialesReal.toLocaleString('es-MX')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Utilidad Real</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">${(selectedProyecto as any).utilidadEstimada.toLocaleString('es-MX')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Observaciones para el Acta de Entrega Oficial
                </label>
                <textarea
                  rows={3}
                  value={actaObservaciones}
                  onChange={(e) => setActaObservaciones(e.target.value)}
                  placeholder="Se entrega la instalación solar en óptimas condiciones, inversor sincronizado a la red y pruebas de voltaje aprobadas..."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream"
                />
              </div>
            </div>

            <div className="p-6 border-t border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <button
                onClick={() => setSelectedProyecto(null)}
                className="px-4 py-2 text-sm font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>

              {isAllowedToEdit ? (
                <button
                  onClick={() => handleEmitirCierre(selectedProyecto, actaObservaciones)}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-dark-1 bg-gold hover:bg-gold-light rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Generar y Firmar Acta de Cierre (Oficio Oficial)
                </button>
              ) : (
                <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                  Modo Visor: Solo lectura de auditoría (no se puede emitir acta)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Oficio ERP Integrado */}
      {selectedOficio && (
        <OficioErpModal
          oficio={selectedOficio}
          onClose={() => setSelectedOficio(null)}
          onSave={async (updatedOficio) => {
            await adminDbService.guardarOficioErp(updatedOficio);
            setSelectedOficio(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
