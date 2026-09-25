import React, { useState, useEffect, useMemo } from 'react';
import type { 
  ClienteReal, ProyectoReal, Proveedor, InsumoReal, 
  SolicitudCompra, OrdenCompra, RecepcionMercancia, PartidaCompra 
} from '../../types/adminTypes';
import type { OficioData, OficioTemplate } from '../../../../components/legal/oficios/types';
import { OFICIOS_TEMPLATES } from '../../../../components/legal/oficios/templates';
import { getNextFolio, getDefaultOficio } from '../../../../components/legal/oficios/OficiosTab';
import { generateOficioPdf } from '../../../../components/legal/oficios/oficioPdfGenerator';
import { processOficioWithAI, type AIOperationMode } from '../../../../components/legal/oficios/oficioAIService';
import OficioPreviewModal from '../../../../components/legal/oficios/OficioPreviewModal';
import { adminDbService } from '../../services/adminDbService';
import { 
  FileText, Plus, Search, Filter, CheckCircle2, Printer, Download, Eye, 
  Trash2, Building2, User, ShoppingCart, Truck, Package, Sparkles, Send, 
  ShieldCheck, AlertCircle, RefreshCw, ArrowRight, Layers, FileCheck2, 
  FolderCheck, X, ChevronRight, Edit3, ExternalLink, Calendar, MapPin,
  Wand2, Scale, BookOpen, Loader2, HelpCircle, CheckCheck, Upload
} from 'lucide-react';

export type TipoTramitePeticion = 
  | 'oficio_legal' 
  | 'solicitud_compra' 
  | 'orden_compra' 
  | 'recepcion_mercancia' 
  | 'solicitud_material' 
  | 'vale_entrega';

interface CentroOficiosTabProps {
  clientes: ClienteReal[];
  proyectos: ProyectoReal[];
  proveedores: Proveedor[];
  insumos: InsumoReal[];
  solicitudesCompra: SolicitudCompra[];
  ordenesCompra: OrdenCompra[];
  recepciones: RecepcionMercancia[];
  userRole?: string;
  userName?: string;
  onRefresh: () => void;
  onNavigateTab?: (tab: any) => void;
}

const TRAMITES_CONFIG: {
  id: TipoTramitePeticion;
  titulo: string;
  subtitulo: string;
  icono: any;
  color: string;
  moduloDestino: string;
}[] = [
  {
    id: 'oficio_legal',
    titulo: 'Oficio Formal / Legal / Obra',
    subtitulo: 'Peticiones formales a CFE, clientes, contratistas o comunicados oficiales',
    icono: FileText,
    color: 'border-gold/40 text-gold bg-gold/10',
    moduloDestino: 'Historial Legal y CRM Cliente'
  },
  {
    id: 'solicitud_compra',
    titulo: 'Solicitud de Compra (SC)',
    subtitulo: 'Requisición de insumos y suministros para obra o inventario',
    icono: ShoppingCart,
    color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    moduloDestino: 'Módulo 1: Solicitudes de Compra'
  },
  {
    id: 'orden_compra',
    titulo: 'Orden de Compra (OC)',
    subtitulo: 'Pedido comercial formal con proveedor, condiciones de pago y desglose de IVA',
    icono: FileCheck2,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    moduloDestino: 'Módulo 1: Órdenes de Compra'
  },
  {
    id: 'recepcion_mercancia',
    titulo: 'Acta de Recepción y Revisión',
    subtitulo: 'Constancia formal de entrega física en almacén e inspección de calidad',
    icono: Truck,
    color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    moduloDestino: 'Módulo 1: Recepciones Almacén'
  },
  {
    id: 'solicitud_material',
    titulo: 'Solicitud a Obra',
    subtitulo: 'Requisición de despacho de materiales para frentes de instalación',
    icono: Package,
    color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    moduloDestino: 'Módulo 2: Almacén y Obra'
  },
  {
    id: 'vale_entrega',
    titulo: 'Vale de Entrega en Sitio',
    subtitulo: 'Acta de salida y custodia de insumos firmada en sitio de trabajo',
    icono: FolderCheck,
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    moduloDestino: 'Módulo 2: Vales de Entrega'
  }
];

