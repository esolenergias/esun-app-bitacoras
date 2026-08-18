import React, { useState } from 'react';
import { Activity, AlertCircle, TrendingUp, Zap, FileText, Share2, Plus, Server, CheckCircle2, LayoutDashboard, Users } from 'lucide-react';
import { AccountsManager } from '../modules/monitoreo/components/AccountsManager';
import { SystemsManager } from '../modules/monitoreo/components/SystemsManager';
import { MonitoreoDashboard } from '../modules/monitoreo/components/MonitoreoDashboard';

type TabType = 'dashboard' | 'cuentas' | 'sistemas';

export default function MonitoreoTab() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Activity className="w-6 h-6 text-gold" />
            Monitoreo & Reportes
          </h2>
          <p className="text-cream-muted text-sm mt-1 max-w-2xl">
            Gestión de monitoreo de sistemas fotovoltaicos. Generación de reportes mensuales, análisis de anomalías con IA y pronóstico de facturación CFE.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('cuentas')}
            className="flex items-center gap-2 px-4 py-2 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-white rounded-xl text-sm font-bold transition-all"
          >
            <Server className="w-4 h-4" />
            Vincular Cuenta
          </button>
          <button 
            onClick={() => setActiveTab('sistemas')}
            className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Nuevo Sistema
          </button>
        </div>
      </div>

      {/* Navegación Interna */}
      <div className="flex space-x-1 bg-dark-3 p-1 rounded-xl w-max">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'dashboard' ? 'bg-dark-2 text-white shadow' : 'text-cream-muted hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('cuentas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'cuentas' ? 'bg-dark-2 text-white shadow' : 'text-cream-muted hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Cuentas Inversores
        </button>
        <button
          onClick={() => setActiveTab('sistemas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'sistemas' ? 'bg-dark-2 text-white shadow' : 'text-cream-muted hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          Sistemas Fotovoltaicos
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="mt-6">
        {activeTab === 'dashboard' && (
          <MonitoreoDashboard />
        )}

        {activeTab === 'cuentas' && (
          <AccountsManager />
        )}

        {activeTab === 'sistemas' && (
          <SystemsManager />
        )}
      </div>
    </div>
  );
}
