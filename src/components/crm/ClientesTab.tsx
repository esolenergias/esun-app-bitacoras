import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, UserCircle, MapPin, Mail, Phone, ExternalLink, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../../context/supabase';
import { useApp } from '../../context/AppContext';
import ClienteDetail from './ClienteDetail';

interface Cliente {
  id: string;
  nombre_razon_social: string;
  representante_legal: string | null;
  email: string | null;
  telefono: string | null;
  rfc: string | null;
  curp: string | null;
  direccion: string | null;
  origen: string;
  estatus: string;
  created_at: string;
  registered_by?: string | null;
  last_modified_by?: string | null;
}

interface ClientesTabProps {
  onNavigateTo?: (tab: string, payload?: any) => void;
}

export default function ClientesTab({ onNavigateTo }: ClientesTabProps) {
  const { currentUser } = useApp();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return;
    
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
      setClientes(clientes.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting cliente:', err);
      alert('Error al eliminar el cliente');
    }
  };

  const [showNewModal, setShowNewModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const handleCreateCliente = async () => {
    if (!newClientName.trim()) return alert('El nombre es requerido');
    try {
      const payload = {
        nombre_razon_social: newClientName.trim(),
        email: newClientEmail.trim() || null,
        telefono: newClientPhone.trim() || null,
        origen: 'CRM Manual',
        estatus: 'Prospecto',
        registered_by: currentUser?.name || 'Usuario'
      };
      const { data, error } = await supabase.from('clientes').insert(payload).select();
      if (error) throw error;
      if (data) {
        setClientes([data[0], ...clientes]);
        setShowNewModal(false);
        setNewClientName('');
        setNewClientEmail('');
        setNewClientPhone('');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al crear cliente: ' + err.message);
    }
  };

  const syncOldData = async () => {
    try {
      const isSynced = localStorage.getItem('crm_initial_sync_done');
      if (isSynced) return;

      let newClientsAdded = false;

      // 1. Current clients dictionary
      const existingNames = new Set<string>();
      const { data: currentClients } = await supabase.from('clientes').select('nombre_razon_social');
      if (currentClients) {
        currentClients.forEach(c => existingNames.add(c.nombre_razon_social.toLowerCase().trim()));
      }

      // 2. Sync from presupuestos
      const { data: presupuestosData } = await supabase
        .from('presupuestos')
        .select('client_name')
        .not('client_name', 'is', null);

      if (presupuestosData) {
        for (const p of presupuestosData) {
          if (p.client_name && p.client_name.trim() !== '' && p.client_name !== 'Sin Nombre') {
            const nameKey = p.client_name.toLowerCase().trim();
            if (!existingNames.has(nameKey)) {
              await supabase.from('clientes').insert({
                nombre_razon_social: p.client_name.trim(),
                origen: 'Presupuestos Esol',
                estatus: 'Prospecto',
                registered_by: 'Sistema / Legado'
              });
              existingNames.add(nameKey);
              newClientsAdded = true;
            }
          }
        }
      }

      // 3. Sync from esun_proyectos (Supabase table)
      const { data: esunProjectsData } = await supabase
        .from('esun_proyectos')
        .select('*');

      if (esunProjectsData) {
        for (const ep of esunProjectsData) {
          if (ep.client_name && ep.client_name.trim() !== '' && ep.client_name !== 'Nuevo Proyecto Solar' && ep.client_name !== 'Nuevo Sistema Aislado' && ep.client_name !== 'Sin Nombre') {
            const nameKey = ep.client_name.toLowerCase().trim();
            if (!existingNames.has(nameKey)) {
              await supabase.from('clientes').insert({
                nombre_razon_social: ep.client_name.trim(),
                email: ep.client_email || null,
                telefono: ep.client_phone || null,
                direccion: ep.client_address || ep.city || null,
                rfc: ep.client_rfc || null,
                origen: ep.project_type === 'off-grid' ? 'Esun Aislado' : 'Esun Solar',
                estatus: 'Prospecto',
                registered_by: 'Sistema / Legado'
              });
              existingNames.add(nameKey);
              newClientsAdded = true;
            }
          }
        }
      }

      // 4. Sync from esun_quotes (localStorage legacy)
      const esunQuotesRaw = localStorage.getItem('esun_projects') || localStorage.getItem('esun_quotes');
      if (esunQuotesRaw) {
        try {
          const esunQuotes = JSON.parse(esunQuotesRaw);
          for (const q of esunQuotes) {
            if (q.client_name && q.client_name.trim() !== '' && q.client_name !== 'Nuevo Proyecto Solar' && q.client_name !== 'Nuevo Sistema Aislado' && q.client_name !== 'Sin Nombre') {
              const nameKey = q.client_name.toLowerCase().trim();
              if (!existingNames.has(nameKey)) {
                await supabase.from('clientes').insert({
                  nombre_razon_social: q.client_name.trim(),
                  email: q.client_email || null,
                  telefono: q.client_phone || null,
                  direccion: q.client_address || q.city || null,
                  rfc: q.client_rfc || null,
                  origen: q.project_type === 'off-grid' ? 'Esun Aislado' : 'Esun Solar',
                  estatus: 'Prospecto',
                  registered_by: 'Sistema / Legado'
                });
                existingNames.add(nameKey);
                newClientsAdded = true;
              }
            }
          }
        } catch (e) {
          console.error("Error parsing esun_quotes for sync:", e);
        }
      }

      localStorage.setItem('crm_initial_sync_done', 'true');
      if (newClientsAdded) {
        fetchClientes();
      }
    } catch (e) {
      console.error('Error syncing old data:', e);
    }
  };

  useEffect(() => {
    fetchClientes().then(() => {
      syncOldData();
    });
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clientes:', error);
      } else {
        setClientes(data || []);
      }
    } catch (err) {
      console.error('Exception fetching clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre_razon_social.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.rfc && c.rfc.toLowerCase().includes(search.toLowerCase()))
  );

  if (selectedCliente) {
    return (
      <ClienteDetail 
        cliente={selectedCliente} 
        onBack={() => setSelectedCliente(null)} 
        onNavigateTo={onNavigateTo}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-1/80 backdrop-blur-sm">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-cream mb-4">Registrar Nuevo Cliente</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Nombre o Razón Social *</label>
                <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Email</label>
                <input type="email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Teléfono</label>
                <input type="text" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm text-cream-muted hover:text-cream">Cancelar</button>
              <button onClick={handleCreateCliente} className="bg-gold text-dark-1 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500">Guardar Cliente</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-light text-gold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Directorio de Clientes
          </h2>
          <p className="text-cream-muted text-sm mt-1">
            CRM Centralizado para prospectos, clientes activos y proyectos históricos.
          </p>
        </div>
        
        <button 
          onClick={() => setShowNewModal(true)}
          className="bg-gold text-dark-1 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-yellow-500 transition-colors shadow-lg shadow-gold/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-dark-2 border border-dark-4 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-dark-4 bg-dark-3/30 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-muted" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre, email o RFC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-1 border border-dark-4 rounded-lg pl-10 pr-4 py-2.5 text-cream focus:border-gold outline-none text-sm transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-3/50 text-cream-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-dark-4">Cliente</th>
                <th className="p-4 font-medium border-b border-dark-4">Contacto</th>
                <th className="p-4 font-medium border-b border-dark-4">Estatus / Origen</th>
                <th className="p-4 font-medium border-b border-dark-4">Creado por</th>
                <th className="p-4 font-medium border-b border-dark-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-4">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-cream-muted">Cargando clientes...</td>
                </tr>
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <UserCircle className="w-12 h-12 text-dark-4 mx-auto mb-3" />
                    <p className="text-cream-muted">No se encontraron clientes.</p>
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr 
                    key={cliente.id} 
                    className="hover:bg-dark-3/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCliente(cliente)}
                  >
                    <td className="p-4">
                      <div className="font-medium text-cream group-hover:text-gold transition-colors">
                        {cliente.nombre_razon_social}
                      </div>
                      <div className="text-xs text-cream-muted mt-1 flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {cliente.direccion ? (cliente.direccion.substring(0, 30) + '...') : 'Sin dirección'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-cream">{cliente.email || '-'}</div>
                      <div className="text-xs text-cream-muted mt-1">{cliente.telefono || '-'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase mb-1 ${
                        cliente.estatus === 'Prospecto' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        cliente.estatus === 'Cliente Activo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        'bg-dark-4 text-cream-muted'
                      }`}>
                        {cliente.estatus}
                      </span>
                      <div className="text-xs text-cream-muted">{cliente.origen}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-cream">{cliente.registered_by || 'Sistema / Legado'}</div>
                      <div className="text-xs text-cream-muted mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(cliente.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-dark-4 rounded-lg transition-colors text-cream-muted hover:text-gold" title="Ver detalle">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {currentUser?.role === 'master' && (
                        <button 
                          onClick={(e) => handleDelete(e, cliente.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-cream-muted hover:text-red-400"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}