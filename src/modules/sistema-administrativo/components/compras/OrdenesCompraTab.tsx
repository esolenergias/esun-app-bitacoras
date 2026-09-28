import React, { useState } from 'react';
import type { OrdenCompra, SolicitudCompra, Proveedor, ClienteReal, ProyectoReal } from '../../types/adminTypes';
import type { OficioData } from '../../../../components/legal/oficios/types';
import { adminDbService } from '../../services/adminDbService';
import { OficioErpModal } from '../oficios/OficioErpModal';
import { generateOficioPdf } from '../../../../components/legal/oficios/oficioPdfGenerator';
import { 
  FileCheck, Plus, CheckCircle, Clock, Search, FileText, 
  Send, Eye, ArrowRight, Truck, Building2, DollarSign, Download, Printer 
} from 'lucide-react';

interface OrdenesCompraTabProps {
  ordenes: OrdenCompra[];
  solicitudes: SolicitudCompra[];
  proveedores: Proveedor[];
  clientes?: ClienteReal[];
  proyectos?: ProyectoReal[];
  userRole?: string;
  userName?: string;
  canEdit?: boolean;
  onRefresh: () => void;
  onNavigateToOficios?: (folioOficio?: string) => void;
  onRecepcionar?: (orden: OrdenCompra) => void;
}

