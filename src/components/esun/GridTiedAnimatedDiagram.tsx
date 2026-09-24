import React, { useState } from 'react';
import { 
  Sun, 
  Zap, 
  Home, 
  Cpu, 
  Moon, 
  Sparkles,
  Activity,
  ArrowRightLeft
} from 'lucide-react';
import type { SolarProject, Proposal } from './esunTypes';

interface GridTiedAnimatedDiagramProps {
  project?: SolarProject;
  proposal?: Proposal;
}

export default function GridTiedAnimatedDiagram({ project, proposal }: GridTiedAnimatedDiagramProps) {
  const [activeMode, setActiveMode] = useState<'day' | 'night' | 'peak'>('day');

  // Cálculos dinámicos con datos reales de la propuesta
  const totalKw = proposal?.system?.total_power_kw || 0;
  const annualProdKwh = proposal?.system?.annual_production_kWh || (totalKw > 0 ? totalKw * 1550 : 6000);
  const dailyGenKwh = proposal?.financial?.daily_generation_kWh || Math.round((annualProdKwh / 365) * 10) / 10;
  const annualSavingsMxn = proposal?.financial?.annual_savings_yr1 || (annualProdKwh * (project?.cfe?.tariff_rate || 4.5));
  const minFee = proposal?.financial?.calculated_min_fee || 65;
  const tariffRate = project?.cfe?.tariff_rate || 4.50;

  return (
    <div className="w-full my-8 space-y-12">
      
      {/* 1. SECCIÓN: CORTE ARQUITECTÓNICO REALISTA DEL SISTEMA INTERCONECTADO (A TODO EL ANCHO DE LA PÁGINA) */}
      <div className="w-[100vw] relative left-1/2 -translate-x-1/2 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 sm:py-16 border-y border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Decorative subtle ambient lights */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          
          {/* Header de la tarjeta con especificaciones de Glow */}
          <div className="relative z-10 mb-8 pb-6 border-b border-slate-800/80 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[#FEE180] text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Corte Transversal de Ingeniería
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Arquitectura en Corte de Tu Sistema Interconectado
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Visualización fotorrealista de la interacción simultánea entre tus paneles solares, tu hogar y la Red Eléctrica de CFE.
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
                    Generación Solar DC (Tejado ➔ Inversor Smart)
                  </span>
                </div>
              </div>

              {/* Glow Turquesa */}
              <div className="flex items-start gap-3 bg-slate-800/80 border border-cyan-500/30 p-3.5 rounded-2xl shadow-lg shadow-cyan-500/5">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] mt-0.5 shrink-0 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-cyan-300 block">Glow Turquesa:</span>
                  <span className="text-[11px] text-slate-300 leading-tight block mt-0.5">
                    Autoconsumo AC Inmediato (Hogar y Cargas)
                  </span>
                </div>
              </div>

              {/* Glow Esmeralda */}
              <div className="flex items-start gap-3 bg-slate-800/80 border border-emerald-500/30 p-3.5 rounded-2xl shadow-lg shadow-emerald-500/5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] mt-0.5 shrink-0 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">Glow Esmeralda:</span>
                  <span className="text-[11px] text-slate-300 leading-tight block mt-0.5">
                    Flujo Bidireccional (Inyección y Respaldo CFE)
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Imagen con Flujo de Electricidad Animado (Glow Pulse Lento y Elegante) */}
          <div className="relative z-10 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
            <img
              src="/crosssection_gridtied.jpg"
              alt="Corte transversal arquitectónico de sistema fotovoltaico interconectado a CFE con flujos luminosos de energía"
              className="w-full h-auto object-cover max-h-[680px] transition-transform duration-700 hover:scale-[1.005]"
              loading="lazy"
            />

            {/* SVG Animated Energy Conduit Glow Stream (Movimiento Lento) */}
            <svg 
              viewBox="0 0 1000 562.5" 
              className="absolute inset-0 w-full h-full pointer-events-none select-none z-20 opacity-40 transition-opacity duration-500"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Glow Filter Definitions */}
                <filter id="gt-electric-gold" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="gt-electric-cyan" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="gt-electric-emerald" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Flujo Solar DC (Tejado ➔ Inversor de Pared en Garaje) - Movimiento Lento */}
              <path
                d="M 360 155 L 350 280 L 350 420 L 290 420 L 290 440"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#gt-electric-gold)"
                style={{
                  strokeDasharray: '14 20',
                  animation: 'energyPulseFlow 7.5s linear infinite'
                }}
              />
              <path
                d="M 730 145 L 730 320 L 350 320"
                fill="none"
                stroke="#FEF08A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#gt-electric-gold)"
                style={{
                  strokeDasharray: '12 18',
                  animation: 'energyPulseFlow 8.5s linear infinite'
                }}
              />

              {/* 2. Flujo Inversor ➔ Centro de Carga Residencial */}
              <path
                d="M 285 450 L 340 450 L 340 400"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#gt-electric-gold)"
                style={{
                  strokeDasharray: '8 12',
                  animation: 'energyPulseFlow 6.0s linear infinite'
                }}
              />

              {/* 3. Flujo AC Turquesa (Centro de Carga ➔ Planta Baja & Planta Alta) */}
              <path
                d="M 350 470 L 350 500 L 520 500 L 520 380 L 680 380 L 680 340"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#gt-electric-cyan)"
                style={{
                  strokeDasharray: '12 18',
                  animation: 'energyPulseFlow 7.0s linear infinite'
                }}
              />
              <path
                d="M 520 500 L 700 500 L 700 410"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#gt-electric-cyan)"
                style={{
                  strokeDasharray: '10 16',
                  animation: 'energyPulseFlow 8.0s linear infinite'
                }}
              />

              {/* 4. Flujo Bidireccional Esmeralda (Centro de Carga ➔ Medidor CFE ➔ Red Eléctrica) */}
              <path
                d="M 350 500 L 890 500 L 890 410 L 890 200 L 980 100"
                fill="none"
                stroke="#34D399"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#gt-electric-emerald)"
                style={{
                  strokeDasharray: '16 22',
                  animation: 'energyPulseFlow 9.0s linear infinite'
                }}
              />
              <path
                d="M 980 90 L 890 190 L 890 380"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#gt-electric-emerald)"
                style={{
                  strokeDasharray: '10 16',
                  animation: 'energyPulseFlow 10.0s linear infinite'
                }}
              />

              {/* Nodos de Conexión Pulsantes */}
              <circle cx="360" cy="155" r="4.5" fill="#FEE180" filter="url(#gt-electric-gold)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <circle cx="285" cy="450" r="5" fill="#FBBF24" filter="url(#gt-electric-gold)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <circle cx="350" cy="470" r="5" fill="#22D3EE" filter="url(#gt-electric-cyan)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <circle cx="890" cy="410" r="5.5" fill="#34D399" filter="url(#gt-electric-emerald)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <circle cx="980" cy="95" r="5.5" fill="#10B981" filter="url(#gt-electric-emerald)" className="animate-pulse" style={{ animationDuration: '4s' }} />
            </svg>

            {/* Inyección Local de Keyframes para compatibilidad total */}
            <style>{`
              @keyframes energyPulseFlow {
                from {
                  stroke-dashoffset: 200;
                }
                to {
                  stroke-dashoffset: 0;
                }
              }
            `}</style>
          </div>

          {/* Selector Interactivo de Modos de Operación */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Dinámica Operativa del Sistema en Tiempo Real
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona una condición para entender cómo interactúa tu planta solar con la red pública:
                </p>
              </div>

              {/* Botones de Control de Modo */}
              <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveMode('day')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'day'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Día (Generación Máxima)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('peak')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'peak'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Alta Demanda (Solar + Red)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('night')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'night'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Noche (Uso de Saldo CFE)
                </button>
              </div>
            </div>

            {/* Tarjeta Explicativa Dinámica con Datos Reales */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 transition-all duration-300">
              {activeMode === 'day' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase">
                      <Sun className="w-4 h-4" />
                      100% Energía Solar Directa + Exportación de Excedentes
                    </div>
                    <h5 className="text-lg font-extrabold text-white">
                      Tu medidor gira hacia atrás acumulando saldo a tu favor
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Durante las horas de sol, los paneles cubren el 100% de los consumos del hogar (refrigerador, lavadora, computadoras, iluminación). El excedente que no consumes viaja automáticamente al transformador de CFE a través del medidor bidireccional, sumando créditos en kWh para tu recibo.
                    </p>
                  </div>
                  <div className="bg-slate-800/80 border border-amber-500/20 rounded-xl p-4 text-center">
                    <span className="text-[11px] font-semibold text-slate-400 block">Costo de Energía Solar:</span>
                    <span className="text-2xl font-black text-amber-400 font-mono block my-1">$0.00 MXN / kWh</span>
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      ✓ Producción: ~{dailyGenKwh.toLocaleString()} kWh/día gratis
                    </span>
                  </div>
                </div>
              )}

              {activeMode === 'peak' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-extrabold uppercase">
                      <Zap className="w-4 h-4" />
                      Sinergia Híbrida Inteligente en Picos de Potencia
                    </div>
                    <h5 className="text-lg font-extrabold text-white">
                      Aires acondicionados y motores arrancan con estabilidad total
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Si enciendes múltiples aires acondicionados, horno o bombas y la demanda supera la producción instantánea, el sistema toma la diferencia milisegundo a milisegundo de la red sin parpadeos, ruidos ni caídas de tensión.
                    </p>
                  </div>
                  <div className="bg-slate-800/80 border border-cyan-500/20 rounded-xl p-4 text-center">
                    <span className="text-[11px] font-semibold text-slate-400 block">Capacidad del Sistema:</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono block my-1">
                      {totalKw > 0 ? `${totalKw.toFixed(2)} kWp` : 'Alta Eficiencia'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold block">
                      Ahorro estimado: ${Math.round(annualSavingsMxn).toLocaleString('es-MX')} MXN/año
                    </span>
                  </div>
                </div>
              )}

              {activeMode === 'night' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold uppercase">
                      <Moon className="w-4 h-4" />
                      Uso de Créditos Energéticos en Horas Nocturnas
                    </div>
                    <h5 className="text-lg font-extrabold text-white">
                      La red de CFE funciona como tu batería virtual gratuita
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      De noche, tu hogar toma la electricidad de la red de manera normal. Al final del bimestre, CFE descuenta todos los kWh que consumiste de noche contra todos los kWh que les inyectaste de día. Solo pagas el cargo mínimo obligatorio de conexión.
                    </p>
                  </div>
                  <div className="bg-slate-800/80 border border-emerald-500/20 rounded-xl p-4 text-center">
                    <span className="text-[11px] font-semibold text-slate-400 block">Tarifa Neta Final CFE:</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono block my-1">
                      ${Math.round(minFee).toLocaleString('es-MX')} MXN
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold block">✓ Cargo mínimo de conexión</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 2. DIAGRAMA DE FLUJO: TOPOLOGÍA DEL SISTEMA (Fondo Gris Medio para Alto Contraste) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-200/90 border border-slate-300 rounded-3xl p-6 sm:p-10 shadow-inner">
          
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#855f0a] bg-amber-200/60 border border-amber-400/40 px-3.5 py-1.5 rounded-full shadow-sm">
              Topología del Sistema
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-3">
              ¿Cómo Fluye la Energía en Tu Instalación?
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 max-w-xl mx-auto">
              Sinergia coordinada entre generación solar propia, consumo residencial y la red eléctrica pública.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            
            {/* Paso 1 */}
            <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-xs sm:text-base mb-2 sm:mb-3 shadow-inner">
                  1
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1 sm:gap-1.5 leading-tight">
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                  <span>Captación Solar</span>
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-1 sm:mt-2 leading-tight sm:leading-relaxed">
                  Módulos TOPCon captan la irradiancia y generan corriente directa (DC) de alta pureza.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-lg hover:border-cyan-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center font-black text-xs sm:text-base mb-2 sm:mb-3 shadow-inner">
                  2
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1 sm:gap-1.5 leading-tight">
                  <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 shrink-0" />
                  <span>Inversor Smart</span>
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-1 sm:mt-2 leading-tight sm:leading-relaxed">
                  Convierte la energía DC en Corriente Alterna (AC) 220V/120V con 98.4% de eficiencia.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-black text-xs sm:text-base mb-2 sm:mb-3 shadow-inner">
                  3
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1 sm:gap-1.5 leading-tight">
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                  <span>Prioridad al Hogar</span>
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-1 sm:mt-2 leading-tight sm:leading-relaxed">
                  Tus electrodomésticos consumen primero la energía solar propia a costo cero antes de red.
                </p>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-lg hover:border-slate-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-black text-xs sm:text-base mb-2 sm:mb-3 shadow-inner">
                  4
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1 sm:gap-1.5 leading-tight">
                  <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                  <span>Medidor CFE</span>
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-1 sm:mt-2 leading-tight sm:leading-relaxed">
                  El medidor bidireccional registra cada kWh exportado para bonificártelo en tu recibo.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
