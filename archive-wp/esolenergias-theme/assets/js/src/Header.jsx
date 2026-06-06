import { useState, useEffect, useRef } from 'react';
import { StatItem } from './components/StatItem';
import { ParticleSystem } from './components/ParticleSystem';
import { SolarRings } from './components/SolarRings';
import { CTAButtons } from './components/CTAButtons';
import { useTheme } from './hooks/useTheme';

// Customizer values injected by PHP in header.php (window.esolHeroData)
const D = (typeof window !== 'undefined' && window.esolHeroData) || {};

function parseStat(str, defVal, defSuffix) {
  if (!str) return { value: defVal, suffix: defSuffix };
  const m = str.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (m) {
    const suf = m[2].trim();
    return { value: parseFloat(m[1]), suffix: suf ? (suf.match(/^[A-Za-z]/) ? ' ' + suf : suf) : defSuffix };
  }
  return { value: defVal, suffix: defSuffix };
}

const HERO = {
  badge:   D.badge   || 'Ingeniería Solar Profesional',
  h1a:     D.h1a     || 'Proyectos Solares',
  h1b:     D.h1b     || 'de Precisión',
  subline: D.subline || 'eSol Energías',
  desc:    D.desc    || 'Anteproyectos con fotomontaje 3D para instaladores que buscan cerrar más ventas, y distribución de componentes fotovoltaicos de primer nivel para todo México.',
  cta1:    D.cta1    || 'Anteproyecto 3D',
  cta1Anc: D.cta1Anc || 'anteproyecto',
  cta2:    D.cta2    || 'Ver Catálogo',
  cta2Anc: D.cta2Anc || 'productos',
  heroImg: D.heroImg || 'https://esolenergias.com/wp-content/uploads/2026/04/Lamina-de-detalle-esol.png',
};

const STATS = [
  { ...parseStat(D.stat1Num, 150, '+'),    label: D.stat1Lbl || 'Proyectos' },
  { ...parseStat(D.stat2Num, 15,  '+'),    label: D.stat2Lbl || 'Marcas'    },
  { ...parseStat(D.stat3Num, 5,   ' MW'),  label: D.stat3Lbl || 'Instalados'},
];

