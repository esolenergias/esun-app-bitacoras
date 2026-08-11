import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { HardHat, Search, Edit2, Trash2, MapPin, User, Plus, X, Save } from 'lucide-react';

export interface MantenimientoObra {
  id?: string;
  nombre: string;
  cliente: string;
  ubicacion: string;
  status: string;
  residente?: string;
  created_at: string;
}

export default function MantenimientosObrasTab() {
  const [obras, setObras] = useState<MantenimientoObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState<MantenimientoObra | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchObras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mantenimientos_proyectos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setObras(data || []);
    } catch (err) {
      console.error('Error fetching mantenimientos_proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObras();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get('nombre') as string,
      cliente: formData.get('cliente') as string,
      ubicacion: formData.get('ubicacion') as string,
      status: formData.get('status') as string,
      residente: formData.get('residente') as string,
    };

    setIsSubmitting(true);
    try {
      if (editingData?.id) {
        // Update
        const { error } = await supabase
          .from('mantenimientos_proyectos')
          .update(data)
          .eq('id', editingData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('mantenimientos_proyectos')
          .insert([data]);
        if (error) throw error;
      }
      setShowModal(false);
      setEditingData(null);
      fetchObras();
    } catch (error: any) {
      console.error('Error saving:', error);
      alert('Error guardando el mantenimiento: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (obra: MantenimientoObra) => {
    if (!window.confirm(`¿Estás seguro de eliminar el mantenimiento "${obra.nombre}"? Se borrarán todos los registros asociados.`)) return;
    
    try {
      const { error } = await supabase
        .from('mantenimientos_proyectos')
        .delete()
        .eq('id', obra.id);
        
      if (error) throw error;
      setObras(prev => prev.filter(o => o.id !== obra.id));
    } catch (err: any) {
      console.error('Error deleting:', err);
      alert('Error al eliminar: ' + err.message);
    }
  };

  const filteredObras = obras.filter(o => 
    o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-muted" />
          <input 
            type="text" 
            placeholder="Buscar mantenimientos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-sm text-cream pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors"
          />
        </div>
        <button 
          onClick={() => { setEditingData(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold text-dark-1 hover:bg-yellow-400 rounded-xl transition-colors font-bold text-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Nuevo Mantenimiento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredObras.length === 0 ? (
        <div className="border border-dark-4 bg-dark-2/40 p-16 rounded-2xl text-center space-y-4 select-none">
          <HardHat className="w-10 h-10 text-gold mx-auto opacity-50" />
          <h4 className="font-display font-black text-base text-cream">No hay mantenimientos</h4>
          <p className="text-xs text-cream-muted max-w-sm mx-auto font-body">
            Comienza registrando tu primer mantenimiento para este módulo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObras.map((obra) => (
            <div 
              key={obra.id} 
              className="bg-dark-2 border border-dark-4 rounded-2xl p-5 hover:border-gold/50 hover:bg-dark-3 transition-all cursor-pointer shadow-lg relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-blue-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-dark-3 rounded-xl border border-dark-4">
                    <HardHat className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-cream text-base">{obra.nombre}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-1">{obra.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingData(obra); setShowModal(true); }}
                    className="p-1.5 bg-dark-3 hover:bg-blue-500/20 hover:text-blue-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-blue-500/30"
                    title="Editar Mantenimiento"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(obra); }}
                    className="p-1.5 bg-dark-3 hover:bg-red-500/20 hover:text-red-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                    title="Eliminar Mantenimiento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {obra.ubicacion && (
                <p className="text-sm text-cream-muted flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-cream-dim shrink-0" />
                  <span className="line-clamp-2">{obra.ubicacion}</span>
                </p>
              )}
              {obra.cliente && (
                <p className="text-sm text-cream-muted flex items-start gap-2 mb-2">
                  <User className="w-4 h-4 mt-0.5 text-cream-dim shrink-0" />
                  <span className="line-clamp-1">{obra.cliente}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4">
              <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider">
                {editingData ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-cream-dim hover:text-cream hover:bg-dark-3 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Identificador de Mantenimiento / Póliza *</label>
                <input required name="nombre" defaultValue={editingData?.nombre || ''} placeholder="Ej: POL-2412-MT-001" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Cliente *</label>
                <input required name="cliente" defaultValue={editingData?.cliente || ''} placeholder="Nombre del cliente" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Ubicación</label>
                <input name="ubicacion" defaultValue={editingData?.ubicacion || ''} placeholder="Dirección del sitio" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Estado</label>
                <select name="status" defaultValue={editingData?.status || 'Pendiente'} className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors appearance-none">
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Técnico / Residente Asignado</label>
                <input name="residente" defaultValue={editingData?.residente || ''} placeholder="Nombre del técnico" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" />
              </div>
              
              <div className="pt-4 border-t border-dark-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-cream-dim hover:text-cream hover:bg-dark-3 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gold text-dark-1 hover:bg-yellow-400 transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
