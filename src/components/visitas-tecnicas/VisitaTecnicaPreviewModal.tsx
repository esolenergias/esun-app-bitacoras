import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Eye, Loader2, ZoomIn, ZoomOut, RefreshCw, FileText
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.js?url';
import type { VisitaTecnica } from './types';
import { generateVisitaTecnicaPdfBlob } from './visitaTecnicaPdf';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface VisitaTecnicaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  visita: VisitaTecnica;
}

export const VisitaTecnicaPreviewModal: React.FC<VisitaTecnicaPreviewModalProps> = ({
  isOpen,
  onClose,
  visita
}) => {
  const [isCompiling, setIsCompiling] = useState(true);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [pagesImages, setPagesImages] = useState<string[]>([]);
  const [numPages, setNumPages] = useState<number>(1);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isDownloading, setIsDownloading] = useState(false);

  const compileAndRender = async () => {
    setIsCompiling(true);
    setCompileError(null);
    setPagesImages([]);

    try {
      // 1. Generate real Carta PDF Blob
      const blob = await generateVisitaTecnicaPdfBlob(visita);
      setPdfBlob(blob);

      // 2. Load into PDF.js to extract rendered canvas pages
      const arrayBuffer = await blob.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      
      const total = pdfDoc.numPages;
      setNumPages(total);

      const rendered: string[] = [];
      for (let i = 1; i <= total; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          rendered.push(canvas.toDataURL('image/png'));
        }
      }

      setPagesImages(rendered);
      setIsCompiling(false);
    } catch (err: any) {
      console.error('Error compaginando PDF de Visita Técnica:', err);
      setCompileError(err?.message || 'Error al generar la vista previa del reporte.');
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      compileAndRender();
    }
  }, [isOpen, visita.id, visita.folio]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!pdfBlob) return;
    setIsDownloading(true);
    const cleanFolio = (visita.folio || 'ESOL-VT').replace(/[/\\?%*:|"<>]/g, '_');
    const cleanSitio = (visita.sitio_nombre || 'Sitio').replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `Visita_Tecnica_${cleanFolio}_${cleanSitio}.pdf`;

    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      setIsDownloading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-dark-2 border border-dark-4 rounded-2xl shadow-2xl flex flex-col h-[94vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-4 bg-dark-1/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-cream flex items-center gap-2">
                  Vista Previa Oficial: {visita.folio}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-bold uppercase tracking-wider">
                  Formato Bitácora
                </span>
              </div>
              <p className="text-xs text-cream-muted mt-0.5">
                {visita.sitio_nombre} • {visita.cliente_nombre || 'Cliente Independiente'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="hidden sm:flex items-center bg-dark-3 border border-dark-4 rounded-xl p-1 gap-1 text-xs">
              <button
                onClick={() => setZoomPercent(prev => Math.max(50, prev - 15))}
                className="p-1.5 hover:bg-dark-4 rounded-lg text-cream-muted hover:text-cream transition-colors"
                title="Reducir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-cream font-bold min-w-[48px] text-center">
                {zoomPercent}%
              </span>
              <button
                onClick={() => setZoomPercent(prev => Math.min(160, prev + 15))}
                className="p-1.5 hover:bg-dark-4 rounded-lg text-cream-muted hover:text-cream transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={compileAndRender}
              disabled={isCompiling}
              className="p-2.5 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4 transition-all"
              title="Volver a compilar"
            >
              <RefreshCw className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleDownload}
              disabled={isCompiling || !pdfBlob}
              className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream flex items-center justify-center transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-dark-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
          {isCompiling ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 text-center">
              <div className="w-14 h-14 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4"></div>
              <h3 className="font-bold text-cream text-base">Compilando Vista Previa Oficial...</h3>
              <p className="text-xs text-cream-muted mt-1 max-w-md">
                Procesando diseño editorial idéntico a Bitácoras de Obra y optimizando evidencias fotográficas de alta resolución.
              </p>
            </div>
          ) : compileError ? (
            <div className="my-auto max-w-md text-center p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-60" />
              <h4 className="font-bold text-base mb-1">No se pudo compaginar el documento</h4>
              <p className="text-xs text-cream-muted mb-4">{compileError}</p>
              <button
                onClick={compileAndRender}
                className="px-4 py-2 bg-dark-3 hover:bg-dark-4 text-cream rounded-xl text-xs font-bold border border-dark-4 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reintentar
              </button>
            </div>
          ) : (
            <div 
              className="flex flex-col gap-8 transition-transform origin-top pb-12"
              style={{ transform: `scale(${zoomPercent / 100})` }}
            >
              {pagesImages.map((pageSrc, idx) => (
                <div 
                  key={idx} 
                  className="relative bg-white shadow-2xl rounded-sm overflow-hidden border border-black/20"
                  style={{ width: '800px', minHeight: '1035px' }}
                >
                  <img 
                    src={pageSrc} 
                    alt={`Página ${idx + 1}`} 
                    className="w-full h-auto block select-none" 
                  />
                  <div className="absolute bottom-2 right-4 text-[9px] text-gray-400 font-mono">
                    Página {idx + 1} de {numPages}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-dark-4 bg-dark-1/90 flex items-center justify-between text-xs text-cream-muted">
          <div>
            Páginas renderizadas: <strong className="text-cream">{numPages}</strong>
          </div>
          <div>
            Diseño: <span className="text-gold font-bold">ESOL Bitácora de Obra Paper Style (#F8F7F2)</span>
          </div>
        </div>

      </div>
    </div>
  );
};
