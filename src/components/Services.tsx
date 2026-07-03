import { motion } from 'motion/react';
import { Eye, ShieldCheck, ArrowRight } from 'lucide-react';

export function Services() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
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

  return (
    <section
      id="servicios"
      className="relative py-28 px-6 lg:px-12 overflow-hidden bg-dark-1"
    >
      {/* Backlight elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gold-light/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-gold/25 bg-gold-muted text-gold-light mb-4">
            Nuestros Servicios
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-cream tracking-tight mb-6">
            Dos soluciones,
            <br />
            <span className="shimmer-text font-black">un solo aliado</span>
          </h2>
          <p className="font-body text-cream-muted leading-relaxed tracking-wide text-sm md:text-base">
            Servimos tanto al instalador que quiere asegurar el cierre de sus proyectos mediante planos fotorrealistas, como al profesional que necesita los mejores componentes fotovoltaicos a precio de distribución.
          </p>
        </div>

        {/* Services Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* Card 1: Anteproyecto 3D */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="group relative rounded-2xl border border-dark-4 bg-dark-2 p-8 md:p-10 flex flex-col justify-between aspect-[4/3] min-h-[350px] shadow-xl hover:border-gold/30 hover:shadow-gold/5 transition-all duration-300 overflow-hidden"
          >
            {/* Corner numbers */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gold/10 to-transparent flex items-center justify-center font-display text-4xl font-black text-gold/10 select-none pointer-events-none">
              01
            </div>

            <div className="flex flex-col gap-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-md">
                <Eye className="w-6 h-6 stroke-[2]" />
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-black">
                  Para Instaladores
                </span>
                <h3 className="font-display font-bold text-xl md:text-2xl text-cream leading-tight">
                  Anteproyecto Solar 3D
                </h3>
              </div>

              <p className="text-xs md:text-sm text-cream-muted leading-relaxed tracking-wide">
                Transformamos una fotografía aérea tomada por dron en un modelo 3D fotorrealista de alta precisión del sistema solar propuesto sobre la propiedad. Ideal para cierres de ventas profesionales.
              </p>
            </div>

            <div className="relative z-10 pt-6">
              <a
                href="#anteproyecto"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gold hover:text-gold-light transition-colors group-hover:translate-x-1 duration-300"
              >
                Solicitar Anteproyecto
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </motion.div>

          {/* Card 2: Componentes de Distribución */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="group relative rounded-2xl border border-dark-4 bg-dark-2 p-8 md:p-10 flex flex-col justify-between aspect-[4/3] min-h-[350px] shadow-xl hover:border-gold/30 hover:shadow-gold/5 transition-all duration-300 overflow-hidden"
          >
            {/* Corner numbers */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gold/10 to-transparent flex items-center justify-center font-display text-4xl font-black text-gold/10 select-none pointer-events-none">
              02
            </div>

            <div className="flex flex-col gap-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-md">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-black">
                  Distribución B2B
                </span>
                <h3 className="font-display font-bold text-xl md:text-2xl text-cream leading-tight">
                  Componentes Fotovoltaicos
                </h3>
              </div>

              <p className="text-xs md:text-sm text-cream-muted leading-relaxed tracking-wide">
                Distribuimos todos los componentes necesarios para una instalación fotovoltaica completa: paneles de alta potencia, inversores, microinversores, cable, baterías y estructuras de montaje de aluminio.
              </p>
            </div>

            <div className="relative z-10 pt-6">
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gold hover:text-gold-light transition-colors group-hover:translate-x-1 duration-300"
              >
                Ver Catálogo B2B
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </motion.div>
        </motion.div>
        
      </div>
    </section>
  );
}
