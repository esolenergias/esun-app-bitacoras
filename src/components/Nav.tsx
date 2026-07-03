import { useState, useEffect } from 'react';
import { Menu, X, Shield, User, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

export function Nav() {
  const { currentUser, openPortal, content, theme, toggleTheme } = useApp();
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
    <div className="fixed top-0 left-0 w-full z-50 flex flex-col">
      {content.promoBanner.active && (
        <div className="w-full bg-gradient-to-r from-gold-dim via-gold to-gold-light text-dark-1 py-2 px-6 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 z-50">
          <span>{content.promoBanner.text}</span>
          <a href={content.promoBanner.link} className="underline hover:text-white transition-colors ml-1 font-bold">
            Ver más →
          </a>
        </div>
      )}
      <nav
        className={`w-full transition-all duration-300 ${
          scrolled
            ? 'bg-dark-1/90 backdrop-blur-md border-b border-dark-4 shadow-lg py-4'
            : 'bg-transparent border-b border-transparent py-6'
        }`}
      >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="flex items-center group">
          <img
            src={theme === 'light' ? '/Logo_esol_b.png' : '/Logo_esol_w.png'}
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
            className="text-xs font-black uppercase tracking-widest text-cream-muted hover:text-gold transition-colors relative group py-2"
          >
            Contacto
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold group-hover:w-full transition-all duration-300" />
          </a>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg border border-dark-4 bg-dark-2 hover:bg-dark-3 text-gold hover:text-gold-light transition-all cursor-pointer flex items-center justify-center mr-1"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={openPortal}
            className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest bg-gradient-to-r from-gold to-gold-light text-dark-1 shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex items-center gap-1.5"
          >
            {currentUser ? (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Panel {currentUser.role === 'master' ? 'Master' : currentUser.role === 'admin' ? 'Admin' : 'Cliente'}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>Portal eSol</span>
              </>
            )}
          </button>
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
                className="text-sm font-bold uppercase tracking-widest text-cream-muted hover:text-gold py-1 text-center"
              >
                Contacto
              </a>
              <div className="flex gap-3 w-full">
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2.5 rounded-xl border border-dark-4 bg-dark-2 text-gold flex items-center justify-center cursor-pointer transition-all hover:bg-dark-3"
                  aria-label="Alternar tema"
                  title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => { setIsOpen(false); openPortal(); }}
                  className="flex-1 text-center py-3.5 rounded-xl font-black uppercase tracking-widest bg-gradient-to-r from-gold to-gold-light text-dark-1 text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {currentUser ? (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Panel {currentUser.role === 'master' ? 'Master' : currentUser.role === 'admin' ? 'Admin' : 'Cliente'}</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>Portal eSol</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
    </div>
  );
}
