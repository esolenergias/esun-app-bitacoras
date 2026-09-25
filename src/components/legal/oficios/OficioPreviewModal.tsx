import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Printer, Loader2, Cloud, FileEdit, 
  FileText, ZoomIn, ZoomOut, RefreshCw, 
  Layers, Eye, ExternalLink
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.js?url';
import type { OficioData } from './types';
import { buildOficioHtml, generateOficioPdfBlob, uploadOficioToDrive } from './oficioPdfGenerator';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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
  const [viewTab, setViewTab] = useState<'paginas' | 'visor_pdf' | 'html'>('paginas');
  const [isCompilingPdf, setIsCompilingPdf] = useState(true);
  const [compileError, setCompileError] = useState<string | null>(null);
  
  const [pagesImages, setPagesImages] = useState<string[]>([]);
  const [numPages, setNumPages] = useState<number>(1);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isDownloading, setIsDownloading] = useState(false);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'uploading' | 'success' | 'none'>('idle');

  const containerRef = useRef<HTMLDivElement>(null);

  // Compile document to real Letter PDF and extract page images
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let currentBlobUrl: string | null = null;

    async function compileAndRender() {
      setIsCompilingPdf(true);
      setCompileError(null);
      setPagesImages([]);

      try {
        // 1. Generate official Carta PDF Blob
        const blob = await generateOficioPdfBlob(oficio);
        if (!isMounted) return;

        currentBlobUrl = URL.createObjectURL(blob);
        setPdfBlob(blob);
        setBlobUrl(currentBlobUrl);

        // 2. Load PDF into pdfjs to count and render pages
        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        
        if (!isMounted) return;
        const total = pdfDoc.numPages;
        setNumPages(total);

        // 3. Render each Carta page to canvas at high DPI (scale 2.0)
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

        if (isMounted) {
          setPagesImages(rendered);
          setIsCompilingPdf(false);
        }
      } catch (err: any) {
        console.error('Error compaginando PDF Carta:', err);
        if (isMounted) {
          setCompileError(err?.message || 'Error al compaginar en hojas tamaño Carta.');
          setIsCompilingPdf(false);
        }
      }
    }

    compileAndRender();

    return () => {
      isMounted = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, oficio]);

  if (!isOpen) return null;

  // Build raw HTML for fallback or printing
  let htmlContent = '';
  try {
    htmlContent = buildOficioHtml(oficio);
  } catch (err: any) {
    htmlContent = `<div style="padding: 24px; color: #dc2626;">Error al generar HTML: ${err?.message || 'Error'}</div>`;
  }

  const cleanFolio = (oficio.folio || 'ESOL').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanDest = (oficio.destinatarioNombre || 'Destinatario').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Oficio_${cleanFolio}_${cleanDest}.pdf`;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      let targetBlob = pdfBlob;
      if (!targetBlob) {
        targetBlob = await generateOficioPdfBlob(oficio);
      }

      // Download file directly
      const downloadUrl = URL.createObjectURL(targetBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);

      // Upload to Drive if configured
      const webhookUrl = localStorage.getItem('esol_make_webhook_url') || '';
      if (webhookUrl && webhookUrl.includes('http')) {
        setDriveStatus('uploading');
        const driveUrl = await uploadOficioToDrive(targetBlob, filename, oficio);
        if (driveUrl) {
          setDriveStatus('success');
        } else {
          setDriveStatus('none');
        }
      }
    } catch (error: any) {
      console.error('Error al descargar PDF:', error);
      alert('Hubo un error al generar la descarga: ' + (error?.message || 'Error desconocido'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (blobUrl) {
      // Open the exact PDF in a clean window for native browser print
      const win = window.open(blobUrl, '_blank');
      if (win) {
        win.focus();
        return;
      }
    }

    // Fallback: window.print with @page size: letter
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
    }
  };

  const scrollToPage = (pageIndex: number) => {
    const el = document.getElementById(`hoja-oficio-${pageIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-3 animate-fade-in">
      <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER TOOLBAR */}
        <div className="p-3 border-b border-dark-4 flex items-center justify-between bg-dark-1 flex-wrap gap-2">
          {/* Left: Folio and Subject */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-xs font-bold text-gold bg-gold/10 px-2.5 py-1 rounded border border-gold/30 shrink-0">
              {oficio.folio || 'OF-ESOL-2026-001'}
            </span>
            <div className="min-w-0">
              <h3 className="text-xs md:text-sm font-bold text-cream truncate max-w-xs md:max-w-md">
                {oficio.asunto || 'Oficio Oficial'}
              </h3>
              <p className="text-[10px] text-cream-muted truncate flex items-center gap-2">
                <span>Destinatario: {oficio.destinatarioNombre || 'A QUIEN CORRESPONDA'}</span>
              </p>
            </div>

            {/* Pagination & Carta Badge */}
            {!isCompilingPdf && (
              <div className="hidden sm:flex items-center gap-1.5 ml-2 bg-dark-3 border border-dark-4 px-2.5 py-1 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-bold text-cream">
                  {numPages} {numPages === 1 ? 'Hoja' : 'Hojas'}
                </span>
                <span className="text-[10px] text-cream-muted border-l border-dark-4 pl-1.5">
                  Tamaño Carta (215.9 × 279.4 mm)
                </span>
              </div>
            )}
          </div>

          {/* Center: View Switcher */}
          <div className="flex items-center bg-dark-3 p-0.5 rounded-lg border border-dark-4 text-xs font-medium">
            <button
              onClick={() => setViewTab('paginas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewTab === 'paginas'
                  ? 'bg-gold text-dark-1 font-bold shadow'
                  : 'text-cream-muted hover:text-cream'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hojas Carta ({numPages})</span>
            </button>
            {blobUrl && (
              <button
                onClick={() => setViewTab('visor_pdf')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  viewTab === 'visor_pdf'
                    ? 'bg-gold text-dark-1 font-bold shadow'
                    : 'text-cream-muted hover:text-cream'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visor PDF</span>
              </button>
            )}
            <button
              onClick={() => setViewTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewTab === 'html'
                  ? 'bg-gold text-dark-1 font-bold shadow'
                  : 'text-cream-muted hover:text-cream'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>HTML Continuo</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {driveStatus === 'uploading' && (
              <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Subiendo a Drive...
              </span>
            )}
            {driveStatus === 'success' && (
              <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20 flex items-center gap-1">
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                title="Editar este oficio en el editor"
              >
                <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Editar Oficio</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-cream-muted hover:text-cream bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-lg transition-colors"
              title="Abrir vista de impresión oficial o imprimir PDF"
            >
              <Printer className="w-3.5 h-3.5 text-gold" />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading || isCompilingPdf}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-dark-1 bg-gold hover:bg-gold-light rounded-lg transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Descargando...</span>
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

        {/* SUBTOOLBAR: ZOOM & PAGE JUMP BAR (When in 'paginas' view) */}
        {viewTab === 'paginas' && (
          <div className="bg-dark-1/80 border-b border-dark-4 px-4 py-1.5 flex items-center justify-between text-xs text-cream-muted flex-wrap gap-2">
            {/* Quick jump to page buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-cream-muted">Ir a:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: numPages }, (_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToPage(idx + 1)}
                    className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-dark-3 hover:bg-dark-4 text-cream border border-dark-4 hover:border-gold/50 transition-colors"
                  >
                    Hoja {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-cream-muted">Escala:</span>
              <button
                onClick={() => setZoomPercent(prev => Math.max(prev - 10, 60))}
                className="p-1 rounded bg-dark-3 hover:bg-dark-4 text-cream border border-dark-4"
                title="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] font-bold text-gold w-12 text-center">
                {zoomPercent}%
              </span>
              <button
                onClick={() => setZoomPercent(prev => Math.min(prev + 10, 150))}
                className="p-1 rounded bg-dark-3 hover:bg-dark-4 text-cream border border-dark-4"
                title="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomPercent(100)}
                className="px-2 py-0.5 text-[10px] rounded bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4"
              >
                100% (Carta Real)
              </button>
            </div>
          </div>
        )}

        {/* MAIN PREVIEW AREA */}
        <div 
          ref={containerRef}
          className="flex-1 bg-neutral-950 overflow-y-auto p-4 md:p-6 custom-scrollbar"
        >
          {/* TAB 1: HOJAS CARTA PAGINADAS (NATIVAS DEL PDF) */}
          {viewTab === 'paginas' && (
            <>
              {isCompilingPdf ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="relative mb-4">
                    <div className="w-16 h-20 rounded bg-dark-3 border border-dark-4 flex items-center justify-center shadow-xl animate-pulse">
                      <FileText className="w-8 h-8 text-gold animate-bounce" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-cream mb-1">
                    Compaginando documento en tamaño Carta Oficial...
                  </h4>
                  <p className="text-xs text-cream-muted max-w-sm">
                    Calculando saltos de página, respetando firmas indivisibles y tabulando partidas en hojas estándar de 8.5" × 11".
                  </p>
                </div>
              ) : compileError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center max-w-md mx-auto my-8">
                  <p className="text-xs text-red-300 font-bold mb-2">No se pudo compaginar el visor gráfico:</p>
                  <p className="text-[11px] text-red-200 mb-4">{compileError}</p>
                  <button
                    onClick={() => setViewTab('html')}
                    className="px-4 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs text-cream font-bold"
                  >
                    Ver en modo HTML
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8 pb-10 w-full">
                  {pagesImages.map((pageSrc, idx) => (
                    <div 
                      key={idx} 
                      id={`hoja-oficio-${idx + 1}`}
                      className="flex flex-col items-center w-full transition-all"
                    >
                      {/* Cabecera descriptiva de cada hoja */}
                      <div 
                        className="flex items-center justify-between mb-2 px-1 text-xs"
                        style={{ width: `${Math.round(215.9 * (zoomPercent / 100))}mm`, maxWidth: '100%' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-dark-1 bg-gold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 shadow">
                            <FileText className="w-3 h-3" />
                            Hoja {idx + 1} de {numPages}
                          </span>
                          <span className="text-[11px] text-cream-muted font-medium">
                            {idx === 0 
                              ? 'Membrete oficial, Asunto y Contenido' 
                              : (idx === numPages - 1 ? 'Cierre, Firmas y Acuse' : 'Continuación de Contenido')}
                          </span>
                        </div>
                        <span className="text-[10px] text-cream-muted font-mono bg-dark-2 px-2 py-0.5 rounded border border-dark-4">
                          Carta: 215.9 × 279.4 mm
                        </span>
                      </div>

                      {/* Lámina física tamaño Carta */}
                      <div 
                        className="bg-white rounded-sm shadow-2xl overflow-hidden border border-neutral-300 transition-all duration-150"
                        style={{
                          width: `${Math.round(215.9 * (zoomPercent / 100))}mm`,
                          maxWidth: '100%',
                          aspectRatio: '215.9 / 279.4'
                        }}
                      >
                        <img 
                          src={pageSrc} 
                          alt={`Hoja ${idx + 1} de ${numPages}`} 
                          className="w-full h-full object-contain block select-none" 
                        />
                      </div>

                      {/* Separador entre hojas */}
                      {idx + 1 < numPages ? (
                        <div 
                          className="flex items-center gap-3 my-6"
                          style={{ width: `${Math.round(215.9 * (zoomPercent / 100))}mm`, maxWidth: '100%' }}
                        >
                          <div className="h-px bg-dark-4 flex-1"></div>
                          <span className="text-[10px] font-bold text-cream-muted uppercase tracking-wider bg-dark-2 px-3 py-1 rounded-full border border-dark-4 flex items-center gap-1.5 shadow-sm">
                            <span className="text-gold">✂️</span> Fin de Hoja {idx + 1} — Salto a Hoja {idx + 2}
                          </span>
                          <div className="h-px bg-dark-4 flex-1"></div>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-3 my-6"
                          style={{ width: `${Math.round(215.9 * (zoomPercent / 100))}mm`, maxWidth: '100%' }}
                        >
                          <div className="h-px bg-dark-4 flex-1"></div>
                          <span className="text-[10px] font-black text-gold uppercase tracking-wider bg-dark-2 px-3 py-1 rounded-full border border-gold/30 shadow-sm">
                            ✓ Fin del Documento Oficial ({numPages} {numPages === 1 ? 'Hoja' : 'Hojas'} en total)
                          </span>
                          <div className="h-px bg-dark-4 flex-1"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: VISOR PDF EMBEBIDO */}
          {viewTab === 'visor_pdf' && blobUrl && (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-dark-4 bg-dark-2">
              <iframe 
                src={blobUrl} 
                className="w-full h-full min-h-[70vh] border-0" 
                title="Visor PDF Carta"
              />
            </div>
          )}

          {/* TAB 3: PLANTILLA HTML CONTINUA (VISTA RÁPIDA) */}
          {viewTab === 'html' && (
            <div className="flex justify-center">
              <div 
                className="bg-white text-slate-900 shadow-2xl rounded-sm overflow-hidden border border-neutral-300 my-auto p-4 md:p-6"
                style={{
                  width: `${Math.round(215.9 * (zoomPercent / 100))}mm`,
                  maxWidth: '100%',
                  minHeight: `${Math.round(279.4 * (zoomPercent / 100))}mm`
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER STATUS BAR */}
        <div className="p-2.5 px-4 bg-dark-1 border-t border-dark-4 flex items-center justify-between text-[11px] text-cream-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Documento validado para impresión oficial en papel Carta (8.5" × 11")
            </span>
            <span className="hidden sm:inline border-l border-dark-4 pl-3">
              División calculada: <strong className="text-gold">{numPages} {numPages === 1 ? 'Hoja' : 'Hojas'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (blobUrl) {
                  window.open(blobUrl, '_blank');
                } else {
                  handlePrint();
                }
              }}
              className="text-gold hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Abrir en pestaña completa</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
