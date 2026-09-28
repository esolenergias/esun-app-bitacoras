import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Eye,
  Save,
  RotateCcw,
  Building2,
  Calendar,
  MapPin,
  User,
  Shield,
  Zap,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wand2,
  Scale,
  BookOpen,
  Send,
  Loader2,
  History,
  FilePlus,
  FileEdit,
  Upload,
  Layers
} from 'lucide-react';
import type { OficioData, OficioTemplate } from './types';
import { OFICIOS_TEMPLATES } from './templates';
import { processOficioWithAI, type AIOperationMode } from './oficioAIService';
import { getPresupuestos, getPresupuestoDetails } from '../../../lib/cotizadorService';
import { supabase } from '../../../context/supabase';
import { useApp } from '../../../context/AppContext';

interface OficioFormProps {
  initialBudgetId?: string | null;
  oficio: OficioData;
  setOficio: React.Dispatch<React.SetStateAction<OficioData>>;
  onPreview: () => void;
  onDownload: () => void;
  onSave: () => void;
  onSaveDraft?: () => void;
  onOpenHistory: () => void;
  onNewOficio?: () => void;
  isSaving?: boolean;
}

export default function OficioForm({
  initialBudgetId,
  oficio,
  setOficio,
  onPreview,
  onDownload,
  onSave,
  onSaveDraft,
  onOpenHistory,
  onNewOficio,
  isSaving = false
}: OficioFormProps) {
  const { currentUser } = useApp();
  const isMaster = currentUser?.role === 'master' || currentUser?.email === 'menyfre@gmail.com';

  const [budgets, setBudgets] = useState<any[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(initialBudgetId || '');
  
  // AI states
  const [aiNotes, setAiNotes] = useState('');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // New tag inputs
  const [newCcp, setNewCcp] = useState('');
  const [newAnexo, setNewAnexo] = useState('');

  // Active form section
  const [activeSection, setActiveSection] = useState<'datos' | 'destinatario' | 'redactor' | 'cierre'>('datos');

  // Load budgets on mount
  useEffect(() => {
    const loadBudgetsList = async () => {
      try {
        setLoadingBudgets(true);
        const data = await getPresupuestos();
        setBudgets(data || []);
      } catch (err) {
        console.error('Error cargando presupuestos:', err);
      } finally {
        setLoadingBudgets(false);
      }
    };
    loadBudgetsList();
  }, []);

  // When initialBudgetId or budget selection changes
  const handleBudgetSelect = async (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    if (!budgetId) return;

    try {
      const budget = budgets.find(b => b.id === budgetId);
      const details = await getPresupuestoDetails(budgetId);
      
      let fetchedAddress = '';
      if (budget?.client_name) {
        const { data: clientData } = await supabase
          .from('clientes')
          .select('direccion')
          .ilike('nombre_razon_social', budget.client_name.trim())
          .limit(1);
        if (clientData && clientData.length > 0 && clientData[0].direccion) {
          fetchedAddress = clientData[0].direccion;
        }
      }

      const finalAddress = details?.ubicacion || fetchedAddress || '';
      const clientName = budget?.client_name || '';
      const obraName = budget?.name || 'Sistema Fotovoltaico';

      setOficio(prev => ({
        ...prev,
        presupuestoId: budgetId,
        nombreObra: obraName,
        ubicacionObra: finalAddress,
        clienteFinal: clientName,
        referencia: `REF: Obra ${obraName}${clientName ? ` | Cliente: ${clientName}` : ''}`
      }));
    } catch (e) {
      console.error('Error al vincular presupuesto:', e);
    }
  };

  // Apply a template
  const handleApplyTemplate = (tmpl: OficioTemplate) => {
    setOficio(prev => ({
      ...prev,
      tipoOficio: tmpl.id,
      asunto: tmpl.asuntoDefault,
      vocativo: tmpl.vocativoDefault,
      antecedentes: tmpl.antecedentesDefault,
      cuerpo: tmpl.cuerpoDefault,
      fundamentacion: tmpl.fundamentacionDefault,
      peticion: tmpl.peticionDefault,
      despedida: tmpl.despedidaDefault,
      ccp: tmpl.ccpDefault.length > 0 ? [...tmpl.ccpDefault] : prev.ccp,
      anexos: tmpl.anexosDefault.length > 0 ? [...tmpl.anexosDefault] : prev.anexos
    }));
    setActiveSection('redactor');
  };

  // AI handler
  const handleRunAI = async (mode: AIOperationMode) => {
    try {
      setIsProcessingAI(true);
      setAiNotification(null);
      setAiSuggestions(null);

      const result = await processOficioWithAI(
        oficio,
        mode,
        customAiPrompt,
        aiNotes
      );

      setOficio(prev => ({
        ...prev,
        asunto: result.asunto || prev.asunto,
        vocativo: result.vocativo || prev.vocativo,
        antecedentes: result.antecedentes !== undefined ? result.antecedentes : prev.antecedentes,
        cuerpo: result.cuerpo || prev.cuerpo,
        fundamentacion: result.fundamentacion !== undefined ? result.fundamentacion : prev.fundamentacion,
        peticion: result.peticion !== undefined ? result.peticion : prev.peticion,
        despedida: result.despedida || prev.despedida
      }));

      if (result.sugerencias) {
        setAiSuggestions(result.sugerencias);
      }

      setAiNotification('¡Oficio optimizado y estructurado con IA exitosamente!');
      setTimeout(() => setAiNotification(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Error al conectar con la IA');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAddCcp = () => {
    if (newCcp.trim()) {
      setOficio(prev => ({ ...prev, ccp: [...prev.ccp, newCcp.trim()] }));
      setNewCcp('');
    }
  };

  const handleRemoveCcp = (index: number) => {
    setOficio(prev => ({ ...prev, ccp: prev.ccp.filter((_, i) => i !== index) }));
  };

  const handleAddAnexo = () => {
    if (newAnexo.trim()) {
      setOficio(prev => ({ ...prev, anexos: [...prev.anexos, newAnexo.trim()] }));
      setNewAnexo('');
    }
  };

  const handleRemoveAnexo = (index: number) => {
    setOficio(prev => ({ ...prev, anexos: prev.anexos.filter((_, i) => i !== index) }));
  };

  // Signature management
  const [signatureSavedNotice, setSignatureSavedNotice] = useState(false);
  const userSigKey = currentUser?.email 
    ? `esol_firma_digital_${currentUser.email}` 
    : (currentUser?.id ? `esol_firma_digital_${currentUser.id}` : 'esol_firma_digital_precargada');

  useEffect(() => {
    // If no signature on this oficio, auto-load pre-saved signature of the active user
    if (!oficio.firmaDigital) {
      const savedSig = localStorage.getItem(userSigKey) || localStorage.getItem('esol_firma_digital_precargada');
      if (savedSig) {
        setOficio(prev => ({
          ...prev,
          firmaDigital: savedSig,
          incluirFirmaDigital: prev.incluirFirmaDigital ?? true
        }));
      }
    }

    // Also auto-populate sender name if currently default/empty
    if (currentUser?.name && (!oficio.remitenteNombre || oficio.remitenteNombre === 'Manuel de Jesus Fregoso Samaniega')) {
      let cargo = 'REPRESENTANTE LEGAL';
      if (currentUser.role === 'master') {
        cargo = 'DIRECCIÓN GENERAL / REPRESENTANTE LEGAL';
      } else if (currentUser.role === 'admin') {
        cargo = 'ADMINISTRACIÓN Y CONTROL DE OPERACIONES';
      } else if (currentUser.role) {
        cargo = 'SUPERVISOR DE OBRA Y PROYECTOS';
      }

      setOficio(prev => ({
        ...prev,
        remitenteNombre: prev.remitenteNombre && prev.remitenteNombre !== 'Manuel de Jesus Fregoso Samaniega' ? prev.remitenteNombre : currentUser.name,
        remitenteCargo: prev.remitenteCargo && prev.remitenteCargo !== 'REPRESENTANTE LEGAL' ? prev.remitenteCargo : cargo,
        empresaEmail: prev.empresaEmail || currentUser.email || 'contacto@esolenergias.com'
      }));
    }
  }, [currentUser, userSigKey]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen (PNG o JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      if (!rawBase64) return;

      // Compress and optimize signature image to lightweight PNG
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 750;
          const maxH = 320;
          let w = img.width;
          let h = img.height;

          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          if (h > maxH) {
            w = Math.round((w * maxH) / h);
            h = maxH;
          }

          canvas.width = Math.max(w, 1);
          canvas.height = Math.max(h, 1);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const optimizedBase64 = canvas.toDataURL('image/png', 0.9);

            setOficio(prev => ({
              ...prev,
              firmaDigital: optimizedBase64,
              incluirFirmaDigital: true
            }));

            try {
              localStorage.setItem(userSigKey, optimizedBase64);
              localStorage.setItem('esol_firma_digital_precargada', optimizedBase64);
            } catch (lsErr) {
              console.warn('LocalStorage limit exceeded:', lsErr);
            }

            setSignatureSavedNotice(true);
            setTimeout(() => setSignatureSavedNotice(false), 3000);
            return;
          }
        } catch (canvasErr) {
          console.error('Error optimizing signature canvas:', canvasErr);
        }

        // Fallback
        setOficio(prev => ({
          ...prev,
          firmaDigital: rawBase64,
          incluirFirmaDigital: true
        }));
        try {
          localStorage.setItem(userSigKey, rawBase64);
          localStorage.setItem('esol_firma_digital_precargada', rawBase64);
        } catch (e) {}
      };

      img.onerror = () => {
        alert('No se pudo procesar la imagen seleccionada.');
      };

      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setOficio(prev => ({
      ...prev,
      firmaDigital: undefined,
      incluirFirmaDigital: false
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Toolbar */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-cream flex items-center gap-2">
              Generador Oficial de Oficios de Obra
              <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full border border-gold/30 font-mono">
                {oficio.folio || 'OF-ESOL-2026-001'}
              </span>
              {oficio.estado === 'borrador' ? (
                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Borrador
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Emitido
                </span>
              )}
            </h3>
            <p className="text-xs text-cream-muted">
              Redacta, formaliza y certifica comunicados técnicos y legales vinculados a tus proyectos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Selector Interactivo de Estatus */}
          <div className="flex items-center bg-dark-1 border border-dark-4 rounded-xl p-1 gap-1" title="Cambiar estatus del documento">
            <button
              type="button"
              onClick={() => setOficio(prev => ({ ...prev, estado: 'borrador' }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                oficio.estado === 'borrador'
                  ? 'bg-slate-500/20 text-slate-300 border border-slate-500/50 shadow-sm'
                  : 'text-cream-muted hover:text-cream hover:bg-dark-3'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${oficio.estado === 'borrador' ? 'bg-slate-400' : 'bg-cream-muted/40'}`}></span>
              <span>Borrador</span>
            </button>
            <button
              type="button"
              onClick={() => setOficio(prev => ({ ...prev, estado: 'emitido' }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                oficio.estado === 'emitido' || !oficio.estado
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-cream-muted hover:text-cream hover:bg-dark-3'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${(oficio.estado === 'emitido' || !oficio.estado) ? 'bg-emerald-400' : 'bg-cream-muted/40'}`}></span>
              <span>Emitido</span>
            </button>
          </div>

          <button
            onClick={onOpenHistory}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cream-muted hover:text-cream bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-xl transition-colors"
          >
            <History className="w-4 h-4 text-gold" />
            <span>Historial</span>
          </button>

          <button
            onClick={onPreview}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cream-muted hover:text-cream bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4 text-gold" />
            <span>Vista Previa</span>
          </button>

          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              disabled={isSaving}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-xl transition-colors disabled:opacity-50"
              title="Guardar como borrador para finalizar después"
            >
              <FileEdit className="w-4 h-4 text-amber-400" />
              <span>Guardar Borrador</span>
            </button>
          )}

          <button
            onClick={onSave}
            disabled={isSaving}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-cream bg-dark-3 hover:bg-dark-4 border border-gold/40 hover:border-gold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            title="Guardar y emitir oficialmente"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : <Save className="w-4 h-4 text-gold" />}
            <span>Emitir Oficio</span>
          </button>

          <button
            onClick={onDownload}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-dark-1 bg-gold hover:bg-gold-light rounded-xl transition-all shadow-lg hover:shadow-gold/20"
          >
            <Download className="w-4 h-4" />
            <span>Generar PDF</span>
          </button>
        </div>
      </div>

      {/* Edit Mode Notification Banner */}
      {oficio.id && (
        <div className="bg-amber-100 border border-amber-300 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-black shadow-md">
          <div className="flex items-center gap-2 flex-wrap text-black">
            <span className="bg-black text-white font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
              Modo Edición
            </span>
            <span className="text-black">
              Estás modificando el oficio <strong className="text-black font-bold">{oficio.folio}</strong> (Estatus actual: <strong className={oficio.estado === 'borrador' ? 'text-slate-600 font-bold uppercase' : 'text-emerald-700 font-bold uppercase'}>{oficio.estado === 'borrador' ? 'Borrador' : 'Emitido'}</strong>).
            </span>
            {oficio.estado === 'borrador' ? (
              <button
                type="button"
                onClick={() => setOficio(prev => ({ ...prev, estado: 'emitido' }))}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Promover a Emitido Oficial</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOficio(prev => ({ ...prev, estado: 'borrador' }))}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-black border border-slate-400 font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-sm"
              >
                <FileEdit className="w-3.5 h-3.5 text-slate-700" />
                <span>Cambiar a Borrador</span>
              </button>
            )}
          </div>
          {onNewOficio && (
            <button
              onClick={onNewOficio}
              type="button"
              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white border border-black rounded-xl transition-colors flex items-center gap-1.5 font-medium self-end sm:self-auto shrink-0 text-xs shadow-sm"
            >
              <FilePlus className="w-3.5 h-3.5 text-gold" />
              <span>Crear Nuevo Oficio</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation Tabs for Form Sections */}
      <div className="flex border-b border-dark-4 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveSection('datos')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
            activeSection === 'datos'
              ? 'border-gold text-gold bg-gold/5'
              : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
          }`}
        >
          <Building2 className="w-4 h-4" />
          1. Datos y Obra
        </button>

        <button
          onClick={() => setActiveSection('destinatario')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
            activeSection === 'destinatario'
              ? 'border-gold text-gold bg-gold/5'
              : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
          }`}
        >
          <User className="w-4 h-4" />
          2. Destinatario y Asunto
        </button>

        <button
          onClick={() => setActiveSection('redactor')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
            activeSection === 'redactor'
              ? 'border-gold text-gold bg-gold/5'
              : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
          }`}
        >
          <Sparkles className="w-4 h-4 text-gold" />
          3. Redactor Inteligente (IA)
        </button>

        <button
          onClick={() => setActiveSection('cierre')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
            activeSection === 'cierre'
              ? 'border-gold text-gold bg-gold/5'
              : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
          }`}
        >
          <Shield className="w-4 h-4" />
          4. Emisor, Firmas y C.c.p.
        </button>
      </div>

      {/* SECCIÓN 1: DATOS Y OBRA + CATÁLOGO DE PLANTILLAS */}
      {activeSection === 'datos' && (
        <div className="space-y-6">
          
          {/* Quick Plantillas Selector */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-cream flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold" />
                Selecciona una Plantilla de Oficio (Opcional)
              </h4>
              <span className="text-[11px] text-cream-muted">
                Preconfigura la estructura formal según la situación
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {OFICIOS_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl)}
                  type="button"
                  className={`text-left p-3 rounded-xl border transition-all ${
                    oficio.tipoOficio === tmpl.id
                      ? 'bg-gold/10 border-gold shadow-md'
                      : 'bg-dark-3/60 hover:bg-dark-3 border-dark-4 hover:border-gold/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase text-gold tracking-wider">
                      {tmpl.categoria}
                    </span>
                  </div>
                  <h5 className="text-xs font-medium text-cream line-clamp-1 mb-1">
                    {tmpl.titulo}
                  </h5>
                  <p className="text-[10px] text-cream-muted line-clamp-2">
                    {tmpl.descripcion}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Obra y Presupuesto Vinculado */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-cream flex items-center gap-2 border-b border-dark-4 pb-3">
              <Building2 className="w-4 h-4 text-gold" />
              Vinculación con Obra o Proyecto
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Seleccionar Presupuesto Base
                </label>
                <select
                  value={selectedBudgetId}
                  onChange={(e) => handleBudgetSelect(e.target.value)}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                >
                  <option value="">-- Selección Libre / Sin Presupuesto --</option>
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.client_name || 'Sin cliente'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Nombre de la Obra / Proyecto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sistema Fotovoltaico 120 kWp Nave Industrial"
                  value={oficio.nombreObra}
                  onChange={(e) => setOficio({ ...oficio, nombreObra: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Cliente Final / Razón Social
                </label>
                <input
                  type="text"
                  placeholder="Ej. Comercializadora del Noroeste S.A. de C.V."
                  value={oficio.clienteFinal}
                  onChange={(e) => setOficio({ ...oficio, clienteFinal: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Ubicación / Domicilio de la Obra
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-cream-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ej. Av. Insurgentes No. 120, Col. Centro, Tepic, Nayarit"
                    value={oficio.ubicacionObra}
                    onChange={(e) => setOficio({ ...oficio, ubicacionObra: e.target.value })}
                    className="w-full bg-dark-1 border border-dark-4 rounded-xl pl-9 pr-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Control Documental (Folio, Fecha, Lugar) */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-cream flex items-center gap-2 border-b border-dark-4 pb-3">
              <Calendar className="w-4 h-4 text-gold" />
              Control y Emisión Documental
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Número de Folio Oficial
                </label>
                <input
                  type="text"
                  value={oficio.folio}
                  onChange={(e) => setOficio({ ...oficio, folio: e.target.value })}
                  placeholder="OF-ESOL-2026-001"
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gold focus:border-gold outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-cream-muted">
                    Fecha de Emisión
                  </label>
                  <button
                    type="button"
                    onClick={() => setOficio({ ...oficio, fecha: new Date().toISOString().split('T')[0] })}
                    className="text-[10px] text-gold hover:underline cursor-pointer"
                  >
                    Hoy
                  </button>
                </div>
                <input
                  type="date"
                  value={oficio.fecha}
                  onChange={(e) => setOficio({ ...oficio, fecha: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Lugar de Expedición
                </label>
                <input
                  type="text"
                  value={oficio.lugar}
                  onChange={(e) => setOficio({ ...oficio, lugar: e.target.value })}
                  placeholder="Tepic, Nayarit"
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveSection('destinatario')}
              className="px-5 py-2.5 bg-dark-3 hover:bg-dark-4 text-cream font-medium rounded-xl border border-dark-4 hover:border-gold/40 text-xs transition-colors"
            >
              Continuar a Destinatario →
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: TÍTULO, ASUNTO Y DESTINATARIO */}
      {activeSection === 'destinatario' && (
        <div className="space-y-6">
          
          {/* 1. Asunto y Referencias (PRIMERO) */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-cream flex items-center gap-2 border-b border-dark-4 pb-3">
              <FileText className="w-4 h-4 text-gold" />
              1. Título del Oficio y Asunto Oficial
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Asunto Oficial (En mayúsculas, sintético)
                </label>
                <input
                  type="text"
                  placeholder="ASUNTO: SOLICITUD DE LIBRANZA ELÉCTRICA Y MANIOBRAS EN SUBESTACIÓN"
                  value={oficio.asunto}
                  onChange={(e) => setOficio({ ...oficio, asunto: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2.5 text-xs font-semibold text-gold focus:border-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1">
                    Referencia de Obra / Contrato
                  </label>
                  <input
                    type="text"
                    placeholder="REF: Obra Solar 50 kWp - Contrato ESOL-2026-01"
                    value={oficio.referencia}
                    onChange={(e) => setOficio({ ...oficio, referencia: e.target.value })}
                    className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-cream-muted">
                      Vocativo Protocolario (Primera Persona)
                    </label>
                    <span className="text-[10px] text-gold/80">Redacción en 1ra persona</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Por medio de la presente me dirijo a usted con el debido respeto para:"
                    value={oficio.vocativo}
                    onChange={(e) => setOficio({ ...oficio, vocativo: e.target.value })}
                    className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none italic"
                  />
                  
                  {/* Quick first-person presets */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] text-cream-muted">Sugerencias:</span>
                    {[
                      'Por medio de la presente me dirijo a usted de la manera más atenta para:',
                      'Por medio del presente conducto, me dirijo a usted para hacer constar:',
                      'Me es muy grato dirigirme a usted con la finalidad de:'
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setOficio({ ...oficio, vocativo: preset })}
                        className="text-[10px] bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-gold px-2 py-0.5 rounded border border-dark-4 transition-colors truncate max-w-[240px]"
                        title={preset}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Destinatario (DESPUÉS) */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-cream flex items-center gap-2 border-b border-dark-4 pb-3">
              <User className="w-4 h-4 text-gold" />
              2. Datos del Destinatario (A quién va dirigido)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Tratamiento / Título
                </label>
                <select
                  value={oficio.destinatarioTitulo}
                  onChange={(e) => setOficio({ ...oficio, destinatarioTitulo: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                >
                  <option value="Ing.">Ing.</option>
                  <option value="Arq.">Arq.</option>
                  <option value="Lic.">Lic.</option>
                  <option value="C.P.">C.P.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="C.">C.</option>
                  <option value="">(Sin título)</option>
                  <option value="A QUIEN CORRESPONDA">A Quien Corresponda</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Nombre Completo del Destinatario
                </label>
                <input
                  type="text"
                  placeholder="Ej. Roberto Sánchez Méndez"
                  value={oficio.destinatarioNombre}
                  onChange={(e) => setOficio({ ...oficio, destinatarioNombre: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Cargo / Puesto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Superintendente de Obra / Residente de Supervisión"
                  value={oficio.destinatarioCargo}
                  onChange={(e) => setOficio({ ...oficio, destinatarioCargo: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Empresa / Dependencia / Institución
                </label>
                <input
                  type="text"
                  placeholder="Ej. CFE Distribución / Inmobiliaria del Pacífico"
                  value={oficio.destinatarioEmpresa}
                  onChange={(e) => setOficio({ ...oficio, destinatarioEmpresa: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Atención A (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ing. Carlos Morales (Jefe de Seguridad en Sitio)"
                  value={oficio.destinatarioAtencion || ''}
                  onChange={(e) => setOficio({ ...oficio, destinatarioAtencion: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection('datos')}
              className="px-4 py-2 bg-dark-3 hover:bg-dark-4 text-cream-muted font-medium rounded-xl text-xs transition-colors"
            >
              ← Volver a Datos
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('redactor')}
              className="px-5 py-2.5 bg-dark-3 hover:bg-dark-4 text-cream font-medium rounded-xl border border-dark-4 hover:border-gold/40 text-xs transition-colors"
            >
              Ir a Redactor con IA ✨ →
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: REDACTOR INTELIGENTE CON IA */}
      {activeSection === 'redactor' && (
        <div className="space-y-6">
          
          {/* AI Magic Box */}
          <div className="bg-gradient-to-br from-dark-2 via-dark-2 to-gold/5 border border-gold/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gold">
                    Asistente de Redacción y Formalidad Legal con IA
                  </h4>
                  <p className="text-[11px] text-cream-muted">
                    Escribe ideas clave o notas rápidas y la IA estructurará el oficio completo con rigor jurídico y técnico.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick notes input for AI */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-cream mb-1">
                Escribe aquí tus notas rápidas, situación u objetivo del oficio:
              </label>
              <textarea
                rows={2}
                placeholder="Ej. 'Ocupamos pedir permiso para entrar el lunes 15 con 4 técnicos a azotea a poner rieles y módulos, tenemos dc3 y epp, y que nos presten una toma de luz'"
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                className="w-full bg-dark-1 border border-dark-4 rounded-xl p-3 text-xs text-cream placeholder:text-cream-muted/50 focus:border-gold outline-none transition-all"
              />
            </div>

            {/* AI Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleRunAI('formalizar_completo')}
                disabled={isProcessingAI}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isProcessingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span>🪄 Estructurar y Formalizar Todo</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunAI('blindaje_legal')}
                disabled={isProcessingAI}
                className="flex items-center gap-1.5 px-3 py-2 bg-dark-3 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/50 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Scale className="w-3.5 h-3.5 text-gold" />
                <span>⚖️ Aumentar Blindaje Legal</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunAI('normativa_tecnica')}
                disabled={isProcessingAI}
                className="flex items-center gap-1.5 px-3 py-2 bg-dark-3 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/50 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                <span>⚡ Citar NOM-001-SEDE / CFE</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunAI('generar_acuerdos')}
                disabled={isProcessingAI}
                className="flex items-center gap-1.5 px-3 py-2 bg-dark-3 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/50 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                <span>💡 Generar Puntos de Acuerdo</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunAI('sintetizar_ejecutivo')}
                disabled={isProcessingAI}
                className="flex items-center gap-1.5 px-3 py-2 bg-dark-3 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/50 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 text-gold" />
                <span>📝 Sintetizar Ejecutivo</span>
              </button>
            </div>

            {/* Custom Prompt Accordion */}
            <div className="mt-3 pt-3 border-t border-dark-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="O escribe una instrucción libre a la IA (ej. 'Agrega que el cliente debe pagar el 50% antes del lunes')..."
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
                className="flex-1 bg-dark-1 border border-dark-4 rounded-xl px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
              />
              <button
                type="button"
                onClick={() => handleRunAI('personalizado')}
                disabled={isProcessingAI || !customAiPrompt.trim()}
                className="px-3 py-1.5 bg-dark-3 hover:bg-dark-4 text-gold border border-gold/30 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Aplicar</span>
              </button>
            </div>

            {/* Feedback messages */}
            {aiNotification && (
              <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{aiNotification}</span>
              </div>
            )}

            {aiSuggestions && (
              <div className="mt-3 p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-start gap-2 animate-fade-in">
                <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                <div>
                  <strong className="text-blue-200">Recomendación operativa de la IA:</strong> {aiSuggestions}
                </div>
              </div>
            )}
          </div>

          {/* Form Fields: Antecedentes, Cuerpo, Fundamentación, Petición */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-5">
            
            {/* Antecedentes */}
            <div>
              <label className="block text-xs font-medium text-cream mb-1 flex items-center justify-between">
                <span>1. Antecedentes y Contexto Previo (Opcional)</span>
                <span className="text-[10px] text-cream-muted">Contexto contractual, visitas previas o acuerdos</span>
              </label>
              <textarea
                rows={2}
                placeholder="En seguimiento al programa de obra convenido y a las inspecciones en sitio..."
                value={oficio.antecedentes || ''}
                onChange={(e) => setOficio({ ...oficio, antecedentes: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-xl p-3 text-xs text-cream focus:border-gold outline-none"
              />
            </div>

            {/* Cuerpo Principal */}
            <div>
              <label className="block text-xs font-medium text-cream mb-1 flex items-center justify-between">
                <span className="text-gold font-semibold">2. Cuerpo Principal / Exposición de Hechos y Motivos *</span>
                <span className="text-[10px] text-gold/80">Desarrollo detallado del oficio</span>
              </label>
              <textarea
                rows={6}
                placeholder="Por medio de la presente hacemos constar que la cuadrilla especializada de ESOL ENERGÍAS..."
                value={oficio.cuerpo}
                onChange={(e) => setOficio({ ...oficio, cuerpo: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-xl p-3 text-xs text-cream focus:border-gold outline-none leading-relaxed"
              />
            </div>

            {/* Fundamentación Técnica y Normativa */}
            <div>
              <label className="block text-xs font-medium text-cream mb-1 flex items-center justify-between">
                <span>3. Fundamentación Técnica y Legal (Opcional)</span>
                <span className="text-[10px] text-cream-muted">NOM-001-SEDE, STPS, CFE, Código Civil</span>
              </label>
              <textarea
                rows={2}
                placeholder="Con fundamento en la Norma Oficial Mexicana NOM-001-SEDE-2012 y las especificaciones técnicas..."
                value={oficio.fundamentacion || ''}
                onChange={(e) => setOficio({ ...oficio, fundamentacion: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-xl p-3 text-xs text-cream focus:border-gold outline-none"
              />
            </div>

            {/* Petición y Requerimientos Puntuales */}
            <div>
              <label className="block text-xs font-medium text-cream mb-1 flex items-center justify-between">
                <span>4. Petición y Requerimientos Puntuales (Opcional)</span>
                <span className="text-[10px] text-cream-muted">Puntos de solicitud o acuerdos numerados</span>
              </label>
              <textarea
                rows={3}
                placeholder="1. Autorización de acceso en el horario establecido.&#10;2. Liberación del área de maniobras."
                value={oficio.peticion || ''}
                onChange={(e) => setOficio({ ...oficio, peticion: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-xl p-3 text-xs text-cream focus:border-gold outline-none"
              />
            </div>

            {/* Despedida */}
            <div>
              <label className="block text-xs font-medium text-cream mb-1">
                5. Despedida y Cierre Protocolario
              </label>
              <input
                type="text"
                placeholder="Sin otro particular por el momento y agradeciendo su atención, quedamos a sus órdenes."
                value={oficio.despedida}
                onChange={(e) => setOficio({ ...oficio, despedida: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
              />
            </div>

          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection('destinatario')}
              className="px-4 py-2 bg-dark-3 hover:bg-dark-4 text-cream-muted font-medium rounded-xl text-xs transition-colors"
            >
              ← Volver a Destinatario
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('cierre')}
              className="px-5 py-2.5 bg-dark-3 hover:bg-dark-4 text-cream font-medium rounded-xl border border-dark-4 hover:border-gold/40 text-xs transition-colors"
            >
              Continuar a Firmas y C.c.p. →
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: EMISOR, FIRMAS, C.C.P. Y ANEXOS */}
      {activeSection === 'cierre' && (
        <div className="space-y-6">
          
          {/* Remitente ESOL */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-cream flex items-center gap-2 border-b border-dark-4 pb-3">
              <Shield className="w-4 h-4 text-gold" />
              Datos del Remitente y Empresa Emisora
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Nombre del Remitente / Firmante
                </label>
                <input
                  type="text"
                  value={oficio.remitenteNombre}
                  onChange={(e) => setOficio({ ...oficio, remitenteNombre: e.target.value })}
                  placeholder="Manuel de Jesus Fregoso Samaniega"
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Cargo / Especialidad
                </label>
                <input
                  type="text"
                  value={oficio.remitenteCargo}
                  onChange={(e) => setOficio({ ...oficio, remitenteCargo: e.target.value })}
                  placeholder="REPRESENTANTE LEGAL"
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Cédula Profesional (Opcional)
                </label>
                <input
                  type="text"
                  value={oficio.remitenteCedula || ''}
                  onChange={(e) => setOficio({ ...oficio, remitenteCedula: e.target.value })}
                  placeholder="Ej. 12345678"
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Razón Social Emisora
                </label>
                <input
                  type="text"
                  value={oficio.empresaRazonSocial}
                  onChange={(e) => setOficio({ ...oficio, empresaRazonSocial: e.target.value })}
                  placeholder="ESOL ENERGIAS"
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  RFC Emisora
                </label>
                <input
                  type="text"
                  value={oficio.empresaRFC}
                  onChange={(e) => setOficio({ ...oficio, empresaRFC: e.target.value })}
                  placeholder="RFC (Opcional)"
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs font-mono text-cream focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={oficio.empresaTelefono}
                  onChange={(e) => setOficio({ ...oficio, empresaTelefono: e.target.value })}
                  placeholder="3112343034"
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                />
              </div>
            </div>
          </div>

          {/* Firma Digital Precargada del Emisor / Creador */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-dark-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-cream flex items-center gap-2">
                    Firma Digital del Emisor / Creador
                    <span className="text-[10px] font-mono bg-dark-1 text-gold px-2 py-0.5 rounded border border-gold/30">
                      {currentUser?.name || 'Firmante Oficial'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-cream-muted">
                    Estampado y certificación digital de tu firma oficial en oficios y documentos PDF.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-dark-1 px-3 py-1.5 rounded-xl border border-dark-4 hover:border-gold/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(oficio.incluirFirmaDigital)}
                  onChange={(e) => setOficio({ ...oficio, incluirFirmaDigital: e.target.checked })}
                  className="rounded text-gold focus:ring-gold bg-dark-3 border-dark-4 w-4 h-4"
                />
                <span className="text-xs font-medium text-cream">
                  {oficio.incluirFirmaDigital ? 'Firma Activa en Oficio' : 'Firma Desactivada'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Preview Box */}
              <div className="bg-white rounded-xl p-4 border border-neutral-300 flex flex-col items-center justify-center min-h-[120px] relative">
                {oficio.firmaDigital ? (
                  <>
                    <img
                      src={oficio.firmaDigital}
                      alt="Firma Digital Precargada"
                      className="max-h-24 max-w-[240px] object-contain"
                    />
                    <span className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-wider">
                      Firma Digital Oficial de {oficio.remitenteNombre || currentUser?.name || 'Usuario'}
                    </span>
                  </>
                ) : (
                  <div className="text-center text-slate-400">
                    <FileEdit className="w-8 h-8 mx-auto mb-1 opacity-40" />
                    <p className="text-xs font-medium text-slate-600">Sin firma cargada</p>
                    <p className="text-[10px] text-slate-400">Sube una imagen de tu firma oficial</p>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-dark-3 hover:bg-dark-4 text-cream hover:text-gold border border-dark-4 hover:border-gold/50 rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-gold" />
                    <span>{oficio.firmaDigital ? 'Cambiar Imagen de Firma' : 'Subir Imagen de Firma'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>

                  {oficio.firmaDigital && (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="p-2.5 bg-dark-3 hover:bg-red-500/20 text-cream-muted hover:text-red-400 border border-dark-4 hover:border-red-500/30 rounded-xl transition-colors"
                      title="Quitar firma de este oficio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {signatureSavedNotice && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Firma guardada como predeterminada para tu usuario.</span>
                  </div>
                )}

                <p className="text-[10px] text-cream-muted leading-relaxed">
                  💡 <strong>Tu Firma Personal:</strong> Se recordará automáticamente en tu cuenta para todos los oficios que emitas desde tu usuario.
                </p>
              </div>
            </div>
          </div>

          {/* C.c.p. (Con copia para) y Anexos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* C.c.p. */}
            <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-sm font-semibold text-cream flex items-center justify-between border-b border-dark-4 pb-2">
                <span>C.c.p. (Con copia para)</span>
                <span className="text-[10px] text-cream-muted">{oficio.ccp.length} agregados</span>
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Residencia de Obra, Supervisión CFE..."
                  value={newCcp}
                  onChange={(e) => setNewCcp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCcp())}
                  className="flex-1 bg-dark-1 border border-dark-4 rounded-xl px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCcp}
                  className="p-2 bg-dark-3 hover:bg-dark-4 text-gold border border-dark-4 hover:border-gold/40 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {oficio.ccp.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-dark-3/60 px-3 py-1.5 rounded-lg text-xs text-cream">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCcp(idx)}
                      className="text-cream-muted hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Anexos */}
            <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-sm font-semibold text-cream flex items-center justify-between border-b border-dark-4 pb-2">
                <span>Anexos y Documentos Adjuntos</span>
                <span className="text-[10px] text-cream-muted">{oficio.anexos.length} agregados</span>
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Diagrama Unifilar, Formato DC-3, Memoria Técnica..."
                  value={newAnexo}
                  onChange={(e) => setNewAnexo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAnexo())}
                  className="flex-1 bg-dark-1 border border-dark-4 rounded-xl px-3 py-1.5 text-xs text-cream focus:border-gold outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAnexo}
                  className="p-2 bg-dark-3 hover:bg-dark-4 text-gold border border-dark-4 hover:border-gold/40 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {oficio.anexos.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-dark-3/60 px-3 py-1.5 rounded-lg text-xs text-cream">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAnexo(idx)}
                      className="text-cream-muted hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setActiveSection('redactor')}
              className="px-4 py-2 bg-dark-3 hover:bg-dark-4 text-cream-muted font-medium rounded-xl text-xs transition-colors"
            >
              ← Volver a Redactor
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPreview}
                className="px-4 py-2.5 bg-dark-3 hover:bg-dark-4 text-gold font-medium rounded-xl border border-gold/30 text-xs transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Vista Previa</span>
              </button>

              <button
                type="button"
                onClick={onDownload}
                className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Generar y Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
