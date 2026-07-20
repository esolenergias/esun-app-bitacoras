import CmsTab from './portal/tabs/CmsTab';
import InventoryTab from './portal/tabs/InventoryTab';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../context/supabase';
import type { UserRole, B2BProduct } from '../context/AppContext';
import { 
  X, Shield, Globe, Cpu, LogOut, 
  TrendingUp, Layers, Bot, Sparkles, Plus, FileText, BarChart, 
  RefreshCw, Sliders, Edit, Save, 
  ArrowRight, Sun, Moon, Zap, Leaf, 
  DollarSign, MessageSquare, Package, Truck, Users, Activity,
  Settings, Trash2
} from 'lucide-react';
import InsumosTab from './cotizador/InsumosTab';
import MatricesTab from './cotizador/MatricesTab';
import PresupuestosTab from './cotizador/PresupuestosTab';
import GruposTab from './cotizador/GruposTab';
import EsunPage from './esun/EsunPage';
import BitacorasApp from './BitacorasApp';

const CATEGORIES = [
  'Paneles Solares',
  'Inversores',
  'Microinversores',
  'Estructuras',
  'Cable Solar',
  'Baterías'
];

export function Portal() {
  const {
    currentUser,
    content,
    updateContent,
    updateHeroText,
    updatePromoBanner,
    addPromo,
    togglePromo,
    agents,
    updateAgent,
    globalGeminiApiKey,
    updateGeminiApiKey,
    seoData,
    updateSEO,
    theme,
    toggleTheme,
    closePortal,
    users,
    updateUserRole,
    updateCurrentUser,
    logout,
    products,
    addProduct,
    deleteProduct,
    updateProduct
  } = useApp();

  // Navigation tab based on user roles
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [cotizadorSubTab, setCotizadorSubTab] = useState<'presupuestos' | 'matrices' | 'insumos' | 'grupos'>('presupuestos');

  // Sync activeTab default when logging in & enforce role guards
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'user') {
        // Clients can only access dashboard, projects, cfe, and chat
        if (activeTab !== 'dashboard' && activeTab !== 'projects' && activeTab !== 'cfe' && activeTab !== 'chat') {
          setActiveTab('dashboard');
        }
      } else if (currentUser.role === 'admin') {
        // Admins cannot access master-only views (dashboard, pro, cms, agents, seo, roles)
        if (activeTab === 'dashboard' || activeTab === 'cms' || activeTab === 'agents' || activeTab === 'seo' || activeTab === 'roles') {
          setActiveTab('leads');
        }
      }
    }
  }, [currentUser, activeTab]);

  // Collapsed sidebar state (for mobile responsiveness)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileAvatar, setEditProfileAvatar] = useState('');

  // Load esun quotes to feed general dashboard statistics
  const [esunQuotes, setEsunQuotes] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('esun_quotes');
      if (stored) {
        setEsunQuotes(JSON.parse(stored));
      } else {
        setEsunQuotes([]);
      }
    } catch (e) {
      console.error("Error loading esun quotes for dashboard stats:", e);
    }
  }, [activeTab]);



  // B2B Products Management states

  // CMS state values

  // AI Agent test state
  const [selectedAgentId, setSelectedAgentId] = useState('agent-1');

  // SEO state values
  const [seoTitle, setSeoTitle] = useState(seoData.title);
  const [seoDesc, setSeoDesc] = useState(seoData.metaDescription);
  const [seoKeywords, setSeoKeywords] = useState(seoData.keywords);
  const [seoGA, setSeoGA] = useState(seoData.googleAnalyticsId);
  const [seoRobots, setSeoRobots] = useState(seoData.robotsTxt);
  const [runningSeoAudit, setRunningSeoAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);

  // Client Dashboard Interactive Chat State
  const [clientChatMessages, setClientChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    { sender: 'agent', text: '¡Hola! Soy Carlos, tu asesor solar. ¿En qué puedo ayudarte hoy?', time: '10:00 AM' }
  ]);
  const [clientChatMessage, setClientChatMessage] = useState('');

  // Admin Lead Inspection Modal State
  const [inspectingLead, setInspectingLead] = useState<any>(null);


  // CFE Manager Configuration State (Google AI Studio)
  const [cfeApiKey, setCfeApiKey] = useState(() => localStorage.getItem('cfe_gemini_api_key') || '');
  const [cfeAppUrl, setCfeAppUrl] = useState(() => localStorage.getItem('cfe_ai_studio_url') || '/esol-cfe-manager/index.html');
  const [cfeSelectedModel, setCfeSelectedModel] = useState(() => localStorage.getItem('cfe_gemini_model') || 'gemini-2.5-flash');
  const [cfeSystemPrompt, setCfeSystemPrompt] = useState(() => localStorage.getItem('cfe_system_prompt') || 'Eres Esol CFE Manager. Analiza la factura/recibo de luz de CFE provista y extrae la información en formato JSON. El JSON debe tener exactamente estos campos y ningún texto adicional:\n{\n  "cliente": "nombre del cliente",\n  "servicio": "número de servicio (12 dígitos)",\n  "tarifa": "tarifa (ej. GDMTO, PDBT, DAC, 01)",\n  "periodo": "periodo de facturación (ej. Ene-Feb 2026)",\n  "kwh": consumo en kWh (número),\n  "importe": importe facturado en MXN (número)\n}');

  useEffect(() => {
    setCfeApiKey(globalGeminiApiKey);
  }, [globalGeminiApiKey]);

  // Leads State - Loaded from LocalStorage or Supabase
  const [leads, setLeads] = useState<any[]>(() => {
    const saved = localStorage.getItem('esol_leads');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Carlos Delgado', email: 'cliente.esol@gmail.com', tariff: 'PDBT', date: '08/06/2026', status: 'Activo', consumption: '1,420 kWh bimestrales', panelReq: '14 módulos 550W' },
      { id: '2', name: 'Alfonso Gómez', email: 'alfonso@gmail.com', tariff: 'GDMTO', date: '07/06/2026', status: 'Pendiente 3D', consumption: '12,450 kWh bimestrales', panelReq: '118 módulos 550W' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('esol_leads', JSON.stringify(leads));
  }, [leads]);

  // Sync leads from localStorage storage events (triggered by chatbot on the main site)
  useEffect(() => {
    const syncLeads = () => {
      const saved = localStorage.getItem('esol_leads');
      if (saved) {
        try {
          setLeads(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing storage leads in Portal:", e);
        }
      }
    };
    window.addEventListener('storage', syncLeads);
    return () => window.removeEventListener('storage', syncLeads);
  }, []);

  // Load leads from Supabase if active
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error) {
          const mapped = data.map((l: any) => ({
            id: l.id,
            name: l.name,
            email: l.email,
            tariff: l.tariff || 'PDBT',
            date: new Date(l.created_at).toLocaleDateString('es-MX'),
            status: l.status || 'Pendiente 3D',
            consumption: l.consumption || '0 kWh bimestrales',
            panelReq: l.panel_req || '0 paneles'
          }));
          
          // Merge with local storage leads (preserving chatbot leads)
          const saved = localStorage.getItem('esol_leads');
          const localLeads = saved ? JSON.parse(saved) : [];
          const merged = [...mapped];
          localLeads.forEach((local: any) => {
            if (!merged.some((m: any) => m.id === local.id)) {
              merged.push(local);
            }
          });
          
          setLeads(merged);
        }
      } catch (err) {
        console.warn('Supabase leads fetch failed, using local fallback:', err);
      }
    };
    fetchLeads();
  }, []);




  // Sync SEO state values
  useEffect(() => {
    setSeoTitle(seoData.title);
    setSeoDesc(seoData.metaDescription);
    setSeoKeywords(seoData.keywords);
    setSeoGA(seoData.googleAnalyticsId);
    setSeoRobots(seoData.robotsTxt);
  }, [seoData]);



  // Handle CMS Changes save

  // AI Agent update
  const handleUpdateAgentPrompt = (id: string, prompt: string, temp: number) => {
    updateAgent(id, { systemPrompt: prompt, temperature: temp });
    alert('Agente actualizado correctamente.');
  };



  // Save SEO changes
  const handleSaveSEO = () => {
    updateSEO({
      title: seoTitle,
      metaDescription: seoDesc,
      keywords: seoKeywords,
      googleAnalyticsId: seoGA,
      robotsTxt: seoRobots,
    });
    alert('Configuración SEO actualizada correctamente.');
  };

  // Run SEO audit simulation
  const handleRunSEOAudit = () => {
    setRunningSeoAudit(true);
    setAuditResult(null);
    setTimeout(() => {
      setRunningSeoAudit(false);
      const score = Math.floor(Math.random() * 10) + 90; // 90-99
      updateSEO({
        pageSpeedScore: {
          performance: score - 2,
          seo: 100,
          accessibility: 95,
          bestPractices: 98
        }
      });
      setAuditResult(`Auditoría SEO Finalizada:
- Sitemap XML: Activo y legible en robots.txt (100%)
- Meta descripción: Longitud óptima (${seoDesc.length} caracteres) (100%)
- Títulos H1 y jerarquía: Cumple especificación (100%)
- Velocidad de carga (Lighthouse): Rendimiento excelente (${score - 2} pts)
- Accesibilidad: Etiquetas alt de imágenes validadas (95%)`);
    }, 2000);
  };

  // Send message inside Client chat assistant
  const handleSendClientChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientChatMessage.trim()) return;

    const userText = clientChatMessage;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    setClientChatMessages(prev => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setClientChatMessage('');

    // Simulate Agent response
    setTimeout(() => {
      let reply = '';
      if (userText.toLowerCase().includes('precio') || userText.toLowerCase().includes('costo') || userText.toLowerCase().includes('cotizar')) {
        reply = 'Con gusto te ayudo a estimar. Tu tarifa actual es PDBT. Para darte una propuesta exacta, puedes subir tu recibo de luz aquí en la sección "Recibo CFE" o proporcionar tu consumo bimestral promedio.';
      } else if (userText.toLowerCase().includes('panel') || userText.toLowerCase().includes('marca') || userText.toLowerCase().includes('longi')) {
        reply = 'En eSol somos distribuidores oficiales de LONGi Solar y Jinko Solar de 550W con tecnología Monocristalina PERC, ofreciendo 12 años de garantía contra defectos y 25 años de rendimiento lineal.';
      } else {
        reply = 'Recibido. He registrado tu mensaje en la bitácora del proyecto. Un asesor de ingeniería revisará los detalles a la brevedad.';
      }
      setClientChatMessages(prev => [...prev, { sender: 'agent', text: reply, time: timeStr }]);
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen bg-dark-1 text-cream flex flex-col font-body transition-colors duration-300">
      
      {/* 1. TOP BRAND / TOPBAR NAVBAR */}
      <div className="w-full flex items-center justify-between px-6 py-4 border-b border-dark-4 bg-dark-2 shadow-sm z-30 select-none">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-gold/10 text-gold rounded-xl border border-gold/20 flex items-center justify-center">
            <Shield className="w-5 h-5 stroke-[1.8]" />
          </span>
          <div>
            <h2 className="font-display font-black text-sm lg:text-base text-cream tracking-widest leading-none block">
              ESOL PORTAL PROFESIONAL
            </h2>
            {currentUser ? (
              <span className="text-[9px] font-mono uppercase tracking-widest text-gold mt-1 block font-bold">
                Sesión: {currentUser.role === 'master' ? 'Master Director' : currentUser.role === 'admin' ? 'Admin Operador' : 'Cliente Inversor'} &mdash; {currentUser.name}
              </span>
            ) : (
              <span className="text-[9px] font-mono uppercase tracking-widest text-cream-dim mt-1 block">
                Acceso restringido a personal e inversores
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-dark-4 bg-dark-1 hover:bg-dark-3 text-gold hover:text-gold-light transition-all cursor-pointer flex items-center justify-center"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          
          {/* Back to main website / Close portal */}
          <button 
            onClick={closePortal} 
            className="px-4 py-2.5 border border-dark-4 bg-dark-1 hover:bg-dark-3 rounded-xl text-xs font-black uppercase tracking-wider text-cream-muted hover:text-gold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span>Volver a eSol</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full relative">
        
        {/* ==================================================== */}
        {/* REDIRECTING / LOADING STATE */}
        {/* ==================================================== */}
        {!currentUser ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-dark-1 select-none py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gold" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-cream-muted mt-3 font-bold">Redirigiendo al portal...</p>
          </div>
        ) : (
          
          // ====================================================
          // AUTHENTICATED STATE: Dashboard full page application
          // ====================================================
          <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full">
            
            {/* 3. SIDEBAR NAVIGATION */}
            <div className={`w-full md:w-64 bg-dark-2 border-b md:border-b-0 md:border-r border-dark-4 p-4 flex flex-col justify-between select-none transition-all duration-300 ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
              <div className="space-y-4">
                {/* Profile Card */}
                <div 
                  onClick={() => {
                    setEditProfileName(currentUser.name);
                    setEditProfileAvatar(currentUser.avatar);
                    setIsProfileModalOpen(true);
                  }}
                  className={`p-3 bg-dark-1/80 border border-dark-4 rounded-2xl flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-dark-3 hover:border-gold/50 transition-colors ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                  title="Editar Perfil"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/35 text-gold flex items-center justify-center font-display text-lg flex-shrink-0">
                    {currentUser.avatar && currentUser.avatar.startsWith('http') ? (
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span>{currentUser.avatar || '⚡'}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-black text-cream truncate">{currentUser.name}</p>
                        <Edit className="w-3 h-3 text-gold/50" />
                      </div>
                      <p className="text-[9.5px] text-cream-dim truncate font-mono">{currentUser.email}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className={`text-[9px] font-black text-cream-dim uppercase tracking-widest pl-2 block ${sidebarCollapsed ? 'text-center pl-0' : ''}`}>
                    {sidebarCollapsed ? '•' : 'Navegación'}
                  </span>

                  {/* ------------------------- */}
                  {/* CLIENT ROLE SIDEBAR TABS  */}
                  {/* ------------------------- */}
                  {currentUser.role === 'user' && (
                    <>
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'dashboard'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Zap className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Monitoreo</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('projects')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'projects'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Layers className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Mis Proyectos 3D</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('cfe')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'cfe'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <TrendingUp className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Recibos CFE</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'chat'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <MessageSquare className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Asistente IA</span>}
                      </button>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* ADMIN ROLE SIDEBAR TABS  */}
                  {/* ------------------------ */}
                  {currentUser.role === 'admin' && (
                    <>
                      <button
                        onClick={() => setActiveTab('leads')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'leads'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center relative' : ''}`}
                      >
                        <Users className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Pipeline Leads</span>}
                        {leads.filter((l: any) => l.status === 'Pendiente de Envío').length > 0 && (
                          sidebarCollapsed ? (
                            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
                          ) : (
                            <span className="ml-auto bg-red-500 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-md shadow-red-500/20">
                              {leads.filter((l: any) => l.status === 'Pendiente de Envío').length}
                            </span>
                          )
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab('inventory')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'inventory'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Package className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Productos B2B</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('logistics')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'logistics'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Truck className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Logística envíos</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('cfemanager')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'cfemanager'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <FileText className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>CFE Manager</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('esun')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'esun'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Sun className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Esun Solar</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('cotizador')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'cotizador'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Sparkles className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Presupuestos esol</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('bitacoras')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'bitacoras'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Layers className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Bitácoras (App)</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('cfeconfig')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'cfeconfig'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Settings className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Configuración</span>}
                      </button>
                    </>
                  )}

                  {/* ------------------------- */}
                  {/* MASTER ROLE SIDEBAR TABS  */}
                  {/* ------------------------- */}
                  {currentUser.role === 'master' && (
                    <>
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'dashboard'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <BarChart className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Dashboard General</span>}
                      </button>

                      <button
                        onClick={() => setActiveTab('cms')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'cms'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Edit className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Contenido CMS</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('modules')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'modules'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Layers className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Módulos</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('agents')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'agents'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Bot className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Motores Chat IA</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('seo')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'seo'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Globe className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Lighthouse & SEO</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('roles')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'roles'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Sliders className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Roles y Permisos</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('inventory')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'inventory'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Package className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Productos B2B</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('cfemanager')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'cfemanager'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <FileText className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>CFE Manager</span>}
                      </button>
                       <button
                        onClick={() => setActiveTab('esun')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'esun'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Sun className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Esun Solar</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('cotizador')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'cotizador'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Sparkles className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Presupuestos esol</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('bitacoras')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'bitacoras'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Layers className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Bitácoras (App)</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('cfeconfig')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeTab === 'cfeconfig'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <Settings className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Configuración</span>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Sidebar bottom actions */}
              <div className="space-y-2 mt-8">
                {/* Collapse button for desktop */}
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden md:flex w-full items-center justify-center py-2 border border-dark-4 hover:border-gold/30 bg-dark-1 hover:bg-dark-3 text-cream-dim hover:text-gold rounded-xl transition-all cursor-pointer text-[9px] font-black uppercase tracking-wider"
                >
                  {sidebarCollapsed ? '▶' : '◀ Colapsar'}
                </button>
                
                <button
                  onClick={logout}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 hover:bg-red-500/5 transition-all border border-red-500/10 cursor-pointer ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                  {!sidebarCollapsed && <span>Cerrar Sesión</span>}
                </button>
              </div>
            </div>

            {/* 4. MAIN CONTENT WORKSPACE PANE */}
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-dark-1 relative">
              
              {/* ==================================================== */}
              {/* CLIENT WORKSPACE SCREENS */}
              {/* ==================================================== */}
              {currentUser.role === 'user' && (
                <div className="space-y-6">
                  
                  {/* CLIENT TAB 1: MONITOREO */}
                  {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                      <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                        <div>
                          <h3 className="font-display font-black text-xl text-cream">
                            MONITOREO DE PLANTA SOLAR
                          </h3>
                          <p className="text-xs text-cream-muted mt-1 leading-relaxed">
                            Resumen de generación fotovoltaica activa y beneficios ambientales de tu contrato residencial eSol.
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/25 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <Activity className="w-3.5 h-3.5" />
                          Sistema en Línea
                        </span>
                      </div>

                      {/* Client Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Generation widget */}
                        <div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm hover:border-gold/35 transition-colors">
                          <div className="absolute top-4 right-4 text-gold/25">
                            <Zap className="w-10 h-10 stroke-[1.2]" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Generación Hoy</span>
                          <h4 className="text-2xl font-black text-gold mt-2 font-display">42.8 kWh</h4>
                          <div className="mt-4 flex items-center gap-2">
                            {/* Simple animated energy meter SVG */}
                            <svg className="w-full h-2 rounded bg-dark-4 overflow-hidden" viewBox="0 0 100 8">
                              <rect className="fill-gold animate-[shimmer_2s_infinite]" x="0" y="0" width="70" height="8" />
                            </svg>
                          </div>
                          <span className="text-[9px] text-cream-muted mt-1.5 block">Potencia pico: 5.2 kW a la 1:30 PM</span>
                        </div>

                        {/* Savings widget */}
                        <div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm hover:border-gold/35 transition-colors">
                          <div className="absolute top-4 right-4 text-gold/25">
                            <DollarSign className="w-10 h-10 stroke-[1.2]" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Ahorro Estimado</span>
                          <h4 className="text-2xl font-black text-gold mt-2 font-display">$18,450 MXN</h4>
                          <span className="text-[9px] text-green-400 font-bold block mt-4">✓ 94.2% Reducción tarifa CFE DAC</span>
                          <span className="text-[9px] text-cream-muted mt-1 block">Retorno de inversión: 2.8 años restantes</span>
                        </div>

                        {/* Environmental widget */}
                        <div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm hover:border-gold/35 transition-colors">
                          <div className="absolute top-4 right-4 text-gold/25">
                            <Leaf className="w-10 h-10 stroke-[1.2]" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Beneficio Co2</span>
                          <h4 className="text-2xl font-black text-gold mt-2 font-display">1.2 Toneladas</h4>
                          <span className="text-[9px] text-green-400 font-bold block mt-4">🌲 Equivalente a 18 árboles plantados</span>
                          <span className="text-[9px] text-cream-muted mt-1 block">Mitigación de carbono anual</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CLIENT TAB 2: PROJECTS */}
                  {activeTab === 'projects' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2">
                        MIS ANTEPROYECTOS 3D
                      </h3>

                      <div className="grid lg:grid-cols-12 gap-8">
                        {/* Status Timeline */}
                        <div className="lg:col-span-5 border border-dark-4 bg-dark-2/50 p-6 rounded-2xl space-y-6">
                          <h4 className="text-xs font-black uppercase tracking-widest text-gold">Estado del Diseño Aéreo</h4>
                          
                          <div className="space-y-6 relative pl-4 border-l border-dark-4">
                            {/* Step 1 */}
                            <div className="relative">
                              <span className="absolute -left-[22px] top-0.5 w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-500/10" />
                              <h5 className="text-xs font-black text-cream uppercase">1. Fotografía Dron</h5>
                              <p className="text-[10.5px] text-cream-muted mt-0.5 font-body">Captura y mapeo de alta resolución (100% completado).</p>
                            </div>
                            {/* Step 2 */}
                            <div className="relative">
                              <span className="absolute -left-[22px] top-0.5 w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-500/10" />
                              <h5 className="text-xs font-black text-cream uppercase">2. Análisis de Sombras</h5>
                              <p className="text-[10.5px] text-cream-muted mt-0.5 font-body">Modelado digital de pretiles y árboles (100% completado).</p>
                            </div>
                            {/* Step 3 */}
                            <div className="relative">
                              <span className="absolute -left-[22px] top-0.5 w-3 h-3 rounded-full bg-gold ring-4 ring-gold/15" />
                              <h5 className="text-xs font-black text-cream uppercase">3. Distribución 3D</h5>
                              <p className="text-[10.5px] text-cream-muted mt-0.5 font-body">Acomodo óptimo de 14 módulos fotovoltaicos (En Proceso).</p>
                            </div>
                            {/* Step 4 */}
                            <div className="relative">
                              <span className="absolute -left-[22px] top-0.5 w-3 h-3 rounded-full bg-dark-4 ring-4 ring-dark-4/10" />
                              <h5 className="text-xs font-black text-cream-dim uppercase">4. Propuesta Comercial</h5>
                              <p className="text-[10.5px] text-cream-dim mt-0.5 font-body">Reporte técnico y firma de contrato (Pendiente).</p>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Viewer Box Mockup */}
                        <div className="lg:col-span-7 border border-dark-4 bg-dark-2 rounded-2xl overflow-hidden relative group aspect-video">
                          <img 
                            src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=85&auto=format&fit=crop" 
                            alt="Mapeo Dron"
                            className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-102 transition-transform duration-700" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 select-none">
                            <span className="text-[8px] font-mono font-bold text-gold uppercase tracking-widest">Visualizador 3D interactivo</span>
                            <h4 className="text-base font-black text-white mt-1">Simulación Fotogramétrica Guadalajara</h4>
                            <p className="text-[10.5px] text-white/70 font-body mt-0.5">Malla de precisión digitalizada para 8 kWp residencial.</p>
                            <a 
                              href="#anteproyecto" 
                              onClick={closePortal}
                              className="mt-4 px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all self-start flex items-center gap-1.5"
                            >
                              <span>Iniciar Render Interactivo</span>
                              <Sparkles className="w-3.5 h-3.5 text-dark-1" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CLIENT TAB 3: CFE BILLS */}
                  {activeTab === 'cfe' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2">
                        RECIBOS CFE Y AHORROS
                      </h3>

                      <div className="grid lg:grid-cols-12 gap-8">
                        {/* Table */}
                        <div className="lg:col-span-7 border border-dark-4 bg-dark-2/50 rounded-2xl overflow-hidden p-5 space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-gold">Historial de Consumo Bimestral</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-dark-4 text-cream-dim text-[10px] font-mono uppercase tracking-wider">
                                  <th className="py-2.5">Bimestre</th>
                                  <th className="py-2.5">Tarifa</th>
                                  <th className="py-2.5">Consumo (kWh)</th>
                                  <th className="py-2.5">Facturado</th>
                                  <th className="py-2.5">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-dark-4/50">
                                <tr>
                                  <td className="py-3 font-bold">Ene-Feb 2026</td>
                                  <td className="py-3 text-cream-muted font-mono">PDBT</td>
                                  <td className="py-3 font-mono">180 kWh</td>
                                  <td className="py-3 font-mono text-gold">$740 MXN</td>
                                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[9px] font-bold">Pagado</span></td>
                                </tr>
                                <tr>
                                  <td className="py-3 font-bold">Nov-Dic 2025</td>
                                  <td className="py-3 text-cream-muted font-mono">DAC</td>
                                  <td className="py-3 font-mono">820 kWh</td>
                                  <td className="py-3 font-mono text-red-400">$6,850 MXN</td>
                                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[9px] font-bold">Pagado</span></td>
                                </tr>
                                <tr className="opacity-50">
                                  <td className="py-3 font-bold">Sep-Oct 2025</td>
                                  <td className="py-3 text-cream-muted font-mono">DAC</td>
                                  <td className="py-3 font-mono">910 kWh</td>
                                  <td className="py-3 font-mono">$7,420 MXN</td>
                                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[9px] font-bold">Pagado</span></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Interactive Graph Box (SVG) */}
                        <div className="lg:col-span-5 border border-dark-4 bg-dark-2/50 p-6 rounded-2xl flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-gold mb-1">Impacto Financiero</h4>
                            <p className="text-[10px] text-cream-muted leading-relaxed font-body">Comparación del gasto facturado en CFE antes y después de instalar paneles solares.</p>
                          </div>
                          
                          {/* SVG Bar Chart */}
                          <div className="h-44 w-full flex items-end justify-between px-4 pt-6 select-none">
                            {/* Bar 1 (Before) */}
                            <div className="flex flex-col items-center gap-1.5 w-1/4">
                              <span className="text-[9px] font-mono font-bold text-red-400">$7.4k</span>
                              <div className="w-8 h-28 bg-red-500/25 rounded-t-md border border-red-500/35" />
                              <span className="text-[8px] font-mono text-cream-dim">Pre-solar</span>
                            </div>
                            {/* Bar 2 (After) */}
                            <div className="flex flex-col items-center gap-1.5 w-1/4">
                              <span className="text-[9px] font-mono font-bold text-green-400">$0.7k</span>
                              <div className="w-8 h-4 bg-green-500/35 rounded-t-md border border-green-500/45 animate-[pulse_2s_infinite]" />
                              <span className="text-[8px] font-mono text-cream-dim">Post-solar</span>
                            </div>
                            {/* Bar 3 (Average saving) */}
                            <div className="flex flex-col items-center gap-1.5 w-1/4">
                              <span className="text-[9px] font-mono font-bold text-gold">90.5%</span>
                              <div className="w-8 h-24 bg-gold/25 rounded-t-md border border-gold/45" />
                              <span className="text-[8px] font-mono text-cream-dim">Ahorro</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CLIENT TAB 4: CHAT ASSISTANT */}
                  {activeTab === 'chat' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2">
                        ASISTENTE INTELIGENTE ESOL
                      </h3>

                      <div className="grid lg:grid-cols-12 gap-8 h-[500px]">
                        {/* Agents selector */}
                        <div className="lg:col-span-4 border border-dark-4 bg-dark-2/50 p-5 rounded-2xl flex flex-col justify-between select-none">
                          <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gold">Selecciona un Asistente</h4>
                            <div className="space-y-2">
                              {agents.map(agent => (
                                <button 
                                  key={agent.id}
                                  onClick={() => setSelectedAgentId(agent.id)}
                                  className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                                    selectedAgentId === agent.id
                                      ? 'border-gold bg-gold/5 text-gold'
                                      : 'border-dark-4 bg-dark-1/55 text-cream-muted hover:border-cream/25'
                                  }`}
                                >
                                  <Bot className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-wider">{agent.name}</p>
                                    <p className="text-[10px] text-cream-dim font-body mt-0.5 leading-snug">{agent.role}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-3.5 bg-dark-1/70 border border-dark-4 rounded-xl text-[10px] text-cream-dim leading-relaxed font-body">
                            🤖 Estos asistentes operan con LLMs entrenadas para resolver dudas técnicas del catálogo eSol y evaluar techumbres de forma interactiva.
                          </div>
                        </div>

                        {/* Chat window */}
                        <div className="lg:col-span-8 border border-dark-4 bg-dark-2/30 rounded-2xl flex flex-col justify-between overflow-hidden shadow-inner">
                          {/* Messages */}
                          <div className="flex-1 p-5 overflow-y-auto space-y-4">
                            {clientChatMessages.map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm space-y-1 ${
                                  msg.sender === 'user'
                                    ? 'bg-gradient-to-br from-gold to-gold-light text-dark-1 rounded-tr-none font-bold'
                                    : 'bg-dark-2 border border-dark-4 text-cream rounded-tl-none'
                                }`}>
                                  <p className="text-xs leading-relaxed font-body">{msg.text}</p>
                                  <span className={`text-[8.5px] block text-right font-mono ${msg.sender === 'user' ? 'text-dark-1/65' : 'text-cream-dim'}`}>
                                    {msg.time}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Chat Input form */}
                          <form onSubmit={handleSendClientChatMessage} className="p-4 border-t border-dark-4 bg-dark-2 flex gap-3 select-none">
                            <input 
                              type="text"
                              placeholder={`Escribe a ${agents.find(a => a.id === selectedAgentId)?.name || 'Asesor'}...`}
                              value={clientChatMessage}
                              onChange={(e) => setClientChatMessage(e.target.value)}
                              className="flex-grow bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream placeholder-cream-dim px-4 py-3 rounded-xl focus:outline-none transition-colors"
                            />
                            <button
                              type="submit"
                              className="px-5 py-3 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center justify-center"
                            >
                              Enviar
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ==================================================== */}
              {/* ADMIN WORKSPACE SCREENS */}
              {/* ==================================================== */}
              {currentUser.role === 'admin' && (
                <div className="space-y-6">
                  
                  {/* ADMIN TAB 1: PIPELINE LEADS */}
                  {activeTab === 'leads' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2 select-none">
                        PIPELINE DE LEADS Y SOLICITUDES 3D
                      </h3>

                      <div className="border border-dark-4 bg-dark-2/40 rounded-2xl overflow-hidden p-5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gold block mb-4 select-none">Leads Registrados en Plataforma</span>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-dark-4 text-cream-dim text-[10px] font-mono uppercase tracking-wider select-none">
                                <th className="py-3">Cliente</th>
                                <th className="py-3">Email</th>
                                <th className="py-3">Tarifa CFE</th>
                                <th className="py-3">Fecha Alta</th>
                                <th className="py-3">Estatus</th>
                                <th className="py-3 text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-4/45">
                              {leads.map((l: any) => (
                                <tr key={l.id}>
                                  <td className="py-3.5 font-bold">{l.name}</td>
                                  <td className="py-3.5 font-mono text-cream-muted">{l.email}</td>
                                  <td className="py-3.5 font-mono">{l.tariff}</td>
                                  <td className="py-3.5 font-mono">{l.date}</td>
                                  <td className="py-3.5">
                                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${
                                      l.status === 'Activo'
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : l.status === 'Cotización Enviada'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : l.status === 'Pendiente de Envío'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                                        : 'bg-gold/10 text-gold border-gold/20'
                                    }`}>{l.status}</span>
                                  </td>
                                  <td className="py-3.5 text-right select-none">
                                    <button 
                                      onClick={() => setInspectingLead(l)}
                                      className="px-2.5 py-1 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-[9.5px] font-black uppercase tracking-wider text-cream hover:text-gold rounded-lg transition-all cursor-pointer"
                                    >
                                      Inspect
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ADMIN & MASTER TAB: B2B PRODUCTS MANAGEMENT */}
              {(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'inventory' && (
                <InventoryTab />
              )}
              {(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'logistics' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2 select-none">
                        LOGÍSTICA DE ENVÍOS B2B
                      </h3>

                      <div className="border border-dark-4 bg-dark-2/40 rounded-2xl overflow-hidden p-5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gold block mb-4 select-none">Despacho de Materiales a Instaladores</span>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-dark-4 text-cream-dim text-[10px] font-mono uppercase tracking-wider select-none">
                                <th className="py-3">Fletera</th>
                                <th className="py-3">No. Guía</th>
                                <th className="py-3">Destino</th>
                                <th className="py-3">Carga</th>
                                <th className="py-3">Estatus</th>
                                <th className="py-3">Progreso</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-4/45">
                              <tr>
                                <td className="py-3.5 font-bold">Castores Consolidado</td>
                                <td className="py-3.5 font-mono text-cream-muted">CAS-748927492</td>
                                <td className="py-3.5 font-mono">Hermosillo, Sonora</td>
                                <td className="py-3.5 font-body">16 paneles LONGi + Inversor Solis</td>
                                <td className="py-3.5">
                                  <span className="px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 text-[9px] font-bold">En Tránsito</span>
                                </td>
                                <td className="py-3.5">
                                  <div className="w-24 h-1.5 rounded bg-dark-4 overflow-hidden">
                                    <div className="w-2/3 h-full bg-gold" />
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3.5 font-bold">Tresguerras Directo</td>
                                <td className="py-3.5 font-mono text-cream-muted">TG-098748374</td>
                                <td className="py-3.5 font-mono">Querétaro, Qro.</td>
                                <td className="py-3.5 font-body">218 paneles Jinko 550W</td>
                                <td className="py-3.5">
                                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold">Entregado</span>
                                </td>
                                <td className="py-3.5">
                                  <div className="w-24 h-1.5 rounded bg-dark-4 overflow-hidden">
                                    <div className="w-full h-full bg-green-400" />
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROFILE EDIT MODAL */}
                  {isProfileModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
                      <div className="bg-dark-2 border border-dark-4 rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl relative">
                        <div className="flex justify-between items-center border-b border-dark-4 pb-3">
                          <h4 className="font-display font-black text-sm text-cream uppercase tracking-wider">Editar Perfil</h4>
                          <button onClick={() => setIsProfileModalOpen(false)} className="text-cream-dim hover:text-gold transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-black text-cream-muted uppercase tracking-wider mb-2">Nombre Completo</label>
                            <input 
                              type="text" 
                              value={editProfileName}
                              onChange={(e) => setEditProfileName(e.target.value)}
                              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream placeholder:text-cream-muted focus:outline-none focus:border-gold transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-cream-muted uppercase tracking-wider mb-2">Avatar (Emoji o URL)</label>
                            <input 
                              type="text" 
                              value={editProfileAvatar}
                              onChange={(e) => setEditProfileAvatar(e.target.value)}
                              placeholder="☀️ o https://..."
                              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream placeholder:text-cream-muted focus:outline-none focus:border-gold transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-cream-muted uppercase tracking-wider mb-2">Correo (Solo lectura)</label>
                            <input 
                              type="text" 
                              value={currentUser.email}
                              disabled
                              className="w-full bg-dark-4/50 border border-dark-4 rounded-xl px-4 py-2.5 text-sm text-cream-dim cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <button 
                            onClick={async () => {
                              await updateCurrentUser({ name: editProfileName, avatar: editProfileAvatar });
                              setIsProfileModalOpen(false);
                            }}
                            className="w-full bg-gold hover:bg-gold-light text-dark-1 font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(196,152,37,0.3)] hover:shadow-[0_0_25px_rgba(196,152,37,0.5)]"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LEAD INSPECTION MODAL (ADMIN ONLY) */}
                  {inspectingLead && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
                      <div className="bg-dark-2 border border-dark-4 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
                        <div className="flex justify-between items-center border-b border-dark-4 pb-3">
                          <h4 className="font-display font-black text-sm text-cream uppercase tracking-wider">Detalles de Lead eSol</h4>
                          <button onClick={() => setInspectingLead(null)} className="p-1 hover:bg-dark-3 text-cream-muted hover:text-gold rounded-lg transition-colors cursor-pointer">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-cream-dim tracking-wider block">Nombre</span>
                            <span className="text-cream block font-bold mt-0.5">{inspectingLead.name}</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-cream-dim tracking-wider block">
                              {inspectingLead.source === 'chatbot' ? 'WhatsApp / Teléfono' : 'Correo'}
                            </span>
                            <span className="text-cream block font-mono mt-0.5">{inspectingLead.phone || inspectingLead.email}</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-cream-dim tracking-wider block">
                              {inspectingLead.source === 'chatbot' ? 'Origen del Lead' : 'Tarifa Registrada'}
                            </span>
                            <span className="text-cream block font-mono mt-0.5">
                              {inspectingLead.source === 'chatbot' ? 'Chatbot Cotizador B2B' : inspectingLead.tariff}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-cream-dim tracking-wider block">
                              {inspectingLead.source === 'chatbot' ? 'Monto Estimado' : 'Consumo Promedio'}
                            </span>
                            <span className="text-cream block font-mono mt-0.5">{inspectingLead.consumption || inspectingLead.usage}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9.5px] uppercase font-bold text-cream-dim tracking-wider block">
                              {inspectingLead.source === 'chatbot' ? 'Componentes Solicitados' : 'Requerimiento Estimado'}
                            </span>
                            <span className="text-gold block font-mono font-bold mt-0.5">{inspectingLead.panelReq || inspectingLead.panel_req}</span>
                          </div>
                        </div>

                        {inspectingLead.source === 'chatbot' ? (
                          <div className="space-y-2 select-none">
                            <span className="text-[9.5px] uppercase font-bold text-cream-dim tracking-wider block">Historial de Conversación</span>
                            <div className="max-h-52 overflow-y-auto bg-dark-1/90 border border-dark-4 rounded-xl p-4 space-y-3 font-sans text-xs scrollbar-thin select-text">
                              {(() => {
                                let chat: any[] = [];
                                if (inspectingLead.chatHistory) {
                                  try {
                                    chat = JSON.parse(inspectingLead.chatHistory);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }
                                if (chat.length === 0) {
                                  return <p className="text-cream-dim italic">No hay historial disponible.</p>;
                                }
                                return chat.map((msg: any, index: number) => (
                                  <div key={msg.id || index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[9px] text-cream-dim/60 mb-0.5 font-mono">
                                      {msg.sender === 'user' ? 'Cliente' : 'Carlos (Bot asesor)'} &bull; {msg.timestamp}
                                    </span>
                                    <div className={`max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-relaxed whitespace-pre-line ${
                                      msg.sender === 'user'
                                        ? 'bg-gold/10 border border-gold/30 text-gold-light'
                                        : 'bg-dark-3 border border-dark-4 text-cream-light'
                                    }`}>
                                      {msg.text}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        ) : (
                          /* Mock PDF Receipt Preview */
                          <div className="p-4 bg-dark-1/80 border border-dark-4 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <FileText className="w-8 h-8 text-gold stroke-[1.2]" />
                              <div>
                                <p className="text-xs font-bold text-cream">Recibo_CFE_{inspectingLead.name.split(' ')[0]}.pdf</p>
                                <p className="text-[9px] text-cream-dim font-mono">1.2 MB &bull; Cargado por Carlos</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => alert('Simulación: Descargando archivo del servidor local.')}
                              className="px-2.5 py-1.5 bg-dark-3 hover:bg-dark-4 text-[9.5px] font-black uppercase tracking-wider text-cream hover:text-gold rounded border border-dark-4 transition-colors cursor-pointer"
                            >
                              Descargar
                            </button>
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3">
                          <button 
                            onClick={() => setInspectingLead(null)}
                            className="px-4 py-2 border border-dark-4 text-xs font-black uppercase tracking-wider text-cream-muted hover:text-cream rounded-xl transition-colors cursor-pointer"
                          >
                            Cerrar
                          </button>
                          {inspectingLead.source === 'chatbot' ? (
                            <button 
                              onClick={() => {
                                const phone = inspectingLead.phone || inspectingLead.email;
                                const cleanPhone = phone.replace(/\D/g, '');
                                const messageText = `¡Hola ${inspectingLead.name}! Te escribe el equipo de eSol Energías ☀️. Aquí tienes el detalle de la cotización que solicitaste en nuestro sitio:\n\n📋 *Detalle:* ${inspectingLead.panelReq || inspectingLead.panel_req}\n💰 *Estimado:* ${inspectingLead.consumption || inspectingLead.usage}\n\nQuedamos a tus órdenes para formalizar el pedido y coordinar los detalles del envío. ¿Te gustaría proceder con la compra?`;
                                const encodedMsg = encodeURIComponent(messageText);
                                window.open(`https://wa.me/52${cleanPhone}?text=${encodedMsg}`, "_blank");
                                
                                // Update status to 'Cotización Enviada'
                                setLeads(prev => {
                                  const updated = prev.map(l => l.id === inspectingLead.id ? { ...l, status: 'Cotización Enviada' } : l);
                                  localStorage.setItem('esol_leads', JSON.stringify(updated));
                                  return updated;
                                });
                                setInspectingLead(null);
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                                <path d="M12.012 2.25c-5.368 0-9.738 4.37-9.739 9.739a9.715 9.715 0 0 0 1.298 4.856L2.25 21.75l5.097-1.336a9.691 9.691 0 0 0 4.665 1.189c5.368 0 9.738-4.37 9.738-9.739a9.75 9.75 0 0 0-9.738-9.614zm4.6 13.56c-.254.713-1.265 1.3-1.737 1.365-1.296.183-2.88-.3-4.406-1.704-1.524-1.405-2.257-3.06-2.257-4.357 0-.654.364-1.314.894-1.744a.611.611 0 0 1 .44-.195c.146 0 .273.006.38.014.12.008.27-.046.425.326.156.376.536 1.306.582 1.4.046.096.077.208.013.332-.064.125-.098.213-.195.32-.097.108-.2.24-.286.323-.097.094-.199.195-.085.389.114.195.508.84.1.2 1.09.972.4.328.577.27a.624.624 0 0 0 .398-.28c.086-.127.305-.47.424-.653.118-.18.236-.145.398-.086.162.06 1.028.484 1.205.575.177.089.295.133.339.208.044.075.044.435-.21.115z"/>
                              </svg>
                              Enviar por WhatsApp
                            </button>
                          ) : (
                            <button 
                              onClick={() => { alert(`Simulación: Notificación enviada al Master para iniciar modelado 3D de ${inspectingLead.name}.`); setInspectingLead(null); }}
                              className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                            >
                              Autorizar Propuesta 3D
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

              {/* ==================================================== */}
              {/* MASTER WORKSPACE SCREENS */}
              {/* ==================================================== */}
              {currentUser.role === 'master' && (
                <div className="space-y-6">
                  
                  {/* MASTER TAB 1: GENERAL DASHBOARD */}
                  {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                      <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
                        <div>
                          <h3 className="font-display font-black text-xl text-cream">
                            DASHBOARD CORPORATIVO MASTER
                          </h3>
                          <p className="text-xs text-cream-muted mt-1 leading-relaxed">
                            Resumen financiero global de eSol y rendimiento operativo de los agentes de automatización IA.
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-gold/10 text-gold rounded-full border border-gold/25 text-[10px] font-black uppercase tracking-wider">
                          Acceso Master Autorizado
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
                        {/* Stat 1 */}
                        <div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Total Cotizado</span>
                          <h4 className="text-2xl font-black text-gold mt-2 font-display">
                            ${esunQuotes.reduce((acc, q) => acc + (q.financial?.investment_mxn || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                          </h4>
                          <span className="text-[9px] text-green-400 font-bold block mt-3">↑ Total acumulado en Esun Solar</span>
                        </div>
                        {/* Stat 2 */}
                        <div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Leads por IA</span>
                          <h4 className="text-2xl font-black text-gold mt-2 font-display">{esunQuotes.length} leads</h4>
                          <span className="text-[9px] text-cream-muted block mt-3">Cotizaciones creadas en Esun Solar</span>
                        </div>
                        {/* Stat 3 */}
                        <div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Disponibilidad Bot</span>
                          <h4 className="text-2xl font-black text-gold mt-2 font-display">99.9%</h4>
                          <span className="text-[9px] text-green-400 font-bold block mt-3">Carlos activo y operando 24/7</span>
                        </div>
                        {/* Stat 4 */}
                        <div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Tasa Conversión</span>
                          <h4 className="text-2xl font-black text-gold mt-2 font-display">34.2%</h4>
                          <span className="text-[9px] text-cream-muted block mt-3">Cierres de cotizaciones B2B</span>
                        </div>
                      </div>
                    </div>
                  )}



                  {/* MASTER TAB 3: CMS CONTENT EDITOR */}
                  {activeTab === 'cms' && (
                    <CmsTab />
                  )}
                  {activeTab === 'modules' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2 select-none">
                        MÓDULOS DE LA LANDING PAGE
                      </h3>
                      
                      <div className="max-w-4xl border border-dark-4 bg-dark-2/50 p-6 rounded-2xl space-y-6">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gold block mb-1 select-none">Configuración de Secciones</span>
                          <p className="text-xs text-cream-muted leading-relaxed font-body">
                            Habilita o deshabilita la visibilidad de los módulos en la página principal para adaptar la landing page a tus necesidades comerciales y técnicas. Los cambios se reflejarán inmediatamente.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Module Hero */}
                          <div className="border border-dark-4 bg-dark-2/60 p-5 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-gold/10 text-gold rounded-lg border border-gold/25">
                                <Zap className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-cream">Sección Hero / Principal</h4>
                                <p className="text-[10px] text-cream-dim mt-0.5">Título, subtítulo y estadísticas iniciales de eSol.</p>
                              </div>
                            </div>
                            <button
                              onClick={() => updateContent({
                                ...content,
                                sections: {
                                  ...content.sections,
                                  hero: content.sections?.hero === false ? true : false
                                }
                              })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                content.sections?.hero !== false
                                  ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}
                            >
                              {content.sections?.hero !== false ? 'Activo' : 'Oculto'}
                            </button>
                          </div>

                          {/* Module Storytelling3D */}
                          <div className="border border-dark-4 bg-dark-2/60 p-5 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-gold/10 text-gold rounded-lg border border-gold/25">
                                <Layers className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-cream">Anteproyecto 3D</h4>
                                <p className="text-[10px] text-cream-dim mt-0.5">Modelado 3D fotorrealista y simulación de sombras.</p>
                              </div>
                            </div>
                            <button
                              onClick={() => updateContent({
                                ...content,
                                sections: {
                                  ...content.sections,
                                  storytelling3d: content.sections?.storytelling3d === false ? true : false
                                }
                              })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                content.sections?.storytelling3d !== false
                                  ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}
                            >
                              {content.sections?.storytelling3d !== false ? 'Activo' : 'Oculto'}
                            </button>
                          </div>

                          {/* Module Calculator */}
                          <div className="border border-dark-4 bg-dark-2/60 p-5 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-gold/10 text-gold rounded-lg border border-gold/25">
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-cream">Calculadora de Ahorro</h4>
                                <p className="text-[10px] text-cream-dim mt-0.5">Retorno financiero de inversión y ahorro CFE.</p>
                              </div>
                            </div>
                            <button
                              onClick={() => updateContent({
                                ...content,
                                sections: {
                                  ...content.sections,
                                  calculator: content.sections?.calculator === false ? true : false
                                }
                              })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                content.sections?.calculator !== false
                                  ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}
                            >
                              {content.sections?.calculator !== false ? 'Activo' : 'Oculto'}
                            </button>
                          </div>

                          {/* Module Catalog */}
                          <div className="border border-dark-4 bg-dark-2/60 p-5 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-gold/10 text-gold rounded-lg border border-gold/25">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-cream">Catálogo B2B</h4>
                                <p className="text-[10px] text-cream-dim mt-0.5">Lista de componentes y descuentos por volumen.</p>
                              </div>
                            </div>
                            <button
                              onClick={() => updateContent({
                                ...content,
                                sections: {
                                  ...content.sections,
                                  catalog: content.sections?.catalog === false ? true : false
                                }
                              })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                content.sections?.catalog !== false
                                  ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}
                            >
                              {content.sections?.catalog !== false ? 'Activo' : 'Oculto'}
                            </button>
                          </div>

                          {/* Module Brands */}
                          <div className="border border-dark-4 bg-dark-2/60 p-5 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-gold/10 text-gold rounded-lg border border-gold/25">
                                <Globe className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-cream">Marcas Aliadas</h4>
                                <p className="text-[10px] text-cream-dim mt-0.5">Logotipos de fabricantes de primer nivel en México.</p>
                              </div>
                            </div>
                            <button
                              onClick={() => updateContent({
                                ...content,
                                sections: {
                                  ...content.sections,
                                  brands: content.sections?.brands === false ? true : false
                                }
                              })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                content.sections?.brands !== false
                                  ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}
                            >
                              {content.sections?.brands !== false ? 'Activo' : 'Oculto'}
                            </button>
                          </div>

                          {/* Module Contact */}
                          <div className="border border-dark-4 bg-dark-2/60 p-5 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-gold/10 text-gold rounded-lg border border-gold/25">
                                <MessageSquare className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-cream">Chat de Contacto</h4>
                                <p className="text-[10px] text-cream-dim mt-0.5">Chatbot Carlos y mapa/datos de oficinas.</p>
                              </div>
                            </div>
                            <button
                              onClick={() => updateContent({
                                ...content,
                                sections: {
                                  ...content.sections,
                                  contact: content.sections?.contact === false ? true : false
                                }
                              })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                content.sections?.contact !== false
                                  ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}
                            >
                              {content.sections?.contact !== false ? 'Activo' : 'Oculto'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MASTER TAB 4: IA CHAT ENGINES */}
                  {activeTab === 'agents' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2 select-none">
                        MOTORES DE AGENTES DE CHAT
                      </h3>

                      <div className="grid lg:grid-cols-12 gap-8">
                        {/* Selector & parameters */}
                        <div className="lg:col-span-5 border border-dark-4 bg-dark-2/50 p-5 rounded-2xl space-y-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gold block select-none">Selección y Configuración de Agentes</span>
                          
                          <div className="space-y-3">
                            {agents.map(agent => (
                              <button
                                key={agent.id}
                                onClick={() => setSelectedAgentId(agent.id)}
                                className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                                  selectedAgentId === agent.id
                                    ? 'border-gold bg-gold/5 text-gold'
                                    : 'border-dark-4 bg-dark-1/55 text-cream-muted hover:border-cream/25'
                                }`}
                              >
                                <Bot className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="text-xs font-black uppercase tracking-wider">{agent.name}</p>
                                  <p className="text-[9.5px] text-cream-dim truncate mt-0.5">{agent.role}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Editor console */}
                        <div className="lg:col-span-7">
                          {(() => {
                            const agent = agents.find(a => a.id === selectedAgentId)!;
                            return (
                              <div className="border border-dark-4 bg-dark-2/50 p-6 rounded-2xl space-y-5">
                                <span className="text-xs font-black text-gold uppercase tracking-wider block select-none">Parámetros del Motor: {agent.name}</span>
                                
                                <div className="space-y-1.5">
                                  <label htmlFor="agent-prompt" className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block select-none">Prompt del Sistema</label>
                                  <textarea 
                                    id="agent-prompt"
                                    defaultValue={agent.systemPrompt}
                                    rows={5}
                                    className="w-full p-3 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream placeholder-cream-dim rounded-xl focus:outline-none transition-colors resize-none font-mono leading-relaxed"
                                  />
                                </div>

                                <div className="space-y-1.5 select-none">
                                  <label htmlFor="agent-temp" className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block">Temperatura (Creatividad)</label>
                                  <div className="flex items-center gap-3">
                                    <input 
                                      id="agent-temp"
                                      type="range"
                                      min={0}
                                      max={1}
                                      step={0.1}
                                      defaultValue={agent.temperature}
                                      className="flex-grow accent-gold h-1.5 bg-dark-1 rounded-lg cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const promptEl = document.getElementById('agent-prompt') as HTMLTextAreaElement;
                                    const tempEl = document.getElementById('agent-temp') as HTMLInputElement;
                                    if (promptEl && tempEl) {
                                      handleUpdateAgentPrompt(agent.id, promptEl.value, parseFloat(tempEl.value));
                                    }
                                  }}
                                  className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer select-none flex items-center gap-1.5"
                                >
                                  <Save className="w-4 h-4" />
                                  <span>Guardar Agente</span>
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MASTER TAB 5: LIGHTHOUSE & SEO */}
                  {activeTab === 'seo' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2 select-none">
                        SEO CONSOLE Y AUDITORÍA LIGHTHOUSE
                      </h3>

                      <div className="grid lg:grid-cols-12 gap-8">
                        {/* Editor */}
                        <div className="lg:col-span-6 border border-dark-4 bg-dark-2/50 p-6 rounded-2xl space-y-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gold block select-none">Campos Meta Tags B2B</span>
                          
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label htmlFor="seo-meta-t" className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block select-none">Meta Title (Pestaña navegador)</label>
                              <input 
                                id="seo-meta-t"
                                type="text"
                                value={seoTitle}
                                onChange={(e) => setSeoTitle(e.target.value)}
                                className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="seo-meta-d" className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block select-none">Meta Description</label>
                              <textarea 
                                id="seo-meta-d"
                                value={seoDesc}
                                onChange={(e) => setSeoDesc(e.target.value)}
                                rows={3}
                                className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors resize-none font-mono leading-relaxed"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="seo-meta-k" className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block select-none">Palabras Clave (Keywords)</label>
                              <input 
                                id="seo-meta-k"
                                type="text"
                                value={seoKeywords}
                                onChange={(e) => setSeoKeywords(e.target.value)}
                                className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label htmlFor="seo-ga" className="text-[9px] text-cream-muted uppercase font-bold tracking-wider block select-none">Google Analytics ID</label>
                                <input 
                                  id="seo-ga"
                                  type="text"
                                  value={seoGA}
                                  onChange={(e) => setSeoGA(e.target.value)}
                                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="seo-robots" className="text-[9px] text-cream-muted uppercase font-bold tracking-wider block select-none">reglas robots.txt</label>
                                <input 
                                  id="seo-robots"
                                  type="text"
                                  value={seoRobots}
                                  onChange={(e) => setSeoRobots(e.target.value)}
                                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                                />
                              </div>
                            </div>

                            <button
                              onClick={handleSaveSEO}
                              className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer select-none flex items-center gap-1.5"
                            >
                              <Save className="w-4 h-4" />
                              <span>Guardar SEO</span>
                            </button>
                          </div>
                        </div>

                        {/* Lighthouse simulation */}
                        <div className="lg:col-span-6 border border-dark-4 bg-dark-2/50 p-6 rounded-2xl flex flex-col justify-between">
                          <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold block select-none">Auditoría SEO Lighthouse</span>
                            
                            <div className="grid grid-cols-4 gap-3 select-none">
                              {/* Score 1 */}
                              <div className="text-center">
                                <div className="w-14 h-14 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto text-green-400 font-mono font-black text-xs bg-green-500/5 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                                  {seoData.pageSpeedScore.performance}
                                </div>
                                <span className="text-[8px] text-cream-dim block uppercase font-bold tracking-wider mt-1.5">Velocidad</span>
                              </div>
                              {/* Score 2 */}
                              <div className="text-center">
                                <div className="w-14 h-14 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto text-green-400 font-mono font-black text-xs bg-green-500/5 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                                  {seoData.pageSpeedScore.accessibility}
                                </div>
                                <span className="text-[8px] text-cream-dim block uppercase font-bold tracking-wider mt-1.5">Acceso</span>
                              </div>
                              {/* Score 3 */}
                              <div className="text-center">
                                <div className="w-14 h-14 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto text-green-400 font-mono font-black text-xs bg-green-500/5 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                                  {seoData.pageSpeedScore.bestPractices}
                                </div>
                                <span className="text-[8px] text-cream-dim block uppercase font-bold tracking-wider mt-1.5">Prácticas</span>
                              </div>
                              {/* Score 4 */}
                              <div className="text-center">
                                <div className="w-14 h-14 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto text-green-400 font-mono font-black text-xs bg-green-500/5 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                                  {seoData.pageSpeedScore.seo}
                                </div>
                                <span className="text-[8px] text-cream-dim block uppercase font-bold tracking-wider mt-1.5">SEO</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 pt-6">
                            <button
                              onClick={handleRunSEOAudit}
                              disabled={runningSeoAudit}
                              className="w-full py-2.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer select-none"
                            >
                              {runningSeoAudit ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin text-dark-1" />
                                  <span>Escaneando sitemaps...</span>
                                </>
                              ) : (
                                <>
                                  <Globe className="w-4 h-4" />
                                  <span>Iniciar Auditoría SEO</span>
                                </>
                              )}
                            </button>

                            {auditResult && (
                              <div className="p-3 bg-dark-1/80 border border-dark-4 rounded-xl font-mono text-[9px] text-cream-muted leading-relaxed whitespace-pre-line">
                                {auditResult}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MASTER TAB 6: ROLES & PERMISSIONS */}
                  {activeTab === 'roles' && (
                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2 select-none">
                        GESTIÓN DE ROLES Y PERMISOS DE USUARIOS
                      </h3>

                      <div className="border border-dark-4 bg-dark-2/40 rounded-2xl overflow-hidden p-5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gold block mb-4 select-none">Usuarios Registrados en eSol</span>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-dark-4 text-cream-dim text-[10px] font-mono uppercase tracking-wider select-none">
                                <th className="py-3">Usuario</th>
                                <th className="py-3">Email</th>
                                <th className="py-3">Rol Actual</th>
                                <th className="py-3 text-right">Modificar Privilegios</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-4/45">
                              {users.map(u => (
                                <tr key={u.id} className={currentUser.email === u.email ? 'bg-gold/5' : ''}>
                                  <td className="py-3.5 font-bold flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-lg bg-dark-3 flex items-center justify-center border border-dark-4 select-none">
                                      {u.avatar}
                                    </span>
                                    <span>{u.name} {currentUser.email === u.email ? '(Tú)' : ''}</span>
                                  </td>
                                  <td className="py-3.5 font-mono text-cream-muted">{u.email}</td>
                                  <td className="py-3.5 select-none">
                                    <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border ${
                                      u.role === 'master'
                                        ? 'bg-gold/10 text-gold border-gold/25'
                                        : u.role === 'admin'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                                        : 'bg-dark-3 text-cream-dim border-dark-4'
                                    }`}>
                                      {u.role === 'user' ? 'Cliente' : u.role.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3.5 text-right select-none">
                                    <select
                                      disabled={currentUser.email === u.email}
                                      value={u.role}
                                      onChange={(e) => {
                                        const newRole = e.target.value as UserRole;
                                        updateUserRole(u.id, newRole);
                                      }}
                                      className="bg-dark-3 border border-dark-4 text-cream text-[10.5px] px-2 py-1 rounded-lg focus:outline-none focus:border-gold/55 cursor-pointer disabled:opacity-50"
                                    >
                                      <option value="user">Cliente (User)</option>
                                      <option value="admin">Administrador</option>
                                      <option value="master">Master</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'cfemanager' && (
                <div className="w-full h-[calc(100vh-6.5rem)] min-h-[650px] border border-dark-4 rounded-2xl overflow-hidden bg-dark-1 shadow-2xl animate-[fadeIn_0.5s_ease-out]">
                  <iframe 
                    src={cfeAppUrl} 
                    className="w-full h-full border-0" 
                    title="CFE Manager"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'esun' && (
                <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                  <EsunPage />
                </div>
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'bitacoras' && (
                <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                  <BitacorasApp reporterName={currentUser.name} />
                </div>
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'cotizador' && (
                <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                  {/* SubTabs Header */}
                  <div className="flex border-b border-dark-4 select-none">
                    <button
                      onClick={() => setCotizadorSubTab('presupuestos')}
                      className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                        cotizadorSubTab === 'presupuestos'
                          ? 'border-gold text-gold bg-gold/5'
                          : 'border-transparent text-cream-dim hover:text-cream hover:border-dark-4'
                      }`}
                    >
                      Presupuestos
                    </button>
                    <button
                      onClick={() => setCotizadorSubTab('matrices')}
                      className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                        cotizadorSubTab === 'matrices'
                          ? 'border-gold text-gold bg-gold/5'
                          : 'border-transparent text-cream-dim hover:text-cream hover:border-dark-4'
                      }`}
                    >
                      Matrices de Costos
                    </button>
                    <button
                      onClick={() => setCotizadorSubTab('insumos')}
                      className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                        cotizadorSubTab === 'insumos'
                          ? 'border-gold text-gold bg-gold/5'
                          : 'border-transparent text-cream-dim hover:text-cream hover:border-dark-4'
                      }`}
                    >
                      Catálogo Insumos
                    </button>
                    <button
                      onClick={() => setCotizadorSubTab('grupos')}
                      className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                        cotizadorSubTab === 'grupos'
                          ? 'border-gold text-gold bg-gold/5'
                          : 'border-transparent text-cream-dim hover:text-cream hover:border-dark-4'
                      }`}
                    >
                      Grupo de Insumos
                    </button>
                  </div>

                  {/* SubTabs Contents */}
                  {cotizadorSubTab === 'presupuestos' && (
                    <PresupuestosTab />
                  )}

                  {cotizadorSubTab === 'matrices' && (
                    <MatricesTab />
                  )}

                  {cotizadorSubTab === 'insumos' && (
                    <InsumosTab />
                  )}

                  {cotizadorSubTab === 'grupos' && (
                    <GruposTab />
                  )}
                </div>
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'cfeconfig' && (
                <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                  {/* Config Header */}
                  <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gold/10 text-gold border border-gold/25">
                        <Sparkles className="w-3 h-3" />
                        AI Settings
                      </span>
                      <h3 className="font-display font-black text-xl text-cream">
                        CONFIGURACIÓN CFE IA
                      </h3>
                      <p className="text-xs text-cream-muted leading-relaxed max-w-2xl font-body">
                        Ajusta las credenciales de Gemini API para extracción automática de recibos CFE y gestiona el calificador solar.
                      </p>
                    </div>
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-1/80 border border-dark-4 rounded-xl text-[10px] font-mono">
                      <span className={`relative flex h-2 w-2`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          cfeApiKey ? 'bg-green-400' : 'bg-amber-400'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          cfeApiKey ? 'bg-green-500' : 'bg-amber-500'
                        }`}></span>
                      </span>
                      <span className="text-cream-dim uppercase tracking-wider font-bold">
                        {cfeApiKey ? 'Gemini API Conectada' : 'Modo Simulado'}
                      </span>
                    </div>
                  </div>

                  {/* Settings Panel */}
                  <div className="border border-dark-4 bg-dark-2/40 p-6 rounded-2xl max-w-3xl space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gold border-b border-dark-4 pb-3 select-none">Configuración de Google AI Studio</h4>
                    
                    <div className="space-y-4 font-body text-xs text-cream-dim">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-cream uppercase font-bold tracking-widest select-none flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-gold" />
                          Gemini API Key
                        </label>
                        <input 
                          type="password" 
                          placeholder="AIzaSy..." 
                          value={cfeApiKey}
                          onChange={(e) => {
                            setCfeApiKey(e.target.value);
                            updateGeminiApiKey(e.target.value);
                          }}
                          className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-xs text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                        />
                        <p className="text-[9.5px] text-cream-dim leading-relaxed">
                          Obtén tu API key gratis en <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-gold underline font-bold">Google AI Studio</a>. Se guarda de forma local y segura en tu navegador.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-cream uppercase font-bold tracking-widest select-none flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-gold" />
                          Ruta de Aplicación Local (CFE Manager)
                        </label>
                        <input 
                          type="text" 
                          value={cfeAppUrl}
                          onChange={(e) => {
                            setCfeAppUrl(e.target.value);
                            localStorage.setItem('cfe_ai_studio_url', e.target.value);
                          }}
                          className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-xs text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                        />
                        <p className="text-[9.5px] text-cream-dim leading-relaxed">
                          Ruta relativa al archivo de la aplicación local de CFE Manager. Por defecto es `/esol-cfe-manager/index.html`.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-cream uppercase font-bold tracking-widest select-none">Modelo Gemini</label>
                          <select 
                            value={cfeSelectedModel}
                            onChange={(e) => {
                              setCfeSelectedModel(e.target.value);
                              localStorage.setItem('cfe_gemini_model', e.target.value);
                            }}
                            className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-xs text-cream px-3 py-2.5 rounded-lg focus:outline-none"
                          >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado - Nueva Generación)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Veloz)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Razonamiento Avanzado)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-cream uppercase font-bold tracking-widest select-none">System Prompt de Extracción</label>
                        <textarea 
                          rows={5}
                          value={cfeSystemPrompt}
                          onChange={(e) => {
                            setCfeSystemPrompt(e.target.value);
                            localStorage.setItem('cfe_system_prompt', e.target.value);
                          }}
                          className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-xs text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono text-[11px] leading-relaxed"
                        />
                      </div>

                      <div className="pt-2 flex gap-3 select-none">
                        <button
                          onClick={() => {
                            alert('Ajustes guardados correctamente en local storage.');
                          }}
                          className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-gold/10"
                        >
                          Guardar Cambios
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Deseas restablecer los valores predeterminados?')) {
                              setCfeApiKey('');
                              updateGeminiApiKey('');
                              setCfeAppUrl('/esol-cfe-manager/index.html');
                              setCfeSelectedModel('gemini-2.5-flash');
                              setCfeSystemPrompt('Eres Esol CFE Manager. Analiza la factura/recibo de luz de CFE provista y extrae la información en formato JSON. El JSON debe tener exactamente estos campos y ningún texto adicional:\n{\n  "cliente": "nombre del cliente",\n  "servicio": "número de servicio (12 dígitos)",\n  "tarifa": "tarifa (ej. GDMTO, PDBT, DAC, 01)",\n  "periodo": "periodo de facturación (ej. Ene-Feb 2026)",\n  "kwh": consumo en kWh (número),\n  "importe": importe facturado en MXN (número)\n}');
                              localStorage.removeItem('cfe_ai_studio_url');
                              localStorage.removeItem('cfe_gemini_model');
                              localStorage.removeItem('cfe_system_prompt');
                              alert('Ajustes restablecidos.');
                            }
                          }}
                          className="px-5 py-2.5 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-xs font-black uppercase tracking-wider text-cream-dim hover:text-cream rounded-xl transition-all cursor-pointer"
                        >
                          Restablecer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
