import React from 'react';
import { HardHat, Search, Download } from 'lucide-react';

export default function HistorialMantenimientosTab() {
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-muted" />
          <input 
            type="text" 
            placeholder="Buscar en el historial..." 
            className="w-full bg-dark-1 border border-dark-4 focus:border-gold/45 text-sm text-cream pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Placeholder content for now */}
      <div className="border border-dark-4 bg-dark-2/40 p-16 rounded-2xl text-center space-y-4 select-none">
        <HardHat className="w-10 h-10 text-gold mx-auto opacity-50" />
        <h4 className="font-display font-black text-base text-cream">Historial Limpio</h4>
        <p className="text-xs text-cream-muted max-w-sm mx-auto font-body">
          Aún no se han completado mantenimientos. Los reportes y bitácoras cerradas se archivarán aquí.
        </p>
      </div>
    </div>
  );
}
