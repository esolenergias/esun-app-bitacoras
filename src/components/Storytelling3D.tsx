import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Layers, Box, Sparkles } from 'lucide-react';

export function Storytelling3D() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Base, 2: Mesh, 3: Final

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
              
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.img
                    key="step-1"
                    src="/Fotografia.webp"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    alt="Fotografía original con dron"
                  />
                )}

                {currentStep === 2 && (
                  <motion.img
                    key="step-2"
                    src="/Ingenieria.webp"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    alt="Diseño de Ingeniería 3D"
                  />
                )}

                {currentStep === 3 && (
                  <motion.img
                    key="step-3"
                    src="/Fotomontaje.webp"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    alt="Fotomontaje Final de Módulos"
                  />
                )}
              </AnimatePresence>

              {/* Layer 4: Technical Tag Callouts (Visible in Step 2 & 3 for a tech-oriented premium UI feel, aligned bottom-left) */}
              <AnimatePresence>
                {currentStep >= 2 && (
                  <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10 pointer-events-none">
                    {/* Tag 1 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: 20 }}
                      transition={{ delay: 0.25, type: 'spring' }}
                      className="bg-dark-1/90 backdrop-blur-md border border-gold rounded-lg px-3.5 py-2 flex flex-col shadow-xl select-none w-max"
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
                      initial={{ opacity: 0, scale: 0.7, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: 20 }}
                      transition={{ delay: 0.35, type: 'spring' }}
                      className="bg-dark-1/90 backdrop-blur-md border border-gold rounded-lg px-3.5 py-2 flex flex-col shadow-xl select-none w-max"
                    >
                      <span className="text-[7px] uppercase tracking-[0.15em] text-cream-muted leading-none mb-1">
                        Proyecto B2B
                      </span>
                      <span className="text-xs font-mono font-bold text-gold">
                        Paneles 630
                      </span>
                    </motion.div>
                  </div>
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
              Ingeniería de primer nivel
            </span>
            
            <h2 className="font-display font-bold text-3xl md:text-4xl text-cream tracking-tight mb-6">
              El cliente ve su casa
              <br />
              <span className="shimmer-text font-black">con los paneles instalados</span>
            </h2>
            
            <p className="font-body text-cream-muted leading-relaxed tracking-wide text-sm md:text-base mb-8">
              eSol proporciona anteproyectos 3D de alta fidelidad que simulan en perspectiva fotorrealista exactamente cómo se verá su techo. Esto no solo elimina las objeciones estéticas, sino que demuestra capacidad de ingeniería rigurosa.
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
