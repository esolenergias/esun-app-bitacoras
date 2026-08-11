import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import type { PolizaGarantia } from './MantenimientosObrasTab';
import { 
  ArrowLeft, Calendar, FileText, Camera, CheckSquare, Zap, 
  MapPin, Phone, Shield, FileCheck, Upload, Save, User, Clock, 
  PlayCircle, AlertCircle, Activity, Cloud, CheckCircle
} from 'lucide-react';

interface ExpedienteProps {
  obra: PolizaGarantia;
  onBack: () => void;
}

export default function ExpedienteMantenimiento({ obra, onBack }: ExpedienteProps) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'calendario'>('resumen');
  const [visitas, setVisitas] = useState<any[]>([]);
  const [selectedVisita, setSelectedVisita] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bitacora States
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [evidenciaFotos, setEvidenciaFotos] = useState<string[]>([]);
  const [notasVisita, setNotasVisita] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<{file: File, preview: string}[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedPendingIndex, setDraggedPendingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchVisitas();
  }, [obra.id]);

  const fetchVisitas = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('visitas_mantenimiento_poliza')
      .select('*')
      .eq('poliza_id', obra.id)
      .order('numero_visita', { ascending: true });
    
    if (data) {
      setVisitas(data);
    }
    setIsLoading(false);
  };

  const handleOpenVisita = (visita: any) => {
    setSelectedVisita(visita);
    setChecklist(visita.checklist_data || {});
    setEvidenciaFotos(visita.evidencia_fotos || []);
    setNotasVisita(visita.notas_visita || '');
    setPendingPhotos([]);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPending = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setPendingPhotos(prev => [...prev, ...newPending]);
  };

  const removePendingPhoto = (index: number) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadPending = async () => {
    if (pendingPhotos.length === 0) return;
    
    setIsUploadingPhoto(true);
    let uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < pendingPhotos.length; i++) {
        const file = pendingPhotos[i].file;
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const response = await fetch('https://script.google.com/macros/s/AKfycbx2I7-77T-EUv-3DCK7ueL9eGn4871nv-EJY_qBJxRu5TFQ3IWNcXOjEE89ghI4UbLa2w/exec', {
          method: 'POST',
          body: JSON.stringify({
            filename: `mtto_${obra.folio}_visita${selectedVisita.numero_visita}_${Date.now()}_${file.name}`,
            mimeType: file.type,
            base64: base64,
            folderName: `Mantenimiento - ${obra.nombre_obra}`
          })
        });
        
        const result = await response.json();
        if (result.success) {
          uploadedUrls.push(result.url);
        } else {
          console.error("Error subiendo a Drive:", result.error);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setEvidenciaFotos(prev => [...prev, ...uploadedUrls]);
        setPendingPhotos([]);
        // Auto-guardar en base de datos para no perder las URLs si se salen
        await supabase
          .from('visitas_mantenimiento_poliza')
          .update({ evidencia_fotos: [...evidenciaFotos, ...uploadedUrls] })
          .eq('id', selectedVisita.id);
      }

    } catch (err: any) {
      console.error('Error al subir fotos a Drive:', err);
      alert('Hubo un error subiendo algunas fotos a Google Drive: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setEvidenciaFotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleChecklist = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveVisita = async () => {
    if (!selectedVisita) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('visitas_mantenimiento_poliza')
        .update({
          checklist_data: checklist,
          evidencia_fotos: evidenciaFotos,
          notas_visita: notasVisita,
          estado: 'completada',
          fecha_realizada: new Date().toISOString().split('T')[0]
        })
        .eq('id', selectedVisita.id);
      
      if (error) throw error;
      alert('¡Bitácora guardada con éxito!');
      
      // Update local state
      setVisitas(prev => prev.map(v => v.id === selectedVisita.id ? {
        ...v, 
        checklist_data: checklist, 
        evidencia_fotos: evidenciaFotos, 
        notas_visita: notasVisita,
        estado: 'completada',
        fecha_realizada: new Date().toISOString().split('T')[0]
      } : v));
      setSelectedVisita(null);

    } catch (err: any) {
      alert('Error guardando bitácora: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'Sin fecha';
    return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDriveThumbnailUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:image')) return url; // base64 compatibility
    
    // Si ya es un enlace de thumbnail, lo dejamos
    if (url.includes('drive.google.com/thumbnail')) return url;
    
    const match = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    }
    return url;
  };

  const isHVAC = Array.isArray(obra.conceptos_incluidos) 
    ? obra.conceptos_incluidos.includes('mtto_aires') || obra.conceptos_incluidos.some((c: any) => typeof c === 'string' && c.toLowerCase().includes('aire'))
    : false;

  const getChecklistTemplate = () => {
    // Si incluye Aires Acondicionados o si es un arreglo genérico por defecto usamos la plantilla HVAC
    if (isHVAC || true) {
      return [
        {
          title: "Unidad Evaporadora (Interior)",
          items: [
            { id: 'evap_desarmado', label: 'Desarmado de cubiertas externas para lavado profundo.' },
            { id: 'evap_desincrustante', label: 'Aplicación de desincrustante químico biodegradable y antibacterial en serpentín.' },
            { id: 'evap_lavado_alta_presion', label: 'Limpieza a alta presión de turbina y filtros de aire.' },
            { id: 'evap_charola_drenajes', label: 'Lavado de charola de condensados y desobstrucción de drenajes.' },
            { id: 'evap_tabletas_cloro', label: 'Colocación de tabletas de cloro de disolución lenta.' }
          ]
        },
        {
          title: "Unidad Condensadora (Exterior)",
          items: [
            { id: 'cond_hidrolavado', label: 'Retiro de suciedad ambiental de serpentines mediante hidrolavado a presión controlada.' },
            { id: 'cond_peinado_aletas', label: 'Peinado manual de aletas de aluminio dañadas para restaurar flujo de aire.' },
            { id: 'cond_soportes', label: 'Revisión de soportes metálicos y anclajes antivibración.' },
            { id: 'cond_inspeccion_acustica', label: 'Inspección acústica y de vibración del compresor y aspas.' }
          ]
        },
        {
          title: "Diagnóstico Eléctrico y Operativo",
          items: [
            { id: 'elec_medicion_voltaje', label: 'Medición y registro de voltaje de línea y consumo de corriente (amperaje de arranque y trabajo).' },
            { id: 'elec_capacitores', label: 'Verificación de estado de capacitores de marcha y contactores.' },
            { id: 'elec_ajuste_mecanico', label: 'Ajuste mecánico y reapriete de terminales eléctricas de fuerza y control.' },
            { id: 'elec_presiones_gas', label: 'Monitoreo de presiones de gas refrigerante (R-410A o R-22).' }
          ]
        },
        {
          title: "Reporte Digital y Gestión de Activos",
          items: [
            { id: 'rep_identificacion', label: 'Identificación única de cada equipo en base de datos.' },
            { id: 'rep_fotografico', label: 'Registro fotográfico georreferenciado (antes y después del servicio).' },
            { id: 'rep_acceso_nube', label: 'Acceso inmediato del Poder Judicial a la nube de reportes para validar conformidad.' }
          ]
        }
      ];
    }
  };

  const checklistCategories = getChecklistTemplate();

  if (selectedVisita) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        {/* HEADER DE EJECUCIÓN (FROSTED GLASS) */}
        <div className="relative overflow-hidden rounded-2xl bg-dark-2/40 backdrop-blur-xl border border-white/5 shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex items-center gap-6 z-10 w-full">
            <button 
              onClick={() => setSelectedVisita(null)}
              className="p-3 bg-dark-3/50 hover:bg-gold/20 text-cream hover:text-gold rounded-xl transition-all border border-white/5 hover:border-gold/30 hover:-translate-x-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cream to-cream-muted">
                  Bitácora de Visita #{selectedVisita.numero_visita}
                </h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  selectedVisita.estado === 'completada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gold/20 text-gold border border-gold/30'
                }`}>
                  {selectedVisita.estado}
                </span>
              </div>
              <p className="text-sm text-cream-muted mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" /> Fecha Programada: {formatFecha(selectedVisita.fecha_programada)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-6">
            {/* Checklist */}
            <div className="bg-dark-2/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
              
              <h3 className="text-xl font-bold text-cream mb-6 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                </div>
                Checklist Operativo
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {checklistCategories?.map((category, catIdx) => (
                  <div key={catIdx} className="space-y-4">
                    <h4 className="text-sm font-black text-gold uppercase tracking-widest border-b border-white/5 pb-2">
                      {category.title}
                    </h4>
                    <div className="space-y-2">
                      {category.items.map(item => (
                        <label key={item.id} className="flex items-start gap-4 p-3 bg-dark-3/50 hover:bg-dark-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5">
                          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                            <input 
                              type="checkbox"
                              checked={checklist[item.id] || false}
                              onChange={() => toggleChecklist(item.id)}
                              className="peer w-5 h-5 rounded-md border-dark-4 text-gold focus:ring-gold bg-dark-1 transition-all cursor-pointer appearance-none checked:bg-gold checked:border-gold"
                            />
                            <CheckSquare className="w-3.5 h-3.5 text-dark-1 absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <span className={`text-sm leading-snug transition-colors ${checklist[item.id] ? 'text-cream font-medium' : 'text-cream-muted'}`}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidencia Fotográfica */}
            <div className="bg-dark-2/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 lg:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-cream flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Camera className="w-5 h-5 text-purple-400" />
                  </div>
                  Evidencia Fotográfica
                </h3>
                <div className="flex items-center gap-4">
                  {pendingPhotos.length > 0 && (
                    <button 
                      onClick={handleUploadPending}
                      disabled={isUploadingPhoto}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Cloud className="w-4 h-4" />
                      )}
                      {isUploadingPhoto ? `Subiendo a Drive (${pendingPhotos.length})...` : `Subir a Drive (${pendingPhotos.length})`}
                    </button>
                  )}
                  
                  <label className={`bg-dark-3 hover:bg-purple-500/20 text-purple-400 px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 text-sm font-bold transition-all border border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-4 h-4" />
                    Seleccionar Imágenes
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} disabled={isUploadingPhoto} />
                  </label>
                </div>
              </div>
              
              {evidenciaFotos.length === 0 && pendingPhotos.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-dark-4 hover:border-purple-500/30 rounded-2xl transition-colors bg-dark-3/20">
                  <div className="w-16 h-16 bg-dark-3 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-cream-muted opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-cream mb-1">Sin evidencia fotográfica</p>
                  <p className="text-xs text-cream-muted">Sube fotos del "Antes" y "Después" del servicio.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {/* Pending Photos */}
                  {pendingPhotos.map((photo, idx) => (
                    <div 
                      key={`pending-${idx}`} 
                      draggable
                      onDragStart={(e) => {
                        setDraggedPendingIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', idx.toString());
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedPendingIndex === null || draggedPendingIndex === idx) return;
                        const newPending = [...pendingPhotos];
                        const [removed] = newPending.splice(draggedPendingIndex, 1);
                        newPending.splice(idx, 0, removed);
                        setPendingPhotos(newPending);
                        setDraggedPendingIndex(null);
                      }}
                      onDragEnd={() => setDraggedPendingIndex(null)}
                      className={`relative group rounded-xl overflow-hidden border-2 border-dashed shadow-lg aspect-square cursor-move transition-all ${draggedPendingIndex === idx ? 'opacity-50 scale-95 border-gold' : 'border-blue-500/50 hover:border-gold/50'}`}
                    >
                      <img src={photo.preview} alt={`Pendiente ${idx+1}`} className="w-full h-full object-cover grayscale pointer-events-none" />
                      <div className="absolute inset-0 bg-dark-1/50 flex flex-col items-center justify-center pointer-events-none">
                         <Cloud className="w-4 h-4 text-blue-400 mb-1" />
                         <span className="text-[8px] font-bold text-blue-300 uppercase tracking-widest px-1 text-center leading-tight">Pendiente</span>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-blue-500/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-white pointer-events-none">
                        {idx + 1}
                      </div>
                      <button 
                        onClick={() => removePendingPhoto(idx)}
                        disabled={isUploadingPhoto}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg transition-all hover:scale-110 shadow-lg z-10 opacity-0 group-hover:opacity-100"
                        title="Quitar"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}

                  {/* Uploaded Photos */}
                  {evidenciaFotos.map((foto, idx) => (
                    <div 
                      key={`uploaded-${idx}`} 
                      draggable
                      onDragStart={(e) => {
                        setDraggedIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', idx.toString());
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIndex === null || draggedIndex === idx) return;
                        const newFotos = [...evidenciaFotos];
                        const [removed] = newFotos.splice(draggedIndex, 1);
                        newFotos.splice(idx, 0, removed);
                        setEvidenciaFotos(newFotos);
                        setDraggedIndex(null);
                      }}
                      onDragEnd={() => setDraggedIndex(null)}
                      className={`relative group rounded-xl overflow-hidden border border-white/5 shadow-lg aspect-square cursor-move transition-all ${draggedIndex === idx ? 'opacity-50 scale-95 border-gold' : 'hover:border-gold/50'}`}
                    >
                      <a href={foto} target="_blank" rel="noopener noreferrer" className="block w-full h-full pointer-events-auto">
                        <img 
                          src={getDriveThumbnailUrl(foto)} 
                          alt={`Evidencia ${idx+1}`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none bg-dark-2" 
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('/thumbnail?id=')) {
                              let retries = parseInt(target.dataset.retries || '0');
                              if (retries < 15) { // Intentar hasta por 30 segundos
                                setTimeout(() => {
                                  target.dataset.retries = (retries + 1).toString();
                                  const url = new URL(target.src);
                                  url.searchParams.set('retry', Date.now().toString());
                                  target.src = url.toString();
                                }, 2000);
                              }
                            }
                          }}
                        />
                      </a>
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-1/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <div className="absolute bottom-1 left-1 bg-dark-1/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-cream-muted pointer-events-none">
                        {idx + 1}
                      </div>
                      <button 
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                        title="Eliminar foto"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full">
            {/* Detalles Visita */}
            <div className="bg-dark-2/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 lg:p-8 shadow-xl">
              <h3 className="text-xl font-bold text-cream mb-6 flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                Cierre de Visita
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] text-cream-muted font-black tracking-widest uppercase block mb-2">Observaciones / Trabajos Realizados</label>
                  <textarea 
                    value={notasVisita}
                    onChange={e => setNotasVisita(e.target.value)}
                    className="w-full bg-dark-3/50 border border-white/5 hover:border-white/10 rounded-xl p-4 text-sm text-cream focus:border-gold outline-none h-40 resize-none transition-colors"
                    placeholder="Describe los trabajos realizados, refacciones utilizadas, o anomalías encontradas..."
                  />
                </div>
                
                <button 
                  onClick={handleSaveVisita}
                  disabled={isSaving}
                  className="w-full relative group overflow-hidden bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Guardando y Sellando...' : 'Guardar y Completar Visita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* HEADER EXPEDIENTE (PREMIUM HERO) */}
      <div className="relative overflow-hidden bg-dark-2 border border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="space-y-6">
            <button 
              onClick={onBack}
              className="group flex items-center gap-2 text-sm font-bold text-cream-muted hover:text-gold transition-colors"
            >
              <div className="p-1.5 bg-dark-3 rounded-lg border border-white/5 group-hover:border-gold/30 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              Regresar al Tablero
            </button>
            
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                  {obra.nombre_obra}
                </h1>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${
                  obra.modalidad_contratacion === 'Cobro por Evento' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-blue-500/10' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10'
                }`}>
                  {obra.modalidad_contratacion || 'Póliza Prepagada'}
                </span>
              </div>
              <p className="text-cream-muted font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" /> Folio de Contrato: <span className="text-cream">{obra.folio}</span>
              </p>
            </div>
          </div>

          {/* Nav Pills */}
          <div className="flex bg-dark-3/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md self-stretch lg:self-auto">
            <button 
              onClick={() => setActiveTab('resumen')}
              className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'resumen' 
                  ? 'bg-gold text-dark-1 shadow-[0_4px_15px_rgba(255,215,0,0.2)]' 
                  : 'text-cream-muted hover:text-cream hover:bg-dark-3'
              }`}
            >
              <Activity className="w-4 h-4" />
              Resumen
            </button>
            <button 
              onClick={() => setActiveTab('calendario')}
              className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'calendario' 
                  ? 'bg-gold text-dark-1 shadow-[0_4px_15px_rgba(255,215,0,0.2)]' 
                  : 'text-cream-muted hover:text-cream hover:bg-dark-3'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Bitácoras
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-dark-2/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-cream mb-8 flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <FileCheck className="w-5 h-5 text-gold" />
                </div>
                Información de Póliza
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div className="bg-dark-3/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-cream-muted font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Cliente / Titular
                  </p>
                  <p className="text-base font-semibold text-cream">{obra.cliente_nombre}</p>
                </div>
                
                <div className="bg-dark-3/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-cream-muted font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Contacto
                  </p>
                  <p className="text-base font-semibold text-cream">{obra.cliente_telefono || 'No registrado'}</p>
                </div>
                
                <div className="sm:col-span-2 bg-dark-3/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-cream-muted font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Dirección Física de Instalación
                  </p>
                  <p className="text-base font-semibold text-cream">{obra.cliente_direccion || 'No registrada'}</p>
                </div>
                
                <div className="bg-dark-3/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-cream-muted font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Periodo de Vigencia
                  </p>
                  <p className="text-sm font-semibold text-cream">{formatFecha(obra.fecha_inicio)} <span className="text-cream-muted mx-1">al</span> {formatFecha(obra.fecha_fin)}</p>
                </div>
                
                <div className="bg-dark-3/30 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-cream-muted font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Frecuencia de Visitas
                  </p>
                  <p className="text-sm font-semibold text-cream">{obra.periodicidad}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-dark-2/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl"></div>
                
                <h3 className="text-lg font-bold text-cream mb-6 flex items-center gap-2 relative z-10">
                  <Activity className="w-5 h-5 text-gold" /> Progreso Global
                </h3>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200 leading-none">
                        {visitas.filter(v => v.estado === 'completada').length}
                      </p>
                      <p className="text-xs text-cream-muted font-black uppercase tracking-widest mt-2">Visitas Hechas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cream-muted leading-none">{visitas.length}</p>
                      <p className="text-[10px] text-cream-muted font-black uppercase tracking-widest mt-2">Total</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-dark-4 rounded-full h-3 overflow-hidden shadow-inner relative">
                    <div className="absolute inset-0 bg-dark-4"></div>
                    <div 
                      className="relative h-full bg-gradient-to-r from-gold to-yellow-300 rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all duration-1000 ease-out" 
                      style={{ width: `${visitas.length ? (visitas.filter(v => v.estado === 'completada').length / visitas.length) * 100 : 0}%` }}
                    >
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik0wIDQwbDQwLTQwIi8+PHBhdGggZD0iTS0xMCAxMGwyMC0yMCIvPjxwYXRoIGQ9Ik0zMCA1MGwyMC0yMCIvPjwvZz48L3N2Zz4=')] opacity-30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-dark-2/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex items-start gap-4">
               <div className="p-3 bg-blue-500/10 rounded-xl">
                 <AlertCircle className="w-6 h-6 text-blue-400" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-cream mb-1">Próxima Acción</h4>
                 <p className="text-xs text-cream-muted leading-relaxed">
                   {visitas.find(v => v.estado !== 'completada') 
                     ? `Tienes una visita programada para el ${formatFecha(visitas.find(v => v.estado !== 'completada').fecha_programada)}.`
                     : "Todas las visitas de esta póliza han sido completadas."}
                 </p>
               </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'calendario' && (
        <div className="bg-dark-2/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-cream flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Calendar className="w-6 h-6 text-gold" />
              </div>
              Calendario de Servicios
            </h3>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-cream-muted">
              <div className="w-10 h-10 border-4 border-dark-4 border-t-gold rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Cargando bitácoras programadas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visitas.map((visita) => {
                const isCompleted = visita.estado === 'completada';
                return (
                  <div 
                    key={visita.id} 
                    onClick={() => handleOpenVisita(visita)}
                    className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 group overflow-hidden ${
                      isCompleted 
                        ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]' 
                        : 'bg-dark-3/30 border-white/5 hover:border-gold/40 hover:shadow-[0_8px_30px_rgba(255,215,0,0.1)]'
                    }`}
                  >
                    {/* Hover Glow Effect */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isCompleted ? 'bg-gradient-to-br from-emerald-500/5 to-transparent' : 'bg-gradient-to-br from-gold/5 to-transparent'}`}></div>

                    <div className="relative z-10 flex justify-between items-start mb-6">
                      <div className={`px-4 py-1.5 rounded-xl border font-black text-sm shadow-sm ${
                        isCompleted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-dark-4 border-dark-3 text-gold'
                      }`}>
                        VISITA #{visita.numero_visita}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                        isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-dark-4 text-cream-muted'
                      }`}>
                        {isCompleted && <CheckSquare className="w-3 h-3" />}
                        {visita.estado}
                      </span>
                    </div>
                    
                    <div className="space-y-3 relative z-10">
                      <p className="text-[11px] text-cream-muted font-black tracking-widest uppercase">Fecha Programada</p>
                      <p className="text-lg font-bold text-cream flex items-center gap-2">
                        <Calendar className={`w-5 h-5 ${isCompleted ? 'text-emerald-400' : 'text-gold'}`} />
                        {formatFecha(visita.fecha_programada)}
                      </p>
                    </div>

                    {isCompleted ? (
                      <div className="mt-6 pt-4 border-t border-emerald-500/20 relative z-10">
                        <p className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Realizada el {formatFecha(visita.fecha_realizada)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 pt-4 border-t border-white/5 relative z-10 flex items-center justify-between text-cream-muted group-hover:text-gold transition-colors">
                        <span className="text-xs font-bold uppercase tracking-widest">Ejecutar Visita</span>
                        <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);
