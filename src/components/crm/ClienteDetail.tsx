import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, FileText, Sun, Calendar, TrendingUp, Edit3, Save, X, MapPin } from 'lucide-react';
import { supabase } from '../../context/supabase';

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

      // 2. Fetch Esun quotes from localStorage
      const storedEsun = localStorage.getItem('esun_quotes');
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

    } catch (err) {
      console.error('Error fetching client projects:', err);
    } finally {
      setLoading(false);
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
                    <div className="mt-3 pt-3 border-t border-dark-4/50 flex justify-end gap-2">
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
                {esunQuotes.map(q => (
                  <div key={q.id} className="bg-dark-2 border border-dark-4 p-4 rounded-xl hover:border-gold/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-cream">
                        {q.system?.system_kWp?.toFixed(2)} kWp en {q.city || 'Ciudad Desconocida'}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-dark-4 text-cream-muted">
                        {q.status || 'Borrador'}
                      </span>
                    </div>
                    <div className="text-xs text-cream-muted flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(q.created_at).toLocaleDateString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dark-4/50">
                      <div>
                        <div className="text-[10px] text-cream-dim uppercase">Inversión</div>
                        <div className="text-sm font-bold text-cream">${q.financial?.totalInvestment?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-cream-dim uppercase">Ahorro 25 años</div>
                        <div className="text-sm font-bold text-green-400">${q.financial?.savings25Years?.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-dark-4/50 flex justify-end gap-2">
                      <button 
                        onClick={() => onNavigateTo && onNavigateTo('esun', q.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-gold hover:text-gold-light hover:bg-gold/10 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gold/20"
                      >
                        Cargar Esun Solar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
