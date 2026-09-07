import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../context/supabase';
import { getPresupuestos } from '../../lib/cotizadorService';
import { generarFolioCentralizado } from '../../utils/folioGenerator';
import { useApp } from '../../context/AppContext';
import { generateAIContent } from '../../lib/aiService';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import {
  Users,
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  CreditCard,
  X,
  Save,
  Building2,
  Copy,
  Check,
  UserCheck,
  ChevronDown,
  Sparkles,
  Phone,
  FileSignature
} from 'lucide-react';

// ==========================================
// INTERFACES & TYPES
// ==========================================

export interface Trabajador {
  id: string;
  nombre_completo: string;
  puesto: string;
  telefono: string;
  banco: string;
  cuenta_clabe: string;
  sueldo_base_semanal: number;
  curp?: string;
  rfc?: string;
  estado: 'activo' | 'inactivo';
  fecha_ingreso?: string;
  notas?: string;
  created_at?: string;
}

export interface ActividadSemanalItem {
  id: string;
  fecha: string;
  dia: string;
  tipo_vinculacion: 'proyecto' | 'general';
  proyecto_id?: string;
  proyecto_nombre: string;
  descripcion: string;
  horas_o_turno: string;
  estado: 'completada' | 'en_proceso';
}

export interface RegistroSemanal {
  id: string;
  folio?: string;
  trabajador_id: string;
  trabajador_nombre: string;
  trabajador_puesto: string;
  trabajador_banco: string;
  trabajador_clabe: string;
  fecha_inicio: string;
  fecha_fin: string;
  numero_semana: number;
  ano: number;
  monto_base: number;
  monto_ajuste: number;
  motivo_ajuste?: string;
  monto_total: number;
  estado_pago: 'pendiente' | 'pagado';
  fecha_pago?: string;
  metodo_pago: string;
  resumen_semanal?: string;
  observaciones?: string;
  created_at?: string;
}

// ==========================================
// HELPERS
// ==========================================

const formatCurrency = (val: number) => {
  if (isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(val);
};

const numeroALetras = (numero: number): string => {
  if (numero === 0) return 'CERO PESOS 00/100 M.N.';
  const integerPart = Math.floor(numero);
  const decimalPart = Math.round((numero - integerPart) * 100);
  
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const diezA19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  
  const convertirGrupo = (n: number): string => {
    let texto = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (c === 1 && d === 0 && u === 0) texto += 'CIEN ';
    else if (c > 0) texto += centenas[c] + ' ';
    
    if (d === 1) texto += diezA19[u] + ' ';
    else {
      if (d === 2 && u === 0) texto += 'VEINTE ';
      else if (d === 2) texto += 'VEINTI' + unidades[u] + ' ';
      else if (d > 2) {
        texto += decenas[d] + ' ';
        if (u > 0) texto += 'Y ' + unidades[u] + ' ';
      } else if (u > 0) {
        texto += unidades[u] + ' ';
      }
    }
    return texto.trim();
  };

  let letras = '';
  let resto = integerPart;

  if (resto >= 1000000) {
    const millones = Math.floor(resto / 1000000);
    if (millones === 1) letras += 'UN MILLON ';
    else letras += convertirGrupo(millones) + ' MILLONES ';
    resto = resto % 1000000;
  }

  if (resto >= 1000) {
    const miles = Math.floor(resto / 1000);
    if (miles === 1) letras += 'MIL ';
    else letras += convertirGrupo(miles) + ' MIL ';
    resto = resto % 1000;
  }

  if (resto > 0) {
    letras += convertirGrupo(resto) + ' ';
  }

  return (letras.trim() + ' PESOS ' + decimalPart.toString().padStart(2, '0') + '/100 M.N.').toUpperCase();
};

const getBase64ImageFromUrl = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(imageUrl);
        }
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getMondayAndSunday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diffToMonday));
  const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
  
  return {
    monday: monday.toISOString().split('T')[0],
    sunday: sunday.toISOString().split('T')[0]
  };
};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ==========================================
// COMPONENT
// ==========================================

