import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { ChevronRight, Zap, Sun, Eye, ShieldCheck, ArrowRight } from 'lucide-react';

const FRAME_COUNT = 360;
const AUTOPLAY_END_FRAME = 90; // Frame 90 = 3 seconds at 30fps
const BASE_URL = '/Paneles intro/anim_eso1_';
const SCROLL_RANGE = 1250; // Scroll distance in pixels to complete the animation

const padZero = (num: number, size: number) => {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
};

// Reusable CountUp Component for animated statistics
function CountUp({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}</span>;
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Track images loading
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const currentFrameRef = useRef(0);
  const [autoplayFinished, setAutoplayFinished] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const { scrollY } = useScroll();

  // 1. Initial preloading of the first 90 frames
  useEffect(() => {
    let loadedCount = 0;
    const firstGroupUrls = Array.from({ length: AUTOPLAY_END_FRAME + 1 }).map(
      (_, i) => `${BASE_URL}${padZero(i, 5)}.webp`
    );

    const loadImagesGroup = (urls: string[], startIndex: number, onComplete: () => void) => {
      let groupLoaded = 0;
      urls.forEach((url, i) => {
        const frameIndex = startIndex + i;
        const img = new Image();
        img.src = url;
        img.onload = () => {
          imagesRef.current[frameIndex] = img;
          groupLoaded++;
          loadedCount++;
          
          if (startIndex === 0) {
            setLoadProgress(Math.round((loadedCount / firstGroupUrls.length) * 100));
          }

          if (groupLoaded === urls.length) {
            onComplete();
          }
        };
        img.onerror = () => {
          groupLoaded++;
          loadedCount++;
          if (startIndex === 0) {
            setLoadProgress(Math.round((loadedCount / firstGroupUrls.length) * 100));
          }
          if (groupLoaded === urls.length) {
            onComplete();
          }
        };
      });
    };

    // Load first 90 frames to start autoplay quickly
    loadImagesGroup(firstGroupUrls, 0, () => {
      setIsPreloaded(true);
      
      // Load remaining 270 frames in the background
      const remainingUrls = Array.from({ length: FRAME_COUNT - (AUTOPLAY_END_FRAME + 1) }).map(
        (_, i) => `${BASE_URL}${padZero(AUTOPLAY_END_FRAME + 1 + i, 5)}.webp`
      );
      loadImagesGroup(remainingUrls, AUTOPLAY_END_FRAME + 1, () => {
        console.log('Sequence background preloading complete.');
      });
    });
  }, []);

  // 2. Canvas drawing and resizing logic (RIGHT-ALIGNED NO-CROP SCALING)
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find the closest loaded frame to avoid drawing blanks
    let img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      let leftIdx = frameIndex;
      while (leftIdx >= 0 && (!imagesRef.current[leftIdx] || !imagesRef.current[leftIdx].complete)) {
        leftIdx--;
      }
      let rightIdx = frameIndex;
      while (rightIdx < FRAME_COUNT && (!imagesRef.current[rightIdx] || !imagesRef.current[rightIdx].complete)) {
        rightIdx++;
      }

      const hasLeft = leftIdx >= 0 && imagesRef.current[leftIdx];
      const hasRight = rightIdx < FRAME_COUNT && imagesRef.current[rightIdx];

      if (hasLeft && hasRight) {
        img = (frameIndex - leftIdx < rightIdx - frameIndex) ? imagesRef.current[leftIdx] : imagesRef.current[rightIdx];
      } else if (hasLeft) {
        img = imagesRef.current[leftIdx];
      } else if (hasRight) {
        img = imagesRef.current[rightIdx];
      }
    }

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        // Canvas is taller/narrower than the image ratio (e.g. desktop 50vw, height 100vh)
        // Fit to width so it spans from the center of the screen to the right edge
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        // Canvas is wider than the image ratio (e.g. mobile or wide layouts)
        // Fit to height and center horizontally
        drawWidth = canvas.height * imgRatio;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;
    
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    drawFrame(currentFrameRef.current);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isPreloaded) {
      handleResize();
    }
  }, [isPreloaded]);

  // 3. Autoplay logic (0 to 90) and Scrolltelling logic (90 to 359)
  useEffect(() => {
    if (!isPreloaded) return;

    let frame = 0;
    let timerId: number;

    const playIntro = () => {
      frame++;
      if (frame <= AUTOPLAY_END_FRAME) {
        currentFrameRef.current = frame;
        drawFrame(frame);
        timerId = requestAnimationFrame(playIntro);
      } else {
        setAutoplayFinished(true);
      }
    };

    timerId = requestAnimationFrame(playIntro);
    return () => cancelAnimationFrame(timerId);
  }, [isPreloaded]);

  // Scroll handler after autoplay finishes: maps frames to natural page scroll
  useEffect(() => {
    if (!autoplayFinished) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrolledAmount = -rect.top;

      let progress = scrolledAmount / SCROLL_RANGE;
      progress = Math.max(0, Math.min(1, progress));

      const frameIndex = Math.round(
        AUTOPLAY_END_FRAME + progress * (FRAME_COUNT - 1 - AUTOPLAY_END_FRAME)
      );

      currentFrameRef.current = frameIndex;
      drawFrame(frameIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoplayFinished]);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 16,
      },
    },
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 80, damping: 15 },
    },
  } as const;

  // Track window resizing for desktop shift calculations
  useEffect(() => {
    const handleResizeWidth = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResizeWidth);
    return () => window.removeEventListener('resize', handleResizeWidth);
  }, []);

  // Calculate translation distance to align centered block with the left column
  const isDesktop = windowWidth >= 1024;
  const desktopShift = isDesktop ? Math.max(0, (Math.min(1280, windowWidth) - 448) / 2) : 0;

  // Transform scrollY directly to headerX and textOpacity
  const rawHeaderX = useTransform(scrollY, (y) => {
    let progress = (y - 100) / (300 - 100);
    progress = Math.max(0, Math.min(1, progress));
    return (1 - progress) * desktopShift;
  });

  // Smooth the horizontal movement to prevent any wobbly "va y ven" feeling!
  const headerX = useSpring(rawHeaderX, { stiffness: 120, damping: 24, mass: 0.1 });

  const textOpacity = useTransform(scrollY, [0, 280], [1, 0]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-dark-1 topo-bg pt-24 flex flex-col lg:block" 
      id="hero"
    >
      
      {/* 3D Canvas Container: Sticky on desktop (lg), absolute on mobile */}
      <div 
        className="relative lg:absolute lg:top-0 right-0 w-full lg:w-[50vw] h-[75vw] sm:h-[60vw] lg:h-full select-none pointer-events-none z-10 bg-dark-1 order-2 lg:order-none"
      >
        <div 
          ref={canvasContainerRef}
          className="relative lg:sticky lg:top-[calc(50vh+48px-14.06vw)] w-full h-full lg:h-[28.125vw]"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />

          {/* Transition vignette to blend the left side of the canvas smoothly with the dark background */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-dark-1 via-dark-1/20 to-transparent pointer-events-none z-15 hidden lg:block" />
          
          {/* Top & Bottom Vignette masks */}
          <div className="absolute top-0 left-0 w-full h-12 lg:h-28 bg-gradient-to-b from-dark-1 to-transparent pointer-events-none z-15" />
          <div className="absolute bottom-0 left-0 w-full h-12 lg:h-28 bg-gradient-to-t from-dark-1 to-transparent pointer-events-none z-15" />

          {/* Loading Overlay */}
          <AnimatePresence>
            {!isPreloaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-dark-1 z-35 flex flex-col items-center justify-center gap-3 px-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center text-gold shadow-[0_0_12px_rgba(196,152,37,0.15)]"
                >
                  <Sun className="w-5 h-5 stroke-[1.5]" />
                </motion.div>

                <div className="text-center space-y-0.5 select-none">
                  <span className="font-display font-black text-[8px] tracking-[0.25em] text-cream block">
                    ESOL ENERGÍAS
                  </span>
                  <span className="text-[8px] text-cream-muted font-body tracking-wider block">
                    Cargando simulación 3D...
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full max-w-[120px] h-1 bg-dark-3 rounded-full overflow-hidden border border-dark-4">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold to-gold-light"
                    animate={{ width: `${loadProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                
                <span className="text-[8px] text-gold font-mono font-bold">
                  {loadProgress}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>      {/* Foreground Content Container (Restricted to Left Column lg:col-span-6 on Desktop) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12 pointer-events-none order-1 lg:order-none">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column containing Hero text */}
          <div className="lg:col-span-6 flex flex-col pointer-events-auto">
            
            {/* Hero Text block */}
            <div className="h-auto lg:h-[calc(100vh-96px)] min-h-0 lg:min-h-0 flex items-center py-6 lg:py-0 mb-8 lg:mb-0">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-start max-w-md transition-opacity duration-300"
                style={{ opacity: textOpacity }}
              >
                {/* Top badge */}
                <motion.div
                  variants={itemVariants}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-[9px] font-black tracking-[0.2em] uppercase select-none border border-gold/20 bg-gold/5 text-gold-light"
                >
                  <Zap className="w-3 h-3 text-gold fill-gold animate-pulse" />
                  INGENIERÍA SOLAR PROFESIONAL
                </motion.div>

                {/* Main Title */}
                <motion.h1
                  variants={itemVariants}
                  className="font-display font-bold text-cream tracking-tight leading-[1.15] mb-4"
                  style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.8rem)' }}
                >
                  Proyectos Solares
                  <br />
                  <span className="shimmer-text font-black italic">
                    de Precisión
                  </span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  variants={itemVariants}
                  className="text-xs md:text-[13px] text-cream-muted leading-relaxed tracking-wide mb-6"
                >
                  Anteproyectos con fotomontaje 3D para instaladores que buscan cerrar más ventas, y distribución de componentes fotovoltaicos de primer nivel para todo México.
                </motion.p>

                {/* Call-to-actions */}
                <motion.div
                  variants={itemVariants}
                  className="flex gap-3 flex-wrap mb-8"
                >
                  <a
                    href="#anteproyecto"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-gold to-gold-light text-dark-1 hover:shadow-2xl hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-gold/10"
                  >
                    Anteproyecto 3D
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                  <a
                    href="#catalogo"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-cream/20 text-cream hover:bg-cream/5 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Ver Catálogo B2B
                  </a>
                </motion.div>

                {/* Integrated Statistics inside the text column */}
                <motion.div
                  variants={itemVariants}
                  className="border-t border-dark-4/50 pt-5 mt-4 grid grid-cols-3 gap-5 text-left w-full select-none"
                >
                  {/* Stat 1 */}
                  <div className="flex flex-col">
                    <span className="text-base md:text-lg font-display font-black text-gold">
                      <CountUp end={150} />+
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-cream-muted font-bold mt-0.5">
                      Proyectos
                    </span>
                  </div>

                  {/* Stat 2 */}
                  <div className="flex flex-col border-l border-dark-4/50 pl-4">
                    <span className="text-base md:text-lg font-display font-black text-gold">
                      <CountUp end={15} />+
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-cream-muted font-bold mt-0.5">
                      Marcas
                    </span>
                  </div>

                  {/* Stat 3 */}
                  <div className="flex flex-col border-l border-dark-4/50 pl-4">
                    <span className="text-base md:text-lg font-display font-black text-gold">
                      <CountUp end={5} /> MW
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-cream-muted font-bold mt-0.5">
                      Instalados
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>

          </div>

          {/* Right Column: Blank space to allow sticky canvas visibility */}
          <div className="lg:col-span-6 hidden lg:block" />

        </div>

      </div>

      {/* Services Section Header (Outside the grid, animated layout) */}
      <div id="servicios" className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12 pointer-events-auto flex flex-col pt-16 pb-8 select-none lg:mt-[calc(20vh-100px)] order-3 lg:order-none">
        {/* Backlight elements */}
        <div className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-gold/5 blur-[100px] pointer-events-none -z-10" />

        <motion.div
          style={{ x: headerX }}
          className="flex flex-col items-center text-center w-full max-w-md"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border border-gold/25 bg-gold-muted text-gold-light mb-4">
            Nuestros Servicios
          </span>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-cream tracking-tight mb-4 leading-tight">
            Dos soluciones,
            <br />
            <span className="shimmer-text font-black italic">un solo aliado</span>
          </h2>
          <p className="font-body text-cream-muted leading-relaxed tracking-wide text-xs md:text-[13px] max-w-md">
            Servimos tanto al instalador que quiere asegurar el cierre de sus proyectos mediante planos fotorrealistas, como al profesional que necesita los mejores componentes fotovoltaicos a precio de distribución.
          </p>
        </motion.div>
      </div>

      {/* Services Cards Container (Back inside the grid for left column alignment) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12 pointer-events-none pb-20 order-4 lg:order-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-6 flex flex-col pointer-events-auto">
            {/* Services Cards Grid (Stacked vertically) */}
            <motion.div
              style={{ x: headerX }}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 gap-6 max-w-md"
            >
              {/* Card 1: Anteproyecto 3D */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className="group relative rounded-2xl border border-dark-4 bg-dark-2 p-6 flex flex-col justify-between min-h-[300px] shadow-xl hover:border-gold/30 hover:shadow-gold/5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gold/10 to-transparent flex items-center justify-center font-display text-3xl font-black text-gold/10 select-none pointer-events-none">
                  01
                </div>

                <div className="flex flex-col gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-md">
                    <Eye className="w-5 h-5 stroke-[2]" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-black">
                      Para Instaladores
                    </span>
                    <h3 className="font-display font-bold text-lg text-cream leading-tight">
                      Anteproyecto Solar 3D
                    </h3>
                  </div>

                  <p className="text-[11px] text-cream-muted leading-relaxed tracking-wide">
                    Transformamos una fotografía aérea tomada por dron en un modelo 3D fotorrealista de alta precisión del sistema solar propuesto sobre la propiedad. Ideal para cierres de ventas profesionales.
                  </p>
                </div>

                <div className="relative z-10 pt-4">
                  <a
                    href="#anteproyecto"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold hover:text-gold-light transition-colors group-hover:translate-x-1 duration-300"
                  >
                    Solicitar Anteproyecto
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>
              </motion.div>

              {/* Card 2: Componentes de Distribución */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className="group relative rounded-2xl border border-dark-4 bg-dark-2 p-6 flex flex-col justify-between min-h-[300px] shadow-xl hover:border-gold/30 hover:shadow-gold/5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gold/10 to-transparent flex items-center justify-center font-display text-3xl font-black text-gold/10 select-none pointer-events-none">
                  02
                </div>

                <div className="flex flex-col gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-md">
                    <ShieldCheck className="w-5 h-5 stroke-[2]" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-black">
                      Distribución B2B
                    </span>
                    <h3 className="font-display font-bold text-lg text-cream leading-tight">
                      Componentes Fotovoltaicos
                    </h3>
                  </div>

                  <p className="text-[11px] text-cream-muted leading-relaxed tracking-wide">
                    Distribuimos todos los componentes necesarios para una instalación fotovoltaica completa: paneles de alta potencia, inversores, microinversores, cable, baterías y estructuras de montaje de aluminio.
                  </p>
                </div>

                <div className="relative z-10 pt-4">
                  <a
                    href="#catalogo"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold hover:text-gold-light transition-colors group-hover:translate-x-1 duration-300"
                  >
                    Ver Catálogo B2B
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:col-span-6 hidden lg:block" />

        </div>
      </div>

    </div>
  );
}
