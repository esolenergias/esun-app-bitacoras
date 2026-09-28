import React, { useState } from 'react';
import type { RecepcionMercancia, OrdenCompra, InsumoReal, ClienteReal, ProyectoReal } from '../../types/adminTypes';
import type { OficioData } from '../../../../components/legal/oficios/types';
import { adminDbService } from '../../services/adminDbService';
import { OficioErpModal } from '../oficios/OficioErpModal';
import { generateOficioPdf } from '../../../../components/legal/oficios/oficioPdfGenerator';
import { 
  Truck, CheckCircle, Clock, Search, Plus, FileText, AlertTriangle, Eye, ArrowRight, ShieldCheck,
  Building2, Download, Printer 
} from 'lucide-react';

interface RecepcionesTabProps {
  ordenesCompra: OrdenCompra[];
  recepciones: RecepcionMercancia[];
  insumos: InsumoReal[];
  clientes?: ClienteReal[];
  proyectos?: ProyectoReal[];
  userRole?: string;
  canEdit?: boolean;
  onRefresh: () => void;
  onNavigateToOficios?: (folioOficio?: string) => void;
}

export const RecepcionesTab: React.FC<RecepcionesTabProps> = ({
  ordenesCompra,
  recepciones,
  insumos,
  clientes = [],
  proyectos = [],
  userRole = 'master',
  canEdit = true,
  onRefresh,
  onNavigateToOficios
}) => {
  const isAllowedToEdit = canEdit && userRole !== 'visor';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'completa' | 'parcial' | 'rechazada'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecepcion, setSelectedRecepcion] = useState<RecepcionMercancia | null>(null);
  const [selectedOficio, setSelectedOficio] = useState<OficioData | null>(null);
  const [isOficioOpen, setIsOficioOpen] = useState(false);

  // Form state
  const [selectedOcId, setSelectedOcId] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [numeroRemision, setNumeroRemision] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [itemsRecibidos, setItemsRecibidos] = useState<any[]>([]);

  // Ordenes de compra aprobadas listas para recepción
  const ocsDisponibles = ordenesCompra.filter(oc => oc.estatus === 'aprobada' || oc.estatus === 'recibida_parcial');

  const handleSelectOc = (ocId: string) => {
    setSelectedOcId(ocId);
    const oc = ordenesCompra.find(o => o.id === ocId);
    if (oc) {
      setItemsRecibidos(
        oc.partidas.map(p => ({
          insumo_id: p.insumo_id,
          descripcion: p.descripcion,
          unidad: p.unidad,
          cantidad_ordenada: p.cantidad,
          cantidad_recibida: p.cantidad, // Default to full order
          precio_unitario: p.precio_unitario,
          estado_fisico: 'bueno' as const,
          notas: ''
        }))
      );
    }
  };

  const handleItemQtyChange = (index: number, val: number) => {
    const updated = [...itemsRecibidos];
    updated[index].cantidad_recibida = Math.max(0, val);
    setItemsRecibidos(updated);
  };

  const handleItemEstadoChange = (index: number, val: 'bueno' | 'danado' | 'incompleto') => {
    const updated = [...itemsRecibidos];
    updated[index].estado_fisico = val;
    setItemsRecibidos(updated);
  };

  const handleCrearRecepcion = async () => {
    if (!isAllowedToEdit) {
      alert('Operación no permitida: Tu usuario está en Modo Visor (solo lectura).');
      return;
    }
    if (!selectedOcId) {
      alert('Seleccione una Orden de Compra.');
      return;
    }
    const oc = ordenesCompra.find(o => o.id === selectedOcId);
    if (!oc) return;

    // Determinar si es completa o parcial
    let tieneDanado = false;
    let tieneParcial = false;
    let totalItems = 0;

    itemsRecibidos.forEach(it => {
      totalItems += it.cantidad_recibida;
      if (it.cantidad_recibida < it.cantidad_ordenada) tieneParcial = true;
      if (it.estado_fisico !== 'bueno') tieneDanado = true;
    });

    const estatusFinal = totalItems === 0 ? 'rechazada' : tieneParcial ? 'parcial' : 'completa';

    const nuevaRec: Partial<RecepcionMercancia> = {
      orden_compra_id: oc.id,
      folio_oc: oc.folio,
      proveedor_id: oc.proveedor_id,
      proveedor_nombre: oc.proveedor_nombre,
      numero_factura: numeroFactura,
      numero_remision: numeroRemision,
      partidas: itemsRecibidos,
      estatus: estatusFinal,
      conforme: !tieneDanado,
      observaciones
    };

    await adminDbService.crearRecepcion(nuevaRec, insumos);
    onRefresh();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedOcId('');
    setNumeroFactura('');
    setNumeroRemision('');
    setObservaciones('');
    setItemsRecibidos([]);
  };

  const filteredRecepciones = recepciones.filter(rec => {
    const matchesSearch = 
      rec.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.folio_oc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.numero_factura && rec.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'todos' || rec.estatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-gold-light">
              Paso 4 del Flujo
            </span>
            <h2 className="text-xl font-bold text-cream">Recepción e Inspección de Mercancía</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Valida pedidos contra facturas/remisiones del proveedor. Al recibir, ingresa automáticamente las existencias al Kardex de Almacén.
          </p>
        </div>

        {isAllowedToEdit ? (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            disabled={ocsDisponibles.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
              ocsDisponibles.length === 0
                ? 'bg-dark-4 text-cream-dim cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 cursor-pointer'
            }`}
          >
            <Plus className="w-4 h-4" />
            Nueva Recepción {ocsDisponibles.length > 0 && `(${ocsDisponibles.length} OC pendientes)`}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-dark-3 border border-dark-4 text-cream-muted rounded-xl text-xs font-bold select-none">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo Visor (Solo Lectura)</span>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por folio REC, OC, proveedor o factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(['todos', 'completa', 'parcial', 'rechazada'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-gold text-dark-1 font-bold'
                  : 'bg-dark-3 text-cream-muted hover:bg-dark-4'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Recepciones List */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        {filteredRecepciones.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay recepciones registradas</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              {ocsDisponibles.length > 0
                ? 'Tienes Órdenes de Compra aprobadas listas para ser recibidas en almacén.'
                : 'Primero crea y aprueba una Orden de Compra para recibir mercancía.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio Recepción</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">OC Origen</th>
                  <th className="py-3 px-4">Cliente Conectado</th>
                  <th className="py-3 px-4">Proyecto / Obra</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Partidas</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">PDF Emitido</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredRecepciones.map((rec) => {
                  const linkedOc = ordenesCompra.find(o => o.folio === rec.folio_oc || o.id === rec.orden_compra_id);
                  const displayCliente = rec.cliente_nombre || linkedOc?.cliente_nombre || 'eSol Energías';
                  const displayProyecto = rec.proyecto_nombre || linkedOc?.proyecto_nombre || 'Almacén Central';

                  return (
                    <tr key={rec.id} className="hover:bg-dark-3/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cream">
                        <div>{rec.folio}</div>
                        {rec.folio_oficio && (
                          <span className="text-[10px] font-mono text-gold block font-semibold mt-0.5">
                            {rec.folio_oficio}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-cream-muted">
                        {new Date(rec.fecha_recepcion).toLocaleDateString('es-MX')}
                      </td>
                      <td className="py-3 px-4 font-mono text-gold font-semibold">
                        {rec.folio_oc}
                      </td>
                      <td className="py-3 px-4 font-medium text-cream">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span>{displayCliente}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cream-muted font-medium">
                        {displayProyecto}
                      </td>
                      <td className="py-3 px-4 text-cream/90 font-medium">
                        {rec.proveedor_nombre}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-cream-muted">
                          {rec.numero_factura && <div><span className="font-semibold">Fact:</span> {rec.numero_factura}</div>}
                          {rec.numero_remision && <div><span className="font-semibold">Rem:</span> {rec.numero_remision}</div>}
                          {!rec.numero_factura && !rec.numero_remision && <span className="text-cream-dim">Sin comprobante</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cream-muted font-medium">
                        {rec.partidas.length} ítems
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                          rec.estatus === 'completa' ? 'bg-emerald-100 text-emerald-700' :
                          rec.estatus === 'parcial' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {rec.estatus === 'completa' && <CheckCircle className="w-3 h-3" />}
                          {rec.estatus === 'parcial' && <Clock className="w-3 h-3" />}
                          {rec.estatus === 'rechazada' && <AlertTriangle className="w-3 h-3" />}
                          {rec.estatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rec.pdf_url ? (
                          <a
                            href={rec.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                            title="Ver / Descargar Acta de Recepción"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        ) : (
                          <button
                            onClick={async () => {
                              const ofc = adminDbService.generarOficioRecepcion(rec);
                              try {
                                await generateOficioPdf(ofc);
                              } catch (e: any) {
                                alert('Error generando PDF: ' + e.message);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-gold border border-dark-4 text-xs font-semibold transition-all"
                            title="Generar Acta de Recepción en PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-gold" />
                            <span>PDF</span>
                          </button>
                        )}
                      </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecepcion(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-dark-3 hover:bg-dark-4 text-cream rounded-lg transition-colors border border-dark-4"
                        >
                          <Eye className="w-3.5 h-3.5 text-gold" />
                          <span>Ver</span>
                        </button>

                        <button
                          onClick={() => {
                            const ofc = adminDbService.generarOficioRecepcion(rec);
                            setSelectedOficio(ofc);
                            setIsOficioOpen(true);
                          }}
                          className="p-1.5 text-gold hover:text-gold-light hover:bg-gold/15 rounded-lg transition-colors border border-gold/30"
                          title="Emitir / Ver Acta de Recepción Formal"
                        >
                          <FileText className="w-4 h-4" />
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

      {/* Modal Nueva Recepción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">Registrar Entrada / Recepción de Almacén</h3>
                <p className="text-xs text-cream-muted">Paso 4: Inspecciona los materiales recibidos y actualiza el stock real.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Selector de OC */}
              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Seleccionar Orden de Compra Aprobada *
                </label>
                <select
                  value={selectedOcId}
                  onChange={(e) => handleSelectOc(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2 focus:border-gold"
                >
                  <option value="">-- Seleccione una OC pendiente --</option>
                  {ocsDisponibles.map(oc => (
                    <option key={oc.id} value={oc.id}>
                      {oc.folio} | Prov: {oc.proveedor_nombre} | Total: ${oc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOcId && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                        No. Factura Proveedor (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: F-98234"
                        value={numeroFactura}
                        onChange={(e) => setNumeroFactura(e.target.value)}
                        className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                        No. Remisión / Guía (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: REM-1234"
                        value={numeroRemision}
                        onChange={(e) => setNumeroRemision(e.target.value)}
                        className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Tabla de ítems a recibir */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cream-muted mb-2">
                      Inspección de Materiales Recibidos
                    </h4>
                    <div className="border border-dark-4 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-dark-3 font-bold text-cream/90 uppercase">
                          <tr>
                            <th className="p-2.5">Material</th>
                            <th className="p-2.5">Ordenado</th>
                            <th className="p-2.5">Recibido Físico</th>
                            <th className="p-2.5">Estado Físico</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-4/70">
                          {itemsRecibidos.map((it, idx) => (
                            <tr key={idx} className="bg-dark-3/40 hover:bg-dark-3/70 transition-colors">
                              <td className="p-2.5 font-medium text-cream">
                                {it.descripcion} <span className="text-cream-dim">({it.unidad})</span>
                              </td>
                              <td className="p-2.5 font-bold text-cream-muted">
                                {it.cantidad_ordenada} {it.unidad}
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={it.cantidad_ordenada * 2}
                                  value={it.cantidad_recibida}
                                  onChange={(e) => handleItemQtyChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-24 p-1.5 border border-dark-4 rounded-lg text-center font-bold text-cream focus:border-gold"
                                />
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={it.estado_fisico}
                                  onChange={(e) => handleItemEstadoChange(idx, e.target.value as any)}
                                  className={`p-1.5 rounded-lg border text-xs font-bold ${
                                    it.estado_fisico === 'bueno' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                    it.estado_fisico === 'danado' ? 'border-rose-200 text-rose-700 bg-rose-50' :
                                    'border-amber-200 text-amber-700 bg-amber-50'
                                  }`}
                                >
                                  <option value="bueno">Buen Estado</option>
                                  <option value="danado">Dañado / Defectuoso</option>
                                  <option value="incompleto">Incompleto</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                      Observaciones de Recepción
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Comentarios de la entrega, empaque, transportista..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-dark-4/50 flex justify-end gap-3 bg-dark-3/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearRecepcion}
                disabled={!selectedOcId || itemsRecibidos.length === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                Confirmar e Ingresar a Almacén
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Recepción */}
      {selectedRecepcion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <span className="text-xs font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                  {selectedRecepcion.folio}
                </span>
                <h3 className="text-lg font-bold text-cream mt-1">Detalle de Recepción de Mercancía</h3>
              </div>
              <button onClick={() => setSelectedRecepcion(null)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-dark-3 p-4 rounded-xl">
                <div><span className="text-cream-muted text-xs block">Fecha:</span> <span className="font-semibold text-cream">{new Date(selectedRecepcion.fecha_recepcion).toLocaleString('es-MX')}</span></div>
                <div><span className="text-cream-muted text-xs block">OC de Origen:</span> <span className="font-mono font-bold text-gold">{selectedRecepcion.folio_oc}</span></div>
                <div><span className="text-cream-muted text-xs block">Proveedor:</span> <span className="font-semibold text-cream">{selectedRecepcion.proveedor_nombre}</span></div>
                <div><span className="text-cream-muted text-xs block">Recibido por:</span> <span className="font-semibold text-cream">{selectedRecepcion.recibido_por}</span></div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-cream-muted mb-2">Partidas Recibidas</h4>
                <div className="border border-dark-4 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-dark-3 font-bold text-cream/90">
                      <tr>
                        <th className="p-2.5">Descripción</th>
                        <th className="p-2.5">Recibido</th>
                        <th className="p-2.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/70">
                      {selectedRecepcion.partidas.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-cream font-medium">{p.descripcion}</td>
                          <td className="p-2.5 font-bold text-cream/90">{p.cantidad_recibida} {p.unidad}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                              p.estado_fisico === 'bueno' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {p.estado_fisico}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedRecepcion.observaciones && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800">
                  <span className="font-bold">Observaciones: </span>{selectedRecepcion.observaciones}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-dark-4/50 flex justify-between bg-dark-3/50">
              <button
                onClick={() => {
                  const ofc = adminDbService.generarOficioRecepcion(selectedRecepcion);
                  setSelectedOficio(ofc);
                  setIsOficioOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-gold bg-gold/15 hover:bg-gold/25 border border-gold/40 rounded-xl flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Emitir / Ver Acta de Recepción</span>
              </button>

              <button
                onClick={() => setSelectedRecepcion(null)}
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
