import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, FileText, Sun, Calendar, TrendingUp, Edit3, Save, X, MapPin, ScrollText, Download, Cloud, Eye, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../context/supabase';
import type { OficioData } from '../legal/oficios/types';
import OficioPreviewModal from '../legal/oficios/OficioPreviewModal';
import { generateOficioPdf } from '../legal/oficios/oficioPdfGenerator';
import { getNextFolio } from '../legal/oficios/OficiosTab';

interface ClienteDetailProps {
  cliente: any;
  onBack: () => void;
  onNavigateTo?: (tab: string, payload?: any) => void;
}

export default function ClienteDetail({ cliente: initialCliente, onBack, onNavigateTo }: ClienteDetailProps) {
  const [cliente, setCliente] = useState(initialCliente);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(initialCliente);
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [esunQuotes, setEsunQuotes] = useState<any[]>([]);
  const [oficios, setOficios] = useState<OficioData[]>([]);
  const [selectedPreviewOficio, setSelectedPreviewOficio] = useState<OficioData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressValue, setAddressValue] = useState('');

  const handleSaveAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('presupuestos')
        .update({ ubicacion: addressValue.trim() })
        .eq('id', id);
        
      if (error) throw error;
      
      setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, ubicacion: addressValue.trim() } : p));
      setEditingAddressId(null);
    } catch (err) {
      console.error("Error updating address:", err);
      alert("Error al actualizar la dirección.");
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, [cliente.nombre_razon_social]);

  const fetchProyectos = async () => {
    try {
      setLoading(true);
      // 1. Fetch presupuestos eSol
      const { data: presData, error } = await supabase
        .from('presupuestos')
        .select('*')
        .ilike('client_name', cliente.nombre_razon_social);
      
      if (!error && presData) {
        setPresupuestos(presData);
      }

      // 2. Fetch Esun projects from Supabase esun_proyectos & local fallback
      const { data: esunData, error: esunErr } = await supabase
        .from('esun_proyectos')
        .select('*')
        .ilike('client_name', cliente.nombre_razon_social);

      if (!esunErr && esunData && esunData.length > 0) {
        setEsunQuotes(esunData);
      } else {
        const storedEsun = localStorage.getItem('esun_projects') || localStorage.getItem('esun_quotes');
        if (storedEsun) {
          try {
            const parsed = JSON.parse(storedEsun);
            const relatedEsun = parsed.filter((q: any) => 
              q.client_name?.toLowerCase().trim() === cliente.nombre_razon_social.toLowerCase().trim()
            );
            setEsunQuotes(relatedEsun);
          } catch (e) {
            console.error('Error parsing esun quotes', e);
          }
        }
      }

      // 3. Fetch Oficios eSol from Supabase & local fallback
      try {
        let loadedOficios: OficioData[] = [];
        const clientNameClean = (cliente.nombre_razon_social || '').trim().toLowerCase();
        const budgetIds = (presData || []).map((p: any) => p.id);

        try {
          const { data: oficiosData } = await supabase
            .from('oficios_obra')
            .select('*')
            .order('created_at', { ascending: false });

          if (oficiosData && oficiosData.length > 0) {
            const mapped: OficioData[] = oficiosData.map((d: any) => ({
              id: d.id,
              folio: d.folio || '',
              fecha: d.fecha || '',
              lugar: d.lugar || 'Tepic, Nayarit',
              presupuestoId: d.presupuesto_id || '',
              nombreObra: d.nombre_obra || '',
              ubicacionObra: d.ubicacion_obra || '',
              clienteFinal: d.cliente_final || '',
              tipoOficio: d.tipo_oficio || 'libre',
              destinatarioTitulo: d.destinatario_titulo || '',
              destinatarioNombre: d.destinatario_nombre || '',
              destinatarioCargo: d.destinatario_cargo || '',
              destinatarioEmpresa: d.destinatario_empresa || '',
              destinatarioAtencion: d.destinatario_atencion || '',
              asunto: d.asunto || '',
              referencia: d.referencia || '',
              vocativo: d.vocativo || '',
              antecedentes: d.antecedentes || '',
              cuerpo: d.cuerpo || '',
              fundamentacion: d.fundamentacion || '',
              peticion: d.peticion || '',
              despedida: d.despedida || '',
              remitenteNombre: d.remitente_nombre || 'Manuel de Jesus Fregoso Samaniega',
              remitenteCargo: d.remitente_cargo || 'REPRESENTANTE LEGAL',
              remitenteCedula: d.remitente_cedula || '',
              empresaRazonSocial: d.empresa_razon_social || 'ESOL ENERGIAS',
              empresaRFC: d.empresa_rfc || '',
              empresaDomicilio: d.empresa_domicilio || 'Tepic, Nayarit, México',
              empresaTelefono: d.empresa_telefono || '3112343034',
              empresaEmail: d.empresa_email || '',
              ccp: Array.isArray(d.ccp) ? d.ccp : [],
              estado: d.estado || 'emitido',
              drive_url: d.drive_url,
              firmaDigital: d.firma_digital || undefined,
              incluirFirmaDigital: d.incluir_firma_digital ?? true,
              created_at: d.created_at,
              updated_at: d.updated_at
            }));
            loadedOficios = mapped;
          }
        } catch (dbErr) {
          console.warn('Error al cargar oficios de Supabase:', dbErr);
        }

        const localOficios = localStorage.getItem('esol_oficios_guardados_local');
        if (localOficios) {
          try {
            const parsed: OficioData[] = JSON.parse(localOficios);
            if (Array.isArray(parsed)) {
              parsed.forEach(localItem => {
                const exists = loadedOficios.some(o => o.id === localItem.id || o.folio === localItem.folio);
                if (!exists) {
                  loadedOficios.push(localItem);
                }
              });
            }
          } catch (e) {
            console.error('Error parsing local oficios:', e);
          }
        }

        const clientOficios = loadedOficios.filter((o: any) => {
          const ofCliente = (o.clienteFinal || '').toLowerCase().trim();
          const ofDest = (o.destinatarioNombre || '').toLowerCase().trim();
          const ofEmpresa = (o.destinatarioEmpresa || '').toLowerCase().trim();
          const matchesName = (ofCliente && (ofCliente.includes(clientNameClean) || clientNameClean.includes(ofCliente))) ||
                              (ofDest && (ofDest.includes(clientNameClean) || clientNameClean.includes(ofDest))) ||
                              (ofEmpresa && (ofEmpresa.includes(clientNameClean) || clientNameClean.includes(ofEmpresa)));
          const matchesBudget = o.presupuestoId && budgetIds.includes(o.presupuestoId);
          return matchesName || matchesBudget;
        });

        setOficios(clientOficios);
      } catch (ofErr) {
        console.warn('Error al cargar oficios del cliente:', ofErr);
      }

    } catch (err) {
      console.error('Error fetching client projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOficioStatus = async (targetOficio: OficioData, newStatus: 'borrador' | 'emitido') => {
    try {
      const updated: OficioData = {
        ...targetOficio,
        estado: newStatus,
        updated_at: new Date().toISOString()
      };

      try {
        await supabase.from('oficios_obra').upsert({
          id: updated.id,
          folio: updated.folio,
          fecha: updated.fecha,
          lugar: updated.lugar,
          presupuesto_id: updated.presupuestoId || null,
          nombre_obra: updated.nombreObra,
          ubicacion_obra: updated.ubicacionObra,
          cliente_final: updated.clienteFinal,
          tipo_oficio: updated.tipoOficio,
          destinatario_titulo: updated.destinatarioTitulo,
          destinatario_nombre: updated.destinatarioNombre,
          destinatario_cargo: updated.destinatarioCargo,
          destinatario_empresa: updated.destinatarioEmpresa,
          destinatario_atencion: updated.destinatarioAtencion,
          asunto: updated.asunto,
          referencia: updated.referencia,
          vocativo: updated.vocativo,
          antecedentes: updated.antecedentes,
          cuerpo: updated.cuerpo,
          fundamentacion: updated.fundamentacion,
          peticion: updated.peticion,
          despedida: updated.despedida,
          remitente_nombre: updated.remitenteNombre,
          remitente_cargo: updated.remitenteCargo,
          remitente_cedula: updated.remitenteCedula,
          empresa_razon_social: updated.empresaRazonSocial,
          empresa_rfc: updated.empresaRFC,
          empresa_domicilio: updated.empresaDomicilio,
          empresa_telefono: updated.empresaTelefono,
          empresa_email: updated.empresaEmail,
          ccp: updated.ccp,
          estado: newStatus,
          drive_url: updated.drive_url || null,
          firma_digital: updated.firmaDigital || null,
          incluir_firma_digital: updated.incluirFirmaDigital ?? true,
          updated_at: updated.updated_at
        });
      } catch (dbErr) {
        console.warn('Error al actualizar en Supabase:', dbErr);
      }

      try {
        const local = localStorage.getItem('esol_oficios_guardados_local');
        if (local) {
          let list: OficioData[] = JSON.parse(local);
          if (Array.isArray(list)) {
            const idx = list.findIndex(o => o.id === updated.id || o.folio === updated.folio);
            if (idx >= 0) {
              list[idx] = updated;
            } else {
              list = [updated, ...list];
            }
            localStorage.setItem('esol_oficios_guardados_local', JSON.stringify(list));
          }
        }
      } catch (lsErr) {}

      setOficios(prev => prev.map(o => (o.id === updated.id || o.folio === updated.folio) ? updated : o));
    } catch (err) {
      console.error('Error toggling oficio status:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-dark-4 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-light text-gold flex items-center gap-2">
              <User className="w-6 h-6" />
              {cliente.nombre_razon_social}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-cream-muted">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                cliente.estatus === 'Prospecto' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                cliente.estatus === 'Cliente Activo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                'bg-dark-4 text-cream-muted'
              }`}>
                {cliente.estatus}
              </span>
              <span>Origen: {cliente.origen}</span>
            </div>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setEditForm(cliente);
              setIsEditing(true);
            }}
            className="bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-gold px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Editar Perfil
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-dark-4 pb-4">
            <h3 className="text-lg font-medium text-gold">Editar Datos del Cliente</h3>
            <button onClick={() => setIsEditing(false)} className="text-cream-muted hover:text-red-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">Nombre o Razón Social</label>
              <input
                type="text"
                value={editForm.nombre_razon_social || ''}
                onChange={e => setEditForm({...editForm, nombre_razon_social: e.target.value})}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">Representante Legal</label>
              <input
                type="text"
                value={editForm.representante_legal || ''}
                onChange={e => setEditForm({...editForm, representante_legal: e.target.value})}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">Email</label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={e => setEditForm({...editForm, email: e.target.value})}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">Teléfono</label>
              <input
                type="text"
                value={editForm.telefono || ''}
                onChange={e => setEditForm({...editForm, telefono: e.target.value})}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">RFC</label>
              <input
                type="text"
                value={editForm.rfc || ''}
                onChange={e => setEditForm({...editForm, rfc: e.target.value})}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">CURP</label>
              <input
                type="text"
                value={editForm.curp || ''}
                onChange={e => setEditForm({...editForm, curp: e.target.value})}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-cream-muted mb-1">Domicilio de Instalación</label>
              <input
                type="text"
                value={editForm.direccion || ''}
                onChange={e => setEditForm({...editForm, direccion: e.target.value})}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none"
                placeholder="Calle, Número, Colonia, C.P., Ciudad..."
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm text-cream-muted hover:text-cream transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  const { error } = await supabase.from('clientes').update({
                    nombre_razon_social: editForm.nombre_razon_social,
                    representante_legal: editForm.representante_legal,
                    email: editForm.email,
                    telefono: editForm.telefono,
                    rfc: editForm.rfc,
                    curp: editForm.curp,
                    direccion: editForm.direccion
                  }).eq('id', cliente.id);
                  if (error) throw error;
                  setCliente(editForm);
                  setIsEditing(false);
                } catch (e: any) {
                  alert("Error al actualizar cliente: " + e.message);
                }
              }}
              className="bg-gold text-dark-1 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Guardar Cambios
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-dark-3/30 border border-dark-4 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-[10px] text-cream-dim uppercase font-bold tracking-wider mb-1">Email</div>
              <div className="text-sm text-cream">{cliente.email || 'No registrado'}</div>
            </div>
            <div>
              <div className="text-[10px] text-cream-dim uppercase font-bold tracking-wider mb-1">Teléfono</div>
              <div className="text-sm text-cream">{cliente.telefono || 'No registrado'}</div>
            </div>
            <div>
              <div className="text-[10px] text-cream-dim uppercase font-bold tracking-wider mb-1">RFC / CURP</div>
              <div className="text-sm text-cream">{cliente.rfc || 'Sin RFC'} {cliente.curp ? `/ ${cliente.curp}` : ''}</div>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <div className="text-[10px] text-cream-dim uppercase font-bold tracking-wider mb-1">Domicilio de Instalación</div>
              <div className="text-sm text-cream">{cliente.direccion || 'No registrado'}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-cream-muted">
          Cargando proyectos del cliente...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PRESUPUESTOS ESOL */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-cream-muted flex items-center gap-2 border-b border-dark-4 pb-2">
              <FileText className="w-4 h-4 text-gold" />
              Presupuestos eSol ({presupuestos.length})
            </h3>
            
            {presupuestos.length === 0 ? (
              <p className="text-sm text-cream-dim bg-dark-2 p-4 rounded-xl border border-dark-4/50">
                No se encontraron presupuestos en eSol.
              </p>
            ) : (
              <div className="space-y-3">
                {presupuestos.map(p => (
                  <div key={p.id} className="bg-dark-2 border border-dark-4 p-4 rounded-xl hover:border-gold/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-cream">{p.name || 'Sin Título'}</div>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'draft' ? 'bg-dark-4 text-cream-muted' :
                        p.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-cream-muted flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-cream-muted flex items-center gap-2 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Producción: {p.produccion ? 'Activada' : 'Desactivada'}
                    </div>
                    <div className="text-xs text-cream-muted flex flex-col gap-1 mt-2 bg-dark-3/30 p-2 rounded-lg border border-dark-4/50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gold/70" />
                          <span className="font-bold text-[10px] uppercase tracking-wider text-cream-dim">Dirección de instalación</span>
                        </div>
                        {editingAddressId !== p.id && (
                          <button 
                            onClick={() => { setEditingAddressId(p.id); setAddressValue(p.ubicacion || ''); }}
                            className="p-1 text-cream-dim hover:text-gold transition-colors"
                            title="Editar dirección"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {editingAddressId === p.id ? (
                        <div className="flex items-center gap-2 w-full mt-1">
                          <input 
                            type="text" 
                            value={addressValue}
                            onChange={(e) => setAddressValue(e.target.value)}
                            placeholder="Ej. Av. Siempre Viva 123"
                            className="flex-1 bg-dark-1 border border-dark-4 text-cream text-xs rounded px-2 py-1.5 outline-none focus:border-gold transition-colors"
                            autoFocus
                          />
                          <button onClick={() => handleSaveAddress(p.id)} className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded transition-colors" title="Guardar">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingAddressId(null)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Cancelar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-cream ml-5 break-words">{p.ubicacion || 'No especificada'}</span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-dark-4/50 flex justify-end gap-2 flex-wrap items-center">
                      {p.contrato_url ? (
                        <a 
                          href={p.contrato_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold uppercase tracking-wider text-green-400 hover:text-green-300 hover:bg-green-400/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-green-400/20 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> Contrato
                        </a>
                      ) : (
                        <button 
                          disabled
                          className="text-[10px] font-bold uppercase tracking-wider text-cream-dim/50 cursor-not-allowed bg-dark-3/50 px-3 py-1.5 rounded-lg border border-dark-4 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 opacity-50" /> Sin Contrato
                        </button>
                      )}

                      {/* Oficios vinculados a este presupuesto */}
                      {(() => {
                        const bOficios = oficios.filter(o => o.presupuestoId === p.id);
                        if (bOficios.length > 0) {
                          return (
                            <button
                              onClick={() => setSelectedPreviewOficio(bOficios[0])}
                              className="text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-amber-400/20 flex items-center gap-1"
                              title="Ver Oficio de Obra"
                            >
                              <ScrollText className="w-3 h-3" /> Oficio ({bOficios.length})
                            </button>
                          );
                        }
                        return null;
                      })()}

                      <button 
                        onClick={() => onNavigateTo && onNavigateTo('cotizador', p.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-gold hover:text-gold-light hover:bg-gold/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gold/20"
                      >
                        Abrir Presupuesto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ESUN SOLAR QUOTES */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-cream-muted flex items-center gap-2 border-b border-dark-4 pb-2">
              <Sun className="w-4 h-4 text-gold" />
              Cotizaciones Esun Solar ({esunQuotes.length})
            </h3>
            
            {esunQuotes.length === 0 ? (
              <p className="text-sm text-cream-dim bg-dark-2 p-4 rounded-xl border border-dark-4/50">
                No se encontraron cotizaciones en Esun Solar.
              </p>
            ) : (
              <div className="space-y-3">
                {esunQuotes.map(q => {
                  const firstProp = q.proposals && q.proposals.length > 0 ? q.proposals[0] : null;
                  const kwp = q.system?.system_kWp || firstProp?.system?.installed_kWp || firstProp?.system?.system_kWp || 0;
                  const investment = q.financial?.totalInvestment || firstProp?.financial?.investment_mxn || 0;
                  const savings = q.financial?.savings25Years || firstProp?.financial?.savings_25yr || 0;
                  const isOffgrid = q.project_type === 'off-grid' || Boolean(q.load_profile);

                  return (
                    <div key={q.id} className="bg-dark-2 border border-dark-4 p-4 rounded-xl hover:border-gold/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-cream flex items-center gap-2">
                          <span>{kwp > 0 ? `${kwp.toFixed(2)} kWp` : 'Sistema Solar'}</span>
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            isOffgrid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gold/10 text-gold border border-gold/20'
                          }`}>
                            {isOffgrid ? 'Aislado (Baterías)' : 'Interconectado CFE'}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-dark-4 text-cream-muted">
                          {q.status || 'Borrador'}
                        </span>
                      </div>
                      <div className="text-xs text-cream-muted flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(q.created_at).toLocaleDateString()}
                        {q.city && <span>• {q.city}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dark-4/50">
                        <div>
                          <div className="text-[10px] text-cream-dim uppercase">Inversión</div>
                          <div className="text-sm font-bold text-cream">${Math.round(investment).toLocaleString()} MXN</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-cream-dim uppercase">{isOffgrid ? 'Propuestas' : 'Ahorro 25 años'}</div>
                          <div className={`text-sm font-bold ${isOffgrid ? 'text-gold' : 'text-green-400'}`}>
                            {isOffgrid ? `${q.proposals?.length || 1} diseño(s)` : `$${Math.round(savings).toLocaleString()}`}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-dark-4/50 flex justify-end gap-2">
                        <button 
                          onClick={() => onNavigateTo && onNavigateTo('esun', q.id)}
                          className="text-[10px] font-bold uppercase tracking-wider text-gold hover:text-gold-light hover:bg-gold/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gold/20"
                        >
                          Cargar en Esun Solar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* OFICIOS DE OBRA DEL CLIENTE */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-4 pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-cream-muted flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-gold" />
                Oficios de Obra y Borradores ({oficios.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newDraftTarget = {
                      folio: getNextFolio(),
                      clienteFinal: cliente.nombre_razon_social,
                      ubicacionObra: cliente.direccion || '',
                      estado: 'borrador'
                    };
                    localStorage.setItem('esol_oficio_editing_target', JSON.stringify(newDraftTarget));
                    localStorage.setItem('esol_legal_active_subtab', 'oficios');
                    if (onNavigateTo) onNavigateTo('legal', 'oficios');
                  }}
                  className="text-xs text-dark-1 font-bold bg-gold hover:bg-gold-light px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  + Redactar Oficio
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('esol_legal_active_subtab', 'oficios');
                    if (onNavigateTo) onNavigateTo('legal', 'oficios');
                  }}
                  className="text-xs text-cream-muted hover:text-gold hover:underline flex items-center gap-1 px-2 py-1"
                >
                  Ir al Módulo →
                </button>
              </div>
            </div>

            {oficios.length === 0 ? (
              <div className="bg-dark-2 p-6 rounded-xl border border-dark-4/50 text-center space-y-2">
                <ScrollText className="w-8 h-8 mx-auto text-gold/30" />
                <p className="text-sm text-cream-muted">
                  No se han generado oficios ni borradores para este cliente aún.
                </p>
                <button
                  onClick={() => {
                    const newDraftTarget = {
                      folio: getNextFolio(),
                      clienteFinal: cliente.nombre_razon_social,
                      ubicacionObra: cliente.direccion || '',
                      estado: 'borrador'
                    };
                    localStorage.setItem('esol_oficio_editing_target', JSON.stringify(newDraftTarget));
                    localStorage.setItem('esol_legal_active_subtab', 'oficios');
                    if (onNavigateTo) onNavigateTo('legal', 'oficios');
                  }}
                  className="text-xs text-gold hover:underline font-medium inline-block mt-1"
                >
                  Crear el primer oficio para {cliente.nombre_razon_social}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {oficios.map((of) => {
                  const isDraft = of.estado === 'borrador';

                  return (
                    <div
                      key={of.id || of.folio}
                      className={`border rounded-xl p-4 transition-all flex flex-col justify-between gap-3 shadow-md ${
                        isDraft
                          ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60'
                          : 'bg-dark-2 border-dark-4 hover:border-gold/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                          <span className="font-mono text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                            {of.folio}
                          </span>

                          {isDraft ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                              Borrador
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                              Emitido
                            </span>
                          )}

                          <span className="text-[11px] text-cream-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gold/70" />
                            {of.fecha}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-cream line-clamp-2 mb-1">
                          {of.asunto || 'Sin asunto'}
                        </h4>
                        <p className="text-[10px] text-cream-muted">
                          <strong>Destinatario:</strong> {of.destinatarioTitulo} {of.destinatarioNombre || '(Pendiente)'} {of.destinatarioEmpresa ? `(${of.destinatarioEmpresa})` : ''}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-dark-4/50 pt-2.5">
                        {of.drive_url ? (
                          <a
                            href={of.drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                          >
                            <Cloud className="w-3 h-3" /> Ver en Drive
                          </a>
                        ) : (
                          <span className="text-[10px] text-cream-dim flex items-center gap-1">
                            <ScrollText className="w-3 h-3 opacity-50" /> {isDraft ? 'Borrador' : 'Local'}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleToggleOficioStatus(of, isDraft ? 'emitido' : 'borrador')}
                            className={`px-2 py-1 rounded-lg transition-colors text-[10px] font-semibold flex items-center gap-1 border ${
                              isDraft
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40'
                                : 'bg-dark-3 hover:bg-amber-500/20 text-amber-300 border-dark-4 hover:border-amber-500/30'
                            }`}
                            title={isDraft ? 'Promover inmediatamente a Emitido' : 'Cambiar a Borrador'}
                          >
                            {isDraft ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Emitir</span>
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                <span>Borrador</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              localStorage.setItem('esol_oficio_editing_target', JSON.stringify(of));
                              localStorage.setItem('esol_legal_active_subtab', 'oficios');
                              if (onNavigateTo) onNavigateTo('legal', 'oficios');
                            }}
                            className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 border ${
                              isDraft
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                                : 'bg-dark-3 hover:bg-gold/20 text-cream-muted hover:text-gold border-dark-4'
                            }`}
                            title={isDraft ? 'Continuar editando borrador' : 'Editar este Oficio'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedPreviewOficio(of)}
                            className="p-1.5 bg-dark-3 hover:bg-dark-4 text-gold rounded-lg transition-colors text-xs flex items-center gap-1 border border-dark-4"
                            title="Ver Vista Previa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => generateOficioPdf(of)}
                            className="p-1.5 bg-dark-3 hover:bg-gold/20 text-cream-muted hover:text-gold rounded-lg transition-colors text-xs flex items-center gap-1 border border-dark-4"
                            title="Descargar PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal de Vista Previa de Oficios */}
      {selectedPreviewOficio && (
        <OficioPreviewModal
          isOpen={Boolean(selectedPreviewOficio)}
          onClose={() => setSelectedPreviewOficio(null)}
          oficio={selectedPreviewOficio}
          onEdit={(of) => {
            localStorage.setItem('esol_oficio_editing_target', JSON.stringify(of));
            localStorage.setItem('esol_legal_active_subtab', 'oficios');
            setSelectedPreviewOficio(null);
            if (onNavigateTo) onNavigateTo('legal', 'oficios');
          }}
        />
      )}
    </div>
  );
}
