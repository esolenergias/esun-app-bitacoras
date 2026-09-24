import React, { useState } from 'react';
import { 
  Sun, 
  Zap, 
  BatteryCharging, 
  Home, 
  Cpu, 
  ShieldCheck, 
  Moon, 
  Sparkles,
  Activity,
  Layers,
  Power
} from 'lucide-react';

export default function OffGridAnimatedDiagram() {
  const [activeMode, setActiveMode] = useState<'day' | 'night'>('day');

  const isDay = activeMode === 'day';

  return (
    <div className="w-full my-8 space-y-12">
      
      {/* 1. SECCIÓN: CORTE ARQUITECTÓNICO REALISTA DEL SISTEMA AISLADO (A TODO EL ANCHO DE LA PÁGINA) */}
      <div className="w-[100vw] relative left-1/2 -translate-x-1/2 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 sm:py-16 border-y border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Decorative subtle ambient lights */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          
          {/* Header de la tarjeta con especificaciones de Glow */}
          <div className="relative z-10 mb-8 pb-6 border-b border-slate-800/80 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[#FEE180] text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Corte Transversal de Ingeniería
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Arquitectura en Corte de Tu Sistema Aislado
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Visualización realista de los componentes instalados y el flujo luminoso de energía interactuando con tu residencia.
              </p>
            </div>

            {/* Especificaciones de Glow debajo del texto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              
              {/* Glow Dorado */}
              <div className="flex items-start gap-3 bg-slate-800/80 border border-amber-500/30 p-3.5 rounded-2xl shadow-lg shadow-amber-500/5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] mt-0.5 shrink-0 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-amber-300 block">Glow Dorado:</span>
                  <span className="text-[11px] text-slate-300 leading-tight block mt-0.5">
                    Circuito Solar DC (Tejado ➔ Inversor)
                  </span>
                </div>
              </div>

              {/* Glow Esmeralda */}
              <div className="flex items-start gap-3 bg-slate-800/80 border border-emerald-500/30 p-3.5 rounded-2xl shadow-lg shadow-emerald-500/5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] mt-0.5 shrink-0 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">Glow Esmeralda:</span>
                  <span className="text-[11px] text-slate-300 leading-tight block mt-0.5">
                    Almacenamiento BMS Litio (24/7)
                  </span>
                </div>
              </div>

              {/* Glow Turquesa */}
              <div className="flex items-start gap-3 bg-slate-800/80 border border-cyan-500/30 p-3.5 rounded-2xl shadow-lg shadow-cyan-500/5">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] mt-0.5 shrink-0 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-cyan-300 block">Glow Turquesa:</span>
                  <span className="text-[11px] text-slate-300 leading-tight block mt-0.5">
                    Distribución AC (120/220V a Todo el Hogar)
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Imagen con Flujo de Electricidad Animado (Glow Pulse) */}
          <div className="relative z-10 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
            <img
              src="/crosssection_offgrid.jpg"
              alt="Corte transversal arquitectónico de sistema aislado off-grid con flujos de energía glow"
              className="w-full h-auto object-cover max-h-[680px] transition-transform duration-700 hover:scale-[1.005]"
              loading="lazy"
            />

            {/* SVG Animated Energy Conduit Glow Stream (30% Opacidad & Velocidad Suave) */}
            <svg 
              viewBox="0 0 1000 562.5" 
              className="absolute inset-0 w-full h-full pointer-events-none select-none z-20 opacity-30 transition-opacity duration-500"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Glow Filter Definitions */}
                <filter id="electric-gold" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="electric-emerald" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="electric-cyan" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Flujo Solar DC (Tejado ➔ Cuarto Técnico / Inversor) */}
              <path
                d="M 220 162 L 340 162 L 340 370 L 520 370 L 520 405"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#electric-gold)"
                style={{
                  strokeDasharray: '14 20',
                  animation: 'energyPulseFlow 3.8s linear infinite'
                }}
              />
              <path
                d="M 370 148 L 545 148 L 545 170 L 340 170"
                fill="none"
                stroke="#FEF08A"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#electric-gold)"
                style={{
                  strokeDasharray: '10 16',
                  animation: 'energyPulseFlow 3.2s linear infinite'
                }}
              />

              {/* 2. Flujo Carga / Descarga Baterías BMS Litio */}
              <path
                d="M 545 435 C 580 435, 600 460, 685 460"
                fill="none"
                stroke="#34D399"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#electric-emerald)"
                style={{
                  strokeDasharray: '12 18',
                  animation: 'energyPulseFlow 4.2s linear infinite'
                }}
              />
              <path
                d="M 610 425 L 685 425 L 685 490"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#electric-emerald)"
                style={{
                  strokeDasharray: '8 14',
                  animation: 'energyPulseFlow 3.5s linear infinite'
                }}
              />

              {/* 3. Flujo Distribución AC (Inversor ➔ Toda la Casa) */}
              <path
                d="M 615 395 L 755 395 L 755 195 L 835 195"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#electric-cyan)"
                style={{
                  strokeDasharray: '12 18',
                  animation: 'energyPulseFlow 3.4s linear infinite'
                }}
              />
              <path
                d="M 755 290 L 825 290 L 825 315"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#electric-cyan)"
                style={{
                  strokeDasharray: '10 16',
                  animation: 'energyPulseFlow 3.9s linear infinite'
                }}
              />
              <path
                d="M 525 240 L 750 240"
                fill="none"
                stroke="#67E8F9"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#electric-cyan)"
                style={{
                  strokeDasharray: '8 14',
                  animation: 'energyPulseFlow 3.0s linear infinite'
                }}
              />

              {/* Puntos de Conexión / Nodos de Energía Luminosos */}
              <circle cx="220" cy="162" r="5" fill="#FEE180" filter="url(#electric-gold)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <circle cx="520" cy="370" r="5.5" fill="#38BDF8" filter="url(#electric-cyan)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <circle cx="685" cy="460" r="5.5" fill="#34D399" filter="url(#electric-emerald)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <circle cx="825" cy="315" r="4.5" fill="#38BDF8" filter="url(#electric-cyan)" className="animate-pulse" style={{ animationDuration: '4s' }} />
            </svg>

            {/* Keyframe animation for energy flow */}
            <style>{`
              @keyframes energyPulseFlow {
                from {
                  stroke-dashoffset: 150;
                }
                to {
                  stroke-dashoffset: 0;
                }
              }
            `}</style>
          </div>

        </div>
      </div>

      {/* 2. SECCIÓN: SIMULADOR INTERACTIVO DE FLUJO ENERGÉTICO */}
      <div className="w-full max-w-5xl mx-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Decorative subtle ambient lights */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Title & Operational Mode Selector */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800/80 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-[#FEE180] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Interacción Dinámica del Sistema
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Ciclo Operativo: Día vs. Noche
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Explora cómo el sistema gestiona la energía automáticamente según la hora del día y la demanda de tu vivienda.
            </p>
          </div>

          {/* Mode Toggle Selector */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 self-start md:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveMode('day')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                isDay
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className={`w-4 h-4 ${isDay ? 'text-slate-950 animate-spin' : ''}`} style={{ animationDuration: '16s' }} />
              <span>Día: Generación & Carga</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('night')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                !isDay
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-300" />
              <span>Noche: Respaldo Baterías</span>
            </button>
          </div>
        </div>

        {/* Main Flow Diagram Section (Symmetrical 5-Stage Architecture) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch mb-8">
          
          {/* Stage 1: Radiación Solar */}
          <div className={`flex flex-col justify-between p-4 rounded-2xl border transition-all duration-500 relative ${
            isDay 
              ? 'bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-900 border-amber-500/40 shadow-xl shadow-amber-500/5 ring-1 ring-amber-400/20' 
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Paso 1
                </span>
                {isDay ? (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Inactivo</span>
                )}
              </div>

              <div className="flex justify-center mb-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  isDay
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  <Sun className={`w-7 h-7 ${isDay ? 'animate-spin' : ''}`} style={{ animationDuration: '14s' }} />
                </div>
              </div>

              <h4 className="text-sm font-bold text-white text-center">Radiación Solar</h4>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                {isDay ? 'Luz y fotones captados en horas pico solar' : 'Sin irradiación en horario nocturno'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Irradiancia:</span>
              <span className={`font-mono font-bold ${isDay ? 'text-amber-300' : 'text-slate-500'}`}>
                {isDay ? '1,000 W/m²' : '0 W/m²'}
              </span>
            </div>
          </div>

          {/* Stage 2: Módulos Fotovoltaicos */}
          <div className={`flex flex-col justify-between p-4 rounded-2xl border transition-all duration-500 relative ${
            isDay 
              ? 'bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-900 border-amber-500/40 shadow-xl shadow-amber-500/5 ring-1 ring-amber-400/20' 
              : 'bg-slate-900/40 border-slate-800 opacity-65'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Paso 2
                </span>
                <span className={`text-[10px] font-bold ${isDay ? 'text-amber-400' : 'text-slate-500'}`}>
                  {isDay ? 'Generando' : 'Standby'}
                </span>
              </div>

              <div className="flex justify-center mb-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  isDay
                    ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <Layers className="w-7 h-7" />
                </div>
              </div>

              <h4 className="text-sm font-bold text-white text-center">Paneles Tier-1</h4>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                {isDay ? 'Conversión de fotones a corriente continua (DC)' : 'Módulos en reposo listos para el amanecer'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Potencia DC:</span>
              <span className={`font-mono font-bold ${isDay ? 'text-amber-300' : 'text-slate-500'}`}>
                {isDay ? '5.4 kW DC' : '0.0 kW'}
              </span>
            </div>
          </div>

          {/* Stage 3: Inversor / Cargador Aislado (Cerebro Central) */}
          <div className="flex flex-col justify-between p-4 rounded-2xl border bg-gradient-to-b from-blue-500/20 via-slate-900/95 to-slate-900 border-blue-400/50 shadow-2xl shadow-blue-500/15 relative ring-1 ring-blue-400/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest shadow-md whitespace-nowrap">
              Cerebro Central
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Paso 3
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                  <Activity className="w-3 h-3 animate-pulse" />
                  MPPT Activo
                </span>
              </div>

              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 scale-105">
                  <Cpu className="w-7 h-7 animate-pulse" />
                </div>
              </div>

              <h4 className="text-sm font-bold text-white text-center">Inversor Off-Grid</h4>
              <p className="text-[11px] text-slate-300 text-center mt-1">
                Transformación DC a AC Onda Senoidal Pura & distribución
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Eficiencia:</span>
              <span className="font-mono font-bold text-cyan-300">97.8% Onda Pura</span>
            </div>
          </div>

          {/* Stage 4: Banco de Baterías */}
          <div className={`flex flex-col justify-between p-4 rounded-2xl border transition-all duration-500 relative ${
            !isDay 
              ? 'bg-gradient-to-b from-emerald-500/20 via-slate-900/90 to-slate-900 border-emerald-400/50 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/30' 
              : 'bg-gradient-to-b from-emerald-500/10 via-slate-900/90 to-slate-900 border-emerald-500/30'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Paso 4
                </span>
                <span className="text-[10px] font-bold text-emerald-400">
                  {isDay ? '⚡ Cargando' : '🔋 Entregando'}
                </span>
              </div>

              <div className="flex justify-center mb-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  !isDay
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20'
                }`}>
                  <BatteryCharging className="w-7 h-7" />
                </div>
              </div>

              <h4 className="text-sm font-bold text-white text-center">Banco de Baterías</h4>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                {isDay ? 'Acumula los excedentes solares para uso posterior' : 'Alimenta la vivienda de forma silenciosa e ininterrumpida'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Nivel de Carga:</span>
              <span className="font-mono font-bold text-emerald-300">
                {isDay ? '98% (Carga Rápida)' : '85% (Descarga Óptima)'}
              </span>
            </div>
          </div>

          {/* Stage 5: Consumo en el Hogar */}
          <div className="flex flex-col justify-between p-4 rounded-2xl border bg-gradient-to-b from-sky-500/10 via-slate-900/90 to-slate-900 border-sky-400/30 shadow-lg shadow-sky-500/5 relative">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Paso 5
                </span>
                <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                  <Power className="w-3 h-3" />
                  120V / 220V
                </span>
              </div>

              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <Home className="w-7 h-7" />
                </div>
              </div>

              <h4 className="text-sm font-bold text-white text-center">Hogar Conectado</h4>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                Refrigeración, bombas, iluminación, clima e internet sin cortes
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Consumo Activo:</span>
              <span className="font-mono font-bold text-sky-300">
                {isDay ? '2.2 kW AC' : '1.8 kW AC'}
              </span>
            </div>
          </div>

        </div>

        {/* Energy Flow Live Telemetry Bar */}
        <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-3.5 h-3.5 rounded-full animate-ping shrink-0 ${isDay ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <div>
              <div className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                <span>Flujo de Energía en Tiempo Real:</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                  isDay 
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}>
                  {isDay 
                    ? '☀️ Sol ➔ Paneles (5.4 kW) ➔ Inversor ➔ [Hogar (2.2 kW) + Baterías (+3.2 kW)]' 
                    : '🔋 Baterías (1.8 kW) ➔ Inversor ➔ Hogar (1.8 kW AC Constante)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isDay
                  ? 'Durante el día tu hogar funciona directamente con la radiación solar mientras el excedente se guarda de forma ultra rápida.'
                  : 'Durante la noche el banco de litio / ciclo profundo asume la carga completa automáticamente en microsegundos.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <span className="text-[11px] font-medium text-slate-400">Estado:</span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
              isDay 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
            }`}>
              {isDay ? 'Autonomía Solar + Carga' : 'Autonomía por Baterías'}
            </span>
          </div>
        </div>

        {/* 3 Luxury Guarantees / Features */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">100% Cero Recibos CFE</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Independencia energética total para ranchos, residencias campestres o naves industriales.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Protección BMS & Larga Vida</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Baterías de ciclo profundo con gestión térmica inteligente y miles de ciclos de descarga.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Onda Senoidal Pura</h5>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Voltaje perfecto y estabilizado para proteger equipos electrónicos, motores y bombas.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}


