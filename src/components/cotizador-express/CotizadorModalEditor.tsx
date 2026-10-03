import React, { useRef } from 'react';
import { 
  Building2, Calendar, FileCheck, DollarSign, HardHat, CheckSquare, Plus, ArrowRight,
  Clock, Send, Sparkles, Layers
} from 'lucide-react';
import type { 
  CotizacionExpressData, PartidaCotizacionExpress, PlantillaExpressPreset 
} from '../../types/cotizadorExpress';
import { PLANTILLAS_EXPRESS } from './plantillasExpress';
import { formatCurrency } from './cotizadorExpressPdf';

interface CotizadorModalEditorProps {
  formData: CotizacionExpressData;
  setFormData: React.Dispatch<React.SetStateAction<CotizacionExpressData>>;
  editingId: string | null;
  clientes: any[];
  generatingAi: boolean;
  onClose: () => void;
  onSave: (estado: 'borrador' | 'emitido') => void;
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
  const [editorSection, setEditorSection] = React.useState<'hoja1' | 'hoja2' | 'hoja3'>('hoja2');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const hojasSeleccionadasCount = 
    (formData.incluir_condiciones_servicio !== false ? 1 : 0) + 
    1 + 
    (formData.incluir_condiciones_trabajo !== false ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-dark-1/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-dark-4 flex justify-between items-center bg-dark-3/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                {formData.estado === 'borrador' ? 'Modo Borrador' : 'Propuesta Emitida'}
              </span>
              <span className="text-[10px] text-cream-dim font-mono">
                {formData.folio || 'NUEVO FOLIO'}
              </span>
              <span className="text-[10px] bg-dark-4 text-cream font-mono px-2 py-0.5 rounded">
                Estructura: {hojasSeleccionadasCount} {hojasSeleccionadasCount === 1 ? 'Hoja' : 'Hojas'}
              </span>
            </div>
            <h3 className="text-base font-bold text-cream mt-1">
              {editingId ? `Editar Cotización ${formData.folio || ''}` : 'Nueva Propuesta Formal de Servicios'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-cream-dim hover:text-cream p-1.5 rounded-lg bg-dark-3 border border-dark-4 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* BARRA DE CONFIGURACIÓN DE HOJAS (HABILITAR / INHABILITAR) */}
        <div className="bg-dark-3/70 px-4 sm:px-6 py-2.5 border-b border-dark-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-cream uppercase tracking-wide">
              Hojas que componen el PDF:
            </span>
            <span className="text-[10px] text-cream-dim">
              (Marca o desmarca según lo requiera tu oficio)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Switch Hoja 1 */}
            <label className="flex items-center gap-2 cursor-pointer bg-dark-2 px-3 py-1.5 rounded-lg border border-dark-4 hover:border-gold/40 transition-colors">
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
              <span className={`text-xs font-semibold ${formData.incluir_condiciones_servicio !== false ? 'text-gold' : 'text-cream-dim line-through'}`}>
                Hoja 1: Condiciones de Servicio
              </span>
            </label>

            {/* Hoja 2 (Fija) */}
            <div className="flex items-center gap-2 bg-dark-2 px-3 py-1.5 rounded-lg border border-dark-4 text-xs font-bold text-cream">
              <CheckSquare className="w-3.5 h-3.5 text-gold" />
              <span>Hoja 2: Cuerpo de Cotización</span>
              <span className="text-[9px] text-gold/80 font-mono">(Obligatoria)</span>
            </div>

            {/* Switch Hoja 3 */}
            <label className="flex items-center gap-2 cursor-pointer bg-dark-2 px-3 py-1.5 rounded-lg border border-dark-4 hover:border-gold/40 transition-colors">
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
              <span className={`text-xs font-semibold ${formData.incluir_condiciones_trabajo !== false ? 'text-gold' : 'text-cream-dim line-through'}`}>
                Hoja 3: Condiciones de Trabajo
              </span>
            </label>
          </div>
        </div>

