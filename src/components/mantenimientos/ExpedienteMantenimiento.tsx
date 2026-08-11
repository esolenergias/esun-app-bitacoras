import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { PolizaGarantia } from './MantenimientosObrasTab';
import { 
  ArrowLeft, Calendar, FileText, Camera, CheckSquare, Zap, 
  MapPin, Phone, Shield, FileCheck, Upload, Save, User, Clock 
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
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidenciaFotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
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

  // Plantilla de Checklist para HVAC/Solar general
  const defaultChecklistItems = [
    { id: 'limpieza_general', label: 'Limpieza general de equipos' },
    { id: 'revision_conexiones', label: 'Revisión de conexiones eléctricas y reapriete' },
    { id: 'medicion_parametros', label: 'Medición de voltaje, amperaje y parámetros' },
    { id: 'inspeccion_fisica', label: 'Inspección visual de daños físicos o desgaste' },
    { id: 'pruebas_arranque', label: 'Pruebas de arranque y funcionamiento' },
    { id: 'lubricacion', label: 'Lubricación de partes móviles (si aplica)' }
  ];

  if (selectedVisita) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex items-center gap-4 bg-dark-2 p-4 rounded-xl border border-dark-4">
          <button 
            onClick={() => setSelectedVisita(null)}
            className="p-2 hover:bg-dark-3 rounded-lg text-cream transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-cream">Ejecución de Visita #{selectedVisita.numero_visita}</h2>
            <p className="text-sm text-cream-muted">Folio de Póliza: {obra.folio}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Checklist */}
            <div className="bg-dark-2 border border-dark-4 rounded-xl p-6">
              <h3 className="text-lg font-bold text-cream mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-gold" />
                Checklist de Mantenimiento
              </h3>
              <div className="space-y-3">
                {defaultChecklistItems.map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-3 bg-dark-3 rounded-lg cursor-pointer hover:bg-dark-4 transition-colors">
                    <input 
                      type="checkbox"
                      checked={checklist[item.id] || false}
                      onChange={() => toggleChecklist(item.id)}
                      className="w-5 h-5 rounded border-dark-4 text-gold focus:ring-gold bg-dark-1"
                    />
                    <span className="text-sm text-cream">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Evidencia Fotográfica */}
            <div className="bg-dark-2 border border-dark-4 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-cream flex items-center gap-2">
                  <Camera className="w-5 h-5 text-gold" />
                  Evidencia Fotográfica
                </h3>
                <label className="bg-gold/10 hover:bg-gold/20 text-gold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm font-semibold transition-colors border border-gold/30">
                  <Upload className="w-4 h-4" />
                  Subir Foto
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              
              {evidenciaFotos.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-dark-4 rounded-xl">
                  <Camera className="w-8 h-8 text-cream-muted mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-cream-muted">No hay fotografías cargadas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {evidenciaFotos.map((foto, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-dark-4">
                      <img src={foto} alt={`Evidencia ${idx+1}`} className="w-full h-32 object-cover" />
                      <button 
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Detalles Visita */}
            <div className="bg-dark-2 border border-dark-4 rounded-xl p-6">
              <h3 className="text-lg font-bold text-cream mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Resumen de Visita
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-cream-muted font-bold uppercase block mb-1">Fecha Programada</label>
                  <p className="text-sm text-cream">{formatFecha(selectedVisita.fecha_programada)}</p>
                </div>
                <div>
                  <label className="text-xs text-cream-muted font-bold uppercase block mb-1">Notas de Servicio / Observaciones</label>
                  <textarea 
                    value={notasVisita}
                    onChange={e => setNotasVisita(e.target.value)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-sm text-cream focus:border-gold outline-none h-32 resize-none"
                    placeholder="Describe cualquier anomalía, refacción utilizada o comentario relevante..."
                  />
                </div>
                <button 
                  onClick={handleSaveVisita}
                  disabled={isSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Guardando...' : 'Guardar y Completar Visita'}
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
      {/* HEADER EXPEDIENTE */}
      <div className="bg-gradient-to-r from-dark-2 to-dark-3 border border-dark-4 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 z-10">
          <button 
            onClick={onBack}
            className="p-3 bg-dark-4 hover:bg-gold/20 text-cream hover:text-gold rounded-xl transition-colors border border-transparent hover:border-gold/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-cream">{obra.nombre_obra}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                obra.modalidad_contratacion === 'Cobro por Evento' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {obra.modalidad_contratacion || 'Póliza Prepagada'}
              </span>
            </div>
            <p className="text-cream-muted text-sm font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" /> Folio: {obra.folio}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto z-10">
          <button 
            onClick={() => setActiveTab('resumen')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'resumen' ? 'bg-gold text-dark-1 shadow-lg shadow-gold/20' : 'bg-dark-4 text-cream-muted hover:text-cream'
            }`}
          >
            Resumen
          </button>
          <button 
            onClick={() => setActiveTab('calendario')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'calendario' ? 'bg-gold text-dark-1 shadow-lg shadow-gold/20' : 'bg-dark-4 text-cream-muted hover:text-cream'
            }`}
          >
            Bitácoras
          </button>
        </div>
      </div>

      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-dark-2 border border-dark-4 rounded-xl p-6">
              <h3 className="text-lg font-bold text-cream mb-6 flex items-center gap-2 border-b border-dark-4 pb-4">
                <FileCheck className="w-5 h-5 text-gold" />
                Información de Póliza
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-cream-muted font-bold uppercase mb-1">Cliente / Titular</p>
                  <p className="text-sm text-cream flex items-center gap-2"><User className="w-4 h-4 text-gold" /> {obra.cliente_nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-cream-muted font-bold uppercase mb-1">Contacto</p>
                  <p className="text-sm text-cream flex items-center gap-2"><Phone className="w-4 h-4 text-gold" /> {obra.cliente_telefono || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-cream-muted font-bold uppercase mb-1">Dirección Física</p>
                  <p className="text-sm text-cream flex items-center gap-2"><MapPin className="w-4 h-4 text-gold" /> {obra.cliente_direccion || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-cream-muted font-bold uppercase mb-1">Vigencia</p>
                  <p className="text-sm text-cream flex items-center gap-2"><Calendar className="w-4 h-4 text-gold" /> {formatFecha(obra.fecha_inicio)} al {formatFecha(obra.fecha_fin)}</p>
                </div>
                <div>
                  <p className="text-xs text-cream-muted font-bold uppercase mb-1">Frecuencia</p>
                  <p className="text-sm text-cream flex items-center gap-2"><Clock className="w-4 h-4 text-gold" /> {obra.periodicidad}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-dark-2 border border-dark-4 rounded-xl p-6">
                <h3 className="text-sm font-bold text-cream mb-4">Progreso de Póliza</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-3xl font-black text-gold">{visitas.filter(v => v.estado === 'completada').length}</p>
                    <p className="text-sm text-cream-muted mb-1">de {visitas.length} visitas</p>
                  </div>
                  <div className="w-full bg-dark-4 rounded-full h-2">
                    <div 
                      className="bg-gold h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${visitas.length ? (visitas.filter(v => v.estado === 'completada').length / visitas.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'calendario' && (
        <div className="bg-dark-2 border border-dark-4 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-cream flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              Calendario de Bitácoras
            </h3>
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-cream-muted">Cargando bitácoras...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitas.map((visita) => (
                <div 
                  key={visita.id} 
                  onClick={() => handleOpenVisita(visita)}
                  className={`relative p-5 rounded-xl border cursor-pointer transition-all hover:-translate-y-1 ${
                    visita.estado === 'completada' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50' 
                      : 'bg-dark-3 border-dark-4 hover:border-gold/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-dark-1 px-3 py-1 rounded-lg border border-dark-4 text-gold font-black text-sm">
                      VISITA #{visita.numero_visita}
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                      visita.estado === 'completada' ? 'bg-emerald-500 text-white' : 'bg-dark-4 text-cream-muted'
                    }`}>
                      {visita.estado}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-cream-muted uppercase font-bold">Fecha Programada</p>
                    <p className="text-sm font-medium text-cream flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gold" />
                      {formatFecha(visita.fecha_programada)}
                    </p>
                  </div>

                  {visita.estado === 'completada' && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" /> Realizada el {formatFecha(visita.fecha_realizada)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
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
