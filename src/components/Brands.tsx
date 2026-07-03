import { motion } from 'motion/react';

interface Brand {
  name: string;
  category: string;
  tagline: string;
  country: string;
}

const BRANDS_LIST: Brand[] = [
  { name: 'CANADIAN SOLAR', category: 'Paneles Solares', tagline: 'Fabricante global líder de módulos solares y soluciones de almacenamiento.', country: 'Canadá' },
  { name: 'JINKO SOLAR', category: 'Paneles Solares', tagline: 'Uno de los mayores fabricantes mundiales de módulos fotovoltaicos de tecnología N-Type.', country: 'China' },
  { name: 'LONGI SOLAR', category: 'Paneles Solares', tagline: 'Líder mundial en tecnología monocristalina de alta eficiencia y obleas de silicio.', country: 'China' },
  { name: 'HUAWEI', category: 'Inversores', tagline: 'Soluciones inteligentes FusionSolar con inversores residenciales e industriales.', country: 'China' },
  { name: 'GROWATT', category: 'Inversores / Litio', tagline: 'Líder en inversores residenciales e híbridos con sistemas de almacenamiento.', country: 'China' },
  { name: 'HOYMILES', category: 'Microinversores', tagline: 'Microinversores a nivel de módulo con la más alta seguridad y eficiencia para techos.', country: 'China' },
  { name: 'K2 SYSTEMS', category: 'Estructuras', tagline: 'Sistemas de montaje y estructuras de aluminio con ingeniería alemana de precisión.', country: 'Alemania' },
  { name: 'PYLONTECH', category: 'Baterías', tagline: 'Especialista líder en sistemas de almacenamiento modular de Litio Ferro-Fosfato (LFP).', country: 'China' }
];

export function Brands() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  } as const;

  return (
    <section id="marcas" className="relative py-28 px-6 lg:px-12 bg-dark-1 overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/3 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-gold/25 bg-gold-muted text-gold-light mb-4">
            Respaldo y Calidad
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-cream tracking-tight mb-6">
            Marcas que
            <br />
            <span className="shimmer-text font-black">Distribuimos</span>
          </h2>
          <p className="font-body text-cream-muted text-sm md:text-base leading-relaxed tracking-wide">
            Colaboramos únicamente con los fabricantes líderes de la industria solar global, asegurando garantías reales, soporte técnico de fábrica y altos rendimientos de generación.
          </p>
        </div>

        {/* Brand Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {BRANDS_LIST.map((brand, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: 'rgba(196,152,37,0.4)', boxShadow: '0 10px 20px -10px rgba(196,152,37,0.1)' }}
              className="relative p-6 rounded-xl border border-dark-4 bg-dark-2 flex flex-col justify-between aspect-[4/3] transition-all duration-300 group"
            >
              {/* Brand visual header */}
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-gold uppercase px-2 py-0.5 rounded bg-gold-muted border border-gold/10">
                  {brand.category}
                </span>
                <span className="text-[9px] font-mono text-cream-dim uppercase font-semibold">
                  {brand.country}
                </span>
              </div>

              {/* Brand Typography Centerpiece */}
              <div className="my-3 text-center">
                <h3 className="font-display font-black text-lg md:text-xl text-cream tracking-widest group-hover:text-gold-light transition-colors duration-300">
                  {brand.name}
                </h3>
              </div>

              {/* Tagline / Subtext */}
              <p className="text-[10px] md:text-xs text-cream-muted leading-relaxed tracking-wide border-t border-dark-4/50 pt-3">
                {brand.tagline}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Dynamic bottom badge */}
        <div className="mt-16 text-center select-none">
          <p className="inline-flex items-center gap-2 text-[10px] text-cream-dim uppercase tracking-[0.2em] font-mono border border-dark-4 px-4 py-2 rounded-full bg-dark-2/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Certificación activa para soporte y trámite de garantías directas
          </p>
        </div>
      </div>
    </section>
  );
}
