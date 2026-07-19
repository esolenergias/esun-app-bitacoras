import React, { useState, useEffect } from 'react';
import { supabase } from '../context/supabase';
import { RefreshCw, Search, Calendar, MapPin, HardHat, TrendingUp, DollarSign, Cloud, Users, CheckCircle, Clock, Plus, X, Edit2, Trash2, ArrowLeft, Image as ImageIcon, ChevronDown, ChevronUp, ExternalLink, FileText, Download } from 'lucide-react';

import type { Bitacora, ObraApp } from './esun/types';
import { generateObraReport } from './esun/pdfGenerator';

export default function BitacorasApp({ reporterName = 'ESOL Supervisor' }: { reporterName?: string }) {
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([]);
  const [obras, setObras] = useState<ObraApp[]>([]);
  const [conceptosObra, setConceptosObra] = useState<any[]>([]);
  const [selectedConceptoValue, setSelectedConceptoValue] = useState<string>('');
  const [isNewConceptoMode, setIsNewConceptoMode] = useState(false);

  const [showObraModal, setShowObraModal] = useState(false);
  const [editingObraData, setEditingObraData] = useState<ObraApp | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'registros' | 'obras' | 'terminadas'>('registros');
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedObraDetail, setSelectedObraDetail] = useState<ObraApp | null>(null);
  const [editingBitacora, setEditingBitacora] = useState<Bitacora | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // When opening modal
  useEffect(() => {
    if (showNewModal) {
      if (editingBitacora?.concepto) {
        // Verify if it exists in list
        const exists = conceptosObra.find(c => c.description === editingBitacora.concepto);
        if (exists) {
          setIsNewConceptoMode(false);
          setSelectedConceptoValue(editingBitacora.concepto);
        } else {
          setIsNewConceptoMode(true);
          setSelectedConceptoValue(editingBitacora.concepto);
        }
      } else {
        setIsNewConceptoMode(false);
        setSelectedConceptoValue('');
      }
    }
  }, [showNewModal, editingBitacora, conceptosObra]);

  // Helper to get a working image URL for Drive – always use thumbnail endpoint
  const getDriveImageUrl = (url: string) => {
    if (!url) return '';
    // Extract Drive file ID from various URL formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /\/open\?id=([a-zA-Z0-9_-]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
      }
    }
    return url;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    try {
      const { error } = await supabase.from('esun_bitacoras').delete().eq('id', id);
      if (error) throw error;
      fetchBitacoras();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Hubo un error al eliminar el registro.');
    }
  };

  const handleDeleteObra = async (obra: ObraApp) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la obra "${obra.nombre}"?`)) return;
    try {
      if (obra.id) {
        const { error } = await supabase.from('obras_app').delete().eq('id', obra.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('obras_app').delete().eq('nombre', obra.nombre);
        if (error) throw error;
      }
      fetchBitacoras();
    } catch (error) {
      console.error('Error deleting obra:', error);
      alert('Hubo un error al eliminar la obra.');
    }
  };


  const openNewModal = () => {
    setEditingBitacora(null);
    setShowNewModal(true);
  };

  const openEditModal = (b: Bitacora) => {
    setEditingBitacora(b);
    setShowNewModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const siteName = formData.get('site_name') as string;
      
      let finalPhotoUri = editingBitacora?.photo_uri || null;
      const photoFile = formData.get('photo_file') as File;
      
      // Upload photo to Google Drive if selected
      if (photoFile && photoFile.size > 0) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
        });
        
        try {
          const response = await fetch('https://script.google.com/macros/s/AKfycbwm5qwhrgsD37Hd8tFTZkECfKv-rYUoF3omNjm_GX0hZKeDyxC5tQTdXTPLUWEUUT5s/exec', {
            method: 'POST',
            body: JSON.stringify({
              filename: `web_${Date.now()}_${photoFile.name}`,
              mimeType: photoFile.type,
              base64: base64
            })
          });
          const result = await response.json();
          if (result.success) {
            finalPhotoUri = result.url;
          }
        } catch (e) {
          console.error('Error uploading photo to Drive from Web:', e);
          alert('Hubo un error subiendo la foto, pero se guardará el registro.');
        }
      }

      // Registrar la obra (UPSERT) si no estamos editando
      if (!editingBitacora) {
        await supabase.from('obras_app').upsert([{ 
          nombre: siteName,
          status: 'En proceso'
        }], { onConflict: 'nombre' });
      }

      const bitacoraData = {
        site_name: siteName,
        date: formData.get('date') as string,
        weather: formData.get('weather') as string,
        crew_count: parseInt(formData.get('crew_count') as string) || 0,
        description: formData.get('description') as string,
        physical_progress: parseFloat(formData.get('physical_progress') as string) || 0,
        financial_progress: parseFloat(formData.get('financial_progress') as string) || 0,
        budget_estimate: 0,
        latitude: 0,
        longitude: 0,
        // photo_uri: finalPhotoUri, ya lo hicimos arriba, ahora falta el concepto
        concepto: selectedConceptoValue || null,
        timestamp: Date.now()
      };

      if (editingBitacora) {
        const { error } = await supabase.from('esun_bitacoras').update(bitacoraData).eq('id', editingBitacora.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('esun_bitacoras').insert([bitacoraData]);
        if (error) throw error;
      }
      
      setShowNewModal(false);
      setEditingBitacora(null);
      fetchBitacoras();
    } catch (error) {
      console.error('Error saving bitacora:', error);
      alert('Hubo un error al guardar el registro. Revisa la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleObraSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingObraData) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const updates = {
      cliente: formData.get('cliente') as string,
      ubicacion: formData.get('ubicacion') as string,
      status: formData.get('status') as string,
    };

    try {
      if (typeof editingObraData.id === 'number' || !isNaN(Number(editingObraData.id))) {
        await supabase.from('presupuestos').update(updates).eq('id', editingObraData.id);
      } else {
        await supabase.from('obras_app').update(updates).eq('nombre', editingObraData.nombre);
      }
      setShowObraModal(false);
      fetchBitacoras();
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const fetchConceptos = async (obraId?: any) => {
    if (!obraId) {
      setConceptosObra([]);
      return;
    }
    const { data } = await supabase
      .from('conceptos_bitacora')
      .select('description')
      .eq('presupuesto_id', obraId);
    setConceptosObra(data || []);
  };

  useEffect(() => {
    if (selectedObraDetail?.id) {
      fetchConceptos(selectedObraDetail.id);
    } else {
      setConceptosObra([]);
    }
  }, [selectedObraDetail]);

  const fetchBitacoras = async () => {
    setLoading(true);
    try {
      const [obrasRes, bitacorasRes, presRes] = await Promise.all([
        supabase.from('obras_app').select('*').order('created_at', { ascending: false }),
        supabase.from('esun_bitacoras').select('*').order('created_at', { ascending: false }),
        supabase.from('presupuestos_bitacora').select('*').order('created_at', { ascending: false })
      ]);

      let combinedObras: ObraApp[] = obrasRes.data || [];
      
      if (presRes.data) {
        const presObras: ObraApp[] = presRes.data.map((p: any) => ({
          id: p.id,
          nombre: p.obra_name,
          cliente: p.cliente || '',
          ubicacion: p.ubicacion || '',
          residente: p.residente || '',
          status: p.produccion ? 'produccion' : (p.status || 'aprobado'),
          created_at: p.created_at
        }));
        
        const existingNames = new Set(combinedObras.map(o => o.nombre));
        for (const p of presObras) {
          if (!existingNames.has(p.nombre)) {
            combinedObras.push(p);
            existingNames.add(p.nombre);
          }
        }
      }

      setObras(combinedObras);

      if (bitacorasRes.error) console.error('Error fetching bitacoras:', bitacorasRes.error);
      else setBitacoras(bitacorasRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBitacoras();
  }, []);

  const projects = Array.from(new Set([...obras.map(o => o.nombre), ...bitacoras.map(b => b.site_name)]));

  const filteredBitacoras = bitacoras.filter(b => {
    const matchesSearch = b.site_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || b.site_name === selectedProject;
    return matchesSearch && matchesProject;
  });

  const filteredObrasActivas = obras.filter(o => 
    o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && 
    o.status.toLowerCase() !== 'terminado'
  );

  const filteredObrasTerminadas = obras.filter(o => 
    o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && 
    o.status.toLowerCase() === 'terminado'
  );

  if (selectedObraDetail) {
    const detailBitacoras = bitacoras.filter(b => b.site_name === selectedObraDetail.nombre);
    
    return (
      <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-dark-2 p-6 rounded-2xl border border-dark-4 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button 
              onClick={() => setSelectedObraDetail(null)}
              className="flex items-center gap-2 text-gold hover:text-gold-dim mb-3 transition-colors text-sm font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a Obras
            </button>
            <h2 className="text-2xl font-black text-cream flex items-center gap-2">
              <HardHat className="text-blue-400 w-7 h-7" />
              {selectedObraDetail.nombre}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="text-xs font-black uppercase tracking-widest text-blue-400 border border-blue-400/30 bg-blue-400/10 px-3 py-1 rounded-full">
                {selectedObraDetail.status}
              </span>
              {selectedObraDetail.cliente && (
                <span className="text-sm text-cream-muted flex items-center gap-2">
                  <Users className="w-4 h-4 text-cream-dim" /> Cliente: {selectedObraDetail.cliente}
                </span>
              )}
              {selectedObraDetail.ubicacion && (
                <span className="text-sm text-cream-muted flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cream-dim" /> {selectedObraDetail.ubicacion}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => generateObraReport(selectedObraDetail, bitacoras, reporterName)}
              className="flex items-center gap-2 px-5 py-3 bg-dark-3 hover:bg-gold/20 border border-gold/30 hover:border-gold text-gold font-black rounded-xl transition-all shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Generar Reporte PDF
            </button>
            <button 
              onClick={openNewModal}
              className="flex items-center gap-2 px-5 py-3 bg-gold hover:bg-gold-dim text-dark-1 font-black rounded-xl transition-colors shadow-lg shadow-gold/20"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              Nuevo Registro
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {detailBitacoras.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-cream-dim bg-dark-2 rounded-2xl border border-dark-4 border-dashed">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-bold text-cream-muted">Aún no hay reportes para esta obra</p>
              <p className="text-sm mt-1">Sincroniza desde la app o crea un nuevo registro arriba.</p>
            </div>
          ) : (
            [...detailBitacoras]
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((bitacora) => {
                const isExpanded = expandedLogId === bitacora.id;
                
                return (
                  <div key={bitacora.id} className="bg-dark-2 border border-dark-4 rounded-2xl transition-all shadow-lg overflow-hidden group">
                    <div 
                      onClick={() => setExpandedLogId(isExpanded ? null : bitacora.id)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-dark-3/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-dark-3 rounded-xl border border-dark-4">
                          <Calendar className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <h3 className="font-bold text-cream text-lg">{bitacora.date}</h3>
                          <p className="text-xs text-cream-dim flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(bitacora.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="mx-2">â€¢</span>
                            <TrendingUp className="w-3 h-3 text-blue-400" /> {bitacora.physical_progress}%
                            <span className="mx-2">â€¢</span>
                            {bitacora.photo_uri ? <ImageIcon className="w-3 h-3 text-green-400" /> : <ImageIcon className="w-3 h-3 text-dark-4" />}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditModal(bitacora)} className="p-2 bg-dark-3 hover:bg-blue-500/20 hover:text-blue-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-blue-500/30">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(bitacora.id)} className="p-2 bg-dark-3 hover:bg-red-500/20 hover:text-red-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-red-500/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-cream-muted">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-5 pt-0 border-t border-dark-4/50 bg-dark-2/50 mt-2 animate-[fadeIn_0.2s_ease-out]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-xs font-black text-cream-dim uppercase tracking-widest mb-2">Descripción de Actividades</h4>
                              <p className="text-sm text-cream leading-relaxed bg-dark-3 p-4 rounded-xl border border-dark-4">
                                {bitacora.description}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 p-3 bg-dark-3 rounded-xl border border-dark-4">
                                <Cloud className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-cream-dim">Clima</p>
                                  <p className="text-sm font-bold text-cream">{bitacora.weather}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-dark-3 rounded-xl border border-dark-4">
                                <Users className="w-5 h-5 text-orange-400" />
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-cream-dim">Cuadrilla</p>
                                  <p className="text-sm font-bold text-cream">{bitacora.crew_count} Pax</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-dark-3 rounded-xl border border-dark-4">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-cream-dim">FÉ­sico</p>
                                  <p className="text-sm font-black text-cream">{bitacora.physical_progress}%</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-dark-3 rounded-xl border border-dark-4">
                                <DollarSign className="w-5 h-5 text-green-400" />
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-cream-dim">Financiero</p>
                                  <p className="text-sm font-black text-cream">${bitacora.financial_progress}</p>
                                </div>
                              </div>
                            </div>
                            
                            {bitacora.concepto && (
                              <div className="mt-4 p-4 border border-blue-500/30 bg-blue-500/10 rounded-xl">
                                <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Concepto Vinculado</p>
                                <p className="text-sm font-bold text-cream">{bitacora.concepto}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-cream-dim uppercase tracking-widest mb-2">Evidencia Fotográfica</h4>
                            <div className="rounded-xl overflow-hidden border border-dark-4 bg-dark-3 h-[250px] flex items-center justify-center relative group/img">
                              {bitacora.photo_uri ? (
                                <>
                                  <img 
                                    src={getDriveImageUrl(bitacora.photo_uri)} 
                                    alt="Evidencia" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = bitacora.photo_uri!;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <a 
                                      href={bitacora.photo_uri} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="px-4 py-2 bg-gold text-dark-1 font-bold rounded-lg flex items-center gap-2 hover:bg-gold-dim transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" /> Abrir Original
                                    </a>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-6 opacity-50">
                                  <ImageIcon className="w-12 h-12 text-cream-dim mx-auto mb-2" />
                                  <p className="text-sm text-cream-dim font-bold">Sin imagen adjunta</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {showNewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
              <div className="sticky top-0 bg-dark-2/90 backdrop-blur-md border-b border-dark-4 p-5 flex justify-between items-center z-10">
                <h3 className="text-xl font-black text-cream flex items-center gap-2">
                  {editingBitacora ? <Edit2 className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-gold" />}
                  {editingBitacora ? 'Editar Registro' : 'Nuevo Registro'}
                </h3>
                <button 
                  onClick={() => setShowNewModal(false)}
                  className="p-1 text-cream-muted hover:text-white bg-dark-3 hover:bg-dark-4 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Obra</label>
                    <input required name="site_name" type="text" readOnly value={selectedObraDetail.nombre} className="w-full bg-dark-4 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream opacity-70 cursor-not-allowed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Fecha</label>
                    <input required name="date" type="date" defaultValue={editingBitacora?.date || new Date().toISOString().split('T')[0]} className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Clima en Sitio</label>
                    <input required name="weather" type="text" defaultValue={editingBitacora?.weather || ''} placeholder="Ej. Soleado â€¢ 32Â°C" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Tamaño Cuadrilla (Pax)</label>
                    <input required name="crew_count" type="number" min="0" defaultValue={editingBitacora?.crew_count || ''} placeholder="Ej. 5" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                  </div>
                  <div className="md:col-span-2">

                    <textarea required name="description" rows={4} defaultValue={editingBitacora?.description || ''} placeholder="Describe los avances del dÉ­a..." className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors resize-none"></textarea>
                  </div>
                  
                  <div className="md:col-span-2 space-y-3">
                    <label className="block text-xs font-bold text-cream-muted uppercase">Vincular a Concepto (Opcional)</label>
                    <div className="relative">
                      <select
                        className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors appearance-none cursor-pointer"
                        value={isNewConceptoMode ? "NEW" : selectedConceptoValue}
                        onChange={(e) => {
                          if (e.target.value === "NEW") {
                            setIsNewConceptoMode(true);
                            setSelectedConceptoValue('');
                          } else {
                            setIsNewConceptoMode(false);
                            setSelectedConceptoValue(e.target.value);
                          }
                        }}
                      >
                        <option value="">-- Sin vincular --</option>
                        {conceptosObra.map((c, i) => (
                          <option key={i} value={c.description}>{c.description}</option>
                        ))}
                        <option value="NEW" className="font-bold text-gold">+ Generar uno nuevo...</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-cream-dim" />
                      </div>
                    </div>

                    {isNewConceptoMode && (
                      <input 
                        type="text"
                        value={selectedConceptoValue}
                        onChange={(e) => setSelectedConceptoValue(e.target.value)}
                        placeholder="Escribe el nombre del nuevo concepto..." 
                        className="w-full bg-dark-3 border border-gold/50 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" 
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Avance FÉ­sico (%)</label>
                    <input required name="physical_progress" type="number" step="0.1" min="0" max="100" defaultValue={editingBitacora?.physical_progress || ''} placeholder="Ej. 12.5" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Gasto Devengado ($)</label>
                    <input required name="financial_progress" type="number" step="0.01" min="0" defaultValue={editingBitacora?.financial_progress || ''} placeholder="Ej. 15000" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">
                      {editingBitacora?.photo_uri ? 'Reemplazar FotografÉ­a (Opcional)' : 'FotografÉ­a (Opcional)'}
                    </label>
                    <input name="photo_file" type="file" accept="image/*" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-sm text-cream file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-gold file:text-dark-1 hover:file:bg-gold-dim transition-colors" />
                  </div>
                </div>
                
                <div className="pt-4 mt-6 border-t border-dark-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowNewModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-cream hover:bg-dark-3 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-black text-dark-1 bg-gold hover:bg-gold-dim transition-colors disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-6 rounded-2xl border border-dark-4 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-cream flex items-center gap-2">
            <HardHat className="text-gold w-6 h-6" />
            Bitácoras de Obra
          </h2>
          <div className="flex gap-4 mt-3">
            <button 
              onClick={() => setViewMode('registros')}
              className={`text-sm font-bold pb-1 border-b-2 transition-colors ${viewMode === 'registros' ? 'border-gold text-gold' : 'border-transparent text-cream-muted hover:text-cream'}`}
            >
              Registros Diarios
            </button>
            <button 
              onClick={() => setViewMode('obras')}
              className={`text-sm font-bold pb-1 border-b-2 transition-colors ${viewMode === 'obras' ? 'border-gold text-gold' : 'border-transparent text-cream-muted hover:text-cream'}`}
            >
              Obras Activas
            </button>
            <button 
              onClick={() => setViewMode('terminadas')}
              className={`text-sm font-bold pb-1 border-b-2 transition-colors ${viewMode === 'terminadas' ? 'border-gold text-gold' : 'border-transparent text-cream-muted hover:text-cream'}`}
            >
              Obras Terminadas
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input 
              type="text" 
              placeholder="Buscar bitácora..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl py-2 pl-9 pr-4 text-sm text-cream focus:border-gold focus:outline-none transition-all"
            />
          </div>
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-dark-3 border border-dark-4 rounded-xl py-2 px-4 text-sm text-cream focus:border-gold focus:outline-none hidden md:block"
          >
            <option value="all">Todas las Obras</option>
            {projects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button 
            onClick={fetchBitacoras}
            className="p-2.5 bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-xl text-gold transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={openNewModal}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-dim text-dark-1 font-black rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-cream-dim">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-gold" />
            <p>Cargando datos sincronizados...</p>
          </div>
        ) : viewMode === 'registros' ? (
          filteredBitacoras.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-cream-dim bg-dark-2 rounded-2xl border border-dark-4 border-dashed">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-bold text-cream-muted">No se encontraron registros diarios</p>
              <p className="text-sm mt-1">Intenta buscar con otros términos o crea uno nuevo.</p>
            </div>
          ) : (
            filteredBitacoras.map((bitacora) => (
              <div 
                key={bitacora.id} 
                onClick={() => {
                  const obra = obras.find(o => o.nombre === bitacora.site_name) || { nombre: bitacora.site_name, cliente: '', ubicacion: '', status: 'produccion', created_at: '' };
                  setSelectedObraDetail(obra);
                  setExpandedLogId(bitacora.id);
                }}
                className="bg-dark-2 border border-dark-4 rounded-2xl p-5 hover:border-gold/50 transition-colors shadow-lg relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-dim to-gold opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-dark-3 rounded-lg border border-dark-4">
                      <MapPin className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-cream text-base">{bitacora.site_name}</h3>
                      <p className="text-xs text-cream-dim flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {bitacora.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(bitacora); }} className="p-2 bg-dark-3 hover:bg-blue-500/20 hover:text-blue-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-blue-500/30">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(bitacora.id); }} className="p-2 bg-dark-3 hover:bg-red-500/20 hover:text-red-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-red-500/30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-cream-muted leading-relaxed mb-4 line-clamp-3 bg-dark-3/50 p-3 rounded-xl border border-dark-4/50">
                  {bitacora.description}
                </p>

                {bitacora.photo_uri && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-dark-4 bg-dark-3 h-32 flex items-center justify-center relative group/img">
                    {bitacora.photo_uri.startsWith('http') || bitacora.photo_uri.startsWith('data:image') ? (
                      <img 
                        src={getDriveImageUrl(bitacora.photo_uri)} 
                        alt="Evidencia" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = bitacora.photo_uri!;
                        }}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-6 h-6 text-cream-dim mx-auto mb-1" />
                        <span className="text-[10px] text-cream-dim">Imagen adjunta (Drive)</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-cream-dim">Avance FÉ­sico</p>
                      <p className="text-sm font-black text-cream">{bitacora.physical_progress}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-cream-dim">Gasto Devengado</p>
                      <p className="text-sm font-black text-cream">${bitacora.financial_progress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-cream-dim">Clima</p>
                      <p className="text-sm font-bold text-cream">{bitacora.weather}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-cream-dim">Cuadrilla</p>
                      <p className="text-sm font-bold text-cream">{bitacora.crew_count} Pax</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        ) : viewMode === 'obras' ? (
          filteredObrasActivas.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-cream-dim bg-dark-2 rounded-2xl border border-dark-4 border-dashed">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-bold text-cream-muted">No se encontraron Obras Activas</p>
              <p className="text-sm mt-1">Crea una desde la App, el botón Nuevo Registro, o actÉ­vala en Presupuestos.</p>
            </div>
          ) : (
            filteredObrasActivas.map((obra) => (
              <div 
                key={obra.nombre} 
                onClick={() => setSelectedObraDetail(obra)}
                className="bg-dark-2 border border-dark-4 rounded-2xl p-5 hover:border-gold/50 hover:bg-dark-3 transition-all cursor-pointer shadow-lg relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-blue-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-dark-3 rounded-xl border border-dark-4">
                      <HardHat className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-cream text-lg">{obra.nombre}</h3>
                      <p className="text-xs font-black uppercase tracking-widest text-blue-400 mt-1">{obra.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingObraData(obra); setShowObraModal(true); }}
                      className="p-2 bg-dark-3 hover:bg-blue-500/20 hover:text-blue-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-blue-500/30"
                      title="Editar Obra"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteObra(obra); }}
                      className="p-2 bg-dark-3 hover:bg-red-500/20 hover:text-red-400 text-cream-dim rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                      title="Eliminar Obra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {obra.ubicacion && (
                  <p className="text-sm text-cream-muted flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-cream-dim shrink-0" />
                    {obra.ubicacion}
                  </p>
                )}
                {obra.cliente && (
                  <p className="text-sm text-cream-muted flex items-start gap-2 mb-2">
                    <Users className="w-4 h-4 mt-0.5 text-cream-dim shrink-0" />
                    Cliente: {obra.cliente}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-dark-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-cream-dim">Reportes registrados:</span>
                    <span className="font-bold text-cream">{bitacoras.filter(b => b.site_name === obra.nombre).length}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); generateObraReport(obra, bitacoras, reporterName); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-dim text-dark-1 font-black text-xs rounded-xl transition-all shadow-md hover:shadow-gold/30 hover:scale-[1.02] active:scale-95"
                  >
                    <FileText className="w-4 h-4 stroke-[2.5]" />
                    Generar Reporte PDF
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          filteredObrasTerminadas.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-cream-dim bg-dark-2 rounded-2xl border border-dark-4 border-dashed">
              <CheckCircle className="w-12 h-12 mb-4 opacity-50 text-green-500" />
              <p className="text-lg font-bold text-cream-muted">No hay Obras Terminadas</p>
              <p className="text-sm mt-1">Los proyectos finalizados aparecerán aquÉ­ para tu revisión.</p>
            </div>
          ) : (
            filteredObrasTerminadas.map((obra) => (
              <div 
                key={obra.nombre} 
                onClick={() => setSelectedObraDetail(obra)}
                className="bg-dark-2 border border-dark-4 rounded-2xl p-5 hover:border-green-500/50 transition-all cursor-pointer shadow-lg relative overflow-hidden group opacity-80 hover:opacity-100"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/50 to-green-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-dark-3 rounded-xl border border-dark-4">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-cream text-lg">{obra.nombre}</h3>
                      <p className="text-xs font-black uppercase tracking-widest text-green-400 mt-1">{obra.status}</p>
                    </div>
                  </div>
                </div>
                {obra.ubicacion && (
                  <p className="text-sm text-cream-muted flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-cream-dim shrink-0" />
                    {obra.ubicacion}
                  </p>
                )}
                {obra.cliente && (
                  <p className="text-sm text-cream-muted flex items-start gap-2 mb-2">
                    <Users className="w-4 h-4 mt-0.5 text-cream-dim shrink-0" />
                    Cliente: {obra.cliente}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-dark-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-cream-dim">Reportes registrados (Histórico):</span>
                    <span className="font-bold text-cream">{bitacoras.filter(b => b.site_name === obra.nombre).length}</span>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* NEW/EDIT BITACORA MODAL */}
      {showNewModal && !selectedObraDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-dark-2/90 backdrop-blur-md border-b border-dark-4 p-5 flex justify-between items-center z-10">
              <h3 className="text-xl font-black text-cream flex items-center gap-2">
                {editingBitacora ? <Edit2 className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-gold" />}
                {editingBitacora ? 'Editar Registro' : 'Nuevo Registro de Obra'}
              </h3>
              <button 
                onClick={() => setShowNewModal(false)}
                className="p-1 text-cream-muted hover:text-white bg-dark-3 hover:bg-dark-4 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Nombre de la Obra</label>
                  <input required name="site_name" type="text" defaultValue={editingBitacora?.site_name || ''} placeholder="Ej. Planta Solar Hermosillo" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Fecha</label>
                  <input required name="date" type="date" defaultValue={editingBitacora?.date || new Date().toISOString().split('T')[0]} className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Clima en Sitio</label>
                  <input required name="weather" type="text" defaultValue={editingBitacora?.weather || ''} placeholder="Ej. Soleado â€¢ 32Â°C" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Tamaño Cuadrilla (Pax)</label>
                  <input required name="crew_count" type="number" min="0" defaultValue={editingBitacora?.crew_count || ''} placeholder="Ej. 5" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Descripción de Actividades</label>
                  <textarea required name="description" rows={4} defaultValue={editingBitacora?.description || ''} placeholder="Describe los avances del dÉ­a..." className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none transition-colors resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Avance FÉ­sico (%)</label>
                  <input required name="physical_progress" type="number" step="0.1" min="0" max="100" defaultValue={editingBitacora?.physical_progress || ''} placeholder="Ej. 12.5" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Gasto Devengado ($)</label>
                  <input required name="financial_progress" type="number" step="0.01" min="0" defaultValue={editingBitacora?.financial_progress || ''} placeholder="Ej. 15000" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
                </div>
              </div>
              
              <div className="pt-4 mt-6 border-t border-dark-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-cream hover:bg-dark-3 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-black text-dark-1 bg-gold hover:bg-gold-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : (
                    'Guardar Registro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR OBRA */}
      {showObraModal && editingObraData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="bg-dark-2 border-b border-dark-4 p-5 flex justify-between items-center">
              <h3 className="text-xl font-black text-cream flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                Editar Datos de Obra
              </h3>
              <button 
                onClick={() => setShowObraModal(false)}
                className="p-1 text-cream-muted hover:text-white bg-dark-3 hover:bg-dark-4 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleObraSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Nombre de la Obra (Solo lectura)</label>
                <input type="text" readOnly value={editingObraData.nombre} className="w-full bg-dark-4 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream opacity-70 cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Cliente</label>
                <input name="cliente" type="text" defaultValue={editingObraData.cliente || ''} placeholder="Ej. Esol EnergÉ­as" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Ubicación</label>
                <input name="ubicacion" type="text" defaultValue={editingObraData.ubicacion || ''} placeholder="Ej. Av. Siempre Viva 123" className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-cream-muted mb-1.5 uppercase">Estatus de la Obra</label>
                <select name="status" defaultValue={editingObraData.status || 'produccion'} className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-gold outline-none transition-colors">
                  <option value="produccion">En Producción (Activa)</option>
                  <option value="terminado">Terminado (Finalizada)</option>
                </select>
              </div>
              
              <div className="pt-4 mt-6 border-t border-dark-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowObraModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-cream hover:bg-dark-3 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-black text-dark-1 bg-gold hover:bg-gold-dim transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
