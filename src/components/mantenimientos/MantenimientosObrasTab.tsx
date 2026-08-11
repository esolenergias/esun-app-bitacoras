import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { HardHat, Search, Edit2, Trash2, MapPin, User, Plus, X, Save, FileText } from 'lucide-react';

export interface PolizaGarantia {
  id?: string;
  folio: string;
  presupuesto_id: string | null;
  cliente_nombre: string;
  cliente_direccion: string;
  cliente_telefono: string;
  cliente_email: string;
  nombre_obra: string;
  conceptos_incluidos: any;
  tipo_cobertura: string;
  periodicidad: string;
  duracion_anos: number;
  fecha_inicio: string;
  fecha_fin: string;
  monto_total: number;
  estado_mantenimiento?: string;
  fecha_proximo_mantenimiento?: string;
  created_at?: string;
}

const getAlertaMantenimiento = (fechaProximo?: string) => {
  if (!fechaProximo) return { text: 'No programada', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' };
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  // Appending T00:00:00 avoids time zone shifts with string dates like YYYY-MM-DD
  const scheduledDate = new Date(`${fechaProximo}T00:00:00`);
  scheduledDate.setHours(0,0,0,0); 

  const diffTime = scheduledDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Atrasado', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
  } else if (diffDays <= 3) {
    return { text: 'Urgente', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' };
  } else if (diffDays <= 14) {
    return { text: 'Próximamente', color: 'text-gold bg-gold/10 border-gold/20' };
  } else {
    return { text: 'A tiempo', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
  }
};

const getCostoBadge = (obra: PolizaGarantia) => {
  if (obra.periodicidad === 'Por evento') {
    return { text: 'Cobro por Evento', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' };
  } else {
    let visitas = 1;
    switch (obra.periodicidad) {
      case 'Mensual': visitas = 12; break;
      case 'Bimestral': visitas = 6; break;
      case 'Trimestral': visitas = 4; break;
      case 'Semestral': visitas = 2; break;
      case 'Anual': visitas = 1; break;
    }
    return { text: `Póliza - ${visitas} Visita${visitas > 1 ? 's' : ''}`, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
  }
};

const generarFolioProtocolo = (nombreObra: string = '', clienteFinal: string = '', consecutivo: number = 1) => {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dateCode = `${yy}${mm}`;

  const sourceText = (nombreObra.trim() || clienteFinal.trim() || 'ESOL');
  const stopWords = ['de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'sa', 'cv', 's.a.', 'c.v.'];
  const words = sourceText
    .split(/\s+/)
    .filter(w => w.length > 0 && !stopWords.includes(w.toLowerCase()));

  let iniciales = '';
  if (words.length >= 2) {
    iniciales = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    iniciales = words[0].substring(0, 2).toUpperCase();
  } else if (words.length === 1 && words[0].length === 1) {
    iniciales = (words[0] + 'X').toUpperCase();
  } else {
    iniciales = 'ES';
  }

  iniciales = iniciales.replace(/[^A-Z]/g, 'X').padEnd(2, 'X');
  const numFormatted = consecutivo.toString().padStart(3, '0');
  return `POL-${dateCode}-${iniciales}-${numFormatted}`;
};

export default function MantenimientosObrasTab() {
  const [obras, setObras] = useState<PolizaGarantia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState<PolizaGarantia | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFolio, setPreviewFolio] = useState('');
  
  // Form live state for folio generation
  const [formNombreObra, setFormNombreObra] = useState('');
  const [formClienteNombre, setFormClienteNombre] = useState('');

  const fetchObras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('polizas_garantia')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.code === '42P01') {
          console.warn("Tabla polizas_garantia no existe aún.");
          return;
        }
        throw error;
      }
      setObras(data || []);
    } catch (err) {
      console.error('Error fetching polizas_garantia:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObras();
  }, []);

  useEffect(() => {
    if (!editingData) {
      const num = obras.length + 1;
      setPreviewFolio(generarFolioProtocolo(formNombreObra, formClienteNombre, num));
    } else {
      setPreviewFolio(editingData.folio);
    }
  }, [formNombreObra, formClienteNombre, obras.length, editingData]);

  const handleOpenNew = () => {
    setEditingData(null);
    setFormNombreObra('');
    setFormClienteNombre('');
    setShowModal(true);
  };

  const handleOpenEdit = (obra: PolizaGarantia) => {
    setEditingData(obra);
    setFormNombreObra(obra.nombre_obra);
    setFormClienteNombre(obra.cliente_nombre);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Auto-fill dates if empty to avoid DB errors
    const today = new Date().toISOString().split('T')[0];
    let dInicio = formData.get('fecha_inicio') as string;
    if (!dInicio) dInicio = today;
    
    let dFin = formData.get('fecha_fin') as string;
    if (!dFin) {
      const endD = new Date();
      endD.setFullYear(endD.getFullYear() + 1);
      dFin = endD.toISOString().split('T')[0];
    }

    const data: Partial<PolizaGarantia> = {
      cliente_nombre: formData.get('cliente_nombre') as string,
      cliente_direccion: formData.get('cliente_direccion') as string,
      cliente_telefono: formData.get('cliente_telefono') as string,
      cliente_email: formData.get('cliente_email') as string,
      nombre_obra: formData.get('nombre_obra') as string,
      tipo_cobertura: formData.get('tipo_cobertura') as string,
      periodicidad: formData.get('periodicidad') as string,
      duracion_anos: parseFloat((formData.get('duracion_anos') as string) || '1'),
      fecha_inicio: dInicio,
      fecha_fin: dFin,
      monto_total: parseFloat((formData.get('monto_total') as string) || '0'),
      estado_mantenimiento: formData.get('estado_mantenimiento') as string,
      fecha_proximo_mantenimiento: formData.get('fecha_proximo_mantenimiento') as string || null,
    };

    if (!editingData) {
      // It's new, set the generated folio
      data.folio = previewFolio;
      data.conceptos_incluidos = []; // default
    }

    setIsSubmitting(true);
    try {
      if (editingData?.id) {
        // Update
        const { error } = await supabase
          .from('polizas_garantia')
          .update(data)
          .eq('id', editingData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('polizas_garantia')
          .insert([data]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchObras();
    } catch (error: any) {
      console.error('Error saving poliza:', error);
      alert('Error guardando el mantenimiento: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (obra: PolizaGarantia) => {
    if (!window.confirm(`¿Estás seguro de eliminar el mantenimiento "${obra.folio}"? Se borrarán todos los registros asociados.`)) return;
    
    try {
      const { error } = await supabase
        .from('polizas_garantia')
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
    o.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.nombre_obra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-muted" />
          <input 
            type="text" 
            placeholder="Buscar póliza, cliente u obra..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-sm text-cream pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors"
          />
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold text-dark-1 hover:bg-yellow-400 rounded-xl transition-colors font-bold text-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Crear Mantenimiento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredObras.length === 0 ? (
        <div className="border border-dark-4 bg-dark-2/40 p-16 rounded-2xl text-center space-y-4 select-none">
          <HardHat className="w-10 h-10 text-gold mx-auto opacity-50" />
          <h4 className="font-display font-black text-base text-cream">No hay Pólizas/Mantenimientos</h4>
          <p className="text-xs text-cream-muted max-w-sm mx-auto font-body">
            Comienza registrando tu primer mantenimiento o emitir una póliza desde el área Legal.
          </p>
        </div>
      ) : (
        <div className="bg-dark-2 border border-dark-4 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-3/50 border-b border-dark-4">
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider">Folio</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider">Cliente</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider">Proyecto</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider">Estatus</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider">Alerta</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider">Fechas</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider">Dirección</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider bg-dark-3/30 border-l border-dark-4">Costo</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider bg-dark-3/30">Modalidad</th>
                  <th className="px-3 py-3 text-[10px] font-black text-cream-muted uppercase tracking-wider text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4">
                {filteredObras.map((obra) => (
                  <tr 
                    key={obra.id} 
                    onClick={() => handleOpenEdit(obra)}
                    className="hover:bg-dark-3/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-dark-3 rounded-lg border border-dark-4 group-hover:border-gold/30 transition-colors">
                          <FileText className="w-3.5 h-3.5 text-gold" />
                        </div>
                        <span className="font-bold text-cream text-sm whitespace-nowrap">{obra.folio}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm text-cream-muted flex items-center gap-1.5 whitespace-nowrap">
                        <User className="w-3 h-3 text-cream-dim" />
                        {obra.cliente_nombre || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm text-cream font-medium line-clamp-1 max-w-[150px]">
                        {obra.nombre_obra || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                        obra.estado_mantenimiento === 'Sin programar' ? 'bg-dark-4 text-cream-muted' :
                        obra.estado_mantenimiento === 'Programado' ? 'bg-blue-500/20 text-blue-400' :
                        obra.estado_mantenimiento === 'En proceso' ? 'bg-gold/20 text-gold' :
                        obra.estado_mantenimiento === 'Terminado' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-dark-4 text-cream-muted'
                      }`}>
                        {obra.estado_mantenimiento || 'Sin programar'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {(() => {
                        const alertData = getAlertaMantenimiento(obra.fecha_proximo_mantenimiento);
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold whitespace-nowrap ${alertData.color}`}>
                            {alertData.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-cream-muted whitespace-nowrap">{obra.fecha_proximo_mantenimiento || obra.fecha_inicio}</span>
                        <span className="text-[9px] font-black uppercase text-blue-400 mt-0.5">{obra.periodicidad}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-cream-muted flex items-center gap-1.5 max-w-[120px] truncate" title={obra.cliente_direccion}>
                        <MapPin className="w-3 h-3 text-cream-dim shrink-0" />
                        <span className="truncate">{obra.cliente_direccion || '-'}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 bg-dark-3/30 border-l border-dark-4/50">
                      <span className="text-sm font-black text-cream whitespace-nowrap">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(obra.monto_total || 0)}
                      </span>
                    </td>
                    <td className="px-3 py-3 bg-dark-3/30">
                      {(() => {
                        const badgeData = getCostoBadge(obra);
                        return (
                          <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${badgeData.color}`}>
                            {badgeData.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(obra); }}
                          className="p-1.5 bg-dark-3 hover:bg-red-500/20 hover:text-red-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                          title="Eliminar Mantenimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4">
              <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider">
                {editingData ? 'Editar Póliza/Mantenimiento' : 'Crear Póliza de Mantenimiento'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-cream-dim hover:text-cream hover:bg-dark-3 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar max-h-[80vh] space-y-6">
              
              <div className="bg-dark-3/50 p-4 rounded-xl border border-gold/20 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-gold uppercase tracking-widest font-black mb-1">Folio Generado (Auto)</p>
                <p className="text-xl font-mono text-cream">{previewFolio}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Nombre de la Obra / Proyecto *</label>
                  <input 
                    required 
                    name="nombre_obra" 
                    value={formNombreObra}
                    onChange={e => setFormNombreObra(e.target.value)}
                    placeholder="Ej: SFV Residencial Lomas" 
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Nombre del Cliente *</label>
                  <input 
                    required 
                    name="cliente_nombre" 
                    value={formClienteNombre}
                    onChange={e => setFormClienteNombre(e.target.value)}
                    placeholder="Ej: Juan Pérez" 
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Dirección de la Instalación</label>
                  <input 
                    name="cliente_direccion" 
                    defaultValue={editingData?.cliente_direccion || ''} 
                    placeholder="Calle, Colonia, Ciudad" 
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Teléfono</label>
                  <input 
                    name="cliente_telefono" 
                    defaultValue={editingData?.cliente_telefono || ''} 
                    placeholder="10 dígitos" 
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Correo Electrónico</label>
                  <input 
                    name="cliente_email" 
                    type="email"
                    defaultValue={editingData?.cliente_email || ''} 
                    placeholder="cliente@correo.com" 
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Periodicidad</label>
                  <select name="periodicidad" defaultValue={editingData?.periodicidad || 'Trimestral'} className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors appearance-none">
                    <option value="Mensual">Mensual</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                    <option value="Por evento">Por evento (Única Vez)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Cobertura</label>
                  <select name="tipo_cobertura" defaultValue={editingData?.tipo_cobertura || 'Preventivo'} className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors appearance-none">
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                    <option value="Preventivo y Correctivo">Preventivo y Correctivo</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Estatus de Mantenimiento</label>
                  <select name="estado_mantenimiento" defaultValue={editingData?.estado_mantenimiento || 'Sin programar'} className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors appearance-none">
                    <option value="Sin programar">Sin programar</option>
                    <option value="Programado">Programado</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Terminado">Terminado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Fecha Programada Mantenimiento</label>
                  <input 
                    name="fecha_proximo_mantenimiento" 
                    type="date"
                    defaultValue={editingData?.fecha_proximo_mantenimiento || ''} 
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-cream-muted uppercase">Costo Total ($ MXN)</label>
                  <input 
                    name="monto_total" 
                    type="number"
                    step="0.01"
                    defaultValue={editingData?.monto_total || '0'} 
                    placeholder="Ej: 15000" 
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors" 
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-dark-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-cream-dim hover:text-cream hover:bg-dark-3 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gold text-dark-1 hover:bg-yellow-400 transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar Mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
