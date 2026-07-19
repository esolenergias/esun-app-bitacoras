import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import type { B2BProduct } from '../../../context/AppContext';
import { Package, Plus, Save, Trash2, Edit, X, Bot, Sparkles, RefreshCw, Layers, DollarSign, Activity, Cpu } from 'lucide-react';

const CATEGORIES = [
  'Paneles Solares',
  'Inversores',
  'Microinversores',
  'Estructuras',
  'Cable Solar',
  'Baterías'
];

export default function InventoryTab() {
  const { currentUser, products, addProduct, updateProduct, deleteProduct } = useApp();

  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Paneles Solares');
  const [newProdBasePrice, setNewProdBasePrice] = useState<number>(0);
  const [newProdUnit, setNewProdUnit] = useState('pz');
  const [newProdSpecs, setNewProdSpecs] = useState('');
  const [newProdBulkMin, setNewProdBulkMin] = useState<number>(11);
  const [newProdBulkPrice, setNewProdBulkPrice] = useState<number>(0);
  const [newProdDistMin, setNewProdDistMin] = useState<number>(30);
  const [newProdDistPrice, setNewProdDistPrice] = useState<number>(0);
  const [inventoryActiveTab, setInventoryActiveTab] = useState('Paneles Solares');
  const [newProdStock, setNewProdStock] = useState<number>(50);
  const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [scrapingStatus, setScrapingStatus] = useState<'idle' | 'scraping' | 'success' | 'error'>('idle');
  const handleScrapeProduct = async () => {
    if (!scrapingUrl) return;
    setScrapingStatus('scraping');
    
    try {
      const apiKey = localStorage.getItem('cfe_gemini_api_key') || '';
      const model = localStorage.getItem('cfe_gemini_model') || 'gemini-2.5-flash';
      
      let productData: any = null;
      
      if (apiKey) {
        let htmlText = '';
        let fetchSuccess = false;
        let lastErrorMsg = '';

        // Try Proxy 1: corsproxy.io (reliable and fast)
        try {
          const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(scrapingUrl)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            htmlText = await response.text();
            fetchSuccess = true;
          } else {
            lastErrorMsg = `corsproxy.io returned status ${response.status}`;
          }
        } catch (e: any) {
          lastErrorMsg = e.message || String(e);
        }

        // Try Proxy 2: allorigins.win (fallback)
        if (!fetchSuccess) {
          try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(scrapingUrl)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
              htmlText = await response.text();
              fetchSuccess = true;
            } else {
              lastErrorMsg = `allorigins.win returned status ${response.status}`;
            }
          } catch (e: any) {
            lastErrorMsg = e.message || String(e);
          }
        }

        if (!fetchSuccess) {
          throw new Error(`No se pudo conectar a los servicios de extracción (CORS Proxy). Detalle: ${lastErrorMsg}`);
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // Clean HTML from nav, scripts, styles
        doc.querySelectorAll('script, style, iframe, nav, footer, header, noscript, svg').forEach(el => el.remove());
        
        let textContent = doc.body.textContent || '';
        textContent = textContent.replace(/\s+/g, ' ').trim();
        
        if (textContent.length > 12000) {
          textContent = textContent.substring(0, 12000);
        }
        
        const prompt = `Analiza el siguiente contenido extraído de la ficha técnica de un producto fotovoltaico/solar en la URL "${scrapingUrl}":
        
        TEXTO EXTRAÍDO:
        \"\"\"
        ${textContent}
        \"\"\"
        
        Extrae la información técnica clave para el catálogo mayorista y genera un JSON con la siguiente estructura y formato exacto. No incluyas ningún texto explicativo o markdown antes o después del JSON.
        
        Estructura del JSON:
        {
          "category": "Paneles Solares" | "Inversores" | "Microinversores" | "Estructuras" | "Cable Solar" | "Baterías" (elige uno de estos valores exactos según corresponda),
          "brand": "Marca del producto (ej. LONGi, Solis, Jinko, Fronius, Deye, Hoymiles, etc., sé breve)",
          "name": "Nombre completo y modelo del producto (ej. Panel Solar LONGi Hi-MO 6 550W)",
          "basePrice": precio base estimado en pesos mexicanos (MXN) para venta unitaria en México. Si en el texto se indica en USD u otra moneda, conviértelo a pesos. Si no hay precios, genera una estimación de precio de lista mayorista realista en MXN según el tipo de producto y capacidad (ej. un panel de 550W vale unos $2600-$2900 MXN, un microinversor de 1500W unos $5500-$6500 MXN, un inversor de 10kW trifásico unos $17000-$19000 MXN, etc.). Debe ser un número entero.,
          "unit": "pz" | "equipo" | "kit" | "rollo" | "módulo" (elige el más adecuado según el tipo de producto),
          "specs": ["especificación técnica 1 (corta, ej. Potencia: 550W)", "especificación 2 (ej. Eficiencia: 21.3%)", "especificación 3 (ej. Garantía: 12 años)", "especificación 4"],
          "tiers": [
            {"minQty": 1, "price": precioBase, "label": "Precio Regular"},
            {"minQty": 11, "price": precioMayoreo, "label": "Mayoreo (11+ pzs)"},
            {"minQty": 30, "price": precioDistribuidor, "label": "Distribuidor (30+ pzs)"}
          ]
        }
        
        Reglas de descuento de volumen si los estimas:
        - Mayoreo (minQty aproximado según categoría, precio es un 5-7% de descuento respecto al base).
        - Distribuidor (minQty aproximado según categoría, precio es un 10-15% de descuento respecto al base).`;
        
        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        };
        
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );
        
        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          throw new Error(`Gemini API returned status ${geminiRes.status}: ${errText}`);
        }
        
        const resultJson = await geminiRes.json();
        const resText = resultJson.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        let cleanedText = resText.trim();
        if (cleanedText.startsWith('```json')) cleanedText = cleanedText.substring(7);
        else if (cleanedText.startsWith('```')) cleanedText = cleanedText.substring(3);
        if (cleanedText.endsWith('```')) cleanedText = cleanedText.substring(0, cleanedText.length - 3);
        cleanedText = cleanedText.trim();
        
        productData = JSON.parse(cleanedText);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const lowerUrl = scrapingUrl.toLowerCase();
        let mockCategory = 'Paneles Solares';
        let mockBrand = 'LONGi Solar';
        let mockName = 'Panel LONGi LR5-72HPH 550W';
        let mockPrice = 2850;
        let mockSpecs = ['Potencia: 550W', 'Eficiencia: 21.3%', 'Celdas: 144 Mono', 'Garantía: 12 años'];
        let mockUnit = 'pz';
        
        if (lowerUrl.includes('solis') || lowerUrl.includes('inversor')) {
          mockCategory = 'Inversores';
          mockBrand = 'Solis';
          mockName = 'Inversor Solis 15kW Trifásico 220V';
          mockPrice = 22500;
          mockSpecs = ['Capacidad: 15kW', 'Eficiencia: 98.5%', 'MPPTs: 2 duales', 'WiFi Monitoreo'];
          mockUnit = 'equipo';
        } else if (lowerUrl.includes('hoymiles') || lowerUrl.includes('micro')) {
          mockCategory = 'Microinversores';
          mockBrand = 'Hoymiles';
          mockName = 'Microinversor Hoymiles HM-1200';
          mockPrice = 5400;
          mockSpecs = ['Capacidad: 1200W', 'MPPTs duales independientes', 'Fácil instalación'];
          mockUnit = 'equipo';
        } else if (lowerUrl.includes('bateria') || lowerUrl.includes('lithium') || lowerUrl.includes('pylontech')) {
          mockCategory = 'Baterías';
          mockBrand = 'Pylontech';
          mockName = 'Batería Litio Pylontech US2000C 2.4kWh';
          mockPrice = 21000;
          mockSpecs = ['Capacidad: 2.4kWh', 'Ciclos útiles: >6000', 'Voltaje: 48V'];
          mockUnit = 'módulo';
        }
        
        productData = {
          category: mockCategory,
          brand: mockBrand,
          name: mockName,
          basePrice: mockPrice,
          unit: mockUnit,
          specs: mockSpecs,
          tiers: [
            { minQty: 1, price: mockPrice, label: 'Precio Regular' },
            { minQty: 11, price: Math.round(mockPrice * 0.94), label: `Mayoreo (11+ ${mockUnit}s)` },
            { minQty: 30, price: Math.round(mockPrice * 0.88), label: `Distribuidor (30+ ${mockUnit}s)` }
          ]
        };
        alert('AVISO: Como no tienes configurada la API Key de Gemini en Ajustes, se generó una simulación basada en la URL.');
      }
      
      if (productData) {
        setNewProdName(productData.name || '');
        setNewProdBrand(productData.brand || '');
        setNewProdCategory(productData.category || 'Paneles Solares');
        setNewProdBasePrice(productData.basePrice || 0);
        setNewProdUnit(productData.unit || 'pz');
        setNewProdSpecs((productData.specs || []).join(', '));
        
        if (productData.tiers?.[1]) {
          setNewProdBulkMin(productData.tiers[1].minQty || 11);
          setNewProdBulkPrice(productData.tiers[1].price || 0);
        }
        if (productData.tiers?.[2]) {
          setNewProdDistMin(productData.tiers[2].minQty || 30);
          setNewProdDistPrice(productData.tiers[2].price || 0);
        }
        setScrapingStatus('success');
        alert('¡Producto autocompletado con éxito por la IA!');
      } else {
        throw new Error('La respuesta de la IA no contiene un formato de producto válido.');
      }
    } catch (err: any) {
      console.error(err);
      setScrapingStatus('error');
      alert(`Error al autocompletar producto: ${err.message || err}`);
    }
  };

  const handleSetStock = (id: string, newStock: number) => {
    updateProduct(id, {
      stock: newStock,
      active: newStock > 0
    });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdBrand || newProdBasePrice <= 0) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    const specsArray = newProdSpecs
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const tiers = [
      { minQty: 1, price: Number(newProdBasePrice), label: 'Precio Regular' },
      { minQty: Number(newProdBulkMin), price: Number(newProdBulkPrice), label: `Mayoreo (${newProdBulkMin}+ ${newProdUnit}s)` },
      { minQty: Number(newProdDistMin), price: Number(newProdDistPrice), label: `Distribuidor (${newProdDistMin}+ ${newProdUnit}s)` }
    ];

    addProduct({
      category: newProdCategory,
      name: newProdName,
      brand: newProdBrand,
      basePrice: Number(newProdBasePrice),
      unit: newProdUnit,
      specs: specsArray,
      tiers,
      stock: Number(newProdStock),
      active: Number(newProdStock) > 0
    });

    // Reset Form
    setNewProdName('');
    setNewProdBrand('');
    setNewProdBasePrice(0);
    setNewProdUnit('pz');
    setNewProdSpecs('');
    setNewProdBulkMin(11);
    setNewProdBulkPrice(0);
    setNewProdDistMin(30);
    setNewProdDistPrice(0);
    setNewProdStock(50);
    setScrapingUrl('');
    setScrapingStatus('idle');
    setShowAddProductForm(false);
  };

  return (
    <>                    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                      <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
                        <div>
                          <h3 className="font-display font-black text-xl text-cream">
                            GESTIÓN DE PRODUCTOS B2B
                          </h3>
                          <p className="text-xs text-cream-muted mt-1 leading-relaxed">
                            Administra el catálogo de distribución mayorista: habilita o deshabilita productos por stock, agrega nuevas opciones, y define las escalas de precios por volumen.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddProductForm(!showAddProductForm)}
                          className="px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-gold/10 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          {showAddProductForm ? 'Cerrar Formulario' : 'Agregar Producto'}
                        </button>
                      </div>

                      {/* Add Product Form */}
                      {showAddProductForm && (
                        <div className="border border-gold/20 bg-dark-2/45 p-6 rounded-2xl space-y-4 animate-[fadeIn_0.3s_ease-out] max-w-4xl">
                          <h4 className="text-xs font-black uppercase tracking-widest text-gold select-none">Registrar Nuevo Producto Mayorista</h4>
                          
                          {/* AI Link Scraper Input */}
                          <div className="bg-dark-1 border border-dark-4 p-4 rounded-xl space-y-3 mb-2">
                            <label className="text-[10px] text-gold uppercase font-mono tracking-widest block font-bold">
                              Importar Producto desde URL con IA
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                placeholder="Pega el link de la ficha del producto (ej. https://ejemplo.com/panel-longi)"
                                value={scrapingUrl}
                                onChange={(e) => setScrapingUrl(e.target.value)}
                                className="flex-1 bg-dark-2 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2 rounded-lg text-xs focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleScrapeProduct}
                                disabled={scrapingStatus === 'scraping' || !scrapingUrl}
                                className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {scrapingStatus === 'scraping' ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Procesando...
                                  </>
                                ) : (
                                  <>
                                    <Cpu className="w-3.5 h-3.5" />
                                    Autocompletar con IA
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[9px] text-cream-muted leading-relaxed">
                              La IA de eSol extraerá el título, marca, especificaciones, unidad e incluso estimará un precio en pesos (MXN) basado en el componente.
                            </p>
                          </div>

                          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-body text-cream-dim">
                            <div className="space-y-1.5">
                              <label className="text-[9.5px] uppercase font-bold text-cream select-none">Categoría</label>
                              <select
                                value={newProdCategory}
                                onChange={(e) => setNewProdCategory(e.target.value)}
                                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                              >
                                {CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9.5px] uppercase font-bold text-cream select-none">Marca</label>
                              <input
                                type="text"
                                placeholder="Ej. Jinko Solar, Solis..."
                                value={newProdBrand}
                                onChange={(e) => setNewProdBrand(e.target.value)}
                                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9.5px] uppercase font-bold text-cream select-none">Nombre de Producto</label>
                              <input
                                type="text"
                                placeholder="Ej. Tiger Pro 550W..."
                                value={newProdName}
                                onChange={(e) => setNewProdName(e.target.value)}
                                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9.5px] uppercase font-bold text-cream select-none">Precio Base ($ MXN)</label>
                              <input
                                type="number"
                                placeholder="Base"
                                value={newProdBasePrice || ''}
                                onChange={(e) => setNewProdBasePrice(Number(e.target.value))}
                                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9.5px] uppercase font-bold text-cream select-none">Unidad de Medida</label>
                              <select
                                value={newProdUnit}
                                onChange={(e) => setNewProdUnit(e.target.value)}
                                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                              >
                                <option value="pz">Pieza (pz)</option>
                                <option value="equipo">Equipo (equipo)</option>
                                <option value="kit">Kit (kit)</option>
                                <option value="rollo">Rollo (rollo)</option>
                                <option value="módulo">Módulo (módulo)</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9.5px] uppercase font-bold text-gold font-black select-none">Cantidad Stock (Inventario)</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="Ej. 50"
                                value={newProdStock}
                                onChange={(e) => setNewProdStock(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                              />
                            </div>

                            <div className="space-y-1.5 md:col-span-3">
                              <label className="text-[9.5px] uppercase font-bold text-cream select-none">Especificaciones (separadas por comas)</label>
                              <input
                                type="text"
                                placeholder="Ej. Potencia: 550W, Eficiencia: 21%, Garantía: 12 años"
                                value={newProdSpecs}
                                onChange={(e) => setNewProdSpecs(e.target.value)}
                                className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none"
                              />
                            </div>

                            <div className="md:col-span-3 border-t border-dark-4/50 pt-3 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gold select-none block mb-3">Matriz de Descuentos (Escala B2B)</span>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9.5px] uppercase font-bold text-cream select-none">Mayoreo: Min. Cantidad</label>
                                  <input
                                    type="number"
                                    value={newProdBulkMin || ''}
                                    onChange={(e) => setNewProdBulkMin(Number(e.target.value))}
                                    className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9.5px] uppercase font-bold text-cream select-none">Mayoreo: Precio Unitario</label>
                                  <input
                                    type="number"
                                    value={newProdBulkPrice || ''}
                                    onChange={(e) => setNewProdBulkPrice(Number(e.target.value))}
                                    className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9.5px] uppercase font-bold text-cream select-none">Distribuidor: Min. Cantidad</label>
                                  <input
                                    type="number"
                                    value={newProdDistMin || ''}
                                    onChange={(e) => setNewProdDistMin(Number(e.target.value))}
                                    className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9.5px] uppercase font-bold text-cream select-none">Distribuidor: Precio Unitario</label>
                                  <input
                                    type="number"
                                    value={newProdDistPrice || ''}
                                    onChange={(e) => setNewProdDistPrice(Number(e.target.value))}
                                    className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-3 pt-3 flex justify-end gap-3 select-none">
                              <button
                                type="button"
                                onClick={() => setShowAddProductForm(false)}
                                className="px-4 py-2 border border-dark-4 text-cream hover:bg-dark-3 rounded-lg cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2 bg-gold hover:bg-gold-light text-dark-1 font-black rounded-lg cursor-pointer"
                              >
                                Registrar Producto
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Category Tabs */}
                      <div className="flex flex-wrap gap-2 border-b border-dark-4 pb-4 select-none">
                        {CATEGORIES.map((cat) => {
                          const isActive = inventoryActiveTab === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => setInventoryActiveTab(cat)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                isActive ? 'bg-gold/10 text-gold border border-gold/25 font-black' : 'text-cream-dim hover:text-cream hover:bg-dark-2'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>

                      {/* Products List */}
                      <div className="border border-dark-4 bg-dark-2/40 rounded-2xl overflow-hidden p-5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gold block mb-4 select-none">
                          Productos en {inventoryActiveTab} ({products.filter(p => p.category === inventoryActiveTab).length})
                        </span>

                        <div className="overflow-x-auto select-text">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-dark-4 text-cream-dim text-[10px] font-mono uppercase tracking-wider select-none">
                                <th className="py-3">Producto</th>
                                <th className="py-3">Matriz de Precios</th>
                                <th className="py-3">Cantidad Stock</th>
                                <th className="py-3">Estatus</th>
                                <th className="py-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-4/45">
                              {products
                                .filter(p => p.category === inventoryActiveTab)
                                .map(prod => (
                                  <tr key={prod.id} className="hover:bg-dark-3/15 transition-colors">
                                    <td className="py-4 pr-4">
                                      <div className="font-bold text-cream text-[13px]">{prod.name}</div>
                                      <div className="text-[10.5px] text-gold font-bold mt-0.5 select-none">{prod.brand}</div>
                                      <div className="flex flex-wrap gap-1 mt-2 select-none">
                                        {prod.specs.map((spec, i) => (
                                          <span key={i} className="px-1.5 py-0.5 bg-dark-3 text-cream-muted border border-dark-4 text-[9px] rounded font-body">
                                            {spec}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="py-4 font-mono text-[11px] space-y-1">
                                      <div>
                                        <span className="text-cream-dim font-bold">1+ {prod.unit}:</span>{' '}
                                        <span className="text-cream font-bold">${prod.basePrice.toLocaleString()} MXN</span>
                                      </div>
                                      {prod.tiers[1] && (
                                        <div>
                                          <span className="text-cream-dim font-bold">{prod.tiers[1].minQty}+ {prod.unit}s:</span>{' '}
                                          <span className="text-gold font-bold">${prod.tiers[1].price.toLocaleString()} MXN</span>
                                        </div>
                                      )}
                                      {prod.tiers[2] && (
                                        <div>
                                          <span className="text-cream-dim font-bold">{prod.tiers[2].minQty}+ {prod.unit}s:</span>{' '}
                                          <span className="text-green-400 font-bold">${prod.tiers[2].price.toLocaleString()} MXN</span>
                                        </div>
                                      )}
                                    </td>
                                    {/* Cantidad Stock Controller */}
                                    <td className="py-4 font-mono select-none">
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleSetStock(prod.id, Math.max(0, (prod.stock || 0) - 1))}
                                          className="w-6 h-6 rounded bg-dark-3 hover:bg-gold hover:text-dark-1 border border-dark-4 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min="0"
                                          value={prod.stock === undefined ? 0 : prod.stock}
                                          onChange={(e) => handleSetStock(prod.id, Math.max(0, parseInt(e.target.value) || 0))}
                                          className="w-12 h-6 text-center bg-dark-3 text-cream border border-dark-4 rounded text-xs focus:outline-none focus:border-gold font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSetStock(prod.id, (prod.stock || 0) + 1)}
                                          className="w-6 h-6 rounded bg-dark-3 hover:bg-gold hover:text-dark-1 border border-dark-4 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </td>
                                    
                                    {/* Estatus Stock Badge */}
                                    <td className="py-4 select-none">
                                      <button
                                        onClick={() => updateProduct(prod.id, { active: !prod.active })}
                                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 cursor-pointer ${
                                          prod.active
                                            ? 'bg-green-500/10 text-green-400 border-green-500/25'
                                            : 'bg-red-500/10 text-red-400 border-red-500/25'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${prod.active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                        {prod.active ? 'Disponible' : 'Agotado'}
                                      </button>
                                    </td>
                                    
                                    {/* Acciones */}
                                    <td className="py-4 text-right select-none pr-2 space-x-1.5">
                                      <button
                                        onClick={() => setEditingProduct(prod)}
                                        className="p-2 bg-gold/10 hover:bg-gold text-gold hover:text-dark-1 rounded-lg border border-gold/25 transition-all cursor-pointer"
                                        title="Editar producto"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm(`¿Estás seguro de eliminar el producto "${prod.name}"?`)) {
                                            deleteProduct(prod.id);
                                          }
                                        }}
                                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/20 transition-all cursor-pointer"
                                        title="Eliminar producto"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              {products.filter(p => p.category === inventoryActiveTab).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-cream-muted font-body">
                                    No hay productos registrados en esta categoría.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* EDIT PRODUCT MODAL OVERLAY */}
                      {editingProduct && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-1/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                          <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                            <div className="flex justify-between items-center border-b border-dark-4 pb-3 select-none">
                              <h4 className="text-sm font-black uppercase tracking-widest text-gold flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Editar Producto Mayorista
                              </h4>
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="p-1 text-cream-dim hover:text-cream hover:bg-dark-3 rounded-lg cursor-pointer"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              if (!editingProduct.name || !editingProduct.brand || editingProduct.basePrice <= 0) {
                                alert('Por favor completa los campos obligatorios.');
                                return;
                              }
                              
                              const specsVal = Array.isArray(editingProduct.specs) 
                                ? editingProduct.specs 
                                : (editingProduct.specs as unknown as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
                              
                              updateProduct(editingProduct.id, {
                                name: editingProduct.name,
                                brand: editingProduct.brand,
                                category: editingProduct.category,
                                basePrice: Number(editingProduct.basePrice),
                                unit: editingProduct.unit,
                                specs: specsVal,
                                stock: Number(editingProduct.stock),
                                active: Number(editingProduct.stock) > 0,
                                tiers: [
                                  { minQty: 1, price: Number(editingProduct.basePrice), label: 'Precio Regular' },
                                  { minQty: editingProduct.tiers[1]?.minQty || 11, price: Number(editingProduct.tiers[1]?.price || Math.round(editingProduct.basePrice * 0.94)), label: `Mayoreo (${editingProduct.tiers[1]?.minQty || 11}+ ${editingProduct.unit}s)` },
                                  { minQty: editingProduct.tiers[2]?.minQty || 30, price: Number(editingProduct.tiers[2]?.price || Math.round(editingProduct.basePrice * 0.88)), label: `Distribuidor (${editingProduct.tiers[2]?.minQty || 30}+ ${editingProduct.unit}s)` }
                                ]
                              });
                              
                              setEditingProduct(null);
                              alert('Producto actualizado con éxito.');
                            }} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-body text-cream-dim">
                              
                              <div className="space-y-1.5">
                                <label className="text-[9.5px] uppercase font-bold text-cream select-none">Categoría</label>
                                <select
                                  value={editingProduct.category}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                  className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                                >
                                  {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9.5px] uppercase font-bold text-cream select-none">Marca</label>
                                <input
                                  type="text"
                                  value={editingProduct.brand}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                  className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9.5px] uppercase font-bold text-cream select-none">Nombre de Producto</label>
                                <input
                                  type="text"
                                  value={editingProduct.name}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                  className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none"
                                />
                              </div>
                              
                              <div className="space-y-1.5">
                                <label className="text-[9.5px] uppercase font-bold text-cream select-none">Precio Base ($ MXN)</label>
                                <input
                                  type="number"
                                  value={editingProduct.basePrice || ''}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: Number(e.target.value) })}
                                  className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9.5px] uppercase font-bold text-cream select-none">Unidad de Medida</label>
                                <select
                                  value={editingProduct.unit}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                                  className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                                >
                                  <option value="pz">Pieza (pz)</option>
                                  <option value="equipo">Equipo (equipo)</option>
                                  <option value="kit">Kit (kit)</option>
                                  <option value="rollo">Rollo (rollo)</option>
                                  <option value="módulo">Módulo (módulo)</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9.5px] uppercase font-bold text-gold font-black select-none">Cantidad Stock (Inventario)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingProduct.stock === undefined ? 0 : editingProduct.stock}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                                  className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                />
                              </div>
                              
                              <div className="space-y-1.5 md:col-span-3">
                                <label className="text-[9.5px] uppercase font-bold text-cream select-none">Especificaciones (separadas por comas)</label>
                                <input
                                  type="text"
                                  value={Array.isArray(editingProduct.specs) ? editingProduct.specs.join(', ') : editingProduct.specs}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, specs: e.target.value as any })}
                                  className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none"
                                />
                              </div>
 
                              <div className="md:col-span-3 border-t border-dark-4/50 pt-3 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gold select-none block mb-3">Matriz de Descuentos (Escala B2B)</span>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
                                  <div className="space-y-1.5 font-sans">
                                    <label className="text-[9.5px] uppercase font-bold text-cream select-none">Mayoreo: Min. Cantidad</label>
                                    <input
                                      type="number"
                                      value={editingProduct.tiers[1]?.minQty || 11}
                                      onChange={(e) => {
                                        const t = [...editingProduct.tiers];
                                        if (!t[1]) t[1] = { minQty: 11, price: 0, label: '' };
                                        t[1].minQty = Number(e.target.value);
                                        setEditingProduct({ ...editingProduct, tiers: t });
                                      }}
                                      className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1.5 font-sans">
                                    <label className="text-[9.5px] uppercase font-bold text-cream select-none">Mayoreo: Precio Unitario</label>
                                    <input
                                      type="number"
                                      value={editingProduct.tiers[1]?.price || 0}
                                      onChange={(e) => {
                                        const t = [...editingProduct.tiers];
                                        if (!t[1]) t[1] = { minQty: 11, price: 0, label: '' };
                                        t[1].price = Number(e.target.value);
                                        setEditingProduct({ ...editingProduct, tiers: t });
                                      }}
                                      className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1.5 font-sans">
                                    <label className="text-[9.5px] uppercase font-bold text-cream select-none">Distribuidor: Min. Cantidad</label>
                                    <input
                                      type="number"
                                      value={editingProduct.tiers[2]?.minQty || 30}
                                      onChange={(e) => {
                                        const t = [...editingProduct.tiers];
                                        if (!t[2]) t[2] = { minQty: 30, price: 0, label: '' };
                                        t[2].minQty = Number(e.target.value);
                                        setEditingProduct({ ...editingProduct, tiers: t });
                                      }}
                                      className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1.5 font-sans">
                                    <label className="text-[9.5px] uppercase font-bold text-cream select-none">Distribuidor: Precio Unitario</label>
                                    <input
                                      type="number"
                                      value={editingProduct.tiers[2]?.price || 0}
                                      onChange={(e) => {
                                        const t = [...editingProduct.tiers];
                                        if (!t[2]) t[2] = { minQty: 30, price: 0, label: '' };
                                        t[2].price = Number(e.target.value);
                                        setEditingProduct({ ...editingProduct, tiers: t });
                                      }}
                                      className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-cream px-3 py-2.5 rounded-lg focus:outline-none font-mono"
                                    />
                                  </div>
                                </div>
                              </div>
 
                              <div className="md:col-span-3 pt-3 flex justify-end gap-3 select-none">
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(null)}
                                  className="px-4 py-2 border border-dark-4 text-cream hover:bg-dark-3 rounded-lg cursor-pointer font-sans"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  className="px-5 py-2 bg-gold hover:bg-gold-light text-dark-1 font-black rounded-lg cursor-pointer font-sans"
                                >
                                  Guardar Cambios
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  </>

  );
}
