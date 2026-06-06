

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-dark-1 border-t border-dark-4/60 pt-20 pb-8 px-6 lg:px-12 overflow-hidden">
      {/* Background flare */}
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-gold/3 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16">
          
          {/* Brand/About Col (Spans 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center cursor-pointer group" onClick={() => handleScrollTo('hero')}>
              <img
                src="/Logo_esol_w.png"
                alt="eSol Energías Logo"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </div>
            
            <p className="text-xs md:text-sm text-cream-muted leading-relaxed max-w-sm tracking-wide">
              Ingeniería solar avanzada y distribución mayorista de componentes fotovoltaicos para instaladores y profesionales del sector en todo México.
            </p>
          </div>

          {/* Quick Links Column (Spans 3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-gold font-mono">
              Secciones
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => handleScrollTo('servicios')}
                  className="text-xs text-cream-muted hover:text-gold-light hover:translate-x-1 transition-all duration-200 cursor-pointer"
                >
                  Servicios
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('anteproyecto')}
                  className="text-xs text-cream-muted hover:text-gold-light hover:translate-x-1 transition-all duration-200 cursor-pointer"
                >
                  Anteproyecto 3D
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('calculadora')}
                  className="text-xs text-cream-muted hover:text-gold-light hover:translate-x-1 transition-all duration-200 cursor-pointer"
                >
                  Calculadora CFE
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('catalogo')}
                  className="text-xs text-cream-muted hover:text-gold-light hover:translate-x-1 transition-all duration-200 cursor-pointer"
                >
                  Catálogo B2B
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Contact Info (Spans 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-gold font-mono">
              Contacto
            </h4>
            <ul className="space-y-2.5 text-xs text-cream-muted font-mono leading-relaxed">
              <li>
                Tel / WA: <span className="text-cream">+52 (33) 0000-0000</span>
              </li>
              <li>
                Email: <a href="mailto:ventas@esolenergias.com" className="text-cream hover:text-gold transition-colors">ventas@esolenergias.com</a>
              </li>
              <li>
                Ubicación: <span className="text-cream">Guadalajara, Jalisco, México</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright area */}
        <div className="border-t border-dark-4/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-mono text-cream-dim text-center sm:text-left">
            &copy; {currentYear} eSol Energías &mdash; Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a
              href="#aviso"
              onClick={(e) => { e.preventDefault(); alert('Aviso de Privacidad: eSol Energías protege tus datos personales de acuerdo con la LFPDPPP.'); }}
              className="text-[10px] font-mono text-cream-dim hover:text-cream transition-colors"
            >
              Aviso de Privacidad
            </a>
            <a
              href="#terminos"
              onClick={(e) => { e.preventDefault(); alert('Términos de Uso: Los contenidos y cotizaciones proporcionadas por este portal son exclusivamente informativos.'); }}
              className="text-[10px] font-mono text-cream-dim hover:text-cream transition-colors"
            >
              Términos de Uso
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