        {/* PESTAÑAS NAVEGADORAS DE EDICIÓN */}
        <div className="flex border-b border-dark-4 bg-dark-3/40 px-4 sm:px-6 gap-2 pt-2">
          {formData.incluir_condiciones_servicio !== false && (
            <button
              type="button"
              onClick={() => setEditorSection('hoja1')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                editorSection === 'hoja1'
                  ? 'border-gold text-gold bg-dark-2/60 rounded-t-lg'
                  : 'border-transparent text-cream-dim hover:text-cream'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Hoja 1: Condiciones de Servicio</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setEditorSection('hoja2')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              editorSection === 'hoja2'
                ? 'border-gold text-gold bg-dark-2/60 rounded-t-lg'
                : 'border-transparent text-cream-dim hover:text-cream'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Hoja 2: Cuerpo de Cotización</span>
          </button>

          {formData.incluir_condiciones_trabajo !== false && (
            <button
              type="button"
              onClick={() => setEditorSection('hoja3')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                editorSection === 'hoja3'
                  ? 'border-gold text-gold bg-dark-2/60 rounded-t-lg'
                  : 'border-transparent text-cream-dim hover:text-cream'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>Hoja 3: Condiciones de Trabajo</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* ACCESO RÁPIDO A PLANTILLAS */}
          <div className="bg-dark-3/50 p-3.5 rounded-xl border border-dark-4">
            <div className="text-[10px] font-black uppercase text-gold tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              <span>Cargar Plantilla Preconfigurada en 1 Clic:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLANTILLAS_EXPRESS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset)}
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
                    onChange={(e) => onSelectCliente(e.target.value)}
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
                  <label className="text-[10px] text-cream-muted mb-1 block flex items-center justify-between">
                    <span>Fecha de Emisión:</span>
                    <span className="text-[9px] text-gold">(Clic para abrir calendario)</span>
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
                      className="w-full bg-dark-3 border border-dark-4 group-hover:border-gold/60 rounded-lg pl-8 pr-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs font-mono cursor-pointer"
                    />
                    <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-gold group-hover:scale-110 transition-transform pointer-events-none" />
                  </div>
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

          {/* ASUNTO Y TIPO DE SERVICIO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-cream mb-1 block">Asunto Formal del Oficio *</label>
              <input
                type="text"
                value={formData.asunto}
                onChange={e => setFormData(p => ({ ...p, asunto: e.target.value }))}
                className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-cream outline-none focus:border-gold font-bold text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-cream mb-1 block">Tipo de Servicio</label>
              <select
                value={formData.tipo_servicio}
                onChange={e => setFormData(p => ({ ...p, tipo_servicio: e.target.value as any }))}
                className="w-full bg-dark-3 border border-dark-4 rounded-lg px-3 py-2 text-cream outline-none focus:border-gold text-xs"
              >
                <option value="visita_tecnica">Visita Técnica</option>
                <option value="servicios_profesionales">Servicios Profesionales / UVIE</option>
                <option value="suministro_insumos">Suministro de Insumos</option>
                <option value="mantenimiento">Póliza de Mantenimiento</option>
                <option value="libre">Servicio General / Libre</option>
              </select>
            </div>
          </div>

          {/* ALCANCE GENERAL */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-cream">Alcance Técnico y Descripción del Servicio</label>
              <button
                type="button"
                onClick={() => onMejorarConIA('alcance')}
                disabled={generatingAi}
                className="px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3 h-3 ${generatingAi ? 'animate-pulse' : ''}`} />
                <span>{generatingAi ? 'Mejorando...' : 'Mejorar con IA'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={formData.descripcion_alcance}
              onChange={e => setFormData(p => ({ ...p, descripcion_alcance: e.target.value }))}
              placeholder="Describe los alcances, objetivos o justificación comercial del servicio..."
              className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-cream outline-none focus:border-gold text-xs leading-relaxed"
            />
          </div>

          {/* ============================================================== */}
          {/* SECCIÓN 1: HOJA 1 - CONDICIONES DE SERVICIO                   */}
          {/* ============================================================== */}
          {editorSection === 'hoja1' && formData.incluir_condiciones_servicio !== false && (
            <div className="space-y-4 animate-fade-in border-t border-dark-4 pt-4">
              <h4 className="font-bold text-gold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                <span>Contenido de Hoja 1: Condiciones de Servicio</span>
              </h4>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-cream">Términos, Especificaciones y Normativa (NOM/CFE)</label>
                  <button
                    type="button"
                    onClick={() => onMejorarConIA('condiciones_servicio')}
                    disabled={generatingAi}
                    className="px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Redactar Cláusulas con IA</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={formData.condiciones_servicio || ''}
                  onChange={e => setFormData(p => ({ ...p, condiciones_servicio: e.target.value }))}
                  placeholder="Especificaciones de cumplimiento normativo (NOM/CFE), garantías de servicio y confidencialidad..."
                  className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-cream outline-none focus:border-gold text-xs leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-cream mb-1 block">Metodología de Ejecución y Entregables (Opcional):</label>
                <textarea
                  rows={3}
                  value={formData.metodologia_servicio || ''}
                  onChange={e => setFormData(p => ({ ...p, metodologia_servicio: e.target.value }))}
                  placeholder="Fase 1, Fase 2, Fase 3 y productos entregables al cliente..."
                  className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-cream outline-none focus:border-gold text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditorSection('hoja2')}
                  className="px-4 py-2 bg-dark-3 hover:bg-dark-4 text-gold border border-gold/30 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
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
            <div className="space-y-4 animate-fade-in border-t border-dark-4 pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-cream uppercase text-[11px] tracking-wider text-gold flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Conceptos y Partidas de la Cotización</span>
                  </h4>
                  <p className="text-[10px] text-cream-dim">Desglose de cantidades, precios unitarios e importes en MXN</p>
                </div>
                <button
                  type="button"
                  onClick={onAddPartida}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Concepto</span>
                </button>
              </div>

              <div className="border border-dark-4 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-3 text-[10px] uppercase font-bold text-cream-muted border-b border-dark-4">
                    <tr>
                      <th className="py-2.5 px-3">Descripción / Notas</th>
                      <th className="py-2.5 px-2 w-28">Unidad</th>
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
                            onChange={e => onUpdatePartida(idx, 'descripcion', e.target.value)}
                            className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-cream outline-none focus:border-gold"
                          />
                          <input
                            type="text"
                            placeholder="Notas técnicas complementarias (opcional)..."
                            value={item.notas || ''}
                            onChange={e => onUpdatePartida(idx, 'notas', e.target.value)}
                            className="w-full bg-transparent border-0 px-2 py-0.5 text-[10px] text-cream-dim outline-none focus:text-cream mt-0.5"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.unidad}
                            onChange={e => onUpdatePartida(idx, 'unidad', e.target.value)}
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
                            onChange={e => onUpdatePartida(idx, 'cantidad', Number(e.target.value) || 0)}
                            className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-center font-bold text-cream outline-none focus:border-gold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={e => onUpdatePartida(idx, 'precio_unitario', Number(e.target.value) || 0)}
                            className="w-full bg-dark-3 border border-dark-4 rounded px-2 py-1 text-xs text-right font-mono text-cream outline-none focus:border-gold"
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
              <div className="flex justify-end pt-2">
                <div className="w-80 bg-dark-3/60 p-4 rounded-xl border border-dark-4 space-y-2">
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
                  <div className="border-t border-dark-4 pt-2 flex justify-between font-black text-sm text-gold">
                    <span>TOTAL:</span>
                    <span className="font-mono text-base">{formatCurrency(formData.total)}</span>
                  </div>
                </div>
              </div>

              {/* CONDICIONES COMERCIALES Y BANCARIAS */}
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
                  <label className="text-[10px] text-cream-muted mb-1 block">Banco / Beneficiario SPEI:</label>
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

              {/* DATOS DE FIRMAS (SI HOJA 3 ESTÁ INHABILITADA) */}
              {formData.incluir_condiciones_trabajo === false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-dark-3/30 p-4 rounded-xl border border-dark-4">
                  <div>
                    <label className="text-[10px] text-cream-muted mb-1 block">Responsable de Emisión ESOL:</label>
                    <input
                      type="text"
                      value={formData.remitente_nombre}
                      onChange={e => setFormData(p => ({ ...p, remitente_nombre: e.target.value }))}
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-cream-muted mb-1 block">Cargo Institucional:</label>
                    <input
                      type="text"
                      value={formData.remitente_cargo}
                      onChange={e => setFormData(p => ({ ...p, remitente_cargo: e.target.value }))}
                      className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                {formData.incluir_condiciones_servicio !== false ? (
                  <button
                    type="button"
                    onClick={() => setEditorSection('hoja1')}
                    className="px-4 py-2 bg-dark-3 hover:bg-dark-4 text-cream-muted rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ← Volver a Hoja 1
                  </button>
                ) : <div />}

                {formData.incluir_condiciones_trabajo !== false && (
                  <button
                    type="button"
                    onClick={() => setEditorSection('hoja3')}
                    className="px-4 py-2 bg-dark-3 hover:bg-dark-4 text-gold border border-gold/30 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <span>Siguiente: Hoja 3 (Condiciones de Trabajo)</span>
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
            <div className="space-y-4 animate-fade-in border-t border-dark-4 pt-4">
              <h4 className="font-bold text-gold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <HardHat className="w-4 h-4" />
                <span>Contenido de Hoja 3: Condiciones de Trabajo y Seguridad</span>
              </h4>

              <div className="bg-dark-3/30 p-4 rounded-xl border border-dark-4 space-y-4">
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
                      className="px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Redactar Seguridad con IA</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.condiciones_trabajo || ''}
                    onChange={e => setFormData(p => ({ ...p, condiciones_trabajo: e.target.value }))}
                    placeholder="Requisitos en sitio, líneas de vida, DC-3, horarios laborales y protocolos de seguridad..."
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-cream outline-none focus:border-gold text-xs leading-relaxed font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-cream mb-1 block">2. Facilidades y Responsabilidades del Cliente</label>
                  <textarea
                    rows={3}
                    value={formData.responsabilidades_cliente || ''}
                    onChange={e => setFormData(p => ({ ...p, responsabilidades_cliente: e.target.value }))}
                    placeholder="Accesos a azoteas, suministro de agua/electricidad, enlace técnico asignado..."
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-cream outline-none focus:border-gold text-xs leading-relaxed font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-cream mb-1 block">3. Exclusiones y Términos de Garantía</label>
                  <textarea
                    rows={3}
                    value={formData.exclusiones_garantias || ''}
                    onChange={e => setFormData(p => ({ ...p, exclusiones_garantias: e.target.value }))}
                    placeholder="Qué conceptos no están amparados (obra civil mayor, derechos gubernamentales ajenos, etc.)..."
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg p-3 text-cream outline-none focus:border-gold text-xs leading-relaxed font-mono"
                  />
                </div>
              </div>

              {/* REMITENTE Y FIRMAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-dark-3/30 p-4 rounded-xl border border-dark-4">
                <div>
                  <label className="text-[10px] text-cream-muted mb-1 block">Responsable de Emisión ESOL:</label>
                  <input
                    type="text"
                    value={formData.remitente_nombre}
                    onChange={e => setFormData(p => ({ ...p, remitente_nombre: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cream-muted mb-1 block">Cargo Institucional:</label>
                  <input
                    type="text"
                    value={formData.remitente_cargo}
                    onChange={e => setFormData(p => ({ ...p, remitente_cargo: e.target.value }))}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg px-2.5 py-1.5 text-cream outline-none focus:border-gold text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setEditorSection('hoja2')}
                  className="px-4 py-2 bg-dark-3 hover:bg-dark-4 text-cream-muted rounded-xl text-xs font-bold cursor-pointer"
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

        {/* Modal Footer con opciones de Guardar Borrador y Emitir */}
        <div className="p-4 border-t border-dark-4 bg-dark-3/80 flex flex-wrap justify-between items-center gap-3">
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
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Guardar Borrador</span>
            </button>

            <button
              type="button"
              onClick={() => onSave('emitido')}
              className="px-5 py-2 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black shadow-lg shadow-gold/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Emitir Oficialmente ({hojasSeleccionadasCount} {hojasSeleccionadasCount === 1 ? 'Hoja' : 'Hojas'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
