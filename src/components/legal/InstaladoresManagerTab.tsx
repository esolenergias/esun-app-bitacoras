import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { Loader2, Plus, Edit2, Trash2, Building2, Save, X } from 'lucide-react';

interface Subcontratista {
  id: string;
  razon_social: string;
  representante_legal: string;
  rfc: string;
  domicilio_fiscal: string;
  repse: string;
}

export default function InstaladoresManagerTab() {
  const [subcontratistas, setSubcontratistas] = useState<Subcontratista[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Subcontratista>>({});

  useEffect(() => {
    fetchSubcontratistas();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSubcontratistas = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subcontratistas')
        .select('*')
        .order('razon_social', { ascending: true });

      if (error) throw error;
      setSubcontratistas(data || []);
    } catch (error: any) {
      console.error("Error fetching subcontratistas:", error);
      setNotification({ type: 'error', message: 'Error al cargar los instaladores.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (sub: Subcontratista) => {
    setEditingId(sub.id);
    setFormData(sub);
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      razon_social: '',
      representante_legal: '',
      rfc: '',
      domicilio_fiscal: '',
      repse: ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.razon_social?.trim()) {
      setNotification({ type: 'error', message: 'La Razón Social es obligatoria.' });
      return;
    }

    try {
      setIsSaving(true);
      setNotification(null);

      const payload = {
        razon_social: formData.razon_social.trim(),
        representante_legal: formData.representante_legal?.trim() || '',
        rfc: formData.rfc?.trim() || '',
        domicilio_fiscal: formData.domicilio_fiscal?.trim() || '',
        repse: formData.repse?.trim() || ''
      };

      if (editingId === 'new') {
        const { error } = await supabase.from('subcontratistas').insert([payload]);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Instalador creado correctamente.' });
      } else {
        const { error } = await supabase
          .from('subcontratistas')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Instalador actualizado correctamente.' });
      }

      setEditingId(null);
      await fetchSubcontratistas();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      setNotification({ type: 'error', message: 'Error al guardar: ' + (error.message || 'Error desconocido') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente a "${name}"?`)) return;

    try {
      setNotification(null);
      const { error } = await supabase.from('subcontratistas').delete().eq('id', id);
      if (error) throw error;

      setNotification({ type: 'success', message: 'Instalador eliminado correctamente.' });
      await fetchSubcontratistas();
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      setNotification({ type: 'error', message: 'Error al eliminar: ' + (error.message || 'Error desconocido') });
    }
  };

  return (
    <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-light text-cream flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold" />
            Directorio de Instaladores / Subcontratistas
          </h3>
          <p className="text-sm text-cream-muted mt-1">
            Administra la información de tus cuadrillas e instaladores externos.
          </p>
        </div>
        
        {!editingId && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Instalador
          </button>
        )}
      </div>

      {notification && (
        <div className={`p-3 rounded-lg text-sm font-medium border mb-6 flex items-center justify-between transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100 font-bold ml-2">✕</button>
        </div>
      )}

      {editingId ? (
        <form onSubmit={handleSave} className="bg-dark-3/50 p-6 rounded-xl border border-dark-4 space-y-4 mb-6">
          <h4 className="text-gold font-medium mb-4 flex items-center gap-2 border-b border-dark-4 pb-2">
            {editingId === 'new' ? 'Crear Nuevo Instalador' : 'Editar Instalador'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">Razón Social o Nombre Completo *</label>
              <input
                type="text"
                required
                value={formData.razon_social || ''}
                onChange={e => setFormData({ ...formData, razon_social: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">Representante Legal</label>
              <input
                type="text"
                value={formData.representante_legal || ''}
                onChange={e => setFormData({ ...formData, representante_legal: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">RFC</label>
              <input
                type="text"
                value={formData.rfc || ''}
                onChange={e => setFormData({ ...formData, rfc: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none uppercase text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-muted mb-1">Registro REPSE</label>
              <input
                type="text"
                value={formData.repse || ''}
                onChange={e => setFormData({ ...formData, repse: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-cream-muted mb-1">Domicilio Fiscal</label>
              <textarea
                rows={2}
                value={formData.domicilio_fiscal || ''}
                onChange={e => setFormData({ ...formData, domicilio_fiscal: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-cream-muted hover:text-cream bg-dark-1 hover:bg-dark-2 rounded-lg border border-dark-4 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-yellow-500 text-dark-1 font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : subcontratistas.length === 0 ? (
        <div className="text-center py-12 bg-dark-3/30 rounded-xl border border-dark-4">
          <p className="text-cream-muted">No hay instaladores registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subcontratistas.map(sub => (
            <div key={sub.id} className="bg-dark-3/50 p-4 rounded-xl border border-dark-4 flex flex-col justify-between hover:border-gold/30 transition-colors group">
              <div>
                <h4 className="font-semibold text-cream text-lg mb-1">{sub.razon_social}</h4>
                {sub.representante_legal && (
                  <p className="text-xs text-cream-muted mb-1"><span className="text-gold/70">Rep:</span> {sub.representante_legal}</p>
                )}
                {sub.rfc && (
                  <p className="text-xs text-cream-muted mb-1"><span className="text-gold/70">RFC:</span> {sub.rfc}</p>
                )}
                {sub.repse && (
                  <p className="text-xs text-cream-muted"><span className="text-gold/70">REPSE:</span> {sub.repse}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dark-4 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(sub)}
                  className="flex-1 flex justify-center items-center gap-1.5 py-1.5 bg-dark-1 hover:bg-blue-500/10 text-blue-400 rounded border border-dark-4 hover:border-blue-500/30 transition-colors text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(sub.id, sub.razon_social)}
                  className="flex-1 flex justify-center items-center gap-1.5 py-1.5 bg-dark-1 hover:bg-rose-500/10 text-rose-400 rounded border border-dark-4 hover:border-rose-500/30 transition-colors text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