export default function PersonalTab() {
  const { globalGeminiApiKey, siliconFlowApiKey } = useApp();
  const [activeView, setActiveView] = useState<'registros' | 'trabajadores'>('registros');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Data lists
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [registros, setRegistros] = useState<RegistroSemanal[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  
  // Loading & statuses
  const [isLoading, setIsLoading] = useState(true);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'pagado'>('todos');
  const [selectedTrabajadorFilter, setSelectedTrabajadorFilter] = useState<string>('todos');

  // Modals & Forms
  const [isTrabajadorModalOpen, setIsTrabajadorModalOpen] = useState(false);
  const [editingTrabajadorId, setEditingTrabajadorId] = useState<string | null>(null);
  const [trabajadorForm, setTrabajadorForm] = useState<Partial<Trabajador>>({
    nombre_completo: '',
    puesto: '',
    telefono: '',
    banco: '',
    cuenta_clabe: '',
    sueldo_base_semanal: 0,
    curp: '',
    rfc: '',
    estado: 'activo',
    notas: ''
  });

  const [isRegistroModalOpen, setIsRegistroModalOpen] = useState(false);
  const [editingRegistroId, setEditingRegistroId] = useState<string | null>(null);
  const [registroForm, setRegistroForm] = useState<Partial<RegistroSemanal>>({
    trabajador_id: '',
    trabajador_nombre: '',
    trabajador_puesto: '',
    trabajador_banco: '',
    trabajador_clabe: '',
    fecha_inicio: getMondayAndSunday(new Date()).monday,
    fecha_fin: getMondayAndSunday(new Date()).sunday,
    numero_semana: getWeekNumber(new Date()),
    ano: new Date().getFullYear(),
    monto_base: 0,
    monto_ajuste: 0,
    motivo_ajuste: '',
    monto_total: 0,
    estado_pago: 'pendiente',
    fecha_pago: '',
    metodo_pago: 'Transferencia Bancaria',
    resumen_semanal: '',
    observaciones: ''
  });

  // Notification clear
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar presupuestos para vincular actividades
      try {
        const bList = await getPresupuestos();
        setBudgets(bList || []);
      } catch (err) {
        console.warn("Could not fetch presupuestos for personal tab:", err);
      }

      // 2. Cargar Trabajadores desde Supabase o LocalStorage fallback
      let loadedTrabajadores: Trabajador[] = [];
      const { data: trabData, error: trabErr } = await supabase
        .from('personal_trabajadores')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (trabErr) {
        console.info("personal_trabajadores table not in Supabase yet, using local cache:", trabErr.message);
        setIsDbOffline(true);
        const localT = localStorage.getItem('esol_personal_trabajadores');
        if (localT) {
          loadedTrabajadores = JSON.parse(localT);
        }
      } else {
        loadedTrabajadores = trabData || [];
        localStorage.setItem('esol_personal_trabajadores', JSON.stringify(loadedTrabajadores));
      }
      setTrabajadores(loadedTrabajadores);

      // 3. Cargar Registros Semanales desde Supabase o LocalStorage fallback
      let loadedRegistros: RegistroSemanal[] = [];
      const { data: regData, error: regErr } = await supabase
        .from('personal_registros_semanales')
        .select('*')
        .order('fecha_inicio', { ascending: false });

      if (regErr) {
        console.info("personal_registros_semanales table not in Supabase yet, using local cache:", regErr.message);
        setIsDbOffline(true);
        const localR = localStorage.getItem('esol_personal_registros');
        if (localR) {
          loadedRegistros = JSON.parse(localR);
        }
      } else {
        loadedRegistros = regData || [];
        localStorage.setItem('esol_personal_registros', JSON.stringify(loadedRegistros));
      }
      setRegistros(loadedRegistros);

    } catch (err: any) {
      console.error("Error loading data in PersonalTab:", err);
      setNotification({ type: 'error', message: 'Error al conectar con la base de datos.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // TRABAJADORES HANDLERS
  // ==========================================

  const handleOpenNewTrabajador = () => {
    setEditingTrabajadorId(null);
    setTrabajadorForm({
      nombre_completo: '',
      puesto: 'Instalador Eléctrico',
      telefono: '',
      banco: 'BBVA',
      cuenta_clabe: '',
      sueldo_base_semanal: 3500,
      curp: '',
      rfc: '',
      estado: 'activo',
      notas: ''
    });
    setIsTrabajadorModalOpen(true);
  };

  const handleEditTrabajador = (t: Trabajador) => {
    setEditingTrabajadorId(t.id);
    setTrabajadorForm(t);
    setIsTrabajadorModalOpen(true);
  };

  const handleSaveTrabajador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabajadorForm.nombre_completo?.trim()) {
      setNotification({ type: 'error', message: 'El nombre completo del trabajador es requerido.' });
      return;
    }

    try {
      const payload: Partial<Trabajador> = {
        nombre_completo: trabajadorForm.nombre_completo.trim(),
        puesto: trabajadorForm.puesto?.trim() || 'Técnico General',
        telefono: trabajadorForm.telefono?.trim() || '',
        banco: trabajadorForm.banco?.trim() || '',
        cuenta_clabe: trabajadorForm.cuenta_clabe?.trim() || '',
        sueldo_base_semanal: Number(trabajadorForm.sueldo_base_semanal) || 0,
        curp: trabajadorForm.curp?.trim() || '',
        rfc: trabajadorForm.rfc?.trim() || '',
        estado: trabajadorForm.estado || 'activo',
        notas: trabajadorForm.notas?.trim() || ''
      };

      if (!isDbOffline) {
        if (editingTrabajadorId) {
          const { error } = await supabase
            .from('personal_trabajadores')
            .update(payload)
            .eq('id', editingTrabajadorId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('personal_trabajadores')
            .insert([payload]);
          if (error) throw error;
        }
      }

      // Sync local state & storage
      let updatedList: Trabajador[] = [];
      if (editingTrabajadorId) {
        updatedList = trabajadores.map(item => 
          item.id === editingTrabajadorId ? { ...item, ...payload } as Trabajador : item
        );
      } else {
        const newRecord: Trabajador = {
          id: editingTrabajadorId || 'trab_' + Date.now(),
          ...payload
        } as Trabajador;
        updatedList = [newRecord, ...trabajadores];
      }

      setTrabajadores(updatedList);
      localStorage.setItem('esol_personal_trabajadores', JSON.stringify(updatedList));

      setIsTrabajadorModalOpen(false);
      setNotification({
        type: 'success',
        message: editingTrabajadorId ? 'Trabajador actualizado correctamente.' : 'Trabajador registrado con éxito.'
      });
    } catch (err: any) {
      console.error("Error saving trabajador:", err);
      // Fallback local save
      const fallbackList = editingTrabajadorId
        ? trabajadores.map(t => t.id === editingTrabajadorId ? { ...t, ...trabajadorForm } as Trabajador : t)
        : [{ id: 'trab_' + Date.now(), ...trabajadorForm } as Trabajador, ...trabajadores];
      setTrabajadores(fallbackList);
      localStorage.setItem('esol_personal_trabajadores', JSON.stringify(fallbackList));
      setIsTrabajadorModalOpen(false);
      setNotification({ type: 'info', message: 'Guardado localmente. Recuerda ejecutar el script SQL en Supabase.' });
    }
  };

  const handleDeleteTrabajador = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar a este trabajador?')) return;

    try {
      if (!isDbOffline) {
        await supabase.from('personal_trabajadores').delete().eq('id', id);
      }
      const filtered = trabajadores.filter(t => t.id !== id);
      setTrabajadores(filtered);
      localStorage.setItem('esol_personal_trabajadores', JSON.stringify(filtered));
      setNotification({ type: 'success', message: 'Trabajador eliminado.' });
    } catch (err) {
      console.error("Error deleting trabajador:", err);
      const filtered = trabajadores.filter(t => t.id !== id);
      setTrabajadores(filtered);
      localStorage.setItem('esol_personal_trabajadores', JSON.stringify(filtered));
    }
  };

  // ==========================================
  // REGISTROS SEMANALES HANDLERS
  // ==========================================

  const handleOpenNewRegistro = () => {
    if (trabajadores.length === 0) {
      setNotification({
        type: 'info',
        message: 'Primero registra al menos un trabajador en el Directorio de Personal.'
      });
      setActiveView('trabajadores');
      return;
    }

    const firstTrab = trabajadores.find(t => t.estado === 'activo') || trabajadores[0];
    const { monday, sunday } = getMondayAndSunday(new Date());
    const weekNum = getWeekNumber(new Date(monday));
    const year = new Date(monday).getFullYear();
    const folio = generarFolioCentralizado('PER', firstTrab.nombre_completo, Math.floor(Math.random() * 900 + 100));

    setEditingRegistroId(null);
    setRegistroForm({
      folio,
      trabajador_id: firstTrab.id,
      trabajador_nombre: firstTrab.nombre_completo,
      trabajador_puesto: firstTrab.puesto,
      trabajador_banco: firstTrab.banco,
      trabajador_clabe: firstTrab.cuenta_clabe,
      fecha_inicio: monday,
      fecha_fin: sunday,
      numero_semana: weekNum,
      ano: year,
      monto_base: firstTrab.sueldo_base_semanal || 0,
      monto_ajuste: 0,
      motivo_ajuste: '',
      monto_total: firstTrab.sueldo_base_semanal || 0,
      estado_pago: 'pendiente',
      fecha_pago: '',
      metodo_pago: 'Transferencia Bancaria',
      resumen_semanal: '',
      observaciones: ''
    });

    setIsRegistroModalOpen(true);
  };

  const handleEditRegistro = (reg: RegistroSemanal) => {
    setEditingRegistroId(reg.id);
    setRegistroForm({
      ...reg,
      resumen_semanal: reg.resumen_semanal || ''
    });
    setIsRegistroModalOpen(true);
  };

  const handleSelectTrabajadorForRegistro = (trabId: string) => {
    const trab = trabajadores.find(t => t.id === trabId);
    if (!trab) return;

    const base = Number(trab.sueldo_base_semanal) || 0;
    const ajuste = Number(registroForm.monto_ajuste) || 0;
    const total = base + ajuste;

    const newFolio = generarFolioCentralizado('PER', trab.nombre_completo, Math.floor(Math.random() * 900 + 100));

    setRegistroForm(prev => ({
      ...prev,
      folio: editingRegistroId ? prev.folio : newFolio,
      trabajador_id: trab.id,
      trabajador_nombre: trab.nombre_completo,
      trabajador_puesto: trab.puesto,
      trabajador_banco: trab.banco,
      trabajador_clabe: trab.cuenta_clabe,
      monto_base: base,
      monto_total: total
    }));
  };

  const handleDateRangePreset = (preset: 'esta' | 'pasada') => {
    const targetDate = new Date();
    if (preset === 'pasada') {
      targetDate.setDate(targetDate.getDate() - 7);
    }
    const { monday, sunday } = getMondayAndSunday(targetDate);
    const weekNum = getWeekNumber(new Date(monday));
    const year = new Date(monday).getFullYear();

    setRegistroForm(prev => ({
      ...prev,
      fecha_inicio: monday,
      fecha_fin: sunday,
      numero_semana: weekNum,
      ano: year
    }));
  };

  const handleMontoChange = (montoBase: number, montoAjuste: number) => {
    const total = (Number(montoBase) || 0) + (Number(montoAjuste) || 0);
    setRegistroForm(prev => ({
      ...prev,
      monto_base: Number(montoBase) || 0,
      monto_ajuste: Number(montoAjuste) || 0,
      monto_total: total
    }));
  };
  const handleRedactarConIA = async () => {
    if (!globalGeminiApiKey && !siliconFlowApiKey) {
      setNotification({ type: 'error', message: 'No hay API Keys (Gemini o Silicon Flow) configuradas.' });
      return;
    }

    const { trabajador_nombre, trabajador_puesto } = registroForm;
    if (!trabajador_nombre) {
      setNotification({ type: 'error', message: 'Selecciona un trabajador primero.' });
      return;
    }

    setIsGeneratingAI(true);
    try {
      let prompt = `Actúa como el administrador de obra de ESOL Energías.
Tu tarea es transformar el borrador de actividades semanales de un trabajador en una descripción directa, objetiva y técnica de "conceptos ejecutados".
NO debe sonar a un diario ni a una bitácora narrativa (no uses frases como "Esta semana el trabajador realizó..."). 
Debe sonar como una justificación directa de pago por conceptos específicos de obra o servicios.

Trabajador: ${trabajador_nombre}
Puesto: ${trabajador_puesto || 'Técnico'}

Reglas estrictas:
- NUNCA uses introducciones, saludos ni despedidas.
- NO uses un tono narrativo o de diario. Ve directo al grano.
- DALE FORMATO VISUAL usando viñetas (el símbolo -), puntos y aparte, y saltos de línea.
- Si hay varias tareas, agrúpalas bajo pequeños títulos en MAYÚSCULAS (ej. INSTALACIÓN TÉCNICA:, MANIOBRAS:, etc.).
- PROHIBIDO USAR ASTERISCOS (**) para poner negritas, usa únicamente letras MAYÚSCULAS para resaltar los títulos.
- La estructura debe ser clara, no un texto monótono. Separa bien las ideas.
- Ejemplo de tono y estructura:
INSTALACIÓN ELÉCTRICA:
- Canalización de 50 metros de tubería conduit en azotea.
- Cableado y conexión de 3 inversores de 10kW.

OBRA CIVIL Y MANIOBRAS:
- Izaje manual de 20 paneles solares.
- Fijación de estructura coplanar.`;

      if (registroForm.resumen_semanal && registroForm.resumen_semanal.trim().length > 0) {
        prompt += `\n\nBorrador original:\n"${registroForm.resumen_semanal}"\n\nConvierte y corrige este borrador al formato estricto de conceptos directos solicitado.`;
      } else {
        prompt += `\n\nGenera 2 o 3 conceptos generales de labores de instalación, mantenimiento o apoyo eléctrico acordes a su puesto para rellenar el documento.`;
      }

      const aiText = await generateAIContent(
        [{ role: 'user', content: prompt }],
        globalGeminiApiKey,
        siliconFlowApiKey,
        'gemini-2.5-flash',
        0.4
      );
      
      if (aiText) {
        setRegistroForm(prev => ({ ...prev, resumen_semanal: aiText }));
        setNotification({ type: 'success', message: 'Resumen mejorado/generado con éxito.' });
      } else {
        throw new Error('Respuesta vacía');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('401')) {
        alert("Tu API Key de Silicon Flow es incorrecta o fue rechazada. Por favor verifica que la copiaste completa desde tu cuenta (Empieza con sk-).");
        setNotification({ type: 'error', message: err.message });
      } else if (err.message && err.message.includes('402')) {
        alert("Tu cuenta de Silicon Flow no tiene saldo suficiente o los tokens gratuitos se agotaron. Por favor, recarga saldo o verifica tu cuenta en su plataforma.");
        setNotification({ type: 'error', message: 'Error 402: Sin saldo en Silicon Flow.' });
      } else {
        alert("Error de IA: " + err.message);
        setNotification({ type: 'error', message: 'Error al generar texto con IA: ' + err.message });
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };


  const handleSaveRegistro = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!registroForm.trabajador_id) {
      setNotification({ type: 'error', message: 'Debes seleccionar un trabajador.' });
      return;
    }

    try {
      const base = Number(registroForm.monto_base) || 0;
      const ajuste = Number(registroForm.monto_ajuste) || 0;
      const total = base + ajuste;

      if (!registroForm.resumen_semanal || registroForm.resumen_semanal.trim().length === 0) {
        setNotification({ type: 'error', message: 'Por favor ingresa el resumen de actividades de la semana.' });
        return;
      }

      const payload: Partial<RegistroSemanal> = {
        folio: registroForm.folio || generarFolioCentralizado('PER', registroForm.trabajador_nombre, Math.floor(Math.random() * 900 + 100)),
        trabajador_id: registroForm.trabajador_id,
        trabajador_nombre: registroForm.trabajador_nombre || '',
        trabajador_puesto: registroForm.trabajador_puesto || '',
        trabajador_banco: registroForm.trabajador_banco || '',
        trabajador_clabe: registroForm.trabajador_clabe || '',
        fecha_inicio: registroForm.fecha_inicio || getMondayAndSunday(new Date()).monday,
        fecha_fin: registroForm.fecha_fin || getMondayAndSunday(new Date()).sunday,
        numero_semana: Number(registroForm.numero_semana) || 1,
        ano: Number(registroForm.ano) || new Date().getFullYear(),
        monto_base: base,
        monto_ajuste: ajuste,
        motivo_ajuste: registroForm.motivo_ajuste || '',
        monto_total: total,
        estado_pago: registroForm.estado_pago || 'pendiente',
        fecha_pago: registroForm.fecha_pago || '',
        metodo_pago: registroForm.metodo_pago || 'Transferencia Bancaria',
        resumen_semanal: registroForm.resumen_semanal || '',
        observaciones: registroForm.observaciones || ''
      };

      if (!isDbOffline) {
        if (editingRegistroId) {
          const { error } = await supabase
            .from('personal_registros_semanales')
            .update(payload)
            .eq('id', editingRegistroId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('personal_registros_semanales')
            .insert([payload]);
          if (error) throw error;
        }
      }

      // Sync local
      let updatedList: RegistroSemanal[] = [];
      if (editingRegistroId) {
        updatedList = registros.map(item =>
          item.id === editingRegistroId ? { ...item, ...payload } as RegistroSemanal : item
        );
      } else {
        const newRec: RegistroSemanal = {
          id: 'reg_' + Date.now(),
          ...payload
        } as RegistroSemanal;
        updatedList = [newRec, ...registros];
      }

      setRegistros(updatedList);
      localStorage.setItem('esol_personal_registros', JSON.stringify(updatedList));

      setIsRegistroModalOpen(false);
      setNotification({
        type: 'success',
        message: editingRegistroId ? 'Registro semanal actualizado.' : 'Registro semanal guardado exitosamente.'
      });
    } catch (err: any) {
      console.error("Error saving registro semanal:", err);
      // Fallback local save
      const fallbackList = editingRegistroId
        ? registros.map(r => r.id === editingRegistroId ? { ...r, ...registroForm } as RegistroSemanal : r)
        : [{ id: 'reg_' + Date.now(), ...registroForm } as RegistroSemanal, ...registros];
      setRegistros(fallbackList);
      localStorage.setItem('esol_personal_registros', JSON.stringify(fallbackList));
      setIsRegistroModalOpen(false);
      setNotification({ type: 'info', message: 'Guardado localmente. Recuerda ejecutar el script SQL en Supabase.' });
    }
  };

  const handleDeleteRegistro = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro semanal?')) return;

    try {
      if (!isDbOffline) {
        await supabase.from('personal_registros_semanales').delete().eq('id', id);
      }
      const filtered = registros.filter(r => r.id !== id);
      setRegistros(filtered);
      localStorage.setItem('esol_personal_registros', JSON.stringify(filtered));
      setNotification({ type: 'success', message: 'Registro eliminado.' });
    } catch (err) {
      console.error("Error deleting registro:", err);
      const filtered = registros.filter(r => r.id !== id);
      setRegistros(filtered);
      localStorage.setItem('esol_personal_registros', JSON.stringify(filtered));
    }
  };

  const handleToggleEstadoPago = async (reg: RegistroSemanal) => {
    const nuevoEstado = reg.estado_pago === 'pagado' ? 'pendiente' : 'pagado';
    const fechaPago = nuevoEstado === 'pagado' ? new Date().toISOString().split('T')[0] : '';

    try {
      if (!isDbOffline) {
        await supabase
          .from('personal_registros_semanales')
          .update({ estado_pago: nuevoEstado, fecha_pago: fechaPago })
          .eq('id', reg.id);
      }
      const updated = registros.map(r => r.id === reg.id ? { ...r, estado_pago: nuevoEstado, fecha_pago: fechaPago } : r);
      setRegistros(updated);
      localStorage.setItem('esol_personal_registros', JSON.stringify(updated));
      setNotification({
        type: 'success',
        message: `Registro marcado como ${nuevoEstado.toUpperCase()}.`
      });
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  // ==========================================
  // GENERACIÓN DE PDF PROFESIONAL (BLOB:)
  // ==========================================

  const handleGeneratePDF = async (reg: RegistroSemanal) => {
    setIsGeneratingPdf(true);
    try {
      // 1. Obtener Logo base64
      const logoBase64 = await getBase64ImageFromUrl(window.location.origin + '/Logo_esol_b.png');
      const logoSrc = logoBase64 || (window.location.origin + '/Logo_esol_b.png');

      const fechaEmision = new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const formatDateShort = (dStr: string) => {
        if (!dStr) return '';
        const parts = dStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dStr;
      };

      const periodoTexto = `Semana ${reg.numero_semana} (${formatDateShort(reg.fecha_inicio)} al ${formatDateShort(reg.fecha_fin)} de ${reg.ano})`;



      // Construcción del documento
      const element = document.createElement('div');
      element.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; }
          
          .sheet {
            width: 216mm;
            min-height: 279mm;
            padding: 14mm 16mm;
            margin: 0 auto;
            background: #ffffff;
            font-size: 9px;
            line-height: 1.35;
            color: #1e293b;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5px solid #d4af37;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }

          .brand-col {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .logo-img {
            max-height: 48px;
            width: auto;
            object-fit: contain;
          }

          .company-title {
            font-family: 'Cinzel', serif;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: 1px;
            margin: 0;
            line-height: 1.1;
          }

          .company-sub {
            font-size: 8px;
            color: #64748b;
            margin-top: 2px;
            letter-spacing: 0.5px;
            font-weight: 500;
          }

          .doc-folio-badge {
            text-align: right;
          }

          .doc-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
            margin: 0;
            text-transform: uppercase;
          }

          .doc-folio {
            font-size: 10px;
            font-weight: 700;
            color: #d4af37;
            margin-top: 2px;
            letter-spacing: 1px;
          }

          .doc-date {
            font-size: 8px;
            color: #64748b;
            margin-top: 1px;
          }

          .intro-box {
            background: #f8fafc;
            border-left: 3px solid #0f172a;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 8px;
            line-height: 1.4;
            color: #334155;
          }

          .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
          }

          .info-card {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 9px 12px;
          }

          .info-card-header {
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #0f172a;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 8px;
          }

          .info-label {
            color: #64748b;
            font-weight: 500;
          }

          .info-value {
            color: #0f172a;
            font-weight: 600;
            text-align: right;
          }

          .table-container {
            margin-bottom: 14px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
          }

          .act-table {
            width: 100%;
            border-collapse: collapse;
          }

          .act-table th {
            background: #0f172a;
            color: #ffffff;
            padding: 7px 10px;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-align: left;
            text-transform: uppercase;
          }

          .payment-summary {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
          }

          .clause-box {
            background: #f1f5f9;
            border-radius: 6px;
            padding: 9px 12px;
            border: 1px solid #cbd5e1;
          }

          .clause-title {
            font-size: 8px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 4px;
          }

          .clause-text {
            font-size: 7.5px;
            line-height: 1.4;
            color: #475569;
            text-align: justify;
          }

          .total-card {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            border-radius: 6px;
            padding: 10px 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border-top: 3px solid #d4af37;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #94a3b8;
            margin-bottom: 3px;
          }

          .total-amount-line {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            border-top: 1px solid #334155;
            padding-top: 6px;
            margin-top: 4px;
          }

          .total-label {
            font-size: 10px;
            font-weight: 700;
            color: #d4af37;
            text-transform: uppercase;
          }

          .total-value {
            font-size: 15px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 0.5px;
          }

          .total-words {
            font-size: 6.8px;
            color: #cbd5e1;
            margin-top: 4px;
            font-weight: 500;
            text-align: right;
            line-height: 1.2;
          }

          .signatures-area {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 35px;
            margin-top: 20px;
            padding-top: 10px;
          }

          .sig-box {
            text-align: center;
          }

          .sig-line {
            border-top: 1.2px solid #64748b;
            margin-bottom: 5px;
          }

          .sig-name {
            font-size: 9px;
            font-weight: 700;
            color: #0f172a;
          }

          .sig-role {
            font-size: 7.5px;
            color: #64748b;
          }

          .footer-note {
            text-align: center;
            font-size: 7px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            margin-top: 12px;
          }
        </style>

        <div class="sheet">
          <div>
            <!-- Header Institucional -->
            <div class="header">
              <div class="brand-col">
                <img src="${logoSrc}" alt="ESOL Energías" class="logo-img" />
                <div>
                  <h1 class="company-title">ESOL ENERGÍAS</h1>
                  <div class="company-sub">SOLUCIONES INTEGRALES DE NAYARIT S. DE R.L. DE C.V.</div>
                  <div class="company-sub">Av. Insurgentes 56-A, Centro, C.P. 63000, Tepic, Nayarit.</div>
                </div>
              </div>

              <div class="doc-folio-badge">
                <div class="doc-title">Comprobante de Actividades</div>
                <div class="doc-folio">${reg.folio}</div>
                <div class="doc-date">Emisión: ${fechaEmision}</div>
              </div>
            </div>

            <!-- Descripción de Documento -->
            <div class="intro-box">
              <strong>OBJETO DEL DOCUMENTO:</strong> El presente instrumento certifica la prestación de servicios, desarrollo técnico y cumplimiento de las actividades pormenorizadas a continuación por parte del colaborador durante el periodo semanal comprendido del <strong>${formatDateShort(reg.fecha_inicio)}</strong> al <strong>${formatDateShort(reg.fecha_fin)}</strong>, sirviendo como soporte administrativo y comprobatorio para su correspondiente liquidación semanal.
            </div>

            <!-- Información Colaborador y Periodo -->
            <div class="grid-info">
              <div class="info-card">
                <div class="info-card-header">
                  <span>Datos del Colaborador</span>
                  <span style="color: #d4af37;">${reg.trabajador_puesto || 'Técnico'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Nombre Completo:</span>
                  <span class="info-value">${reg.trabajador_nombre}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Puesto / Categoría:</span>
                  <span class="info-value">${reg.trabajador_puesto || 'Operativo'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Institución Bancaria:</span>
                  <span class="info-value">${reg.trabajador_banco || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cuenta / CLABE:</span>
                  <span class="info-value">${reg.trabajador_clabe || 'N/A'}</span>
                </div>
              </div>

              <div class="info-card">
                <div class="info-card-header">
                  <span>Detalles de Liquidación</span>
                  <span style="color: ${reg.estado_pago === 'pagado' ? '#16a34a' : '#ea580c'}; font-weight: 800;">
                    ${reg.estado_pago === 'pagado' ? '● LIQUIDADO' : '○ PENDIENTE'}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Periodo Semanal:</span>
                  <span class="info-value">${periodoTexto}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Forma de Pago:</span>
                  <span class="info-value">${reg.metodo_pago || 'Transferencia'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha de Liquidación:</span>
                  <span class="info-value">${reg.fecha_pago ? formatDateShort(reg.fecha_pago) : 'Al término de periodo'}</span>
                </div>
                </div>
              </div>
            </div>

            <!-- Resumen de Actividades -->
            <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc;">
              <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                Resumen de Actividades Realizadas
              </div>
              <div style="font-size: 8.5px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${reg.resumen_semanal || 'Sin registro de actividades.'}</div>
            </div>

            <!-- Resumen Financiero y Cláusula -->
            <div class="payment-summary">
              <div class="clause-box">
                <div class="clause-title">Declaración de Conformidad y Finiquito de Servicios</div>
                <div class="clause-text">
                  El colaborador manifiesta expresa y libre conformidad en haber desarrollado a satisfacción de la empresa las actividades aquí relacionadas. Asimismo, declara que el importe neto percibido en esta emisión cubre en su totalidad y de forma definitiva la retribución acordada exclusivamente por los servicios y tareas efectuadas en la semana indicada, sin que exista diferencia, reclamación o adeudo pendiente alguno por dicho lapso.
                  ${reg.observaciones ? `<div style="margin-top: 5px; border-top: 1px dashed #cbd5e1; padding-top: 4px;"><strong>Observaciones del periodo:</strong> ${reg.observaciones}</div>` : ''}
                </div>
              </div>

              <div class="total-card">
                <div>
                  <div class="total-row">
                    <span>Remuneración Base Semanal:</span>
                    <strong style="color: #ffffff;">${formatCurrency(reg.monto_base)}</strong>
                  </div>
                  ${reg.monto_ajuste !== 0 ? `
                    <div class="total-row">
                      <span>Ajuste / Imprevisto (${reg.motivo_ajuste || 'General'}):</span>
                      <strong style="color: ${reg.monto_ajuste > 0 ? '#4ade80' : '#f87171'};">
                        ${reg.monto_ajuste > 0 ? '+' : ''}${formatCurrency(reg.monto_ajuste)}
                      </strong>
                    </div>
                  ` : ''}
                </div>

                <div>
                  <div class="total-amount-line">
                    <span class="total-label">Total Liquidado:</span>
                    <span class="total-value">${formatCurrency(reg.monto_total)} MXN</span>
                  </div>
                  <div class="total-words">(${numeroALetras(reg.monto_total)})</div>
                </div>
              </div>
            </div>

            <!-- Firmas -->
            <div class="signatures-area">
              <div class="sig-box">
                <div style="height: 42px;"></div>
                <div class="sig-line"></div>
                <div class="sig-name">${reg.trabajador_nombre}</div>
                <div class="sig-role">Firma de Conformidad / Colaborador</div>
              </div>

              <div class="sig-box">
                <div style="height: 42px;"></div>
                <div class="sig-line"></div>
                <div class="sig-name">ESOL ENERGÍAS</div>
                <div class="sig-role">Vo.Bo. Autorización y Supervisión Operativa</div>
              </div>
            </div>
          </div>

          <!-- Pie de página -->
          <div class="footer-note">
            Este documento representa el registro oficial de actividades de campo y liquidación semanal de ESOL Energías. Prohibida su alteración o reproducción sin autorización previa.
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Comprobante_Semanal_${reg.folio}_${reg.trabajador_nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      document.body.appendChild(element);
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      document.body.removeChild(element);

      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');

      setNotification({
        type: 'success',
        message: 'PDF generado con éxito. Se abrió en una nueva pestaña para su impresión o descarga.'
      });

    } catch (error) {
      console.error("Error al generar PDF de actividades:", error);
      setNotification({ type: 'error', message: 'Hubo un problema al generar el PDF de actividades.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ==========================================
  // FILTERS & COMPUTED
  // ==========================================

  const filteredRegistros = useMemo(() => {
    return registros.filter(reg => {
      const matchesSearch = 
        reg.trabajador_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.trabajador_puesto || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'todos' ? true : reg.estado_pago === statusFilter;

      const matchesTrabajador = 
        selectedTrabajadorFilter === 'todos' ? true : reg.trabajador_id === selectedTrabajadorFilter;

      return matchesSearch && matchesStatus && matchesTrabajador;
    });
  }, [registros, searchTerm, statusFilter, selectedTrabajadorFilter]);

  const kpis = useMemo(() => {
    const totalPagado = registros
      .filter(r => r.estado_pago === 'pagado')
      .reduce((acc, curr) => acc + (Number(curr.monto_total) || 0), 0);
    const totalPendiente = registros
      .filter(r => r.estado_pago === 'pendiente')
      .reduce((acc, curr) => acc + (Number(curr.monto_total) || 0), 0);
    const activosCount = trabajadores.filter(t => t.estado === 'activo').length;

    return { totalPagado, totalPendiente, activosCount, totalRegistros: registros.length };
  }, [registros, trabajadores]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner if DB tables are pending SQL migration */}
      {isDbOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start justify-between gap-4 text-amber-200 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Base de datos en modo local (LocalStorage activo)</p>
              <p className="text-cream-muted/90 mt-0.5">
                El módulo está listo para usarse y generar PDFs. Para guardar tus datos permanentemente en la nube de Supabase, ejecuta el script SQL creado: <code className="bg-dark-1 px-1.5 py-0.5 rounded text-gold font-mono">supabase_personal.sql</code>.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`-- Revisa el archivo supabase_personal.sql en la raíz del proyecto.`);
              setNotification({ type: 'info', message: 'El archivo supabase_personal.sql está listo en la raíz.' });
            }}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-300 font-medium transition-colors shrink-0"
          >
            Ver Script
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
          notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
          'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {notification.type === 'info' && <Sparkles className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-cream-muted hover:text-cream">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-navigation & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4">
        <div>
          <h2 className="text-xl font-light text-cream flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gold" />
            Gestión y Liquidación Semanal de Personal
          </h2>
          <p className="text-cream-muted text-xs mt-1">
            Control de actividades semanales por colaborador, respaldo de cumplimiento, ajustes y emisión de comprobantes de pago oficiales.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-dark-3 p-1 rounded-xl border border-dark-4">
          <button
            onClick={() => setActiveView('registros')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeView === 'registros'
                ? 'bg-gold text-dark-1 font-bold shadow-lg shadow-gold/20'
                : 'text-cream-muted hover:text-cream hover:bg-dark-4'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Registros Semanales ({registros.length})
          </button>

          <button
            onClick={() => setActiveView('trabajadores')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeView === 'trabajadores'
                ? 'bg-gold text-dark-1 font-bold shadow-lg shadow-gold/20'
                : 'text-cream-muted hover:text-cream hover:bg-dark-4'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Directorio de Trabajadores ({trabajadores.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl">
          <div className="text-cream-muted text-xs flex items-center justify-between">
            <span>Pagado Acumulado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-cream mt-1">{formatCurrency(kpis.totalPagado)}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Semanas liquidadas</div>
        </div>

        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl">
          <div className="text-cream-muted text-xs flex items-center justify-between">
            <span>Pendiente por Pagar</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-cream mt-1">{formatCurrency(kpis.totalPendiente)}</div>
          <div className="text-[10px] text-amber-400 mt-0.5">Por liquidar</div>
        </div>

        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl">
          <div className="text-cream-muted text-xs flex items-center justify-between">
            <span>Personal Activo</span>
            <Users className="w-4 h-4 text-gold" />
          </div>
          <div className="text-lg font-bold text-cream mt-1">{kpis.activosCount}</div>
          <div className="text-[10px] text-cream-muted mt-0.5">Colaboradores registrados</div>
        </div>

        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl">
          <div className="text-cream-muted text-xs flex items-center justify-between">
            <span>Registros Semanales</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-cream mt-1">{kpis.totalRegistros}</div>
          <div className="text-[10px] text-blue-400 mt-0.5">Bitácoras generadas</div>
        </div>
      </div>

      {/* ==========================================
          VIEW: REGISTROS SEMANALES
          ========================================== */}
      {activeView === 'registros' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted" />
                <input
                  type="text"
                  placeholder="Buscar por colaborador, folio o puesto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-2 border border-dark-4 rounded-lg pl-9 pr-4 py-2 text-xs text-cream placeholder:text-cream-muted/50 focus:border-gold outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-dark-2 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
              >
                <option value="todos">Todos los Estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="pagado">Liquidados / Pagados</option>
              </select>

              {/* Worker Filter */}
              <select
                value={selectedTrabajadorFilter}
                onChange={e => setSelectedTrabajadorFilter(e.target.value)}
                className="bg-dark-2 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
              >
                <option value="todos">Todos los Colaboradores</option>
                {trabajadores.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre_completo}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenNewRegistro}
              className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-gold/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro Semanal
            </button>
          </div>

          {/* Registros Table */}
          <div className="bg-dark-2 border border-dark-4 rounded-2xl overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="p-12 text-center text-cream-muted text-xs">Cargando registros...</div>
            ) : filteredRegistros.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-cream-muted/40 mx-auto" />
                <p className="text-cream-muted text-xs">No se encontraron registros semanales.</p>
                <button
                  onClick={handleOpenNewRegistro}
                  className="px-4 py-2 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-gold rounded-lg text-xs transition-colors"
                >
                  Crear primer registro semanal
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-3/80 text-cream-muted border-b border-dark-4">
                    <tr>
                      <th className="py-3 px-4 font-medium">Folio / Emisión</th>
                      <th className="py-3 px-4 font-medium">Colaborador</th>
                      <th className="py-3 px-4 font-medium">Periodo</th>
                      <th className="py-3 px-4 font-medium text-center">Actividades</th>
                      <th className="py-3 px-4 font-medium text-right">Total a Pagar</th>
                      <th className="py-3 px-4 font-medium text-center">Estado</th>
                      <th className="py-3 px-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-4 text-cream">
                    {filteredRegistros.map(reg => (
                      <tr key={reg.id} className="hover:bg-dark-3/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-gold">
                          <div>{reg.folio}</div>
                          <div className="text-[10px] text-cream-muted font-sans mt-0.5">
                            Semana {reg.numero_semana} • {reg.ano}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-cream">{reg.trabajador_nombre}</div>
                          <div className="text-[11px] text-cream-muted">{reg.trabajador_puesto || 'Técnico'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-cream-muted">
                          <div className="flex items-center gap-1.5 text-xs text-cream">
                            <Calendar className="w-3.5 h-3.5 text-gold/70" />
                            <span>{reg.fecha_inicio} al {reg.fecha_fin}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 bg-dark-3 rounded-full text-[11px] border border-dark-4 text-cream-muted">
                            {(reg.actividades || []).length} tareas
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-cream text-sm">{formatCurrency(reg.monto_total)}</div>
                          {reg.monto_ajuste !== 0 && (
                            <div className={`text-[10px] ${reg.monto_ajuste > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              Ajuste: {reg.monto_ajuste > 0 ? '+' : ''}{formatCurrency(reg.monto_ajuste)}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleEstadoPago(reg)}
                            title="Haz clic para cambiar estado"
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${
                              reg.estado_pago === 'pagado'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            }`}
                          >
                            {reg.estado_pago === 'pagado' ? 'Liquidado' : 'Pendiente'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleGeneratePDF(reg)}
                              disabled={isGeneratingPdf}
                              title="Generar y abrir PDF con vista blob"
                              className="p-1.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-lg transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleEditRegistro(reg)}
                              title="Editar registro"
                              className="p-1.5 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteRegistro(reg.id)}
                              title="Eliminar"
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
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
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW: DIRECTORIO DE TRABAJADORES
          ========================================== */}
      {activeView === 'trabajadores' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-cream">Colaboradores e Instaladores Registrados</h3>
              <p className="text-cream-muted text-xs">Padrón de personal para asignación de tareas semanales y datos de transferencia bancaria.</p>
            </div>
            <button
              onClick={handleOpenNewTrabajador}
              className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-gold/20"
            >
              <Plus className="w-4 h-4" />
              Nuevo Trabajador
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trabajadores.map(trab => (
              <div key={trab.id} className="bg-dark-2 border border-dark-4 rounded-xl p-4 flex flex-col justify-between hover:border-gold/30 transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-cream text-sm">{trab.nombre_completo}</h4>
                      <span className="text-[11px] text-gold font-medium flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3" />
                        {trab.puesto}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      trab.estado === 'activo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-dark-4 text-cream-muted'
                    }`}>
                      {trab.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="bg-dark-3/50 p-2.5 rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between text-cream-muted">
                      <span>Teléfono:</span>
                      <span className="text-cream font-medium">{trab.telefono || 'Sin registrar'}</span>
                    </div>
                    <div className="flex justify-between text-cream-muted">
                      <span>Banco:</span>
                      <span className="text-cream font-medium">{trab.banco || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-cream-muted">
                      <span>CLABE:</span>
                      <span className="text-cream font-mono font-medium">{trab.cuenta_clabe || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-cream-muted pt-1 border-t border-dark-4">
                      <span>Tarifa / Sueldo Base:</span>
                      <span className="text-gold font-bold">{formatCurrency(trab.sueldo_base_semanal)} / sem</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-dark-4">
                  <button
                    onClick={() => handleEditTrabajador(trab)}
                    className="px-3 py-1.5 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTrabajador(trab.id)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: REGISTRO SEMANAL FORM
          ========================================== */}
      {isRegistroModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-4 flex justify-between items-center bg-dark-3/50">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-gold" />
                <div>
                  <h3 className="text-base font-bold text-cream">
                    {editingRegistroId ? 'Editar Registro Semanal' : 'Nuevo Registro y Liquidación Semanal'}
                  </h3>
                  <p className="text-xs text-cream-muted">Captura las actividades realizadas por el colaborador durante la semana.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegistroModalOpen(false)}
                className="text-cream-muted hover:text-cream p-1.5 rounded-lg hover:bg-dark-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRegistro} className="p-6 space-y-6">
              {/* Row 1: Colaborador & Periodo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1.5">Colaborador Asignado *</label>
                  <select
                    value={registroForm.trabajador_id}
                    onChange={e => handleSelectTrabajadorForRegistro(e.target.value)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                    required
                  >
                    <option value="">Selecciona un colaborador...</option>
                    {trabajadores.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nombre_completo} ({t.puesto})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1.5">
                    Rango de Fechas (Semana {registroForm.numero_semana})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={registroForm.fecha_inicio}
                      onChange={e => setRegistroForm(p => ({ ...p, fecha_inicio: e.target.value }))}
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-2 text-xs text-cream focus:border-gold outline-none font-mono"
                    />
                    <span className="text-cream-muted text-xs">al</span>
                    <input
                      type="date"
                      value={registroForm.fecha_fin}
                      onChange={e => setRegistroForm(p => ({ ...p, fecha_fin: e.target.value }))}
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-2 text-xs text-cream focus:border-gold outline-none font-mono"
                    />
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleDateRangePreset('esta')}
                      className="text-[10px] text-gold hover:underline"
                    >
                      Esta semana
                    </button>
                    <span className="text-cream-muted/50 text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={() => handleDateRangePreset('pasada')}
                      className="text-[10px] text-gold hover:underline"
                    >
                      Semana anterior
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1.5">Folio Asignado</label>
                  <input
                    type="text"
                    value={registroForm.folio}
                    onChange={e => setRegistroForm(p => ({ ...p, folio: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-gold font-mono focus:border-gold outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Montos y Liquidación */}
              <div className="bg-dark-3/60 p-4 rounded-xl border border-dark-4 space-y-4">
                <h4 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Liquidación Semanal y Ajustes por Imprevisto
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-cream-muted mb-1">Monto Base Acordado ($)</label>
                    <input
                      type="number"
                      value={registroForm.monto_base || 0}
                      onChange={e => handleMontoChange(Number(e.target.value), registroForm.monto_ajuste || 0)}
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none font-semibold"
                    />
                    <p className="text-[10px] text-cream-muted mt-0.5">Sueldo o tarifa pactada fija.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-cream-muted mb-1">Ajuste / Imprevisto ($)</label>
                    <input
                      type="number"
                      value={registroForm.monto_ajuste || 0}
                      onChange={e => handleMontoChange(registroForm.monto_base || 0, Number(e.target.value))}
                      placeholder="+ Bonos o - Deducciones"
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                    />
                    <p className="text-[10px] text-cream-muted mt-0.5">Positivo (bono) o negativo (deducción).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-cream-muted mb-1">Motivo del Ajuste</label>
                    <input
                      type="text"
                      placeholder="Ej. Bono horas extras en obra..."
                      value={registroForm.motivo_ajuste || ''}
                      onChange={e => setRegistroForm(p => ({ ...p, motivo_ajuste: e.target.value }))}
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                    />
                    <p className="text-[10px] text-cream-muted mt-0.5">Justificación del cambio de monto.</p>
                  </div>

                  <div className="bg-dark-1/80 border border-gold/30 rounded-xl p-3 flex flex-col justify-center items-end">
                    <span className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Total a Liquidar</span>
                    <span className="text-xl font-extrabold text-gold">{formatCurrency(registroForm.monto_total || 0)}</span>
                    <span className="text-[9px] text-cream-muted/70">M.N. neto</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-dark-4/50">
                  <div>
                    <label className="block text-xs font-medium text-cream-muted mb-1">Estado del Pago</label>
                    <select
                      value={registroForm.estado_pago}
                      onChange={e => setRegistroForm(p => ({ ...p, estado_pago: e.target.value as any }))}
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                    >
                      <option value="pendiente">Pendiente de Pago</option>
                      <option value="pagado">Liquidado / Pagado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-cream-muted mb-1">Método de Pago</label>
                    <input
                      type="text"
                      value={registroForm.metodo_pago}
                      onChange={e => setRegistroForm(p => ({ ...p, metodo_pago: e.target.value }))}
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-cream-muted mb-1">Fecha de Liquidación</label>
                    <input
                      type="date"
                      value={registroForm.fecha_pago || ''}
                      onChange={e => setRegistroForm(p => ({ ...p, fecha_pago: e.target.value }))}
                      className="w-full bg-dark-2 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Resumen de Actividades de la Semana */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-cream flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gold" />
                      Resumen de Actividades de la Semana
                    </h4>
                    <p className="text-[11px] text-cream-muted">
                      Describe de forma general o detallada las actividades realizadas en la semana.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRedactarConIA}
                    disabled={isGeneratingAI}
                    className="px-3 py-1.5 bg-dark-3 hover:bg-dark-4 border border-gold/30 text-gold font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-pulse' : ''}`} />
                    {isGeneratingAI ? 'Redactando...' : 'Redactar con IA'}
                  </button>
                </div>
                
                <div>
                  <textarea
                    rows={8}
                    value={registroForm.resumen_semanal || ''}
                    onChange={e => setRegistroForm(p => ({ ...p, resumen_semanal: e.target.value }))}
                    placeholder="Ej. Instalación de paneles en obra X el lunes, martes y miércoles. Jueves de taller y mantenimiento de inversores..."
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-xs text-cream focus:border-gold outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Row 4: Observaciones */}
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Observaciones o Notas del Periodo</label>
                <textarea
                  rows={2}
                  value={registroForm.observaciones || ''}
                  onChange={e => setRegistroForm(p => ({ ...p, observaciones: e.target.value }))}
                  placeholder="Notas adicionales sobre la ejecución de los trabajos, materiales utilizados o acuerdos..."
                  className="w-full bg-dark-3 border border-dark-4 rounded-lg p-2.5 text-xs text-cream focus:border-gold outline-none resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-dark-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegistroModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-cream-muted rounded-lg text-xs transition-colors"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-5 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-gold/20 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Registro
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: TRABAJADOR FORM
          ========================================== */}
      {isTrabajadorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-dark-4 flex justify-between items-center bg-dark-3/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" />
                <h3 className="text-base font-bold text-cream">
                  {editingTrabajadorId ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
                </h3>
              </div>
              <button
                onClick={() => setIsTrabajadorModalOpen(false)}
                className="text-cream-muted hover:text-cream p-1.5 rounded-lg hover:bg-dark-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrabajador} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez Morales"
                  value={trabajadorForm.nombre_completo || ''}
                  onChange={e => setTrabajadorForm(p => ({ ...p, nombre_completo: e.target.value }))}
                  className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1">Puesto / Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej. Instalador Eléctrico"
                    value={trabajadorForm.puesto || ''}
                    onChange={e => setTrabajadorForm(p => ({ ...p, puesto: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej. 311 123 4567"
                    value={trabajadorForm.telefono || ''}
                    onChange={e => setTrabajadorForm(p => ({ ...p, telefono: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1">Institución Bancaria</label>
                  <input
                    type="text"
                    placeholder="Ej. BBVA, Banorte, Azteca"
                    value={trabajadorForm.banco || ''}
                    onChange={e => setTrabajadorForm(p => ({ ...p, banco: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1">Cuenta / CLABE (18 dígitos)</label>
                  <input
                    type="text"
                    placeholder="01218000..."
                    value={trabajadorForm.cuenta_clabe || ''}
                    onChange={e => setTrabajadorForm(p => ({ ...p, cuenta_clabe: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream font-mono focus:border-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1">Tarifa / Sueldo Base Semanal ($)</label>
                  <input
                    type="number"
                    value={trabajadorForm.sueldo_base_semanal || 0}
                    onChange={e => setTrabajadorForm(p => ({ ...p, sueldo_base_semanal: Number(e.target.value) }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream font-semibold focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1">Estado</label>
                  <select
                    value={trabajadorForm.estado}
                    onChange={e => setTrabajadorForm(p => ({ ...p, estado: e.target.value as any }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-xs text-cream focus:border-gold outline-none"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-dark-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTrabajadorModalOpen(false)}
                  className="px-4 py-2 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-cream-muted rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-gold/20"
                >
                  <Save className="w-4 h-4" />
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
