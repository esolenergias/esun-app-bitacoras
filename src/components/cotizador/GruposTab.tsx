import React, { useEffect, useState } from 'react';
import { getAllSavedGroups } from '../../lib/cotizadorService';
import type { PresupuestoConcepto } from '../../types/cotizador';
import { 
  Folder, Package, Search, ChevronRight, ChevronDown, Loader2, AlertTriangle 
} from 'lucide-react';

interface SavedGroupItem {
  group: PresupuestoConcepto;
  insumos: PresupuestoConcepto[];
}

export default function GruposTab() {
  const [groups, setGroups] = useState<SavedGroupItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSavedGroups();
      // Remove groups with duplicate names to keep it clean, or show all
      setGroups(data);
    } catch (err: any) {
      console.error('Error loading saved groups:', err);
      setError('No se pudieron cargar los grupos de insumos guardados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const formatCurrencyMXN = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(val);
  };

  const filteredGroups = groups.filter(g => {
    const query = searchTerm.toLowerCase();
    const groupMatch = g.group.description.toLowerCase().includes(query);
    const insumosMatch = g.insumos.some(
      ins => ins.description.toLowerCase().includes(query) || (ins.matriz?.code || '').toLowerCase().includes(query)
    );
    return groupMatch || insumosMatch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Description Header */}
      <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
        <div className="space-y-1">
          <h2 className="font-display font-black text-sm text-cream uppercase tracking-wider flex items-center gap-2">
            <Folder className="w-4 h-4 text-gold stroke-[2.5]" />
            <span>Grupos de Insumos</span>
          </h2>
          <p className="text-xs text-cream-dim leading-relaxed">
            Catálogo global de grupos de insumos locales creados en tus presupuestos. Puedes consultarlos y visualizarlos aquí.
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center select-none">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-cream-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de grupo o insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-2 border border-dark-4 focus:border-gold/40 text-xs text-cream placeholder-cream-muted rounded-xl focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center select-none">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-xs text-cream-dim">Cargando catálogo de grupos...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-3 select-none">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-400 font-medium">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="bg-dark-2/40 border border-dark-4 border-dashed rounded-3xl p-12 text-center select-none">
          <Folder className="w-10 h-10 text-cream-muted mx-auto mb-3 opacity-30" />
          <p className="text-xs font-bold text-cream-dim">No se encontraron grupos de insumos</p>
          <p className="text-[10px] text-cream-muted mt-1 max-w-sm mx-auto">
            Crea nuevos grupos dentro del desglose de conceptos de tus presupuestos para que se registren automáticamente en este catálogo.
          </p>
        </div>
      )}

      {/* Groups List */}
      {!loading && !error && filteredGroups.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filteredGroups.map(({ group, insumos }) => {
            const isExpanded = expandedGroupId === group.id;
            
            // Calculate total cost of the group
            const groupDirectCost = insumos.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost_price)), 0);

            return (
              <div 
                key={group.id}
                className="bg-dark-2 border border-dark-4 rounded-2xl overflow-hidden shadow-sm hover:border-dark-4/80 transition-colors"
              >
                {/* Card Header Row */}
                <div 
                  onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-dark-3/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gold/10 rounded-xl text-gold">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-cream leading-snug">{group.description}</h3>
                      <p className="text-[10px] text-cream-muted mt-0.5">
                        Insumos: <span className="text-gold font-bold">{insumos.length}</span>
                        {group.presupuestos && (
                          <>
                            {' '}• Presupuesto: <span className="text-cream-dim font-bold">{(group.presupuestos as any).description}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[8px] text-cream-muted uppercase tracking-wider block">Costo Directo Grupo</span>
                      <span className="text-xs font-mono font-bold text-gold">{formatCurrencyMXN(groupDirectCost)}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cream-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-cream-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Insumos List */}
                {isExpanded && (
                  <div className="border-t border-dark-4 bg-dark-1/30 p-4 animate-[slideDown_0.2s_ease-out]">
                    <div className="overflow-x-auto rounded-xl border border-dark-4 bg-dark-2/40">
                      <table className="w-full text-left text-xs font-sans border-collapse">
                        <thead>
                          <tr className="bg-dark-2/80 text-cream-dim uppercase font-bold text-[8px] tracking-wider border-b border-dark-4 select-none">
                            <th className="py-2.5 px-4 w-32">Código</th>
                            <th className="py-2.5 px-4">Descripción Insumo</th>
                            <th className="py-2.5 px-4 text-center w-16">Unidad</th>
                            <th className="py-2.5 px-4 text-right w-24">Cantidad</th>
                            <th className="py-2.5 px-4 text-right w-28">Costo Unit.</th>
                            <th className="py-2.5 px-4 text-right w-28">Importe Tot.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-4/50 text-[11px]">
                          {insumos.map((item) => {
                            const total = Number(item.quantity) * Number(item.cost_price);
                            return (
                              <tr key={item.id} className="text-cream font-medium">
                                <td className="py-2 px-4 font-mono text-[10px] text-gold/90">{item.matriz?.code || 'INSUMO'}</td>
                                <td className="py-2 px-4">{item.description}</td>
                                <td className="py-2 px-4 text-center font-mono text-cream-muted">{item.unit}</td>
                                <td className="py-2 px-4 text-right font-mono text-cream-dim">{item.quantity}</td>
                                <td className="py-2 px-4 text-right font-mono text-cream-dim">{formatCurrencyMXN(Number(item.cost_price))}</td>
                                <td className="py-2 px-4 text-right font-mono text-gold font-bold">{formatCurrencyMXN(total)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
