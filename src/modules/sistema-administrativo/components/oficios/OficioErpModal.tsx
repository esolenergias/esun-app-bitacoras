import React, { useState } from 'react';
import type { OficioData } from '../../../../components/legal/oficios/types';
import OficioPreviewModal from '../../../../components/legal/oficios/OficioPreviewModal';
import { supabase } from '../../../../context/supabase';
import { FileText, CheckCircle2, ShieldCheck, Printer, Download, X, Eye, Edit3 } from 'lucide-react';

interface OficioErpModalProps {
  isOpen?: boolean;
  onClose: () => void;
  oficio: OficioData | null;
  userRole?: string;
  canEdit?: boolean;
  onSave?: (updated: OficioData) => void;
  onSaveOficio?: (updated: OficioData) => void;
}

export const OficioErpModal: React.FC<OficioErpModalProps> = ({
  isOpen = true,
  onClose,
  oficio,
  userRole = 'master',
  canEdit = true,
  onSave,
  onSaveOficio
}) => {
  const isAllowedToEdit = canEdit && userRole !== 'visor';
  const [currentOficio, setCurrentOficio] = useState<OficioData | null>(oficio);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setCurrentOficio(oficio);
  }, [oficio]);

  if (!isOpen || !currentOficio) return null;

  const isMaster = userRole === 'master';

  const handleToggleEstado = async () => {
    if (!isAllowedToEdit) {
      alert('No tienes permisos de edición en el Sistema Administrativo (Modo Visor).');
      return;
    }
    const nuevoEstado: 'borrador' | 'emitido' = currentOficio.estado === 'emitido' ? 'borrador' : 'emitido';
    const updated: OficioData = {
      ...currentOficio,
      estado: nuevoEstado,
      updated_at: new Date().toISOString()
    };

    setCurrentOficio(updated);
    if (onSave) onSave(updated);
    if (onSaveOficio) onSaveOficio(updated);

    // Sincronizar en Supabase si existe
    try {
      setSaving(true);
      await supabase.from('oficios_obra').upsert({
        folio: updated.folio,
        tipo_oficio: updated.tipoOficio,
        nombre_obra: updated.nombreObra,
        destinatario_nombre: updated.destinatarioNombre,
        asunto: updated.asunto,
        contenido: updated.cuerpo,
        estado: updated.estado,
        datos_json: updated
      }, { onConflict: 'folio' });
    } catch (err) {
      console.warn('Error sincronizando oficio:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-dark-2 border border-dark-4 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-dark-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-cream font-display">
                    DOCUMENTO OFICIAL FORMAL
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    currentOficio.estado === 'emitido' 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-dark-3 text-cream-muted border-dark-4'
                  }`}>
                    {currentOficio.estado === 'emitido' ? 'Emitido Oficial' : 'Borrador'}
                  </span>
                </div>
                <p className="text-xs text-gold font-mono font-bold mt-0.5">
                  Folio: {currentOficio.folio}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-cream-muted hover:text-cream hover:bg-dark-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details Card */}
          <div className="bg-dark-3/70 p-4 rounded-2xl border border-dark-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-cream-dim text-[10px] uppercase font-bold block">Tipo de Oficio</span>
                <span className="text-cream font-semibold">{currentOficio.tipoOficio}</span>
              </div>
              <div>
                <span className="text-cream-dim text-[10px] uppercase font-bold block">Fecha de Emisión</span>
                <span className="text-cream font-semibold">{currentOficio.fecha}</span>
              </div>
              <div>
                <span className="text-cream-dim text-[10px] uppercase font-bold block">Destinatario</span>
                <span className="text-cream font-semibold">{currentOficio.destinatarioNombre || 'General'}</span>
              </div>
              <div>
                <span className="text-cream-dim text-[10px] uppercase font-bold block">Referencia Operativa ERP</span>
                <span className="text-gold font-mono font-bold">{currentOficio.referencia || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dark-4/60">
              <span className="text-cream-dim text-[10px] uppercase font-bold block">Asunto</span>
              <p className="text-cream font-medium mt-0.5">{currentOficio.asunto}</p>
            </div>

            <div className="pt-2 border-t border-dark-4/60">
              <span className="text-cream-dim text-[10px] uppercase font-bold block">Cuerpo del Oficio</span>
              <div className="p-3 bg-dark-1/80 rounded-xl border border-dark-4/80 text-cream/90 font-mono text-[11px] max-h-40 overflow-y-auto whitespace-pre-wrap">
                {currentOficio.cuerpo}
              </div>
            </div>
          </div>

          {/* Master Signature & Role Control */}
          <div className="p-3.5 rounded-2xl bg-gold/5 border border-gold/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0" />
              <div>
                <span className="font-bold text-cream block">Firma y Certificación Digital</span>
                <span className="text-[11px] text-cream-muted">
                  {isMaster ? 'Habilitada con facultades de Representación Legal (Rol Master)' : 'Modo visualización / Firma reservada a Dirección'}
                </span>
              </div>
            </div>

            {isAllowedToEdit && (
              <button
                onClick={handleToggleEstado}
                disabled={saving}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs ${
                  currentOficio.estado === 'emitido'
                    ? 'bg-dark-3 hover:bg-dark-4 text-cream border border-dark-4'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentOficio.estado === 'emitido' ? 'Cambiar a Borrador' : 'Marcar como Emitido'}</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-4">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => setShowFullPreview(true)}
              className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-dark-1 font-black text-xs transition-all shadow-lg shadow-gold/20 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Formato Impreso & PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* Full Preview Modal with PDF and Print Actions */}
      {showFullPreview && (
        <OficioPreviewModal
          isOpen={showFullPreview}
          onClose={() => setShowFullPreview(false)}
          oficio={currentOficio}
          onEdit={(edited) => {
            setCurrentOficio(edited);
            if (onSave) onSave(edited);
            if (onSaveOficio) onSaveOficio(edited);
          }}
        />
      )}
    </>
  );
};
