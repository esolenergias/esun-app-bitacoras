import React, { useEffect, useState, useRef } from 'react';
import { Eye, ExternalLink, RefreshCw, ZoomIn, ZoomOut, CheckCircle } from 'lucide-react';
import type { CotizacionExpressData } from '../../types/cotizadorExpress';
import { buildCotizacionExpressHtml } from './cotizadorExpressPdf';

interface CotizadorBlobPreviewProps {
  formData: CotizacionExpressData;
  className?: string;
  activeSection?: 'hoja1' | 'hoja2' | 'hoja3';
}

export const CotizadorBlobPreview: React.FC<CotizadorBlobPreviewProps> = ({
  formData,
  className = '',
  activeSection = 'hoja2'
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.85);
  const [selectedViewPage, setSelectedViewPage] = useState<'hoja1' | 'hoja2' | 'hoja3' | 'todas'>(activeSection);
  const previousUrlRef = useRef<string | null>(null);

  // Sincronizar automáticamente la vista previa con la pestaña que el usuario está editando
  useEffect(() => {
    if (activeSection) {
      // Si la sección activa es hoja1 pero está deshabilitada, ir a hoja2
      if (activeSection === 'hoja1' && formData.incluir_condiciones_servicio === false) {
        setSelectedViewPage('hoja2');
      } else if (activeSection === 'hoja3' && formData.incluir_condiciones_trabajo === false) {
        setSelectedViewPage('hoja2');
      } else {
        setSelectedViewPage(activeSection);
      }
    }
  }, [activeSection, formData.incluir_condiciones_servicio, formData.incluir_condiciones_trabajo]);

  useEffect(() => {
    // Generar documento HTML interactivo con estilos idénticos al PDF
    // Reglas CSS dinámicas para mostrar la página seleccionada o todas
    let filterPageCss = '';
    if (selectedViewPage === 'hoja1') {
      filterPageCss = `
        #cotizacion-page-hoja2, #cotizacion-page-hoja3 { display: none !important; }
        #cotizacion-page-hoja1 { display: flex !important; }
      `;
    } else if (selectedViewPage === 'hoja2') {
      filterPageCss = `
        #cotizacion-page-hoja1, #cotizacion-page-hoja3 { display: none !important; }
        #cotizacion-page-hoja2 { display: flex !important; }
      `;
    } else if (selectedViewPage === 'hoja3') {
      filterPageCss = `
        #cotizacion-page-hoja1, #cotizacion-page-hoja2 { display: none !important; }
        #cotizacion-page-hoja3 { display: flex !important; }
      `;
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Vista Previa - ${formData.folio || 'Cotización'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              background-color: #0b0f17;
              min-height: 100vh;
              font-family: 'Montserrat', sans-serif;
            }
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 24px 16px;
            }
            /* Contenedor que desglosa las páginas de forma independiente */
            .doc-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
              max-width: 8.5in;
            }
            .cotizacion-document {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 36px;
              width: 100% !important;
            }
            /* Cada hoja física independiente con sombra de papel y bordes definidos */
            .cotizacion-page {
              background-color: #ffffff !important;
              width: 7.5in !important;
              min-height: 10.3in !important;
              box-shadow: 0 16px 38px -6px rgba(0, 0, 0, 0.7), 0 8px 16px -6px rgba(0, 0, 0, 0.5) !important;
              border-radius: 8px !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              position: relative !important;
              padding: 28px 32px !important;
              line-height: 1.5 !important;
            }

            /* Filtro de página individual según la pestaña que se esté editando */
            ${filterPageCss}

            @media print {
              body { background-color: #ffffff; padding: 0; }
              .cotizacion-document { gap: 0; }
              .cotizacion-page { 
                box-shadow: none !important; 
                border: none !important; 
                border-radius: 0 !important;
                page-break-after: always;
                display: flex !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="doc-wrapper">
            ${buildCotizacionExpressHtml(formData)}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current);
    }
    previousUrlRef.current = url;
    setBlobUrl(url);

    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, [formData, selectedViewPage]);

  const handleOpenExternal = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-dark-1/90 rounded-2xl border border-dark-4 overflow-hidden shadow-2xl ${className}`}>
      {/* Top Bar de Controles de Vista Previa */}
      <div className="bg-dark-3/80 px-3 py-2 border-b border-dark-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-cream uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Vista Previa:</span>
          </span>
          
          {/* Selector interactivo de Hoja en Vista Previa */}
          <div className="flex items-center gap-1 bg-dark-2 p-0.5 rounded-lg border border-dark-4">
            {formData.incluir_condiciones_servicio !== false && (
              <button
                type="button"
                onClick={() => setSelectedViewPage('hoja1')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  selectedViewPage === 'hoja1'
                    ? 'bg-gold text-dark-1 shadow-sm'
                    : 'text-cream-dim hover:text-cream'
                }`}
              >
                Pág 1
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedViewPage('hoja2')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                selectedViewPage === 'hoja2'
                  ? 'bg-gold text-dark-1 shadow-sm'
                  : 'text-cream-dim hover:text-cream'
              }`}
            >
              Pág 2
            </button>
            {formData.incluir_condiciones_trabajo !== false && (
              <button
                type="button"
                onClick={() => setSelectedViewPage('hoja3')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  selectedViewPage === 'hoja3'
                    ? 'bg-gold text-dark-1 shadow-sm'
                    : 'text-cream-dim hover:text-cream'
                }`}
              >
                Pág 3
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedViewPage('todas')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                selectedViewPage === 'todas'
                  ? 'bg-gold text-dark-1 shadow-sm'
                  : 'text-cream-dim hover:text-cream'
              }`}
            >
              Todas
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-dark-2 text-gold px-2 py-0.5 rounded font-mono border border-gold/20 hidden sm:inline-block">
            {formData.folio || 'BORRADOR'}
          </span>

          <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
            title="Reducir Zoom"
            className="p-1 rounded bg-dark-2 hover:bg-dark-4 text-cream-dim hover:text-cream border border-dark-4 text-xs cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-cream-muted px-1 min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
            title="Aumentar Zoom"
            className="p-1 rounded bg-dark-2 hover:bg-dark-4 text-cream-dim hover:text-cream border border-dark-4 text-xs cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            title="Abrir en pestaña independiente"
            className="ml-1 px-2.5 py-1 rounded bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Pestaña Completa</span>
          </button>
        </div>
      </div>
    </div>

      {/* Frame de Renderizado en Blob */}
      <div className="flex-1 bg-dark-1/95 p-3 overflow-auto flex justify-center items-start">
        {blobUrl ? (
          <div 
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="w-full flex justify-center"
          >
            <iframe
              src={blobUrl}
              title="Vista Previa de Cotización"
              className="w-[7.7in] min-h-[11in] h-[1050px] border-0 rounded-lg shadow-2xl bg-white"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-cream-dim">
            <RefreshCw className="w-6 h-6 animate-spin text-gold mb-2" />
            <span className="text-xs">Generando vista previa en vivo...</span>
          </div>
        )}
      </div>
    </div>
  );
};
