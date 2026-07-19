import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Layers, Plus, Save, Activity, Layout, Type } from 'lucide-react';

export default function CmsTab() {
  const { content, updateContent, addPromo, togglePromo, updateHeroText, updatePromoBanner } = useApp();

  const [heroTitle, setHeroTitle] = useState(content.hero.title);
  const [heroSubtitle, setHeroSubtitle] = useState(content.hero.subtitle);
  const [heroProjects, setHeroProjects] = useState(content.hero.statProjects);
  const [heroBrands, setHeroBrands] = useState(content.hero.statBrands);
  const [heroCapacity, setHeroCapacity] = useState(content.hero.statCapacity);
  
  const [bannerActive, setBannerActive] = useState(content.promoBanner.active);
  const [bannerText, setBannerText] = useState(content.promoBanner.text);

  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [newPromoCode, setNewPromoCode] = useState('');

  const handleSaveCMS = () => {
    updateHeroText('title', heroTitle);
    updateHeroText('subtitle', heroSubtitle);
    updateHeroText('statProjects', heroProjects);
    updateHeroText('statBrands', heroBrands);
    updateHeroText('statCapacity', heroCapacity);
    updatePromoBanner(bannerActive, bannerText);
    alert('Cambios de contenido y promociones guardados correctamente en local.');
  };

  const handleAddPromoSubmit = (e) => {
    e.preventDefault();
    if (!newPromoTitle || !newPromoDesc || !newPromoCode) {
      alert('Por favor llena todos los campos de la promoción.');
      return;
    }
    addPromo(newPromoTitle, newPromoDesc, newPromoCode);
    setNewPromoTitle('');
    setNewPromoDesc('');
    setNewPromoCode('');
  };


  // Sync state values when landing page content changes
  useEffect(() => {
    setHeroTitle(content.hero.title);
    setHeroSubtitle(content.hero.subtitle);
    setHeroProjects(content.hero.statProjects);
    setHeroBrands(content.hero.statBrands);
    setHeroCapacity(content.hero.statCapacity);
    setBannerActive(content.promoBanner.active);
    setBannerText(content.promoBanner.text);
  }, [content]);

  return (
    <>                    <div className="space-y-6">
                      <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider border-b border-dark-4 pb-2 select-none">
                        EDITOR CMS DE LANDING PAGE
                      </h3>

                      <div className="grid lg:grid-cols-12 gap-8">
                        {/* Text fields */}
                        <div className="lg:col-span-6 border border-dark-4 bg-dark-2/50 p-6 rounded-2xl space-y-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gold block select-none">Configuración de Textos Principales</span>
                          
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label htmlFor="cms-banner-text" className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block select-none">Texto del Cintillo Superior</label>
                              <input 
                                id="cms-banner-text"
                                type="text"
                                value={bannerText}
                                onChange={(e) => setBannerText(e.target.value)}
                                className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                              />
                              <div className="flex items-center gap-2 mt-1 select-none">
                                <input 
                                  id="cms-banner-active"
                                  type="checkbox"
                                  checked={bannerActive}
                                  onChange={(e) => setBannerActive(e.target.checked)}
                                  className="w-4 h-4 accent-gold"
                                />
                                <label htmlFor="cms-banner-active" className="text-[9.5px] text-cream-muted font-body cursor-pointer">Activar Banner en cabecera</label>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="cms-hero-title" className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block select-none">Título del Hero</label>
                              <input 
                                id="cms-hero-title"
                                type="text"
                                value={heroTitle}
                                onChange={(e) => setHeroTitle(e.target.value)}
                                className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-display"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="cms-hero-sub" className="text-[10px] text-cream-muted uppercase font-bold tracking-wider block select-none">Subtítulo del Hero</label>
                              <textarea 
                                id="cms-hero-sub"
                                value={heroSubtitle}
                                onChange={(e) => setHeroSubtitle(e.target.value)}
                                rows={3}
                                className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors resize-none font-body leading-relaxed"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <label htmlFor="cms-stat-p" className="text-[9px] text-cream-muted uppercase font-bold tracking-wider block select-none">Proyectos</label>
                                <input 
                                  id="cms-stat-p"
                                  type="text"
                                  value={heroProjects}
                                  onChange={(e) => setHeroProjects(e.target.value)}
                                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="cms-stat-b" className="text-[9px] text-cream-muted uppercase font-bold tracking-wider block select-none">Marcas</label>
                                <input 
                                  id="cms-stat-b"
                                  type="text"
                                  value={heroBrands}
                                  onChange={(e) => setHeroBrands(e.target.value)}
                                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="cms-stat-c" className="text-[9px] text-cream-muted uppercase font-bold tracking-wider block select-none">Capacidad</label>
                                <input 
                                  id="cms-stat-c"
                                  type="text"
                                  value={heroCapacity}
                                  onChange={(e) => setHeroCapacity(e.target.value)}
                                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                                />
                              </div>
                            </div>

                            <button
                              onClick={handleSaveCMS}
                              className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer select-none flex items-center gap-1.5 self-start"
                            >
                              <Save className="w-4 h-4" />
                              <span>Guardar Cambios</span>
                            </button>
                          </div>
                        </div>

                        {/* Promo campaigns management */}
                        <div className="lg:col-span-6 border border-dark-4 bg-dark-2/50 p-6 rounded-2xl space-y-6">
                          <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold block select-none">Administrador de Promociones</span>
                            
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                              {content.promos.map(promo => (
                                <div key={promo.id} className="p-3 bg-dark-1 border border-dark-4 rounded-xl flex justify-between items-center text-xs">
                                  <div>
                                    <p className="font-bold text-cream">{promo.title}</p>
                                    <p className="text-[10px] text-cream-dim mt-0.5 font-mono">Código: {promo.discountCode}</p>
                                  </div>
                                  <button
                                    onClick={() => togglePromo(promo.id)}
                                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                                      promo.active
                                        ? 'bg-green-500/10 text-green-400 border-green-500/25'
                                        : 'bg-dark-3 text-cream-dim border-dark-4'
                                    }`}
                                  >
                                    {promo.active ? 'Activa' : 'Pausada'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Add promo campaign */}
                          <form onSubmit={handleAddPromoSubmit} className="border-t border-dark-4 pt-5 space-y-4">
                            <span className="text-[10px] font-black text-gold uppercase tracking-widest block select-none">Agregar Nueva Campaña</span>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label htmlFor="new-promo-t" className="text-[9px] text-cream-muted uppercase font-bold tracking-wider block select-none">Título</label>
                                <input 
                                  id="new-promo-t"
                                  type="text"
                                  placeholder="Ej. Promo Verano"
                                  value={newPromoTitle}
                                  onChange={(e) => setNewPromoTitle(e.target.value)}
                                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="new-promo-c" className="text-[9px] text-cream-muted uppercase font-bold tracking-wider block select-none">Código</label>
                                <input 
                                  id="new-promo-c"
                                  type="text"
                                  placeholder="ESOLSUN10"
                                  value={newPromoCode}
                                  onChange={(e) => setNewPromoCode(e.target.value)}
                                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="new-promo-d" className="text-[9px] text-cream-muted uppercase font-bold tracking-wider block select-none">Descripción corta</label>
                              <input 
                                id="new-promo-d"
                                type="text"
                                placeholder="10% extra en paneles LONGi de más de 20kW"
                                value={newPromoDesc}
                                onChange={(e) => setNewPromoDesc(e.target.value)}
                                className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                              />
                            </div>

                            <button
                              type="submit"
                              className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer select-none flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                              <span>Agregar Promoción</span>
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </>

  );
}