export const CentroOficiosTab: React.FC<CentroOficiosTabProps> = ({
  clientes,
  proyectos,
  proveedores,
  insumos,
  solicitudesCompra,
  ordenesCompra,
  recepciones,
  userRole = 'master',
  userName = 'Administrador General',
  onRefresh,
  onNavigateTab
}) => {
  const [viewMode, setViewMode] = useState<'redactar' | 'historial'>('redactar');
  const [tipoTramite, setTipoTramite] = useState<TipoTramitePeticion>('oficio_legal');
  const [oficiosList, setOficiosList] = useState<OficioData[]>([]);
  const [loadingOficios, setLoadingOficios] = useState(false);

  // Form State
  const [oficio, setOficio] = useState<OficioData>(() => getDefaultOficio(null));
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [selectedProveedorId, setSelectedProveedorId] = useState('');

  // Items/Partidas para trámites de compra/insumos
  const [partidas, setPartidas] = useState<PartidaCompra[]>([]);
  const [mostrarPreciosEnPdf, setMostrarPreciosEnPdf] = useState<boolean>(true);
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [customDescripcion, setCustomDescripcion] = useState('');
  const [itemUnidad, setItemUnidad] = useState('PZA');
  const [itemCantidad, setItemCantidad] = useState<number | string>(1);
  const [itemPrecio, setItemPrecio] = useState<number | string>(0);

  // AI Assistant States (Potenciado con IA Semiformal)
  const [aiNotes, setAiNotes] = useState('');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Registro de campos que se vacían automáticamente la primera vez que se hace click para editarlos
  const [clearedFields, setClearedFields] = useState<{ [key: string]: boolean }>({});

  // Lista de textos predefinidos o de ejemplo que SÍ se deben borrar al dar click
  const isDefaultTemplateText = (fieldName: string, val: string): boolean => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();

    // NUNCA borrar si fue autocompletado por el sistema con cliente, proyecto o referencia real
    if (trimmed.startsWith('Cliente:') || trimmed.startsWith('Obra:') || trimmed.startsWith('REF:')) {
      return false;
    }

    // Coincidencias con plantillas predefinidas del sistema
    const defaultTemplatesTexts = OFICIOS_TEMPLATES.flatMap(t => [
      t.asuntoDefault,
      t.vocativoDefault,
      t.antecedentesDefault,
      t.cuerpoDefault,
      t.fundamentacionDefault,
      t.peticionDefault,
      t.despedidaDefault
    ]).filter(Boolean);

    // Textos genéricos adicionales
    const placeholdersEjemplos = [
      'REF: Proyecto / Contrato / Expediente...',
      'ASUNTO: COMUNICADO OFICIAL...',
      'COMUNICADO OFICIAL DE OBRA',
      'Sin otro particular por el momento y agradeciendo su atención, quedamos a sus órdenes.',
      'Con fundamento en la Norma Oficial Mexicana NOM-001-SEDE-2012 y las especificaciones técnicas...',
      '1. Autorización de acceso en el horario establecido.\n2. Liberación del área de maniobras.'
    ];

    return defaultTemplatesTexts.includes(trimmed) || placeholdersEjemplos.includes(trimmed);
  };

  const handleClearOnFocus = (fieldName: string, currentVal: any, clearFn: () => void) => {
    // Si ya fue interactuado, no hacer nada
    if (clearedFields[fieldName]) return;
    setClearedFields(prev => ({ ...prev, [fieldName]: true }));

    // SOLO borrar si coincide con un texto de ejemplo/plantilla predefinida
    if (currentVal && isDefaultTemplateText(fieldName, currentVal)) {
      clearFn();
    }
  };

  // Document controls
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; pdfUrl?: string } | null>(null);

  // Historial search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'emitido' | 'borrador'>('todos');

  // Load oficios y firma digital precargada
  const cargarHistorialOficios = async () => {
    try {
      setLoadingOficios(true);
      const data = await adminDbService.getOficiosCompletos();
      setOficiosList(data);

      // Obtener firma digital precargada de localStorage o de los oficios previos emitidos
      let savedSig = typeof window !== 'undefined' ? localStorage.getItem('esol_firma_digital_precargada') : null;
      if (!savedSig && Array.isArray(data)) {
        const oficioConFirma = data.find(o => o.firmaDigital && o.firmaDigital.startsWith('data:image'));
        if (oficioConFirma && oficioConFirma.firmaDigital) {
          savedSig = oficioConFirma.firmaDigital;
          try {
            localStorage.setItem('esol_firma_digital_precargada', savedSig);
          } catch (e) {}
        }
      }

      setOficio(prev => ({
        ...prev,
        folio: prev.id ? prev.folio : getNextFolio(data),
        firmaDigital: prev.firmaDigital || savedSig || undefined,
        incluirFirmaDigital: prev.incluirFirmaDigital ?? true
      }));
    } catch (e) {
      console.error('Error cargando historial de oficios:', e);
    } finally {
      setLoadingOficios(false);
    }
  };

  useEffect(() => {
    cargarHistorialOficios();
  }, []);

  // Sincronización al cambiar el Tipo de Trámite
  const handleCambioTipoTramite = (nuevoTipo: TipoTramitePeticion) => {
    setTipoTramite(nuevoTipo);

    // Ajustar encabezados y asunto predeterminado según el trámite
    let nuevoAsunto = oficio.asunto;
    let nuevoVocativo = oficio.vocativo;
    let nuevoCuerpo = oficio.cuerpo;
    let destinatarioNombre = oficio.destinatarioNombre;
    let destinatarioCargo = oficio.destinatarioCargo;
    let destinatarioEmpresa = oficio.destinatarioEmpresa;

    if (nuevoTipo === 'solicitud_compra') {
      nuevoAsunto = `SOLICITUD Y REQUISICIÓN DE COMPRA DE MATERIALES - ${oficio.folio}`;
      destinatarioNombre = 'Dirección de Compras y Suministros';
      destinatarioCargo = 'Departamento de Adquisiciones';
      destinatarioEmpresa = 'ESOL ENERGIAS';
      nuevoVocativo = 'Estimada Dirección de Compras:';
      nuevoCuerpo = `Por medio de la presente, me dirijo a usted para formalizar la requisición de insumos requeridos para el avance técnico y operativo de la obra "${oficio.nombreObra || 'Proyecto Solar'}".\n\nSe solicita la adquisición y autorización oportuna de las partidas detalladas a continuación para dar cumplimiento al calendario de ejecución.`;
    } else if (nuevoTipo === 'orden_compra') {
      nuevoAsunto = `ORDEN DE COMPRA OFICIAL ${oficio.folio} - SUMINISTRO DE MATERIALES`;
      const prov = proveedores.find(p => p.id === selectedProveedorId);
      destinatarioNombre = prov?.contacto_nombre || prov?.nombre || 'Departamento de Ventas';
      destinatarioCargo = 'Ejecutivo de Cuenta / Facturación';
      destinatarioEmpresa = prov?.nombre || 'Proveedor Comercial';
      nuevoVocativo = 'Estimados Señores:';
      nuevoCuerpo = `Por medio de la presente, confirmamos formalmente el pedido de compra correspondiente a los insumos y condiciones comerciales previamente acordadas.\n\nAgradecemos confirmar de recibido e indicar la fecha estimada de embarque y entrega en sitio.`;
    } else if (nuevoTipo === 'recepcion_mercancia') {
      nuevoAsunto = `ACTA DE RECEPCIÓN E INSPECCIÓN FÍSICA DE MERCANCÍA - ${oficio.folio}`;
      destinatarioNombre = 'Almacén Central y Control de Calidad';
      destinatarioCargo = 'Inspección de Embarques';
      destinatarioEmpresa = 'ESOL ENERGIAS';
      nuevoVocativo = 'A Quien Corresponda:';
      nuevoCuerpo = `Hacemos constar que en la fecha indicada se recibió e inspeccionó físicamente en instalaciones el embarque de insumos amparado bajo el presente documento, dictaminando su conformidad técnica para ingreso al inventario general.`;
    } else if (nuevoTipo === 'solicitud_material') {
      nuevoAsunto = `SOLICITUD DE DESPACHO DE MATERIAL A OBRA - ${oficio.folio}`;
      destinatarioNombre = 'Encargado de Almacén General';
      destinatarioCargo = 'Despacho y Salidas';
      destinatarioEmpresa = 'ESOL ENERGIAS';
      nuevoVocativo = 'Estimado Encargado de Almacén:';
      nuevoCuerpo = `Solicito la entrega y despacho de los materiales relacionados a continuación para el frente de trabajo de la obra indicada.`;
    } else if (nuevoTipo === 'vale_entrega') {
      nuevoAsunto = `VALE DE SALIDA DE ALMACÉN Y ENTREGA EN SITIO - ${oficio.folio}`;
      destinatarioNombre = 'Residente / Supervisor de Obra';
      destinatarioCargo = 'Receptor Responsable en Obra';
      destinatarioEmpresa = 'ESOL ENERGIAS';
      nuevoVocativo = 'Constancia de Entrega y Custodia:';
      nuevoCuerpo = `Por medio del presente documento se hace entrega formal de los insumos y materiales abajo relacionados para su custodia y debida instalación.`;
    } else {
      nuevoAsunto = 'COMUNICADO OFICIAL DE OBRA';
      nuevoVocativo = 'Estimados Señores:';
      nuevoCuerpo = OFICIOS_TEMPLATES[0].cuerpoDefault;
    }

    setOficio(prev => ({
      ...prev,
      tipoOficio: nuevoTipo,
      asunto: nuevoAsunto,
      vocativo: nuevoVocativo,
      cuerpo: nuevoCuerpo,
      destinatarioNombre,
      destinatarioCargo,
      destinatarioEmpresa
    }));
  };

  // Al seleccionar Cliente en CRM
  const handleSelectCliente = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    if (!clienteId) return;

    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setClearedFields(prev => ({ ...prev, referencia: true, destinatarioEmpresa: true, destinatarioNombre: true }));
      setOficio(prev => ({
        ...prev,
        clienteFinal: cliente.nombre,
        ubicacionObra: cliente.direccion || prev.ubicacionObra,
        destinatarioEmpresa: tipoTramite === 'oficio_legal' ? cliente.nombre : prev.destinatarioEmpresa,
        destinatarioNombre: tipoTramite === 'oficio_legal' ? cliente.nombre : prev.destinatarioNombre,
        referencia: `Cliente: ${cliente.nombre}${cliente.rfc ? ` | RFC: ${cliente.rfc}` : ''}`
      }));
    }
  };

  // Al seleccionar Proyecto / Presupuesto en ERP
  const handleSelectProyecto = (proyectoId: string) => {
    setSelectedProyectoId(proyectoId);
    if (!proyectoId) return;

    const proy = proyectos.find(p => p.id === proyectoId);
    if (proy) {
      // Auto-seleccionar cliente del proyecto si no está seleccionado
      const clienteCorrespondiente = clientes.find(c => c.id === proy.cliente_id || c.nombre.toLowerCase() === (proy.cliente_nombre || '').toLowerCase());
      if (clienteCorrespondiente && !selectedClienteId) {
        setSelectedClienteId(clienteCorrespondiente.id);
      }

      setClearedFields(prev => ({ ...prev, referencia: true }));
      setOficio(prev => ({
        ...prev,
        presupuestoId: proy.id,
        nombreObra: proy.titulo,
        clienteFinal: proy.cliente_nombre || prev.clienteFinal,
        referencia: `Obra: ${proy.titulo} | Cliente: ${proy.cliente_nombre || 'General'}`
      }));
    }
  };

  // Al seleccionar Proveedor
  const handleSelectProveedor = (proveedorId: string) => {
    setSelectedProveedorId(proveedorId);
    if (!proveedorId) return;

    const prov = proveedores.find(p => p.id === proveedorId);
    if (prov) {
      setOficio(prev => ({
        ...prev,
        destinatarioEmpresa: prov.nombre,
        destinatarioNombre: prov.contacto_nombre || prov.nombre,
        destinatarioCargo: 'Representante de Ventas'
      }));
    }
  };

  // Agregar partida al constructor de insumos
  const handleAddItem = () => {
    const numCantidad = typeof itemCantidad === 'string' ? (parseFloat(itemCantidad) || 0) : itemCantidad;
    const numPrecio = typeof itemPrecio === 'string' ? (parseFloat(itemPrecio) || 0) : itemPrecio;

    if (!customDescripcion.trim() || numCantidad <= 0) {
      alert('Ingresa una descripción válida y una cantidad mayor a cero.');
      return;
    }

    const importe = numCantidad * numPrecio;
    const nuevaPartida: PartidaCompra = {
      insumo_id: selectedInsumoId !== 'custom' ? selectedInsumoId : undefined,
      descripcion: customDescripcion.trim(),
      unidad: itemUnidad,
      cantidad: numCantidad,
      precio_unitario: numPrecio,
      importe
    };

    const updated = [...partidas, nuevaPartida];
    setPartidas(updated);

    // Sincronizar en oficio y opcionalmente en el cuerpo
    actualizarCuerpoConPartidas(updated);

    // Reset inputs
    setSelectedInsumoId('');
    setCustomDescripcion('');
    setItemCantidad(1);
    setItemPrecio(0);
  };

  const handleRemoveItem = (index: number) => {
    const updated = partidas.filter((_, i) => i !== index);
    setPartidas(updated);
    actualizarCuerpoConPartidas(updated);
  };

  const handleUpdatePartida = (index: number, updatedFields: Partial<PartidaCompra>) => {
    const updated = partidas.map((p, idx) => {
      if (idx !== index) return p;
      const merged = { ...p, ...updatedFields };
      const cant = Number(merged.cantidad) || 0;
      const prec = Number(merged.precio_unitario) || 0;
      merged.importe = cant * prec;
      return merged;
    });
    setPartidas(updated);
    actualizarCuerpoConPartidas(updated);
  };

  const actualizarCuerpoConPartidas = (currentPartidas: PartidaCompra[]) => {
    setOficio(prev => ({
      ...prev,
      partidas: currentPartidas,
      mostrarPreciosEnPdf
    }));
  };

  const handleToggleMostrarPrecios = (show: boolean) => {
    setMostrarPreciosEnPdf(show);
    setOficio(prev => ({
      ...prev,
      mostrarPreciosEnPdf: show
    }));
  };

  const handleSelectInsumoCatalogo = (insumoId: string) => {
    setSelectedInsumoId(insumoId);
    if (insumoId === 'custom') {
      setCustomDescripcion('');
      setItemUnidad('PZA');
      setItemPrecio(0);
    } else {
      const ins = insumos.find(i => i.id === insumoId);
      if (ins) {
        setCustomDescripcion(ins.nombre);
        setItemUnidad(ins.unidad || 'PZA');
        setItemPrecio(ins.precio_unitario || 0);
      }
    }
  };

  // Ejecución del Asistente de IA (Gemini - Tono Semiformal, Primera Persona, Estructura Formal)
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

      // Proteger todos los campos modificados por la IA para que un clic no los borre jamás
      setClearedFields(prev => ({
        ...prev,
        asunto: true,
        vocativo: true,
        antecedentes: true,
        cuerpo: true,
        fundamentacion: true,
        peticion: true,
        despedida: true,
        referencia: true
      }));

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

      setAiNotification('Documento procesado y optimizado por la IA exitosamente.');
      setTimeout(() => setAiNotification(null), 5000);
    } catch (err: any) {
      console.error('Error al procesar con IA:', err);
      setAiNotification('Error IA: ' + (err.message || 'No se pudo conectar con el servicio de IA'));
    } finally {
      setIsProcessingAI(false);
    }
  };

  // EMISIÓN FORMAL (DUAL SAVE: OFICIOS_OBRA + ENTIDAD ERP)
  const handleEmitirFormalmente = async () => {
    if (!oficio.folio || !oficio.destinatarioNombre || !oficio.cuerpo) {
      alert('Para emitir formalmente, asegúrate de tener Folio, Destinatario y Cuerpo del Documento.');
      return;
    }

    try {
      setIsEmitting(true);
      setNotification({
        type: 'success',
        message: 'Generando PDF oficial con firma y sellos digitales...'
      });

      // 1. Generar el PDF y obtener Blob
      let generatedDriveUrl = oficio.drive_url;
      try {
        const pdfResult = await generateOficioPdf(oficio);
        if (pdfResult.driveUrl) {
          generatedDriveUrl = pdfResult.driveUrl;
        }
      } catch (pdfErr) {
        console.warn('PDF generado localmente sin subida Drive inmediata:', pdfErr);
      }

      // 2. Guardar con estatus emitido y URL de PDF
      const oficioFinal: OficioData = {
        ...oficio,
        estado: 'emitido',
        drive_url: generatedDriveUrl || oficio.drive_url
      };

      const clienteObj = clientes.find(c => c.id === selectedClienteId);
      const proyObj = proyectos.find(p => p.id === selectedProyectoId);
      const provObj = proveedores.find(p => p.id === selectedProveedorId);

      const totalEstimado = partidas.reduce((acc, p) => acc + (p.importe || (p.cantidad * p.precio_unitario)), 0);

      // 3. Ejecutar Guardado Dual
      const { oficio: savedOficio, entidadErp } = await adminDbService.emitirOficioCentral(
        oficioFinal,
        tipoTramite,
        {
          clienteId: selectedClienteId || undefined,
          clienteNombre: clienteObj?.nombre || oficio.clienteFinal,
          proyectoId: selectedProyectoId || undefined,
          proyectoNombre: proyObj?.titulo || oficio.nombreObra,
          proveedorId: selectedProveedorId || undefined,
          proveedorNombre: provObj?.nombre || oficio.destinatarioEmpresa,
          partidas: partidas,
          justificacion: oficio.asunto,
          total: totalEstimado,
          solicitanteNombre: userName
        }
      );

      setOficio(savedOficio);
      await cargarHistorialOficios();
      onRefresh();

      setNotification({
        type: 'success',
        message: `Oficio ${savedOficio.folio} emitido y guardado exitosamente en el Cliente y en el Módulo Administrativo correspondiente.`,
        pdfUrl: savedOficio.drive_url
      });
      setTimeout(() => setNotification(null), 8000);

    } catch (err: any) {
      console.error('Error al emitir oficio:', err);
      setNotification({
        type: 'error',
        message: 'Error al emitir oficio: ' + (err.message || 'Error desconocido')
      });
    } finally {
      setIsEmitting(false);
    }
  };

  const handleGuardarBorrador = async () => {
    try {
      const borrador: OficioData = {
        ...oficio,
        estado: 'borrador'
      };
      const saved = await adminDbService.guardarOficioErp(borrador);
      setOficio(saved);
      await cargarHistorialOficios();
      setNotification({
        type: 'success',
        message: `Borrador ${saved.folio} guardado para continuar después.`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert('Error al guardar borrador: ' + err.message);
    }
  };

  const handleCargarOficioHistorial = (item: OficioData) => {
    setOficio({ ...item });
    setPartidas(item.partidas || []);
    setMostrarPreciosEnPdf(item.mostrarPreciosEnPdf ?? true);

    // 1. Restaurar Tipo de Trámite / Petición
    const tramitesValidos: TipoTramitePeticion[] = [
      'oficio_legal',
      'solicitud_compra',
      'orden_compra',
      'recepcion_mercancia',
      'solicitud_material',
      'vale_entrega'
    ];
    if (item.tipoOficio && tramitesValidos.includes(item.tipoOficio as TipoTramitePeticion)) {
      setTipoTramite(item.tipoOficio as TipoTramitePeticion);
    } else if (item.tipoOficio === 'requisicion_insumos' as any) {
      setTipoTramite('solicitud_compra');
    } else {
      setTipoTramite('oficio_legal');
    }

    // 2. Restaurar Conexión de Expediente (CRM & Proyectos)
    // A) Cliente
    let matchingCliente = clientes.find(c => 
      (item.clienteFinal && c.nombre.trim().toLowerCase() === item.clienteFinal.trim().toLowerCase()) ||
      (item.referencia && item.referencia.toLowerCase().includes(c.nombre.trim().toLowerCase()))
    );
    if (matchingCliente) {
      setSelectedClienteId(matchingCliente.id);
    } else {
      setSelectedClienteId('');
    }

    // B) Proyecto
    let matchingProyecto = proyectos.find(p => 
      (item.presupuestoId && (p.id === item.presupuestoId || p.presupuesto_id === item.presupuestoId)) ||
      (item.nombreObra && p.titulo.trim().toLowerCase() === item.nombreObra.trim().toLowerCase()) ||
      (item.referencia && item.referencia.toLowerCase().includes(p.titulo.trim().toLowerCase()))
    );
    if (matchingProyecto) {
      setSelectedProyectoId(matchingProyecto.id);
      // Si el proyecto tiene cliente y no teníamos cliente detectado, lo asignamos
      if (!matchingCliente && matchingProyecto.cliente_id) {
        setSelectedClienteId(matchingProyecto.cliente_id);
      }
    } else {
      setSelectedProyectoId('');
    }

    // C) Proveedor
    let matchingProveedor = proveedores.find(pr => 
      (item.destinatarioEmpresa && pr.nombre.trim().toLowerCase() === item.destinatarioEmpresa.trim().toLowerCase()) ||
      (item.destinatarioNombre && pr.nombre.trim().toLowerCase() === item.destinatarioNombre.trim().toLowerCase())
    );
    if (matchingProveedor) {
      setSelectedProveedorId(matchingProveedor.id);
    } else {
      setSelectedProveedorId('');
    }

    setClearedFields({});
    setAiNotes('');
    setCustomAiPrompt('');
    setAiNotification(null);
    setAiSuggestions(null);
    setViewMode('redactar');
    setNotification({
      type: 'success',
      message: `Oficio ${item.folio} cargado en el editor.`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleNuevoOficio = () => {
    const nextFolio = getNextFolio(oficiosList);
    setOficio({
      ...getDefaultOficio(null, oficiosList),
      folio: nextFolio
    });
    setPartidas([]);
    setMostrarPreciosEnPdf(true);
    setSelectedClienteId('');
    setSelectedProyectoId('');
    setSelectedProveedorId('');
    setClearedFields({});
    setAiNotes('');
    setCustomAiPrompt('');
    setAiNotification(null);
    setAiSuggestions(null);
    setViewMode('redactar');
  };

  // Filtrado de historial
  const filteredHistorial = useMemo(() => {
    return oficiosList.filter(o => {
      const matchesSearch = 
        (o.folio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.clienteFinal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.nombreObra || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.destinatarioNombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.asunto || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = filterTipo === 'todos' || o.tipoOficio === filterTipo;
      const matchesEstado = filterEstado === 'todos' || o.estado === filterEstado;

      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [oficiosList, searchTerm, filterTipo, filterEstado]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation Switcher */}
      <div className="bg-gradient-to-r from-dark-2 via-dark-3 to-dark-2 p-5 sm:p-6 rounded-3xl border border-dark-4 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-lg shadow-gold/10">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-cream font-display tracking-tight flex items-center gap-2">
                CENTRO DE OFICIOS Y PETICIONES ADMINISTRATIVAS
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  Emisión Formal ERP + CRM
                </span>
              </h2>
              <p className="text-xs text-cream-muted mt-0.5">
                Emite trámites con firma digital oficial, vinculado directamente al expediente del cliente en CRM y a los módulos de compras y almacén.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setViewMode('redactar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'redactar'
                ? 'bg-gold text-dark-1 shadow-md shadow-gold/20'
                : 'bg-dark-3 text-cream-muted hover:text-cream border border-dark-4'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Redactar Petición</span>
          </button>

          <button
            onClick={() => setViewMode('historial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'historial'
                ? 'bg-gold text-dark-1 shadow-md shadow-gold/20'
                : 'bg-dark-3 text-cream-muted hover:text-cream border border-dark-4'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Historial de Oficios ({oficiosList.length})</span>
          </button>

          <button
            onClick={handleNuevoOficio}
            className="p-2 rounded-xl bg-dark-3 hover:bg-dark-4 text-gold border border-dark-4 transition-colors"
            title="Nuevo Oficio en Blanco"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{notification.message}</span>
          </div>
          {notification.pdfUrl && (
            <a
              href={notification.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-emerald-200 font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver PDF</span>
            </a>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 1: REDACCIÓN Y EMISIÓN DE PETICIÓN */}
      {/* ========================================================= */}
      {viewMode === 'redactar' && (
        <div className="space-y-6">
          
          {/* FILA DE 2 COLUMNAS: PASO 1 Y PASO 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* COLUMNA 1 - PASO 1: SELECCIÓN DEL TIPO DE TRÁMITE / PETICIÓN */}
            <div className="bg-dark-2 p-5 rounded-3xl border border-dark-4 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-gold tracking-wider flex items-center gap-1.5">
                    <span>Paso 1</span> &bull; <span>Selecciona la Naturaleza del Trámite</span>
                  </span>
                  <span className="text-[10px] font-mono text-cream-dim">Folio: {oficio.folio}</span>
                </div>

                <div>
                  <label className="block text-cream-dim font-bold mb-1.5 flex items-center gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5 text-gold" />
                    <span>Tipo de Trámite / Petición</span>
                  </label>
                  <select
                    value={tipoTramite}
                    onChange={(e) => handleCambioTipoTramite(e.target.value as TipoTramitePeticion)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream font-bold focus:border-gold focus:outline-none text-xs"
                  >
                    {TRAMITES_CONFIG.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.titulo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tarjeta Informativa del Trámite Seleccionado */}
                {(() => {
                  const currentConfig = TRAMITES_CONFIG.find(t => t.id === tipoTramite);
                  if (!currentConfig) return null;
                  const IconComp = currentConfig.icono;
                  return (
                    <div className={`p-3.5 rounded-2xl border ${currentConfig.color} flex items-start gap-3 transition-all`}>
                      <div className="w-8 h-8 rounded-xl bg-dark-1/60 border border-gold/30 flex items-center justify-center text-gold flex-shrink-0 mt-0.5">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-black text-cream flex items-center justify-between">
                          <span>{currentConfig.titulo}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                        </div>
                        <p className="text-[11px] text-cream-muted mt-1 leading-snug">
                          {currentConfig.subtitulo}
                        </p>
                        <div className="text-[9px] font-mono font-bold text-gold/80 mt-2">
                          Impacto directo en: {currentConfig.moduloDestino}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* COLUMNA 2 - PASO 2: VINCULACIÓN BILATERAL CON CLIENTE Y PROYECTO */}
            <div className="bg-dark-2 p-5 rounded-3xl border border-dark-4 shadow-xl space-y-3">
              <span className="text-[11px] font-black uppercase text-gold tracking-wider block">
                Paso 2 &bull; Conexión de Expediente (CRM & Proyectos)
              </span>

              <div className="space-y-3 text-xs">
                {/* Cliente Selector */}
                <div>
                  <label className="block text-cream-dim font-bold mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gold" />
                    <span>Cliente Conectado (CRM)</span>
                  </label>
                  <select
                    value={selectedClienteId}
                    onChange={(e) => handleSelectCliente(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream focus:border-gold focus:outline-none text-xs"
                  >
                    <option value="">-- Seleccionar de Clientes CRM --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.rfc ? `(${c.rfc})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Proyecto y Proveedor en sub-grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Proyecto Selector */}
                  <div>
                    <label className="block text-cream-dim font-bold mb-1 flex items-center gap-1.5">
                      <FolderCheck className="w-3.5 h-3.5 text-gold" />
                      <span>Proyecto / Obra</span>
                    </label>
                    <select
                      value={selectedProyectoId}
                      onChange={(e) => handleSelectProyecto(e.target.value)}
                      className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream focus:border-gold focus:outline-none text-xs"
                    >
                      <option value="">-- Proyectos ERP --</option>
                      {proyectos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.titulo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Proveedor Selector */}
                  <div>
                    <label className="block text-cream-dim font-bold mb-1 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-gold" />
                      <span>Proveedor (Si aplica)</span>
                    </label>
                    <select
                      value={selectedProveedorId}
                      onChange={(e) => handleSelectProveedor(e.target.value)}
                      className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream focus:border-gold focus:outline-none text-xs"
                    >
                      <option value="">-- Proveedores --</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* PASO 3: REDACCIÓN INTELIGENTE CON IA Y FORMULARIO ESTRUCTURADO */}
          <div className="bg-dark-2 p-5 sm:p-6 rounded-3xl border border-dark-4 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-dark-4 pb-3">
              <div>
                <span className="text-[11px] font-black uppercase text-gold tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                  <span>Paso 3 &bull; Redacción del Documento Oficial con IA</span>
                </span>
                <p className="text-[11px] text-cream-muted mt-0.5">
                  Potenciado con IA en tono semi-formal y primera persona. Al hacer clic en cualquier campo para editarlo, se limpiará automáticamente.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] text-cream-dim uppercase font-bold">Folio:</span>
                <span className="font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30">{oficio.folio}</span>
              </div>
            </div>

            {/* FILA DE 2 COLUMNAS: ASISTENTE IA (IZQ) Y CONTROL DOCUMENTAL / DESTINATARIO (DER) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              
              {/* COLUMNA 1: ASISTENTE INTELIGENTE DE REDACCIÓN Y FORMALIDAD (IA) */}
              <div className="bg-gradient-to-br from-dark-3 via-dark-3 to-gold/10 border border-gold/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center text-gold border border-gold/30 shadow-inner">
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-gold">
                          Asistente Inteligente de Redacción y Formalidad (IA)
                        </h4>
                        <p className="text-[11px] text-cream-muted">
                          Redacción y corrección con tono semi-formal en primera persona y rigor técnico.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Input de notas rápidas o situación */}
                  <div>
                    <label className="block text-[11px] font-bold text-cream mb-1">
                      Notas rápidas, objetivo del trámite o borrador para la IA:
                    </label>
                    <textarea
                      rows={3}
                      value={aiNotes}
                      onChange={(e) => setAiNotes(e.target.value)}
                      placeholder="Ej. 'Requerimos solicitar a CFE libranza técnica en media tensión para el día jueves 18 a las 8:00 hrs para interconectar el transformador de 150 kVA' o 'Solicitar compra urgente de 40 módulos bifaciales 580W'..."
                      className="w-full bg-dark-1 border border-dark-4 rounded-xl p-2.5 text-xs text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none"
                    />
                  </div>

                  {/* Botonera de acciones rápidas de IA */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRunAI('formalizar_completo')}
                      disabled={isProcessingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                      title="Redactar o estructurar todo el oficio con tono semi-formal"
                    >
                      {isProcessingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      <span>🪄 Formalizar Todo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAI('personalizado')}
                      disabled={isProcessingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-2 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/40 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                      title="Corregir ortografía, sintaxis y coherencia del texto actual"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-gold" />
                      <span>✨ Corregir Ortografía</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAI('blindaje_legal')}
                      disabled={isProcessingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-2 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/40 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Scale className="w-3.5 h-3.5 text-gold" />
                      <span>⚖️ Blindaje Legal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAI('normativa_tecnica')}
                      disabled={isProcessingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-2 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/40 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-gold" />
                      <span>⚡ NOM-001 / CFE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAI('generar_acuerdos')}
                      disabled={isProcessingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-2 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/40 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                      <span>💡 Acuerdos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunAI('sintetizar_ejecutivo')}
                      disabled={isProcessingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-2 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/40 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5 text-gold" />
                      <span>📝 Resumen</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-dark-4">
                  {/* Instrucción o Prompt libre a la IA */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Instrucción libre a la IA (ej. 'solicitar prórroga al viernes')..."
                      value={customAiPrompt}
                      onChange={(e) => setCustomAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customAiPrompt.trim() && !isProcessingAI) {
                          e.preventDefault();
                          handleRunAI('personalizado');
                        }
                      }}
                      className="flex-1 bg-dark-1 border border-dark-4 rounded-xl px-3 py-1.5 text-xs text-cream placeholder:text-cream-dim focus:border-gold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRunAI('personalizado')}
                      disabled={isProcessingAI || !customAiPrompt.trim()}
                      className="px-3 py-1.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Instruir IA</span>
                    </button>
                  </div>

                  {/* Notificación y sugerencias de la IA */}
                  {aiNotification && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{aiNotification}</span>
                    </div>
                  )}

                  {aiSuggestions && (
                    <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-start gap-2 animate-in fade-in">
                      <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-blue-200">Recomendación técnica/legal de la IA:</strong> {aiSuggestions}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA 2: FOLIO, FECHA, LUGAR Y DATOS DEL DESTINATARIO */}
              <div className="bg-dark-3/50 border border-dark-4 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Fila: Folio consecutivo, Fecha de emisión, Lugar de expedición */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-cream-dim block mb-2">
                      Control Documental y Expedición
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-cream-dim font-bold mb-1">Folio Consecutivo</label>
                        <input
                          type="text"
                          value={oficio.folio}
                          onChange={(e) => setOficio({ ...oficio, folio: e.target.value })}
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-gold font-mono font-bold focus:border-gold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-cream-dim font-bold mb-1">Fecha de Emisión</label>
                        <input
                          type="date"
                          value={oficio.fecha}
                          onChange={(e) => setOficio({ ...oficio, fecha: e.target.value })}
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-cream focus:border-gold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-cream-dim font-bold mb-1">Lugar de Expedición</label>
                        <input
                          type="text"
                          value={oficio.lugar}
                          onFocus={() => handleClearOnFocus('lugar', oficio.lugar, () => setOficio({ ...oficio, lugar: '' }))}
                          onChange={(e) => setOficio({ ...oficio, lugar: e.target.value })}
                          placeholder="Tepic, Nayarit"
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-cream focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque: Datos del Destinatario (A Quién va Dirigido) */}
                  <div className="pt-3 border-t border-dark-4/70 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cream-dim block">
                      Datos del Destinatario (A Quién va Dirigido)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-cream-dim text-[10px] font-bold mb-1">Título de Cortesía</label>
                        <select
                          value={oficio.destinatarioTitulo}
                          onChange={(e) => setOficio({ ...oficio, destinatarioTitulo: e.target.value })}
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-cream font-semibold focus:border-gold focus:outline-none"
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
                        <label className="block text-cream-dim text-[10px] font-bold mb-1">Nombre Completo del Destinatario</label>
                        <input
                          type="text"
                          value={oficio.destinatarioNombre}
                          onFocus={() => handleClearOnFocus('destinatarioNombre', oficio.destinatarioNombre, () => setOficio({ ...oficio, destinatarioNombre: '' }))}
                          onChange={(e) => setOficio({ ...oficio, destinatarioNombre: e.target.value })}
                          placeholder="Ej. Roberto Sánchez Méndez"
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-cream font-bold focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-cream-dim text-[10px] font-bold mb-1">Cargo / Puesto</label>
                        <input
                          type="text"
                          value={oficio.destinatarioCargo}
                          onFocus={() => handleClearOnFocus('destinatarioCargo', oficio.destinatarioCargo, () => setOficio({ ...oficio, destinatarioCargo: '' }))}
                          onChange={(e) => setOficio({ ...oficio, destinatarioCargo: e.target.value })}
                          placeholder="Superintendente, Compras, etc."
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-cream focus:border-gold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-cream-dim text-[10px] font-bold mb-1">Empresa / Razón Social</label>
                        <input
                          type="text"
                          value={oficio.destinatarioEmpresa}
                          onFocus={() => handleClearOnFocus('destinatarioEmpresa', oficio.destinatarioEmpresa, () => setOficio({ ...oficio, destinatarioEmpresa: '' }))}
                          onChange={(e) => setOficio({ ...oficio, destinatarioEmpresa: e.target.value })}
                          placeholder="Empresa destino"
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-cream focus:border-gold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-cream-dim text-[10px] font-bold mb-1">En Atención A (Opcional)</label>
                        <input
                          type="text"
                          value={oficio.destinatarioAtencion || ''}
                          onFocus={() => handleClearOnFocus('destinatarioAtencion', oficio.destinatarioAtencion, () => setOficio({ ...oficio, destinatarioAtencion: '' }))}
                          onChange={(e) => setOficio({ ...oficio, destinatarioAtencion: e.target.value })}
                          placeholder="Ej. Ing. Residente de Control"
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-cream focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Asunto, Referencia y Vocativo */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-cream-dim font-bold mb-1">Asunto Oficial</label>
                <input
                  type="text"
                  value={oficio.asunto}
                  onFocus={() => handleClearOnFocus('asunto', oficio.asunto, () => setOficio({ ...oficio, asunto: '' }))}
                  onChange={(e) => setOficio({ ...oficio, asunto: e.target.value })}
                  placeholder="ASUNTO: COMUNICADO OFICIAL..."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream font-bold focus:border-gold focus:outline-none"
                />
              </div>

              {/* FILA EN 2 COLUMNAS: REFERENCIA DE OBRA (COL 1) Y VOCATIVO CON PLANTILLAS (COL 2) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                
                {/* COLUMNA 1: Referencia de Obra / Expediente */}
                <div className="p-3.5 rounded-2xl bg-dark-3/40 border border-dark-4 flex flex-col justify-between">
                  <div>
                    <label className="block text-cream-dim font-bold mb-1.5 flex items-center justify-between">
                      <span>Referencia de Obra / Expediente</span>
                      <span className="text-[10px] text-gold/80 font-mono">Control y Expediente</span>
                    </label>
                    <input
                      type="text"
                      value={oficio.referencia}
                      onFocus={() => handleClearOnFocus('referencia', oficio.referencia, () => setOficio({ ...oficio, referencia: '' }))}
                      onChange={(e) => setOficio({ ...oficio, referencia: e.target.value })}
                      placeholder="REF: Proyecto / Contrato / Expediente..."
                      className="w-full p-2.5 bg-dark-2 border border-dark-4 rounded-xl text-gold font-mono focus:border-gold focus:outline-none"
                    />
                    <p className="text-[11px] text-cream-muted mt-2">
                      Vincular código interno de obra o número de contrato comercial. Si lo dejas vacío, no se incluirá en el PDF.
                    </p>
                  </div>
                </div>

                {/* COLUMNA 2: Vocativo de Apertura subdividido en 2 subcolumnas (Input a la izquierda y Plantillas a la derecha) */}
                <div className="p-3.5 rounded-2xl bg-dark-3/40 border border-dark-4 flex flex-col justify-between">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start h-full">
                    
                    {/* Subcolumna 1: Formulario del Vocativo */}
                    <div className="flex flex-col justify-between h-full space-y-1.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-cream-dim font-bold">
                            Vocativo de Apertura
                          </label>
                          <span className="text-[10px] text-gold/80 font-mono">1ra persona</span>
                        </div>
                        <textarea
                          rows={3}
                          value={oficio.vocativo}
                          onFocus={() => handleClearOnFocus('vocativo', oficio.vocativo, () => setOficio({ ...oficio, vocativo: '' }))}
                          onChange={(e) => setOficio({ ...oficio, vocativo: e.target.value })}
                          placeholder="Por medio de la presente me dirijo a usted para:"
                          className="w-full p-2 bg-dark-2 border border-dark-4 rounded-xl text-cream italic text-xs leading-relaxed focus:border-gold focus:outline-none resize-none"
                        />
                      </div>
                      <p className="text-[10px] text-cream-muted">
                        Fórmula protocolaria de inicio del documento.
                      </p>
                    </div>

                    {/* Subcolumna 2: Plantillas y Ejemplos de Apertura */}
                    <div className="space-y-1.5 md:border-l md:border-dark-4/70 md:pl-3">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                          <span>💡 Plantillas:</span>
                        </span>
                        <span className="text-[9px] text-cream-dim">1 clic</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        {[
                          'Por medio de la presente me dirijo a usted de la manera más atenta para:',
                          'Por medio del presente conducto, me dirijo a usted para hacer constar:',
                          'Me es muy grato dirigirme a usted con la finalidad de:'
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setOficio({ ...oficio, vocativo: preset })}
                            className="text-left text-[10.5px] bg-dark-2 hover:bg-dark-4 text-cream-muted hover:text-gold px-2 py-1 rounded-lg border border-dark-4 hover:border-gold/40 transition-colors flex items-center gap-1.5 group cursor-pointer"
                            title={preset}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gold/50 group-hover:bg-gold flex-shrink-0"></span>
                            <span className="truncate italic">"{preset}"</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* ESTRUCTURA FORMAL DEL OFICIO EN 4 SECCIONES TÉCNICAS */}
            <div className="space-y-4 pt-2 border-t border-dark-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-gold tracking-wider">
                  Estructura y Contenido Protocolario del Documento
                </span>
                <span className="text-[10px] text-cream-dim">
                  Estructura canónica: Antecedentes, Cuerpo, Fundamentación, Petición y Cierre
                </span>
              </div>

              {/* 1. Antecedentes y Contexto Previo (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-cream mb-1 flex items-center justify-between">
                  <span>1. Antecedentes y Contexto Previo (Opcional)</span>
                  <span className="text-[10px] text-cream-muted">Contexto contractual, visitas previas o acuerdos</span>
                </label>
                <textarea
                  rows={2}
                  value={oficio.antecedentes || ''}
                  onFocus={() => handleClearOnFocus('antecedentes', oficio.antecedentes, () => setOficio({ ...oficio, antecedentes: '' }))}
                  onChange={(e) => setOficio({ ...oficio, antecedentes: e.target.value })}
                  placeholder="En seguimiento al programa de obra convenido y a las inspecciones en sitio..."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
                />
              </div>

              {/* 2. Cuerpo Principal / Exposición de Hechos y Motivos */}
              <div>
                <label className="block text-xs font-semibold text-gold mb-1 flex items-center justify-between">
                  <span>2. Cuerpo Principal / Exposición de Hechos y Motivos *</span>
                  <span className="text-[10px] text-gold/80">Desarrollo detallado del oficio</span>
                </label>
                <textarea
                  rows={6}
                  value={oficio.cuerpo}
                  onFocus={() => handleClearOnFocus('cuerpo', oficio.cuerpo, () => setOficio({ ...oficio, cuerpo: '' }))}
                  onChange={(e) => setOficio({ ...oficio, cuerpo: e.target.value })}
                  placeholder="Por medio de la presente hacemos constar que la cuadrilla especializada de ESOL ENERGÍAS..."
                  className="w-full p-3.5 bg-dark-3 border border-dark-4 rounded-2xl text-cream text-xs leading-relaxed font-mono focus:border-gold focus:outline-none"
                />
              </div>

              {/* TABLA DE INSUMOS Y CONCEPTOS (PARA SOLICITUD DE COMPRA, ORDEN DE COMPRA, ACTA DE ENTREGA/RECEPCIÓN Y VALES) */}
              {(tipoTramite === 'solicitud_compra' || tipoTramite === 'orden_compra' || tipoTramite === 'recepcion_mercancia' || tipoTramite === 'solicitud_material' || tipoTramite === 'vale_entrega') && (
                <div className="bg-dark-3/60 p-4 sm:p-5 rounded-2xl border border-gold/30 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-4/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center text-gold border border-gold/40">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-cream block">
                          Tabla de Insumos, Conceptos y Materiales
                        </span>
                        <p className="text-[10.5px] text-cream-muted">
                          Ingresa conceptos manualmente o selecciónalos del catálogo maestro.
                        </p>
                      </div>
                    </div>

                    {/* Selector de visibilidad de precios y totales */}
                    <div className="flex items-center gap-2 bg-dark-2 px-3 py-1.5 rounded-xl border border-dark-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-cream">
                        <input
                          type="checkbox"
                          checked={mostrarPreciosEnPdf}
                          onChange={(e) => handleToggleMostrarPrecios(e.target.checked)}
                          className="rounded border-dark-4 text-gold focus:ring-gold"
                        />
                        <span className="text-[11px] text-cream-dim">Mostrar precios e importes totales en el reporte</span>
                      </label>
                    </div>
                  </div>

                  {/* Formulario para agregar partida (manual o catálogo) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-dark-2/90 border border-dark-4 text-xs items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] uppercase font-bold text-cream-dim mb-1">
                        Catálogo de Insumos
                      </label>
                      <select
                        value={selectedInsumoId}
                        onChange={(e) => handleSelectInsumoCatalogo(e.target.value)}
                        className="w-full p-2 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
                      >
                        <option value="">-- Seleccionar de Catálogo --</option>
                        <option value="custom">✏️ Concepto / Partida Manual Libre</option>
                        {insumos.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} - ${i.precio_unitario.toLocaleString('es-MX')} ({i.unidad})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] uppercase font-bold text-cream-dim mb-1">
                        Descripción / Concepto *
                      </label>
                      <input
                        type="text"
                        value={customDescripcion}
                        onChange={(e) => setCustomDescripcion(e.target.value)}
                        placeholder="Descripción del concepto o material..."
                        className="w-full p-2 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] uppercase font-bold text-cream-dim mb-1">
                        Unidad
                      </label>
                      <input
                        type="text"
                        value={itemUnidad}
                        onChange={(e) => setItemUnidad(e.target.value.toUpperCase())}
                        className="w-full p-2 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs font-mono text-center focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] uppercase font-bold text-cream-dim mb-1">
                        Cant.
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={itemCantidad}
                        onFocus={() => {
                          if (itemCantidad === 0 || itemCantidad === 1 || itemCantidad === '0' || itemCantidad === '1') {
                            setItemCantidad('');
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemCantidad(val === '' ? '' : parseFloat(val));
                        }}
                        className="w-full p-2 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs font-mono text-center focus:border-gold focus:outline-none"
                        placeholder="1"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-cream-dim mb-1">
                        P. Unitario ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={itemPrecio}
                        onFocus={() => {
                          if (itemPrecio === 0 || itemPrecio === '0') {
                            setItemPrecio('');
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemPrecio(val === '' ? '' : parseFloat(val));
                        }}
                        className="w-full p-2 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs font-mono focus:border-gold focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
                        title="Agregar Partida a la Tabla"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="sm:hidden">Agregar</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabla interactiva de conceptos agregados */}
                  {partidas.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-dark-4 rounded-xl text-cream-muted text-xs bg-dark-2/40">
                      No hay conceptos ni insumos agregados aún. Usa el formulario superior para añadir partidas.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-dark-4 bg-dark-2">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-dark-3/90 text-cream-dim uppercase font-bold text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-10">#</th>
                            <th className="py-2.5 px-3">Descripción / Concepto</th>
                            <th className="py-2.5 px-3 text-center w-20">Unidad</th>
                            <th className="py-2.5 px-3 text-center w-20">Cantidad</th>
                            {mostrarPreciosEnPdf && (
                              <>
                                <th className="py-2.5 px-3 text-right w-28">P. Unitario</th>
                                <th className="py-2.5 px-3 text-right w-32">Importe</th>
                              </>
                            )}
                            <th className="py-2.5 px-3 text-center w-16">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-4">
                          {partidas.map((p, idx) => (
                            <tr key={idx} className="hover:bg-dark-3/60 transition-colors group">
                              <td className="py-2 px-3 text-cream-dim text-center font-mono">{idx + 1}</td>
                              
                              {/* Descripción editable al click */}
                              <td className="py-1 px-2 font-semibold text-cream">
                                <input
                                  type="text"
                                  value={p.descripcion}
                                  onChange={(e) => handleUpdatePartida(idx, { descripcion: e.target.value })}
                                  className="w-full bg-transparent hover:bg-dark-3/80 focus:bg-dark-3 px-2 py-1 rounded-lg border border-transparent hover:border-dark-4 focus:border-gold focus:outline-none transition-all text-xs font-semibold text-cream cursor-text"
                                  title="Haz clic para editar la descripción"
                                />
                              </td>

                              {/* Unidad editable al click */}
                              <td className="py-1 px-2 text-center">
                                <input
                                  type="text"
                                  value={p.unidad}
                                  onChange={(e) => handleUpdatePartida(idx, { unidad: e.target.value.toUpperCase() })}
                                  className="w-16 bg-transparent hover:bg-dark-3/80 focus:bg-dark-3 px-1 py-1 rounded-lg border border-transparent hover:border-dark-4 focus:border-gold focus:outline-none transition-all text-center font-mono text-cream-muted text-xs cursor-text"
                                  title="Haz clic para editar la unidad"
                                />
                              </td>

                              {/* Cantidad editable al click */}
                              <td className="py-1 px-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={p.cantidad}
                                  onFocus={(e) => {
                                    if (p.cantidad === 0) e.target.select();
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    handleUpdatePartida(idx, { cantidad: isNaN(val) ? 0 : val });
                                  }}
                                  className="w-20 bg-transparent hover:bg-dark-3/80 focus:bg-dark-3 px-1 py-1 rounded-lg border border-transparent hover:border-dark-4 focus:border-gold focus:outline-none transition-all text-center font-mono font-bold text-cream text-xs cursor-text"
                                  title="Haz clic para editar la cantidad"
                                />
                              </td>

                              {mostrarPreciosEnPdf && (
                                <>
                                  {/* Precio Unitario editable al click */}
                                  <td className="py-1 px-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="text-cream-dim text-[11px]">$</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={p.precio_unitario}
                                        onFocus={(e) => {
                                          if (p.precio_unitario === 0) e.target.select();
                                        }}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                          handleUpdatePartida(idx, { precio_unitario: isNaN(val) ? 0 : val });
                                        }}
                                        className="w-24 bg-transparent hover:bg-dark-3/80 focus:bg-dark-3 px-1.5 py-1 rounded-lg border border-transparent hover:border-dark-4 focus:border-gold focus:outline-none transition-all text-right font-mono text-cream-muted text-xs cursor-text"
                                        title="Haz clic para editar el precio unitario"
                                      />
                                    </div>
                                  </td>

                                  {/* Importe Calculado */}
                                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                    ${(p.importe ?? (p.cantidad * p.precio_unitario)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </>
                              )}

                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar partida"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-dark-3 font-bold border-t-2 border-dark-4">
                            <td colSpan={3} className="py-2.5 px-3 text-right text-cream-dim uppercase text-[10.5px]">
                              Total Cantidad:
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-xs font-black text-gold">
                              {partidas.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                            </td>
                            {mostrarPreciosEnPdf ? (
                              <>
                                <td className="py-2.5 px-3 text-right text-cream-dim uppercase text-[10.5px]">
                                  Total Estimado (MXN):
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-emerald-400">
                                  ${partidas.reduce((acc, p) => acc + (p.importe || ((Number(p.cantidad) || 0) * (Number(p.precio_unitario) || 0))), 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td></td>
                              </>
                            ) : (
                              <td></td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Fundamentación Técnica y Legal (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-cream mb-1 flex items-center justify-between">
                  <span>3. Fundamentación Técnica y Legal (Opcional)</span>
                  <span className="text-[10px] text-cream-muted">NOM-001-SEDE, STPS, CFE, Código Civil</span>
                </label>
                <textarea
                  rows={2}
                  value={oficio.fundamentacion || ''}
                  onFocus={() => handleClearOnFocus('fundamentacion', oficio.fundamentacion, () => setOficio({ ...oficio, fundamentacion: '' }))}
                  onChange={(e) => setOficio({ ...oficio, fundamentacion: e.target.value })}
                  placeholder="Con fundamento en la Norma Oficial Mexicana NOM-001-SEDE-2012 y las especificaciones técnicas..."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
                />
              </div>

              {/* 4. Petición y Requerimientos Puntuales (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-cream mb-1 flex items-center justify-between">
                  <span>4. Petición y Requerimientos Puntuales (Opcional)</span>
                  <span className="text-[10px] text-cream-muted">Puntos de solicitud o acuerdos numerados</span>
                </label>
                <textarea
                  rows={3}
                  value={oficio.peticion || ''}
                  onFocus={() => handleClearOnFocus('peticion', oficio.peticion, () => setOficio({ ...oficio, peticion: '' }))}
                  onChange={(e) => setOficio({ ...oficio, peticion: e.target.value })}
                  placeholder="1. Autorización de acceso en el horario establecido.&#10;2. Liberación del área de maniobras."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
                />
              </div>

              {/* 5. Despedida y Cierre Protocolario */}
              <div>
                <label className="block text-xs font-medium text-cream mb-1">
                  5. Despedida y Cierre Protocolario
                </label>
                <input
                  type="text"
                  value={oficio.despedida || ''}
                  onFocus={() => handleClearOnFocus('despedida', oficio.despedida, () => setOficio({ ...oficio, despedida: '' }))}
                  onChange={(e) => setOficio({ ...oficio, despedida: e.target.value })}
                  placeholder="Sin otro particular por el momento y agradeciendo su atención, quedamos a sus órdenes."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            {/* Firma y Emisor */}
            <div className="p-4 rounded-2xl bg-gold/5 border border-gold/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-gold flex-shrink-0" />
                <div>
                  <span className="font-bold text-cream block">Firma y Representación Legal</span>
                  <p className="text-[11px] text-cream-muted">
                    Emisor: <strong className="text-gold">{oficio.remitenteNombre}</strong> ({oficio.remitenteCargo}) &bull; Membrete oficial de eSol Energías.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {oficio.firmaDigital && (
                  <div className="flex items-center gap-2 bg-dark-2 px-2.5 py-1 rounded-xl border border-dark-4">
                    <img
                      src={oficio.firmaDigital}
                      alt="Firma"
                      className="h-6 max-w-[80px] object-contain bg-white/90 rounded px-1"
                    />
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Firma Lista</span>
                  </div>
                )}

                <label className="cursor-pointer px-2.5 py-1 bg-dark-3 hover:bg-dark-4 text-cream hover:text-gold border border-dark-4 hover:border-gold/40 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  <span>{oficio.firmaDigital ? 'Cambiar Firma' : 'Cargar Firma'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        if (base64) {
                          setOficio(prev => ({
                            ...prev,
                            firmaDigital: base64,
                            incluirFirmaDigital: true
                          }));
                          try {
                            localStorage.setItem('esol_firma_digital_precargada', base64);
                          } catch (err) {}
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-cream">
                  <input
                    type="checkbox"
                    checked={oficio.incluirFirmaDigital ?? true}
                    onChange={(e) => setOficio({ ...oficio, incluirFirmaDigital: e.target.checked })}
                    className="rounded border-dark-4 text-gold focus:ring-gold"
                  />
                  <span>Incluir Firma en Documento</span>
                </label>
              </div>
            </div>

            {/* BOTONERA DE ACCIÓN Y EMISIÓN DUAL */}
            <div className="pt-3 border-t border-dark-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream font-bold text-xs flex items-center justify-center gap-2 border border-dark-4 transition-all"
                >
                  <Eye className="w-4 h-4 text-gold" />
                  <span>Previsualizar Documento</span>
                </button>

                <button
                  onClick={handleGuardarBorrador}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream font-bold text-xs flex items-center justify-center gap-2 border border-dark-4 transition-all"
                >
                  <span>Guardar Borrador</span>
                </button>
              </div>

              <button
                onClick={handleEmitirFormalmente}
                disabled={isEmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-dark-1 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-gold/20 transition-all uppercase tracking-wider"
              >
                {isEmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-dark-1" />
                    <span>Emitiendo y Guardando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-dark-1" />
                    <span>Emitir Formalmente (Dual Save)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: HISTORIAL GENERAL DE PETICIONES Y OFICIOS */}
      {/* ========================================================= */}
      {viewMode === 'historial' && (
        <div className="space-y-4">
          
          {/* Filtros y Buscador */}
          <div className="bg-dark-2 p-4 rounded-2xl border border-dark-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por folio, cliente, proyecto, asunto o destinatario..."
                className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="p-2 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
              >
                <option value="todos">Todos los Trámites</option>
                <option value="oficio_legal">Oficios Legales</option>
                <option value="solicitud_compra">Solicitudes de Compra</option>
                <option value="orden_compra">Órdenes de Compra</option>
                <option value="recepcion_mercancia">Recepciones Almacén</option>
                <option value="solicitud_material">Solicitudes a Obra</option>
                <option value="vale_entrega">Vales de Entrega</option>
              </select>

              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                className="p-2 bg-dark-3 border border-dark-4 rounded-xl text-cream text-xs focus:border-gold focus:outline-none"
              >
                <option value="todos">Todos los Estados</option>
                <option value="emitido">Emitidos Oficiales</option>
                <option value="borrador">Borradores</option>
              </select>

              <button
                onClick={cargarHistorialOficios}
                className="p-2 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-gold border border-dark-4 rounded-xl transition-colors"
                title="Recargar Historial"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOficios ? 'animate-spin text-gold' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabla de Oficios */}
          <div className="bg-dark-2 rounded-3xl border border-dark-4 shadow-xl overflow-hidden">
            {filteredHistorial.length === 0 ? (
              <div className="text-center py-16 px-4">
                <FileText className="w-12 h-12 text-cream-dim/50 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-cream">No se encontraron oficios o peticiones</h4>
                <p className="text-xs text-cream-muted max-w-md mx-auto mt-1">
                  Crea una nueva solicitud de compra, orden de compra u oficio general para comenzar a registrar el historial oficial.
                </p>
                <button
                  onClick={() => setViewMode('redactar')}
                  className="mt-4 px-4 py-2 bg-gold text-dark-1 font-bold text-xs rounded-xl shadow-md"
                >
                  Redactar Nueva Petición
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-3/90 text-cream-muted uppercase font-bold border-b border-dark-4">
                    <tr>
                      <th className="py-3 px-4">Folio Oficial</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Trámite / Tipo</th>
                      <th className="py-3 px-4">Cliente Conectado (CRM)</th>
                      <th className="py-3 px-4">Proyecto / Obra</th>
                      <th className="py-3 px-4">Destinatario</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-center">PDF Emitido</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-4/70">
                    {filteredHistorial.map((item) => (
                      <tr key={item.id || item.folio} className="hover:bg-dark-3/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-cream">
                          {item.folio}
                        </td>
                        <td className="py-3 px-4 text-cream-muted">
                          {item.fecha}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-dark-3 border border-dark-4 text-gold">
                            {(item.tipoOficio || 'libre').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-cream">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                            <span>{item.clienteFinal || 'eSol Energías'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-cream-muted font-medium">
                          {item.nombreObra || 'General'}
                        </td>
                        <td className="py-3 px-4 text-cream-muted">
                          {item.destinatarioNombre} {item.destinatarioEmpresa ? `(${item.destinatarioEmpresa})` : ''}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={async () => {
                              const nuevoEstado = item.estado === 'emitido' ? 'borrador' : 'emitido';
                              await adminDbService.actualizarEstadoOficio(item.folio || item.id || '', nuevoEstado);
                              setOficiosList(prev => prev.map(o => (o.folio === item.folio || o.id === item.id) ? { ...o, estado: nuevoEstado } : o));
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border cursor-pointer hover:scale-105 transition-all ${
                              item.estado === 'emitido'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-dark-3 text-cream-muted border-dark-4 hover:border-gold hover:text-gold'
                            }`}
                            title="Haz clic para alternar entre Emitido y Borrador"
                          >
                            {item.estado === 'emitido' ? '✓ Emitido Oficial' : '✎ Borrador'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.drive_url ? (
                            <a
                              href={item.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition-all"
                              title="Ver / Descargar PDF Oficial"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await generateOficioPdf(item);
                                } catch (e: any) {
                                  alert('Error al generar PDF: ' + e.message);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-3 hover:bg-dark-4 text-cream font-bold text-[11px] border border-dark-4 transition-all"
                              title="Generar PDF ahora"
                            >
                              <Printer className="w-3.5 h-3.5 text-gold" />
                              <span>Generar</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleCargarOficioHistorial(item)}
                              className="p-1.5 text-cream-muted hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                              title="Cargar en el Redactor"
                            >
                              <Edit3 className="w-4 h-4" />
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

      {/* Modal de Previsualización Oficial */}
      {isPreviewOpen && (
        <OficioPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          oficio={oficio}
        />
      )}
    </div>
  );
};

export default CentroOficiosTab;