export default function Header() {
  const [loaded, setLoaded] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const heroRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 120);
    setTimeout(() => setStatsVisible(true), 700);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - r.left) / r.width - 0.5) * 18,
        y: ((e.clientY - r.top) / r.height - 0.5) * 10,
      });
    };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap');

        @keyframes floatUp {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-100px) translateX(15px); opacity: 0; }
        }
        @keyframes rotateSlow { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideL {
          from { opacity: 0; transform: translateX(-36px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideR {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .particle { animation: floatUp linear infinite !important; }
      `}</style>

      <section
        id="inicio"
        ref={heroRef}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100svh',
          background: '#060C06',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* BG Layers */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 65% 40%, rgba(232,197,71,0.055) 0%, transparent 60%), radial-gradient(ellipse 50% 80% at 15% 85%, rgba(20,80,20,0.13) 0%, transparent 55%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(232,197,71,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(232,197,71,0.035) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, right: '38%', width: '1px', height: '100%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(232,197,71,0.1) 30%, rgba(232,197,71,0.06) 70%, transparent 100%)',
          transform: 'skewX(-8deg)', pointerEvents: 'none',
        }} />

        <ParticleSystem />
        <SolarRings />

        {/* ── Layout: column on mobile, 2-col on desktop ── */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: isMobile
            ? '90px 24px 32px'
            : 'clamp(80px,12vh,130px) clamp(24px,5vw,80px) clamp(40px,6vh,60px)',
          gap: isMobile ? '32px' : 'clamp(40px,5vw,80px)',
        }}>

          {/* TEXT: first on mobile (order 1), right column on desktop */}
          {/* Rendered BEFORE image in JSX so mobile shows text first */}

          {/* IMAGE col */}
          <div style={{
            order: isMobile ? 2 : 1,
            flex: isMobile ? 'none' : '0 0 auto',
            width: isMobile ? '85%' : 'clamp(240px,38vw,500px)',
            alignSelf: isMobile ? 'center' : 'auto',
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'flex-start',
            alignItems: 'center',
          }}>
            <div style={{
              width: '100%',
              transform: `translateY(${mousePos.y * 0.5}px) translateX(${mousePos.x * 0.3}px)`,
              transition: 'transform 0.4s ease-out',
              opacity: loaded ? 0.9 : 0,
              animation: loaded ? 'slideL 1s ease 0.3s forwards' : 'none',
              pointerEvents: 'none',
            }}>
              <img
                src={HERO.heroImg}
                alt="Proyecto solar eSol"
                style={{
                  width: '100%',
                  filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.65)) drop-shadow(0 0 30px rgba(232,197,71,0.07))',
                }}
              />
            </div>
          </div>

          {/* TEXT col */}
          <div style={{
            order: isMobile ? 1 : 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
            maxWidth: isMobile ? '100%' : '520px',
            width: isMobile ? '100%' : 'auto',
          }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(232,197,71,0.07)',
              border: '1px solid rgba(232,197,71,0.22)',
              padding: '6px 14px',
              borderRadius: '100px',
              marginBottom: '28px',
              width: 'fit-content',
              opacity: loaded ? 1 : 0,
              animation: loaded ? 'fadeUp 0.6s ease forwards' : 'none',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#E8C547', boxShadow: '0 0 8px rgba(232,197,71,0.8)',
              }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.65rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', color: '#E8C547',
              }}>
                {HERO.badge}
              </span>
            </div>

            {/* H1 */}
            <h1 style={{
              margin: '0 0 8px',
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? 'clamp(2.6rem,11vw,3.8rem)' : 'clamp(2.8rem,5.5vw,5rem)',
              fontWeight: 300, lineHeight: 1.06, color: '#FFFFFF',
              opacity: loaded ? 1 : 0,
              animation: loaded ? 'slideR 0.8s ease 0.1s forwards' : 'none',
            }}>
              {HERO.h1a}
              <br />
              <em style={{
                fontStyle: 'italic',
                background: 'linear-gradient(135deg, #E8C547 20%, #F5D97A 50%, #C9A227 80%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite',
              }}>
                {HERO.h1b}
              </em>
            </h1>

            {/* Subline */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '26px',
              opacity: loaded ? 1 : 0,
              animation: loaded ? 'fadeUp 0.6s ease 0.3s forwards' : 'none',
            }}>
              <div style={{ width: '36px', height: '1px', background: '#E8C547', opacity: 0.65 }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.62rem', letterSpacing: '0.22em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
              }}>
                {HERO.subline}
              </span>
            </div>

            {/* Description */}
            <p style={{
              margin: '0 0 38px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(0.88rem,1.3vw,1rem)',
              fontWeight: 300, lineHeight: 1.8,
              color: 'rgba(255,255,255,0.5)',
              opacity: loaded ? 1 : 0,
              animation: loaded ? 'fadeUp 0.6s ease 0.4s forwards' : 'none',
            }}>
              {HERO.desc}
            </p>

            {/* CTAs */}
            <div style={{
              opacity: loaded ? 1 : 0,
              animation: loaded ? 'fadeUp 0.6s ease 0.52s forwards' : 'none',
            }}>
              <CTAButtons
                primaryText={HERO.cta1}
                primaryHref={`#${HERO.cta1Anc}`}
                secondaryText={HERO.cta2}
                secondaryHref={`#${HERO.cta2Anc}`}
              />
            </div>
          </div>{/* /RIGHT */}

        </div>{/* /2-col layout */}

        {/* Stats bar — centered */}
        <div style={{
          position: 'relative', zIndex: 2,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: isMobile ? '18px 24px' : 'clamp(18px,2.5vh,26px) clamp(24px,5vw,80px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: isMobile ? '0' : 'clamp(16px,3.5vw,52px)',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          background: 'rgba(0,0,0,0.22)',
          backdropFilter: 'blur(10px)',
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center',
              gap: isMobile ? '16px' : 'clamp(16px,3.5vw,52px)',
              flex: isMobile ? '1 1 30%' : 'none',
              justifyContent: isMobile ? 'center' : 'flex-start',
            }}>
              {i > 0 && (
                <div style={{
                  width: '1px', height: '38px',
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.12), transparent)',
                }} />
              )}
              <StatItem {...s} started={statsVisible} index={i} />
            </div>
          ))}
        </div>

        {/* Bottom Gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
          background: 'linear-gradient(transparent, rgba(6,12,6,0.35))',
          pointerEvents: 'none',
        }} />
      </section>
    </>
  );
}
