import React, { useState, useEffect } from 'react';
import { Bot, Search, Plus, Filter, Briefcase, Mail, Phone, ExternalLink, Activity, ArrowRight, Play, Edit2, Trash2, X, Save, Settings, GitMerge, CheckCircle, Clock, Zap, Database, Send, Target, LayoutDashboard, MessageSquare } from 'lucide-react';
import { supabase } from '../../context/supabase';

interface SdrLead {
  id: string;
  campaign_id: string;
  company_name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  estimated_cfe_cost: number | null;
  ai_generated_pitch: string | null;
  status: string;
  created_at: string;
}

export default function SdrTab() {
  const [sdrView, setSdrView] = useState<'pipeline' | 'config' | 'workflow'>('pipeline');
  
  const [leads, setLeads] = useState<SdrLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [editingLead, setEditingLead] = useState<SdrLead | null>(null);
  
  // Workflow state
  const [workflowStep, setWorkflowStep] = useState(0);

  // Config state
  const [aiConfig, setAiConfig] = useState({
    systemPrompt: 'Eres un experto SDR (Sales Development Representative) especializado en energía solar comercial e industrial. Tu objetivo es perfilar empresas con altos consumos eléctricos y generar propuestas de valor irresistibles.',
    targetIndustries: 'Manufactura, Hotelería, Agricultura, Plásticos',
    minCfeCost: 25000,
    maxLeadsPerDay: 30,
    tone: 'Profesional, analítico y persuasivo',
    autoSendEmails: false,
    dailySchedule: '09:00'
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sdr_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (e) {
      console.error('Error fetching SDR leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const runAiAgent = async () => {
    setIsSimulating(true);
    setSdrView('workflow');
    setWorkflowStep(1);

    const stages = [
      { step: 1, time: 1500 }, // Búsqueda
      { step: 2, time: 2000 }, // Extracción
      { step: 3, time: 2500 }, // Calificación
      { step: 4, time: 2000 }, // Pitch
      { step: 5, time: 1000 }  // Guardado
    ];

    let accumulatedTime = 0;
    
    stages.forEach(({ step, time }) => {
      accumulatedTime += time;
      setTimeout(() => {
        setWorkflowStep(step + 1);
        
        if (step === 5) {
          finishSimulation();
        }
      }, accumulatedTime);
    });
  };

  const finishSimulation = async () => {
    const mockLeads = [
      {
        company_name: 'Plásticos Industriales S.A. de C.V.',
        website: 'www.plasticosindustriales.com.mx',
        email: 'compras@plasticosindustriales.com.mx',
        phone: '5551234567',
        estimated_cfe_cost: 125000,
        ai_generated_pitch: 'Identificamos un área de oportunidad en su planta de inyección de plásticos. Con una tarifa GDMTH, implementar paneles solares reduciría su factura un 85%.',
        status: 'lead'
      },
      {
        company_name: 'Hotel Boutique Casa Blanca',
        website: 'www.hotelcasablanca.mx',
        email: 'gerencia@hotelcasablanca.mx',
        phone: '9987654321',
        estimated_cfe_cost: 45000,
        ai_generated_pitch: 'Hola, sus aires acondicionados deben representar un gasto enorme. Esol puede reducir su recibo a Cero.',
        status: 'lead'
      }
    ];

    try {
      await supabase.from('sdr_leads').insert(mockLeads);
      await fetchLeads();
    } catch (e) {
      console.error('Error inserting mock leads', e);
    }
    
    setTimeout(() => {
      setIsSimulating(false);
      setWorkflowStep(0);
      setSdrView('pipeline');
    }, 1500);
  };

  const updateLeadStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('sdr_leads').update({ status: newStatus }).eq('id', id);
      setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch (e) {
      console.error('Error updating status', e);
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este prospecto?')) return;
    try {
      await supabase.from('sdr_leads').delete().eq('id', id);
      setLeads(leads.filter(l => l.id !== id));
    } catch (e) {
      console.error('Error deleting lead', e);
    }
  };

  const saveEditedLead = async () => {
    if (!editingLead) return;
    try {
      const { id, company_name, email, phone, website, estimated_cfe_cost } = editingLead;
      await supabase.from('sdr_leads').update({
        company_name, email, phone, website, estimated_cfe_cost
      }).eq('id', id);
      
      setLeads(leads.map(l => l.id === id ? editingLead : l));
      setEditingLead(null);
    } catch (e) {
      console.error('Error updating lead', e);
    }
  };

  const columns = [
    { id: 'lead', title: 'Nuevos Leads (AI)', color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500' },
    { id: 'contacted', title: 'Contactado', color: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    { id: 'appointment_set', title: 'Cita Agendada', color: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500' },
    { id: 'won', title: 'Ganado (Cliente)', color: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-500' }
  ];

  return (
    <div className="p-6 w-full h-full flex flex-col bg-dark-1 text-cream overflow-hidden">
      
      {/* HEADER & NAVIGATION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-black text-cream flex items-center gap-3">
            <Bot className="w-8 h-8 text-gold" />
            AI SDR <span className="text-gold">Ventas</span>
          </h1>
          <p className="text-cream-dim text-sm font-mono mt-1">
            Agente autónomo de prospección y análisis de viabilidad.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-dark-2 p-1.5 rounded-xl border border-dark-4">
          <button 
            onClick={() => setSdrView('pipeline')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${sdrView === 'pipeline' ? 'bg-gold text-dark-1 shadow-lg' : 'text-cream-dim hover:text-cream'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Pipeline
          </button>
          <button 
            onClick={() => setSdrView('workflow')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${sdrView === 'workflow' ? 'bg-gold text-dark-1 shadow-lg' : 'text-cream-dim hover:text-cream'}`}
          >
            <GitMerge className="w-4 h-4" /> Flujo IA
          </button>
          <button 
            onClick={() => setSdrView('config')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${sdrView === 'config' ? 'bg-gold text-dark-1 shadow-lg' : 'text-cream-dim hover:text-cream'}`}
          >
            <Settings className="w-4 h-4" /> Configuración
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        
        {/* PIPELINE VIEW */}
        {sdrView === 'pipeline' && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-end mb-4">
              <button 
                onClick={runAiAgent}
                disabled={isSimulating}
                className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Iniciar Prospección AI
              </button>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-6 h-full min-w-max pb-4">
                {columns.map(column => (
                  <div key={column.id} className="w-80 flex flex-col h-full bg-dark-2 rounded-2xl border border-dark-4 overflow-hidden">
                    <div className={`p-4 border-b-2 ${column.color} ${column.bg} flex justify-between items-center`}>
                      <h3 className={`font-black uppercase tracking-wider text-xs ${column.text}`}>
                        {column.title}
                      </h3>
                      <span className="bg-dark-1 text-cream-dim px-2 py-0.5 rounded-full text-[10px] font-mono">
                        {leads.filter(l => l.status === column.id).length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {loading ? (
                        <div className="text-center p-4 text-cream-dim text-xs font-mono animate-pulse">Cargando...</div>
                      ) : (
                        leads.filter(l => l.status === column.id).map(lead => (
                          <div key={lead.id} className="bg-dark-3 border border-dark-4 p-4 rounded-xl hover:border-gold/30 transition-all group relative">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-sm text-cream leading-tight truncate pr-2" title={lead.company_name}>
                                {lead.company_name}
                              </h4>
                              <Briefcase className="w-4 h-4 text-gold shrink-0" />
                            </div>
                            
                            {lead.estimated_cfe_cost && (
                              <div className="text-xs font-mono text-cream-dim mb-3 bg-dark-1 p-2 rounded-lg border border-dark-4">
                                Est. CFE: <span className="text-red-400">${lead.estimated_cfe_cost.toLocaleString()}</span>
                              </div>
                            )}

                            <div className="space-y-1.5 mb-4">
                              {lead.email && (
                                <div className="flex items-center gap-2 text-[10px] text-cream-muted">
                                  <Mail className="w-3 h-3" /> <span className="truncate">{lead.email}</span>
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-2 text-[10px] text-cream-muted">
                                  <Phone className="w-3 h-3" /> <span>{lead.phone}</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-3 border-t border-dark-4 flex justify-between items-center">
                              <span className="text-[9px] text-cream-dim font-mono">
                                {new Date(lead.created_at).toLocaleDateString()}
                              </span>
                              
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingLead(lead)} className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-dark-1 rounded-lg transition-colors" title="Editar">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteLead(lead.id)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-dark-1 rounded-lg transition-colors" title="Eliminar">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                
                                {column.id === 'lead' && (
                                  <button onClick={() => updateLeadStatus(lead.id, 'contacted')} className="p-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-dark-1 rounded-lg transition-colors" title="Avanzar">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {column.id === 'contacted' && (
                                  <button onClick={() => updateLeadStatus(lead.id, 'appointment_set')} className="p-1.5 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-dark-1 rounded-lg transition-colors" title="Avanzar">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {column.id === 'appointment_set' && (
                                  <button onClick={() => updateLeadStatus(lead.id, 'won')} className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-dark-1 rounded-lg transition-colors" title="Avanzar">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW / FLOWCHART VIEW */}
        {sdrView === 'workflow' && (
          <div className="h-full flex flex-col items-center animate-in fade-in duration-500 overflow-hidden relative">
            
            <div className="text-center mt-12 mb-8 relative z-30">
              <h2 className="text-3xl font-display font-black text-cream mb-2">Monitor de Agente IA</h2>
              <p className="text-cream-dim text-sm font-mono">Visualización en tiempo real del proceso.</p>
            </div>

            {/* VISUALIZATION CONTAINER */}
            <div className="w-full max-w-5xl h-[28rem] relative mt-4">
              
              {/* THE STREET / HALLWAY */}
              <div className="absolute top-1/2 -translate-y-1/2 left-[2%] right-[2%] h-12 bg-dark-2 rounded-xl border border-dark-4 flex items-center justify-center shadow-inner overflow-hidden z-10">
                <div className="w-full h-1 border-t-[3px] border-dashed border-gold/30"></div>
                {/* Street details */}
                <div className="absolute left-0 bottom-0 w-full h-1 bg-dark-4/50"></div>
              </div>

              {/* PIXEL AGENT CHARACTER (ABOVE THE STREET) */}
              <div 
                className="absolute transition-all duration-700 ease-in-out z-30 flex flex-col items-center justify-end pointer-events-none"
                style={{ 
                  bottom: 'calc(50% + 24px)', // Standing exactly on the street
                  left: workflowStep === 0 ? '10%' : `calc(${10 + ((workflowStep - 1) * 20)}%)`,
                  transform: 'translateX(-50%)',
                  opacity: workflowStep === 0 ? 0.3 : 1,
                  scale: workflowStep === 0 ? '0.8' : '1'
                }}
              >
                {/* Connection shadow down to street */}
                <div className="absolute -bottom-6 w-12 h-4 bg-dark-1/80 blur-sm rounded-[100%]"></div>
                <div className="absolute -bottom-6 w-8 h-3 bg-gold/20 blur-sm rounded-[100%] animate-pulse"></div>

                <div className={`relative ${workflowStep > 0 && workflowStep < 5 ? 'animate-bounce' : ''}`}>
                  <svg viewBox="0 0 100 120" className="w-16 h-20 drop-shadow-[0_10px_15px_rgba(212,175,55,0.4)]">
                    {/* Arms (Back) */}
                    <rect x="0" y="55" width="20" height="8" fill="currentColor" className="text-cream-dim" />
                    
                    {/* Legs */}
                    <rect x="35" y="80" width="8" height="20" fill="currentColor" className="text-cream-dim" />
                    <rect x="55" y="80" width="8" height="20" fill="currentColor" className="text-cream-dim" />
                    
                    {/* Feet */}
                    <rect x="25" y="95" width="18" height="8" fill="#141410" />
                    <rect x="55" y="95" width="18" height="8" fill="#141410" />
                    
                    {/* Body / Screen */}
                    <rect x="20" y="30" width="60" height="55" rx="8" fill="#C49825" />
                    <rect x="25" y="35" width="50" height="40" rx="4" fill="#141410" />
                    
                    {/* Animated Face inside screen */}
                    {workflowStep > 0 && workflowStep < 5 ? (
                      <g className="animate-pulse">
                        <rect x="35" y="45" width="8" height="8" fill="#C49825" />
                        <rect x="55" y="45" width="8" height="8" fill="#C49825" />
                        <rect x="42" y="60" width="16" height="4" fill="#C49825" />
                      </g>
                    ) : (
                      <g>
                        <rect x="35" y="48" width="8" height="4" fill="#C49825" />
                        <rect x="55" y="48" width="8" height="4" fill="#C49825" />
                        <path d="M40,60 Q50,65 60,60" stroke="#C49825" strokeWidth="3" fill="none" />
                      </g>
                    )}
                    
                    {/* Arms (Front working) */}
                    {workflowStep > 0 && workflowStep < 5 ? (
                      <g className="animate-[pulse_0.2s_ease-in-out_infinite]">
                        <rect x="65" y="60" width="30" height="8" fill="currentColor" className="text-cream" />
                        <rect x="85" y="68" width="8" height="12" fill="currentColor" className="text-cream" />
                      </g>
                    ) : (
                      <g>
                        <rect x="75" y="55" width="8" height="25" fill="currentColor" className="text-cream" />
                      </g>
                    )}
                    
                    {/* Antena */}
                    <rect x="48" y="10" width="4" height="20" fill="#C49825" />
                    <circle cx="50" cy="10" r="4" fill="#C49825" className={workflowStep > 0 ? 'animate-ping' : ''} />
                  </svg>
                </div>
              </div>

              {/* MODULE ICONS (BELOW THE STREET) */}
              {[
                { step: 1, title: 'Scraping', icon: Search, detail: 'Buscando empresas' },
                { step: 2, title: 'Datos', icon: Database, detail: 'Extrayendo' },
                { step: 3, title: 'Calificación', icon: Target, detail: 'Tarifa CFE' },
                { step: 4, title: 'Generación', icon: Zap, detail: 'Pitch IA' },
                { step: 5, title: 'Pipeline', icon: CheckCircle, detail: 'CRM' }
              ].map((s, idx) => {
                const isActive = workflowStep === s.step;
                const isPast = workflowStep > s.step;
                const Icon = s.icon;
                
                return (
                  <div 
                    key={s.step} 
                    className="absolute flex flex-col items-center w-28 transition-all" 
                    style={{ 
                      top: 'calc(50% + 40px)', // Placed directly below the street
                      left: `${10 + (idx * 20)}%`, 
                      transform: 'translateX(-50%)' 
                    }}
                  >
                    
                    {/* Connecting line to street */}
                    <div className={`w-1 h-12 ${isActive || isPast ? 'bg-gold' : 'bg-dark-4'} transition-colors duration-700 absolute -top-12 z-0`}></div>

                    {/* Icon Block */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative transition-all duration-500 z-20 shadow-lg
                      ${isActive ? 'bg-gold border-2 border-gold scale-110 shadow-[0_0_25px_rgba(212,175,55,0.4)]' : isPast ? 'bg-dark-2 border-2 border-gold' : 'bg-dark-2 border border-dark-4'}`}
                    >
                      <Icon className={`w-7 h-7 ${isActive ? 'text-dark-1 animate-pulse' : isPast ? 'text-gold' : 'text-dark-4'}`} />
                      
                      {/* Activity pings */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 flex space-x-1">
                          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="mt-4 text-center w-full">
                      <h3 className={`font-black text-xs uppercase tracking-wide leading-tight ${isActive || isPast ? 'text-gold' : 'text-cream-dim'}`}>
                        {s.title}
                      </h3>
                      <p className={`text-[9px] font-mono mt-1 ${isActive ? 'text-cream font-bold' : 'text-cream-muted opacity-75'}`}>
                        {s.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTION BUTTON */}
            <div className="mt-8 text-center relative z-30">
              {workflowStep === 0 ? (
                <button 
                  onClick={runAiAgent}
                  className="px-8 py-4 bg-gold hover:bg-gold-light text-dark-1 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center gap-3 mx-auto transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:scale-105"
                >
                  <Play className="w-5 h-5" /> Iniciar Ciclo de Prospección
                </button>
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-dark-3 border border-dark-4 rounded-full text-gold font-mono text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <Activity className="w-4 h-4 animate-spin" />
                  El agente está en movimiento...
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONFIGURATION VIEW */}
        {sdrView === 'config' && (
          <div className="h-full overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto py-6">
              <div className="bg-dark-2 border border-dark-4 rounded-3xl overflow-hidden shadow-2xl">
                
                <div className="p-8 border-b border-dark-4 bg-dark-3/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-display font-black text-cream">Configuración del Agente</h2>
                    <p className="text-cream-dim text-xs font-mono mt-1">Ajusta los parámetros y directivas del modelo LLM SDR.</p>
                  </div>
                  <button className="px-6 py-2.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg">
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Prompt Directive */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-cream uppercase tracking-wider">
                      <Bot className="w-4 h-4 text-gold" /> Prompt de Sistema (Directiva Principal)
                    </label>
                    <textarea 
                      value={aiConfig.systemPrompt}
                      onChange={(e) => setAiConfig({...aiConfig, systemPrompt: e.target.value})}
                      className="w-full h-32 bg-dark-1 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none resize-none font-mono leading-relaxed"
                    />
                    <p className="text-[10px] text-cream-dim">Este es el contexto principal que el modelo usará para interpretar su rol y generar los pitches.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Target */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-cream uppercase tracking-wider">
                        <Target className="w-4 h-4 text-gold" /> Industrias Objetivo
                      </label>
                      <input 
                        type="text" 
                        value={aiConfig.targetIndustries}
                        onChange={(e) => setAiConfig({...aiConfig, targetIndustries: e.target.value})}
                        className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none"
                      />
                    </div>

                    {/* Tone */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-cream uppercase tracking-wider">
                        <MessageSquare className="w-4 h-4 text-gold" /> Tono de Comunicación
                      </label>
                      <select 
                        value={aiConfig.tone}
                        onChange={(e) => setAiConfig({...aiConfig, tone: e.target.value})}
                        className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none appearance-none"
                      >
                        <option>Profesional, analítico y persuasivo</option>
                        <option>Directo, numérico y agresivo (Ventas duras)</option>
                        <option>Consultivo, empático y educativo</option>
                      </select>
                    </div>

                    {/* CFE Cost */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-cream uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-gold" /> Consumo Mínimo CFE (Filtro)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-dim">$</span>
                        <input 
                          type="number" 
                          value={aiConfig.minCfeCost}
                          onChange={(e) => setAiConfig({...aiConfig, minCfeCost: parseInt(e.target.value) || 0})}
                          className="w-full bg-dark-1 border border-dark-4 rounded-xl pl-8 pr-4 py-3 text-sm text-cream focus:border-gold outline-none"
                        />
                      </div>
                    </div>

                    {/* Leads per day */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-cream uppercase tracking-wider">
                        <Filter className="w-4 h-4 text-gold" /> Leads Máximos por Ciclo
                      </label>
                      <input 
                        type="number" 
                        value={aiConfig.maxLeadsPerDay}
                        onChange={(e) => setAiConfig({...aiConfig, maxLeadsPerDay: parseInt(e.target.value) || 0})}
                        className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-3 text-sm text-cream focus:border-gold outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-dark-4 pt-8">
                    <h3 className="text-sm font-bold text-cream mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold" /> Automatización y Horarios
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 bg-dark-1 border border-dark-4 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-gold/50 transition-colors" onClick={() => setAiConfig({...aiConfig, autoSendEmails: !aiConfig.autoSendEmails})}>
                        <div>
                          <div className="text-sm font-bold text-cream flex items-center gap-2">
                            <Send className="w-4 h-4 text-gold" /> Auto-enviar Correos
                          </div>
                          <div className="text-xs text-cream-dim font-mono mt-1">
                            El agente envía el pitch automáticamente al generar el lead.
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-colors relative ${aiConfig.autoSendEmails ? 'bg-gold' : 'bg-dark-3'}`}>
                          <div className={`absolute top-1 bottom-1 w-4 rounded-full bg-white transition-all ${aiConfig.autoSendEmails ? 'left-7' : 'left-1'}`}></div>
                        </div>
                      </div>

                      <div className="flex-1 bg-dark-1 border border-dark-4 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-cream flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gold" /> Horario de Ejecución
                          </div>
                          <div className="text-xs text-cream-dim font-mono mt-1">
                            Cron programado del scraper.
                          </div>
                        </div>
                        <input 
                          type="time" 
                          value={aiConfig.dailySchedule}
                          onChange={(e) => setAiConfig({...aiConfig, dailySchedule: e.target.value})}
                          className="bg-dark-3 border border-dark-4 rounded-lg px-3 py-1.5 text-sm text-cream outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-dark-4 flex justify-between items-center bg-dark-3">
              <h3 className="font-bold text-cream flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-gold" />
                Editar Prospecto
              </h3>
              <button onClick={() => setEditingLead(null)} className="text-cream-dim hover:text-cream transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-cream-dim uppercase mb-1">Empresa</label>
                <input 
                  type="text" 
                  value={editingLead.company_name}
                  onChange={(e) => setEditingLead({...editingLead, company_name: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono text-cream-dim uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  value={editingLead.email || ''}
                  onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono text-cream-dim uppercase mb-1">Teléfono</label>
                <input 
                  type="text" 
                  value={editingLead.phone || ''}
                  onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono text-cream-dim uppercase mb-1">Sitio Web</label>
                <input 
                  type="text" 
                  value={editingLead.website || ''}
                  onChange={(e) => setEditingLead({...editingLead, website: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono text-cream-dim uppercase mb-1">Consumo CFE Estimado ($)</label>
                <input 
                  type="number" 
                  value={editingLead.estimated_cfe_cost || ''}
                  onChange={(e) => setEditingLead({...editingLead, estimated_cfe_cost: parseFloat(e.target.value) || 0})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-dark-4 bg-dark-3 flex justify-end gap-3">
              <button onClick={() => setEditingLead(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-cream-dim hover:text-cream transition-colors">
                Cancelar
              </button>
              <button onClick={saveEditedLead} className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 rounded-lg text-sm font-black flex items-center gap-2 transition-colors">
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
