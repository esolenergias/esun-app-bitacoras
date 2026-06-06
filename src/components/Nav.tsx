import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Servicios', href: '#servicios' },
    { name: 'Anteproyecto 3D', href: '#anteproyecto' },
    { name: 'Cotizar Ahorro', href: '#cotizar' },
    { name: 'Catálogo B2B', href: '#catalogo' },
    { name: 'Marcas', href: '#marcas' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-1/90 backdrop-blur-md border-b border-dark-4 shadow-lg py-4'
          : 'bg-transparent border-b border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="flex items-center group">
          <img
            src="/Logo_esol_w.png"
            alt="eSol Energías Logo"
            className="h-[42px] w-auto object-contain mt-2 transition-transform group-hover:scale-102"
          />
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs font-black uppercase tracking-widest text-cream-muted hover:text-gold transition-colors relative group py-2"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <a
            href="#contacto"
            className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest bg-gradient-to-r from-gold to-gold-light text-dark-1 shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            Contacto
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-cream hover:text-gold transition-colors focus:outline-none"
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-dark-4 bg-dark-2/98 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold uppercase tracking-widest text-cream-muted hover:text-gold py-1"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#contacto"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3.5 rounded-xl font-black uppercase tracking-widest bg-gradient-to-r from-gold to-gold-light text-dark-1 text-xs"
              >
                Contacto
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
