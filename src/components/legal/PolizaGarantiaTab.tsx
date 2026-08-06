import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import {
  Shield,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  User,
  Zap,
  Sun,
  Sparkles,
  Wind,
  Ruler,
  Monitor,
  BatteryCharging,
  RefreshCw,
  Droplets,
  CheckSquare,
  Square,
  Clock,
  Send,
  Save,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Plus,
  Receipt
} from 'lucide-react';
import { getPresupuestos, getPresupuestoDetails } from '../../lib/cotizadorService';
import html2pdf from 'html2pdf.js';

interface PolizaGarantiaTabProps {
  initialBudgetId?: string | null;
}

export interface ConceptoServicio {
  id: string;
  icon: string;
  titulo: string;
  subtitulo: string;
  detalles: string[];
}

export const CATALOGO_CONCEPTOS: ConceptoServicio[] = [
  {
    id: 'ins_electricas',
    icon: '🔌',
    titulo: 'INS. ELÉCTRICAS',
    subtitulo: 'Instalación de sistemas eléctricos residenciales, comerciales e industriales.',
    detalles: [
      'Conforme a NOM-001-SEDE-2012 / 2018.',
      'Tableros principales, subpaneles y circuitos derivados.',
      'Sistema de puesta a tierra y puesta en servicio certificada.'
    ]
  },
  {
    id: 'paneles_solares',
    icon: '☀️',
    titulo: 'PANELES SOLARES',
    subtitulo: 'Suministro e instalación fotovoltaica llave en mano.',
    detalles: [
      'Cálculo de carga y balance de fases.',
      'Inversores, microinversiones e interconexión ante CFE.',
      'Garantía de producción energética certificada.'
    ]
  },
  {
    id: 'mtto_paneles',
    icon: '🧽',
    titulo: 'MTTO. PANELES SOLARES',
    subtitulo: 'Limpieza especializada y diagnóstico de rendimiento fotovoltaico.',
    detalles: [
      'Lavado con agua desmineralizada y cerdas suaves anti-rayaduras.',
      'Termografía para detección de puntos calientes (Hot Spots).',
      'Previene pérdidas de hasta 30% de producción anual.'
    ]
  },
  {
    id: 'mtto_aires',
    icon: '❄️',
    titulo: 'MTTO. AIRES ACONDICIONADOS',
    subtitulo: 'Mantenimiento preventivo de climatización.',
    detalles: [
      'Revisión de presión de gas refrigerante y amperaje.',
      'Limpieza profunda de serpentines, filtros y turbinas.',
      'Alarga la vida útil y optimiza consumo en equipos HVAC.'
    ]
  },
  {
    id: 'ingenierias_electricas',
    icon: '📐',
    titulo: 'INGENIERÍAS ELÉCTRICAS',
    subtitulo: 'Proyectos ejecutivos y gestoría técnica oficial.',
    detalles: [
      'Diagramas unifilares y cuadros de cargas.',
      'Memorias de cálculo térmico-magnético y tierras.',
      'Permisos y gestoría ante CFE, UVIE y Municipio.'
    ]
  },
  {
    id: 'ingenierias_renderizado',
    icon: '🖥️',
    titulo: 'INGENIERÍAS DE RENDERIZADO',
    subtitulo: 'Renders 3D fotorrealistas para arquitectura e ingeniería.',
    detalles: [
      'Modelado 3D fotorrealista para proyectos eléctricos y solares.',
      'Visualización de impacto visual para clientes y autoridades.',
      'Estudios de sombras y optimización de espacios.'
    ]
  },
  {
    id: 'sistemas_respaldo',
    icon: '🔋',
    titulo: 'SISTEMAS DE RESPALDO',
    subtitulo: 'Instalación de almacenamiento de energía y UPS.',
    detalles: [
      'Baterías de Litio (LiFePO4) o Gel de ciclo profundo.',
      'Respaldo crítico instantáneo para cargas esenciales.',
      'Garantiza continuidad operativa ante apagones de red.'
    ]
  },
  {
    id: 'sistema_backup',
    icon: '🔄',
    titulo: 'SISTEMA BACK UP',
    subtitulo: 'Transferencia automática ATS y plantas eléctricas.',
    detalles: [
      'Conmutación automática ATS para redes e híbridos solar-red.',
      'Generadores a diésel / gas y microredes integradas.',
      'Cero interrupciones operativas en la industria o comercio.'
    ]
  },
  {
    id: 'sistema_bombeo_solar',
    icon: '💧',
    titulo: 'SISTEMA BOMBEO SOLAR',
    subtitulo: 'Bombas solares sumergibles y de superficie.',
    detalles: [
      'Aplicación agrícola, ganadera, industrial y residencial.',
      'Cálculo dinámico de gasto hidráulico y presión HDT.',
      'Puesta en marcha con variadores de frecuencia de bombeo.'
    ]
  }
];

export const PERIODICIDADES = [
  { id: 'Trimestral', label: 'Trimestral (4 visitas/año)', visitasPorAno: 4 },
  { id: 'Cuatrimestral', label: 'Cuatrimestral (3 visitas/año)', visitasPorAno: 3 },
  { id: 'Bimensual', label: 'Bimensual (6 visitas/año)', visitasPorAno: 6 },
  { id: 'Mensual', label: 'Mensual (12 visitas/año)', visitasPorAno: 12 },
  { id: 'Semestral', label: 'Semestral (2 visitas/año)', visitasPorAno: 2 },
  { id: 'Anual', label: 'Anual (1 visita/año)', visitasPorAno: 1 },
  { id: 'Evento', label: 'Por Evento / Bajo Demanda', visitasPorAno: 1 }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
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

  return letras.trim() + ' PESOS ' + decimalPart.toString().padStart(2, '0') + '/100 M.N.';
};

