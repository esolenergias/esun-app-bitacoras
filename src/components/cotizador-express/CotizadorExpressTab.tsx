import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Search, FolderCheck, RefreshCw, Layers, ArrowRight 
} from 'lucide-react';
import { supabase } from '../../context/supabase';
import { useApp } from '../../context/AppContext';
import { generateAIContent } from '../../lib/aiService';
import type { 
  CotizacionExpressData, PartidaCotizacionExpress, PlantillaExpressPreset 
} from '../../types/cotizadorExpress';
import { PLANTILLAS_EXPRESS } from './plantillasExpress';
import { cotizadorExpressService } from '../../services/cotizadorExpressService';
import { 
  generateCotizacionExpressPdf, formatCurrency, numeroALetras 
} from './cotizadorExpressPdf';
import { CotizadorKpis } from './CotizadorKpis';
import { CotizadorTabla } from './CotizadorTabla';
import { CotizadorModalEditor } from './CotizadorModalEditor';
import { auditService } from '../../services/auditService';

export const CotizadorExpressTab: React.FC = () => {
  const { currentUser, globalGeminiApiKey, siliconFlowApiKey } = useApp();
  
  // Lista de cotizaciones & Clientes
  const [cotizaciones, setCotizaciones] = useState<CotizacionExpressData[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'uploading' | 'success' | 'none'>('idle');

  // Filtros de listado
  const [activeTabSub, setActiveTabSub] = useState<'todas' | 'aceptadas' | 'emitidas' | 'borradores'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modo Editor / Formulario
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CotizacionExpressData>({
    id: '',
    folio: '',
    estado: 'borrador',
    fecha: new Date().toISOString().split('T')[0],
    lugar: 'Tepic, Nayarit',
    vigencia_dias: 15,
    cliente_nombre: '',
    cliente_atencion: '',
    cliente_rfc: '',
    cliente_direccion: '',
    cliente_telefono: '',
    cliente_email: '',
    asunto: 'PROPUESTA DE SERVICIOS PROFESIONALES E INGENIERÍA',
    vocativo: 'Estimado(a) Cliente / Comité de Operaciones:',
    tipo_servicio: 'servicios_profesionales',
    descripcion_alcance: '',
    incluir_condiciones_servicio: true,
    incluir_condiciones_trabajo: true,
    condiciones_servicio: '',
    metodologia_servicio: '',
    partidas: [],
    subtotal: 0,
    descuento: 0,
    iva_porcentaje: 16,
    iva_monto: 0,
    total: 0,
    tiempo_entrega: '3 a 5 días hábiles',
    condiciones_pago: '50% anticipo al autorizar y 50% finiquito contra entrega',
    banco_receptor: 'BBVA Bancomer Esol Energías',
    cuenta_clabe: '',
    notas_comerciales: 'Precios en MXN. Validez sujeta a vigencia estipulada.',
    condiciones_trabajo: '',
    responsabilidades_cliente: '',
    exclusiones_garantias: '',
    remitente_nombre: currentUser?.name || 'Ing. Manuel de Jesús Fregoso Samaniega',
    remitente_cargo: 'Representante Legal / Dirección de Operaciones',
    incluir_firma_digital: true
  });

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await cotizadorExpressService.getCotizaciones();
      setCotizaciones(data);

      const { data: dbClientes } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

      if (dbClientes) setClientes(dbClientes);
    } catch (err) {
      console.error('Error cargando datos de cotizador:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recálculo de totales
  const recomputeTotals = (
    parts: PartidaCotizacionExpress[],
    desc: number,
    ivaPct: number
  ) => {
    const sub = parts.reduce((acc, p) => acc + (p.importe || 0), 0);
    const subConDesc = Math.max(0, sub - (desc || 0));
    const iva = subConDesc * ((ivaPct || 0) / 100);
    const tot = subConDesc + iva;
    return {
      subtotal: sub,
      descuento: desc || 0,
      iva_monto: iva,
      total: tot,
      total_letras: numeroALetras(tot)
    };
  };

  // Abrir nuevo (Si no se especifica presetId, abre una cotización totalmente en blanco)
  const handleOpenNew = (presetId?: string) => {
    const preset = presetId ? PLANTILLAS_EXPRESS.find(p => p.id === presetId) : null;
    
    const initialPartidas: PartidaCotizacionExpress[] = preset
      ? preset.partidasDefault.map(p => ({
          ...p,
          id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
        }))
      : [
          {
            id: `p_${Date.now()}_1`,
            descripcion: '',
            unidad: 'Servicio',
            cantidad: 1,
            precio_unitario: 0,
            importe: 0
          }
        ];

    const totals = recomputeTotals(initialPartidas, 0, 16);

    setEditingId(null);
    setFormData({
      id: `cot_${Date.now()}`,
      folio: '',
      estado: 'borrador',
      fecha: new Date().toISOString().split('T')[0],
      lugar: 'Tepic, Nayarit',
      vigencia_dias: 15,
      cliente_nombre: '',
      cliente_atencion: '',
      cliente_rfc: '',
      cliente_direccion: '',
      cliente_telefono: '',
      cliente_email: '',
      asunto: preset ? preset.asuntoDefault : '',
      vocativo: 'Estimado(a) Cliente / Representante Autorizado:',
      tipo_servicio: preset ? preset.tipo_servicio : 'servicios_profesionales',
      descripcion_alcance: preset ? preset.alcanceDefault : '',
      incluir_condiciones_servicio: true,
      incluir_condiciones_trabajo: true,
      condiciones_servicio: preset?.condicionesServicioDefault || '',
      metodologia_servicio: preset?.metodologiaServicioDefault || '',
      partidas: initialPartidas,
      ...totals,
      tiempo_entrega: preset?.tiempoEntregaDefault || '',
      condiciones_pago: preset?.condicionesPagoDefault || '',
      banco_receptor: 'BBVA Bancomer Esol Energías',
      cuenta_clabe: '',
      notas_comerciales: '',
      condiciones_trabajo: preset?.condicionesTrabajoDefault || '',
      responsabilidades_cliente: preset?.responsabilidadesClienteDefault || '',
      exclusiones_garantias: preset?.exclusionesGarantiasDefault || '',
      remitente_nombre: currentUser?.name || 'Ing. Manuel de Jesús Fregoso Samaniega',
      remitente_cargo: 'Representante Legal / Dirección de Operaciones',
      incluir_firma_digital: true
    });
    setIsEditorOpen(true);
  };

  // Aplicar plantilla rápida sobre el formulario abierto
  const handleApplyPreset = (preset: PlantillaExpressPreset) => {
    if (!confirm(`¿Deseas aplicar la plantilla "${preset.titulo}"? Reemplazará las condiciones, alcances y conceptos actuales.`)) return;

    const newPartidas: PartidaCotizacionExpress[] = preset.partidasDefault.map(p => ({
      ...p,
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
    }));
    const totals = recomputeTotals(newPartidas, formData.descuento, formData.iva_porcentaje);

    setFormData(prev => ({
      ...prev,
      asunto: preset.asuntoDefault,
      tipo_servicio: preset.tipo_servicio,
      descripcion_alcance: preset.alcanceDefault,
      condiciones_servicio: preset.condicionesServicioDefault || '',
      metodologia_servicio: preset.metodologiaServicioDefault || '',
      condiciones_trabajo: preset.condicionesTrabajoDefault || '',
      responsabilidades_cliente: preset.responsabilidadesClienteDefault || '',
      exclusiones_garantias: preset.exclusionesGarantiasDefault || '',
      tiempo_entrega: preset.tiempoEntregaDefault,
      condiciones_pago: preset.condicionesPagoDefault,
      partidas: newPartidas,
      ...totals
    }));
  };

  // Seleccionar cliente de Supabase
  const handleSelectCliente = (cliId: string) => {
    const c = clientes.find(item => item.id === cliId);
    if (!c) return;
    setFormData(prev => ({
      ...prev,
      cliente_id: c.id,
      cliente_nombre: c.nombre_razon_social || c.nombre || '',
      cliente_atencion: c.contacto_nombre || c.nombre || '',
      cliente_rfc: c.rfc || '',
      cliente_direccion: c.direccion || '',
      cliente_telefono: c.telefono || '',
      cliente_email: c.email || ''
    }));
  };

  // Modificar partidas
  const handleUpdatePartida = (idx: number, field: keyof PartidaCotizacionExpress, val: any) => {
    const updated = [...formData.partidas];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'cantidad' || field === 'precio_unitario') {
      const cant = Number(field === 'cantidad' ? val : updated[idx].cantidad) || 0;
      const pu = Number(field === 'precio_unitario' ? val : updated[idx].precio_unitario) || 0;
      updated[idx].importe = cant * pu;
    }
    const totals = recomputeTotals(updated, formData.descuento, formData.iva_porcentaje);
    setFormData(prev => ({ ...prev, partidas: updated, ...totals }));
  };

  const handleAddPartida = () => {
    const newItem: PartidaCotizacionExpress = {
      id: `p_${Date.now()}`,
      descripcion: 'Concepto de servicio o suministro...',
      unidad: 'Servicio',
      cantidad: 1,
      precio_unitario: 0,
      importe: 0
    };
    const updated = [...formData.partidas, newItem];
    const totals = recomputeTotals(updated, formData.descuento, formData.iva_porcentaje);
    setFormData(prev => ({ ...prev, partidas: updated, ...totals }));
  };

  const handleRemovePartida = (idx: number) => {
    const updated = formData.partidas.filter((_, i) => i !== idx);
    const totals = recomputeTotals(updated, formData.descuento, formData.iva_porcentaje);
    setFormData(prev => ({ ...prev, partidas: updated, ...totals }));
  };

  // Guardar (con estado objetivo o el seleccionado en formulario)
  const handleSave = async (estadoTarget?: EstadoCotizacionExpress) => {
    if (!formData.cliente_nombre.trim()) {
      alert('Por favor especifica el nombre o razón social del cliente.');
      return;
    }
    if (formData.partidas.length === 0) {
      alert('Debes incluir al menos un concepto o partida.');
      return;
    }

    try {
      const finalEstado = estadoTarget || formData.estado || 'borrador';
      const recordToSave = { ...formData, estado: finalEstado };
      if (finalEstado === 'borrador' && (!recordToSave.folio || !recordToSave.folio.startsWith('BORR-'))) {
        recordToSave.folio = cotizadorExpressService.generateDraftFolio(cotizaciones);
      }
      const saved = await cotizadorExpressService.saveCotizacion(recordToSave);
      setFormData(saved);
      setIsEditorOpen(false);
      await loadData();

      // Registro de auditoría
      auditService.log({
        action: finalEstado === 'borrador' ? 'CREATE' : 'UPDATE',
        module: 'Cotizaciones Rápidas',
        description: `Guardó cotización ${saved.folio} con estado "${finalEstado}" para "${saved.cliente_nombre}" por ${formatCurrency(saved.total)}`,
        user: currentUser,
        metadata: { folio: saved.folio, cliente: saved.cliente_nombre, total: saved.total, estado: finalEstado }
      });

      alert(finalEstado === 'borrador' 
        ? 'Borrador guardado exitosamente.' 
        : `Cotización guardada con éxito (Estado: ${finalEstado.toUpperCase()}) con folio ${saved.folio}.`
      );
    } catch (err: any) {
      alert('Error al guardar cotización: ' + err.message);
    }
  };

  // Cambio directo de estado desde la tabla
  const handleUpdateEstado = async (cot: CotizacionExpressData, nuevoEstado: EstadoCotizacionExpress) => {
    try {
      let recordToUpdate = { ...cot, estado: nuevoEstado };
      
      // Si era borrador y pasa a emitido o aceptado, asignarle folio oficial si no tiene uno
      if (nuevoEstado !== 'borrador' && (!recordToUpdate.folio || recordToUpdate.folio.startsWith('BORR-'))) {
        recordToUpdate.folio = cotizadorExpressService.generateNextFolio(cotizaciones);
        recordToUpdate.fecha_emision = new Date().toISOString().split('T')[0];
      }

      await cotizadorExpressService.saveCotizacion(recordToUpdate);
      await loadData();

      // Registro de auditoría
      auditService.log({
        action: 'UPDATE',
        module: 'Cotizaciones Rápidas',
        description: `Cambió estado de cotización ${recordToUpdate.folio} a "${nuevoEstado}" para "${cot.cliente_nombre}"`,
        user: currentUser,
        metadata: { folio: recordToUpdate.folio, cliente: cot.cliente_nombre, estadoAnterior: cot.estado, nuevoEstado }
      });
    } catch (err: any) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  // Cambiar cotización de Borrador a Emitido con confirmación y asignación de folio consecutivo
  const handleEmitir = async (cot: CotizacionExpressData) => {
    if (!cot.cliente_nombre?.trim()) {
      alert('La cotización debe tener asignado el nombre del cliente para poder emitirse.');
      return;
    }
    if (!cot.partidas || cot.partidas.length === 0) {
      alert('La cotización debe incluir al menos una partida para poder emitirse.');
      return;
    }

    const nextFolioEstimado = cotizadorExpressService.generateNextFolio(cotizaciones);
    if (!confirm(`¿Deseas emitir oficialmente esta cotización para el cliente "${cot.cliente_nombre}"?\n\nSe asignará el folio oficial consecutivo: ${nextFolioEstimado}`)) {
      return;
    }

    try {
      const emitida = await cotizadorExpressService.emitirBorrador(cot.id);
      await loadData();

      // Registro de auditoría
      auditService.log({
        action: 'UPDATE',
        module: 'Cotizaciones Rápidas',
        description: `Emitió formalmente la cotización ${emitida.folio} (anteriormente borrador) para "${emitida.cliente_nombre}" por ${formatCurrency(emitida.total)}`,
        user: currentUser,
        metadata: { folio: emitida.folio, cliente: emitida.cliente_nombre, total: emitida.total }
      });

      alert(`¡Cotización emitida con éxito!\nFolio oficial asignado: ${emitida.folio}`);
    } catch (err: any) {
      alert('Error al emitir cotización: ' + err.message);
    }
  };

  // Imprimir / Descargar PDF
  const handlePrint = async (cot: CotizacionExpressData) => {
    setGeneratingPdf(true);
    setDriveStatus('idle');
    try {
      // Registro de auditoría
      auditService.log({
        action: 'EXPORT',
        module: 'Cotizaciones Rápidas',
        description: `Visualizó / Descargó el PDF oficial de la cotización ${cot.folio || 'BORRADOR'} de "${cot.cliente_nombre}"`,
        user: currentUser,
        metadata: { folio: cot.folio, cliente: cot.cliente_nombre }
      });

      const res = await generateCotizacionExpressPdf(cot, (status) => {
        setDriveStatus(status);
      });
      if (res.driveUrl) {
        await loadData();
      }
    } catch (e: any) {
      alert('Error generando PDF: ' + e.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Enviar a Tesorería / Ingresos CxC
  const handleMandarACobrar = async (cot: CotizacionExpressData) => {
    if (cot.estado === 'borrador') {
      alert('Primero debes emitir formalmente la cotización antes de pasarla a Tesorería.');
      return;
    }
    if (cot.ingreso_id) {
      alert('Esta cotización ya tiene una Cuenta por Cobrar generada en Tesorería.');
      return;
    }
    if (!confirm(`¿Deseas enviar el monto de ${formatCurrency(cot.total)} a Tesorería & Finanzas (Ingresos / CxC)?`)) return;

    try {
      const folioIngreso = await cotizadorExpressService.generarCuentaPorCobrar(cot);
      await loadData();

      // Registro de auditoría
      auditService.log({
        action: 'FINANCIAL',
        module: 'Tesorería & CxC',
        description: `Generó cuenta por cobrar en Tesorería con folio ${folioIngreso} para cotización ${cot.folio} por ${formatCurrency(cot.total)}`,
        user: currentUser,
        metadata: { folioCotizacion: cot.folio, folioIngreso, total: cot.total }
      });

      alert(`¡Cuenta por cobrar generada exitosamente con folio ${folioIngreso || 'de Tesorería'}!`);
    } catch (e: any) {
      alert('Error al conectar con Tesorería: ' + e.message);
    }
  };

  // Mejorar redacción con IA
  const handleMejorarConIA = async (campo: 'alcance' | 'condiciones_servicio' | 'condiciones_trabajo') => {
    if (!globalGeminiApiKey && !siliconFlowApiKey) {
      alert('Configura tu API Key de Gemini o Silicon Flow en el sistema.');
      return;
    }
    setGeneratingAi(true);
    try {
      let prompt = '';
      if (campo === 'alcance') {
        prompt = `Actúa como Director Técnico y Comercial de ESOL Energías Renovables.
Mejora y formaliza la redacción técnica del alcance para esta cotización formal.
Asunto: ${formData.asunto}
Cliente: ${formData.cliente_nombre}
Texto actual:
${formData.descripcion_alcance || 'Cotización de servicios de inspección e ingeniería'}

Reglas:
- Tono corporativo, técnico, claro, ejecutivo y persuasivo.
- Sin saludos excesivos ni despedidas. Directo a las especificaciones y entregables.
- Formato con viñetas limpias para los alcances.`;
      } else if (campo === 'condiciones_servicio') {
        prompt = `Actúa como Director Legal y Técnico de ESOL Energías Renovables.
Redacta o formaliza las "Condiciones del Servicio" para una cotización de tipo ${formData.tipo_servicio}.
Asunto: ${formData.asunto}
Texto base:
${formData.condiciones_servicio || 'Especificaciones de cumplimiento y calidad'}

Reglas:
- Estructurar en cláusulas concisas: 1. Alcance Normativo (NOM-001-SEDE-2012 / CFE), 2. Garantías de servicio y confidencialidad, 3. Tiempos y vigencia.
- Tono formal de ingeniería contractual, sin adornos vacíos.`;
      } else {
        prompt = `Actúa como Coordinador de Seguridad e Higiene y Operaciones de ESOL Energías Renovables.
Redacta o mejora las "Condiciones de Trabajo y Seguridad" en sitio para una cotización formal.
Asunto: ${formData.asunto}
Texto base:
${formData.condiciones_trabajo || 'Requisitos de EPP y seguridad en sitio'}

Reglas:
- Estructura: 1. Seguridad Industrial y EPP (DC-3, trabajos en altura si aplica), 2. Horarios y coordinación, 3. Responsabilidades del cliente (accesos, libranzas eléctricas).
- Enfoque preventivo y profesional.`;
      }

      const aiText = await generateAIContent(
        [{ role: 'user', content: prompt }],
        globalGeminiApiKey,
        siliconFlowApiKey,
        'gemini-2.5-flash',
        0.3
      );
      if (aiText) {
        if (campo === 'alcance') setFormData(p => ({ ...p, descripcion_alcance: aiText }));
        else if (campo === 'condiciones_servicio') setFormData(p => ({ ...p, condiciones_servicio: aiText }));
        else setFormData(p => ({ ...p, condiciones_trabajo: aiText }));
      }
    } catch (err: any) {
      alert('Error de IA: ' + err.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Filtros de listado con blindaje ante campos nulos o vacíos
  const filteredList = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return cotizaciones.filter(c => {
      const folioStr = (c.folio || '').toLowerCase();
      const clienteStr = (c.cliente_nombre || '').toLowerCase();
      const asuntoStr = (c.asunto || '').toLowerCase();

      const matchesSearch = !term || 
        folioStr.includes(term) ||
        clienteStr.includes(term) ||
        asuntoStr.includes(term);
      
      const matchesTab = 
        activeTabSub === 'todas' ? true :
        activeTabSub === 'aceptadas' ? c.estado === 'aceptado' :
        activeTabSub === 'borradores' ? c.estado === 'borrador' :
        c.estado === 'emitido';

      return matchesSearch && matchesTab;
    });
  }, [cotizaciones, searchTerm, activeTabSub]);

  // Contadores KPIs: Solo se suman en valor monetario y aprobadas las cotizaciones con estatus "aceptado"
  const totalAceptadas = cotizaciones.filter(c => c.estado === 'aceptado').length;
  const montoTotalAceptado = cotizaciones
    .filter(c => c.estado === 'aceptado')
    .reduce((acc, c) => acc + (c.total || 0), 0);
  const totalBorradores = cotizaciones.filter(c => c.estado === 'borrador').length;
  const totalCotizaciones = cotizaciones.length;

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-4 pb-5">
        <div>
          <div className="flex items-center gap-2.5 text-gold mb-1">
            <FileText className="w-6 h-6" />
            <span className="text-xs font-mono uppercase tracking-widest bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20">
              Oficios de Cotización & Servicios
            </span>
          </div>
          <h2 className="text-2xl font-bold text-cream tracking-tight">
            Cotizaciones Rápidas y Modulares
          </h2>
          <p className="text-xs text-cream-muted mt-1 max-w-2xl">
            Generador de oficios profesionales. Permite cotizaciones simples de 1 hoja (solo cuerpo económico) o propuestas completas de 2 o 3 hojas con <strong className="text-gold">Condiciones de Servicio</strong> y <strong className="text-gold">Condiciones de Trabajo</strong>.
          </p>
        </div>

        {/* BOTONES DE ACCIÓN RÁPIDA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-dark-2 hover:bg-dark-3 text-cream-muted hover:text-cream border border-dark-4 rounded-xl transition-all cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenNew()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-bold text-xs rounded-xl shadow-lg shadow-gold/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Cotización</span>
          </button>
        </div>
      </div>

      {/* KPIS RÁPIDOS (COMPONENTE MODULAR) - Solo se suman cotizaciones "Aceptadas" */}
      <CotizadorKpis 
        totalAceptadas={totalAceptadas}
        montoTotalAceptado={montoTotalAceptado}
        totalCotizaciones={totalCotizaciones}
        totalBorradores={totalBorradores}
      />

      {/* PLANTILLAS PRECONFIGURADAS RÁPIDAS EN CABECERA */}
      <div className="bg-dark-2 border border-dark-4 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cream uppercase tracking-wider">
            <Layers className="w-4 h-4 text-gold" />
            <span>Crear a partir de Plantilla Formal:</span>
          </div>
          <span className="text-[10px] text-cream-dim">Preconfiguran alcances, partidas y condiciones</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLANTILLAS_EXPRESS.map(p => (
            <button
              key={p.id}
              onClick={() => handleOpenNew(p.id)}
              className="text-left p-3 rounded-lg bg-dark-3 hover:bg-gold/10 border border-dark-4 hover:border-gold/40 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-cream group-hover:text-gold transition-colors">
                  {p.titulo}
                </div>
                <div className="text-[10px] text-cream-muted mt-1 line-clamp-2 leading-relaxed">
                  {p.subtitulo}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-dark-4 flex items-center justify-between text-[10px] text-gold font-bold">
                <span>Usar Plantilla</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-2 border border-dark-4 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-dark-3 rounded-lg border border-dark-4">
          <button
            onClick={() => setActiveTabSub('todas')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTabSub === 'todas' 
                ? 'bg-dark-4 text-cream shadow-sm' 
                : 'text-cream-dim hover:text-cream'
            }`}
          >
            Todas ({cotizaciones.length})
          </button>
          <button
            onClick={() => setActiveTabSub('aceptadas')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTabSub === 'aceptadas' 
                ? 'bg-emerald-500 text-dark-1 shadow-sm font-black' 
                : 'text-emerald-400/80 hover:text-emerald-400'
            }`}
          >
            Aceptadas ({totalAceptadas})
          </button>
          <button
            onClick={() => setActiveTabSub('emitidas')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTabSub === 'emitidas' 
                ? 'bg-gold text-dark-1 shadow-sm' 
                : 'text-cream-dim hover:text-cream'
            }`}
          >
            Emitidas ({cotizaciones.filter(c => c.estado === 'emitido').length})
          </button>
          <button
            onClick={() => setActiveTabSub('borradores')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTabSub === 'borradores' 
                ? 'bg-amber-500 text-dark-1 shadow-sm' 
                : 'text-cream-dim hover:text-cream'
            }`}
          >
            Borradores ({totalBorradores})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por folio, cliente, asunto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-dark-3 border border-dark-4 rounded-lg pl-9 pr-3 py-1.5 text-xs text-cream placeholder:text-cream-dim/60 outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL DE COTIZACIONES (COMPONENTE MODULAR) */}
      <div className="bg-dark-2 border border-dark-4 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-cream-dim">
            <RefreshCw className="w-7 h-7 mx-auto animate-spin mb-3 text-gold" />
            <p className="text-xs">Cargando cotizaciones express...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-cream-dim">
            <FolderCheck className="w-10 h-10 mx-auto mb-3 opacity-40 text-gold" />
            <p className="text-sm font-bold text-cream">No hay cotizaciones para mostrar</p>
            <p className="text-xs text-cream-muted mt-1">Crea una nueva propuesta o selecciona otra pestaña de filtro.</p>
          </div>
        ) : (
          <CotizadorTabla 
            cotizaciones={filteredList}
            generatingPdf={generatingPdf}
            onPrint={handlePrint}
            onEmitir={handleEmitir}
            onMandarACobrar={handleMandarACobrar}
            onUpdateEstado={handleUpdateEstado}
            onEdit={(cot) => {
              setEditingId(cot.id);
              setFormData({
                ...cot,
                incluir_condiciones_servicio: cot.incluir_condiciones_servicio !== false,
                incluir_condiciones_trabajo: cot.incluir_condiciones_trabajo !== false
              });
              setIsEditorOpen(true);
            }}
            onDelete={async (cot) => {
              if (!confirm(`¿Deseas eliminar la cotización ${cot.folio}?`)) return;
              await cotizadorExpressService.deleteCotizacion(cot.id);
              loadData();
            }}
          />
        )}
      </div>

      {/* MODAL / EDITOR DE COTIZACIÓN MODULAR (COMPONENTE MODULAR) */}
      {isEditorOpen && (
        <CotizadorModalEditor 
          formData={formData}
          setFormData={setFormData}
          editingId={editingId}
          clientes={clientes}
          generatingAi={generatingAi}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSave}
          onApplyPreset={handleApplyPreset}
          onSelectCliente={handleSelectCliente}
          onAddPartida={handleAddPartida}
          onUpdatePartida={handleUpdatePartida}
          onRemovePartida={handleRemovePartida}
          onMejorarConIA={handleMejorarConIA}
          recomputeTotals={recomputeTotals}
        />
      )}
    </div>
  );
};
