import React, { useState, useEffect } from 'react';
import {
  Upload, Image as ImageIcon, Trash2, ExternalLink, Calendar,
  CheckCircle2, Clock, Layers, Sparkles, AlertCircle, RefreshCw, Eye,
  Lock, Unlock, Brain, Move, GripHorizontal
} from 'lucide-react';
import type { AnteproyectoImage, CronogramaParams } from './esunTypes';
import { uploadAnteproyectoImageToDrive, type UploadProgress } from './lib/driveUploader';
import { calculateCronograma, type CronogramaResult } from './lib/cronogramaEngine';
import { recordCronogramaCalibration, getLearningState, resetLearningState } from './lib/cronogramaLearningEngine';

export interface StandardSlotDef {
  key: string;
  categoryTag: string;
  defaultTitle: string;
  defaultSubtitle: string;
  hint: string;
}

export const STANDARD_ANTEPROYECTO_SLOTS: StandardSlotDef[] = [
  {
    key: 'drone',
    categoryTag: 'Levantamiento Aéreo',
    defaultTitle: 'Vista Drone - Inspección de Sitio',
    defaultSubtitle: 'Inspección de cubierta y áreas disponibles para instalación solar',
    hint: 'Fotografía aérea o levantamiento con dron del techo/terreno.'
  },
  {
    key: 'distribution',
    categoryTag: 'Capítulo 1',
    defaultTitle: 'Colocación y Distribución de Paneles',
    defaultSubtitle: 'Distribución modular de módulos fotovoltaicos en cubierta',
    hint: 'Plano 2D o diagrama de colocación de módulos e interconexión.'
  },
  {
    key: '3d',
    categoryTag: 'Simulación 3D',
    defaultTitle: 'Proyección y Modelado Tridimensional',
    defaultSubtitle: 'Visualización tridimensional integrada a la geometría del inmueble',
    hint: 'Render 3D o simulación de la nave/casa con los paneles solares.'
  },
  {
    key: 'structure',
    categoryTag: 'Capítulo 2',
    defaultTitle: 'Ingeniería Estructural y Mecánica',
    defaultSubtitle: 'Planos de fijación, distanciamiento y estructura de soporte a 20°',
    hint: 'Planos mecánicos, ángulos de inclinación o detalles de fijación.'
  },
  {
    key: 'solarimetry',
    categoryTag: 'Capítulo 3',
    defaultTitle: 'Solarimetría y Trayectoria Solar',
    defaultSubtitle: 'Estudio de sombreado y rendimiento estacional en solsticios y equinoccios',
    hint: 'Gráfico de trayectoria solar, azimut, heliofanía o análisis de sombras.'
  },
  {
    key: 'leadership',
    categoryTag: 'Dirección de Ingeniería',
    defaultTitle: 'Liderazgo y Perfil Técnico',
    defaultSubtitle: 'Respaldo técnico, certificaciones y experiencia en proyectos industriales',
    hint: 'Ficha curricular del director de ingeniería o certificaciones del equipo.'
  }
];

interface AnteproyectoManagerProps {
  clientName: string;
  numPanels: number;
  isOffGrid?: boolean;
  tariff?: string;
  images: AnteproyectoImage[];
  cronogramaParams?: CronogramaParams;
  anteproyectoUnlocked?: boolean;
  onChangeImages: (images: AnteproyectoImage[]) => void;
  onChangeCronograma: (params: CronogramaParams) => void;
  onChangeAnteproyectoUnlocked?: (unlocked: boolean) => void;
}

