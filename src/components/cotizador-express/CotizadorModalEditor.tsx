import React, { useRef, useState } from 'react';
import { 
  Building2, Calendar, FileCheck, DollarSign, HardHat, CheckSquare, Plus, ArrowRight,
  Clock, Send, Sparkles, Layers, Eye, EyeOff, Maximize2
} from 'lucide-react';
import type { 
  CotizacionExpressData, PartidaCotizacionExpress, PlantillaExpressPreset 
} from '../../types/cotizadorExpress';
import { PLANTILLAS_EXPRESS } from './plantillasExpress';
import { formatCurrency } from './cotizadorExpressPdf';
import { CotizadorBlobPreview } from './CotizadorBlobPreview';

interface CotizadorModalEditorProps {
  formData: CotizacionExpressData;
  setFormData: React.Dispatch<React.SetStateAction<CotizacionExpressData>>;
  editingId: string | null;
  clientes: any[];
  generatingAi: boolean;
  onClose: () => void;
  onSave: (estado?: EstadoCotizacionExpress) => void;
  onApplyPreset: (preset: PlantillaExpressPreset) => void;
  onSelectCliente: (clienteId: string) => void;
  onAddPartida: () => void;
  onUpdatePartida: (idx: number, field: keyof PartidaCotizacionExpress, val: any) => void;
  onRemovePartida: (idx: number) => void;
  onMejorarConIA: (campo: 'alcance' | 'condiciones_servicio' | 'condiciones_trabajo') => void;
  recomputeTotals: (parts: PartidaCotizacionExpress[], desc: number, ivaPct: number) => any;
}

