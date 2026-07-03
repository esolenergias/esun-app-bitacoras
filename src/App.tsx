import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Storytelling3D } from './components/Storytelling3D';
import { SolarCalculator } from './components/SolarCalculator';
import { CatalogB2B } from './components/CatalogB2B';
import { Brands } from './components/Brands';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Portal } from './components/Portal';
import { LoginModal } from './components/LoginModal';
import PresupuestoDashboardPage from './components/cotizador/PresupuestoDashboardPage';

function AppContent() {
  const { currentView, isPortalOpen, closePortal, currentUser, content } = useApp();

  const searchParams = new URLSearchParams(window.location.search);
  const presupuestoId = searchParams.get('presupuestoId');

  if (presupuestoId) {
    return <PresupuestoDashboardPage id={presupuestoId} />;
  }

  // Automatically clean up old chatbot test leads to avoid CRM contamination
  useEffect(() => {
    try {
      const saved = localStorage.getItem('esol_leads');
      if (saved) {
        const leads = JSON.parse(saved);
        const filtered = leads.filter((l: any) => l.source !== 'chatbot');
        if (leads.length !== filtered.length) {
          localStorage.setItem('esol_leads', JSON.stringify(filtered));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.error('Error cleaning up chatbot leads:', e);
    }
  }, []);

  if (currentView === 'portal') {
    return <Portal />;
  }

  return (
    <div className="relative min-h-screen bg-dark-1 text-cream selection:bg-gold selection:text-dark-1">
      {/* Navigation header (which includes top promo banner internally) */}
      <Nav />

      {/* Main Sections */}
      <main>
        {/* Hero section with sticky animation and integrated services */}
        {content.sections?.hero !== false && <Hero />}

        {/* Interactive 3D Anteproyecto Storyteller */}
        {content.sections?.storytelling3d !== false && <Storytelling3D />}

        {/* Solar Savings & Financial Payback Calculator */}
        {content.sections?.calculator !== false && <SolarCalculator />}

        {/* B2B Margin/Volume Discount Catalog */}
        {content.sections?.catalog !== false && <CatalogB2B />}

        {/* Grid representing distributed global brands */}
        {content.sections?.brands !== false && <Brands />}

        {/* Contact coordinates and validated messaging form */}
        {content.sections?.contact !== false && <Contact />}
      </main>

      {/* Footer detailing copyrights and terms */}
      <Footer />

      {/* Floating Login Modal when portal is opened but user is not logged in */}
      <LoginModal isOpen={isPortalOpen && !currentUser} onClose={closePortal} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
