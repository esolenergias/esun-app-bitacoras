import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Sparkles, Zap, ShieldCheck, DollarSign, TrendingUp,
  Sun, Leaf, CheckCircle2, Award, Trees, Car, Factory,
  Sliders, Layers, FileText, ChevronDown, Check, ArrowUpRight,
  Maximize2, Eye, Compass, Cpu, HelpCircle, Activity, Battery, BatteryCharging
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Cell, LineChart, Line, Legend
} from 'recharts';
import type { SolarProject, Proposal } from './esunTypes';
import { calculateCFEMinimumFee } from './lib/financialEngine';
import { getSeasonalSolarMultiplier } from './lib/solarConstants';
import OffGridAnimatedDiagram from './OffGridAnimatedDiagram';
import GridTiedAnimatedDiagram from './GridTiedAnimatedDiagram';
import AnteproyectoPresentationSection from './AnteproyectoPresentationSection';
import CronogramaPresentationSection from './CronogramaPresentationSection';

interface InteractivePresentationModalProps {
  project: SolarProject;
  proposal: Proposal;
  onClose: () => void;
  isClientView?: boolean;
  onShare?: (method: 'whatsapp' | 'copy') => void;
  onChangeCronogramaParams?: (params: any) => void;
}

// Custom hook for smooth scroll reveal
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Smooth animated number component
function AnimatedNumber({ 
  value, 
  suffix = '', 
  prefix = '', 
  decimals = 0, 
  duration = 1800,
  startValue = 0,
  easingType = 'default'
}: { 
  value: number; 
  suffix?: string; 
  prefix?: string; 
  decimals?: number; 
  duration?: number;
  startValue?: number;
  easingType?: 'default' | 'dramatic';
}) {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [displayValue, setDisplayValue] = useState(startValue);

  useEffect(() => {
    if (!isVisible || value === undefined || value === null || isNaN(value)) return;
    
    let startTime: number;
    let animationFrameId: number;
    
    const range = value - startValue;

    const updateNumber = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      let easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      if (easingType === 'dramatic') {
        // Extremely dramatic curve: starts very fast, crawls incredibly slow for a long time at the end
        easeProgress = 1 - Math.pow(1 - progress, 6); 
      }
      
      setDisplayValue(startValue + range * easeProgress);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(value);
      }
    };
    
    animationFrameId = requestAnimationFrame(updateNumber);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible, value, duration, startValue, easingType]);

  const numToFormat = isNaN(displayValue) || displayValue === undefined || displayValue === null ? 0 : displayValue;
  const formatted = numToFormat.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