export default function PolizaGarantiaTab({ initialBudgetId }: PolizaGarantiaTabProps) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  
  // Lista de pólizas guardadas en base de datos
  const [savedPolicies, setSavedPolicies] = useState<any[]>([]);
  const [activeTabMode, setActiveTabMode] = useState<'crear' | 'historial'>('crear');
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    folio: generarFolioProtocolo(),
    clienteFinal: '',
    clienteTelefono: '',
    clienteEmail: '',
    direccionInstalacion: '',
    nombreObra: '',
    conceptosSeleccionados: [] as string[],
    tipoCobertura: 'Mantenimiento Preventivo y Garantía de Ejecución Técnica',
    periodicidad: 'Trimestral',
    duracionAnos: 1,
    fechaInicio: new Date().toISOString().split('T')[0],
    montoTotal: 0,
    montoVisita: 0,
    observaciones: '',
    representanteEmpresa: 'Gustavo Corona Cervantes',
    airesAcondicionados: [] as Array<{ id: string; modelo: string; tonelaje: string; cantidad: number }>
  });

  const agregarAire = () => {
    setFormData(prev => ({
      ...prev,
      airesAcondicionados: [
        ...prev.airesAcondicionados,
        { id: Math.random().toString(36).substring(7), modelo: 'Mini split', tonelaje: '1 ton', cantidad: 1 }
      ]
    }));
  };

  const actualizarAire = (id: string, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      airesAcondicionados: prev.airesAcondicionados.map(a => 
        a.id === id ? { ...a, [field]: value } : a
      )
    }));
  };

  const eliminarAire = (id: string) => {
    setFormData(prev => ({
      ...prev,
      airesAcondicionados: prev.airesAcondicionados.filter(a => a.id !== id)
    }));
  };

  // Visitas calculadas automáticamente
  const [visitasCalculadas, setVisitasCalculadas] = useState<Array<{
    numero: number;
    fechaProgramada: string;
    concepto: string;
    estado: string;
  }>>([]);

  // Fetch budgets on load
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const data = await getPresupuestos();
        setBudgets(data);
        if (initialBudgetId && data.find((b: any) => b.id === initialBudgetId)) {
          handleBudgetSelection(initialBudgetId, data);
        }
      } catch (error) {
        console.error("Error al cargar presupuestos:", error);
      }
    };
    fetchBudgets();
    fetchSavedPolicies();
  }, [initialBudgetId]);

  // Cargar pólizas existentes de Supabase
  const fetchSavedPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('polizas_garantia')
        .select('*, visitas_mantenimiento_poliza(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSavedPolicies(data);
      }
    } catch (e) {
      console.warn("Tabla polizas_garantia no disponible aún en Supabase.", e);
    }
  };

  // Recalcular visitas cuando cambian fechas, duración o periodicidad
  useEffect(() => {
    recalcularVisitas();
  }, [formData.fechaInicio, formData.duracionAnos, formData.periodicidad, formData.conceptosSeleccionados]);

  const recalcularVisitas = () => {
    if (!formData.fechaInicio) return;
    const start = new Date(formData.fechaInicio + 'T00:00:00');
    const periodicidadObj = PERIODICIDADES.find(p => p.id === formData.periodicidad) || PERIODICIDADES[0];
    
    let totalVisitas = Math.round(periodicidadObj.visitasPorAno * formData.duracionAnos);
    if (formData.periodicidad === 'Evento') totalVisitas = 1;

    const intervalMonths = 12 / periodicidadObj.visitasPorAno;
    const arrayVisitas = [];

    const conceptosText = formData.conceptosSeleccionados
      .map(id => CATALOGO_CONCEPTOS.find(c => c.id === id)?.titulo)
      .filter(Boolean)
      .join(', ') || 'Servicio de Mantenimiento Preventivo General';

    for (let i = 0; i < totalVisitas; i++) {
      const visitDate = new Date(start);
      if (formData.periodicidad !== 'Evento') {
        visitDate.setMonth(start.getMonth() + Math.round(i * intervalMonths));
      }
      arrayVisitas.push({
        numero: i + 1,
        fechaProgramada: visitDate.toISOString().split('T')[0],
        concepto: `Visita ${i + 1} - ${conceptosText}`,
        estado: 'pendiente'
      });
    }

    setVisitasCalculadas(arrayVisitas);
  };

  // Selección de presupuesto base
  const handleBudgetSelection = async (id: string, budgetList = budgets) => {
    setSelectedBudget(id);
    const budget = budgetList.find(b => b.id === id);
    if (!budget) return;

    try {
      setIsLoadingBudget(true);
      const details = await getPresupuestoDetails(id);

      let fetchedAddress = '';
      let fetchedPhone = '';
      let fetchedEmail = '';

      if (budget.client_name) {
        const { data: clientData } = await supabase
          .from('clientes')
          .select('direccion, telefono, email')
          .ilike('nombre_razon_social', budget.client_name.trim())
          .limit(1);

        if (clientData && clientData.length > 0) {
          fetchedAddress = clientData[0].direccion || '';
          fetchedPhone = clientData[0].telefono || '';
          fetchedEmail = clientData[0].email || '';
        }
      }

      const obra = budget.project_name || budget.nombre_proyecto || budget.name || 'Póliza de Mantenimiento';
      const cliente = budget.client_name || '';

      setFormData(prev => ({
        ...prev,
        clienteFinal: cliente,
        clienteTelefono: fetchedPhone,
        clienteEmail: fetchedEmail,
        direccionInstalacion: fetchedAddress || details?.encabezado?.direccion_obra || details?.encabezado?.lugar || '',
        nombreObra: obra,
        folio: generarFolioProtocolo(obra, cliente),
        montoTotal: Number(budget.total || budget.monto || 0) * 0.10 // Default estimado 10% del proyecto
      }));
    } catch (error) {
      console.error("Error al obtener detalles del presupuesto:", error);
    } finally {
      setIsLoadingBudget(false);
    }
  };

  // Toggle de conceptos
  const toggleConcepto = (conceptId: string) => {
    setFormData(prev => {
      const exists = prev.conceptosSeleccionados.includes(conceptId);
      const updated = exists
        ? prev.conceptosSeleccionados.filter(id => id !== conceptId)
        : [...prev.conceptosSeleccionados, conceptId];
      return { ...prev, conceptosSeleccionados: updated };
    });
  };

  // Cálculo de Fecha de Término
  const getFechaFin = () => {
    if (!formData.fechaInicio) return '';
    const date = new Date(formData.fechaInicio + 'T00:00:00');
    date.setFullYear(date.getFullYear() + Number(formData.duracionAnos));
    return date.toISOString().split('T')[0];
  };

  const parseFechaText = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Generación de PDF (Abre en ventana nativa Blob)
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const conceptosInfo = formData.conceptosSeleccionados
        .map(id => CATALOGO_CONCEPTOS.find(c => c.id === id))
        .filter(Boolean);

      const logoBase64 = await getBase64ImageFromUrl(window.location.origin + '/Logo_esol_w.png');
      const logoSrc = logoBase64 || (window.location.origin + '/Logo_esol_w.png');

      const element = document.createElement('div');
      element.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Montserrat:wght@400;500;600;700&display=swap');
          
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; }
          
          .letter-sheet {
            width: 216mm;
            height: 279mm;
            padding: 12mm 15mm;
            margin: 0 auto;
            background: #ffffff;
            font-size: 10px;
            line-height: 1.3;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          .header-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            padding: 14px 18px;
            border-radius: 10px;
            margin-bottom: 12px;
            border-bottom: 4px solid #d4af37;
          }
          .header-title {
            font-family: 'Cinzel', serif;
            font-size: 17px;
            margin: 0;
            color: #d4af37;
            letter-spacing: 1.5px;
          }
          .header-subtitle {
            font-size: 8.5px;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #cbd5e1;
          }

          .info-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
          }
          .info-item {
            flex: 1 1 45%;
            background: #f8fafc;
            padding: 8px 10px;
            border-radius: 6px;
            border-left: 3px solid #d4af37;
          }
          .info-label {
            font-size: 8.5px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 10px;
            font-weight: 600;
            color: #0f172a;
          }

          .section-title {
            font-family: 'Cinzel', serif;
            font-size: 11px;
            color: #0f172a;
            border-bottom: 1.5px solid #d4af37;
            padding-bottom: 3px;
            margin-bottom: 8px;
            margin-top: 6px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .concepts-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 10px;
          }
          .concept-card {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
          }
          .concept-header {
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .concept-desc {
            font-size: 8.5px;
            color: #334155;
            margin-bottom: 4px;
            line-height: 1.25;
          }
          .concept-bullets {
            margin: 0;
            padding-left: 14px;
            font-size: 8.5px;
            color: #475569;
            list-style-type: disc;
          }
          .concept-bullets li {
            margin-bottom: 2px;
            text-align: left;
          }

          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 9px;
          }
          .schedule-table th {
            background: #0f172a;
            color: #ffffff;
            font-weight: 700;
            padding: 5px 8px;
            text-align: left;
            text-transform: uppercase;
            font-size: 8px;
          }
          .schedule-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 500;
            color: #1e293b;
          }

          .legal-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px;
            margin-bottom: 10px;
            font-size: 8px;
            color: #334155;
            line-height: 1.25;
            text-align: justify;
          }
          .legal-box h5 {
            margin: 0 0 3px 0;
            font-size: 8.5px;
            color: #0f172a;
            text-transform: uppercase;
            font-weight: 700;
          }

          .signatures {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            padding-top: 8px;
          }
          .sig-box {
            width: 45%;
            text-align: center;
          }
          .sig-line {
            border-top: 1px solid #0f172a;
            margin-top: 30px;
            margin-bottom: 4px;
          }
          .sig-name { font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
          .sig-role { font-size: 8.5px; color: #64748b; font-weight: 500; }
        </style>

        <div class="letter-sheet">
          <div class="header-box" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; min-height: 64px;">
            <div style="display: flex; align-items: center; gap: 14px; height: 100%;">
              <img src="${logoSrc}" style="height: 44px; width: auto; display: block; object-fit: contain;" alt="Esol Energias" />
              <div style="display: flex; flex-direction: column; justify-content: center; text-align: left;">
                <h2 class="header-title" style="margin: 0; font-size: 18px; font-weight: 700; color: #d4af37; letter-spacing: 1.5px; line-height: 1.1; font-family: 'Cinzel', serif;">ESOL ENERGIAS</h2>
                <div class="header-subtitle" style="margin-top: 3px; color: #cbd5e1; font-size: 8.5px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; line-height: 1.1;">INGENIERÍA ESPECIALIZADA & MANTENIMIENTO</div>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item" style="flex: 1 1 30%;">
              <div class="info-label">Titular de la Póliza</div>
              <div class="info-value">${(formData.clienteFinal || 'CLIENTE GENERAL').toUpperCase()}</div>
            </div>
            <div class="info-item" style="flex: 1 1 30%;">
              <div class="info-label">Obra / Proyecto</div>
              <div class="info-value">${formData.nombreObra.toUpperCase()}</div>
            </div>
            <div class="info-item" style="flex: 1 1 30%; background: #fef08a; border-left: 4px solid #ca8a04; padding: 0; box-sizing: border-box; position: relative; min-height: 48px;">
              <div style="position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); text-align: center;">
                <div style="color: #854d0e; font-size: 8px; font-weight: 700; text-transform: uppercase; line-height: 1; margin: 0;">Folio de Póliza</div>
                <div style="color: #713f12; font-size: 11.5px; font-weight: 800; line-height: 1; margin-top: 5px;">${formData.folio}</div>
              </div>
            </div>
            <div class="info-item" style="flex: 1 1 30%;">
              <div class="info-label">Ubicación física</div>
              <div class="info-value">${formData.direccionInstalacion || 'DIRECCIÓN NO ESPECIFICADA'}</div>
            </div>
            <div class="info-item" style="flex: 2 1 60%;">
              <div class="info-label">Vigencia y Periodicidad</div>
              <div class="info-value">
                ${formData.duracionAnos} AÑO(S) (${formData.periodicidad.toUpperCase()}) | 
                <span style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${parseFechaText(formData.fechaInicio)}</span> 
                al 
                <span style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${parseFechaText(getFechaFin())}</span>
              </div>
            </div>
          </div>

          <div class="section-title">COBERTURAS Y ESPECIALIDADES AMPARADAS</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <!-- Descripción General -->
            <div class="concept-card">
              <div class="concept-header" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">DESCRIPCIÓN GENERAL DE SERVICIOS</div>
              ${conceptosInfo.map(c => `
                <div style="margin-bottom: 8px;">
                  <strong style="color: #0f172a; font-size: 9px;">${c?.icon} ${c?.titulo}</strong><br/>
                  <span style="color: #334155; font-size: 8.5px;">${c?.subtitulo}</span>
                </div>
              `).join('')}
            </div>

            <!-- Inventario Específico -->
            <div class="concept-card" style="background: #f8fafc; border-left: 3px solid #0f172a;">
              <div class="concept-header" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">INVENTARIO DE EQUIPOS AMPARADOS</div>
              ${formData.airesAcondicionados.length > 0 ? `
                <ul style="margin: 0; padding-left: 14px; font-size: 8.5px; color: #1e293b; list-style-type: disc;">
                  ${formData.airesAcondicionados.map(a => `
                    <li style="margin-bottom: 4px;">
                      <strong>${a.cantidad}x ${a.modelo}</strong><br/>
                      <span style="color:#64748b;">Capacidad: ${a.tonelaje}</span>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <div style="color: #64748b; font-size: 8.5px;">Mantenimiento preventivo general del sistema especificado.<br/>(No se detallaron equipos individuales).</div>
              `}
            </div>
          </div>

          ${formData.conceptosSeleccionados.includes('mtto_aires') ? `
            <div class="section-title">ALCANCE DETALLADO: MTTO. AIRES ACONDICIONADOS</div>
            <div class="concepts-container" style="margin-bottom: 12px;">
              <div class="concept-card">
                <div class="concept-header">Unidad Evaporadora (Interior)</div>
                <ul class="concept-bullets">
                  <li>Desarmado de cubiertas externas para lavado profundo.</li>
                  <li>Aplicación de desincrustante químico biodegradable y antibacterial en serpentín.</li>
                  <li>Limpieza a alta presión de turbina y filtros de aire.</li>
                  <li>Lavado de charola de condensados y desobstrucción de drenajes.</li>
                  <li>Colocación de tabletas de cloro de disolución lenta.</li>
                </ul>
              </div>
              <div class="concept-card">
                <div class="concept-header">Unidad Condensadora (Exterior)</div>
                <ul class="concept-bullets">
                  <li>Retiro de suciedad ambiental de serpentines mediante hidrolavado a presión controlada.</li>
                  <li>Peinado manual de aletas de aluminio dañadas para restaurar flujo de aire.</li>
                  <li>Revisión de soportes metálicos y anclajes antivibración.</li>
                  <li>Inspección acústica y de vibración del compresor y aspas.</li>
                </ul>
              </div>
              <div class="concept-card">
                <div class="concept-header">Diagnóstico Eléctrico y Operativo</div>
                <ul class="concept-bullets">
                  <li>Medición y registro de voltaje de línea y consumo de corriente (amperaje de arranque y trabajo).</li>
                  <li>Verificación de estado de capacitores de marcha y contactores.</li>
                  <li>Ajuste mecánico y reapriete de terminales eléctricas de fuerza y control.</li>
                  <li>Monitoreo de presiones de gas refrigerante (R-410A o R-22).</li>
                </ul>
              </div>
              <div class="concept-card">
                <div class="concept-header">Reporte Digital y Gestión de Activos</div>
                <ul class="concept-bullets">
                  <li>Identificación única de cada equipo en base de datos.</li>
                  <li>Registro fotográfico georreferenciado (antes y después del servicio).</li>
                  <li>Acceso inmediato del Poder Judicial a la nube de reportes para validar conformidad del servicio de manera remota.</li>
                </ul>
              </div>
            </div>
          ` : ''}

          <div class="section-title">CALENDARIO PROGRAMADO DE MANTENIMIENTO PREVENTIVO</div>
          <table class="schedule-table">
            <thead>
              <tr>
                <th>Visita</th>
                <th>Fecha Estimada</th>
                <th>Concepto / Alcance</th>
                <th>Estatus Garantía</th>
              </tr>
            </thead>
            <tbody>
              ${visitasCalculadas.slice(0, 6).map((v) => `
                <tr>
                  <td><strong>Visita ${v.numero}</strong></td>
                  <td>${parseFechaText(v.fechaProgramada)}</td>
                  <td>${v.concepto}</td>
                  <td><span style="color: #15803d; font-weight: 700;">Programada</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="legal-box">
            <h5>FUNDAMENTO LEGAL Y CONDICIONES GENERALES DE GARANTÍA</h5>
            La presente Póliza avala la mano de obra, ejecución de ingeniería y parámetros operativos de los servicios listados, en cumplimiento estricto con la <strong>NOM-001-SEDE-2012/2018</strong>, el <strong>Código de Red (RES/550/2016)</strong> y los Arts. 2142 al 2162 del <strong>Código Civil Federal</strong> sobre vicios ocultos, así como Arts. 77 a 81 de la <strong>Ley Federal de Protección al Consumidor (PROFECO)</strong>. 
            <br/><strong>Condicionante de Validez:</strong> La garantía de instalación y servicio queda estrictamente supeditada al cumplimiento puntual del calendario de inspecciones preventivas aquí pactado. La manipulación por terceros ajenos a ESOL, modificaciones no autorizadas o descargas eléctricas atmosféricas eximen a ESOL de responsabilidad. La garantía de equipos de fábrica (paneles, inversores, baterías, compresores) se rige de forma independiente bajo los términos de sus fabricantes.
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${(formData.representanteEmpresa || 'Gustavo Corona Cervantes').toUpperCase()}</div>
              <div class="sig-role">ESOL ENERGIAS — REPRESENTANTE LEGAL Y TÉCNICO</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${(formData.clienteFinal || 'EL CLIENTE').toUpperCase()}</div>
              <div class="sig-role">TITULAR CONTRATANTE</div>
            </div>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Poliza_Garantia_${formData.folio}_${formData.clienteFinal.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      document.body.appendChild(element);
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      document.body.removeChild(element);
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');

    } catch (error) {
      console.error("Error al generar PDF de Póliza:", error);
      alert("Hubo un problema al crear la Póliza PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Generación de Recibo de Pago PDF
  const handleGenerateReceiptPDF = async () => {
    setIsGeneratingReceipt(true);

    try {
      const conceptosInfo = formData.conceptosSeleccionados
        .map(id => CATALOGO_CONCEPTOS.find(c => c.id === id))
        .filter(Boolean);

      const conceptosNombres = conceptosInfo.map(c => c?.titulo).join(', ') || 'Cobertura General';
      const montoPorVisita = formData.montoTotal / (visitasCalculadas.length || 1);

      const logoBase64 = await getBase64ImageFromUrl(window.location.origin + '/Logo_esol_w.png');
      const logoSrc = logoBase64 || (window.location.origin + '/Logo_esol_w.png');

      const element = document.createElement('div');
      element.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap');
          
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; }
          
          .letter-sheet {
            width: 216mm;
            height: 279mm;
            padding: 14mm 16mm;
            margin: 0 auto;
            background: #ffffff;
            font-size: 10px;
            line-height: 1.35;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            padding: 14px 18px;
            border-radius: 10px;
            border-bottom: 4px solid #d4af37;
            min-height: 64px;
          }

          .brand-title {
            font-family: 'Cinzel', serif;
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            color: #d4af37;
            letter-spacing: 1.5px;
            line-height: 1.1;
          }
          .brand-sub {
            font-size: 8.5px;
            font-weight: 600;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #cbd5e1;
            line-height: 1.1;
          }
          
          .receipt-badge {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
          }
          .receipt-title {
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 1px;
            line-height: 1;
          }
          .receipt-sub {
            font-size: 8.5px;
            color: #cbd5e1;
            margin-top: 3px;
            line-height: 1;
          }
          .receipt-number {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 24px;
            background: rgba(212, 175, 55, 0.25);
            color: #fef08a;
            padding: 0 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            margin-top: 5px;
            border: 1px solid rgba(212, 175, 55, 0.4);
            line-height: 1;
            box-sizing: border-box;
          }

          .section-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            margin-top: 14px;
          }
          .card-title {
            font-size: 9.5px;
            font-weight: 700;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
          }

          .grid-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .info-line {
            font-size: 9.5px;
            color: #334155;
          }
          .info-line strong {
            color: #0f172a;
            font-weight: 600;
          }

          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
          }
          .details-table th {
            background: #0f172a;
            color: #ffffff;
            padding: 8px 10px;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
          }
          .details-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9.5px;
            color: #1e293b;
          }

          .visits-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            margin-top: 8px;
          }
          .visit-pill {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            font-size: 8.5px;
          }

          .amount-highlight {
            background: #fefce8;
            border: 1.5px solid #fde047;
            border-radius: 8px;
            padding: 12px 16px;
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .words-box {
            flex: 1;
            padding-right: 16px;
          }
          .words-label {
            font-size: 8.5px;
            font-weight: 700;
            color: #854d0e;
            text-transform: uppercase;
          }
          .words-value {
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 3px;
          }

          .total-box {
            background: #0f172a;
            color: #ffffff;
            padding: 10px 16px;
            border-radius: 6px;
            text-align: right;
            border-right: 4px solid #d4af37;
          }
          .total-label {
            font-size: 8.5px;
            color: #cbd5e1;
            text-transform: uppercase;
          }
          .total-value {
            font-size: 15px;
            font-weight: 700;
            color: #fef08a;
            margin-top: 2px;
          }

          .legal-note {
            font-size: 8.5px;
            color: #64748b;
            text-align: justify;
            margin-top: 14px;
            padding: 8px 12px;
            background: #f8fafc;
            border-left: 3px solid #cbd5e1;
            border-radius: 4px;
          }

          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 25px;
            padding-top: 10px;
          }
          .sig-box {
            width: 42%;
            text-align: center;
          }
          .sig-line {
            border-bottom: 1.5px solid #0f172a;
            margin-bottom: 6px;
            height: 35px;
          }
          .sig-name {
            font-weight: 700;
            font-size: 9px;
            color: #0f172a;
          }
          .sig-role {
            font-size: 7.5px;
            color: #64748b;
            margin-top: 2px;
            font-weight: 600;
          }
        </style>

        <div class="letter-sheet">
          <div>
            <!-- Header -->
            <div class="header-box" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; min-height: 64px;">
              <div style="display: flex; align-items: center; gap: 14px; height: 100%;">
                <img src="${logoSrc}" style="height: 44px; width: auto; display: block; object-fit: contain;" alt="Esol Energias" />
                <div style="display: flex; flex-direction: column; justify-content: center; text-align: left;">
                  <h1 class="brand-title" style="margin: 0; font-size: 18px; font-weight: 700; color: #d4af37; letter-spacing: 1.5px; line-height: 1.1; font-family: 'Cinzel', serif;">ESOL ENERGIAS</h1>
                  <div class="brand-sub" style="margin-top: 3px; color: #cbd5e1; font-size: 8.5px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; line-height: 1.1;">INGENIERÍA ESPECIALIZADA & MANTENIMIENTO</div>
                </div>
              </div>
              <div class="receipt-badge" style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center;">
                <div class="receipt-title" style="font-size: 15px; font-weight: 700; color: #ffffff; letter-spacing: 1px; line-height: 1;">RECIBO DE PAGO</div>
                <div class="receipt-number" style="display: flex; align-items: center; justify-content: center; height: 26px; background: rgba(212, 175, 55, 0.25); color: #fef08a; padding: 0 12px; border-radius: 4px; font-size: 11.5px; font-weight: 700; margin-top: 12px; border: 1px solid rgba(212, 175, 55, 0.4); line-height: 1; box-sizing: border-box;">
                  REC-${formData.folio}
                </div>
              </div>
            </div>

            <!-- Details Card -->
            <div class="section-card">
              <div class="card-title">Información del Cliente y Póliza Contratada</div>
              <div class="grid-2col">
                <div>
                  <div class="info-line"><strong>Recibí de:</strong> ${(formData.clienteFinal || 'EL CLIENTE').toUpperCase()}</div>
                  <div class="info-line" style="margin-top: 4px;"><strong>Obra / Proyecto:</strong> ${(formData.nombreObra || 'N/A').toUpperCase()}</div>
                  <div class="info-line" style="margin-top: 4px;"><strong>Dirección:</strong> ${formData.direccionInstalacion || 'N/A'}</div>
                </div>
                <div>
                  <div class="info-line"><strong>Póliza Referencia:</strong> ${formData.folio}</div>
                  <div class="info-line" style="margin-top: 4px;"><strong>Fecha de Emisión:</strong> ${parseFechaText(formData.fechaInicio)}</div>
                  <div class="info-line" style="margin-top: 4px;"><strong>Vigencia / Periodicidad:</strong> ${formData.duracionAnos} Año(s) • ${formData.periodicidad}</div>
                </div>
              </div>
            </div>

            <!-- Concept Table -->
            <table class="details-table">
              <thead>
                <tr>
                  <th style="width: 55%;">CONCEPTO / DESCRIPCIÓN DE LA PÓLIZA</th>
                  <th style="width: 20%; text-align: center;">PERIODICIDAD</th>
                  <th style="width: 25%; text-align: right;">IMPORTE PACTADO</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Pago por Póliza de Garantía de Ejecución y Mantenimiento Preventivo</strong>
                    <div style="font-size: 8.5px; color: #475569; margin-top: 4px;">
                      <strong>Ingenierías amparadas:</strong> ${conceptosNombres}
                      ${formData.conceptosSeleccionados.includes('mtto_aires') && formData.airesAcondicionados.length > 0 ? `<br/><strong>Equipos HVAC:</strong> ${formData.airesAcondicionados.map(a => `${a.cantidad}x ${a.modelo} (${a.tonelaje})`).join(', ')}` : ''}
                      <br/>
                      Ampara inspecciones programadas (${visitasCalculadas.length} visita(s) totales), revisiones normativas (NOM-001-SEDE / Código de Red) y entrega de reportes técnicos.
                    </div>
                  </td>
                  <td style="text-align: center; vertical-align: middle;">
                    <strong>${formData.periodicidad}</strong>
                    <div style="font-size: 8px; color: #64748b;">(${visitasCalculadas.length} visitas totales)</div>
                  </td>
                  <td style="text-align: right; vertical-align: middle; font-size: 13px; font-weight: 700; color: #0f172a;">
                    $${formData.montoTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MXN
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Desglose por Visita -->
            <div class="section-card" style="margin-top: 10px;">
              <div class="card-title">Calendario de Pagos / Desglose por Visita de Mantenimiento</div>
              <div class="visits-grid">
                ${visitasCalculadas.map(v => `
                  <div class="visit-pill">
                    <span>Visita #${v.numero} (${parseFechaText(v.fechaProgramada)}):</span>
                    <strong>$${montoPorVisita.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MXN</strong>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Amount Highlight Box -->
            <div class="amount-highlight">
              <div class="words-box">
                <div class="words-label">IMPORTE EN LETRA:</div>
                <div class="words-value">${numeroALetras(formData.montoTotal)}</div>
              </div>
              <div class="total-box">
                <div class="total-label">MONTO TOTAL MXN</div>
                <div class="total-value">$${formData.montoTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>

            <!-- Legal Note -->
            <div class="legal-note">
              <strong>Términos del Comprobante:</strong> Este documento valida el recibo de pago o acuerdo contractual para la Póliza de Garantía Folio <strong>${formData.folio}</strong>. La vigencia de las garantias está supeditada al cumplimiento del calendario de mantenimiento preventivo estipulado.
            </div>
          </div>

          <!-- Signatures -->
          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${(formData.representanteEmpresa || 'GUSTAVO CORONA CERVANTES').toUpperCase()}</div>
              <div class="sig-role">ESOL ENERGIAS (EMISOR)</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${(formData.clienteFinal || 'EL CLIENTE').toUpperCase()}</div>
              <div class="sig-role">TITULAR / CONTRATANTE (RECIBÍ DE CONFORMIDAD)</div>
            </div>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Recibo_Pago_Poliza_${formData.folio}_${(formData.clienteFinal || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      document.body.appendChild(element);
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      document.body.removeChild(element);
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');

    } catch (error) {
      console.error("Error al generar Recibo de Pago PDF:", error);
      alert("Hubo un problema al crear el Recibo de Pago PDF.");
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  // Guardar Póliza y Visitas en Supabase
  const handleSavePolicyToSupabase = async () => {
    if (!formData.clienteFinal) {
      alert("Por favor indica el nombre del Titular o selecciona un presupuesto base.");
      return;
    }

    try {
      setIsSavingSupabase(true);
      
      const payloadPoliza = {
        folio: formData.folio,
        presupuesto_id: selectedBudget || null,
        cliente_nombre: formData.clienteFinal,
        cliente_direccion: formData.direccionInstalacion,
        cliente_telefono: formData.clienteTelefono,
        cliente_email: formData.clienteEmail,
        nombre_obra: formData.nombreObra,
        conceptos_incluidos: formData.conceptosSeleccionados,
        tipo_cobertura: formData.tipoCobertura,
        periodicidad: formData.periodicidad,
        duracion_anos: Number(formData.duracionAnos),
        fecha_inicio: formData.fechaInicio,
        fecha_fin: getFechaFin(),
        monto_total: Number(formData.montoTotal),
        monto_visita: Number(formData.montoVisita || (formData.montoTotal / (visitasCalculadas.length || 1))),
        estado: 'activa',
        observaciones: formData.observaciones
      };

      const { data: polizaRes, error: polizaErr } = await supabase
        .from('polizas_garantia')
        .insert([payloadPoliza])
        .select()
        .single();

      if (polizaErr) {
        if (polizaErr.code === '42P01') {
          alert("La tabla 'polizas_garantia' no ha sido creada aún en Supabase. Ejecuta el script SQL 'supabase_polizas_garantia.sql' que generamos en el proyecto.");
          return;
        }
        throw polizaErr;
      }

      if (polizaRes && visitasCalculadas.length > 0) {
        const payloadVisitas = visitasCalculadas.map(v => ({
          poliza_id: polizaRes.id,
          numero_visita: v.numero,
          fecha_programada: v.fechaProgramada,
          concepto_servicio: v.concepto,
          estado: 'pendiente'
        }));

        await supabase.from('visitas_mantenimiento_poliza').insert(payloadVisitas);
      }

      alert(`¡Póliza ${formData.folio} y ${visitasCalculadas.length} visitas de mantenimiento guardadas con éxito en la base de datos!`);
      setFormData(prev => ({ ...prev, folio: generarFolioProtocolo() }));
      fetchSavedPolicies();

    } catch (err: any) {
      console.error("Error al guardar en Supabase:", err);
      alert("Error al guardar en base de datos: " + (err.message || "Verifica conexión"));
    } finally {
      setIsSavingSupabase(false);
    }
  };

  // Enviar alerta / recordatorio de mantenimiento vía WhatsApp / Webhook
  const handleSendVisitReminder = (visita: any, poliza: any) => {
    const text = `Hola *${poliza.cliente_nombre}*, te saludamos de ESOL Energías. ⚡\n\nRecordatorio de tu *Póliza de Garantía (${poliza.folio})*:\nTienes programado tu *Mantenimiento Preventivo Visita #${visita.numero_visita}* para la fecha *${parseFechaText(visita.fecha_programada)}* en la obra *${poliza.nombre_obra}*.\n\nPor favor confírmanos si la fecha y horario te convienen para coordinar a nuestro equipo de técnicos certificados.`;
    const encoded = encodeURIComponent(text);
    const phone = poliza.cliente_telefono ? poliza.cliente_telefono.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Subtabs de vista: Crear nueva vs Historial */}
      <div className="flex justify-between items-center bg-dark-2 p-2 rounded-xl border border-dark-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTabMode('crear')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTabMode === 'crear' ? 'bg-gold text-dark-1 font-semibold' : 'text-cream-muted hover:text-cream hover:bg-dark-3'
            }`}
          >
            <Shield className="w-4 h-4" />
            Emisión de Póliza
          </button>

          <button
            onClick={() => setActiveTabMode('historial')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTabMode === 'historial' ? 'bg-gold text-dark-1 font-semibold' : 'text-cream-muted hover:text-cream hover:bg-dark-3'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Pólizas y Visitas Registradas ({savedPolicies.length})
          </button>
        </div>

        <div className="text-xs text-cream-muted font-mono px-3">
          Folio Activo: <span className="text-gold font-bold">{formData.folio}</span>
        </div>
      </div>

      {activeTabMode === 'crear' && (
        <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl space-y-8">
          {/* Header */}
          <div className="border-b border-dark-4 pb-4">
            <h3 className="text-xl font-light text-cream flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" />
              Generador de Pólizas de Garantía y Mantenimiento Multidisciplinario
            </h3>
            <p className="text-sm text-cream-muted mt-1">
              Configura garantías respaldadas legalmente bajo NOM-001-SEDE, Código de Red y PROFECO para instalaciones eléctricas, solares, climatización y respaldos.
            </p>
          </div>

          {/* Sección 1: Selección de Presupuesto y Datos Generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-dark-3/40 p-4 rounded-xl border border-dark-4">
            <div>
              <label className="block text-xs font-semibold text-cream-muted mb-1 uppercase tracking-wider">
                1. Presupuesto / Obra Base
              </label>
              <select
                value={selectedBudget}
                onChange={(e) => handleBudgetSelection(e.target.value)}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
              >
                <option value="">-- Seleccionar de Cotizador --</option>
                {budgets.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.client_name || 'Sin Cliente'} - {b.project_name || b.nombre_proyecto || b.name || 'Sin Obra'}
                  </option>
                ))}
              </select>
              {isLoadingBudget && <p className="text-xs text-gold mt-1 animate-pulse">Cargando datos de obra...</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-muted mb-1 uppercase tracking-wider flex justify-between items-center">
                <span>Folio Protocolizado</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, folio: generarFolioProtocolo(prev.nombreObra, prev.clienteFinal) }))}
                  className="text-[10px] text-gold hover:underline font-normal cursor-pointer"
                  title="Regenerar Folio con nomenclatura estándar"
                >
                  ⚡ Auto-generar
                </button>
              </label>
              <input
                type="text"
                value={formData.folio}
                onChange={e => setFormData({ ...formData, folio: e.target.value.toUpperCase() })}
                className="w-full bg-dark-1 border border-gold/40 rounded-lg px-3 py-2 text-gold font-mono font-bold focus:border-gold outline-none text-sm"
                placeholder="POL-2608-HL-001"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-muted mb-1 uppercase tracking-wider">
                Titular / Cliente
              </label>
              <input
                type="text"
                value={formData.clienteFinal}
                onChange={e => {
                  const newClient = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    clienteFinal: newClient,
                    folio: prev.nombreObra ? prev.folio : generarFolioProtocolo(prev.nombreObra, newClient)
                  }));
                }}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                placeholder="Nombre o Razón Social"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-muted mb-1 uppercase tracking-wider">
                Nombre de la Obra / Proyecto
              </label>
              <input
                type="text"
                value={formData.nombreObra}
                onChange={e => {
                  const newObra = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    nombreObra: newObra,
                    folio: generarFolioProtocolo(newObra, prev.clienteFinal)
                  }));
                }}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                placeholder="Ej. Residencia Lomas / Planta Industrial"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-cream-muted mb-1 uppercase tracking-wider">
                Dirección Física de la Instalación
              </label>
              <input
                type="text"
                value={formData.direccionInstalacion}
                onChange={e => setFormData({ ...formData, direccionInstalacion: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                placeholder="Calle, Número, Colonia, Ciudad, Estado"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-muted mb-1 uppercase tracking-wider">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={formData.clienteTelefono}
                onChange={e => setFormData({ ...formData, clienteTelefono: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                placeholder="WhatsApp (10 dígitos)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-muted mb-1 uppercase tracking-wider">
                Firma por parte de ESOL
              </label>
              <input
                type="text"
                value={formData.representanteEmpresa}
                onChange={e => setFormData({ ...formData, representanteEmpresa: e.target.value })}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                placeholder="Nombre del Ing. o Representante"
              />
            </div>
          </div>

          {/* Sección 2: Selección de Conceptos / Servicios Cobertura */}
          <div>
            <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              2. Selección de Servicios e Ingenierías Amparadas en la Póliza
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATALOGO_CONCEPTOS.map(concepto => {
                const isSelected = formData.conceptosSeleccionados.includes(concepto.id);
                return (
                  <div
                    key={concepto.id}
                    onClick={() => toggleConcepto(concepto.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-gold/10 border-gold shadow-lg shadow-gold/5'
                        : 'bg-dark-3/50 border-dark-4 hover:border-cream-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{concepto.icon}</span>
                        <h5 className="font-semibold text-cream text-sm">{concepto.titulo}</h5>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border border-dark-4 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-cream-muted leading-snug">{concepto.subtitulo}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalles Específicos: Aires Acondicionados */}
          {formData.conceptosSeleccionados.includes('mtto_aires') && (
            <div className="bg-dark-3/40 p-4 rounded-xl border border-dark-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gold uppercase tracking-wider flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  Inventario de Equipos HVAC a Mantener
                </h4>
                <button
                  onClick={agregarAire}
                  className="bg-gold/10 hover:bg-gold/20 text-gold px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-gold/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Equipo
                </button>
              </div>

              {formData.airesAcondicionados.length === 0 ? (
                <div className="text-center p-4 bg-dark-2 rounded-lg border border-dark-4">
                  <p className="text-xs text-cream-muted">No has agregado equipos. Agrega los aires acondicionados que cubrirá la póliza.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.airesAcondicionados.map((aire, index) => (
                    <div key={aire.id} className="flex flex-col sm:flex-row gap-3 items-end bg-dark-2 p-3 rounded-lg border border-dark-4">
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-semibold text-cream-muted mb-1 uppercase">Modelo</label>
                        <select
                          value={aire.modelo}
                          onChange={e => actualizarAire(aire.id, 'modelo', e.target.value)}
                          className="w-full bg-dark-1 border border-dark-4 rounded-lg px-2 py-1.5 text-cream focus:border-gold outline-none text-xs"
                        >
                          <option value="Mini split">Mini split</option>
                          <option value="Cassette">Cassette</option>
                          <option value="Fan coil">Fan coil</option>
                          <option value="Paquete">Paquete</option>
                        </select>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-semibold text-cream-muted mb-1 uppercase">Tonelaje</label>
                        <select
                          value={aire.tonelaje}
                          onChange={e => actualizarAire(aire.id, 'tonelaje', e.target.value)}
                          className="w-full bg-dark-1 border border-dark-4 rounded-lg px-2 py-1.5 text-cream focus:border-gold outline-none text-xs"
                        >
                          <option value="1 ton">1 Ton</option>
                          <option value="1.5 ton">1.5 Ton</option>
                          <option value="2 ton">2 Ton</option>
                          <option value="3 ton">3 Ton</option>
                          <option value="4 ton">4 Ton</option>
                          <option value="5 ton">5 Ton</option>
                        </select>
                      </div>
                      <div className="w-full sm:w-24">
                        <label className="block text-[10px] font-semibold text-cream-muted mb-1 uppercase">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={aire.cantidad}
                          onChange={e => actualizarAire(aire.id, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-full bg-dark-1 border border-dark-4 rounded-lg px-2 py-1.5 text-cream focus:border-gold outline-none text-xs text-center"
                        />
                      </div>
                      <button
                        onClick={() => eliminarAire(aire.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 rounded-lg border border-red-500/20 transition-colors shrink-0 mb-[1px]"
                        title="Eliminar equipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sección 3: Periodicidad, Duración y Programación de Mantenimiento */}
          <div className="bg-dark-3/40 p-4 rounded-xl border border-dark-4 space-y-4">
            <h4 className="text-sm font-semibold text-gold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              3. Programación de Periodicidad y Visitas de Mantenimiento Preventivo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-cream-muted mb-1">Periodicidad de Mantenimiento</label>
                <select
                  value={formData.periodicidad}
                  onChange={e => setFormData({ ...formData, periodicidad: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                >
                  {PERIODICIDADES.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cream-muted mb-1">Duración (Años)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.duracionAnos}
                  onChange={e => setFormData({ ...formData, duracionAnos: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cream-muted mb-1">Fecha de Inicio de Póliza</label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cream-muted mb-1">Monto Total Póliza (MXN)</label>
                <div className="relative">
                  <span className="absolute left-3 top-[9px] text-cream-muted">$</span>
                  <input
                    type="text"
                    value={formData.montoTotal ? formData.montoTotal.toLocaleString('en-US') : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setFormData({ ...formData, montoTotal: parseFloat(val) || 0 });
                    }}
                    className="w-full bg-dark-1 border border-dark-4 rounded-lg pl-7 pr-3 py-2 text-cream focus:border-gold outline-none text-sm"
                    placeholder="Ej. 1,000,000.00"
                  />
                </div>
              </div>
            </div>

            {/* Vista previa de las visitas programadas */}
            <div className="mt-4 pt-4 border-t border-dark-4">
              <h5 className="text-xs font-semibold text-cream-muted uppercase mb-2">
                Calendario Calculado: {visitasCalculadas.length} Visita(s) de Mantenimiento Programadas
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {visitasCalculadas.map((visita, idx) => (
                  <div key={idx} className="bg-dark-1 p-3 rounded-lg border border-dark-4 text-xs">
                    <div className="flex justify-between items-center text-gold font-semibold mb-1">
                      <span>Visita #{visita.numero}</span>
                      <span className="text-[10px] bg-gold/10 px-2 py-0.5 rounded text-gold">Programada</span>
                    </div>
                    <div className="text-cream">{parseFechaText(visita.fechaProgramada)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sección 4: Fundamento Legal Destacado */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-cream-muted space-y-2">
            <h5 className="text-amber-400 font-semibold uppercase flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Respaldo y Fundamento Legal de la Póliza
            </h5>
            <p>
              • <strong>Cumplimiento Normativo:</strong> NOM-001-SEDE-2012/2018 (Instalaciones Eléctricas), Código de Red de la CRE (RES/550/2016).
            </p>
            <p>
              • <strong>Garantía de Obra y Vicios Ocultos:</strong> Artículos 2142 al 2162 del Código Civil Federal. Cobertura de mano de obra y armado técnico.
            </p>
            <p>
              • <strong>Protección al Consumidor:</strong> Póliza emitida en estricto apego a los Arts. 77, 78, 79 y 81 de la Ley Federal de Protección al Consumidor (PROFECO).
            </p>
            <p>
              • <strong>Condicionante Legal de Mantenimiento:</strong> La validez de la garantía de instalación queda expresamente sujeta al cumplimiento puntual del calendario de inspecciones preventivas aquí pactado.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-dark-4">
            <button
              onClick={handleSavePolicyToSupabase}
              disabled={isSavingSupabase}
              className="bg-dark-3 hover:bg-dark-4 text-cream px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-dark-4"
            >
              <Save className="w-4 h-4 text-gold" />
              {isSavingSupabase ? 'Guardando en BD...' : 'Guardar Póliza y Programar Visitas'}
            </button>

            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || formData.conceptosSeleccionados.length === 0}
              className="bg-gold hover:bg-yellow-500 text-dark-1 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              {isGeneratingPDF ? 'Generando PDF...' : 'Vista Previa Póliza PDF'}
            </button>

            <button
              onClick={handleGenerateReceiptPDF}
              disabled={isGeneratingReceipt || formData.montoTotal <= 0}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-600/20"
            >
              <Receipt className="w-4 h-4" />
              {isGeneratingReceipt ? 'Generando Recibo...' : 'Vista Previa Recibo de Pago'}
            </button>
          </div>
        </div>
      )}

      {/* Historial de Pólizas Guardadas y Alertas de Visitas */}
      {activeTabMode === 'historial' && (
        <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-dark-4 pb-4">
            <div>
              <h3 className="text-xl font-light text-cream flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Historial de Pólizas Emitidas y Mantenimientos
              </h3>
              <p className="text-sm text-cream-muted mt-1">
                Monitorea el estatus de las visitas programadas y envía alertas directas a los clientes.
              </p>
            </div>
            <button
              onClick={fetchSavedPolicies}
              className="text-xs bg-dark-3 hover:bg-dark-4 text-gold border border-dark-4 px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Actualizar Lista
            </button>
          </div>

          {savedPolicies.length === 0 ? (
            <div className="text-center py-12 bg-dark-3/30 rounded-xl border border-dark-4">
              <Shield className="w-12 h-12 text-cream-muted mx-auto mb-3 opacity-40" />
              <p className="text-cream text-base font-medium">No se han registrado pólizas en Supabase aún</p>
              <p className="text-cream-muted text-xs mt-1">Emite una nueva póliza desde la pestaña superior y guárdala en base de datos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPolicies.map((poliza) => (
                <div key={poliza.id} className="bg-dark-3/50 border border-dark-4 rounded-xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-dark-4 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-gold font-bold font-mono text-sm">{poliza.folio}</span>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold uppercase">
                          {poliza.estado || 'Activa'}
                        </span>
                        <span className="text-xs text-cream-muted">({poliza.periodicidad})</span>
                      </div>
                      <h4 className="text-base font-medium text-cream mt-1">{poliza.cliente_nombre} - <span className="text-gold">{poliza.nombre_obra}</span></h4>
                      <p className="text-xs text-cream-muted">{poliza.cliente_direccion || 'Sin dirección'}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-gold">{formatCurrency(poliza.monto_total || 0)}</div>
                      <div className="text-xs text-cream-muted">Vigencia: {parseFechaText(poliza.fecha_inicio)} al {parseFechaText(poliza.fecha_fin)}</div>
                    </div>
                  </div>

                  {/* Visitas de Mantenimiento de la Póliza */}
                  <div>
                    <h5 className="text-xs font-semibold text-cream-muted uppercase mb-2">
                      Visitas de Mantenimiento Programadas:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {poliza.visitas_mantenimiento_poliza?.map((visita: any) => (
                        <div key={visita.id} className="bg-dark-1 p-3 rounded-lg border border-dark-4 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-cream">Visita #{visita.numero_visita}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                              visita.estado === 'completada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {visita.estado || 'pendiente'}
                            </span>
                          </div>
                          <div className="text-cream-muted">📅 {parseFechaText(visita.fecha_programada)}</div>
                          <div className="flex gap-2 pt-1 border-t border-dark-4">
                            <button
                              onClick={() => handleSendVisitReminder(visita, poliza)}
                              className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] py-1 rounded font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                              <Send className="w-3 h-3" /> Recordatorio WhatsApp
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
