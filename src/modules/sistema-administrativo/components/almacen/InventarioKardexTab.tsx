import React, { useState } from 'react';
import type { ItemInventario, MovimientoKardex } from '../../types/adminTypes';
import { 
  Package, TrendingUp, ArrowDownRight, ArrowUpRight, Search, Filter, History, Box, DollarSign 
} from 'lucide-react';

interface InventarioKardexTabProps {
  inventario: ItemInventario[];
  kardex: MovimientoKardex[];
  onRefresh: () => void;
}

export const InventarioKardexTab: React.FC<InventarioKardexTabProps> = ({
  inventario,
  kardex,
  onRefresh
}) => {
  const [subTab, setSubTab] = useState<'existencias' | 'kardex'>('existencias');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');

  // Categorias unicas
  const categorias = Array.from(new Set(inventario.map(i => i.categoria || 'Sin Categoría')));

  // Totales
  const valorTotalInventario = inventario.reduce((acc, it) => acc + (it.stock_actual * it.precio_promedio), 0);
  const totalArticulos = inventario.reduce((acc, it) => acc + it.stock_actual, 0);
  const bajoStockCount = inventario.filter(it => it.stock_actual <= it.stock_minimo).length;

  const filteredInventario = inventario.filter(it => {
    const matchesSearch = 
      it.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (it.codigo && it.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (it.marca && it.marca.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategoria === 'todas' || it.categoria === selectedCategoria;
    return matchesSearch && matchesCat;
  });

  const filteredKardex = kardex.filter(k => {
    return (
      k.insumo_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.folio_documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Paso 5 del Flujo
            </span>
            <h2 className="text-xl font-bold text-cream">Inventario General y Kardex</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Control de existencias reales sincronizadas con catálogo maestro de insumos y bitácora de movimientos (PEPS/Promedio).
          </p>
        </div>

        {/* Subtab selector */}
        <div className="flex bg-dark-3 p-1 rounded-xl border border-dark-4">
          <button
            onClick={() => setSubTab('existencias')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'existencias' ? 'bg-dark-1 text-gold border border-gold/40 shadow-sm' : 'text-cream-muted hover:text-cream'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Stock y Existencias ({inventario.length})
          </button>
          <button
            onClick={() => setSubTab('kardex')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === 'kardex' ? 'bg-dark-1 text-gold border border-gold/40 shadow-sm' : 'text-cream-muted hover:text-cream'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Movimientos Kardex ({kardex.length})
          </button>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl text-white shadow-md shadow-blue-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-blue-100">Valor Total en Almacén</span>
            <DollarSign className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">
            ${valorTotalInventario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-blue-100 mt-1">Valuación a costo promedio real</p>
        </div>

        <div className="bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-cream-muted">Unidades Físicas</span>
            <Box className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black mt-2 text-cream font-mono">
            {totalArticulos.toLocaleString('es-MX')} <span className="text-xs text-cream-dim font-normal">piezas/unidades</span>
          </div>
          <p className="text-xs text-cream-muted mt-1">{inventario.length} insumos dados de alta</p>
        </div>

        <div className="bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-cream-muted">Alertas de Reorden</span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${bajoStockCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {bajoStockCount > 0 ? `${bajoStockCount} Alertas` : 'OK'}
            </span>
          </div>
          <div className="text-2xl font-black mt-2 text-cream font-mono">
            {bajoStockCount} <span className="text-xs text-cream-dim font-normal">bajo stock mín.</span>
          </div>
          <p className="text-xs text-cream-muted mt-1">Generar solicitud de compra para reabastecer</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder={subTab === 'existencias' ? "Buscar material, código o marca..." : "Buscar en kardex por insumo, folio..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2 focus:border-gold focus:outline-none"
          />
        </div>

        {subTab === 'existencias' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cream-dim" />
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="bg-dark-3 border border-dark-4 rounded-lg text-xs font-semibold px-3 py-2 text-cream/90 focus:outline-none"
            >
              <option value="todas">Todas las Categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Subtab 1: Existencias */}
      {subTab === 'existencias' && (
        <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código / Ítem</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Unidad</th>
                  <th className="py-3 px-4 text-right">Stock Actual</th>
                  <th className="py-3 px-4 text-right">Costo Unit.</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredInventario.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-cream-dim">
                      No se encontraron materiales en inventario.
                    </td>
                  </tr>
                ) : (
                  filteredInventario.map((it) => {
                    const valorTotal = it.stock_actual * it.precio_promedio;
                    const bajoMinimo = it.stock_actual <= it.stock_minimo;

                    return (
                      <tr key={it.insumo_id} className="hover:bg-dark-3/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-cream">{it.nombre}</div>
                          <div className="text-xs text-cream-dim font-mono">
                            {it.codigo ? `Cod: ${it.codigo}` : 'Catálogo Insumos'} {it.marca ? `• ${it.marca}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-dark-3 text-cream/90">
                            {it.categoria || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-semibold text-cream-muted">
                          {it.unidad}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-base text-cream">
                          {it.stock_actual.toLocaleString('es-MX')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-cream-muted">
                          ${it.precio_promedio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          ${valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                            bajoMinimo ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {bajoMinimo ? 'Reorden' : 'Disponible'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Movimientos Kardex */}
      {subTab === 'kardex' && (
        <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Tipo Movimiento</th>
                  <th className="py-3 px-4">Documento / Folio</th>
                  <th className="py-3 px-4">Insumo</th>
                  <th className="py-3 px-4 text-right">Cantidad</th>
                  <th className="py-3 px-4 text-right">Costo Mov.</th>
                  <th className="py-3 px-4 text-right">Saldo Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredKardex.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-cream-dim">
                      No hay registros en el Kardex. Se crearán al recibir compras o entregar a obra.
                    </td>
                  </tr>
                ) : (
                  filteredKardex.map((k) => {
                    const isEntrada = k.tipo === 'entrada_compra' || k.tipo === 'devolucion_sobrante';
                    return (
                      <tr key={k.id} className="hover:bg-dark-3/70 transition-colors">
                        <td className="py-3 px-4 text-xs text-cream-muted font-mono">
                          {new Date(k.fecha).toLocaleString('es-MX')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                            isEntrada ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isEntrada ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {k.tipo.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs text-gold">
                          {k.folio_documento}
                        </td>
                        <td className="py-3 px-4 font-medium text-cream">
                          {k.insumo_nombre}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${isEntrada ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isEntrada ? `+${k.cantidad}` : `-${k.cantidad}`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-cream-muted text-xs">
                          ${k.costo_unitario.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-cream">
                          {k.saldo_existencia}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
