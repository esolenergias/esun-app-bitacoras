import React, { useState } from 'react';
import { X, Download, Printer, Loader2, Cloud, FileEdit } from 'lucide-react';
import type { OficioData } from './types';
import { buildOficioHtml, generateOficioPdf } from './oficioPdfGenerator';

interface OficioPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  oficio: OficioData;
  onEdit?: (oficio: OficioData) => void;
}

export default function OficioPreviewModal({
  isOpen,
  onClose,
  oficio,
  onEdit
}: OficioPreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'uploading' | 'success' | 'none'>('idle');

  if (!isOpen) return null;

  let htmlContent = '';
  try {
    htmlContent = buildOficioHtml(oficio);
  } catch (err: any) {
    console.error('Error generating preview HTML:', err);
    htmlContent = `<div style="padding: 24px; color: #dc2626; font-family: sans-serif;">Error al generar vista previa: ${err?.message || 'Error desconocido'}</div>`;
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDriveStatus('idle');

      const result = await generateOficioPdf(oficio, (status) => {
        setDriveStatus(status);
      });

      if (result.driveUrl) {
        setDriveStatus('success');
      }
    } catch (error: any) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF: ' + (error?.message || 'Error desconocido'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="utf-8" />
            <title>Oficio ${oficio.folio || 'ESOL'}</title>
            <style>
              @page { size: letter portrait; margin: 0; }
              body { margin: 0; padding: 0; background: #ffffff; }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      alert('Por favor habilita las ventanas emergentes (pop-ups) en tu navegador para abrir la vista de impresión.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-4 animate-fade-in">
      <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="p-3.5 border-b border-dark-4 flex items-center justify-between bg-dark-1 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-gold bg-gold/10 px-2.5 py-1 rounded border border-gold/30">
              {oficio.folio || 'OF-ESOL-2026-001'}
            </span>
            <h3 className="text-xs md:text-sm font-medium text-cream truncate max-w-xs md:max-w-md">
              Vista Previa: {oficio.asunto || 'Oficio Oficial'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {driveStatus === 'uploading' && (
              <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Subiendo a Drive...
              </span>
            )}
            {driveStatus === 'success' && (
              <span className="text-[10px] text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 flex items-center gap-1">
                <Cloud className="w-3 h-3" /> Guardado en Drive
              </span>
            )}

            {onEdit && (
              <button
                onClick={() => {
                  onEdit(oficio);
                  onClose();
                }}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                title="Editar este oficio en el módulo legal"
              >
                <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar Oficio</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cream-muted hover:text-cream bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-gold" />
              <span>Imprimir / Pestaña</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-dark-1 bg-gold hover:bg-gold-light rounded-lg transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              type="button"
              className="text-cream-muted hover:text-cream p-1.5 rounded-lg hover:bg-dark-3 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Preview Area */}
        <div className="flex-1 bg-neutral-900 overflow-y-auto p-2 md:p-6 flex justify-center custom-scrollbar">
          <div className="bg-white text-slate-900 shadow-2xl rounded-sm overflow-hidden w-full max-w-[216mm] min-h-[279mm] border border-neutral-300 my-auto">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </div>

      </div>
    </div>
  );
}