export default function AnteproyectoManager({
  clientName,
  numPanels,
  isOffGrid,
  tariff,
  images = [],
  cronogramaParams,
  anteproyectoUnlocked = false,
  onChangeImages,
  onChangeCronograma,
  onChangeAnteproyectoUnlocked
}: AnteproyectoManagerProps) {
  const [uploadStatus, setUploadStatus] = useState<{ [slotKey: string]: UploadProgress }>({});
  const [startDate, setStartDate] = useState<string>(
    cronogramaParams?.startDate || new Date().toISOString().split('T')[0]
  );
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string } | null>(null);

  // Drag & drop state for interactive Gantt bars
  const [activeDrag, setActiveDrag] = useState<{
    phaseId: string;
    mode: 'move' | 'resize';
    startX: number;
    initialStartWeek: number;
    initialDuration: number;
    trackWidth: number;
    currentStartWeek: number;
    currentDuration: number;
  } | null>(null);

  // Auto calculate cronograma for live preview (incorporates overrides, customizations & learning)
  const cronogramaResult = calculateCronograma(numPanels, startDate, {
    isOffGrid,
    tariff,
    phaseOverrides: cronogramaParams?.phaseOverrides,
    phaseCustomizations: cronogramaParams?.phaseCustomizations
  });

  const learningState = getLearningState();
  const tierLearning = learningState[cronogramaResult.scaleTier];

  // Drag & drop window listeners
  useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - activeDrag.startX;
      const weeksPerPixel = cronogramaResult.totalWeeks / activeDrag.trackWidth;
      const deltaWeeks = deltaX * weeksPerPixel;

      if (activeDrag.mode === 'move') {
        const rawNewStart = activeDrag.initialStartWeek + deltaWeeks;
        // Snap to 0.5 week intervals
        const snappedStart = Math.max(1, Math.round(rawNewStart * 2) / 2);
        setActiveDrag((prev) => (prev ? { ...prev, currentStartWeek: snappedStart } : null));
      } else if (activeDrag.mode === 'resize') {
        const rawNewDur = activeDrag.initialDuration + deltaWeeks;
        // Snap to 0.5 week intervals
        const snappedDur = Math.max(0.5, Math.round(rawNewDur * 2) / 2);
        setActiveDrag((prev) => (prev ? { ...prev, currentDuration: snappedDur } : null));
      }
    };

    const handleMouseUp = () => {
      if (activeDrag) {
        const updatedCustomizations = {
          ...(cronogramaParams?.phaseCustomizations || {}),
          [activeDrag.phaseId]: {
            startWeek: activeDrag.currentStartWeek,
            durationWeeks: activeDrag.currentDuration
          }
        };

        onChangeCronograma({
          ...cronogramaParams,
          startDate,
          phaseCustomizations: updatedCustomizations
        });

        // Record in adaptive learning engine
        const stepOverrides: Record<string, number> = {};
        cronogramaResult.executionSteps.forEach((s) => {
          stepOverrides[s.stepNumber] = s.currentWeeks;
        });
        recordCronogramaCalibration(cronogramaResult.scaleTier, stepOverrides, updatedCustomizations);
      }
      setActiveDrag(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, cronogramaResult.totalWeeks, cronogramaParams, startDate, cronogramaResult.scaleTier]);

  const handleBarMouseDown = (
    e: React.MouseEvent,
    phaseId: string,
    mode: 'move' | 'resize',
    phaseStartWeek: number,
    phaseDuration: number,
    trackElement: HTMLElement
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const trackRect = trackElement.getBoundingClientRect();
    setActiveDrag({
      phaseId,
      mode,
      startX: e.clientX,
      initialStartWeek: phaseStartWeek,
      initialDuration: phaseDuration,
      trackWidth: trackRect.width || 1,
      currentStartWeek: phaseStartWeek,
      currentDuration: phaseDuration
    });
  };

  const handleStartDateChange = (newDate: string) => {
    setStartDate(newDate);
    onChangeCronograma({
      ...cronogramaParams,
      startDate: newDate
    });
  };

  const handlePhaseOverrideChange = (stepNumber: string, weeks: number) => {
    const updatedOverrides = {
      ...(cronogramaParams?.phaseOverrides || {}),
      [stepNumber]: weeks
    };
    onChangeCronograma({
      ...cronogramaParams,
      startDate,
      phaseOverrides: updatedOverrides
    });

    // Record in adaptive learning engine
    recordCronogramaCalibration(cronogramaResult.scaleTier, updatedOverrides, cronogramaParams?.phaseCustomizations);
  };

  const handleResetOverrides = () => {
    onChangeCronograma({
      ...cronogramaParams,
      startDate,
      phaseOverrides: {},
      phaseCustomizations: {}
    });
  };

  const handleFileUpload = async (slot: StandardSlotDef, file: File) => {
    const slotKey = slot.key;
    try {
      setUploadStatus((prev) => ({
        ...prev,
        [slotKey]: { status: 'compressing', progressPct: 15 }
      }));

      const { driveUrl, thumbnailUrl } = await uploadAnteproyectoImageToDrive(
        file,
        clientName,
        slot.categoryTag,
        (progress) => {
          setUploadStatus((prev) => ({ ...prev, [slotKey]: progress }));
        }
      );

      const existingIndex = images.findIndex((img) => img.slotKey === slotKey);
      const newImgObj: AnteproyectoImage = {
        id: Math.random().toString(36).substring(2, 9),
        slotKey,
        title: slot.defaultTitle,
        subtitle: slot.defaultSubtitle,
        categoryTag: slot.categoryTag,
        driveUrl,
        thumbnailUrl,
        uploadedAt: new Date().toISOString()
      };

      let updatedImages: AnteproyectoImage[];
      if (existingIndex >= 0) {
        updatedImages = [...images];
        updatedImages[existingIndex] = newImgObj;
      } else {
        updatedImages = [...images, newImgObj];
      }

      onChangeImages(updatedImages);
      setUploadStatus((prev) => ({
        ...prev,
        [slotKey]: { status: 'idle', progressPct: 100 }
      }));
    } catch (err: any) {
      setUploadStatus((prev) => ({
        ...prev,
        [slotKey]: {
          status: 'error',
          progressPct: 0,
          errorMessage: err.message || 'Error al subir la imagen'
        }
      }));
    }
  };

  const handleRemoveImage = (slotKey: string) => {
    const filtered = images.filter((img) => img.slotKey !== slotKey);
    onChangeImages(filtered);
  };

  const countUploaded = images.length;
  const hasAnyCustomization = (cronogramaParams?.phaseOverrides && Object.keys(cronogramaParams.phaseOverrides).length > 0) ||
    (cronogramaParams?.phaseCustomizations && Object.keys(cronogramaParams.phaseCustomizations).length > 0);

  return (
    <div className="bg-dark-2 border border-dark-4 rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-4 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Módulo de Ingeniería & Cronograma</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-cream">
            Láminas Técnicas y Ruta Crítica
          </h3>
          <p className="text-xs sm:text-sm text-cream-muted mt-1 max-w-xl">
            Sube las imágenes del anteproyecto para enriquecer la propuesta interactiva y ajusta los tiempos de ejecución en el diagrama de Gantt.
          </p>
        </div>

        {/* Master Unlock Switch */}
        <div className="flex items-center gap-3">
          <div className="bg-dark-3/80 border border-dark-4 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 min-w-[210px] h-[48px] box-border">
            <div className="flex items-center gap-2">
              {anteproyectoUnlocked ? (
                <Unlock className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs font-bold text-cream">
                {anteproyectoUnlocked ? 'Láminas Visibles' : 'Láminas Protegidas'}
              </span>
            </div>
            {onChangeAnteproyectoUnlocked && (
              <button
                type="button"
                onClick={() => onChangeAnteproyectoUnlocked(!anteproyectoUnlocked)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  anteproyectoUnlocked ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                title={anteproyectoUnlocked ? "Bloquear para cliente (requiere desbloqueo)" : "Desbloquear para cliente"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    anteproyectoUnlocked ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {STANDARD_ANTEPROYECTO_SLOTS.map((slot) => {
          const img = images.find((i) => i.slotKey === slot.key);
          const upload = uploadStatus[slot.key];
          const isUploading = upload && upload.status !== 'idle' && upload.status !== 'error';

          return (
            <div
              key={slot.key}
              className={`bg-dark-3/60 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                img
                  ? 'border-gold/40 shadow-[0_4px_20px_rgba(196,152,37,0.06)]'
                  : 'border-dark-4 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-dark-4 text-cream-muted">
                    {slot.categoryTag}
                  </span>
                  {img && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Cargada
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-cream">{slot.defaultTitle}</h4>
                <p className="text-[11px] text-cream-muted line-clamp-2 mt-0.5">
                  {slot.hint}
                </p>
              </div>

              {/* Preview or Drop Area */}
              <div className="mt-4">
                {img ? (
                  <div className="relative group rounded-xl overflow-hidden border border-dark-4 bg-dark-2 aspect-video flex items-center justify-center">
                    <img
                      src={img.thumbnailUrl || img.driveUrl}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal({ url: img.driveUrl, title: img.title })}
                        className="p-2 bg-dark-1/80 hover:bg-gold text-cream hover:text-dark-1 rounded-lg transition-colors"
                        title="Ver imagen completa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(slot.key)}
                        className="p-2 bg-red-950/80 hover:bg-red-600 text-red-300 hover:text-white rounded-lg transition-colors"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-dark-4 hover:border-gold/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group aspect-video bg-dark-2/40">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(slot, file);
                      }}
                    />
                    {isUploading ? (
                      <div className="text-center space-y-2">
                        <RefreshCw className="w-5 h-5 text-gold animate-spin mx-auto" />
                        <span className="text-[10px] text-cream-muted font-bold block">
                          {upload.status === 'compressing'
                            ? 'Comprimiendo...'
                            : upload.status === 'uploading'
                            ? `Subiendo ${upload.progressPct}%`
                            : 'Procesando...'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-cream-muted group-hover:text-gold transition-colors mb-1.5" />
                        <span className="text-xs font-bold text-cream group-hover:text-gold transition-colors">
                          Cargar Lámina
                        </span>
                        <span className="text-[9px] text-cream-muted mt-0.5">JPG, PNG o WebP</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Preview of Calculated Cronograma */}
      <div className="mt-8 pt-8 border-t border-dark-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            <h4 className="text-base font-bold text-cream">
              Previsualización de Ruta Crítica & Cronograma ({cronogramaResult.totalWeeks} Semanas)
            </h4>
            {hasAnyCustomization && (
              <button
                type="button"
                onClick={handleResetOverrides}
                className="text-[11px] font-bold text-gold/80 hover:text-gold underline ml-2 cursor-pointer transition-colors"
                title="Restablecer tiempos por defecto del algoritmo"
              >
                (Restablecer automático)
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {tierLearning && tierLearning.count > 0 && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full flex items-center gap-1" title="El algoritmo se ha calibrado con tus proyectos anteriores">
                <Brain className="w-3 h-3 text-amber-400" />
                Aprendizaje Activo ({tierLearning.count} calibraciones)
              </span>
            )}
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Calculado para {numPanels} paneles ({cronogramaResult.scaleTitle})
            </span>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="mb-4 px-3.5 py-2 bg-dark-3 border border-dark-4 rounded-xl flex items-center justify-between text-[11px] text-cream-muted">
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-gold shrink-0" />
            <span>
              <strong className="text-cream font-bold">Interacción Bilateral:</strong> Arrastra el cuerpo de cualquier barra en el Gantt para cambiar su semana de inicio (en paralelo o serie) o estira su borde derecho para ajustar su duración. También puedes editar directamente las cajas numéricas.
            </span>
          </div>
        </div>

        {/* 5-Step Execution Flow Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
          {cronogramaResult.executionSteps.map((step) => {
            const isOverridden = cronogramaParams?.phaseOverrides?.[step.stepNumber] !== undefined;
            const currentWeeksVal = cronogramaParams?.phaseOverrides?.[step.stepNumber] ?? step.currentWeeks;

            return (
              <div
                key={step.stepNumber}
                className={`p-3 bg-dark-3/90 border rounded-xl flex flex-col justify-between transition-all ${
                  isOverridden ? 'border-gold/60 shadow-[0_0_12px_rgba(196,152,37,0.15)]' : 'border-dark-4'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-black flex items-center justify-center">
                      {step.stepNumber}
                    </div>
                    {isOverridden && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                        Manual
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-cream uppercase">{step.title}</h5>
                  <p className="text-[10px] text-cream-muted line-clamp-2 mt-0.5">{step.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-dark-4/70">
                  <div className="flex items-center justify-between gap-1 bg-dark-2 px-2 py-1 rounded-lg border border-dark-4">
                    <span className="text-[9px] text-cream-muted font-bold">Tiempo:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0.5"
                        max="30"
                        step="0.5"
                        value={currentWeeksVal}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            handlePhaseOverrideChange(step.stepNumber, val);
                          }
                        }}
                        className="w-11 bg-dark-1 text-gold text-xs font-black text-center rounded border border-gold/40 py-0.5 focus:outline-none focus:ring-1 focus:ring-gold"
                        title="Modificar semanas de esta fase (sincroniza en tiempo real con el diagrama de Gantt)"
                      />
                      <span className="text-[10px] text-gold font-bold">sem</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gantt Bar Chart Preview with Drag & Resize */}
        <div className="bg-dark-3 border border-dark-4 rounded-2xl p-4 overflow-x-auto">
          <div className="min-w-[650px]">
            {/* Header Columns */}
            <div className="grid grid-cols-12 gap-1 text-[9px] font-bold text-cream-muted uppercase border-b border-dark-4 pb-2 mb-2">
              <div className="col-span-4 pl-2 flex items-center justify-between pr-2">
                <span>Actividad / Concepto</span>
                <span className="text-[8px] text-gold/70 lowercase font-normal">(arrastrar barra / estirar borde)</span>
              </div>
              <div className="col-span-8 flex justify-between px-1">
                {cronogramaResult.weekColumns.map((col) => (
                  <span key={col.weekNum} className="text-center w-full">
                    {col.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Phase Tracks */}
            <div className="space-y-2">
              {cronogramaResult.phases.map((phase) => {
                const isDraggingThis = activeDrag?.phaseId === phase.id;
                const displayStartWeek = isDraggingThis ? activeDrag.currentStartWeek : phase.startWeek;
                const displayDuration = isDraggingThis ? activeDrag.currentDuration : phase.durationWeeks;

                const leftOffsetWeeks = displayStartWeek - 1;
                const leftPct = Math.max(0, Math.min(100, (leftOffsetWeeks / cronogramaResult.totalWeeks) * 100));
                const widthPct = Math.max(3, Math.min(100 - leftPct, (displayDuration / cronogramaResult.totalWeeks) * 100));

                return (
                  <div key={phase.id} className="grid grid-cols-12 gap-1 items-center text-xs py-1 select-none">
                    <div className="col-span-4 pl-2 text-[11px] font-semibold text-cream truncate flex items-center justify-between pr-3">
                      <span className="truncate">{phase.title}</span>
                      <span className="text-[9px] text-cream-muted font-mono bg-dark-2 px-1.5 py-0.5 rounded border border-dark-4">
                        {displayDuration} sem
                      </span>
                    </div>

                    <div
                      id={`track-mgr-${phase.id}`}
                      className="col-span-8 relative h-7 bg-dark-4/40 rounded-lg overflow-visible flex items-center"
                    >
                      {/* Grid guideline columns */}
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
                        {cronogramaResult.weekColumns.map((col) => (
                          <div key={col.weekNum} className="border-r border-dashed border-white h-full flex-1" />
                        ))}
                      </div>

                      {/* Interactive Gantt Bar */}
                      <div
                        onMouseDown={(e) => {
                          const track = document.getElementById(`track-mgr-${phase.id}`);
                          if (track) {
                            handleBarMouseDown(e, phase.id, 'move', phase.startWeek, phase.durationWeeks, track);
                          }
                        }}
                        className={`absolute h-5 rounded-md text-[9px] font-black text-white px-2 flex items-center justify-between shadow-md select-none cursor-grab active:cursor-grabbing transition-all ${
                          phase.category === 'cfe'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
                            : phase.category === 'commissioning'
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
                            : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950'
                        } ${
                          isDraggingThis
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-2 z-30 shadow-2xl scale-[1.02]'
                            : 'hover:ring-1 hover:ring-white/50'
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`
                        }}
                        title="Arrastra para cambiar inicio de semana"
                      >
                        <span className="truncate pointer-events-none flex items-center gap-1.5">
                          <span className="opacity-75 text-[8px]">S{displayStartWeek}</span>
                          <span className="truncate">{phase.label}</span>
                        </span>

                        {/* Resize Right Handle */}
                        <div
                          onMouseDown={(e) => {
                            const track = document.getElementById(`track-mgr-${phase.id}`);
                            if (track) {
                              handleBarMouseDown(e, phase.id, 'resize', phase.startWeek, phase.durationWeeks, track);
                            }
                          }}
                          className="w-3.5 h-full absolute right-0 top-0 cursor-ew-resize hover:bg-white/30 rounded-r-md flex items-center justify-center group/resize z-10"
                          title="Estira el borde derecho para alargar/acortar duración"
                        >
                          <div className="w-1 h-2.5 bg-white/80 rounded-full group-hover/resize:scale-125 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-4xl max-h-[90vh] bg-dark-2 rounded-2xl overflow-hidden border border-dark-4 shadow-2xl p-2 relative">
            <img
              src={previewImageModal.url}
              alt={previewImageModal.title}
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl"
            />
            <p className="text-center text-xs text-cream font-bold pt-2">{previewImageModal.title}</p>
          </div>
        </div>
      )}

    </div>
  );
}