// GoldenShaderBackground (Flowing liquid gold lines from mrmeny)
function LightweightHeroLines({ scrollY, opacity, isOffGrid }: { scrollY: number, opacity?: number, isOffGrid?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(scrollY);
  const velocityRef = useRef(0);

  useEffect(() => {
    const diff = Math.abs(scrollY - scrollRef.current);
    velocityRef.current = Math.min(20, velocityRef.current + diff * 0.05);
    scrollRef.current = scrollY;
  }, [scrollY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Flowing liquid gold particle lines configuration across 3 parallax planes
    const waves: {
      y: number;
      length: number;
      amplitude: number;
      frequency: number;
      speed: number;
      color: string;
      phase: number;
      lineWidth: number;
      plane: 1 | 2 | 3;
    }[] = [];

    const getGoldColor = (plane: 1 | 2 | 3, index: number) => {
      const opacities = { 
        1: [1.00, 0.95, 0.90, 0.95, 0.85], 
        2: [0.85, 0.80, 0.75, 0.80, 0.70], 
        3: [0.70, 0.65, 0.60, 0.65, 0.55] 
      };
      
      const colorsList = [
        '196, 152, 37',  // ESOL primary gold
        '254, 225, 128', // ESOL light gold
        '218, 165, 32',  // Goldenrod
        '255, 215, 0',   // Bright Gold
        '184, 134, 11',  // Dark Goldenrod
      ];
          
      const rgb = colorsList[index % colorsList.length];
      const opacity = opacities[plane][index % opacities[plane].length];
      return `rgba(${rgb}, ${opacity})`;
    };

    // Plane 3 (Background) - shifted high up, thin, smooth, and slow
    const plane3Count = 3;
    for (let i = 0; i < plane3Count; i++) {
      waves.push({
        y: height * 0.28 + (i - plane3Count / 2) * 40,
        length: 0.0005 + Math.random() * 0.001,
        amplitude: 15 + Math.random() * 15,
        frequency: 0.001 + Math.random() * 0.001,
        speed: 0.0008 + Math.random() * 0.001,
        color: getGoldColor(3, i),
        phase: Math.random() * Math.PI * 2,
        lineWidth: 1.5 + Math.random() * 1.0,
        plane: 3
      });
    }

    // Plane 2 (Midground) - middle height, medium thickness and speed
    const plane2Count = 3;
    for (let i = 0; i < plane2Count; i++) {
      waves.push({
        y: height * 0.46 + (i - plane2Count / 2) * 45,
        length: 0.0008 + Math.random() * 0.0012,
        amplitude: 25 + Math.random() * 25,
        frequency: 0.001 + Math.random() * 0.0015,
        speed: 0.0015 + Math.random() * 0.002,
        color: getGoldColor(2, i),
        phase: Math.random() * Math.PI * 2,
        lineWidth: 2.5 + Math.random() * 1.5,
        plane: 2
      });
    }

    // Plane 1 (Foreground) - lower height, thick, dynamic, and fast
    const plane1Count = 4;
    for (let i = 0; i < plane1Count; i++) {
      waves.push({
        y: height * 0.65 + (i - plane1Count / 2) * 50,
        length: 0.001 + Math.random() * 0.002,
        amplitude: 40 + Math.random() * 50,
        frequency: 0.001 + Math.random() * 0.002,
        speed: 0.002 + Math.random() * 0.003,
        color: getGoldColor(1, i),
        phase: Math.random() * Math.PI * 2,
        lineWidth: 3.5 + Math.random() * 2.0,
        plane: 1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      velocityRef.current *= 0.95;
      const velocity = velocityRef.current;

      // Draw each fluid wave line
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;

        // Add premium gold glow shadow
        ctx.shadowColor = wave.plane === 1
          ? 'rgba(255, 215, 0, 1.0)'
          : wave.plane === 2
          ? 'rgba(218, 165, 32, 0.9)'
          : 'rgba(196, 152, 37, 0.6)';
        ctx.shadowBlur = wave.plane === 1 ? 20 : wave.plane === 2 ? 12 : 6;

        // Parallax scroll reaction (reduced by 70%)
        const scrollFactor = wave.plane === 1 ? 1.0 : wave.plane === 2 ? 0.6 : 0.3;
        const reducedVelocity = velocity * 0.3;
        const currentSpeed = wave.speed * (1 + reducedVelocity * 1.5 * scrollFactor);
        const currentAmplitude = wave.amplitude * (1 + reducedVelocity * 0.5 * scrollFactor);
        
        for (let x = 0; x < width; x++) {
          // Double sine wave equation for complex liquid look
          const yVal = 
            wave.y +
            Math.sin(x * wave.length + wave.phase) * currentAmplitude * Math.sin(wave.phase * 0.3) +
            Math.cos(x * 0.003 - wave.phase * 0.7) * (currentAmplitude * 0.3);
            
          if (x === 0) {
            ctx.moveTo(x, yVal);
          } else {
            ctx.lineTo(x, yVal);
          }
        }
        ctx.stroke();
        
        // Metallic inner highlight
        if (wave.plane === 1 || wave.plane === 2) {
          ctx.lineWidth = wave.lineWidth * 0.3;
          ctx.strokeStyle = `rgba(255, 250, 220, ${wave.plane === 1 ? 0.9 : 0.5})`;
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
        
        wave.phase += currentSpeed;
        wave.y += Math.sin(wave.phase * 0.1) * 0.1 * scrollFactor;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Fade opacity from 0.5 at top to 0 at 800px scroll (or use custom opacity)
  const defaultOpacity = Math.max(0, 0.5 * (1 - scrollY / 800));
  const dynamicOpacity = opacity !== undefined ? opacity : defaultOpacity;

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${isOffGrid ? '' : 'mix-blend-multiply'}`}
      style={{ opacity: dynamicOpacity }}
    />
  );
}

export default function InteractivePresentationModal({
  project,
  proposal,
  onClose,
  isClientView,
  onShare,
  onChangeCronogramaParams
}: InteractivePresentationModalProps) {
  const [copied, setCopied] = useState(false);
  const { system, financial, environmental } = proposal;
  const isOffGrid = project.project_type === 'off-grid';
  const cfe = project.cfe_data || {
    tariff: '1',
    is_bimonthly: true,
    tariff_rate: 0,
    demand_kw: 0,
    monthly_kWh: 0,
    bimonthly_kWh: 0,
    total_mxn: 0,
    historic_periods: []
  };

  // State for interactive financial simulator
  const [inflationRate, setInflationRate] = useState<number>(7.5);
  const [simulationHorizon, setSimulationHorizon] = useState<number>(25);

  // Basic calculations
  const minFee = calculateCFEMinimumFee({
    tariff_name: cfe.tariff,
    is_bimonthly: cfe.is_bimonthly,
    tariff_rate_mxn: cfe.tariff_rate,
    demand_kw: cfe.demand_kw
  });

  const annualCons = cfe.monthly_kWh * 12;
  const coveragePct = system.system_kWp > 0 ? (system.installed_kWp / system.system_kWp) * 100 : 0;
  const yr1Savings = financial.annual_savings_yr1 || 0;
  const monthlySavings = financial.monthly_savings_yr1 || Math.round(yr1Savings / 12);
  const totalInvestment = financial.investment_mxn || 0;

  // Historic Periods Table Data processing
  const enrichedHistoricPeriods = React.useMemo(() => {
    if (!cfe.historic_periods || cfe.historic_periods.length === 0) return [];
    // Original array usually goes from newest to oldest
    const reversed = [...cfe.historic_periods].reverse(); 
    let runningTotal = 0;
    const enriched = reversed.map(p => {
      const ahorro = Math.max(0, p.amount - minFee);
      runningTotal += ahorro;
      return { ...p, ahorro, acumulado: runningTotal };
    });
    // Return back to newest first for display
    return enriched.reverse();
  }, [cfe.historic_periods, minFee]);

  // Dynamic simulation data calculation
  const dynamicSimulationData = Array.from({ length: simulationHorizon }, (_, i) => {
    const yr = i + 1;
    const minFeeAnnual = Math.round(minFee * (cfe.is_bimonthly ? 6 : 12));
    
    const tariffEscalation = Math.pow(1 + inflationRate / 100, yr - 1);
    const degradation = Math.pow(0.995, yr - 1);
    
    // Exact match with financial model: yr1Savings is the avoided cost
    // Baseline CFE cost = Savings + MinFee
    const cfeCostNoSolar = Math.round((yr1Savings + minFeeAnnual) * tariffEscalation);
    // Cost with solar = MinFee + Lost savings due to degradation
    const cfeCostWithSolar = Math.round(minFeeAnnual * tariffEscalation + yr1Savings * tariffEscalation * (1 - degradation));
    const annualNetSavings = cfeCostNoSolar - cfeCostWithSolar; // This will equal yr1Savings * esc * deg

    let cumNoSolar = 0;
    let cumWithSolar = 0;
    for (let j = 1; j <= yr; j++) {
      const esc = Math.pow(1 + inflationRate / 100, j - 1);
      const deg = Math.pow(0.995, j - 1);
      
      const noSol = (yr1Savings + minFeeAnnual) * esc;
      const withSol = (minFeeAnnual * esc) + (yr1Savings * esc * (1 - deg));
      
      cumNoSolar += noSol;
      cumWithSolar += withSol;
    }
    const cumulativeSavings = Math.round(cumNoSolar - cumWithSolar);

    return {
      year: `Año ${yr}`,
      yr,
      cfeNoSolar: cfeCostNoSolar,
      cfeWithSolar: cfeCostWithSolar,
      annualSavings: annualNetSavings,
      cumulativeSavings
    };
  });

  const totalSimulatedSavings = dynamicSimulationData[dynamicSimulationData.length - 1]?.cumulativeSavings || 0;
  const netROI = totalInvestment > 0 ? Math.round(((totalSimulatedSavings - totalInvestment) / totalInvestment) * 100) : 0;

  const fixed25YrSavings = React.useMemo(() => {
    let cumNoSolar = 0;
    let cumWithSolar = 0;
    const minFeeAnnual = Math.round(minFee * (cfe.is_bimonthly ? 6 : 12));
    for (let j = 1; j <= 25; j++) {
      const esc = Math.pow(1 + inflationRate / 100, j - 1);
      const deg = Math.pow(0.995, j - 1);
      cumNoSolar += (yr1Savings + minFeeAnnual) * esc;
      cumWithSolar += (minFeeAnnual * esc) + (yr1Savings * esc * (1 - deg));
    }
    return Math.round(cumNoSolar - cumWithSolar);
  }, [yr1Savings, minFee, cfe.is_bimonthly, inflationRate]);
  
  const fixed25YrRoi = totalInvestment > 0 ? ((fixed25YrSavings - totalInvestment) / totalInvestment) * 100 : 0;
  const displayPayback = financial.payback_years || (totalInvestment > 0 && yr1Savings > 0 ? (totalInvestment / yr1Savings).toFixed(1) : "0");

  // Section reveals
  const heroReveal = useScrollReveal(0.15);
  const cfeReveal = useScrollReveal(0.15);
  const techReveal = useScrollReveal(0.15);
  const specsReveal = useScrollReveal(0.15);
  const calcReveal = useScrollReveal(0.15);
  const envReveal = useScrollReveal(0.15);
  const ctaReveal = useScrollReveal(0.15);

  // Mouse position state for interactive gold lines shader
  const [heroMousePos, setHeroMousePos] = useState({ x: -1, y: -1 });

  // Parallax Scroll Tracking Engine
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const techCardsRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(container.scrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate dynamic parallax offset based on actual screen position of the 2 hardware cards
  let techOffset = 0;
  let specsSectionOpacity = 0;
  
  if (techCardsRef.current) {
    const rect = techCardsRef.current.getBoundingClientRect();
    const elementCenterY = rect.top + rect.height / 2;
    const windowCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 500;
    
    // Calculate how far the center of the cards is from the center of the screen
    const distFromCenter = Math.abs(elementCenterY - windowCenterY);
    
    // Create a 200px "dead zone" where cards stay perfectly centered (techOffset = 0), then smoothly slide in/out
    techOffset = Math.min(250, Math.max(0, distFromCenter - 200) * 0.6);
  } else if (techReveal.ref.current) {
    const rect = techReveal.ref.current.getBoundingClientRect();
    const elementCenterY = rect.top + Math.min(rect.height / 2, 250);
    const windowCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 500;
    const distFromCenter = Math.abs(elementCenterY - windowCenterY);
    techOffset = Math.min(250, Math.max(0, distFromCenter - 200) * 0.6);
  }
  
  if (specsReveal.ref.current) {
    const rect = specsReveal.ref.current.getBoundingClientRect();
    const elementCenterY = rect.top + rect.height / 2;
    const windowCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 500;
    const distFromCenter = Math.abs(elementCenterY - windowCenterY);
    // Specs section bg opacity peaks at max when centered
    specsSectionOpacity = Math.max(0, (isOffGrid ? 0.2 : 0.5) * (1 - distFromCenter / 700));
  }
  
  const heroOpacity = Math.max(0, (isOffGrid ? 0.2 : 0.5) * (1 - scrollY / 800));
  const dynamicCanvasOpacity = Math.min(isOffGrid ? 0.2 : 0.5, heroOpacity + specsSectionOpacity);

  return createPortal(
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-[999999] bg-[#e2e8f0] overflow-y-auto scroll-smooth text-slate-800 font-sans selection:bg-[#C49825]/30 selection:text-slate-900" 
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      
      {/* CSS Animation Keyframes for Metallic Shimmer, Marquee & Minimal Shader Effects */}
      <style>{`
        @keyframes metallicGoldShimmer {
          0% { background-position: -50% center; }
          100% { background-position: 250% center; }
        }
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes minimalShaderMesh {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          50% { transform: translate(-3%, 3%) scale(1.06) rotate(1deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes trustGlowPulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.04); }
        }
      `}</style>

      {/* --- PERMANENT FLOATING ACTION BUTTONS (BOTTOM LEFT) --- */}
      <div className="fixed bottom-6 left-6 z-[10000] flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-3.5 bg-slate-900/80 hover:bg-slate-900 text-white hover:text-[#C49825] border border-slate-700/80 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all group flex items-center justify-center transform hover:scale-110 cursor-pointer"
          title="Cerrar presentación"
        >
          <X className="w-6 h-6 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90 text-[#F5F0E8]" />
        </button>

        {!isClientView && (
          <button
            onClick={() => {
              if (onShare) {
                onShare('whatsapp');
              } else {
                const url = `${window.location.origin}/?esun_propuesta=${project.id}_${proposal.id}`;
                const text = `Hola ${project.client_name}, te comparto la Propuesta Técnica y Financiera de tu sistema de paneles solares diseñada por ESOL Energías:\n\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }
            }}
            className="p-3.5 bg-[#25D366]/90 hover:bg-[#25D366] text-white border border-[#25D366]/80 rounded-full shadow-[0_12px_40px_rgba(37,211,102,0.35)] backdrop-blur-xl transition-all group flex items-center justify-center transform hover:scale-110 cursor-pointer"
            title="Compartir por WhatsApp"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.662-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </button>
        )}

        {!isClientView && (
          <button
            onClick={() => {
              if (onShare) {
                onShare('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } else {
                try {
                  const url = `${window.location.origin}/?esun_propuesta=${project.id}_${proposal.id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }).catch(() => {});
                } catch (err) {}
              }
            }}
            className="h-14 px-3.5 bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all group flex items-center justify-center transform hover:scale-110 cursor-pointer"
            title="Copiar enlace"
          >
            {copied ? (
              <span className="text-xs font-bold px-3">¡Copiado!</span>
            ) : (
              <svg className="w-6 h-6 stroke-[2] text-[#F5F0E8] group-hover:text-[#C49825] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            )}
          </button>
        )}
      </div>

      {/* --- MAIN FULL-SCREEN CONTAINER --- */}
      <div 
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHeroMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        className={`w-full min-h-screen ${isOffGrid ? 'bg-[#dae2ed] text-slate-800' : 'bg-[#fdfbf7] text-slate-800'} relative z-10 overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] mb-[450px] sm:mb-[380px]`}
      >
        <LightweightHeroLines scrollY={scrollY} opacity={dynamicCanvasOpacity} isOffGrid={isOffGrid} />

        {/* --- CORRUGATED PAPER TEXTURE OVERLAY BEHIND TEXT CONTENT --- */}
        {!isOffGrid && (
          <>
            <div 
              className="absolute inset-0 pointer-events-none z-0 opacity-35 mix-blend-multiply"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    90deg,
                    rgba(0, 0, 0, 0.05) 0px,
                    rgba(0, 0, 0, 0.05) 2px,
                    transparent 2px,
                    transparent 4px,
                    rgba(255, 255, 255, 0.75) 4px,
                    rgba(255, 255, 255, 0.75) 6px,
                    transparent 6px,
                    transparent 8px
                  )
                `
              }}
            ></div>
            <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_0.75px,transparent_0.75px)] [background-size:14px_14px] opacity-20"></div>
            <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_0.75px,transparent_0.75px)] [background-size:14px_14px] opacity-25"></div>
          </>
        )}

        {/* --- HEADER INSIDE LETTER BOX --- */}
        <header className="relative z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-[#C49825]/40 px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/Logo_esol_w.png" alt="ESOL Energías" className="h-8 w-auto object-contain" />
            <div className="hidden sm:block h-5 w-px bg-slate-700"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-white truncate max-w-[280px]">{project.client_name}</span>
              <span className="text-[10px] text-[#C49825] tracking-wider uppercase font-semibold">Propuesta Ejecutiva Fotovoltaica</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1 bg-[#C49825]/20 border border-[#C49825]/40 rounded-full text-xs text-[#FEE180] font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{isOffGrid ? '100% Autonomía Energética' : `Cobertura ${coveragePct.toFixed(1)}% CFE`}</span>
            </div>
          </div>
        </header>

        {/* --- INNER CONTENT SECTIONS --- */}
        <div className="relative z-10 max-w-[1000px] mx-auto px-6 sm:px-12 py-10 space-y-16 sm:space-y-24">

          {/* 1. HERO SECTION WITH LIGHTWEIGHT CANVAS ANIMATION & PARALLAX */}
          <section className="py-4 sm:py-8 relative">
            
            <div 
              ref={heroReveal.ref}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHeroMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              style={{
                transform: `translateY(${Math.min(45, scrollY * 0.08)}px)`,
                transition: 'transform 0.1s ease-out'
              }}
              className={`max-w-3xl mx-auto py-12 px-4 relative text-center transition-opacity duration-1000 ${
                heroReveal.isVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="relative z-10 space-y-6">
                {/* Top Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#997015]/10 border border-[#997015]/30 rounded-full text-[#997015] text-xs font-bold uppercase tracking-widest shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-[#997015]" />
                  <span>Propuesta Técnica & Financiera Certificada</span>
                </div>

                {/* Main Headline - Line 1: Single Line / Line 2: Client Name Centered */}
                <div className="flex flex-col items-center justify-center">
                  <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap text-center mb-6">
                    Genera tu propia energía limpia
                  </h1>
                  <div className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-center mb-10">
                    <span className="text-transparent bg-clip-text bg-[linear-gradient(110deg,#997015_30%,#FEE180_50%,#997015_70%)] bg-[length:250%_100%] animate-[metallicGoldShimmer_30s_linear_infinite]">
                      {project.client_name}
                    </span>
                  </div>
                </div>

                {/* Highlighted Subtitle & Trust Badges Box */}
                <div className="w-[100vw] relative left-1/2 -translate-x-1/2 bg-slate-900/[0.02] backdrop-blur-sm border-y border-slate-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.04)] py-6 sm:py-8 mt-12">
                  <div className="max-w-[1000px] mx-auto px-6 sm:px-12 space-y-6">
                    <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed text-center max-w-3xl mx-auto">
                      <strong className="text-slate-900">{proposal.name}</strong> — Un sistema fotovoltaico diseñado bajo normas NOM-001-SEDE para {isOffGrid ? 'brindar autonomía energética total sin depender de CFE' : 'eliminar hasta el 99% de tu gasto CFE con total certidumbre financiera'}.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 text-[11px] sm:text-xs font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ingeniería de Alta Precisión
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-700">
                        <Award className="w-4 h-4 text-amber-600" /> Garantía 25 Años
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#997015]/10 rounded-xl border border-[#997015]/20 text-[#997015]">
                        <Zap className="w-4 h-4 text-[#997015]" /> Interconexión CFE Incluida
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. DIAGNÓSTICO CFE / PERFIL ENERGÉTICO */}
          {!isOffGrid ? (
          <section>
            <div 
              ref={cfeReveal.ref}
              className={`transition-all duration-1000 transform ${
                cfeReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-center mb-10">
                <div className="mb-4">
                  <span className="px-4 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                    Diagnóstico Energético
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  ¿Dónde estás hoy vs Dónde estarás con ESOL?
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* BEFORE */}
                <div className="p-6 bg-white border border-red-200 rounded-2xl shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                    Escenario Actual CFE
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Facturación CFE</h3>
                      <p className="text-xs text-slate-500">Tarifa {cfe.tariff}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-baseline pb-2 border-b border-slate-100 text-xs">
                      <span className="text-slate-500">Consumo periodo</span>
                      <span className="font-bold text-slate-800">{cfe.bimonthly_kWh.toLocaleString()} kWh</span>
                    </div>
                    <div className="flex justify-between items-baseline pb-2 border-b border-slate-100 text-xs">
                      <span className="text-slate-500">Costo ref. kWh</span>
                      <span className="font-bold text-red-600">${cfe.tariff_rate.toFixed(2)} MXN</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-[11px] text-red-600 uppercase font-bold tracking-wider">Pago Promedio Actual</span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-red-600 font-mono mt-0.5">
                        <AnimatedNumber value={cfe.total_mxn || 0} prefix="$" suffix=" MXN" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AFTER */}
                <div className="p-6 bg-white border border-emerald-300 rounded-2xl shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                    Con Sistema ESOL
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Nuevo Recibo Mínimo</h3>
                      <p className="text-xs text-emerald-600">Generación limpia en sitio</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-baseline pb-2 border-b border-slate-100 text-xs">
                      <span className="text-slate-500">Generación solar</span>
                      <span className="font-bold text-emerald-600">{(system.annual_production_kWh / (cfe.is_bimonthly ? 6 : 12)).toFixed(0)} kWh/periodo</span>
                    </div>
                    <div className="flex justify-between items-baseline pb-2 border-b border-slate-100 text-xs">
                      <span className="text-slate-500">Ahorro del periodo</span>
                      <span className="font-bold text-emerald-600"><AnimatedNumber value={Math.max(0, (cfe.total_mxn || 0) - minFee)} prefix="$" suffix=" MXN" /></span>
                    </div>
                    <div className="pt-1">
                      <span className="text-[11px] text-emerald-600 uppercase font-bold tracking-wider">Nuevo Pago Mínimo CFE</span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-0.5">
                        <AnimatedNumber value={minFee} prefix="$" suffix=" MXN" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historic Table Cascading */}
              {enrichedHistoricPeriods.length > 0 && (
                <div className="mt-12 mb-8 space-y-4 max-w-5xl mx-auto">
                  <h3 className="text-sm font-bold text-slate-800 text-center mb-6">Tabla de Comparativa Histórica CFE (Último Año)</h3>
                  
                  {/* Fully Responsive 6-Column Container */}
                  <div className="w-full">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 p-2 sm:p-4 bg-slate-800 rounded-t-xl text-[8px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-tighter sm:tracking-wider items-center shadow-md gap-1 sm:gap-4">
                      <div className="col-span-1 pl-1 sm:pl-2">Periodo</div>
                      <div className="text-right col-span-1">Consumo</div>
                      <div className="text-right col-span-1">CFE</div>
                      <div className="text-right col-span-1 text-emerald-400">ESOL</div>
                      <div className="text-right col-span-1 text-emerald-400 flex justify-end items-center gap-0.5 sm:gap-1">
                        <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 hidden sm:block"/> Ahorro
                      </div>
                      <div className="text-right col-span-1 text-[#FEE180]">Acum.</div>
                    </div>
                    
                    {/* Table Body */}
                    <div className="flex flex-col gap-1.5 sm:gap-3 mt-1.5 sm:mt-3">
                      {enrichedHistoricPeriods.map((period, idx) => (
                        <div 
                          key={idx} 
                          className={`group relative bg-white border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-sm hover:shadow-lg hover:border-emerald-200 hover:scale-[1.01] transition-all duration-300 transform ${
                            cfeReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                          }`}
                          style={{ transitionDelay: `${idx * 100}ms` }}
                        >
                          <div className="grid grid-cols-6 items-center text-[9px] sm:text-sm gap-1 sm:gap-4">
                            <div className="font-bold text-slate-700 pl-1 sm:pl-2 leading-tight whitespace-pre-line">{period.period.replace(' - ', '\n')}</div>
                            <div className="text-right text-slate-500 font-medium">{period.kwh.toLocaleString()} <span className="hidden sm:inline">kWh</span></div>
                            <div className="text-right font-bold text-red-500">${period.amount.toLocaleString('es-MX')}</div>
                            <div className="text-right font-bold text-emerald-600">${minFee.toLocaleString('es-MX')}</div>
                            <div className="text-right font-black text-emerald-500">+${period.ahorro.toLocaleString('es-MX')}</div>
                            <div className="text-right">
                              <span className="inline-block px-1.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded sm:rounded-lg border border-emerald-200 shadow-sm">
                                ${period.acumulado.toLocaleString('es-MX')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Line Chart */}
              {cfe.historic_periods && cfe.historic_periods.length > 0 && (() => {
                const basePeriodGenKwh = (proposal.system?.annual_production_kWh || 0) / (cfe.is_bimonthly ? 6 : 12);
                
                const chartData = [...cfe.historic_periods].reverse().map((p, idx) => {
                  const periodStr = p.period || '';
                  const seasonalMultiplier = getSeasonalSolarMultiplier(periodStr, idx);
                  const genKwh = Math.round(basePeriodGenKwh * seasonalMultiplier);
                  const genValorMxn = Math.round(genKwh * (cfe.tariff_rate || 4.5));

                  return {
                    name: periodStr,
                    'Gasto CFE': p.amount,
                    'Generación Solar': genValorMxn,
                    'Pago ESOL': minFee,
                    genKwh,
                    kwhConsumo: p.kwh
                  };
                });

                return (
                  <div className="mt-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-md h-88">
                    <h3 className="text-sm font-bold text-slate-800 text-center mb-6">Proyección Comparativa de Pagos Históricos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} minTickGap={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `$${val.toLocaleString('es-MX')}`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600, fontSize: '13px' }}
                          formatter={(value: number, name: string, props: any) => {
                            if (name === 'Generación Solar') {
                              const kwh = props?.payload?.genKwh;
                              return [`$${value.toLocaleString('es-MX')} MXN (${kwh ? kwh.toLocaleString() + ' kWh' : ''})`, name];
                            }
                            if (name === 'Gasto CFE') {
                              const kwh = props?.payload?.kwhConsumo;
                              return [`$${value.toLocaleString('es-MX')} MXN (${kwh ? kwh.toLocaleString() + ' kWh' : ''})`, name];
                            }
                            return [`$${value.toLocaleString('es-MX')} MXN`, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="Gasto CFE" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Generación Solar" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Pago ESOL" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

            </div>
          </section>
          ) : (
          <section>
            <div 
              ref={cfeReveal.ref}
              className={`transition-all duration-1000 transform ${
                cfeReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-center mb-10">
                <div className="mb-4">
                  <span className="px-4 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                    Perfil Energético Aislado
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Demanda de Energía Diaria
                </h2>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 shadow-xl">
                <div className="w-full">
                  <table className="w-full text-[10px] sm:text-sm text-left table-fixed">
                    <thead className="text-[9px] sm:text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="w-[36%] px-2 sm:px-4 py-2 sm:py-3 rounded-tl-lg">Aparato</th>
                        <th className="w-[14%] px-1 sm:px-3 py-2 sm:py-3 text-center">Cant.</th>
                        <th className="w-[16%] px-1 sm:px-3 py-2 sm:py-3 text-right">Potencia</th>
                        <th className="w-[16%] px-1 sm:px-3 py-2 sm:py-3 text-right">Uso/Día</th>
                        <th className="w-[18%] px-1.5 sm:px-4 py-2 sm:py-3 text-right rounded-tr-lg">kWh/Día</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(project.load_profile?.appliances || []).map((d: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-slate-800 truncate" title={d.name}>
                            {d.name}
                          </td>
                          <td className="px-1 sm:px-3 py-2 sm:py-3 text-center text-slate-600 font-medium">
                            {d.quantity}
                          </td>
                          <td className="px-1 sm:px-3 py-2 sm:py-3 text-right text-slate-500 font-mono text-[10px] sm:text-xs">
                            {d.watts}W
                          </td>
                          <td className="px-1 sm:px-3 py-2 sm:py-3 text-right text-slate-500 font-mono text-[10px] sm:text-xs">
                            {d.hoursPerDay}h
                          </td>
                          <td className="px-1.5 sm:px-4 py-2 sm:py-3 text-right font-bold text-amber-600 font-mono text-[10px] sm:text-sm">
                            {((d.quantity * d.watts * d.hoursPerDay * (d.daysPerWeek / 7)) / 1000).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 border-t border-slate-200">
                        <td colSpan={4} className="px-2 sm:px-4 py-2.5 sm:py-4 text-right rounded-bl-lg font-bold text-slate-600 uppercase text-[9px] sm:text-xs tracking-wider">
                          Consumo Total Estimado
                        </td>
                        <td className="px-1.5 sm:px-4 py-2.5 sm:py-4 text-right rounded-br-lg font-black text-xs sm:text-lg text-red-500 font-mono whitespace-nowrap">
                          {((project.load_profile?.daily_Wh || 0) / 1000).toFixed(2)} <span className="text-[9px] sm:text-sm font-bold text-red-400">kWh</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* 3. SHOWCASE TECNOLÓGICO */}
          <section>
            <div 
              ref={techReveal.ref}
              className={`transition-all duration-1000 transform ${
                techReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-center mb-6">
                <span className="px-3 py-1 bg-[#C49825]/15 border border-[#C49825]/30 text-[#997015] text-xs font-bold uppercase tracking-wider rounded-full">
                  Ingeniería & Calidad de Componentes
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  Especificaciones de Clase Mundial
                </h2>
              </div>

              {/* Card Showcase */}
              {!isOffGrid ? (
                <>
                  <div ref={techCardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    
                    {/* Panel Image */}
                    <div 
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col hover:shadow-xl transition-all duration-500 ease-out"
                      style={{ transform: `translateX(-${techOffset}px)` }}
                    >
                      <div className="mb-4 text-center sm:text-left">
                        <span className="text-xs font-bold text-[#997015] uppercase tracking-wider block">
                          Tecnología Fotovoltaica
                        </span>
                        <h3 className="text-base font-bold text-slate-800 mt-1">
                          Módulos de Alta Eficiencia
                        </h3>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-slate-50 flex-1 flex items-center justify-center">
                        <img
                          src="/crosssection_panel.png"
                          alt="Corte transversal del panel fotovoltaico"
                          className="w-full h-auto object-cover max-h-[350px] transition-transform duration-700 hover:scale-105"
                        />
                      </div>
                    </div>

                    {/* Growatt Inverter Image */}
                    <div 
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col hover:shadow-xl transition-all duration-500 ease-out"
                      style={{ transform: `translateX(${techOffset}px)` }}
                    >
                      <div className="mb-4 text-center sm:text-left">
                        <span className="text-xs font-bold text-[#997015] uppercase tracking-wider block">
                          Inversores de Interconexión
                        </span>
                        <h3 className="text-base font-bold text-slate-800 mt-1">
                          Arquitectura Interna y Componentes
                        </h3>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-slate-50 flex-1 flex items-center justify-center">
                        <img
                          src="/crosssection_growatt.jpg"
                          alt="Corte transversal del inversor Growatt"
                          className="w-full h-auto object-cover max-h-[350px] transition-transform duration-700 hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Corte Arquitectónico y Dinámica Energética Interconectada a CFE */}
                  <GridTiedAnimatedDiagram project={project} proposal={proposal} />
                </>
              ) : (
                <OffGridAnimatedDiagram />
              )}
            </div>
          </section>

          {/* 4. ANTEPROYECTO & LÁMINAS TÉCNICAS (Sólo se renderiza si hay imágenes cargadas, regla de cero espacios en blanco) */}
          <AnteproyectoPresentationSection
            images={proposal.anteproyecto_images || []}
            clientName={project.client_name}
            isUnlocked={proposal.anteproyecto_unlocked}
            isAdmin={!isClientView}
          />

          {/* 5. PLAN DE EJECUCIÓN Y CRONOGRAMA DE OBRA (Cálculo automático de ruta crítica) */}
          <CronogramaPresentationSection
            numPanels={system.num_panels || Math.ceil((system.installed_kWp || 5) / 0.55)}
            startDate={proposal.created_at || project.created_at}
            isOffGrid={isOffGrid}
            tariff={cfe.tariff}
            cronogramaParams={proposal.cronograma_params}
            onChangeCronogramaParams={onChangeCronogramaParams}
            isAdmin={!isClientView}
          />

          {/* 6. ESPECIFICACIONES DEL SISTEMA */}
          <section className="w-[100vw] relative left-1/2 -translate-x-1/2 bg-slate-900/[0.02] backdrop-blur-sm border-y border-slate-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.04)] py-12 sm:py-16 my-12 z-0">
            <div 
              ref={specsReveal.ref}
              className={`max-w-[1000px] mx-auto px-6 sm:px-12 transition-all duration-1000 transform ${
                specsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-center mb-10">
                <span className="px-4 py-1.5 bg-slate-900 text-[#FEE180] text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                  Ficha Técnica & Presupuesto
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 mb-2">
                  Tu Nueva Planta Solar
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
                  Diseño de ingeniería a la medida para cubrir tu demanda energética con la mayor rentabilidad del mercado.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* INVERSIÓN BOX (Highlight) */}
                <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center text-white">
                  {/* Background decoration */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#C49825] opacity-20 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <span className="text-[#FEE180] text-sm font-bold tracking-widest uppercase mb-2">Inversión Total Llave en Mano</span>
                  <div className="text-4xl sm:text-5xl font-black mb-4 font-mono tracking-tighter text-emerald-400 drop-shadow-md">
                    <AnimatedNumber 
                      value={totalInvestment} 
                      startValue={totalInvestment * 1.95} 
                      duration={5500} 
                      easingType="dramatic" 
                      prefix="$" 
                      suffix=" MXN" 
                    />
                  </div>
                  
                  <div className="space-y-4 border-t border-slate-700/50 pt-6 mt-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm text-slate-300 font-medium">{isOffGrid ? 'Almacenamiento en baterías de litio incluido' : 'Gestión e Interconexión CFE incluida'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm text-slate-300 font-medium">Instalación certificada bajo NOM-001-SEDE</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm text-slate-300 font-medium">Garantía estructural y de generación</span>
                    </div>
                  </div>

                  {!isOffGrid ? (
                    <div className="mt-6 p-4 bg-slate-950/40 rounded-2xl border border-slate-700/50 flex flex-col gap-2 relative z-10 backdrop-blur-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[#FEE180] font-bold text-xs uppercase tracking-wider">Retorno de Inversión (ROI)</span>
                        <span className="font-bold text-emerald-400 text-lg tracking-wide">{Number(displayPayback).toFixed(1)} Años</span>
                      </div>
                      <p className="text-[10px] text-slate-500/90 leading-relaxed border-t border-slate-700/50 pt-2">
                        *Tiempo estimado de recuperación basado exclusivamente en tus hábitos de consumo actuales y las tarifas vigentes de CFE.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 p-4 bg-slate-950/40 rounded-2xl border border-slate-700/50 flex flex-col gap-2 relative z-10 backdrop-blur-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[#FEE180] font-bold text-xs uppercase tracking-wider">Autonomía del Sistema</span>
                        <span className="font-bold text-emerald-400 text-lg tracking-wide">Independencia 24/7</span>
                      </div>
                      <p className="text-[10px] text-slate-500/90 leading-relaxed border-t border-slate-700/50 pt-2">
                        *Genera, almacena y consume tu propia energía sin depender de la red eléctrica nacional.
                      </p>
                    </div>
                  )}
                </div>

                {/* BENTO BOX SPECS (2 Columns on Mobile) */}
                <div className="lg:col-span-6 grid grid-cols-2 gap-2.5 sm:gap-4">
                  {/* Capacidad */}
                  <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 hover:shadow-md transition-shadow">
                    <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl shrink-0">
                      <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Potencia Instalada</span>
                      <span className="text-sm sm:text-xl font-black text-slate-900 leading-tight block mt-0.5">{system.installed_kWp.toFixed(2)} kWp</span>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium line-clamp-1">{(system.annual_production_kWh).toLocaleString()} kWh/año</p>
                    </div>
                  </div>

                  {/* Paneles */}
                  <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 hover:shadow-md transition-shadow">
                    <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl shrink-0">
                      <Sun className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Módulos Solares</span>
                      <span className="text-sm sm:text-xl font-black text-slate-900 leading-tight block mt-0.5">{system.num_panels} Pzas</span>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium line-clamp-1">{system.panel_Wp}W {system.panel_name}</p>
                    </div>
                  </div>

                  {/* Inversores */}
                  <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 hover:shadow-md transition-shadow">
                    <div className="p-2 sm:p-3 bg-purple-50 text-purple-600 rounded-lg sm:rounded-xl shrink-0">
                      <Cpu className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{isOffGrid ? 'Inv. Cargadores' : 'Inversores'}</span>
                      <span className="text-sm sm:text-xl font-black text-slate-900 leading-tight block mt-0.5">{system.num_inverters} Pzas</span>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium line-clamp-1">{system.inverter_kw}kW {system.inverter_name}</p>
                    </div>
                  </div>

                  {/* Baterías (Only for offgrid) */}
                  {isOffGrid && (
                    <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 hover:shadow-md transition-shadow">
                      <div className="p-2 sm:p-3 bg-red-50 text-red-600 rounded-lg sm:rounded-xl shrink-0">
                        <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Baterías</span>
                        <span className="text-sm sm:text-xl font-black text-slate-900 leading-tight block mt-0.5">{system.num_batteries || 1} Pzas</span>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium line-clamp-1">{system.battery_name || 'Litio'}</p>
                      </div>
                    </div>
                  )}

                  {/* Área */}
                  <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 hover:shadow-md transition-shadow">
                    <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl shrink-0">
                      <Layers className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Área & Montaje</span>
                      <span className="text-sm sm:text-xl font-black text-slate-900 leading-tight block mt-0.5">~{Number(system.area_m2 || 0).toFixed(1)} m²</span>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium line-clamp-1">Estructura K2 Anodizada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. SIMULADOR FINANCIERO / PROYECCIÓN DE ENERGÍA */}
          {!isOffGrid ? (
          <section>
            <div 
              ref={calcReveal.ref}
              className={`transition-all duration-1000 transform ${
                calcReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-center mb-10">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full">
                  Simulador Financiero
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  Cálculo de Rendimiento a Largo Plazo
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Controls */}
                <div className="lg:col-span-4 p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl shadow-2xl space-y-5 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C49825] opacity-5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-bold text-[#F5F0E8] flex items-center gap-2 mb-4">
                      <Sliders className="w-4 h-4 text-[#FEE180]" />
                      <span>Simulador Interactivo</span>
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-400">Inflación CFE estimada:</span>
                        <span className="text-[#FEE180] font-mono font-bold">{inflationRate}% / año</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="15"
                        step="0.5"
                        value={inflationRate}
                        onChange={(e) => setInflationRate(parseFloat(e.target.value))}
                        className="w-full accent-[#C49825] bg-slate-700 rounded-lg h-2 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400 block">Años de Evaluación:</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[10, 15, 25].map((years) => (
                          <button
                            key={years}
                            onClick={() => setSimulationHorizon(years)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all border backdrop-blur-sm ${
                              simulationHorizon === years
                                ? 'bg-[#C49825]/20 text-[#FEE180] border-[#C49825]/50'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-[#C49825]/30 hover:text-slate-300'
                            }`}
                          >
                            {years} Años
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-700/50 rounded-2xl grid grid-cols-2 gap-3 text-xs relative z-10 backdrop-blur-md">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-400 leading-tight">Ahorro a {simulationHorizon} años:</span>
                      <span className="font-bold text-emerald-400 font-mono tracking-wide whitespace-nowrap text-[13px]">
                        ${totalSimulatedSavings.toLocaleString('es-MX', { maximumFractionDigits: 0 })} <span className="text-[10px] text-emerald-600">MXN</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 border-l border-slate-700/50 pl-3">
                      <span className="text-slate-400 leading-tight">Retorno (ROI):</span>
                      <span className="font-bold text-[#FEE180] font-mono tracking-wide whitespace-nowrap text-[13px]">+{netROI}%</span>
                    </div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="lg:col-span-8 p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-4 tracking-wide">Ahorro Neto Acumulado vs Pago CFE Sin Solar</h4>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dynamicSimulationData}>
                          <defs>
                            <linearGradient id="colorSavingsLight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`} width={80} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            formatter={(value: number) => [`$${value.toLocaleString('es-MX')} MXN`, '']}
                          />
                          <Area type="monotone" dataKey="cumulativeSavings" name="Ahorro Acumulado" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSavingsLight)" />
                          <Bar dataKey="cfeNoSolar" name="Gasto CFE Sin Solar" fill="#ef4444" opacity={0.25} radius={[4, 4, 0, 0]} maxBarSize={16} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          ) : (
          <section>
            <div 
              ref={calcReveal.ref}
              className={`transition-all duration-1000 transform ${
                calcReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-center mb-10">
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-full">
                  Proyección de Energía Limpia
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  Generación vs Consumo
                </h2>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Generación Diaria</span>
                    <span className="text-2xl font-black text-amber-500">{((system.annual_production_kWh || 0) / 365).toFixed(1)} <span className="text-sm font-bold">kWh</span></span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Consumo Diario</span>
                    <span className="text-2xl font-black text-red-500">{((project.load_profile?.daily_Wh || 0) / 1000).toFixed(1)} <span className="text-sm font-bold">kWh</span></span>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">Balance Energético</span>
                    <span className="text-2xl font-black text-emerald-600">Positivo</span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        {
                          name: 'Diario',
                          'Generación': (system.annual_production_kWh || 0) / 365,
                          'Consumo': (project.load_profile?.daily_Wh || 0) / 1000
                        },
                        {
                          name: 'Semanal',
                          'Generación': ((system.annual_production_kWh || 0) / 365) * 7,
                          'Consumo': ((project.load_profile?.daily_Wh || 0) / 1000) * 7
                        },
                        {
                          name: 'Mensual',
                          'Generación': (system.annual_production_kWh || 0) / 12,
                          'Consumo': ((project.load_profile?.daily_Wh || 0) / 1000) * 30
                        }
                      ]}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `${val.toFixed(0)} kWh`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600, fontSize: '13px' }}
                        formatter={(value: number) => [`${value.toFixed(1)} kWh`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="Generación" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Consumo" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* 5. IMPACTO AMBIENTAL */}
          <section>
            <div 
              ref={envReveal.ref}
              className={`transition-all duration-1000 transform ${
                envReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="p-8 sm:p-10 bg-gradient-to-br from-[#0b1311] via-slate-900 to-[#0f1f1a] border border-emerald-500/20 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 opacity-[0.03] blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="text-center max-w-xl mx-auto mb-10 relative z-10">
                  <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider rounded-full shadow-md backdrop-blur-md">
                    Sustentabilidad Garantizada
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F0E8] mt-4">
                    Tu Huella Ecológica Positiva a 25 Años
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-5 relative z-10">
                  <div className="p-2.5 sm:p-6 bg-slate-950/40 border border-slate-700/50 rounded-xl sm:rounded-2xl text-center shadow-xl backdrop-blur-sm group hover:border-emerald-500/30 transition-colors flex flex-col justify-between items-center">
                    <div className="w-8 h-8 sm:w-14 sm:h-14 mx-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-4 group-hover:scale-110 transition-transform">
                      <Factory className="w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                    <div className="text-xs sm:text-2xl md:text-3xl font-black text-emerald-400 font-mono mb-0.5 sm:mb-1 tracking-tight truncate w-full">
                      <AnimatedNumber value={(environmental.co2_kg_25yr || 0) / 1000} decimals={1} suffix=" Ton" />
                    </div>
                    <h4 className="text-[8px] sm:text-xs font-bold text-slate-400 tracking-tighter sm:tracking-wider uppercase leading-tight">CO2 Evitado</h4>
                  </div>

                  <div className="p-2.5 sm:p-6 bg-slate-950/40 border border-slate-700/50 rounded-xl sm:rounded-2xl text-center shadow-xl backdrop-blur-sm group hover:border-emerald-500/30 transition-colors flex flex-col justify-between items-center">
                    <div className="w-8 h-8 sm:w-14 sm:h-14 mx-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-4 group-hover:scale-110 transition-transform">
                      <Trees className="w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                    <div className="text-xs sm:text-2xl md:text-3xl font-black text-emerald-400 font-mono mb-0.5 sm:mb-1 tracking-tight truncate w-full">
                      <AnimatedNumber value={environmental.trees_25yr || 0} suffix=" Árb." />
                    </div>
                    <h4 className="text-[8px] sm:text-xs font-bold text-slate-400 tracking-tighter sm:tracking-wider uppercase leading-tight">Árboles</h4>
                  </div>

                  <div className="p-2.5 sm:p-6 bg-slate-950/40 border border-slate-700/50 rounded-xl sm:rounded-2xl text-center shadow-xl backdrop-blur-sm group hover:border-emerald-500/30 transition-colors flex flex-col justify-between items-center">
                    <div className="w-8 h-8 sm:w-14 sm:h-14 mx-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-4 group-hover:scale-110 transition-transform">
                      <Car className="w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                    <div className="text-xs sm:text-2xl md:text-3xl font-black text-emerald-400 font-mono mb-0.5 sm:mb-1 tracking-tight truncate w-full">
                      <AnimatedNumber value={environmental.cars_25yr || 0} suffix=" Autos" />
                    </div>
                    <h4 className="text-[8px] sm:text-xs font-bold text-slate-400 tracking-tighter sm:tracking-wider uppercase leading-tight">Autos</h4>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. ELEGANT MOTION FOOTER */}
          <section className="pt-6 pb-2 relative overflow-hidden">
            {/* Glowing Motion CTA Card */}
            <div 
              ref={ctaReveal.ref}
              className={`p-8 sm:p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-[#C49825]/60 rounded-3xl text-white shadow-2xl relative overflow-hidden transition-all duration-1000 transform ${
                ctaReveal.isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-98'
              }`}
            >
              {/* Ambient Glowing Backlight behind CTA */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#C49825]/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

              <div className="relative z-10 text-center max-w-xl mx-auto space-y-5">
                <img src="/Logo_esol_w.png" alt="ESOL Energías" className="h-9 w-auto mx-auto opacity-95 transition-transform hover:scale-105" />

                <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                  ¿Listo para asegurar tu independencia energética?
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                  {isOffGrid 
                    ? 'Únete a quienes ya disfrutan de independencia energética total con tecnología solar de vanguardia y respaldo 24/7.' 
                    : 'Únete a las cientos de empresas y hogares que ya transformaron su gasto de energía CFE en un activo rentable de por vida.'}
                </p>

                {/* Animated Magnetic CTA Button */}
                <div className="pt-2">
                  <button 
                    onClick={() => window.open(`https://wa.me/523112343034?text=${encodeURIComponent(`Hola, acabo de revisar la propuesta solar de ${project.client_name} y quiero aceptarla / continuar con el proyecto.`)}`, '_blank')}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#997015] via-[#C49825] to-[#E8B83D] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(196,152,37,0.4)] hover:shadow-[0_0_45px_rgba(196,152,37,0.7)] transform hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <span className="relative z-10">Aceptar y Continuar Proyecto</span>
                    <ArrowUpRight className="w-5 h-5 stroke-[2.5] relative z-10 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </button>
                </div>
              </div>

              {/* Bottom Motion Footer Bar inside Card */}
              <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-medium relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-slate-300 font-semibold">Sistema Configurado: {system.installed_kWp.toFixed(2)} kWp ({system.num_panels} Paneles)</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 uppercase tracking-widest">
                  <span>ESOL ENERGÍAS</span>
                  <span>•</span>
                  <span>INGENIERÍA FOTOVOLTAICA</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* --- MOTION REVEAL FOOTER --- */}
      <footer className="fixed bottom-0 left-0 w-full h-[450px] sm:h-[380px] -z-10 bg-[#090b10] text-slate-300 flex flex-col justify-between p-8 sm:p-12 overflow-hidden">
        {/* Massive Watermark */}
        <div className="absolute -bottom-10 -right-10 w-[300px] h-[300px] opacity-5 pointer-events-none">
          <img src="/Logo_esol_w.png" alt="" className="w-full h-full object-contain" />
        </div>

        {/* Motion Footer Content */}
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-10 relative z-10">
          
          <div className="space-y-5">
            <img 
              src="/Logo_esol_w.png" 
              alt="ESOL Energías" 
              className="h-12 w-auto object-contain" 
            />
            <p className="text-xs text-slate-400 font-light leading-relaxed max-w-sm">
              Ingeniería fotovoltaica especializada para el sector industrial, comercial y residencial de alto consumo.
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C49825]/15 border border-[#C49825]/40 text-[#C49825] text-[10px] font-mono uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SISTEMA INTEGRADO
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-[#C49825]">Navegación</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-light">
              <li><span className="hover:text-[#FEE180] transition-colors cursor-pointer" onClick={() => cfeReveal.ref.current?.scrollIntoView({behavior: 'smooth'})}>Diagnóstico Energético</span></li>
              <li><span className="hover:text-[#FEE180] transition-colors cursor-pointer" onClick={() => specsReveal.ref.current?.scrollIntoView({behavior: 'smooth'})}>Ficha Técnica del Sistema</span></li>
              <li><span className="hover:text-[#FEE180] transition-colors cursor-pointer" onClick={() => calcReveal.ref.current?.scrollIntoView({behavior: 'smooth'})}>Simulador Financiero</span></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-[#C49825]">Atención Comercial</h4>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Resuelve tus dudas técnicas o solicita ajustes a este dimensionamiento con un ingeniero certificado.
            </p>
            <button 
              onClick={() => window.open(`https://wa.me/523112343034?text=${encodeURIComponent(`Hola, tengo dudas sobre la propuesta solar de ${project.client_name} y me gustaría contactar a un asesor.`)}`, '_blank')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#C49825] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#a6801e] transition-colors shadow-md"
            >
              Contactar Asesor <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Footer Bottom Line */}
        <div className="max-w-6xl mx-auto w-full pt-6 border-t border-[#C49825]/20 flex flex-col sm:flex-row items-center justify-between text-[10px] uppercase tracking-widest text-[#dcdedf]/50 relative z-10">
          <p>© {new Date().getFullYear()} ESOL ENERGÍAS. Todos los derechos reservados.</p>
          <p>Propuesta Confidencial para {project.client_name}</p>
        </div>
      </footer>
    </div>,
    document.body
  );
}
