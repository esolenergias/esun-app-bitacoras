import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Zap, Clock, ArrowRight } from 'lucide-react';

export function SolarCalculator() {
  const [bill, setBill] = useState(2500); // Initial monthly bill in MXN

  // 1. Calculate system metrics based on CFE billing rules in Mexico
  const metrics = useMemo(() => {
    const dacThreshold = 3000;
    const kwhRegular = 1.8; // MXN per kWh
    const kwhDac = 6.8;     // MXN per kWh (DAC rate)
    const panelYield = 70;  // Avg kWh output per 550W panel/month

    let estimatedKwh = 0;
    if (bill < dacThreshold) {
      estimatedKwh = bill / kwhRegular;
    } else {
      estimatedKwh = (dacThreshold / kwhRegular) + ((bill - dacThreshold) / kwhDac);
    }

    // Panels needed (min 2, max 60 for simulation)
    const panels = Math.max(2, Math.min(60, Math.ceil(estimatedKwh / panelYield)));
    
    // Solar saves ~95% of the CFE bill (leaving basic network fees)
    const monthlySavings = Math.round(bill * 0.95);
    
    // System cost calculation ($1.20 USD per Watt installed, 550W panels, $18.00 MXN/USD)
    const systemCostMxn = panels * 550 * 1.20 * 18;
    
    // Payback period in years
    const paybackYears = Number((systemCostMxn / (monthlySavings * 12)).toFixed(1));

    return {
      panels,
      monthlySavings,
      systemCostMxn,
      paybackYears
    };
  }, [bill]);

  // 2. Generate 10-year cumulative return projection data
  const projectionData = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const year = i + 1;
      const cumulativeSavings = (metrics.monthlySavings * 12 * year);
      const netReturn = cumulativeSavings - metrics.systemCostMxn;
      return {
        year,
        netReturn: Math.round(netReturn)
      };
    });
  }, [metrics]);

  const maxNetReturn = Math.max(...projectionData.map(d => Math.abs(d.netReturn)));

  // 3. Pre-fill WhatsApp message
  const whatsappUrl = useMemo(() => {
    const phone = '523114423836';
    const text = `Hola eSol! Coticé en su simulador. Mi recibo CFE es de $${bill} MXN. Me sugiere un sistema de ${metrics.panels} paneles de 550W, con un ahorro estimado de $${metrics.monthlySavings} MXN mensuales. Me interesa obtener un anteproyecto solar 3D gratuito.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [bill, metrics]);

  return (
    <section
      id="cotizar"
      className="relative py-28 px-6 lg:px-12 bg-dark-1 overflow-hidden"
    >
      {/* Background Topo */}
      <div className="absolute inset-0 topo-bg opacity-40 pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-gold/25 bg-gold-muted text-gold-light mb-4">
            Ahorro Inteligente
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-cream tracking-tight mb-6">
            Calcula tu Ahorro Solar
          </h2>
          <p className="font-body text-cream-muted leading-relaxed tracking-wide text-sm md:text-base">
            Arrastra el control deslizante para ajustar tu recibo de CFE y simular el rendimiento, costo y amortización de tu inversión solar de precisión.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Panel: Inputs & Core Metrics (Takes 5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-dark-4 bg-dark-2 p-8 flex flex-col justify-between gap-8 shadow-xl">
            
            {/* Slider Input */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-cream-muted">
                  Pago Mensual CFE
                </span>
                <span className="text-xl font-mono font-bold text-gold">
                  ${bill.toLocaleString('es-MX')} MXN
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="30000"
                step="500"
                value={bill}
                onChange={(e) => setBill(Number(e.target.value))}
                className="w-full h-1.5 bg-dark-3 rounded-lg appearance-none cursor-pointer accent-gold border border-dark-4"
              />
              <div className="flex justify-between text-[9px] uppercase tracking-wider text-cream-dim font-mono">
                <span>$500</span>
                <span>CFE Tarifa DAC &gt; $3,000</span>
                <span>$30,000</span>
              </div>
            </div>

            {/* Metrics List */}
            <div className="flex flex-col gap-5 border-t border-dark-4 pt-6">
              
              {/* Metric 1: Suggested Panels */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-cream-muted font-bold">
                    Paneles Sugeridos
                  </span>
                </div>
                <span className="text-xl font-mono font-bold text-cream">
                  {metrics.panels} <span className="text-[10px] text-cream-dim">módulos</span>
                </span>
              </div>

              {/* Metric 2: Monthly Savings */}
              <div className="flex justify-between items-center border-t border-dark-3/30 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-cream-muted font-bold">
                    Ahorro Mensual
                  </span>
                </div>
                <span className="text-xl font-mono font-bold text-gold">
                  ${metrics.monthlySavings.toLocaleString('es-MX')} <span className="text-[10px] text-gold/60">MXN</span>
                </span>
              </div>

              {/* Metric 3: Return Rate (Payback) */}
              <div className="flex justify-between items-center border-t border-dark-3/30 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-cream-muted font-bold">
                    Retorno Estimado
                  </span>
                </div>
                <span className="text-xl font-mono font-bold text-cream">
                  {metrics.paybackYears} <span className="text-[10px] text-cream-dim">años</span>
                </span>
              </div>

            </div>

            {/* Dynamic pay status text */}
            <div className="text-[11px] text-center leading-relaxed text-cream-muted bg-dark-3/50 rounded-xl px-4 py-3 border border-dark-4 select-none">
              El sistema solar se liquida solo en aproximadamente{' '}
              <span className="text-gold font-bold">{metrics.paybackYears} años</span>. 
              El resto de su vida útil (25+ años) es energía **100% gratuita**.
            </div>

          </div>

          {/* Right Panel: Interactive Graph & Return Visualizer (Takes 7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-dark-4 bg-dark-2 p-8 flex flex-col justify-between gap-6 shadow-xl">
            
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-black uppercase tracking-widest text-cream-muted">
                Retorno de Inversión Acumulado
              </span>
              <span className="text-[10px] text-cream-dim uppercase tracking-wider font-mono">
                Projection: 10 años (CFE vs Sistema Solar eSol)
              </span>
            </div>

            {/* Interactive SVG Bar Chart */}
            <div className="flex-1 min-h-[220px] flex items-end gap-1.5 md:gap-2.5 pt-4 overflow-visible">
              {projectionData.map((d) => {
                const isPaid = d.netReturn >= 0;
                // Height percentage calculation relative to max limit
                const heightPercent = Math.max(8, Math.min(100, (Math.abs(d.netReturn) / maxNetReturn) * 100));

                return (
                  <div key={d.year} className="flex-1 flex flex-col items-center justify-end h-full group/bar relative">
                    
                    {/* Hover tooltip showing net balance */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none select-none z-10 bg-dark-1 border border-gold rounded px-2 py-1 flex flex-col items-center shadow-2xl whitespace-nowrap">
                      <span className="text-[7px] uppercase tracking-wider text-cream-dim">Año {d.year}</span>
                      <span className={`text-[10px] font-mono font-bold ${isPaid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {d.netReturn >= 0 ? '+' : ''}${d.netReturn.toLocaleString('es-MX')}
                      </span>
                    </div>

                    {/* The Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                      className={`w-full rounded-t-md border-t transition-all duration-300 ${
                        isPaid
                          ? 'bg-gradient-to-t from-gold-light/20 to-gold/45 border-gold shadow-[0_0_12px_rgba(196,152,37,0.15)]'
                          : 'bg-gradient-to-t from-red-500/10 to-red-500/25 border-red-500/40'
                      }`}
                    />

                    {/* X-Axis Label */}
                    <span className="text-[9px] font-mono font-bold text-cream-dim mt-2 select-none">
                      {d.year}a
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend and WhatsApp Call-To-Action */}
            <div className="flex flex-col gap-6 border-t border-dark-4 pt-6">
              
              {/* Legends */}
              <div className="flex gap-6 justify-center text-[10px] uppercase font-bold tracking-widest text-cream-dim select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40" />
                  Amortización
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-gold/30 border border-gold" />
                  Retorno Neto Positivo
                </div>
              </div>

              {/* Call-to-Action Link */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-4 rounded-xl font-black uppercase tracking-widest bg-gradient-to-r from-gold to-gold-light text-dark-1 text-xs shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                Solicitar Propuesta con mi Ahorro
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
