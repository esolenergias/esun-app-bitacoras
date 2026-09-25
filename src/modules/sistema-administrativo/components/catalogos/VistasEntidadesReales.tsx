import React, { useState, useEffect } from 'react';
import type { ClienteReal, ProyectoReal, InsumoReal } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import type { OficioData } from '../../../../components/legal/oficios/types';
import OficioPreviewModal from '../../../../components/legal/oficios/OficioPreviewModal';
import { generateOficioPdf } from '../../../../components/legal/oficios/oficioPdfGenerator';
import { 
  Users, Briefcase, Boxes, BookOpen, FileText, Search, ExternalLink, Phone, Mail, MapPin, DollarSign, Calendar,
  List, LayoutGrid, Tag, CheckCircle, Percent, Plus, Edit, Trash2, X, Save, AlertCircle, Loader2, FileSignature, Printer, Eye
} from 'lucide-react';

/* =========================================================================
   1. CLIENTES CRM VIEW (CON EDICIÓN Y CREACIÓN BILATERAL DIRECTA A SUPABASE)
   ========================================================================= */
interface ClientesViewProps {
  clientes: ClienteReal[];
  onRefresh?: () => void;
}

export const ClientesAdminView: React.FC<ClientesViewProps> = ({ clientes, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'filas' | 'fichas'>('filas');
  
  // Oficios cargados
  const [allOficios, setAllOficios] = useState<OficioData[]>([]);
  const [loadingOficios, setLoadingOficios] = useState(false);
  const [selectedPreviewOficio, setSelectedPreviewOficio] = useState<OficioData | null>(null);

  // Cargar oficios al montar
  useEffect(() => {
    const loadOficios = async () => {
      try {
        setLoadingOficios(true);
        const data = await adminDbService.getOficiosCompletos();
        setAllOficios(data);
      } catch (err) {
        console.warn('Error al cargar oficios en CRM Clientes:', err);
      } finally {
        setLoadingOficios(false);
      }
    };
    loadOficios();
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'datos' | 'oficios'>('datos');
  const [selectedCliente, setSelectedCliente] = useState<ClienteReal | null>(null);
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleOpenCreate = () => {
    setSelectedCliente(null);
    setNombre('');
    setRfc('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setActiveModalTab('datos');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClienteReal, tab: 'datos' | 'oficios' = 'datos') => {
    setSelectedCliente(c);
    setNombre(c.nombre);
    setRfc(c.rfc || '');
    setTelefono(c.telefono || '');
    setEmail(c.email || '');
    setDireccion(c.direccion || '');
    setActiveModalTab(tab);
    setIsModalOpen(true);
  };

  // Helper para filtrar oficios de un cliente
  const getOficiosDelCliente = (cliente: ClienteReal) => {
    const cName = cliente.nombre.toLowerCase().trim();
    const cRfc = (cliente.rfc || '').toLowerCase().trim();
    return allOficios.filter(o => {
      const ofCliente = (o.clienteFinal || '').toLowerCase().trim();
      const ofDestNombre = (o.destinatarioNombre || '').toLowerCase().trim();
      const ofDestEmpresa = (o.destinatarioEmpresa || '').toLowerCase().trim();
      const ofAsunto = (o.asunto || '').toLowerCase().trim();
      const ofRef = (o.referencia || '').toLowerCase().trim();

      const matchesName = (ofCliente && (ofCliente.includes(cName) || cName.includes(ofCliente))) ||
                          (ofDestNombre && (ofDestNombre.includes(cName) || cName.includes(ofDestNombre))) ||
                          (ofDestEmpresa && (ofDestEmpresa.includes(cName) || cName.includes(ofDestEmpresa))) ||
                          (ofAsunto && ofAsunto.includes(cName)) ||
                          (ofRef && ofRef.includes(cName));

      const matchesRfc = cRfc && (
        (o.empresaRFC && o.empresaRFC.toLowerCase().includes(cRfc)) ||
        (ofRef && ofRef.includes(cRfc))
      );

      return matchesName || matchesRfc;
    });
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      alert('El nombre o razón social del cliente es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      await adminDbService.guardarClienteReal({
        id: selectedCliente?.id,
        nombre: nombre.trim(),
        rfc: rfc.trim().toUpperCase(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim()
      });
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error al guardar cliente en la base de datos: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedCliente) return;
    if (!window.confirm(`¿Estás seguro de eliminar a "${selectedCliente.nombre}" de la base de datos?`)) return;

    try {
      setDeleting(true);
      await adminDbService.eliminarClienteReal(selectedCliente.id);
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error al eliminar cliente: ${err?.message || err}`);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.telefono && c.telefono.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.rfc && c.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-mono">
              Base de Datos Supabase ({clientes.length})
            </span>
            <h2 className="text-xl font-bold text-cream">Clientes Registrados (CRM)</h2>
          </div>
          <p className="text-xs text-cream-muted mt-1">Conectado y editable en tiempo real con la tabla `public.clientes`.</p>
        </div>

        {/* Action button, view mode toggle & search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-xs shadow-md shadow-gold/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Registrar Cliente
          </button>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-dark-3 p-1 rounded-xl border border-dark-4">
            <button
              onClick={() => setViewMode('filas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'filas'
                  ? 'bg-gold text-dark-1 shadow-sm'
                  : 'text-cream-muted hover:text-cream'
              }`}
              title="Ver en Filas (Tabla)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Filas</span>
            </button>
            <button
              onClick={() => setViewMode('fichas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'fichas'
                  ? 'bg-gold text-dark-1 shadow-sm'
                  : 'text-cream-muted hover:text-cream'
              }`}
              title="Ver en Fichas (Cuadrícula)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Fichas</span>
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-3 border border-dark-4 rounded-xl text-xs text-cream placeholder-cream-muted/50 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-dark-2 p-12 rounded-2xl border border-dark-4 text-center">
          <Users className="w-12 h-12 text-cream-dim/40 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-cream">No hay clientes encontrados</h4>
          <p className="text-xs text-cream-muted mt-1">
            Los clientes se consultan en tiempo real desde la tabla `clientes` de tu base de datos.
          </p>
        </div>
      ) : viewMode === 'filas' ? (
        /* VISTA EN FILAS (TABLA) */
        <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Cliente / Razón Social</th>
                  <th className="py-3.5 px-4">RFC</th>
                  <th className="py-3.5 px-4">Teléfono</th>
                  <th className="py-3.5 px-4">Correo Electrónico</th>
                  <th className="py-3.5 px-4">Dirección / Ubicación</th>
                  <th className="py-3.5 px-4 text-center">Oficios Emitidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70 text-xs">
                {filtered.map((c, index) => {
                  const clientOficios = getOficiosDelCliente(c);
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => handleOpenEdit(c)}
                      className="hover:bg-dark-3/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono text-cream-dim text-[11px]">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gold/10 text-gold border border-gold/25 flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-gold group-hover:text-dark-1 transition-colors">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-cream text-sm group-hover:text-gold transition-colors">{c.nombre}</div>
                            <div className="text-[10px] text-cream-dim font-mono">ID: {c.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gold">
                        {c.rfc || '—'}
                      </td>
                      <td className="py-3 px-4 text-cream/90 font-mono">
                        {c.telefono ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-cream-dim" />
                            {c.telefono}
                          </span>
                        ) : (
                          <span className="text-cream-dim">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-cream/90">
                        {c.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-cream-dim" />
                            {c.email}
                          </span>
                        ) : (
                          <span className="text-cream-dim">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-cream-muted max-w-xs truncate">
                        {c.direccion ? (
                          <span className="flex items-center gap-1.5" title={c.direccion}>
                            <MapPin className="w-3 h-3 text-cream-dim flex-shrink-0" />
                            <span className="truncate">{c.direccion}</span>
                          </span>
                        ) : (
                          <span className="text-cream-dim">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {clientOficios.length > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(c, 'oficios');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-dark-1 font-bold text-[11px] transition-all"
                            title="Ver oficios vinculados"
                          >
                            <FileSignature className="w-3 h-3" />
                            <span>{clientOficios.length} oficio{clientOficios.length === 1 ? '' : 's'}</span>
                          </button>
                        ) : (
                          <span className="text-cream-dim/60 font-mono text-[11px]">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA EN FICHAS (CUADRÍCULA) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const clientOficios = getOficiosDelCliente(c);
            return (
              <div 
                key={c.id} 
                onClick={() => handleOpenEdit(c)}
                className="bg-dark-2 p-4 rounded-2xl border border-dark-4 shadow-sm space-y-2 hover:border-gold/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold border border-gold/25 flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-gold group-hover:text-dark-1 transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-cream text-sm truncate group-hover:text-gold transition-colors">{c.nombre}</h4>
                      <div className="text-[11px] text-gold/80 font-mono">{c.rfc || 'Sin RFC'}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(c);
                    }}
                    className="p-1.5 text-cream-dim hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-cream-muted space-y-1 pt-2 border-t border-dark-4/50">
                  {c.telefono && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-cream-dim" /> {c.telefono}</div>}
                  {c.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-cream-dim" /> {c.email}</div>}
                  {c.direccion && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cream-dim" /> {c.direccion}</div>}
                  <div className="pt-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-cream-dim">Oficios vinculados:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(c, 'oficios');
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10.5px] transition-all ${
                        clientOficios.length > 0
                          ? 'bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-dark-1'
                          : 'bg-dark-3 text-cream-dim border border-dark-4'
                      }`}
                    >
                      <FileSignature className="w-3 h-3" />
                      <span>{clientOficios.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editar / Crear Cliente y Ver Oficios Vinculados */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-3xl w-full shadow-2xl border border-dark-4/50 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream">
                    {selectedCliente ? selectedCliente.nombre : 'Registrar Nuevo Cliente'}
                  </h3>
                  <p className="text-xs text-cream-muted">
                    {selectedCliente ? `ID: ${selectedCliente.id} • Actualización bilateral directa en Supabase` : 'Registro en base de datos CRM'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            {/* Pestañas del Modal (Datos Generales vs Oficios Emitidos) */}
            {selectedCliente && (
              <div className="flex items-center border-b border-dark-4 bg-dark-3/30 px-6 pt-2 gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('datos')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                    activeModalTab === 'datos'
                      ? 'border-gold text-gold'
                      : 'border-transparent text-cream-muted hover:text-cream'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Datos del Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('oficios')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                    activeModalTab === 'oficios'
                      ? 'border-gold text-gold'
                      : 'border-transparent text-cream-muted hover:text-cream'
                  }`}
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Oficios Emitidos ({getOficiosDelCliente(selectedCliente).length})</span>
                </button>
              </div>
            )}

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {activeModalTab === 'datos' || !selectedCliente ? (
                <>
                  <div>
                    <label className="block font-bold text-cream/90 uppercase mb-1">
                      Nombre o Razón Social *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Manuel Alejandro Fregoso o Empresa S.A."
                      className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium text-cream focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-cream/90 uppercase mb-1">
                        RFC
                      </label>
                      <input
                        type="text"
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        placeholder="FESM880101XX1"
                        className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono text-cream focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-cream/90 uppercase mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="311 123 4567"
                        className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono text-cream focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-cream/90 uppercase mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contacto@cliente.com"
                      className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-cream/90 uppercase mb-1">
                      Dirección / Ubicación
                    </label>
                    <textarea
                      rows={2}
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Av. Insurgentes 123, Col. Centro, Tepic, Nayarit"
                      className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                /* TAB DE OFICIOS EMITIDOS DEL CLIENTE */
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-dark-3/60 p-3 rounded-xl border border-dark-4">
                    <div>
                      <span className="font-bold text-cream block text-xs">
                        Expediente de Oficios y Comunicados Oficiales
                      </span>
                      <p className="text-[11px] text-cream-muted">
                        Oficios generados y enlazados a {selectedCliente.nombre}.
                      </p>
                    </div>
                    <span className="font-mono text-gold font-bold text-xs bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/30">
                      {getOficiosDelCliente(selectedCliente).length} registrados
                    </span>
                  </div>

                  {getOficiosDelCliente(selectedCliente).length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-dark-4 rounded-2xl bg-dark-3/30 space-y-2">
                      <FileSignature className="w-8 h-8 text-cream-dim/40 mx-auto" />
                      <p className="text-cream text-xs font-semibold">No hay oficios emitidos vinculados a este cliente aún.</p>
                      <p className="text-[11px] text-cream-muted max-w-md mx-auto">
                        Los oficios redactados desde el <strong>Centro de Oficios</strong> con este cliente seleccionado aparecerán automáticamente aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-dark-4">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-dark-3 text-cream-muted uppercase font-bold text-[10.5px]">
                          <tr>
                            <th className="py-2.5 px-3">Folio</th>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Asunto / Obra</th>
                            <th className="py-2.5 px-3">Destinatario</th>
                            <th className="py-2.5 px-3 text-center">Estado</th>
                            <th className="py-2.5 px-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-4">
                          {getOficiosDelCliente(selectedCliente).map((of, idx) => (
                            <tr key={idx} className="hover:bg-dark-3/50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-gold">
                                {of.folio || 'S/F'}
                              </td>
                              <td className="py-2.5 px-3 text-cream-dim font-mono">
                                {of.fecha || '—'}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-cream max-w-xs truncate" title={of.asunto}>
                                  {of.asunto || 'Oficio Oficial'}
                                </div>
                                {of.nombreObra && (
                                  <div className="text-[10px] text-cream-muted truncate" title={of.nombreObra}>
                                    Obra: {of.nombreObra}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-cream-dim">
                                <div>{of.destinatarioNombre || '—'}</div>
                                {of.destinatarioEmpresa && (
                                  <div className="text-[10px] text-cream-muted">{of.destinatarioEmpresa}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase font-mono ${
                                  of.estado === 'emitido' || !of.estado
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {of.estado || 'emitido'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPreviewOficio(of)}
                                    className="p-1.5 text-cream-muted hover:text-gold hover:bg-gold/10 rounded-lg transition-colors cursor-pointer"
                                    title="Previsualizar documento"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  {of.drive_url ? (
                                    <a
                                      href={of.drive_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                      title="Abrir PDF en Drive"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await generateOficioPdf(of);
                                        } catch (err: any) {
                                          alert('Error al generar PDF: ' + err?.message);
                                        }
                                      }}
                                      className="p-1.5 text-cream-muted hover:text-gold hover:bg-gold/10 rounded-lg transition-colors cursor-pointer"
                                      title="Descargar / Imprimir PDF"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
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
              )}
            </div>

            <div className="p-6 border-t border-dark-4/50 flex justify-between items-center bg-dark-3/50 flex-shrink-0">
              {selectedCliente && activeModalTab === 'datos' ? (
                <button
                  onClick={handleEliminar}
                  disabled={deleting || saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
                {(activeModalTab === 'datos' || !selectedCliente) && (
                  <button
                    onClick={handleGuardar}
                    disabled={saving || deleting || !nombre.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-dark-1 bg-gold hover:bg-gold-light disabled:opacity-50 rounded-xl shadow-md transition-all"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? 'Guardando en BD...' : 'Guardar Cliente'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Previsualización Oficial de Oficio */}
      {selectedPreviewOficio && (
        <OficioPreviewModal
          isOpen={Boolean(selectedPreviewOficio)}
          onClose={() => setSelectedPreviewOficio(null)}
          oficio={selectedPreviewOficio}
        />
      )}
    </div>
  );
};

/* =========================================================================
   2. PROYECTOS Y PRESUPUESTOS VIEW (CON EDICIÓN Y CREACIÓN BILATERAL)
   ========================================================================= */
interface ProyectosViewProps {
  proyectos: ProyectoReal[];
  onRefresh?: () => void;
}

export const ProyectosAdminView: React.FC<ProyectosViewProps> = ({ proyectos, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'filas' | 'fichas'>('filas');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoReal | null>(null);
  const [titulo, setTitulo] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [estatus, setEstatus] = useState('borrador');
  const [indirectPct, setIndirectPct] = useState(10);
  const [utilityPct, setUtilityPct] = useState(8);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getStatusBadgeStyles = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'borrador':
        return { label: 'Borrador', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
      case 'enviado':
        return { label: 'Enviado', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      case 'aprobado':
        return { label: 'Aprobado', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'realizado':
        return { label: 'Realizado', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
      case 'rechazado':
        return { label: 'Rechazado', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
      default:
        return { label: status || 'Borrador', cls: 'bg-dark-3 text-cream-muted border-dark-4' };
    }
  };

  const handleOpenCreate = () => {
    setSelectedProyecto(null);
    setTitulo('');
    setClienteNombre('');
    setEstatus('borrador');
    setIndirectPct(10);
    setUtilityPct(8);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProyectoReal) => {
    setSelectedProyecto(p);
    setTitulo(p.titulo);
    setClienteNombre(p.cliente_nombre || '');
    setEstatus(p.estatus || 'borrador');
    setIndirectPct(p.indirect_percentage ?? 10);
    setUtilityPct(p.utility_percentage ?? 8);
    setIsModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!titulo.trim()) {
      alert('El nombre del proyecto / presupuesto es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      await adminDbService.guardarProyectoReal({
        id: selectedProyecto?.id,
        titulo: titulo.trim(),
        cliente_nombre: clienteNombre.trim() || 'Cliente General',
        estatus: estatus,
        indirect_percentage: indirectPct,
        utility_percentage: utilityPct
      });
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error al guardar proyecto en base de datos: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedProyecto) return;
    if (!window.confirm(`¿Estás seguro de eliminar el proyecto "${selectedProyecto.titulo}"?`)) return;

    try {
      setDeleting(true);
      await adminDbService.eliminarProyectoReal(selectedProyecto.id);
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error al eliminar proyecto: ${err?.message || err}`);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = proyectos.filter(p => 
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.folio && p.folio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              Base de Datos Supabase ({proyectos.length})
            </span>
            <h2 className="text-xl font-bold text-cream">Proyectos y Presupuestos</h2>
          </div>
          <p className="text-xs text-cream-muted mt-1">Conectado y editable en tiempo real con la tabla `public.presupuestos`.</p>
        </div>

        {/* View mode toggle & search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-xs shadow-md shadow-gold/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </button>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-dark-3 p-1 rounded-xl border border-dark-4">
            <button
              onClick={() => setViewMode('filas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'filas'
                  ? 'bg-gold text-dark-1 shadow-sm'
                  : 'text-cream-muted hover:text-cream'
              }`}
              title="Ver en Filas (Tabla)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Filas</span>
            </button>
            <button
              onClick={() => setViewMode('fichas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'fichas'
                  ? 'bg-gold text-dark-1 shadow-sm'
                  : 'text-cream-muted hover:text-cream'
              }`}
              title="Ver en Fichas (Cuadrícula)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Fichas</span>
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input
              type="text"
              placeholder="Buscar proyecto o presupuesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-3 border border-dark-4 rounded-xl text-xs text-cream placeholder-cream-muted/50 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-dark-2 p-12 rounded-2xl border border-dark-4 text-center">
          <Briefcase className="w-12 h-12 text-cream-dim/40 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-cream">No hay proyectos registrados</h4>
          <p className="text-xs text-cream-muted mt-1">
            Los proyectos se consultan en tiempo real desde la tabla `presupuestos` de tu base de datos.
          </p>
        </div>
      ) : viewMode === 'filas' ? (
        /* VISTA EN FILAS (TABLA) */
        <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Folio</th>
                  <th className="py-3.5 px-4">Proyecto / Obra</th>
                  <th className="py-3.5 px-4">Cliente Asignado</th>
                  <th className="py-3.5 px-4 text-center">Estatus</th>
                  <th className="py-3.5 px-4 text-right">Costo Directo</th>
                  <th className="py-3.5 px-4 text-right">Total Presupuesto</th>
                  <th className="py-3.5 px-4 text-right">Margen Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70 text-xs">
                {filtered.map(p => {
                  const utilidadEst = p.total - p.costo_directo;
                  const margenEst = p.total > 0 ? (utilidadEst / p.total) * 100 : 0;
                  const badge = getStatusBadgeStyles(p.estatus);
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleOpenEdit(p)}
                      className="hover:bg-dark-3/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-gold">
                        {p.folio || p.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-cream text-sm group-hover:text-gold transition-colors">{p.titulo}</div>
                        <div className="text-[10px] text-cream-dim font-mono">ID: {p.id.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-cream/90">
                        {p.cliente_nombre}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-cream-muted">
                        ${p.costo_directo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gold">
                        ${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded-full ${
                          margenEst >= 25 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {margenEst.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA EN FICHAS (CUADRÍCULA) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const badge = getStatusBadgeStyles(p.estatus);
            return (
              <div 
                key={p.id} 
                onClick={() => handleOpenEdit(p)}
                className="bg-dark-2 p-4 rounded-2xl border border-dark-4 shadow-sm flex flex-col justify-between hover:border-gold/40 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-gold bg-gold/10 border border-gold/25 px-2 py-0.5 rounded">
                        {p.folio || p.id.slice(0, 8)}
                      </span>
                      <h4 className="font-bold text-cream text-sm mt-1 group-hover:text-gold transition-colors">{p.titulo}</h4>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-xs text-cream-muted mt-2">
                    Cliente: <span className="font-semibold text-cream/90">{p.cliente_nombre}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dark-4/50 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-cream-dim text-[10px] block">Presupuesto Venta</span>
                    <span className="font-mono font-bold text-gold text-sm">${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-cream-dim text-[10px] block">Costo Directo</span>
                    <span className="font-mono font-bold text-cream-muted">${p.costo_directo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editar / Crear Proyecto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-lg w-full shadow-2xl border border-dark-4/50 overflow-hidden">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream">
                    {selectedProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                  </h3>
                  <p className="text-xs text-cream-muted">Actualización bilateral directa en Supabase `presupuestos`</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-cream/90 uppercase mb-1">
                  Nombre de la Obra o Proyecto *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Instalación Fotovoltaica Residencial 10kWp"
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium text-cream focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-cream/90 uppercase mb-1">
                  Cliente Asignado
                </label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre del cliente o razón social"
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-cream/90 uppercase mb-1">
                  Estatus del Proyecto
                </label>
                <select
                  value={estatus}
                  onChange={(e) => setEstatus(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold text-cream focus:border-gold focus:outline-none"
                >
                  <option value="borrador">Borrador</option>
                  <option value="enviado">Enviado</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="realizado">Realizado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    % Costos Indirectos
                  </label>
                  <input
                    type="number"
                    value={indirectPct}
                    onChange={(e) => setIndirectPct(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono text-center text-cream focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    % Margen Utilidad
                  </label>
                  <input
                    type="number"
                    value={utilityPct}
                    onChange={(e) => setUtilityPct(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono text-center text-cream focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              {selectedProyecto ? (
                <button
                  onClick={handleEliminar}
                  disabled={deleting || saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={saving || deleting || !titulo.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-dark-1 bg-gold hover:bg-gold-light disabled:opacity-50 rounded-xl shadow-md transition-all"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Guardando en BD...' : 'Guardar Proyecto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3. INSUMOS Y MATERIALES VIEW (CON EDICIÓN Y CREACIÓN BILATERAL)
   ========================================================================= */
interface InsumosViewProps {
  insumos: InsumoReal[];
  onRefresh?: () => void;
}

export const MaterialesAdminView: React.FC<InsumosViewProps> = ({ insumos, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'filas' | 'fichas'>('filas');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<InsumoReal | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Paneles');
  const [unidad, setUnidad] = useState('PZA');
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [tipo, setTipo] = useState('material');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleOpenCreate = () => {
    setSelectedInsumo(null);
    setCodigo('');
    setNombre('');
    setCategoria('Paneles');
    setUnidad('PZA');
    setPrecioUnitario(0);
    setTipo('material');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (i: InsumoReal) => {
    setSelectedInsumo(i);
    setCodigo(i.codigo || '');
    setNombre(i.nombre);
    setCategoria(i.categoria || 'General');
    setUnidad(i.unidad || 'PZA');
    setPrecioUnitario(i.precio_unitario || 0);
    setTipo(i.tipo || 'material');
    setIsModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!codigo.trim() || !nombre.trim()) {
      alert('El código y la descripción del insumo son obligatorios.');
      return;
    }

    try {
      setSaving(true);
      await adminDbService.guardarInsumoReal({
        id: selectedInsumo?.id,
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        categoria: categoria.trim(),
        unidad: unidad.trim().toUpperCase(),
        precio_unitario: precioUnitario,
        tipo: tipo
      });
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error al guardar insumo en base de datos: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedInsumo) return;
    if (!window.confirm(`¿Estás seguro de eliminar el insumo "${selectedInsumo.nombre}" del catálogo maestro?`)) return;

    try {
      setDeleting(true);
      await adminDbService.eliminarInsumoReal(selectedInsumo.id);
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error al eliminar insumo: ${err?.message || err}`);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = insumos.filter(i => 
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.codigo && i.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.categoria && i.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-mono">
              Base de Datos Supabase ({insumos.length})
            </span>
            <h2 className="text-xl font-bold text-cream">Catálogo Maestro de Insumos y Materiales</h2>
          </div>
          <p className="text-xs text-cream-muted mt-1">Conectado y editable en tiempo real con la tabla `public.insumos`.</p>
        </div>

        {/* View mode toggle & search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-xs shadow-md shadow-gold/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Registrar Insumo
          </button>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-dark-3 p-1 rounded-xl border border-dark-4">
            <button
              onClick={() => setViewMode('filas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'filas'
                  ? 'bg-gold text-dark-1 shadow-sm'
                  : 'text-cream-muted hover:text-cream'
              }`}
              title="Ver en Filas (Tabla)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Filas</span>
            </button>
            <button
              onClick={() => setViewMode('fichas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'fichas'
                  ? 'bg-gold text-dark-1 shadow-sm'
                  : 'text-cream-muted hover:text-cream'
              }`}
              title="Ver en Fichas (Cuadrícula)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Fichas</span>
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input
              type="text"
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-3 border border-dark-4 rounded-xl text-xs text-cream placeholder-cream-muted/50 focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-dark-2 p-12 rounded-2xl border border-dark-4 text-center">
          <Boxes className="w-12 h-12 text-cream-dim/40 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-cream">No hay insumos registrados</h4>
          <p className="text-xs text-cream-muted mt-1">
            Los insumos se leen directamente desde la tabla `insumos` del Cotizador Maestro.
          </p>
        </div>
      ) : viewMode === 'filas' ? (
        /* VISTA EN FILAS (TABLA) */
        <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Descripción / Material</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4 text-center">Unidad</th>
                  <th className="py-3.5 px-4 text-right">Costo / P.U. Base</th>
                  <th className="py-3.5 px-4 text-center">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70 text-xs">
                {filtered.map((i, index) => (
                  <tr 
                    key={i.id} 
                    onClick={() => handleOpenEdit(i)}
                    className="hover:bg-dark-3/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-cream-dim text-[11px]">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gold group-hover:underline">{i.codigo || '—'}</td>
                    <td className="py-3 px-4 font-bold text-cream text-sm group-hover:text-gold transition-colors">{i.nombre}</td>
                    <td className="py-3 px-4 text-cream-muted">{i.categoria || 'General'}</td>
                    <td className="py-3 px-4 text-center font-semibold text-cream/90">{i.unidad}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      ${i.precio_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-dark-3 text-cream-muted border border-dark-4">
                        {i.tipo || 'material'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA EN FICHAS (CUADRÍCULA) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(i => (
            <div 
              key={i.id} 
              onClick={() => handleOpenEdit(i)}
              className="bg-dark-2 p-4 rounded-2xl border border-dark-4 shadow-sm flex flex-col justify-between hover:border-gold/40 transition-colors cursor-pointer group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold text-gold bg-gold/10 border border-gold/25 px-2 py-0.5 rounded">
                    {i.codigo || 'S/C'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-dark-3 text-cream-muted border border-dark-4">
                      {i.unidad}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(i);
                      }}
                      className="p-1 text-cream-dim hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-cream text-sm mt-2 group-hover:text-gold transition-colors">{i.nombre}</h4>
                <div className="text-xs text-cream-muted mt-1">
                  Categoría: <span className="font-semibold text-cream/90">{i.categoria || 'General'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dark-4/50 flex justify-between items-center text-xs">
                <div>
                  <span className="text-cream-dim text-[10px] block">Tipo</span>
                  <span className="font-semibold text-cream uppercase text-[11px]">{i.tipo || 'Material'}</span>
                </div>
                <div className="text-right">
                  <span className="text-cream-dim text-[10px] block">Precio Base</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ${i.precio_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editar / Crear Insumo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-lg w-full shadow-2xl border border-dark-4/50 overflow-hidden">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream">
                    {selectedInsumo ? 'Editar Insumo Maestro' : 'Registrar Insumo Maestro'}
                  </h3>
                  <p className="text-xs text-cream-muted">Actualización bilateral directa en Supabase `insumos`</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Código Único *
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="PAN-550W"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono font-bold text-gold focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Categoría / Subcategoría
                  </label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Paneles, Inversores, Estructuras..."
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-cream/90 uppercase mb-1">
                  Descripción del Material / Insumo *
                </label>
                <textarea
                  rows={2}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Panel Solar Monocristalino 550W Tier 1..."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium text-cream focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Unidad
                  </label>
                  <input
                    type="text"
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value.toUpperCase())}
                    placeholder="PZA, M, KG..."
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono text-center text-cream focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Tipo de Insumo
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                  >
                    <option value="material">Material</option>
                    <option value="mano_obra">Mano de Obra</option>
                    <option value="equipo">Equipo / Maquinaria</option>
                    <option value="subcontrato">Subcontrato</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Costo Base P.U. ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={precioUnitario}
                    onChange={(e) => setPrecioUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono font-bold text-right text-emerald-400 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              {selectedInsumo ? (
                <button
                  onClick={handleEliminar}
                  disabled={deleting || saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={saving || deleting || !codigo.trim() || !nombre.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-dark-1 bg-gold hover:bg-gold-light disabled:opacity-50 rounded-xl shadow-md transition-all"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Guardando en BD...' : 'Guardar Insumo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
