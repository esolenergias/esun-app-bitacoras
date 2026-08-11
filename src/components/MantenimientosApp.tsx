import React, { useState } from 'react';
import { Wrench, Shield, Search, Plus, HardHat, Calendar, Clock, RefreshCw } from 'lucide-react';

export default function MantenimientosApp({ reporterName = 'ESOL Técnico' }: { reporterName?: string }) {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');

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
            Gestión de bitácoras de mantenimientos preventivos y correctivos para pólizas.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 hover:border-gold/50 rounded-xl transition-colors font-bold text-sm">
            <RefreshCw className="w-4 h-4" />
            Sincronizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gold text-dark-1 hover:bg-yellow-400 rounded-xl transition-colors font-bold text-sm">
            <Plus className="w-4 h-4 stroke-[3]" />
            Nueva Visita
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between border-b border-dark-4 overflow-x-auto custom-scrollbar">
        <div className="flex space-x-1 min-w-max">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'pendientes'
                ? 'border-gold text-gold bg-gold/5'
                : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Visitas Pendientes
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
            Historial de Mantenimientos
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="border border-dark-4 bg-dark-2/40 p-16 rounded-2xl text-center space-y-4 select-none">
        <Shield className="w-10 h-10 text-gold mx-auto opacity-50" />
        <h4 className="font-display font-black text-base text-cream">Módulo en Construcción</h4>
        <p className="text-xs text-cream-muted max-w-sm mx-auto font-body">
          Este módulo de mantenimientos será operado de forma completamente independiente de las Bitácoras de Obra. Aquí el equipo de mantenimiento gestionará sus visitas, subirá evidencias y llenará el checklist de revisión de los equipos amparados bajo Póliza de Garantía.
        </p>
      </div>
    </div>
  );
}
