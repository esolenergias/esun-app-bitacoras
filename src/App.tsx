import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Storytelling3D } from './components/Storytelling3D';
import { SolarCalculator } from './components/SolarCalculator';
import { CatalogB2B } from './components/CatalogB2B';
import { Brands } from './components/Brands';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="relative min-h-screen bg-dark-1 text-cream selection:bg-gold selection:text-dark-1">
      {/* Navigation header */}
      <Nav />

      {/* Main Sections */}
      <main>
        {/* Hero section with sticky animation and integrated services */}
        <Hero />

        {/* Interactive 3D Anteproyecto Storyteller */}
        <Storytelling3D />

        {/* Solar Savings & Financial Payback Calculator */}
        <SolarCalculator />

        {/* B2B Margin/Volume Discount Catalog */}
        <CatalogB2B />

        {/* Grid representing distributed global brands */}
        <Brands />

        {/* Contact coordinates and validated messaging form */}
        <Contact />
      </main>

      {/* Footer detailing copyrights and terms */}
      <Footer />
    </div>
  );
}

export default App;
