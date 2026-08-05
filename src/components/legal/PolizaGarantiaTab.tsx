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
  Plus
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
    subtitulo: 'Mantenimiento preventivo y correctivo de climatización.',
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

const generarFolio = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `POL-${year}-${rand}`;
};

export default function PolizaGarantiaTab({ initialBudgetId }: PolizaGarantiaTabProps) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  
  // Lista de pólizas guardadas en base de datos
  const [savedPolicies, setSavedPolicies] = useState<any[]>([]);
  const [activeTabMode, setActiveTabMode] = useState<'crear' | 'historial'>('crear');
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    folio: generarFolio(),
    clienteFinal: '',
    clienteTelefono: '',
    clienteEmail: '',
    direccionInstalacion: '',
    nombreObra: '',
    conceptosSeleccionados: ['paneles_solares', 'mtto_paneles'] as string[],
    tipoCobertura: 'Mantenimiento Preventivo y Garantía de Ejecución Técnica',
    periodicidad: 'Trimestral',
    duracionAnos: 1,
    fechaInicio: new Date().toISOString().split('T')[0],
    montoTotal: 0,
    montoVisita: 0,
    observaciones: ''
  });

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

      setFormData(prev => ({
        ...prev,
        clienteFinal: budget.client_name || '',
        clienteTelefono: fetchedPhone,
        clienteEmail: fetchedEmail,
        direccionInstalacion: fetchedAddress || details?.encabezado?.direccion_obra || details?.encabezado?.lugar || '',
        nombreObra: budget.project_name || budget.nombre_proyecto || budget.name || 'Póliza de Mantenimiento',
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
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 4px solid #d4af37;
          }
          .header-title {
            font-family: 'Cinzel', serif;
            font-size: 18px;
            margin: 0;
            color: #d4af37;
            letter-spacing: 1.5px;
          }
          .header-subtitle {
            font-size: 9.5px;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.9;
          }
          .folio-badge {
            display: inline-block;
            background: rgba(212, 175, 55, 0.2);
            color: #fef08a;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            margin-top: 4px;
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
          <div class="header-box">
            <h2 class="header-title">PÓLIZA DE GARANTÍA Y SERVICIO TÉCNICO</h2>
            <div class="header-subtitle">ESOL ENERGÍAS - COBERTURA MULTIDISCIPLINARIA DE MANTENIMIENTO</div>
            <div class="folio-badge">FOLIO: ${formData.folio}</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Titular de la Póliza</div>
              <div class="info-value">${(formData.clienteFinal || 'CLIENTE GENERAL').toUpperCase()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Obra / Proyecto</div>
              <div class="info-value">${formData.nombreObra.toUpperCase()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Ubicación física</div>
              <div class="info-value">${formData.direccionInstalacion || 'DIRECCIÓN NO ESPECIFICADA'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Vigencia y Periodicidad</div>
              <div class="info-value">${formData.duracionAnos} AÑO(S) (${formData.periodicidad.toUpperCase()}) | ${parseFechaText(formData.fechaInicio)} al ${parseFechaText(getFechaFin())}</div>
            </div>
          </div>

          <div class="section-title">COBERTURAS Y ESPECIALIDADES AMPARADAS</div>
          <div class="concepts-container">
            ${conceptosInfo.map(c => `
              <div class="concept-card">
                <div class="concept-header">${c?.icon} ${c?.titulo}</div>
                <div class="concept-desc">${c?.subtitulo}</div>
                <ul class="concept-bullets">
                  ${c?.detalles.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>

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
              <div class="sig-name">ESOL ENERGÍAS S.A. DE C.V.</div>
              <div class="sig-role">REPRESENTANTE LEGAL Y TÉCNICO</div>
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

      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');

    } catch (error) {
      console.error("Error al generar PDF de Póliza:", error);
      alert("Hubo un problema al crear la Póliza PDF.");
    } finally {
      setIsGeneratingPDF(false);
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
      setFormData(prev => ({ ...prev, folio: generarFolio() }));
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
              <label className="block text-xs font-semibold text-cream-muted mb-1 uppercase tracking-wider">
                Titular / Cliente
              </label>
              <input
                type="text"
                value={formData.clienteFinal}
                onChange={e => setFormData({ ...formData, clienteFinal: e.target.value })}
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
                onChange={e => setFormData({ ...formData, nombreObra: e.target.value })}
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
                    <div className="flex items-start justify-between">
                      <span className="text-2xl mb-1">{concepto.icon}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-gold" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border border-dark-4" />
                      )}
                    </div>
                    <h5 className="font-semibold text-cream text-sm mt-1">{concepto.titulo}</h5>
                    <p className="text-xs text-cream-muted mt-1 leading-snug">{concepto.subtitulo}</p>
                  </div>
                );
              })}
            </div>
          </div>

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
                <input
                  type="number"
                  min="0"
                  value={formData.montoTotal}
                  onChange={e => setFormData({ ...formData, montoTotal: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
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
              className="bg-gold hover:bg-yellow-500 text-dark-1 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              {isGeneratingPDF ? 'Generando PDF...' : 'Vista Previa Póliza PDF (Pestaña Nueva)'}
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