export const OrdenesCompraTab: React.FC<OrdenesCompraTabProps> = ({
  ordenes,
  solicitudes,
  proveedores,
  clientes = [],
  proyectos = [],
  userRole = 'master',
  userName = 'Administrador',
  canEdit = true,
  onRefresh,
  onNavigateToOficios,
  onRecepcionar
}) => {
  const isAllowedToEdit = canEdit && userRole !== 'visor';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todas' | 'aprobada' | 'recibida_parcial' | 'recibida_total' | 'cancelada'>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null);
  const [selectedOficio, setSelectedOficio] = useState<OficioData | null>(null);
  const [isOficioOpen, setIsOficioOpen] = useState(false);

  // Form State
  const [selectedScId, setSelectedScId] = useState('');
  const [selectedProveedorId, setSelectedProveedorId] = useState('');
  const [condicionPago, setCondicionPago] = useState<'contado' | 'credito'>('credito');
  const [diasCredito, setDiasCredito] = useState(30);
  const [tiempoEntrega, setTiempoEntrega] = useState('3 a 5 días hábiles');
  const [lugarEntrega, setLugarEntrega] = useState('Almacén Central Hermosillo, Sonora');
  const [notas, setNotas] = useState('');
  const [partidas, setPartidas] = useState<any[]>([]);

  // Solicitudes aprobadas listas para generar OC
  const solicitudesAprobadas = solicitudes.filter(s => s.estatus === 'aprobada');

  const handleSelectSc = (scId: string) => {
    setSelectedScId(scId);
    const sc = solicitudes.find(s => s.id === scId);
    if (sc) {
      setPartidas(sc.partidas.map(p => ({ ...p })));
    }
  };

  const handleSelectProveedor = (provId: string) => {
    setSelectedProveedorId(provId);
    const p = proveedores.find(prov => prov.id === provId);
    if (p) {
      setDiasCredito(p.dias_credito || 30);
      setCondicionPago(p.dias_credito > 0 ? 'credito' : 'contado');
    }
  };

  const handleCrearOc = async (conOficio = false) => {
    if (!isAllowedToEdit) {
      alert('Operación no permitida: Tu usuario está en Modo Visor (solo lectura).');
      return;
    }
    if (!selectedProveedorId) {
      alert('Por favor seleccione un proveedor.');
      return;
    }
    if (partidas.length === 0) {
      alert('La orden debe tener al menos una partida.');
      return;
    }

    const prov = proveedores.find(p => p.id === selectedProveedorId);
    const sc = solicitudes.find(s => s.id === selectedScId);

    const nuevaOc: Partial<OrdenCompra> = {
      solicitud_compra_id: selectedScId || undefined,
      folio_solicitud: sc?.folio,
      proveedor_id: selectedProveedorId,
      proveedor_nombre: prov?.nombre || 'Proveedor General',
      proyecto_id: sc?.proyecto_id,
      proyecto_nombre: sc?.proyecto_nombre,
      condicion_pago: condicionPago,
      dias_credito: diasCredito,
      tiempo_entrega: tiempoEntrega,
      lugar_entrega: lugarEntrega,
      partidas: partidas,
      notas
    };

    const creada = await adminDbService.crearOrdenCompra(nuevaOc);

    if (conOficio) {
      const oficio = await adminDbService.crearOficioDesdeSolicitud({
        tipo: 'compra',
        folio_referencia: creada.folio,
        destinatario: prov?.nombre || 'Proveedor',
        asunto: `Orden de Compra Oficial ${creada.folio} - eSol Energías Renovables`,
        cuerpo: `Por medio de la presente se emite formalmente la Orden de Compra ${creada.folio} por un total de $${creada.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (IVA incluido), sujeta a las condiciones comerciales acordadas (${condicionPago === 'credito' ? `${diasCredito} días de crédito` : 'pago de contado'}).\n\nFavor de confirmar recepción y tiempo estimado de embarque.`,
        solicitante_nombre: userName
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
    setSelectedScId('');
    setSelectedProveedorId('');
    setPartidas([]);
    setNotas('');
  };

  const filteredOrdenes = ordenes.filter(oc => {
    const matchesSearch = 
      oc.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oc.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (oc.folio_solicitud && oc.folio_solicitud.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'todas' || oc.estatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-gold-light">
              Paso 3 del Flujo
            </span>
            <h2 className="text-xl font-bold text-cream">Órdenes de Compra a Proveedores (OC)</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Formaliza pedidos comerciales con proveedores registrados, plazos de entrega, condiciones de crédito y cálculo de IVA.
          </p>
        </div>

        {isAllowedToEdit ? (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Orden de Compra
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-dark-3 border border-dark-4 text-cream-muted rounded-xl text-xs font-bold select-none">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo Visor (Solo Lectura)</span>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por folio OC, SC o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(['todas', 'aprobada', 'recibida_parcial', 'recibida_total', 'cancelada'] as const).map(st => (
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

      {/* Tabla de Órdenes */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        {filteredOrdenes.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay órdenes de compra registradas</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              Genera una orden a partir de una solicitud aprobada o crea una compra directa a proveedor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio OC / Oficio</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente Conectado</th>
                  <th className="py-3 px-4">Proyecto / Obra</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Condición</th>
                  <th className="py-3 px-4">Partidas</th>
                  <th className="py-3 px-4 text-right">Total (IVA inc.)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">PDF Emitido</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredOrdenes.map((oc) => (
                  <tr key={oc.id} className="hover:bg-dark-3/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cream">
                      <div>{oc.folio}</div>
                      {oc.folio_oficio && (
                        <span className="text-[10px] font-mono text-gold block font-semibold mt-0.5">
                          {oc.folio_oficio}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-cream-muted">
                      {new Date(oc.fecha).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3 px-4 font-medium text-cream">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                        <span>{oc.cliente_nombre || 'eSol Energías'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-cream">
                      {oc.proyecto_nombre || 'General'}
                    </td>
                    <td className="py-3 px-4 font-medium text-cream">
                      {oc.proveedor_nombre}
                    </td>
                    <td className="py-3 px-4 text-xs text-cream-muted capitalize">
                      {oc.condicion_pago} {oc.condicion_pago === 'credito' && `(${oc.dias_credito} días)`}
                    </td>
                    <td className="py-3 px-4 text-cream-muted font-medium">
                      {oc.partidas.length} partidas
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ${oc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                        oc.estatus === 'aprobada' ? 'bg-emerald-100 text-emerald-700' :
                        oc.estatus === 'recibida_parcial' ? 'bg-amber-100 text-amber-700' :
                        oc.estatus === 'recibida_total' ? 'bg-blue-100 text-gold-light' :
                        'bg-dark-3 text-cream/90'
                      }`}>
                        {oc.estatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {oc.pdf_url ? (
                        <a
                          href={oc.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                          title="Ver / Descargar PDF de la Orden"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <button
                          onClick={async () => {
                            const ofc = adminDbService.generarOficioOC(oc);
                            try {
                              await generateOficioPdf(ofc);
                            } catch (e: any) {
                              alert('Error generando PDF: ' + e.message);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-gold border border-dark-4 text-xs font-semibold transition-all"
                          title="Generar / Ver Documento Formal en PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-gold" />
                          <span>PDF</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrden(oc)}
                          className="p-1.5 text-cream-muted hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            const ofc = adminDbService.generarOficioOC(oc);
                            setSelectedOficio(ofc);
                            setIsOficioOpen(true);
                          }}
                          className="p-1.5 text-gold hover:text-gold-light hover:bg-gold/15 rounded-lg transition-colors border border-gold/30"
                          title="Emitir / Ver Orden de Compra Formal"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Recepcionar si está activa y tiene permisos */}
                        {(oc.estatus === 'aprobada' || oc.estatus === 'recibida_parcial') && onRecepcionar && isAllowedToEdit && (
                          <button
                            onClick={() => onRecepcionar(oc)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Recibir en Almacén (Paso 4)"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Recibir</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva OC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">Generar Orden de Compra (OC)</h3>
                <p className="text-xs text-cream-muted">Paso 3: Selecciona el proveedor y formaliza los términos comerciales.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Vincular a Solicitud Aprobada (Opcional)
                  </label>
                  <select
                    value={selectedScId}
                    onChange={(e) => handleSelectSc(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                  >
                    <option value="">-- Compra Directa sin SC --</option>
                    {solicitudesAprobadas.map(sc => (
                      <option key={sc.id} value={sc.id}>
                        {sc.folio} | {sc.proyecto_nombre} ({sc.partidas.length} partidas)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Proveedor *
                  </label>
                  <select
                    value={selectedProveedorId}
                    onChange={(e) => handleSelectProveedor(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.dias_credito} días crédito)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Condición de Pago
                  </label>
                  <select
                    value={condicionPago}
                    onChange={(e) => setCondicionPago(e.target.value as any)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                  >
                    <option value="credito">Crédito Comercial</option>
                    <option value="contado">Contado / Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Días de Crédito
                  </label>
                  <input
                    type="number"
                    value={diasCredito}
                    onChange={(e) => setDiasCredito(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Tiempo de Entrega
                  </label>
                  <input
                    type="text"
                    value={tiempoEntrega}
                    onChange={(e) => setTiempoEntrega(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Lugar de Entrega
                </label>
                <input
                  type="text"
                  value={lugarEntrega}
                  onChange={(e) => setLugarEntrega(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                />
              </div>

              {/* Partidas de la Orden */}
              {partidas.length > 0 && (
                <div className="border border-dark-4 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-dark-3 font-bold text-cream/90 uppercase">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-center">Unidad</th>
                        <th className="p-2.5 text-center">Cantidad</th>
                        <th className="p-2.5 text-right">Precio Unit.</th>
                        <th className="p-2.5 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/70">
                      {partidas.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-cream">{p.descripcion}</td>
                          <td className="p-2.5 text-center text-cream-muted">{p.unidad}</td>
                          <td className="p-2.5 text-center font-bold text-cream">{p.cantidad}</td>
                          <td className="p-2.5 text-right font-mono text-cream-muted">${p.precio_unitario.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-gold">${p.importe.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  onClick={() => handleCrearOc(false)}
                  disabled={!selectedProveedorId || partidas.length === 0}
                  className="px-4 py-2 text-sm font-bold text-gold-light bg-gold/10 hover:bg-blue-100 disabled:opacity-50 rounded-xl border border-gold/30 transition-colors"
                >
                  Emitir Orden de Compra
                </button>

                <button
                  onClick={() => handleCrearOc(true)}
                  disabled={!selectedProveedorId || partidas.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Emitir + Oficio Oficial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle OC */}
      {selectedOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <span className="text-xs font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                  {selectedOrden.folio}
                </span>
                <h3 className="text-lg font-bold text-cream mt-1">Orden de Compra Oficial</h3>
              </div>
              <button onClick={() => setSelectedOrden(null)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-dark-3 p-4 rounded-xl">
                <div><span className="text-cream-muted text-xs block">Fecha:</span> <span className="font-semibold text-cream">{new Date(selectedOrden.fecha).toLocaleString('es-MX')}</span></div>
                <div><span className="text-cream-muted text-xs block">Proveedor:</span> <span className="font-semibold text-cream">{selectedOrden.proveedor_nombre}</span></div>
                <div><span className="text-cream-muted text-xs block">Condición de Pago:</span> <span className="font-semibold text-cream capitalize">{selectedOrden.condicion_pago} ({selectedOrden.dias_credito} días)</span></div>
                <div><span className="text-cream-muted text-xs block">Lugar Entrega:</span> <span className="font-semibold text-cream">{selectedOrden.lugar_entrega}</span></div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-cream-muted mb-2">Partidas Autorizadas</h4>
                <div className="border border-dark-4 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-dark-3 font-bold text-cream/90">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-center">Unidad</th>
                        <th className="p-2.5 text-center">Cantidad</th>
                        <th className="p-2.5 text-right">Precio Unit.</th>
                        <th className="p-2.5 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/70">
                      {selectedOrden.partidas.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-cream font-medium">{p.descripcion}</td>
                          <td className="p-2.5 text-center text-cream-muted">{p.unidad}</td>
                          <td className="p-2.5 text-center font-bold text-cream">{p.cantidad}</td>
                          <td className="p-2.5 text-right font-mono text-cream-muted">${p.precio_unitario.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-gold">${p.importe.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex justify-end">
                  <div className="w-56 space-y-1 text-xs">
                    <div className="flex justify-between text-cream-muted">
                      <span>Subtotal:</span>
                      <span className="font-mono">${selectedOrden.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-cream-muted">
                      <span>IVA (16%):</span>
                      <span className="font-mono">${selectedOrden.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-cream font-bold pt-1 border-t border-dark-4">
                      <span>Total OC:</span>
                      <span className="font-mono text-emerald-600">${selectedOrden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-dark-4/50 flex justify-between bg-dark-3/50">
              <button
                onClick={() => {
                  const ofc = adminDbService.generarOficioOC(selectedOrden);
                  setSelectedOficio(ofc);
                  setIsOficioOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-gold bg-gold/15 hover:bg-gold/25 border border-gold/40 rounded-xl flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Emitir / Ver Orden Formal</span>
              </button>

              <button
                onClick={() => setSelectedOrden(null)}
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
