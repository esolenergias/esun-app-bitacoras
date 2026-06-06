import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Layers, Box, Sparkles } from 'lucide-react';

export function Storytelling3D() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Base, 2: Mesh, 3: Final
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload the 73 WebP animation frames
  useEffect(() => {
    let loadedCount = 0;
    const totalFrames = 73;
    const padZero = (num: number, size: number) => {
      let s = num + '';
      while (s.length < size) s = '0' + s;
      return s;
    };

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.src = `/Plano paneles/plano_paneles_${padZero(i, 5)}.webp`;
      img.onload = () => {
        imagesRef.current[i] = img;
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      };
    }
  }, []);

  // Canvas drawing loop for step 2 (Ingeniería 3D)
  useEffect(() => {
    if (currentStep !== 2 || !imagesLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let timerId: number;
    let lastTime = performance.now();
    const fps = 25; // Play smooth at 25 fps
    const interval = 1000 / fps;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = (img: HTMLImageElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = canvas.height * imgRatio;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    const animate = (time: number) => {
      const elapsed = time - lastTime;
      if (elapsed >= interval) {
        const img = imagesRef.current[frame];
        if (img && img.complete) {
          draw(img);
        }
        frame = (frame + 1) % 73;
        lastTime = time - (elapsed % interval);
      }
      timerId = requestAnimationFrame(animate);
    };

    timerId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(timerId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentStep, imagesLoaded]);

  const steps = [
    {
      id: 1,
      title: '1. Fotografía Dron',
      icon: Camera,
      desc: 'Capturamos imágenes aéreas de alta resolución de la propiedad para modelar las dimensiones reales.',
    },
    {
      id: 2,
      title: '2. Ingeniería 3D',
      icon: Layers,
      desc: 'Creamos un plano digital de precisión 3D para definir la orientación y sombreados críticos de la techumbre.',
    },
    {
      id: 3,
      title: '3. Fotomontaje Final',
      icon: Box,
      desc: 'Incrustamos los módulos fotovoltaicos en perspectiva real para entregar una cotización visual contundente.',
    },
  ];

  return (
    <section
      id="anteproyecto"
      className="relative py-28 px-6 lg:px-12 bg-dark-2 overflow-hidden"
    >
      {/* Background Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(240,239,232,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(240,239,232,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Interactive Layered Graphic Panel (Takes 6 cols) */}
          <div className="lg:col-span-6 w-full flex flex-col gap-6">
            
            {/* Visual Box Container */}
            <div className="relative w-full aspect-[700/450] rounded-2xl border border-dark-4 bg-dark-1 overflow-hidden shadow-2xl">
              
              {/* Layer 1: Drone Base Photo */}
              <img
                src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=85&auto=format&fit=crop"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                alt="Fotografía original con dron"
              />

              {/* Layer 1.5: Animated Plano Paneles Sequence (Visible only in Step 2) */}
              <AnimatePresence>
                {currentStep === 2 && (
                  <motion.canvas
                    ref={canvasRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  />
                )}
              </AnimatePresence>

              {/* Layer 2: Wireframe Grid Mesh Overlay (Visible in Step 2 & 3) */}
              <AnimatePresence>
                {currentStep >= 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 pointer-events-none mix-blend-screen bg-[size:40px_40px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 0l100 100M100 0L0 100M0 50h100M50 0v100' stroke='rgba(196,152,37,0.25)' stroke-width='0.5'/%3E%3C/svg%3E")`,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Layer 3: Realistic Perspective Panels (Visible only in Step 3) */}
              <AnimatePresence>
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -40, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  >
                    {/* Floating gold blueprint module in perspective */}
                    <div
                      className="w-1/2 aspect-video rounded-xl bg-gradient-to-br from-gold/10 to-gold/20 border border-gold shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-center p-3 relative"
                      style={{
                        transform: 'perspective(1200px) rotateX(42deg) rotateZ(-12deg) translateY(-10px)',
                      }}
                    >
                      <div className="grid grid-cols-4 grid-rows-2 gap-1 w-full h-full opacity-60">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="border border-gold/45 rounded bg-gold/5" />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Layer 4: Technical Tag Callouts (Visible only in Step 3) */}
              <AnimatePresence>
                {currentStep === 3 && (
                  <>
                    {/* Tag 1 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.7, x: 20 }}
                      transition={{ delay: 0.25, type: 'spring' }}
                      className="absolute top-1/4 right-6 bg-dark-1/90 backdrop-blur-md border border-gold rounded-lg px-3.5 py-2 flex flex-col pointer-events-none shadow-xl select-none"
                    >
                      <span className="text-[7px] uppercase tracking-[0.15em] text-cream-muted leading-none mb-1">
                        Precisión 3D
                      </span>
                      <span className="text-xs font-mono font-bold text-gold">
                        99.8%
                      </span>
                    </motion.div>

                    {/* Tag 2 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.7, x: -20 }}
                      transition={{ delay: 0.35, type: 'spring' }}
                      className="absolute bottom-1/4 left-6 bg-dark-1/90 backdrop-blur-md border border-gold rounded-lg px-3.5 py-2 flex flex-col pointer-events-none shadow-xl select-none"
                    >
                      <span className="text-[7px] uppercase tracking-[0.15em] text-cream-muted leading-none mb-1">
                        Proyecto B2B
                      </span>
                      <span className="text-xs font-mono font-bold text-gold">
                        Paneles 550W
                      </span>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              
            </div>

            {/* Step Controls Grid */}
            <div className="grid grid-cols-3 gap-3">
              {steps.map((s) => {
                const Icon = s.icon;
                const isSelected = currentStep === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(s.id)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'border-gold bg-gold/5 text-gold shadow-lg shadow-gold/5'
                        : 'border-dark-4 bg-dark-1 text-cream-muted hover:border-cream/20 hover:text-cream'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-2 flex-none" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {s.title.split(' ')[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Narrative Context & Information (Takes 6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-gold/25 bg-gold-muted text-gold-light mb-4">
              Cierre de Venta Solar
            </span>
            
            <h2 className="font-display font-bold text-3xl md:text-4xl text-cream tracking-tight mb-6">
              El cliente ve su casa
              <br />
              <span className="shimmer-text font-black italic">con los paneles instalados</span>
            </h2>
            
            <p className="font-body text-cream-muted leading-relaxed tracking-wide text-sm md:text-base mb-8">
              Una propuesta tosca y sin detalles ahuyenta al inversionista. eSol proporciona anteproyectos 3D de alta fidelidad que simulan en perspectiva fotorrealista exactamente cómo se verá su techo. Esto no solo elimina las objeciones estéticas, sino que demuestra capacidad de ingeniería rigurosa.
            </p>

            {/* Active Step Explanations */}
            <div className="min-h-[100px] border-l-2 border-gold/30 pl-6 mb-8 py-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block mb-1">
                Fase Seleccionada
              </span>
              <p className="text-xs md:text-sm text-cream leading-relaxed transition-all duration-300">
                {steps.find((s) => s.id === currentStep)?.desc}
              </p>
            </div>

            <a
              href="#contacto"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-gold to-gold-light text-dark-1 hover:shadow-2xl hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-gold/10"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              Solicitar Muestra Gratuita
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
