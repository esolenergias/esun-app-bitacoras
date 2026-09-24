import React, { useState } from 'react';
import type { SolicitudMaterial, ProyectoReal, InsumoReal } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import { 
  ClipboardCheck, Plus, CheckCircle, XCircle, Clock, Search, FileText, 
  Send, AlertCircle, Eye, ArrowRight, UserCheck 
} from 'lucide-react';

interface SolicitudesMaterialTabProps {
  solicitudes: SolicitudMaterial[];
  proyectos: ProyectoReal[];
  insumos: InsumoReal[];
  userRole?: string;
  userName?: string;
  onRefresh: () => void;
  onNavigateToOficios?: (folioOficio?: string) => void;
  onGenerarVale?: (solicitud: SolicitudMaterial) => void;
}

export const SolicitudesMaterialTab: React.FC<SolicitudesMaterialTabProps> = ({
  solicitudes,
  proyectos,
  insumos,
  userRole = 'master',
  userName = 'Usuario Admin',
  onRefresh,
  onNavigateToOficios,
  onGenerarVale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada' | 'entregada'>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudMaterial | null>(null);

  // Form State
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [solicitanteNombre, setSolicitanteNombre] = useState(userName);
  const [justificacion, setJustificacion] = useState('');
  const [partidas, setPartidas] = useState<{
    insumo_id: string;
    descripcion: string;
    unidad: string;
    cantidad_solicitada: number;
    cantidad_autorizada: number;
  }[]>([]);

  // Item builder
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [customDescripcion, setCustomDescripcion] = useState('');
  const [itemUnidad, setItemUnidad] = useState('PZA');
  const [itemCantidad, setItemCantidad] = useState(1);

  const isMasterOrAdmin = userRole === 'master' || userRole === 'admin';

  const handleSelectInsumo = (insumoId: string) => {
    setSelectedInsumoId(insumoId);
    if (insumoId === 'custom') {
      setCustomDescripcion('');
      setItemUnidad('PZA');
    } else {
      const ins = insumos.find(i => i.id === insumoId);
      if (ins) {
        setCustomDescripcion(ins.nombre);
        setItemUnidad(ins.unidad || 'PZA');
      }
    }
  };

  const handleAddItem = () => {
    if (!customDescripcion.trim() || itemCantidad <= 0) {
      alert('Por favor ingrese una descripción y cantidad válida.');
      return;
    }

    setPartidas([
      ...partidas,
      {
        insumo_id: selectedInsumoId,
        descripcion: customDescripcion.trim(),
        unidad: itemUnidad,
        cantidad_solicitada: itemCantidad,
        cantidad_autorizada: itemCantidad
      }
    ]);

    setSelectedInsumoId('');
    setCustomDescripcion('');
    setItemCantidad(1);
  };

  const handleRemoveItem = (index: number) => {
    setPartidas(partidas.filter((_, idx) => idx !== index));
  };

  const handleGuardarSolicitud = async (conOficio = false) => {
    if (!selectedProyectoId) {
      alert('Seleccione un Proyecto / Presupuesto de obra.');
      return;
    }
    if (partidas.length === 0) {
      alert('Agregue al menos un insumo/material a la solicitud.');
      return;
    }

    const proy = proyectos.find(p => p.id === selectedProyectoId);
    const nuevaSol: Partial<SolicitudMaterial> = {
      proyecto_id: selectedProyectoId,
      proyecto_nombre: proy?.titulo || 'Proyecto General',
      solicitante_nombre: solicitanteNombre,
      justificacion,
      partidas: partidas
    };

    const creada = await adminDbService.crearSolicitudMaterial(nuevaSol);

    if (conOficio) {
      const oficio = await adminDbService.crearOficioDesdeSolicitud({
        tipo: 'material',
        folio_referencia: creada.folio,
        destinatario: 'Encargado de Almacén General',
        asunto: `Solicitud de Material para Obra: ${creada.proyecto_nombre}`,
        cuerpo: `Por medio del presente oficio se solicita formalmente la entrega de los materiales listados en la solicitud ${creada.folio} para la ejecución de los trabajos en la obra/proyecto "${creada.proyecto_nombre}".\n\nJustificación: ${creada.justificacion || 'Materiales requeridos según catálogo de conceptos.'}`,
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
    setSelectedProyectoId('');
    setJustificacion('');
    setPartidas([]);
    setSelectedInsumoId('');
    setCustomDescripcion('');
  };

  const handleAutorizar = async (id: string, accion: 'aprobada' | 'rechazada') => {
    await adminDbService.autorizarSolicitudMaterial(id, accion, userName);
    onRefresh();
    if (selectedSolicitud && selectedSolicitud.id === id) {
      setSelectedSolicitud(null);
    }
  };

  const filteredSolicitudes = solicitudes.filter(sol => {
    const matchesSearch = 
      sol.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.proyecto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
              Pasos 6 y 7 del Flujo
            </span>
            <h2 className="text-xl font-bold text-cream">Solicitud y Autorización de Material a Obra</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Los residentes y técnicos solicitan material por proyecto. La Dirección/Master aprueba y autoriza la salida hacia el Vale de Entrega.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm shadow-md shadow-violet-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Solicitud de Material
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por folio, proyecto o residente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(['todas', 'pendiente', 'aprobada', 'rechazada', 'entregada'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-violet-600 text-white'
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
            <ClipboardCheck className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay solicitudes de material registradas</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              Crea una nueva solicitud asignada a un proyecto de obra para iniciar el proceso de salida de insumos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Proyecto / Obra</th>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4">Partidas</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredSolicitudes.map((sol) => (
                  <tr key={sol.id} className="hover:bg-dark-3/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cream">
                      {sol.folio}
                    </td>
                    <td className="py-3 px-4 text-cream-muted">
                      {new Date(sol.fecha_solicitud).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-cream">
                      {sol.proyecto_nombre}
                    </td>
                    <td className="py-3 px-4 text-cream-muted">
                      {sol.solicitante_nombre}
                    </td>
                    <td className="py-3 px-4 text-cream-muted font-medium">
                      {sol.partidas.length} ítems
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                        sol.estatus === 'aprobada' ? 'bg-emerald-100 text-emerald-700' :
                        sol.estatus === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                        sol.estatus === 'entregada' ? 'bg-blue-100 text-gold-light' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {sol.estatus === 'aprobada' && <CheckCircle className="w-3 h-3" />}
                        {sol.estatus === 'pendiente' && <Clock className="w-3 h-3" />}
                        {sol.estatus === 'rechazada' && <XCircle className="w-3 h-3" />}
                        {sol.estatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSolicitud(sol)}
                          className="p-1.5 text-cream-muted hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Autorizacion rapida para Master/Admin */}
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

                        {/* Si ya está aprobada, permitir generar Vale de Entrega */}
                        {sol.estatus === 'aprobada' && onGenerarVale && (
                          <button
                            onClick={() => onGenerarVale(sol)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Generar Vale de Entrega (Paso 8)"
                          >
                            <span>Vale</span>
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
                <h3 className="text-lg font-bold text-cream">Nueva Solicitud de Material a Obra</h3>
                <p className="text-xs text-cream-muted">Paso 6: Selecciona el proyecto de obra y los insumos requeridos del inventario.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Proyecto / Obra de Destino *
                  </label>
                  <select
                    value={selectedProyectoId}
                    onChange={(e) => setSelectedProyectoId(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2 focus:border-violet-500"
                  >
                    <option value="">-- Seleccione un Proyecto --</option>
                    {proyectos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.titulo} ({p.cliente_nombre})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Solicitante / Residente
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
                  Justificación / Tramo de Trabajo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cableado y estructura de soporte para paneles en tejado..."
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                />
              </div>

              {/* Agregar Material */}
              <div className="p-4 bg-dark-3 border border-dark-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cream/90">
                  Agregar Material / Insumo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-6">
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
                    <div className="md:col-span-6">
                      <input
                        type="text"
                        placeholder="Descripción del material personalizado..."
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
                      type="text"
                      placeholder="Unidad"
                      value={itemUnidad}
                      onChange={(e) => setItemUnidad(e.target.value)}
                      className="w-full p-2 bg-dark-2 border border-dark-4 rounded-lg text-xs text-center"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors"
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
                        <th className="p-2.5 text-center">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/70">
                      {partidas.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-cream">{p.descripcion}</td>
                          <td className="p-2.5 text-center text-cream-muted">{p.unidad}</td>
                          <td className="p-2.5 text-center font-bold text-cream">{p.cantidad_solicitada}</td>
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
                  disabled={partidas.length === 0 || !selectedProyectoId}
                  className="px-4 py-2 text-sm font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 rounded-xl border border-violet-200 transition-colors"
                >
                  Guardar Solicitud
                </button>

                <button
                  onClick={() => handleGuardarSolicitud(true)}
                  disabled={partidas.length === 0 || !selectedProyectoId}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-violet-500/20 transition-all"
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
                <span className="text-xs font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                  {selectedSolicitud.folio}
                </span>
                <h3 className="text-lg font-bold text-cream mt-1">Detalle de Solicitud de Material</h3>
              </div>
              <button onClick={() => setSelectedSolicitud(null)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-dark-3 p-4 rounded-xl">
                <div><span className="text-cream-muted text-xs block">Fecha:</span> <span className="font-semibold text-cream">{new Date(selectedSolicitud.fecha_solicitud).toLocaleString('es-MX')}</span></div>
                <div><span className="text-cream-muted text-xs block">Proyecto:</span> <span className="font-semibold text-cream">{selectedSolicitud.proyecto_nombre}</span></div>
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
                <h4 className="text-xs font-bold uppercase text-cream-muted mb-2">Partidas Requeridas</h4>
                <div className="border border-dark-4 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-dark-3 font-bold text-cream/90">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-center">Unidad</th>
                        <th className="p-2.5 text-center">Cant. Solicitada</th>
                        <th className="p-2.5 text-center">Cant. Autorizada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/70">
                      {selectedSolicitud.partidas.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-cream font-medium">{p.descripcion}</td>
                          <td className="p-2.5 text-center text-cream-muted">{p.unidad}</td>
                          <td className="p-2.5 text-center font-bold text-cream/90">{p.cantidad_solicitada}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-600">{p.cantidad_autorizada}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-dark-4/50 flex justify-between bg-dark-3/50">
              <div className="flex gap-2">
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
    </div>
  );
};