export const CotizadorModalEditor: React.FC<CotizadorModalEditorProps> = ({
  formData,
  setFormData,
  editingId,
  clientes,
  generatingAi,
  onClose,
  onSave,
  onApplyPreset,
  onSelectCliente,
  onAddPartida,
  onUpdatePartida,
  onRemovePartida,
  onMejorarConIA,
  recomputeTotals
}) => {
  const [editorSection, setEditorSection] = useState<'hoja1' | 'hoja2' | 'hoja3'>('hoja2');
  const [showLivePreview, setShowLivePreview] = useState<boolean>(true);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const hojasSeleccionadasCount = 
    (formData.incluir_condiciones_servicio !== false ? 1 : 0) + 
    1 + 
    (formData.incluir_condiciones_trabajo !== false ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-dark-1/85 backdrop-blur-md animate-fade-in overflow-hidden">
      {/* VENTANA MODAL AMPLIA DE ALTO APROVECHAMIENTO (98vw x 96vh) */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-[98vw] h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 border-b border-dark-4 flex justify-between items-center bg-dark-3/70 shrink-0">
          <div className="flex items-center gap-3">
            {/* Selector de Estado en el Editor */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-cream-dim">Estado:</span>
              <select
                value={formData.estado || 'borrador'}
                onChange={e => setFormData(p => ({ ...p, estado: e.target.value as any }))}
                className={`text-[10.5px] font-black uppercase px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                  formData.estado === 'aceptado' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                  formData.estado === 'emitido' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                  formData.estado === 'borrador' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  formData.estado === 'rechazado' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                  'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'
                }`}
              >
                <option value="emitido" className="bg-dark-1 text-blue-300">Emitido</option>
                <option value="borrador" className="bg-dark-1 text-amber-300">Borrador</option>
                <option value="rechazado" className="bg-dark-1 text-rose-400">Rechazado</option>
                <option value="cancelado" className="bg-dark-1 text-zinc-400">Cancelado</option>
                <option value="aceptado" className="bg-dark-1 text-emerald-400">Aceptado</option>
              </select>
            </div>

            <span className="text-[11px] text-cream font-mono font-bold">
              {formData.folio || 'NUEVO FOLIO'}
            </span>
            <span className="text-[10px] bg-dark-4 text-cream font-mono px-2 py-0.5 rounded border border-dark-5">
              Estructura: {hojasSeleccionadasCount} {hojasSeleccionadasCount === 1 ? 'Hoja' : 'Hojas'}
            </span>
            <h3 className="text-sm font-bold text-cream hidden md:inline-block">
              {editingId ? `Editar Cotización ${formData.folio || ''}` : 'Nueva Propuesta Formal de Servicios'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de Vista Previa en Vivo */}
            <button
              type="button"
              onClick={() => setShowLivePreview(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                showLivePreview 
                  ? 'bg-gold/15 text-gold border-gold/40' 
                  : 'bg-dark-3 text-cream-dim border-dark-4 hover:text-cream'
              }`}
            >
              {showLivePreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showLivePreview ? 'Vista Previa Activa' : 'Mostrar Vista Previa'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-cream-dim hover:text-cream p-1.5 rounded-lg bg-dark-3 border border-dark-4 cursor-pointer hover:bg-dark-4"
              title="Cerrar modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BARRA DE CONFIGURACIÓN MODULAR DE HOJAS */}
        <div className="bg-dark-3/80 px-5 py-2 border-b border-dark-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-bold text-cream uppercase tracking-wide">
              Estructura del Documento:
            </span>
            <span className="text-[9.5px] text-cream-dim hidden lg:inline">
              (Habilita o inhabilita hojas según la formalidad de tu cotización)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Switch Hoja 1 */}
            <label className="flex items-center gap-2 cursor-pointer bg-dark-2 px-2.5 py-1 rounded-md border border-dark-4 hover:border-gold/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.incluir_condiciones_servicio !== false}
                onChange={e => {
                  const enabled = e.target.checked;
                  setFormData(p => ({ ...p, incluir_condiciones_servicio: enabled }));
                  if (!enabled && editorSection === 'hoja1') setEditorSection('hoja2');
                }}
                className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className={`text-[11px] font-semibold ${formData.incluir_condiciones_servicio !== false ? 'text-gold' : 'text-cream-dim line-through'}`}>
                Hoja 1: Condiciones de Servicio
              </span>
            </label>

            {/* Hoja 2 (Fija) */}
            <div className="flex items-center gap-1.5 bg-dark-2 px-2.5 py-1 rounded-md border border-dark-4 text-[11px] font-bold text-cream">
              <CheckSquare className="w-3.5 h-3.5 text-gold" />
              <span>Hoja 2: Cuerpo de Cotización</span>
              <span className="text-[8.5px] text-gold/80 font-mono">(Principal)</span>
            </div>

            {/* Switch Hoja 3 */}
            <label className="flex items-center gap-2 cursor-pointer bg-dark-2 px-2.5 py-1 rounded-md border border-dark-4 hover:border-gold/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.incluir_condiciones_trabajo !== false}
                onChange={e => {
                  const enabled = e.target.checked;
                  setFormData(p => ({ ...p, incluir_condiciones_trabajo: enabled }));
                  if (!enabled && editorSection === 'hoja3') setEditorSection('hoja2');
                }}
                className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className={`text-[11px] font-semibold ${formData.incluir_condiciones_trabajo !== false ? 'text-gold' : 'text-cream-dim line-through'}`}>
                Hoja 3: Condiciones de Trabajo
              </span>
            </label>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL DIVIDIDO (FORMULARIO A LA IZQUIERDA + VISTA PREVIA BLOB A LA DERECHA) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* PANEL IZQUIERDO: FORMULARIO DE EDICIÓN CON SCROLL INDEPENDIENTE */}
          <div className={`flex flex-col h-full border-r border-dark-4 overflow-y-auto transition-all ${
            showLivePreview ? 'w-full lg:w-[54%] xl:w-[50%]' : 'w-full'
          }`}>
            
            {/* NAVEGADOR DE PESTAÑAS DE EDICIÓN */}
            <div className="flex border-b border-dark-4 bg-dark-3/50 px-5 gap-2 pt-2 shrink-0 sticky top-0 z-10 backdrop-blur-md">
              {formData.incluir_condiciones_servicio !== false && (
                <button
                  type="button"
                  onClick={() => setEditorSection('hoja1')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    editorSection === 'hoja1'
                      ? 'border-gold text-gold bg-dark-2 rounded-t-lg shadow-sm'
                      : 'border-transparent text-cream-dim hover:text-cream'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Hoja 1: Servicio</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setEditorSection('hoja2')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  editorSection === 'hoja2'
                    ? 'border-gold text-gold bg-dark-2 rounded-t-lg shadow-sm'
                    : 'border-transparent text-cream-dim hover:text-cream'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Hoja 2: Cotización & Precios</span>
              </button>

              {formData.incluir_condiciones_trabajo !== false && (
                <button
                  type="button"
                  onClick={() => setEditorSection('hoja3')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    editorSection === 'hoja3'
                      ? 'border-gold text-gold bg-dark-2 rounded-t-lg shadow-sm'
                      : 'border-transparent text-cream-dim hover:text-cream'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Hoja 3: Trabajo & Seguridad</span>
                </button>
              )}
            </div>

            {/* CUERPO DEL FORMULARIO */}
            <div className="p-5 space-y-5 flex-1 text-xs">

              {/* PLANTILLAS RÁPIDAS EN 1 CLIC */}
              <div className="bg-dark-3/40 p-3 rounded-xl border border-dark-4">
                <div className="text-[10px] font-black uppercase text-gold tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3 h-3" />
                  <span>Cargar Plantilla Base en 1 Clic:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLANTILLAS_EXPRESS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onApplyPreset(preset)}
                      className="text-left p-2 rounded-lg bg-dark-2 hover:bg-gold/10 border border-dark-4 hover:border-gold/40 transition-all cursor-pointer group"
                    >
                      <div className="font-bold text-cream group-hover:text-gold text-[10.5px] truncate">
                        {preset.titulo}
                      </div>
                      <div className="text-[9px] text-cream-dim truncate mt-0.5">
                        {preset.subtitulo}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DATOS DEL CLIENTE Y FECHA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-dark-3/30 p-3.5 rounded-xl border border-dark-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-cream flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gold" />
                      <span>Cliente / Razón Social *</span>
                    </label>
                    {clientes.length > 0 && (
                      <select
                        onChange={(e) => onSelectCliente(e.target.value)}
                        className="bg-dark-3 border border-dark-4 rounded px-2 py-0.5 text-[9.5px] text-gold outline-none"
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
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-1.5 text-cream outline-none focus:border-gold"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Atención a:</label>
                      <input
                        type="text"
                        placeholder="Contacto..."
                        value={formData.cliente_atencion || ''}
                        onChange={e => setFormData(p => ({ ...p, cliente_atencion: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2 py-1 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">RFC:</label>
                      <input
                        type="text"
                        placeholder="XAXX010101000"
                        value={formData.cliente_rfc || ''}
                        onChange={e => setFormData(p => ({ ...p, cliente_rfc: e.target.value.toUpperCase() }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2 py-1 text-cream outline-none focus:border-gold font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] text-cream-muted mb-1 block">Domicilio:</label>
                    <input
                      type="text"
                      placeholder="Dirección fiscal o sitio del servicio..."
                      value={formData.cliente_direccion || ''}
                      onChange={e => setFormData(p => ({ ...p, cliente_direccion: e.target.value }))}
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2 py-1 text-cream outline-none focus:border-gold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block flex items-center justify-between">
                        <span>Fecha Emisión:</span>
                        <span className="text-[8.5px] text-gold">(Clic calendario)</span>
                      </label>
                      <div 
                        onClick={() => {
                          try {
                            dateInputRef.current?.showPicker();
                          } catch {
                            dateInputRef.current?.focus();
                          }
                        }}
                        className="relative flex items-center cursor-pointer group"
                      >
                        <input
                          ref={dateInputRef}
                          type="date"
                          value={formData.fecha}
                          onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))}
                          className="w-full bg-dark-3 border border-dark-4 group-hover:border-gold/60 rounded-lg pl-7 pr-2 py-1 text-cream outline-none focus:border-gold text-xs font-mono cursor-pointer"
                        />
                        <Calendar className="w-3.5 h-3.5 absolute left-2 text-gold group-hover:scale-110 transition-transform pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Vigencia (Días):</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.vigencia_dias || ''}
                        onFocus={e => e.target.select()}
                        onClick={e => (e.target as HTMLInputElement).select()}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData(p => ({ ...p, vigencia_dias: val === '' ? 0 : Number(val) }));
                        }}
                        placeholder="15"
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2 py-1 text-cream outline-none focus:border-gold text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] text-cream-muted mb-1 block">Lugar Expedición:</label>
                    <input
                      type="text"
                      value={formData.lugar}
                      onChange={e => setFormData(p => ({ ...p, lugar: e.target.value }))}
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2 py-1 text-cream outline-none focus:border-gold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Teléfono:</label>
                      <input
                        type="text"
                        placeholder="311..."
                        value={formData.cliente_telefono || ''}
                        onChange={e => setFormData(p => ({ ...p, cliente_telefono: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2 py-1 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Email:</label>
                      <input
                        type="email"
                        placeholder="cliente@ejemplo.com"
                        value={formData.cliente_email || ''}
                        onChange={e => setFormData(p => ({ ...p, cliente_email: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2 py-1 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ASUNTO Y TIPO DE SERVICIO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="font-bold text-cream mb-1 block">Asunto Formal del Oficio *</label>
                  <input
                    type="text"
                    value={formData.asunto}
                    onChange={e => setFormData(p => ({ ...p, asunto: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-1.5 text-cream outline-none focus:border-gold font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-cream mb-1 block">Tipo de Servicio</label>
                  <select
                    value={formData.tipo_servicio}
                    onChange={e => setFormData(p => ({ ...p, tipo_servicio: e.target.value as any }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-1.5 text-cream outline-none focus:border-gold text-xs"
                  >
                    <option value="visita_tecnica">Visita Técnica</option>
                    <option value="servicios_profesionales">Servicios Profesionales / UVIE</option>
                    <option value="expediente_tecnico">Expediente Técnico</option>
                    <option value="suministro_insumos">Suministro de Insumos</option>
                    <option value="mantenimiento">Póliza de Mantenimiento</option>
                    <option value="libre">Servicio General / Libre</option>
                  </select>
                </div>
              </div>

              {/* ============================================================== */}
              {/* SECCIÓN 1: HOJA 1 - CONDICIONES DE SERVICIO                   */}
              {/* ============================================================== */}
              {editorSection === 'hoja1' && formData.incluir_condiciones_servicio !== false && (
                <div className="space-y-3.5 animate-fade-in border-t border-dark-4 pt-3.5">
                  <h4 className="font-bold text-gold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    <span>Configuración de Hoja 1: Presentación y Condiciones de Servicio</span>
                  </h4>

                  {/* Alcance Técnico editable aquí para la Hoja 1 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-cream">Alcance Técnico y Objetivos del Servicio (Hoja 1)</label>
                      <button
                        type="button"
                        onClick={() => onMejorarConIA('alcance')}
                        disabled={generatingAi}
                        className="px-2 py-0.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[9.5px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Mejorar con IA</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.descripcion_alcance}
                      onChange={e => setFormData(p => ({ ...p, descripcion_alcance: e.target.value }))}
                      placeholder="Describe los alcances y objetivos específicos del servicio..."
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg p-2.5 text-cream outline-none focus:border-gold text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-cream">Términos, Especificaciones y Normativa (NOM/CFE)</label>
                      <button
                        type="button"
                        onClick={() => onMejorarConIA('condiciones_servicio')}
                        disabled={generatingAi}
                        className="px-2 py-0.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[9.5px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Redactar Cláusulas con IA</span>
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.condiciones_servicio || ''}
                      onChange={e => setFormData(p => ({ ...p, condiciones_servicio: e.target.value }))}
                      placeholder="Especificaciones de cumplimiento normativo (NOM/CFE), garantías de servicio y confidencialidad..."
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg p-2.5 text-cream outline-none focus:border-gold text-xs leading-relaxed font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-cream mb-1 block">Metodología de Ejecución y Entregables (Opcional):</label>
                    <textarea
                      rows={2}
                      value={formData.metodologia_servicio || ''}
                      onChange={e => setFormData(p => ({ ...p, metodologia_servicio: e.target.value }))}
                      placeholder="Fase 1, Fase 2, Fase 3 y productos entregables al cliente..."
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg p-2 text-cream outline-none focus:border-gold text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setEditorSection('hoja2')}
                      className="px-3.5 py-1.5 bg-dark-3 hover:bg-dark-4 text-gold border border-gold/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Ir a Hoja 2: Cuerpo de Cotización</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SECCIÓN 2: HOJA 2 - CUERPO DE COTIZACIÓN (PARTIDAS & PRECIOS)  */}
              {/* ============================================================== */}
              {editorSection === 'hoja2' && (
                <div className="space-y-4 animate-fade-in border-t border-dark-4 pt-3.5">
                  
                  {/* Si Hoja 1 está inhabilitada (modo cotización simple de 1 hoja), mostramos el alcance resumido aquí */}
                  {formData.incluir_condiciones_servicio === false && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-cream">Alcance Técnico del Servicio (Cotización Simple)</label>
                        <button
                          type="button"
                          onClick={() => onMejorarConIA('alcance')}
                          disabled={generatingAi}
                          className="px-2 py-0.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[9.5px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Mejorar con IA</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={formData.descripcion_alcance}
                        onChange={e => setFormData(p => ({ ...p, descripcion_alcance: e.target.value }))}
                        placeholder="Breve descripción técnica o justificación del servicio..."
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg p-2.5 text-cream outline-none focus:border-gold text-xs leading-relaxed"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-cream uppercase text-[11px] tracking-wider text-gold flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span>Conceptos y Partidas de la Cotización</span>
                      </h4>
                      <p className="text-[9.5px] text-cream-dim">Al dar clic en Cantidad o Precio Unitario se limpia el campo para agilizar captura</p>
                    </div>
                    <button
                      type="button"
                      onClick={onAddPartida}
                      className="flex items-center gap-1 px-3 py-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Concepto</span>
                    </button>
                  </div>

                  {/* TABLA DE PARTIDAS CON LIMPIEZA AUTOMÁTICA EN CLIC */}
                  <div className="border border-dark-4 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-dark-3 text-[10px] uppercase font-bold text-cream-muted border-b border-dark-4">
                        <tr>
                          <th className="py-2 px-3">Descripción / Notas</th>
                          <th className="py-2 px-2 w-24">Unidad</th>
                          <th className="py-2 px-2 w-20 text-center">Cant.</th>
                          <th className="py-2 px-2 w-24 text-right">P. Unitario</th>
                          <th className="py-2 px-2 w-24 text-right">Importe</th>
                          <th className="py-2 px-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4">
                        {formData.partidas.map((item, idx) => (
                          <tr key={item.id} className="bg-dark-2">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.descripcion}
                                onChange={e => onUpdatePartida(idx, 'descripcion', e.target.value)}
                                className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-cream outline-none focus:border-gold"
                              />
                              <input
                                type="text"
                                placeholder="Notas técnicas complementarias (opcional)..."
                                value={item.notas || ''}
                                onChange={e => onUpdatePartida(idx, 'notas', e.target.value)}
                                className="w-full bg-transparent border-0 px-2 py-0.5 text-[9.5px] text-cream-dim outline-none focus:text-cream mt-0.5"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={item.unidad}
                                onChange={e => onUpdatePartida(idx, 'unidad', e.target.value)}
                                className="w-full bg-dark-3 border border-dark-4 rounded px-1.5 py-1 text-xs text-cream outline-none focus:border-gold"
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

                            {/* CANTIDAD: SELECCIÓN AUTOMÁTICA EN CLIC/FOCO */}
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.cantidad === 0 ? '' : item.cantidad}
                                onFocus={(e) => e.target.select()}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                onChange={e => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  onUpdatePartida(idx, 'cantidad', val);
                                }}
                                placeholder="0"
                                className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-center font-bold text-cream outline-none focus:border-gold focus:bg-dark-4"
                              />
                            </td>

                            {/* PRECIO UNITARIO: SELECCIÓN AUTOMÁTICA EN CLIC/FOCO */}
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.precio_unitario === 0 ? '' : item.precio_unitario}
                                onFocus={(e) => e.target.select()}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                onChange={e => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  onUpdatePartida(idx, 'precio_unitario', val);
                                }}
                                placeholder="0.00"
                                className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-right font-mono text-cream outline-none focus:border-gold focus:bg-dark-4"
                              />
                            </td>

                            <td className="p-2 text-right font-mono font-bold text-gold">
                              {formatCurrency(item.importe)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => onRemovePartida(idx)}
                                className="text-rose-400 hover:text-rose-300 p-1 rounded cursor-pointer"
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
                  <div className="flex justify-end pt-1">
                    <div className="w-72 bg-dark-3/60 p-3 rounded-xl border border-dark-4 space-y-1.5">
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
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          onChange={e => {
                            const desc = Number(e.target.value) || 0;
                            const t = recomputeTotals(formData.partidas, desc, formData.iva_porcentaje);
                            setFormData(p => ({ ...p, ...t }));
                          }}
                          className="w-20 bg-dark-3 border border-dark-4 rounded px-1.5 py-0.5 text-right font-mono text-rose-400 outline-none"
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

                  {/* CONDICIONES COMERCIALES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-dark-3/30 p-3 rounded-xl border border-dark-4">
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Tiempo Entrega / Ejecución:</label>
                      <input
                        type="text"
                        value={formData.tiempo_entrega}
                        onChange={e => setFormData(p => ({ ...p, tiempo_entrega: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Condiciones de Pago:</label>
                      <input
                        type="text"
                        value={formData.condiciones_pago}
                        onChange={e => setFormData(p => ({ ...p, condiciones_pago: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Banco / Beneficiario SPEI:</label>
                      <input
                        type="text"
                        value={formData.banco_receptor || ''}
                        onChange={e => setFormData(p => ({ ...p, banco_receptor: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">CLABE Interbancaria:</label>
                      <input
                        type="text"
                        placeholder="18 dígitos..."
                        value={formData.cuenta_clabe || ''}
                        onChange={e => setFormData(p => ({ ...p, cuenta_clabe: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1 text-cream outline-none focus:border-gold font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* DATOS DE FIRMAS (SI HOJA 3 ESTÁ INHABILITADA) */}
                  {formData.incluir_condiciones_trabajo === false && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-dark-3/30 p-3 rounded-xl border border-dark-4">
                      <div>
                        <label className="text-[9.5px] text-cream-muted mb-1 block">Responsable Emisión ESOL:</label>
                        <input
                          type="text"
                          value={formData.remitente_nombre}
                          onChange={e => setFormData(p => ({ ...p, remitente_nombre: e.target.value }))}
                          className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1 text-cream outline-none focus:border-gold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-cream-muted mb-1 block">Cargo:</label>
                        <input
                          type="text"
                          value={formData.remitente_cargo}
                          onChange={e => setFormData(p => ({ ...p, remitente_cargo: e.target.value }))}
                          className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1 text-cream outline-none focus:border-gold text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-1">
                    {formData.incluir_condiciones_servicio !== false ? (
                      <button
                        type="button"
                        onClick={() => setEditorSection('hoja1')}
                        className="px-3.5 py-1.5 bg-dark-3 hover:bg-dark-4 text-cream-muted rounded-xl text-xs font-bold cursor-pointer"
                      >
                        ← Volver a Hoja 1
                      </button>
                    ) : <div />}

                    {formData.incluir_condiciones_trabajo !== false && (
                      <button
                        type="button"
                        onClick={() => setEditorSection('hoja3')}
                        className="px-3.5 py-1.5 bg-dark-3 hover:bg-dark-4 text-gold border border-gold/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Siguiente: Hoja 3 (Trabajo)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SECCIÓN 3: HOJA 3 - CONDICIONES DE TRABAJO Y FIRMAS            */}
              {/* ============================================================== */}
              {editorSection === 'hoja3' && formData.incluir_condiciones_trabajo !== false && (
                <div className="space-y-3.5 animate-fade-in border-t border-dark-4 pt-3.5">
                  <h4 className="font-bold text-gold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <HardHat className="w-4 h-4" />
                    <span>Configuración de Hoja 3: Condiciones de Trabajo, EPP y Firmas</span>
                  </h4>

                  <div className="bg-dark-3/30 p-3.5 rounded-xl border border-dark-4 space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-cream flex items-center gap-1.5">
                          <HardHat className="w-3.5 h-3.5 text-gold" />
                          <span>1. Requisitos Operativos y Seguridad Industrial (EPP)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => onMejorarConIA('condiciones_trabajo')}
                          disabled={generatingAi}
                          className="px-2 py-0.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[9.5px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Redactar Seguridad con IA</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={formData.condiciones_trabajo || ''}
                        onChange={e => setFormData(p => ({ ...p, condiciones_trabajo: e.target.value }))}
                        placeholder="Requisitos en sitio, líneas de vida, DC-3, horarios laborales y protocolos de seguridad..."
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg p-2.5 text-cream outline-none focus:border-gold text-xs leading-relaxed font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-cream mb-1 block">2. Facilidades y Responsabilidades del Cliente</label>
                      <textarea
                        rows={2}
                        value={formData.responsabilidades_cliente || ''}
                        onChange={e => setFormData(p => ({ ...p, responsabilidades_cliente: e.target.value }))}
                        placeholder="Accesos a azoteas, suministro de agua/electricidad, enlace técnico asignado..."
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg p-2 text-cream outline-none focus:border-gold text-xs leading-relaxed font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-cream mb-1 block">3. Exclusiones y Términos de Garantía</label>
                      <textarea
                        rows={2}
                        value={formData.exclusiones_garantias || ''}
                        onChange={e => setFormData(p => ({ ...p, exclusiones_garantias: e.target.value }))}
                        placeholder="Qué conceptos no están amparados (obra civil mayor, derechos gubernamentales ajenos, etc.)..."
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg p-2 text-cream outline-none focus:border-gold text-xs leading-relaxed font-mono"
                      />
                    </div>
                  </div>

                  {/* REMITENTE Y FIRMAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-dark-3/30 p-3 rounded-xl border border-dark-4">
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Responsable Emisión ESOL:</label>
                      <input
                        type="text"
                        value={formData.remitente_nombre}
                        onChange={e => setFormData(p => ({ ...p, remitente_nombre: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] text-cream-muted mb-1 block">Cargo:</label>
                      <input
                        type="text"
                        value={formData.remitente_cargo}
                        onChange={e => setFormData(p => ({ ...p, remitente_cargo: e.target.value }))}
                        className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1 text-cream outline-none focus:border-gold text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setEditorSection('hoja2')}
                      className="px-3.5 py-1.5 bg-dark-3 hover:bg-dark-4 text-cream-muted rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ← Volver a Hoja 2
                    </button>
                    <span className="text-[10px] text-cream-dim flex items-center">
                      ✓ Configuración completada
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* PANEL DERECHO: VISTA PREVIA EN VIVO "BLOB:" (SPLIT VIEW) */}
          {showLivePreview && (
            <div className="hidden lg:block lg:w-[46%] xl:w-[50%] h-full p-3 bg-dark-1/60 overflow-hidden">
              <CotizadorBlobPreview formData={formData} activeSection={editorSection} />
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 border-t border-dark-4 bg-dark-3/90 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-dark-4 hover:bg-dark-3 text-cream-muted hover:text-cream rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSave('borrador')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-dark-1 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Guardar Borrador</span>
            </button>

            <button
              type="button"
              onClick={() => onSave(formData.estado === 'borrador' ? 'emitido' : formData.estado)}
              className="px-5 py-2 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black shadow-lg shadow-gold/20 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {formData.estado && formData.estado !== 'borrador' && formData.estado !== 'emitido'
                  ? `Guardar como ${formData.estado.charAt(0).toUpperCase() + formData.estado.slice(1)}`
                  : `Emitir Oficialmente (${hojasSeleccionadasCount} ${hojasSeleccionadasCount === 1 ? 'Hoja' : 'Hojas'})`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
