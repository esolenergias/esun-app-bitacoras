import React, { useState, useEffect } from 'react';
import { Sun, Plus, ArrowRight, UploadCloud, FileText, ArrowLeft, Trash2, ShieldCheck, Settings, Box, RefreshCw, Layers, Zap, Battery } from 'lucide-react';
import type { SolarProject, Proposal } from './esunTypes';
import CFEUploader from './CFEUploader';
import CFEDataForm from './CFEDataForm';
import LoadProfileForm from './offgrid/LoadProfileForm';
import ProjectDashboard from './ProjectDashboard';
import { supabase } from '../../context/supabase';
import { useApp } from '../../context/AppContext';

export default function EsunPage() {
  const { currentUser } = useApp();
  const [view, setView] = useState<'welcome' | 'upload' | 'form' | 'offgrid-form' | 'project'>('welcome');
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [pendingCfeData, setPendingCfeData] = useState<any>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const stored = localStorage.getItem('esun_projects');
      if (stored) {
        setProjects(JSON.parse(stored));
      }

      const { data, error } = await supabase
        .from('esun_proyectos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading projects from Supabase:", error);
        return;
      }

      if (data && data.length > 0) {
        // Map data from supabase table to our SolarProject interface
        const supabaseProjects = data.map(row => ({
          id: row.id,
          created_at: row.created_at,
          client_name: row.client_name,
          client_email: row.client_email,
          client_phone: row.client_phone,
          client_address: row.client_address,
          client_rfc: row.client_rfc,
          city: row.city,
          project_type: row.project_type || (row.load_profile ? 'off-grid' : 'grid-tie'),
          cfe_data: row.cfe_data,
          load_profile: row.load_profile,
          proposals: row.proposals || [],
          status: row.status || 'draft'
        }));
        setProjects(supabaseProjects);
        localStorage.setItem('esun_projects', JSON.stringify(supabaseProjects));
      }
    } catch (e) {
      console.error("Error loading projects:", e);
    }
  };

  const saveProjects = (updatedProjects: SolarProject[]) => {
    localStorage.setItem('esun_projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  const createNewProject = (cfeData: any) => {
    const newProject: SolarProject = {
      id: crypto.randomUUID(), // Use UUID for Supabase
      created_at: new Date().toISOString(),
      client_name: cfeData.client_name || 'Nuevo Proyecto Solar',
      client_email: cfeData.client_email,
      client_phone: cfeData.client_phone,
      client_address: cfeData.client_address,
      client_rfc: cfeData.client_rfc,
      city: cfeData.city,
      project_type: 'grid-tie',
      cfe_data: cfeData,
      proposals: [],
      status: 'draft'
    };

    saveAndRouteProject(newProject);
  };

  const createOffGridProject = (loadData: any, contactData?: any) => {
    const newProject: SolarProject = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      client_name: contactData?.clientName || 'Nuevo Sistema Aislado',
      client_email: contactData?.email,
      client_phone: contactData?.phone,
      client_address: contactData?.address,
      client_rfc: contactData?.rfc,
      city: contactData?.city,
      project_type: 'off-grid',
      load_profile: loadData,
      proposals: [],
      status: 'draft'
    };

    saveAndRouteProject(newProject);
  };

  const syncClientToCRM = async (project: SolarProject) => {
    if (!project.client_name || project.client_name === 'Nuevo Proyecto Solar' || project.client_name === 'Nuevo Sistema Aislado' || project.client_name === 'Sin Nombre') {
      return;
    }

    try {
      const { data: existingClients } = await supabase
        .from('clientes')
        .select('id')
        .ilike('nombre_razon_social', project.client_name.trim())
        .limit(1);

      const clientPayload = {
        nombre_razon_social: project.client_name.trim(),
        email: project.client_email || null,
        telefono: project.client_phone || null,
        direccion: project.client_address || project.city || null,
        rfc: project.client_rfc || null,
        origen: project.project_type === 'off-grid' ? 'Esun Aislado' : 'Esun Solar',
        estatus: 'Prospecto',
        registered_by: currentUser?.name
      };

      if (!existingClients || existingClients.length === 0) {
        await supabase.from('clientes').insert(clientPayload);
        console.log('Cliente nuevo creado automáticamente en CRM desde Esun:', project.client_name);
      } else {
        // Update contact info if provided
        const existingId = existingClients[0].id;
        const updateData: any = {};
        if (project.client_email) updateData.email = project.client_email;
        if (project.client_phone) updateData.telefono = project.client_phone;
        if (project.client_address || project.city) updateData.direccion = project.client_address || project.city;
        if (project.client_rfc) updateData.rfc = project.client_rfc;

        if (Object.keys(updateData).length > 0) {
          await supabase.from('clientes').update(updateData).eq('id', existingId);
          console.log('Cliente actualizado en CRM desde Esun:', project.client_name);
        }
      }
    } catch (e) {
      console.error('Error sincronizando cliente con CRM:', e);
    }
  };

  const saveAndRouteProject = (newProject: SolarProject) => {
    const updated = [newProject, ...projects];
    saveProjects(updated);
    setCurrentProjectId(newProject.id);
    setView('project');

    // Save to Supabase
    supabase.from('esun_proyectos').insert({
      id: newProject.id,
      created_at: newProject.created_at,
      client_name: newProject.client_name,
      client_email: newProject.client_email,
      client_phone: newProject.client_phone,
      client_address: newProject.client_address,
      client_rfc: newProject.client_rfc,
      city: newProject.city,
      project_type: newProject.project_type,
      cfe_data: newProject.cfe_data,
      load_profile: newProject.load_profile,
      proposals: newProject.proposals,
      status: newProject.status
    }).then(({ error }) => {
      if (error) console.error("Error saving to Supabase:", error);
    });

    // Auto-create/sync client in CRM
    syncClientToCRM(newProject);
  };

  const updateProject = (updated: SolarProject) => {
    const idx = projects.findIndex(p => p.id === updated.id);
    if (idx !== -1) {
      const newProjects = [...projects];
      newProjects[idx] = updated;
      saveProjects(newProjects);

      supabase.from('esun_proyectos')
        .update({
          client_name: updated.client_name,
          client_email: updated.client_email,
          client_phone: updated.client_phone,
          client_address: updated.client_address,
          client_rfc: updated.client_rfc,
          city: updated.city,
          project_type: updated.project_type,
          cfe_data: updated.cfe_data,
          load_profile: updated.load_profile,
          proposals: updated.proposals,
          status: updated.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', updated.id)
        .then(({ error }) => {
          if (error) console.error("Error updating in Supabase:", error);
        });

      // Auto sync update in CRM
      syncClientToCRM(updated);
    }
  };

  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de que deseas eliminar este proyecto y todas sus propuestas?")) {
      const updated = projects.filter((p) => p.id !== id);
      saveProjects(updated);
      
      supabase.from('esun_proyectos').delete().eq('id', id)
        .then(({ error }) => {
          if (error) console.error("Error deleting in Supabase:", error);
        });

      if (currentProjectId === id) {
        handleReset();
      }
    }
  };

  const handleReset = () => {
    setView('welcome');
    setCurrentProjectId(null);
    setPendingCfeData(null);
  };

  const handleStartUpload = () => {
    setView('upload');
    setCurrentProjectId(null);
  };

  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full text-cream font-body h-[calc(100vh-6rem)]">
      {/* Sidebar - Proyectos */}
      <div className="w-full lg:w-72 bg-dark-1/80 backdrop-blur-xl border border-dark-4 p-5 rounded-3xl flex flex-col shrink-0 h-full overflow-hidden shadow-2xl relative z-10">
        
        {/* Glow decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none"></div>

        <div className="flex items-center justify-between pb-4 border-b border-dark-4 relative z-10">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-gold" />
            <span className="text-sm font-bold uppercase tracking-widest text-cream">Proyectos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => loadProjects()}
              className="p-1.5 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-gold rounded-xl transition-all cursor-pointer"
              title="Recargar de Supabase"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleStartUpload}
              className="p-1.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(196,152,37,0.3)] hover:scale-105"
              title="Nuevo Proyecto"
            >
              <Plus className="h-4 w-4 font-bold" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10">
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-dark-4 mx-auto mb-3" />
              <p className="text-xs text-cream-muted leading-relaxed">No hay proyectos. Sube un recibo CFE o crea un sistema aislado.</p>
            </div>
          ) : (
            projects.map((p) => {
              const isActive = p.id === currentProjectId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setCurrentProjectId(p.id);
                    setView('project');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col group relative overflow-hidden ${
                    isActive
                      ? 'bg-dark-3/80 border-gold/40 text-cream shadow-lg shadow-gold/5'
                      : 'bg-dark-3/20 border-dark-4 text-cream-muted hover:border-cream/20 hover:text-cream'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold"></div>}
                  
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold truncate pr-4 text-cream group-hover:text-gold transition-colors">{p.client_name}</p>
                    <button
                      onClick={(e) => deleteProject(e, p.id)}
                      className="p-1 bg-transparent hover:bg-red-500/10 text-dark-4 hover:text-red-400 rounded-md transition-all opacity-0 group-hover:opacity-100 absolute right-2 top-3"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-cream-muted">
                        <FileText className="w-3 h-3" /> {p.proposals.length} prop.
                      </span>
                      <span className="text-dark-4">•</span>
                      <span className="text-cream-muted">
                        {new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    {p.project_type === 'off-grid' ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold tracking-widest">
                        AISLADO
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-extrabold tracking-widest">
                        CFE
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

        {view === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out] relative z-10">
            <div className="w-24 h-24 bg-dark-2 border border-dark-4 rounded-full flex items-center justify-center shadow-2xl relative">
              <div className="absolute inset-0 bg-gold/20 rounded-full animate-ping opacity-20"></div>
              <Sun className="w-10 h-10 text-gold" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-display font-black text-cream tracking-tight">eSun <span className="text-gold">Solar</span></h1>
              <p className="text-lg text-cream-muted">Plataforma Profesional de Dimensionamiento y Cotización</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-8">
              <button onClick={handleStartUpload} className="group flex flex-col items-center p-6 bg-dark-2/50 border border-dark-4 hover:border-gold/50 rounded-3xl transition-all hover:bg-dark-3/50 hover:shadow-[0_10px_30px_rgba(196,152,37,0.1)]">
                <UploadCloud className="w-8 h-8 text-gold mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-cream">Nuevo Proyecto CFE</span>
                <span className="text-xs text-cream-muted mt-2">Interconectado con recibo CFE</span>
              </button>
              
              <button onClick={() => {
                setView('offgrid-form');
              }} className="group flex flex-col items-center p-6 bg-dark-2/50 border border-dark-4 hover:border-emerald-500/50 rounded-3xl transition-all hover:bg-dark-3/50 hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)]">
                <Battery className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-cream">Sistema Aislado</span>
                <span className="text-xs text-cream-muted mt-2">Off-Grid con baterías</span>
              </button>

              <button onClick={() => {
                setPendingCfeData({ tariff: '1', monthly_kWh: 500, bimonthly_kWh: 1000, total_mxn: 1500, tariff_rate: 1.5, is_bimonthly: true, historic_periods: [] });
                setView('form');
              }} className="group flex flex-col items-center p-6 bg-dark-2/50 border border-dark-4 hover:border-cream/30 rounded-3xl transition-all hover:bg-dark-3/50">
                <Settings className="w-8 h-8 text-cream-muted mb-3 group-hover:scale-110 transition-transform group-hover:text-cream" />
                <span className="font-bold text-cream">Ingreso Manual</span>
                <span className="text-xs text-cream-muted mt-2">Crear proyecto sin recibo PDF</span>
              </button>
            </div>
          </div>
        )}

        {view === 'upload' && (
          <div className="flex-1 animate-[fadeIn_0.3s_ease-out] relative z-10 max-w-4xl mx-auto w-full pt-10">
             <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-display font-black text-cream">Crear Nuevo Proyecto</h2>
                <p className="text-sm text-cream-muted mt-1">Sube el recibo de luz para extraer los datos con IA</p>
              </div>
              <button onClick={handleReset} className="p-2 bg-dark-3 hover:bg-dark-4 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5 text-cream-muted" />
              </button>
            </div>
            <CFEUploader
              onParsed={(data) => {
                setPendingCfeData(data);
                setView('form');
              }}
            />
          </div>
        )}

        {view === 'form' && pendingCfeData && (
          <div className="flex-1 animate-[fadeIn_0.3s_ease-out] relative z-10 max-w-4xl mx-auto w-full pt-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-display font-black text-cream">Verificar Datos Extraídos</h2>
                <p className="text-sm text-cream-muted mt-1">Revisa que la IA haya capturado correctamente los consumos</p>
              </div>
              <button onClick={handleStartUpload} className="p-2 bg-dark-3 hover:bg-dark-4 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5 text-cream-muted" />
              </button>
            </div>
            <CFEDataForm
              data={pendingCfeData}
              onSubmit={(finalData) => {
                createNewProject(finalData);
              }}
            />
          </div>
        )}

        {view === 'offgrid-form' && (
          <div className="flex-1 animate-[fadeIn_0.3s_ease-out] relative z-10 max-w-4xl mx-auto w-full pt-10 pb-20">
            <div className="flex items-center justify-between mb-8">
              <button onClick={handleReset} className="flex items-center gap-2 p-2 bg-dark-3 hover:bg-dark-4 rounded-xl transition-all text-cream-muted hover:text-cream">
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
            </div>
            <LoadProfileForm
              onSubmit={(data, contactData) => {
                createOffGridProject(data, contactData);
              }}
            />
          </div>
        )}

        {view === 'project' && currentProject && (
          <div className="flex-1 w-full animate-[fadeIn_0.3s_ease-out] relative z-10 pb-20">
            <ProjectDashboard 
              project={currentProject} 
              onUpdateProject={updateProject} 
              onBack={handleReset} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
