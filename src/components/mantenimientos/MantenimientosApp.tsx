import React, { useState } from 'react';
import { Wrench, Shield, Search, Plus, HardHat, Calendar, Clock, RefreshCw } from 'lucide-react';
import MantenimientosObrasTab from './MantenimientosObrasTab';
import HistorialMantenimientosTab from './HistorialMantenimientosTab';

export default function MantenimientosApp({ reporterName = 'ESOL Técnico' }: { reporterName?: string }) {
  const [activeTab, setActiveTab] = useState<'obras' | 'historial'>('obras');

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-light text-gold flex items-center gap-2">
            <Wrench className="w-6 h-6" />
            Mantenimientos (APP)
          </h2>
          <p className="text-cream-muted text-sm mt-1">
            Gestión de mantenimientos preventivos y correctivos para pólizas.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between border-b border-dark-4 overflow-x-auto custom-scrollbar">
        <div className="flex space-x-1 min-w-max">
          <button
            onClick={() => setActiveTab('obras')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'obras'
                ? 'border-gold text-gold bg-gold/5'
                : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Mantenimientos
          </button>
          
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'historial'
                ? 'border-gold text-gold bg-gold/5'
                : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
            }`}
          >
            <HardHat className="w-4 h-4" />
            Historial de Bitácoras
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {activeTab === 'obras' && <MantenimientosObrasTab reporterName={reporterName} />}
        {activeTab === 'historial' && <HistorialMantenimientosTab reporterName={reporterName} />}
      </div>
    </div>
  );
}
