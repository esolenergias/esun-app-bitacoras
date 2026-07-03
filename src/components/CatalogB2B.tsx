import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Percent, Plus, Minus, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { B2BProduct } from '../context/AppContext';

const CATEGORIES = [
  'Paneles Solares',
  'Inversores',
  'Microinversores',
  'Estructuras',
  'Cable Solar',
  'Baterías'
];

// Helper to calculate tiered unit price
const getUnitPrice = (product: B2BProduct, quantity: number): { price: number; tierLabel: string; percentDiscount: number } => {
  let activeTier = product.tiers[0];
  for (const tier of product.tiers) {
    if (quantity >= tier.minQty) {
      activeTier = tier;
    }
  }
  const percentDiscount = Math.round(((product.basePrice - activeTier.price) / product.basePrice) * 100);
  return {
    price: activeTier.price,
    tierLabel: activeTier.label,
    percentDiscount
  };
};

export function CatalogB2B() {
  const { products } = useApp();
  const [activeTab, setActiveTab] = useState<string>('Paneles Solares');
  // Hash map of product quantity selections, key = product.id
  const [cart, setCart] = useState<Record<string, number>>({});

  const handleSetQuantity = (productId: string, val: number) => {
    const safeVal = Math.max(0, val);
    setCart((prev) => ({
      ...prev,
      [productId]: safeVal,
    }));
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  // Compile cart list
  const selectedItems = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      // Find product
      const foundProduct = products.find((p) => p.id === id);

      if (!foundProduct) return null;

      const { price, tierLabel, percentDiscount } = getUnitPrice(foundProduct, qty);
      const subtotal = price * qty;
      const originalSubtotal = foundProduct.basePrice * qty;
      const savings = originalSubtotal - subtotal;

      return {
        product: foundProduct,
        quantity: qty,
        unitPrice: price,
        tierLabel,
        percentDiscount,
        subtotal,
        savings
      };
    })
    .filter(Boolean) as Array<{
      product: B2BProduct;
      quantity: number;
      unitPrice: number;
      tierLabel: string;
      percentDiscount: number;
      subtotal: number;
      savings: number;
    }>;

  const totalCost = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalSavings = selectedItems.reduce((sum, item) => sum + item.savings, 0);

  // Generate WhatsApp Message Link
  const handleRequestQuote = () => {
    const phone = '523112343034'; // Target eSol sales WhatsApp (simulated or configured)
    let message = '¡Hola eSol Energías! Me interesa cotizar los siguientes componentes B2B:\n\n';

    selectedItems.forEach((item) => {
      const formattedPrice = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(item.unitPrice);
      const formattedSubtotal = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(item.subtotal);
      
      message += `• *${item.quantity}x* ${item.product.name}\n`;
      message += `   _P. Unitario:_ ${formattedPrice} (${item.tierLabel})\n`;
      message += `   _Subtotal:_ ${formattedSubtotal}\n\n`;
    });

    const formattedTotal = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalCost);
    if (totalSavings > 0) {
      const formattedSavings = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalSavings);
      message += `*Total Estimado:* ${formattedTotal} MXN\n`;
      message += `*Ahorro Aplicado:* ${formattedSavings} MXN\n\n`;
    } else {
      message += `*Total Estimado:* ${formattedTotal} MXN\n\n`;
    }
    
    message += '¿Me podrían confirmar disponibilidad, tiempos de entrega y el método de facturación? ¡Gracias!';
    
    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  return (
    <section id="catalogo" className="relative py-28 px-6 lg:px-12 bg-dark-2 topo-bg">
      {/* Visual background flares */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gold/5 blur-[120px] pointer-events-none -z-10" />
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-gold/25 bg-gold-muted text-gold-light mb-4">
            Distribución Mayorista
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-cream tracking-tight mb-6">
            Componentes Solares
            <br />
            <span className="shimmer-text font-black">de Primera Línea</span>
          </h2>
          <p className="font-body text-cream-muted text-sm md:text-base leading-relaxed tracking-wide">
            Consulta disponibilidad y simula tus descuentos por volumen en tiempo real. Ajusta las cantidades para ver cómo bajan tus precios por unidad.
          </p>
        </div>

        {/* Tab Selection menu */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 border-b border-dark-4 pb-4">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`relative px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  isActive ? 'text-dark-1' : 'text-cream-muted hover:text-cream hover:bg-dark-3/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCatTab"
                    className="absolute inset-0 bg-gradient-to-r from-gold to-gold-light rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Catalog Content Area: Two-column layout when products are chosen */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Main product view (Spans 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {products
                  .filter((p) => p.category === activeTab && p.active !== false)
                  .map((prod) => {
                  const qty = cart[prod.id] || 0;
                  const { tierLabel, percentDiscount } = getUnitPrice(prod, qty);
                  
                  return (
                    <div
                      key={prod.id}
                      className="group relative flex flex-col justify-between rounded-xl border border-dark-4 bg-dark-1 p-6 hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5 transition-all duration-300"
                    >
                      {/* Product Header */}
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-cream-dim">
                            {prod.brand}
                          </span>
                          <div className="flex flex-col items-end gap-1.5">
                            {prod.stock > 0 ? (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-green-400 border border-green-500/25 px-2 py-0.5 rounded bg-green-500/5">
                                Disponible
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded bg-amber-500/5">
                                Bajo Pedido
                              </span>
                            )}
                            {percentDiscount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black uppercase text-emerald-400">
                                <Percent className="w-3 h-3" />
                                -{percentDiscount}% Ahorro
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-cream-dim border border-dark-4 px-2 py-0.5 rounded bg-dark-2">
                                Escala B2B
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="font-display font-bold text-lg text-cream mb-2 leading-tight">
                          {prod.name}
                        </h3>

                        {/* Specs */}
                        <ul className="space-y-1 mb-6">
                          {prod.specs.map((spec, sIdx) => (
                            <li key={sIdx} className="text-[11px] text-cream-muted flex items-center gap-1.5 font-sans">
                              <span className="w-1 h-1 rounded-full bg-gold" />
                              {spec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Quantity Counter Control & Tier Info */}
                      <div className="border-t border-dark-4 pt-4 mt-auto space-y-3">
                        <div className="flex items-center justify-between gap-3 bg-dark-2 border border-dark-4 rounded-lg p-2">
                          <span className="text-[10px] text-cream-muted uppercase font-bold pl-1.5 select-none">
                            Cantidad:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSetQuantity(prod.id, qty - 1)}
                              className="w-8 h-8 rounded bg-dark-3 flex items-center justify-center text-cream hover:bg-gold hover:text-dark-1 border border-dark-4 hover:border-gold transition-colors duration-200"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={qty === 0 ? '' : qty}
                              onChange={(e) => handleSetQuantity(prod.id, Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="0"
                              className="w-12 h-8 text-center bg-dark-3 text-sm font-bold text-cream border border-dark-4 rounded focus:outline-none focus:border-gold font-mono select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => handleSetQuantity(prod.id, qty + 1)}
                              className="w-8 h-8 rounded bg-dark-3 flex items-center justify-center text-cream hover:bg-gold hover:text-dark-1 border border-dark-4 hover:border-gold transition-colors duration-200"
                              aria-label="Incrementar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Tier Alert Label */}
                        <div className="text-[10px] text-cream-dim text-right font-mono italic">
                          Tolerancia activa: {tierLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pricing Simulator / Order Cart Summary Card (Spans 1 column) */}
          <div className="bg-dark-1 border border-dark-4 rounded-2xl p-6 lg:sticky lg:top-28 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-dark-4 mb-4 text-cream">
              <ShoppingCart className="w-5 h-5 text-gold" />
              <h3 className="font-display font-bold text-base uppercase tracking-wider">
                Simulador de Pedido
              </h3>
              {getCartItemCount() > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-gold text-dark-1 flex items-center justify-center text-[10px] font-black font-mono">
                  {getCartItemCount()}
                </span>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-dark-2 flex items-center justify-center text-cream-dim border border-dark-4 mb-4">
                  <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-xs text-cream-muted leading-relaxed max-w-[200px] mx-auto">
                  Añade unidades en los productos de arriba para calcular tus descuentos y cotización.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* List of items */}
                <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                  {selectedItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center gap-4 text-xs py-1">
                      <div className="flex-1">
                        <h4 className="font-semibold text-cream leading-tight">
                          {item.product.name}
                        </h4>
                      </div>
                      <span className="font-bold text-gold font-mono shrink-0">
                        {item.quantity} {item.product.unit}s
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Math */}
                <div className="border-t border-dark-4 pt-4 space-y-2">
                  <div className="flex justify-between text-base font-bold text-cream border-t border-dark-4/50 pt-2.5 font-display">
                    <span>TOTAL ESTIMADO:</span>
                    <span className="font-mono text-gold">${totalCost.toLocaleString()} MXN</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  onClick={handleRequestQuote}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-gold to-gold-light text-dark-1 text-xs font-black uppercase tracking-widest shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300 mt-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 fill-dark-1" />
                  Solicitar Cotización B2B
                </button>
                <p className="text-[9px] text-cream-dim text-center italic mt-2 leading-relaxed">
                  *Los precios simulados no incluyen IVA y están sujetos a confirmación de stock y tipo de cambio.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
