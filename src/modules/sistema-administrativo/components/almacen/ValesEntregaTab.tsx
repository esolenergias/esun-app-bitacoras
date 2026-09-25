import React, { useState } from 'react';
import type { ValeEntrega, SolicitudMaterial, ItemInventario } from '../../types/adminTypes';
import type { OficioData } from '../../../components/legal/oficios/types';
import { adminDbService } from '../../services/adminDbService';
import { OficioErpModal } from '../oficios/OficioErpModal';
import { 
  FileCheck2, Plus, Search, Eye, FileText, CheckCircle, PackageCheck, AlertCircle, Printer
} from 'lucide-react';

interface ValesEntregaTabProps {
  vales: ValeEntrega[];
  solicitudesMaterial: SolicitudMaterial[];
  inventario: ItemInventario[];
  userRole?: string;
  userName?: string;
  onRefresh: () => void;
  onNavigateToOficios?: (folioOficio?: string) => void;
}

export const ValesEntregaTab: React.FC<ValesEntregaTabProps> = ({
  vales,
  solicitudesMaterial,
  inventario,
  userRole = 'master',
  userName = 'Almacenista',
  onRefresh,
  onNavigateToOficios
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVale, setSelectedVale] = useState<ValeEntrega | null>(null);
  const [selectedOficio, setSelectedOficio] = useState<OficioData | null>(null);
  const [isOficioOpen, setIsOficioOpen] = useState(false);

  // Form State
  const [selectedSmId, setSelectedSmId] = useState('');
  const [recibeNombre, setRecibeNombre] = useState('');
  const [entregaNombre, setEntregaNombre] = useState(userName);
  const [notas, setNotas] = useState('');
  const [itemsVale, setItemsVale] = useState<any[]>([]);

  // Solicitudes aprobadas listas para generar vale
  const solicitudesAprobadas = solicitudesMaterial.filter(s => s.estatus === 'aprobada');

  const handleSelectSm = (smId: string) => {
    setSelectedSmId(smId);
    const sm = solicitudesMaterial.find(s => s.id === smId);
    if (sm) {
      setRecibeNombre(sm.solicitante_nombre);
      setItemsVale(
        sm.partidas.map(p => {
          const invItem = inventario.find(i => i.insumo_id === p.insumo_id || i.nombre === p.descripcion);
          const costoUnit = invItem ? invItem.precio_promedio : 0;
          return {
            insumo_id: p.insumo_id,
            descripcion: p.descripcion,
            unidad: p.unidad,
            cantidad_entregada: p.cantidad_autorizada || p.cantidad_solicitada,
            costo_unitario: costoUnit,
            importe_total: (p.cantidad_autorizada || p.cantidad_solicitada) * costoUnit
          };
        })
      );
    }
  };

  const handleItemQtyChange = (index: number, val: number) => {
    const updated = [...itemsVale];
    updated[index].cantidad_entregada = Math.max(0, val);
    updated[index].importe_total = updated[index].cantidad_entregada * updated[index].costo_unitario;
    setItemsVale(updated);
  };

  const handleCrearVale = async (conOficio = false) => {
    if (!selectedSmId) {
      alert('Seleccione una Solicitud de Material autorizada.');
      return;
    }
    if (!recibeNombre.trim()) {
      alert('Ingrese el nombre de la persona que recibe el material.');
      return;
    }

    const sm = solicitudesMaterial.find(s => s.id === selectedSmId);
    if (!sm) return;

    const totalCosto = itemsVale.reduce((acc, it) => acc + (it.importe_total || 0), 0);

    const nuevoVale: Partial<ValeEntrega> = {
      solicitud_material_id: sm.id,
      folio_solicitud: sm.folio,
      proyecto_id: sm.proyecto_id,
      proyecto_nombre: sm.proyecto_nombre,
      entrega_nombre: entregaNombre,
      recibe_nombre: recibeNombre,
      estatus: 'entregado',
      partidas: itemsVale,
      total_costo: totalCosto,
      notas: notas
    };

    const creado = await adminDbService.crearValeEntrega(nuevoVale);

    if (conOficio) {
      const oficio = await adminDbService.crearOficioDesdeSolicitud({
        tipo: 'entrega',
        folio_referencia: creado.folio,
        destinatario: recibeNombre,
        asunto: `Vale de Entrega y Salida de Material para Obra: ${sm.proyecto_nombre}`,
        cuerpo: `Por medio de la presente se hace constar la entrega formal de los materiales y equipos correspondientes al vale de salida ${creado.folio} con cargo al proyecto "${sm.proyecto_nombre}".\n\nEl receptor asume la custodia y correcta instalación en sitio conforme a los planos de ingeniería.`,
        solicitante_nombre: entregaNombre
      });
      if (onNavigateToOficios) {
        onNavigateToOficios(oficio.folio);
      }
    }

    onRefresh();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSmId('');
    setRecibeNombre('');
    setNotas('');
    setItemsVale([]);
  };

  const filteredVales = vales.filter(v => {
    return (
      v.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.folio_solicitud.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.proyecto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.recibe_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Paso 8 del Flujo
            </span>
            <h2 className="text-xl font-bold text-cream">Vales de Entrega y Salida a Obra</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Entrega física y traspaso de custodia de materiales con descuento automático del inventario y asignación al costo de la obra.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          disabled={solicitudesAprobadas.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
            solicitudesAprobadas.length === 0
              ? 'bg-dark-4 text-cream-dim cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          Nuevo Vale de Entrega {solicitudesAprobadas.length > 0 && `(${solicitudesAprobadas.length} Solicitudes)`}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por vale, solicitud, proyecto o técnico receptor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Vales List */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        {filteredVales.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck2 className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay vales de entrega emitidos</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              {solicitudesAprobadas.length > 0
                ? 'Hay solicitudes de material autorizadas listas para salida de almacén.'
                : 'Primero autoriza una solicitud de material para generar el vale de salida.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio Vale</th>
                  <th className="py-3 px-4">Fecha Salida</th>
                  <th className="py-3 px-4">Proyecto Asignado</th>
                  <th className="py-3 px-4">Entregado a</th>
                  <th className="py-3 px-4">Partidas</th>
                  <th className="py-3 px-4 text-right">Costo Salida</th>
                  <th className="py-3 px-4 text-center">Estatus</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredVales.map((vale) => (
                  <tr key={vale.id} className="hover:bg-dark-3/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cream">
                      {vale.folio}
                    </td>
                    <td className="py-3 px-4 text-cream-muted">
                      {new Date(vale.fecha_entrega).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-cream">
                      {vale.proyecto_nombre}
                    </td>
                    <td className="py-3 px-4 text-cream/90">
                      {vale.recibe_nombre}
                    </td>
                    <td className="py-3 px-4 text-cream-muted font-medium">
                      {vale.partidas.length} materiales
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ${vale.total_costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3" />
                        ENTREGADO
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedVale(vale)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-dark-3 hover:bg-dark-4 text-cream rounded-lg transition-colors border border-dark-4"
                        >
                          <Eye className="w-3.5 h-3.5 text-gold" />
                          <span>Ver</span>
                        </button>

                        <button
                          onClick={() => {
                            const ofc = adminDbService.generarOficioVale(vale);
                            setSelectedOficio(ofc);
                            setIsOficioOpen(true);
                          }}
                          className="p-1.5 text-gold hover:text-gold-light hover:bg-gold/15 rounded-lg transition-colors border border-gold/30"
                          title="Emitir / Ver Vale de Entrega Formal"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Vale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">Generar Vale de Entrega a Obra</h3>
                <p className="text-xs text-cream-muted">Paso 8: Registra la entrega y descuenta existencias en el Kardex.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Solicitud de Material Autorizada *
                </label>
                <select
                  value={selectedSmId}
                  onChange={(e) => handleSelectSm(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2 focus:border-emerald-500"
                >
                  <option value="">-- Seleccione una Solicitud Autorizada --</option>
                  {solicitudesAprobadas.map(sm => (
                    <option key={sm.id} value={sm.id}>
                      {sm.folio} | Obra: {sm.proyecto_nombre} | Solicitante: {sm.solicitante_nombre}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSmId && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                        Persona que Recibe en Obra *
                      </label>
                      <input
                        type="text"
                        value={recibeNombre}
                        onChange={(e) => setRecibeNombre(e.target.value)}
                        className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                        Almacenista que Entrega
                      </label>
                      <input
                        type="text"
                        value={entregaNombre}
                        onChange={(e) => setEntregaNombre(e.target.value)}
                        className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Tabla de ítems a entregar */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cream-muted mb-2">
                      Materiales a Descontar de Almacén
                    </h4>
                    <div className="border border-dark-4 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-dark-3 font-bold text-cream/90 uppercase">
                          <tr>
                            <th className="p-2.5">Material</th>
                            <th className="p-2.5 text-center">Unidad</th>
                            <th className="p-2.5 text-center">Cant. a Entregar</th>
                            <th className="p-2.5 text-right">Costo Unit.</th>
                            <th className="p-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-4/70">
                          {itemsVale.map((it, idx) => (
                            <tr key={idx} className="bg-dark-3/40 hover:bg-dark-3/70 transition-colors">
                              <td className="p-2.5 font-medium text-cream">
                                {it.descripcion}
                              </td>
                              <td className="p-2.5 text-center text-cream-muted">
                                {it.unidad}
                              </td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={it.cantidad_entregada}
                                  onChange={(e) => handleItemQtyChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-20 p-1 border border-dark-4 rounded text-center font-bold"
                                />
                              </td>
                              <td className="p-2.5 text-right font-mono text-cream-muted">
                                ${it.costo_unitario.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                                ${it.importe_total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                      Observaciones / Instrucciones de Traslado
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Notas del estado físico o condiciones del transporte..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-dark-4/50 flex flex-wrap justify-between items-center gap-3 bg-dark-3/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCrearVale(false)}
                  disabled={!selectedSmId || itemsVale.length === 0}
                  className="px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 rounded-xl border border-emerald-200 transition-colors"
                >
                  Emitir Vale de Salida
                </button>

                <button
                  onClick={() => handleCrearVale(true)}
                  disabled={!selectedSmId || itemsVale.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Emitir + Oficio Oficial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Vale */}
      {selectedVale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {selectedVale.folio}
                </span>
                <h3 className="text-lg font-bold text-cream mt-1">Vale de Salida de Almacén</h3>
              </div>
              <button onClick={() => setSelectedVale(null)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-dark-3 p-4 rounded-xl">
                <div><span className="text-cream-muted text-xs block">Fecha de Salida:</span> <span className="font-semibold text-cream">{new Date(selectedVale.fecha_entrega).toLocaleString('es-MX')}</span></div>
                <div><span className="text-cream-muted text-xs block">Proyecto:</span> <span className="font-semibold text-cream">{selectedVale.proyecto_nombre}</span></div>
                <div><span className="text-cream-muted text-xs block">Entregado por:</span> <span className="font-semibold text-cream">{selectedVale.entrega_nombre}</span></div>
                <div><span className="text-cream-muted text-xs block">Recibido por:</span> <span className="font-semibold text-cream">{selectedVale.recibe_nombre}</span></div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-cream-muted mb-2">Materiales Entregados</h4>
                <div className="border border-dark-4 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-dark-3 font-bold text-cream/90">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-center">Unidad</th>
                        <th className="p-2.5 text-center">Cantidad</th>
                        <th className="p-2.5 text-right">Costo Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/70">
                      {selectedVale.partidas.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-cream font-medium">{p.descripcion}</td>
                          <td className="p-2.5 text-center text-cream-muted">{p.unidad}</td>
                          <td className="p-2.5 text-center font-bold text-cream">{p.cantidad_entregada}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            ${p.importe_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedVale.notas && (
                <div className="p-3 bg-dark-3 border border-dark-4 rounded-xl text-xs text-cream/90">
                  <span className="font-bold">Observaciones: </span>{selectedVale.notas}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-dark-4/50 flex justify-between bg-dark-3/50">
              <button
                onClick={() => {
                  const ofc = adminDbService.generarOficioVale(selectedVale);
                  setSelectedOficio(ofc);
                  setIsOficioOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-gold bg-gold/15 hover:bg-gold/25 border border-gold/40 rounded-xl flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Emitir / Ver Vale Formal</span>
              </button>

              <button
                onClick={() => setSelectedVale(null)}
                className="px-4 py-2 text-sm font-semibold bg-dark-4 hover:bg-slate-300 text-cream/90 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Embebido de Oficio Formal */}
      <OficioErpModal
        isOpen={isOficioOpen}
        onClose={() => setIsOficioOpen(false)}
        oficio={selectedOficio}
        userRole={userRole}
        onSaveOficio={(updated) => adminDbService.guardarOficioErp(updated)}
      />
    </div>
  );
};
