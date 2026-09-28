import React, { useState } from 'react';
import type { SolicitudCompra, ProyectoReal, InsumoReal, ClienteReal } from '../../types/adminTypes';
import type { OficioData } from '../../../../components/legal/oficios/types';
import { adminDbService } from '../../services/adminDbService';
import { OficioErpModal } from '../oficios/OficioErpModal';
import { generateOficioPdf } from '../../../../components/legal/oficios/oficioPdfGenerator';
import { 
  ShoppingCart, Plus, CheckCircle, XCircle, Clock, Search, FileText, 
  Send, AlertCircle, Eye, ArrowRight, UserCheck, Building2, Download, Printer 
} from 'lucide-react';

interface SolicitudesCompraTabProps {
  solicitudes: SolicitudCompra[];
  proyectos: ProyectoReal[];
  insumos: InsumoReal[];
  clientes?: ClienteReal[];
  userRole?: string;
  userName?: string;
  canEdit?: boolean;
  onRefresh: () => void;
  onNavigateToOficios?: (folioOficio?: string) => void;
  onGenerarOc?: (solicitud: SolicitudCompra) => void;
}

export const SolicitudesCompraTab: React.FC<SolicitudesCompraTabProps> = ({
  solicitudes,
  proyectos,
  insumos,
  clientes = [],
  userRole = 'master',
  userName = 'Usuario Admin',
  canEdit = true,
  onRefresh,
  onNavigateToOficios,
  onGenerarOc
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada' | 'ordenada'>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudCompra | null>(null);
  const [selectedOficio, setSelectedOficio] = useState<OficioData | null>(null);
  const [isOficioOpen, setIsOficioOpen] = useState(false);

  // Form State
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [solicitanteNombre, setSolicitanteNombre] = useState(userName);
  const [justificacion, setJustificacion] = useState('');
  const [partidas, setPartidas] = useState<{
    insumo_id?: string;
    descripcion: string;
    unidad: string;
    cantidad: number;
    precio_unitario: number;
    importe: number;
  }[]>([]);

  // Item builder
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [customDescripcion, setCustomDescripcion] = useState('');
  const [itemUnidad, setItemUnidad] = useState('PZA');
  const [itemCantidad, setItemCantidad] = useState(1);
  const [itemPrecio, setItemPrecio] = useState(0);

  const isAllowedToEdit = canEdit && userRole !== 'visor';
  const isMasterOrAdmin = isAllowedToEdit && (userRole === 'master' || userRole === 'admin');

  const handleSelectInsumo = (insumoId: string) => {
    setSelectedInsumoId(insumoId);
    if (insumoId === 'custom') {
      setCustomDescripcion('');
      setItemUnidad('PZA');
      setItemPrecio(0);
    } else {
      const ins = insumos.find(i => i.id === insumoId);
      if (ins) {
        setCustomDescripcion(ins.nombre);
        setItemUnidad(ins.unidad || 'PZA');
        setItemPrecio(ins.precio_unitario || 0);
      }
    }
  };

  const handleAddItem = () => {
    if (!customDescripcion.trim() || itemCantidad <= 0) {
      alert('Por favor ingrese una descripción y cantidad válida.');
      return;
    }

    const importe = itemCantidad * itemPrecio;
    setPartidas([
      ...partidas,
      {
        insumo_id: selectedInsumoId !== 'custom' ? selectedInsumoId : undefined,
        descripcion: customDescripcion.trim(),
        unidad: itemUnidad,
        cantidad: itemCantidad,
        precio_unitario: itemPrecio,
        importe
      }
    ]);

    setSelectedInsumoId('');
    setCustomDescripcion('');
    setItemCantidad(1);
    setItemPrecio(0);
  };

  const handleRemoveItem = (index: number) => {
    setPartidas(partidas.filter((_, idx) => idx !== index));
  };

  const handleGuardarSolicitud = async (conOficio = false) => {
    if (!isAllowedToEdit) {
      alert('Operación no permitida: Tu usuario está en Modo Visor (solo lectura).');
      return;
    }
    if (partidas.length === 0) {
      alert('Agregue al menos un insumo/material a la solicitud.');
      return;
    }

    const proy = proyectos.find(p => p.id === selectedProyectoId);
    const clie = clientes.find(c => c.id === selectedClienteId);
    const nuevaSol: Partial<SolicitudCompra> = {
      cliente_id: selectedClienteId || undefined,
      cliente_nombre: clie?.nombre || proy?.cliente_nombre || 'eSol Energías',
      proyecto_id: selectedProyectoId || undefined,
      proyecto_nombre: proy?.titulo || 'Requisición General',
      solicitante_nombre: solicitanteNombre,
      justificacion,
      partidas: partidas
    };

    const creada = await adminDbService.crearSolicitudCompra(nuevaSol, insumos);

    if (conOficio) {
      const oficio = await adminDbService.crearOficioDesdeSolicitud({
        tipo: 'compra',
        folio_referencia: creada.folio,
        destinatario: 'Dirección de Compras y Suministros',
        asunto: `Requisición de Compra de Materiales - ${creada.folio}`,
        cuerpo: `Por medio del presente se formaliza la solicitud de compra para los insumos correspondientes a la obra/proyecto "${creada.proyecto_nombre}".\n\nJustificación: ${creada.justificacion || 'Adquisición de materiales para cumplimiento de calendario de obra.'}`,
        solicitante_nombre: solicitanteNombre
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
    setSelectedClienteId('');
    setSelectedProyectoId('');
    setJustificacion('');
    setPartidas([]);
    setSelectedInsumoId('');
    setCustomDescripcion('');
    setItemPrecio(0);
  };

  const handleAutorizar = async (id: string, accion: 'aprobada' | 'rechazada') => {
    if (!isAllowedToEdit) {
      alert('Operación no permitida: Tu usuario está en Modo Visor (solo lectura).');
      return;
    }
    await adminDbService.autorizarSolicitudCompra(id, accion, userName);
    onRefresh();
    if (selectedSolicitud && selectedSolicitud.id === id) {
      setSelectedSolicitud(null);
    }
  };

  const filteredSolicitudes = solicitudes.filter(sol => {
    const matchesSearch = 
      sol.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sol.proyecto_nombre && sol.proyecto_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sol.solicitante_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'todas' || sol.estatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-gold-light">
              Pasos 1 y 2 del Flujo
            </span>
            <h2 className="text-xl font-bold text-cream">Solicitudes de Compra y Autorización</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Los técnicos y residentes solicitan insumos para proyectos. La Dirección/Master evalúa y aprueba para emitir la Orden de Compra (OC).
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
            Nueva Solicitud de Compra
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
            placeholder="Buscar por folio SC, proyecto o solicitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(['todas', 'pendiente', 'aprobada', 'rechazada', 'ordenada'] as const).map(st => (
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

      {/* Tabla de Solicitudes */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        {filteredSolicitudes.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay solicitudes de compra registradas</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              Crea una nueva solicitud para abastecer materiales de obra o compras generales.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio SC / Oficio</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente Conectado</th>
                  <th className="py-3 px-4">Proyecto / Obra</th>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4">Partidas</th>
                  <th className="py-3 px-4 text-right">Total Est.</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">PDF Emitido</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredSolicitudes.map((sol) => (
                  <tr key={sol.id} className="hover:bg-dark-3/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cream">
                      <div>{sol.folio}</div>
                      {sol.folio_oficio && (
                        <span className="text-[10px] font-mono text-gold block font-semibold mt-0.5">
                          {sol.folio_oficio}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-cream-muted">
                      {new Date(sol.fecha).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3 px-4 font-medium text-cream">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                        <span>{sol.cliente_nombre || 'eSol Energías'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-cream">
                      {sol.proyecto_nombre || 'General'}
                    </td>
                    <td className="py-3 px-4 text-cream-muted">
                      {sol.solicitante_nombre}
                    </td>
                    <td className="py-3 px-4 text-cream-muted font-medium">
                      {sol.partidas.length} partidas
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-cream">
                      ${sol.total_estimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                        sol.estatus === 'aprobada' ? 'bg-emerald-100 text-emerald-700' :
                        sol.estatus === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                        sol.estatus === 'ordenada' ? 'bg-blue-100 text-gold-light' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {sol.estatus === 'aprobada' && <CheckCircle className="w-3 h-3" />}
                        {sol.estatus === 'pendiente' && <Clock className="w-3 h-3" />}
                        {sol.estatus === 'rechazada' && <XCircle className="w-3 h-3" />}
                        {sol.estatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sol.pdf_url ? (
                        <a
                          href={sol.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                          title="Ver / Descargar PDF Oficial"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <button
                          onClick={async () => {
                            const ofc = adminDbService.generarOficioSC(sol);
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
                          onClick={() => setSelectedSolicitud(sol)}
                          className="p-1.5 text-cream-muted hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            const ofc = adminDbService.generarOficioSC(sol);
                            setSelectedOficio(ofc);
                            setIsOficioOpen(true);
                          }}
                          className="p-1.5 text-gold hover:text-gold-light hover:bg-gold/15 rounded-lg transition-colors border border-gold/30"
                          title="Emitir / Ver Oficio Formal"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Aprobación rápida para Master / Admin */}
                        {isMasterOrAdmin && sol.estatus === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleAutorizar(sol.id, 'aprobada')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Aprobar Solicitud"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAutorizar(sol.id, 'rechazada')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Rechazar Solicitud"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Generar OC si está aprobada */}
                        {sol.estatus === 'aprobada' && onGenerarOc && (
                          <button
                            onClick={() => onGenerarOc(sol)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-gold/10 text-gold-light hover:bg-blue-100 rounded-lg transition-colors"
                            title="Generar Orden de Compra (Paso 3)"
                          >
                            <span>OC</span>
                            <ArrowRight className="w-3 h-3" />
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

      {/* Modal Nueva Solicitud */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">Nueva Solicitud de Compra</h3>
                <p className="text-xs text-cream-muted">Paso 1: Registra los insumos y solicita autorización de Dirección.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-gold" />
                    <span>Cliente Conectado (CRM)</span>
                  </label>
                  <select
                    value={selectedClienteId}
                    onChange={(e) => setSelectedClienteId(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                  >
                    <option value="">-- Cliente General / eSol --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.rfc ? `(${c.rfc})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Proyecto / Obra (ERP)
                  </label>
                  <select
                    value={selectedProyectoId}
                    onChange={(e) => {
                      const proyId = e.target.value;
                      setSelectedProyectoId(proyId);
                      if (proyId) {
                        const proy = proyectos.find(p => p.id === proyId);
                        if (proy) {
                          const clieMatch = clientes.find(c => c.id === proy.cliente_id || c.nombre.toLowerCase() === (proy.cliente_nombre || '').toLowerCase());
                          if (clieMatch) setSelectedClienteId(clieMatch.id);
                        }
                      }
                    }}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                  >
                    <option value="">-- Compra General / Almacén --</option>
                    {proyectos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.titulo} ({p.cliente_nombre})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Solicitante
                  </label>
                  <input
                    type="text"
                    value={solicitanteNombre}
                    onChange={(e) => setSolicitanteNombre(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Justificación de la Compra
                </label>
                <input
                  type="text"
                  placeholder="Ej: Insumos requeridos para etapa de interconexión y pruebas..."
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                />
              </div>

              {/* Agregar Insumo */}
              <div className="p-4 bg-dark-3 border border-dark-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cream/90">
                  Agregar Material / Insumo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-5">
                    <select
                      value={selectedInsumoId}
                      onChange={(e) => handleSelectInsumo(e.target.value)}
                      className="w-full p-2 bg-dark-2 border border-dark-4 rounded-lg text-xs font-medium"
                    >
                      <option value="">-- Seleccionar de Insumos Existentes --</option>
                      {insumos.map(ins => (
                        <option key={ins.id} value={ins.id}>
                          {ins.nombre} ({ins.unidad}) - ${ins.precio_unitario}
                        </option>
                      ))}
                      <option value="custom">+ Insumo no catalogado</option>
                    </select>
                  </div>

                  {selectedInsumoId === 'custom' && (
                    <div className="md:col-span-4">
                      <input
                        type="text"
                        placeholder="Descripción personalizada..."
                        value={customDescripcion}
                        onChange={(e) => setCustomDescripcion(e.target.value)}
                        className="w-full p-2 bg-dark-2 border border-dark-4 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={itemCantidad}
                      onChange={(e) => setItemCantidad(parseFloat(e.target.value) || 1)}
                      className="w-full p-2 bg-dark-2 border border-dark-4 rounded-lg text-xs text-center font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Precio Est."
                      value={itemPrecio || ''}
                      onChange={(e) => setItemPrecio(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-dark-2 border border-dark-4 rounded-lg text-xs text-center font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 bg-gold text-dark-1 font-bold rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Partidas */}
              {partidas.length > 0 && (
                <div className="border border-dark-4 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-dark-3 font-bold text-cream/90 uppercase">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-center">Unidad</th>
                        <th className="p-2.5 text-center">Cantidad</th>
                        <th className="p-2.5 text-right">Precio Est.</th>
                        <th className="p-2.5 text-right">Importe</th>
                        <th className="p-2.5 text-center">Quitar</th>
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
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 font-bold"
                            >
                              ✕
                            </button>
                          </td>
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
                  onClick={() => handleGuardarSolicitud(false)}
                  disabled={partidas.length === 0}
                  className="px-4 py-2 text-sm font-bold text-gold-light bg-gold/10 hover:bg-blue-100 disabled:opacity-50 rounded-xl border border-gold/30 transition-colors"
                >
                  Guardar Solicitud
                </button>

                <button
                  onClick={() => handleGuardarSolicitud(true)}
                  disabled={partidas.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Guardar + Oficio Oficial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Solicitud */}
      {selectedSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <span className="text-xs font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                  {selectedSolicitud.folio}
                </span>
                <h3 className="text-lg font-bold text-cream mt-1">Detalle de Solicitud de Compra</h3>
              </div>
              <button onClick={() => setSelectedSolicitud(null)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-dark-3 p-4 rounded-xl">
                <div><span className="text-cream-muted text-xs block">Fecha:</span> <span className="font-semibold text-cream">{new Date(selectedSolicitud.fecha).toLocaleString('es-MX')}</span></div>
                <div><span className="text-cream-muted text-xs block">Proyecto:</span> <span className="font-semibold text-cream">{selectedSolicitud.proyecto_nombre || 'General'}</span></div>
                <div><span className="text-cream-muted text-xs block">Solicitado por:</span> <span className="font-semibold text-cream">{selectedSolicitud.solicitante_nombre}</span></div>
                <div>
                  <span className="text-cream-muted text-xs block">Estatus:</span>
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-dark-4 text-cream/90">
                    {selectedSolicitud.estatus}
                  </span>
                </div>
              </div>

              {selectedSolicitud.justificacion && (
                <div className="p-3 bg-gold/10 border border-gold/30 rounded-xl text-xs text-blue-900">
                  <span className="font-bold">Justificación: </span>{selectedSolicitud.justificacion}
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase text-cream-muted mb-2">Partidas Solicitadas</h4>
                <div className="border border-dark-4 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-dark-3 font-bold text-cream/90">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-center">Unidad</th>
                        <th className="p-2.5 text-center">Cantidad</th>
                        <th className="p-2.5 text-right">Precio Est.</th>
                        <th className="p-2.5 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/70">
                      {selectedSolicitud.partidas.map((p, idx) => (
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
              </div>
            </div>

            <div className="p-4 border-t border-dark-4/50 flex justify-between bg-dark-3/50">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const ofc = adminDbService.generarOficioSC(selectedSolicitud);
                    setSelectedOficio(ofc);
                    setIsOficioOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-gold bg-gold/15 hover:bg-gold/25 border border-gold/40 rounded-xl flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Emitir / Ver Oficio</span>
                </button>

                {isMasterOrAdmin && selectedSolicitud.estatus === 'pendiente' && (
                  <>
                    <button
                      onClick={() => handleAutorizar(selectedSolicitud.id, 'aprobada')}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleAutorizar(selectedSolicitud.id, 'rechazada')}
                      className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-xl"
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedSolicitud(null)}
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
