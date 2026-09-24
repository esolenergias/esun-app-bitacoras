import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, ShieldCheck, Zap, ArrowRight, Sparkles, Calendar, GripHorizontal } from 'lucide-react';
import { calculateCronograma, type CronogramaResult } from './lib/cronogramaEngine';
import type { CronogramaParams } from './esunTypes';
import { recordCronogramaCalibration } from './lib/cronogramaLearningEngine';

interface CronogramaPresentationSectionProps {
  numPanels: number;
  startDate?: string;
  isOffGrid?: boolean;
  tariff?: string;
  cronogramaParams?: CronogramaParams;
  onChangeCronogramaParams?: (params: CronogramaParams) => void;
  isAdmin?: boolean;
}

export default function CronogramaPresentationSection({
  numPanels,
  startDate,
  isOffGrid,
  tariff,
  cronogramaParams,
  onChangeCronogramaParams,
  isAdmin
}: CronogramaPresentationSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hoveredPhaseId, setHoveredPhaseId] = useState<string | null>(null);

  // Drag & drop state for presentation view (if admin)
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

  const effectiveStartDate = cronogramaParams?.startDate || startDate || new Date().toISOString().split('T')[0];

  const cronograma: CronogramaResult = calculateCronograma(
    numPanels,
    effectiveStartDate,
    {
      isOffGrid,
      tariff,
      phaseOverrides: cronogramaParams?.phaseOverrides,
      phaseCustomizations: cronogramaParams?.phaseCustomizations
    }
  );

  // Trigger animation when the user scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Drag & drop window listeners
  useEffect(() => {
    if (!activeDrag || !onChangeCronogramaParams) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - activeDrag.startX;
      const weeksPerPixel = cronograma.totalWeeks / activeDrag.trackWidth;
      const deltaWeeks = deltaX * weeksPerPixel;

      if (activeDrag.mode === 'move') {
        const rawNewStart = activeDrag.initialStartWeek + deltaWeeks;
        const snappedStart = Math.max(1, Math.round(rawNewStart * 2) / 2);
        setActiveDrag((prev) => (prev ? { ...prev, currentStartWeek: snappedStart } : null));
      } else if (activeDrag.mode === 'resize') {
        const rawNewDur = activeDrag.initialDuration + deltaWeeks;
        const snappedDur = Math.max(0.5, Math.round(rawNewDur * 2) / 2);
        setActiveDrag((prev) => (prev ? { ...prev, currentDuration: snappedDur } : null));
      }
    };

    const handleMouseUp = () => {
      if (activeDrag && onChangeCronogramaParams) {
        const updatedCustomizations = {
          ...(cronogramaParams?.phaseCustomizations || {}),
          [activeDrag.phaseId]: {
            startWeek: activeDrag.currentStartWeek,
            durationWeeks: activeDrag.currentDuration
          }
        };

        onChangeCronogramaParams({
          ...cronogramaParams,
          startDate: effectiveStartDate,
          phaseCustomizations: updatedCustomizations
        });

        // Record in adaptive learning engine
        const stepOverrides: Record<string, number> = {};
        cronograma.executionSteps.forEach((s) => {
          stepOverrides[s.stepNumber] = s.currentWeeks;
        });
        recordCronogramaCalibration(cronograma.scaleTier, stepOverrides, updatedCustomizations);
      }
      setActiveDrag(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, cronograma.totalWeeks, cronogramaParams, effectiveStartDate, onChangeCronogramaParams, cronograma.scaleTier]);

  const handleBarMouseDown = (
    e: React.MouseEvent,
    phaseId: string,
    mode: 'move' | 'resize',
    phaseStartWeek: number,
    phaseDuration: number,
    trackElement: HTMLElement
  ) => {
    if (!isAdmin || !onChangeCronogramaParams) return;
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

  return (
    <section ref={sectionRef} className="space-y-10 sm:space-y-12 relative">
      <style>{`
        @keyframes ganttBeamSweep {
          0% {
            transform: translateX(-150%) skewX(-25deg);
            opacity: 0;
          }
          30% {
            opacity: 0.65;
          }
          70% {
            opacity: 0.65;
          }
          100% {
            transform: translateX(350%) skewX(-25deg);
            opacity: 0;
          }
        }
        @keyframes subtlePulseGlow {
          0%, 100% {
            filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3));
          }
          50% {
            filter: drop-shadow(0 6px 20px rgba(16, 185, 129, 0.65));
          }
        }
      `}</style>

      {/* Section Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C49825]/15 border border-[#C49825]/30 rounded-full text-[#997015] text-xs font-bold uppercase tracking-wider shadow-sm mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Metodología de Trabajo & Ruta Crítica</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Plan de Ejecución y Cronograma
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-2 max-w-2xl mx-auto">
          Estrategia en Paralelo: Ruta EPC (Técnica) & Gestión Regulatoria CFE ({cronograma.totalWeeks} Semanas Objetivo).
        </p>
      </div>

      {/* 5-Step Execution Flow with Staggered Entrance */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span>Diagrama de Flujo de Ejecución (Camino EPC)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {cronograma.formattedDateRange}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {cronograma.executionSteps.map((step, idx) => {
            const isFinal = step.isFinal;
            const delayMs = idx * 100;
            const currentWeeksVal = cronogramaParams?.phaseOverrides?.[step.stepNumber] ?? step.currentWeeks;

            return (
              <div
                key={step.stepNumber}
                style={{
                  transitionDelay: `${delayMs}ms`,
                  transitionDuration: '800ms'
                }}
                className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between transition-all transform ${
                  isInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                } ${
                  isFinal
                    ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-white border-2 border-emerald-500 shadow-xl sm:shadow-2xl sm:shadow-emerald-950/20'
                    : 'bg-white text-slate-800 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-black font-mono shadow-sm ${
                        isFinal
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-[#C49825]/15 text-[#997015]'
                      }`}
                    >
                      {step.stepNumber}
                    </span>

                    {isFinal ? (
                      <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider animate-pulse">
                        <Zap className="w-2.5 h-2.5" />
                        <span>Hito Clave</span>
                      </span>
                    ) : (
                      idx < 4 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden lg:block" />
                      )
                    )}
                  </div>

                  <h4
                    className={`text-xs sm:text-sm font-bold uppercase tracking-tight leading-tight ${
                      isFinal ? 'text-emerald-400' : 'text-slate-900'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`text-[10px] sm:text-xs mt-1 sm:mt-1.5 leading-tight sm:leading-relaxed ${
                      isFinal ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>

                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100/15">
                  {isAdmin && onChangeCronogramaParams ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        min="0.5"
                        max="20"
                        step="0.5"
                        className={`w-14 px-1.5 py-0.5 text-center rounded-lg text-[10px] sm:text-xs font-bold border focus:outline-none focus:ring-1 ${
                          isFinal
                            ? 'bg-emerald-900/50 border-emerald-700/50 text-emerald-400 focus:ring-emerald-500'
                            : 'bg-white border-amber-200 text-amber-900 focus:ring-amber-500'
                        }`}
                        value={currentWeeksVal}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            const newOverrides = {
                              ...(cronogramaParams?.phaseOverrides || {}),
                              [step.stepNumber]: val
                            };
                            onChangeCronogramaParams({
                              ...cronogramaParams,
                              phaseOverrides: newOverrides
                            });
                            recordCronogramaCalibration(cronograma.scaleTier, newOverrides, cronogramaParams?.phaseCustomizations);
                          }
                        }}
                        title="Editar duración en semanas"
                      />
                      <span className={`text-[9px] sm:text-[10px] font-bold ${isFinal ? 'text-emerald-500/80' : 'text-amber-700/80'}`}>
                        sem
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`inline-block w-full py-0.5 sm:py-1 text-center rounded-lg text-[10px] sm:text-xs font-bold transition-colors ${
                        isFinal
                          ? 'bg-emerald-950/80 border border-emerald-700/50 text-emerald-400'
                          : 'bg-amber-50 border border-amber-200 text-amber-800'
                      }`}
                    >
                      {step.durationLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Gantt Timeline Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500 opacity-80" />

        {/* Gantt Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Cronograma de Actividades en Paralelo</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-100 text-amber-900 border border-amber-300/60">
                Gantt Dinámico
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Escala de tiempo objetivo calculada para {numPanels} paneles solares ({cronograma.scaleTitle}).
            </p>
          </div>

          {/* Legend Items */}
          <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              <span className="text-slate-700 text-[11px]">Ruta EPC (Técnica)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50" />
              <span className="text-slate-700 text-[11px]">Gestión CFE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="text-slate-700 text-[11px]">Puesta en Marcha</span>
            </div>
          </div>
        </div>

        {/* Interactive Gantt Chart Tracks */}
        <div className="pt-4 sm:pt-6 overflow-x-auto">
          <div className="min-w-[650px] sm:min-w-0">
            {/* Header Columns */}
            <div className="grid grid-cols-12 gap-1 pb-3 mb-2 border-b border-slate-100 text-[10px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              <div className="col-span-5 sm:col-span-4 pl-3">
                Actividad / Concepto
              </div>
              <div className="col-span-7 sm:col-span-8 flex justify-between px-2 text-center">
                {cronograma.weekColumns.map((col) => (
                  <div key={col.weekNum} className="w-full">
                    <span className="text-slate-800 font-bold block">{col.label}</span>
                    <span className="text-[8px] text-slate-400 font-normal hidden md:block mt-0.5">
                      {col.dateRange}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase Tracks */}
            <div className="space-y-2 py-1">
              {cronograma.phases.map((phase, idx) => {
                const isHovered = hoveredPhaseId === phase.id;
                const isDraggingThis = activeDrag?.phaseId === phase.id;
                const isCommissioning = phase.category === 'commissioning';
                const isCfe = phase.category === 'cfe';

                const displayStartWeek = isDraggingThis ? activeDrag.currentStartWeek : phase.startWeek;
                const displayDuration = isDraggingThis ? activeDrag.currentDuration : phase.durationWeeks;

                const leftOffsetWeeks = displayStartWeek - 1;
                const leftPct = Math.max(0, Math.min(100, (leftOffsetWeeks / cronograma.totalWeeks) * 100));
                const widthPct = Math.max(3, Math.min(100 - leftPct, (displayDuration / cronograma.totalWeeks) * 100));

                const delayMs = idx * 80 + 100;

                let barGradient = 'from-amber-500 via-amber-500 to-amber-600';
                let barShadow = 'shadow-[0_2px_8px_rgba(245,158,11,0.25)]';
                let borderHighlight = 'border-amber-400/40';

                if (isCfe) {
                  barGradient = 'from-blue-600 via-blue-500 to-blue-600';
                  barShadow = 'shadow-[0_2px_8px_rgba(37,99,235,0.25)]';
                  borderHighlight = 'border-blue-300/40';
                } else if (isCommissioning) {
                  barGradient = 'from-emerald-500 via-emerald-500 to-emerald-600';
                  barShadow = 'shadow-[0_2px_8px_rgba(16,185,129,0.3)]';
                  borderHighlight = 'border-emerald-300/50';
                }

                return (
                  <div
                    key={phase.id}
                    onMouseEnter={() => setHoveredPhaseId(phase.id)}
                    onMouseLeave={() => setHoveredPhaseId(null)}
                    className={`grid grid-cols-12 gap-1 items-center rounded-xl p-1.5 transition-all duration-200 ${
                      isHovered ? 'bg-slate-100/90 shadow-sm' : 'bg-slate-50/70 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Phase Title Column */}
                    <div className="col-span-5 sm:col-span-4 pl-2 pr-2">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {isCommissioning && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                          )}
                          <span
                            className={`text-[10px] sm:text-xs font-bold block truncate leading-tight ${
                              isCfe ? 'text-blue-900' : isCommissioning ? 'text-emerald-900 font-extrabold' : 'text-slate-800'
                            }`}
                            title={phase.title}
                          >
                            {phase.title}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono bg-white px-1 py-0.5 rounded border border-slate-200 shrink-0">
                          {displayDuration} sem
                        </span>
                      </div>
                    </div>

                    {/* Phase Track Column with Drag & Drop */}
                    <div
                      id={`pres-track-${phase.id}`}
                      className="col-span-7 sm:col-span-8 relative h-7 bg-slate-200/50 rounded-lg overflow-visible flex items-center p-0.5 shadow-inner"
                    >
                      {/* Grid guidelines */}
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                        {cronograma.weekColumns.map((col) => (
                          <div key={col.weekNum} className="border-r border-dashed border-slate-400 h-full flex-1" />
                        ))}
                      </div>

                      {/* Interactive Bar */}
                      <div
                        onMouseDown={(e) => {
                          const track = document.getElementById(`pres-track-${phase.id}`);
                          if (track) handleBarMouseDown(e, phase.id, 'move', phase.startWeek, phase.durationWeeks, track);
                        }}
                        className={`absolute h-5 sm:h-6 rounded-md text-[8px] sm:text-[9.5px] font-black text-white px-2 flex items-center justify-between border-t ${borderHighlight} bg-gradient-to-r ${barGradient} ${barShadow} ${
                          isAdmin ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-slate-900/30' : ''
                        } ${isDraggingThis ? 'ring-2 ring-slate-900 z-30 shadow-xl scale-[1.02]' : ''} select-none transition-transform`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`
                        }}
                        title={isAdmin ? 'Arrastra para mover la semana de inicio' : undefined}
                      >
                        <span className="truncate drop-shadow-sm flex items-center gap-1">
                          <span className="opacity-80 text-[7.5px] sm:text-[8.5px]">S{displayStartWeek}</span>
                          <span className="truncate">{phase.label}</span>
                        </span>

                        {/* Right Resize Handle for Admin */}
                        {isAdmin && (
                          <div
                            onMouseDown={(e) => {
                              const track = document.getElementById(`pres-track-${phase.id}`);
                              if (track) handleBarMouseDown(e, phase.id, 'resize', phase.startWeek, phase.durationWeeks, track);
                            }}
                            className="w-3 h-full absolute right-0 top-0 cursor-ew-resize hover:bg-white/40 rounded-r-md flex items-center justify-center group/resize z-10"
                            title="Estira para alargar o acortar la duración"
                          >
                            <div className="w-0.5 h-2 bg-white/90 rounded-full group-hover/resize:scale-125 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium pt-5 mt-5 border-t border-slate-100 gap-3 relative z-10">
          <span className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Garantía de Tiempo y Forma:</strong> Los tiempos se gestionan de forma paralela entre la ingeniería, obra y trámites de CFE.
            </span>
          </span>
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C49825]" />
            <span>ESOL EPC High Precision</span>
          </div>
        </div>
      </div>
    </section>
  );
}
