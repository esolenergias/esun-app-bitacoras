import React, { useState } from 'react';
import { Maximize2, Eye, X, Sparkles, ShieldCheck, Lock, Unlock, MessageSquare, ExternalLink } from 'lucide-react';
import type { AnteproyectoImage } from './esunTypes';
import { getDriveDirectImageUrl } from './lib/driveUploader';

interface AnteproyectoPresentationSectionProps {
  images?: AnteproyectoImage[];
  clientName: string;
  isUnlocked?: boolean;
  isAdmin?: boolean;
}

const PROTECTED_SLOT_KEYS = ['distribution', 'structure', 'solarimetry'];

export default function AnteproyectoPresentationSection({
  images = [],
  clientName,
  isUnlocked = false,
  isAdmin = false
}: AnteproyectoPresentationSectionProps) {
  const [activeModalImage, setActiveModalImage] = useState<AnteproyectoImage | null>(null);
  const [showWaConfirmModal, setShowWaConfirmModal] = useState(false);

  // CRITICAL RULE: If no images have been uploaded, render nothing (zero empty space)
  if (!images || images.length === 0) {
    return null;
  }

  // Filter only images that have a valid driveUrl or thumbnailUrl
  const validImages = images.filter((img) => Boolean(img.driveUrl || img.thumbnailUrl));
  if (validImages.length === 0) {
    return null;
  }

  const getWaUrl = () => {
    const waText = `Hola ESOL Energías, estoy revisando la propuesta técnica de ${clientName} y me gustaría desbloquear los estudios de ingeniería y distribución.`;
    return `https://wa.me/523112343034?text=${encodeURIComponent(waText)}`;
  };

  const handleUnlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open the confirmation modal FIRST
    setShowWaConfirmModal(true);
  };

  const handleConfirmWaRedirect = () => {
    setShowWaConfirmModal(false);
    const waUrl = getWaUrl();
    const newTab = window.open(waUrl, '_blank');
    if (!newTab) {
      window.location.href = waUrl;
    }
  };

  return (
    <section className="space-y-10 sm:space-y-12">
      {/* Section Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C49825]/15 border border-[#C49825]/30 rounded-full text-[#997015] text-xs font-bold uppercase tracking-wider shadow-sm mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ingeniería & Anteproyecto Técnico</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Levantamiento y Memorias Técnicas
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-2 max-w-2xl mx-auto">
          Estudios topográficos, modelado tridimensional y planos ejecutivos para {clientName}.
        </p>
      </div>

      {/* Chapters Grid / List */}
      <div className="space-y-8 sm:space-y-10">
        {validImages.map((img, idx) => {
          const directSrc = getDriveDirectImageUrl(img.thumbnailUrl || img.driveUrl);

          // Check if this image belongs to the 3 confidential engineering slots
          const isProtected =
            PROTECTED_SLOT_KEYS.includes(img.slotKey) ||
            img.categoryTag?.toLowerCase().includes('capítulo') ||
            img.title?.toLowerCase().includes('distribución') ||
            img.title?.toLowerCase().includes('estructural') ||
            img.title?.toLowerCase().includes('solarimetría');

          const isLocked = isProtected && !isUnlocked;
          const showBlurToUser = isLocked && !isAdmin;

          return (
            <div
              key={img.id || idx}
              className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 relative"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4 sm:mb-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/25 rounded-md font-bold text-[10px] uppercase tracking-wider">
                      {img.categoryTag || `Lámina 0${idx + 1}`}
                    </span>

                    {/* Admin status tag */}
                    {isAdmin && isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-900 border border-amber-500/30 rounded-md font-bold text-[10px]">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>Bloqueado para Cliente</span>
                      </span>
                    )}

                    {isUnlocked && isProtected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 rounded-md font-bold text-[10px]">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>Desbloqueado</span>
                      </span>
                    )}

                    <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                      {img.title}
                    </h3>
                  </div>
                  {img.subtitle && (
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {img.subtitle}
                    </p>
                  )}
                </div>

                {/* Right Action Button */}
                {showBlurToUser ? (
                  <button
                    onClick={handleUnlockClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Desbloquear</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveModalImage(img)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    title="Ver en pantalla completa"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ampliar Lámina</span>
                  </button>
                )}
              </div>

              {/* Image Container */}
              <div
                onClick={() => {
                  if (showBlurToUser) {
                    handleUnlockClick({ stopPropagation: () => {} } as any);
                  } else {
                    setActiveModalImage(img);
                  }
                }}
                className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-inner group cursor-pointer flex items-center justify-center min-h-[240px] sm:min-h-[420px] max-h-[600px]"
              >
                {/* The Image (Exact 1px blur when locked) */}
                <img
                  src={directSrc}
                  alt={img.title}
                  className={`w-full h-auto max-h-[580px] object-contain rounded-xl transition-all duration-500 ${
                    showBlurToUser
                      ? 'filter blur-[1px] scale-[1.005] opacity-95 select-none'
                      : 'group-hover:scale-[1.015]'
                  }`}
                  loading="lazy"
                />

                {/* MINIMAL & ELEGANT FLOATING UNLOCK BUTTON (ONLY ELEMENT IN FRONT) */}
                {showBlurToUser && (
                  <div className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-none">
                    <button
                      onClick={handleUnlockClick}
                      className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-slate-950/85 hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm border border-amber-400/50 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-108 hover:border-amber-400 hover:shadow-[0_10px_35px_rgba(245,158,11,0.35)] cursor-pointer group"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-400/20 text-[#FEE180] flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                        <Lock className="w-3 h-3" />
                      </div>
                      <span className="tracking-wide text-[#FEE180]">Desbloquear</span>
                    </button>
                  </div>
                )}

                {/* Floating hover hint (Only for unlocked / sharp view) */}
                {!showBlurToUser && (
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-900/90 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-xs">
                      <Maximize2 className="w-4 h-4 text-[#FEE180]" />
                      <span>Clic para ver en alta resolución</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium mt-3.5 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> Ingeniería Certificada ESOL Energías
                </span>
                <span>{clientName} • Documento Técnico</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Zoom Modal */}
      {activeModalImage && (
        <div
          onClick={() => setActiveModalImage(null)}
          className="fixed inset-0 z-[1000000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-pointer animate-[fadeIn_0.2s_ease-out]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl max-h-[95vh] w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col relative"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-[#FEE180] uppercase tracking-wider">
                  {activeModalImage.categoryTag || 'Anteproyecto'}
                </span>
                <h4 className="text-base font-bold text-white leading-tight">
                  {activeModalImage.title}
                </h4>
              </div>
              <button
                onClick={() => setActiveModalImage(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image */}
            <div className="p-4 sm:p-6 bg-slate-100 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={getDriveDirectImageUrl(activeModalImage.thumbnailUrl || activeModalImage.driveUrl)}
                alt={activeModalImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP MODAL (FIRST APPEARS ON CLICK, THEN DIRECTS TO WHATSAPP ON ACCEPT) */}
      {showWaConfirmModal && (
        <div
          onClick={() => setShowWaConfirmModal(false)}
          className="fixed inset-0 z-[1000000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-[fadeIn_0.2s_ease-out]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-slate-900 border border-[#C49825]/50 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl relative overflow-hidden space-y-4"
          >
            {/* Glow ambient background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FEE180] bg-amber-400/10 border border-amber-400/25 px-3 py-1 rounded-full">
                Solicitud de Desbloqueo
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-2 leading-tight">
                ¿Deseas solicitar el desbloqueo por WhatsApp?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed mt-2">
                Te dirigiremos a WhatsApp con un asesor técnico de <strong>ESOL Energías</strong> para gestionar el acceso completo a los planos ejecutivos y memorias de <strong>{clientName}</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={handleConfirmWaRedirect}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-transform hover:scale-102 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Aceptar y Abrir WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowWaConfirmModal(false)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
