import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Search, Trash2, Edit3, Printer, ExternalLink, CheckCircle, Clock,
  ArrowRight, DollarSign, Send, FolderCheck, Building2, User, Phone, Mail, MapPin,
  Calendar, ShieldCheck, Sparkles, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { supabase } from '../../context/supabase';
import { useApp } from '../../context/AppContext';
import { generateAIContent } from '../../lib/aiService';
import type { 
  CotizacionExpressData, PartidaCotizacionExpress, EstadoCotizacionExpress, PlantillaExpressPreset 
} from '../../types/cotizadorExpress';
import { PLANTILLAS_EXPRESS } from './plantillasExpress';
import { cotizadorExpressService } from '../../services/cotizadorExpressService';
import { 
  generateCotizacionExpressPdf, formatCurrency, numeroALetras 
} from './cotizadorExpressPdf';

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
  const [activeTabSub, setActiveTabSub] = useState<'emitidas' | 'borradores' | 'todas'>('emitidas');
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
    notas_comerciales: 'Cotización sujeta a disponibilidad y cambios sin previo aviso tras vencer su vigencia.',
    remitente_nombre: currentUser?.name || 'Ing. Manuel de Jesús Fregoso Samaniega',
    remitente_cargo: 'Representante Legal / Dirección de Operaciones',
    incluir_firma_digital: true
  });

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const list = await cotizadorExpressService.getCotizaciones();
      setCotizaciones(list);

      // Cargar clientes de Supabase
      const { data: cliData } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre_razon_social', { ascending: true });
      if (cliData) setClientes(cliData);
    } catch (e) {
      console.error('Error cargando cotizaciones express:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalcular montos
  const recomputeTotals = (partidas: PartidaCotizacionExpress[], desc: number, ivaPct: number) => {
    const sub = partidas.reduce((acc, p) => acc + (p.importe || 0), 0);
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

  // Abrir nuevo
  const handleOpenNew = (presetId?: string) => {
    const preset = PLANTILLAS_EXPRESS.find(p => p.id === presetId) || PLANTILLAS_EXPRESS[0];
    const initialPartidas: PartidaCotizacionExpress[] = preset.partidasDefault.map(p => ({
      ...p,
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
    }));

    const totals = recomputeTotals(initialPartidas, 0, 16);

    setEditingId(null);
    setFormData({
      id: `cot_${Date.now()}`,
      folio: '', // Se asignará provisionalmente como BORR-XXX o COT al guardar
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
      asunto: preset.asuntoDefault,
      vocativo: 'Estimado(a) Cliente / Representante Autorizado:',
      tipo_servicio: preset.tipo_servicio,
      descripcion_alcance: preset.alcanceDefault,
      partidas: initialPartidas,
      ...totals,
      tiempo_entrega: preset.tiempoEntregaDefault,
      condiciones_pago: preset.condicionesPagoDefault,
      banco_receptor: 'BBVA Bancomer Esol Energías',
      cuenta_clabe: '',
      notas_comerciales: 'Precios expresados en Moneda Nacional (MXN). Validez sujeta a vigencia estipulada.',
      remitente_nombre: currentUser?.name || 'Ing. Manuel de Jesús Fregoso Samaniega',
      remitente_cargo: 'Representante Legal / Dirección de Operaciones',
      incluir_firma_digital: true
    });
    setIsEditorOpen(true);
  };

  // Aplicar plantilla rápida sobre el formulario abierto
  const handleApplyPreset = (preset: PlantillaExpressPreset) => {
    if (!confirm(`¿Deseas aplicar la plantilla "${preset.titulo}"? Reemplazará el asunto, alcances y partidas actuales.`)) return;

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

  // Guardar (Borrador o Emitir)
  const handleSave = async (estadoTarget: 'borrador' | 'emitido') => {
    if (!formData.cliente_nombre.trim()) {
      alert('Por favor especifica el nombre o razón social del cliente.');
      return;
    }
    if (formData.partidas.length === 0) {
      alert('Debes incluir al menos un concepto o partida.');
      return;
    }

    try {
      const recordToSave = { ...formData, estado: estadoTarget };
      if (estadoTarget === 'borrador' && (!recordToSave.folio || !recordToSave.folio.startsWith('BORR-'))) {
        recordToSave.folio = cotizadorExpressService.generateDraftFolio(cotizaciones);
      }
      const saved = await cotizadorExpressService.saveCotizacion(recordToSave);
      setFormData(saved);
      setIsEditorOpen(false);
      await loadData();
      alert(estadoTarget === 'borrador' ? 'Borrador guardado exitosamente.' : `Cotización emitida con éxito con folio ${saved.folio}.`);
    } catch (err: any) {
      alert('Error al guardar cotización: ' + err.message);
    }
  };

  // Imprimir / Descargar PDF
  const handlePrint = async (cot: CotizacionExpressData) => {
    setGeneratingPdf(true);
    setDriveStatus('idle');
    try {
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
      alert(`¡Cuenta por cobrar generada exitosamente con folio ${folioIngreso || 'de Tesorería'}!`);
    } catch (e: any) {
      alert('Error al conectar con Tesorería: ' + e.message);
    }
  };

  // Mejorar redacción con IA
  const handleMejorarConIA = async () => {
    if (!globalGeminiApiKey && !siliconFlowApiKey) {
      alert('Configura tu API Key de Gemini o Silicon Flow en el sistema.');
      return;
    }
    setGeneratingAi(true);
    try {
      const prompt = `Actúa como Director Técnico y Comercial de ESOL Energías Renovables.
Mejora y formaliza la redacción técnica del alcance para esta cotización formal.
Asunto: ${formData.asunto}
Cliente: ${formData.cliente_nombre}
Texto actual:
${formData.descripcion_alcance || 'Cotización de servicios de inspección e ingeniería'}

Reglas:
- Tono corporativo, técnico, claro, ejecutivo y persuasivo.
- Sin saludos excesivos ni despedidas. Directo a las especificaciones y entregables.
- Formato con viñetas limpias para los alcances.`;

      const aiText = await generateAIContent(
        [{ role: 'user', content: prompt }],
        globalGeminiApiKey,
        siliconFlowApiKey,
        'gemini-2.5-flash',
        0.3
      );
      if (aiText) {
        setFormData(p => ({ ...p, descripcion_alcance: aiText }));
      }
    } catch (err: any) {
      alert('Error de IA: ' + err.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Filtros de listado
  const filteredList = useMemo(() => {
    return cotizaciones.filter(c => {
      const matchesSearch = 
        c.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.asunto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = 
        activeTabSub === 'todas' ? true :
        activeTabSub === 'borradores' ? c.estado === 'borrador' :
        c.estado !== 'borrador';

      return matchesSearch && matchesTab;
    });
  }, [cotizaciones, searchTerm, activeTabSub]);

  // Contadores KPIs
  const totalEmitidas = cotizaciones.filter(c => c.estado !== 'borrador').length;
  const totalBorradores = cotizaciones.filter(c => c.estado === 'borrador').length;
  const montoTotalEmitido = cotizaciones
    .filter(c => c.estado !== 'borrador')
    .reduce((acc, c) => acc + (c.total || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in text-cream pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
              Propuestas Formales
            </span>
            <h2 className="text-xl font-bold text-cream">Cotizaciones Rápidas de Servicios e Insumos</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Generador ejecutivo de propuestas tipo oficio para visitas técnicas, ingeniería, suministros y pólizas de mantenimiento.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleOpenNew()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl font-black text-xs shadow-lg shadow-gold/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Cotización</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-cream-muted uppercase tracking-wider">Propuestas Emitidas</div>
            <div className="text-2xl font-black text-gold font-mono mt-0.5">{totalEmitidas}</div>
            <div className="text-[10px] text-cream-dim mt-0.5">Folios oficiales generados</div>
          </div>
          <div className="p-3 bg-gold/10 text-gold rounded-xl border border-gold/20">
            <FolderCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-cream-muted uppercase tracking-wider">Monto Emitido ($ MXN)</div>
            <div className="text-2xl font-black text-cream font-mono mt-0.5">{formatCurrency(montoTotalEmitido)}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">En propuestas activas</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-cream-muted uppercase tracking-wider">Borradores en Curso</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">{totalBorradores}</div>
            <div className="text-[10px] text-cream-dim mt-0.5">Propuestas por confirmar</div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BUSCADOR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por folio, cliente o asunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-xs text-cream focus:border-gold outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-dark-3 rounded-lg p-0.5 border border-dark-4">
            <button
              onClick={() => setActiveTabSub('emitidas')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTabSub === 'emitidas' ? 'bg-gold text-dark-1 shadow-sm' : 'text-cream-muted hover:text-cream'
              }`}
            >
              Emitidas ({totalEmitidas})
            </button>
            <button
              onClick={() => setActiveTabSub('borradores')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTabSub === 'borradores' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-cream-muted hover:text-cream'
              }`}
            >
              Borradores ({totalBorradores})
            </button>
            <button
              onClick={() => setActiveTabSub('todas')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTabSub === 'todas' ? 'bg-dark-4 text-cream' : 'text-cream-muted hover:text-cream'
              }`}
            >
              Todas ({cotizaciones.length})
            </button>
          </div>
        </div>
      </div>

      {/* LISTADO DE COTIZACIONES */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-cream-muted text-xs">Cargando cotizaciones...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-cream-dim/40 mx-auto mb-3" />
            <div className="text-base font-bold text-cream">No hay cotizaciones en esta vista</div>
            <p className="text-xs text-cream-muted max-w-sm mx-auto mt-1">
              Comienza emitiendo una nueva cotización formal o selecciona una de las plantillas preconfiguradas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-[10px] font-black uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente / Destinatario</th>
                  <th className="py-3 px-4">Asunto / Servicio</th>
                  <th className="py-3 px-4 text-right">Total Net</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Google Drive</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/60">
                {filteredList.map((cot) => {
                  const isBorrador = cot.estado === 'borrador';
                  const isAprobada = cot.estado === 'aprobada' || cot.estado === 'cobrada';

                  return (
                    <tr key={cot.id} className="hover:bg-dark-3/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gold">
                        {cot.folio || 'BORRADOR'}
                      </td>
                      <td className="py-3.5 px-4 text-cream-muted">
                        {new Date(cot.fecha).toLocaleDateString('es-MX')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-cream">{cot.cliente_nombre}</div>
                        {cot.cliente_atencion && (
                          <div className="text-[10px] text-cream-dim">At´n: {cot.cliente_atencion}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-cream-muted">
                        <span className="text-cream font-medium block truncate">{cot.asunto}</span>
                        <span className="text-[10px] text-cream-dim capitalize">{cot.tipo_servicio.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-cream">
                        {formatCurrency(cot.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          isBorrador ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                          isAprobada ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                          'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}>
                          {isBorrador ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {cot.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cot.drive_url ? (
                          <a
                            href={cot.drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-gold hover:underline font-mono"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir Drive</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-cream-dim/50">Pendiente</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Imprimir / Ver PDF */}
                          <button
                            onClick={() => handlePrint(cot)}
                            disabled={generatingPdf}
                            title="Generar PDF Oficial"
                            className="p-1.5 bg-dark-3 hover:bg-gold/20 text-gold border border-dark-4 hover:border-gold/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Pasar a Ingresos en Tesorería si está aprobada */}
                          {!isBorrador && !cot.ingreso_id && (
                            <button
                              onClick={() => handleMandarACobrar(cot)}
                              title="Enviar a Tesorería / Cuentas por Cobrar (CxC)"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setEditingId(cot.id);
                              setFormData(cot);
                              setIsEditorOpen(true);
                            }}
                            title="Editar"
                            className="p-1.5 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={async () => {
                              if (!confirm(`¿Deseas eliminar la cotización ${cot.folio}?`)) return;
                              await cotizadorExpressService.deleteCotizacion(cot.id);
                              loadData();
                            }}
                            title="Eliminar"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL / EDITOR DE COTIZACIÓN */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-dark-1/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-4 flex justify-between items-center bg-dark-3/60">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                  {formData.estado === 'borrador' ? 'Modo Borrador' : 'Propuesta Emitida'}
                </span>
                <h3 className="text-base font-bold text-cream mt-1">
                  {editingId ? `Editar Cotización ${formData.folio || ''}` : 'Nueva Propuesta Formal de Servicios'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-cream-dim hover:text-cream p-1.5 rounded-lg bg-dark-3 border border-dark-4"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              
              {/* ACCESO RÁPIDO A PLANTILLAS */}
              <div className="bg-dark-3/50 p-3.5 rounded-xl border border-dark-4">
                <div className="text-[10px] font-black uppercase text-gold tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3 h-3" />
                  <span>Cargar Plantilla Preconfigurada (1 clic):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLANTILLAS_EXPRESS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-left p-2.5 rounded-lg bg-dark-2 hover:bg-gold/10 border border-dark-4 hover:border-gold/40 transition-all cursor-pointer group"
                    >
                      <div className="font-bold text-cream group-hover:text-gold text-[11px] truncate">
                        {preset.titulo}
                      </div>
                      <div className="text-[9px] text-cream-dim truncate mt-0.5">
                        {preset.subtitulo}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DATOS DEL CLIENTE Y GENERALES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-3/30 p-4 rounded-xl border border-dark-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-cream flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gold" />
                      <span>Cliente / Razón Social *</span>
                    </label>
                    {clientes.length > 0 && (
                      <select
                        onChange={(e) => handleSelectCliente(e.target.value)}
                        className="bg-dark-3 border border-dark-4 rounded px-2 py-0.5 text-[10px] text-gold outline-none"
                      >
                        <option value="">Buscar en BD Clientes...</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre_razon_social || c.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Nombre o Razón Social del cliente..."
                    value={formData.cliente_nombre}
                    onChange={e => setFormData(p => ({ ...p, cliente_nombre: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-cream outline-none focus:border-gold"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-cream-muted mb-1 block">Atención a:</label>
                      <input
                        type="text"
                        placeholder="Contacto o cargo..."
                        value={formData.cliente_atencion || ''}
                        onChange={e => setFormData(p => ({ ...p, cliente_atencion: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream-muted mb-1 block">RFC:</label>
                      <input
                        type="text"
                        placeholder="XAXX010101000"
                        value={formData.cliente_rfc || ''}
                        onChange={e => setFormData(p => ({ ...p, cliente_rfc: e.target.value.toUpperCase() }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-cream-muted mb-1 block">Domicilio / Ubicación:</label>
                    <input
                      type="text"
                      placeholder="Dirección fiscal o sitio del servicio..."
                      value={formData.cliente_direccion || ''}
                      onChange={e => setFormData(p => ({ ...p, cliente_direccion: e.target.value }))}
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-cream-muted mb-1 block">Fecha Emisión:</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream-muted mb-1 block">Vigencia (Días):</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.vigencia_dias}
                        onChange={e => setFormData(p => ({ ...p, vigencia_dias: Number(e.target.value) || 15 }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-cream-muted mb-1 block">Lugar de Expedición:</label>
                    <input
                      type="text"
                      value={formData.lugar}
                      onChange={e => setFormData(p => ({ ...p, lugar: e.target.value }))}
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-cream-muted mb-1 block">Teléfono Contacto:</label>
                      <input
                        type="text"
                        placeholder="311..."
                        value={formData.cliente_telefono || ''}
                        onChange={e => setFormData(p => ({ ...p, cliente_telefono: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream-muted mb-1 block">Correo Electrónico:</label>
                      <input
                        type="email"
                        placeholder="cliente@ejemplo.com"
                        value={formData.cliente_email || ''}
                        onChange={e => setFormData(p => ({ ...p, cliente_email: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ASUNTO Y ALCANCE */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-cream mb-1 block">Asunto Formal del Oficio *</label>
                  <input
                    type="text"
                    value={formData.asunto}
                    onChange={e => setFormData(p => ({ ...p, asunto: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-cream outline-none focus:border-gold font-bold text-xs"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-cream">Alcance Técnico y Descripción del Servicio</label>
                    <button
                      type="button"
                      onClick={handleMejorarConIA}
                      disabled={generatingAi}
                      className="px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`w-3 h-3 ${generatingAi ? 'animate-pulse' : ''}`} />
                      <span>{generatingAi ? 'Mejorando...' : 'Mejorar con IA'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.descripcion_alcance}
                    onChange={e => setFormData(p => ({ ...p, descripcion_alcance: e.target.value }))}
                    placeholder="Describe los alcances, normativas aplicables y entregables..."
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-cream outline-none focus:border-gold text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* TABLA DE PARTIDAS Y CONCEPTOS */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-cream uppercase text-[11px] tracking-wider text-gold">
                    Conceptos y Partidas de la Cotización
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddPartida}
                    className="flex items-center gap-1 px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[10px] font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Concepto</span>
                  </button>
                </div>

                <div className="border border-dark-4 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-dark-3 text-[10px] uppercase font-bold text-cream-muted border-b border-dark-4">
                      <tr>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-2 w-24">Unidad</th>
                        <th className="py-2.5 px-2 w-20 text-center">Cant.</th>
                        <th className="py-2.5 px-2 w-28 text-right">P. Unitario</th>
                        <th className="py-2.5 px-2 w-28 text-right">Importe</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4">
                      {formData.partidas.map((item, idx) => (
                        <tr key={item.id} className="bg-dark-2">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.descripcion}
                              onChange={e => handleUpdatePartida(idx, 'descripcion', e.target.value)}
                              className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-cream outline-none focus:border-gold"
                            />
                            <input
                              type="text"
                              placeholder="Notas técnicas complementarias (opcional)..."
                              value={item.notas || ''}
                              onChange={e => handleUpdatePartida(idx, 'notas', e.target.value)}
                              className="w-full bg-transparent border-0 px-2 py-0.5 text-[10px] text-cream-dim outline-none focus:text-cream mt-0.5"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.unidad}
                              onChange={e => handleUpdatePartida(idx, 'unidad', e.target.value)}
                              className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-cream outline-none focus:border-gold"
                            >
                              <option value="Servicio">Servicio</option>
                              <option value="Visita">Visita</option>
                              <option value="Proyecto">Proyecto</option>
                              <option value="Trámite">Trámite</option>
                              <option value="PZA">PZA</option>
                              <option value="Lote">Lote</option>
                              <option value="ML">ML</option>
                              <option value="M2">M2</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={e => handleUpdatePartida(idx, 'cantidad', Number(e.target.value) || 0)}
                              className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-center font-bold text-cream outline-none focus:border-gold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.precio_unitario}
                              onChange={e => handleUpdatePartida(idx, 'precio_unitario', Number(e.target.value) || 0)}
                              className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-right font-mono text-cream outline-none focus:border-gold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-gold">
                            {formatCurrency(item.importe)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePartida(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TOTALES */}
                <div className="flex justify-end pt-2">
                  <div className="w-72 bg-dark-3/60 p-3.5 rounded-xl border border-dark-4 space-y-1.5">
                    <div className="flex justify-between text-cream-muted">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold text-cream">{formatCurrency(formData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-cream-muted">
                      <span>Descuento ($):</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.descuento}
                        onChange={e => {
                          const desc = Number(e.target.value) || 0;
                          const t = recomputeTotals(formData.partidas, desc, formData.iva_porcentaje);
                          setFormData(p => ({ ...p, ...t }));
                        }}
                        className="w-24 bg-dark-3 border border-dark-4 rounded px-1.5 py-0.5 text-right font-mono text-rose-400 outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center text-cream-muted">
                      <span>IVA (%):</span>
                      <select
                        value={formData.iva_porcentaje}
                        onChange={e => {
                          const pct = Number(e.target.value) || 0;
                          const t = recomputeTotals(formData.partidas, formData.descuento, pct);
                          setFormData(p => ({ ...p, ...t }));
                        }}
                        className="bg-dark-3 border border-dark-4 rounded px-1.5 py-0.5 text-xs text-cream outline-none"
                      >
                        <option value="16">16% (General)</option>
                        <option value="8">8% (Frontera)</option>
                        <option value="0">0% (Exento)</option>
                      </select>
                    </div>
                    <div className="flex justify-between text-cream-muted">
                      <span>IVA Monto:</span>
                      <span className="font-mono text-cream">{formatCurrency(formData.iva_monto)}</span>
                    </div>
                    <div className="border-t border-dark-4 pt-1.5 flex justify-between font-black text-sm text-gold">
                      <span>TOTAL:</span>
                      <span className="font-mono text-base">{formatCurrency(formData.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONDICIONES COMERCIALES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-3/30 p-4 rounded-xl border border-dark-4">
                <div>
                  <label className="text-[10px] text-cream-muted mb-1 block">Tiempo de Ejecución / Entrega:</label>
                  <input
                    type="text"
                    value={formData.tiempo_entrega}
                    onChange={e => setFormData(p => ({ ...p, tiempo_entrega: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cream-muted mb-1 block">Condiciones de Pago:</label>
                  <input
                    type="text"
                    value={formData.condiciones_pago}
                    onChange={e => setFormData(p => ({ ...p, condiciones_pago: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cream-muted mb-1 block">Banco / Datos para SPEI:</label>
                  <input
                    type="text"
                    value={formData.banco_receptor || ''}
                    onChange={e => setFormData(p => ({ ...p, banco_receptor: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cream-muted mb-1 block">CLABE Interbancaria (Opcional):</label>
                  <input
                    type="text"
                    placeholder="18 dígitos..."
                    value={formData.cuenta_clabe || ''}
                    onChange={e => setFormData(p => ({ ...p, cuenta_clabe: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold font-mono text-xs"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer con opciones de Guardar Borrador y Emitir */}
            <div className="p-4 border-t border-dark-4 bg-dark-3/80 flex flex-wrap justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 bg-dark-4 hover:bg-dark-3 text-cream-muted hover:text-cream rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave('borrador')}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Guardar Borrador</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('emitido')}
                  className="px-5 py-2 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black shadow-lg shadow-gold/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir Oficialmente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
