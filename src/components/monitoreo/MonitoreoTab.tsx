import React, { useState } from 'react';
import { Activity, Plus, Settings, LayoutDashboard, Zap, User, X } from 'lucide-react';
import { AccountsManager } from '../../modules/monitoreo/components/AccountsManager';
import { SystemsManager } from '../../modules/monitoreo/components/SystemsManager';
import { MonitoreoDashboard } from '../../modules/monitoreo/components/MonitoreoDashboard';
import { MonitoreoClientView } from '../../modules/monitoreo/components/MonitoreoClientView';

interface MonitoreoTabProps {
  userRole?: string;
  clientId?: string;
  clientName?: string;
}

type TabType = 'dashboard' | 'sistemas' | 'client_preview';

export default function MonitoreoTab({ userRole = 'master', clientId, clientName }: MonitoreoTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Si el usuario es un cliente regular (role === 'user'), se le presenta directamente la vista simplificada
  if (userRole === 'user') {
    return (
      <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        <MonitoreoClientView clientId={clientId} clientName={clientName} />
      </div>
    );
  }

  const handleOpenNewSystem = () => {
    setActiveTab('sistemas');
    setOpenRegisterModal(true);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* ── MODAL EMERGENTE DE CONFIGURACIÓN / CUENTAS INVERSORES ── */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] overflow-y-auto">
          <div className="bg-dark-2 border border-dark-4 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-dark-4 sticky top-0 bg-dark-2 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-cream">Configuración & Cuentas Inversores</h3>
                  <p className="text-xs text-cream-muted">Vincula tus cuentas maestras (Huawei, Growatt, Hoymiles) y gestiona los accesos API.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="text-cream-muted hover:text-cream p-1.5 rounded-xl hover:bg-dark-3 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2">
              <AccountsManager />
            </div>

            <div className="pt-3 border-t border-dark-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-5 py-2 text-xs font-black text-dark-1 bg-gold hover:bg-gold-light rounded-xl transition-all cursor-pointer shadow-md shadow-gold/10"
              >
                Cerrar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-cream uppercase tracking-tight flex items-center gap-3">
            <Activity className="w-6 h-6 text-gold" />
            Monitoreo & Telemetría Solar
          </h2>
          <p className="text-cream-muted text-sm mt-1 max-w-2xl">
            Gestión integral de sistemas fotovoltaicos, diagnósticos autónomos con Gemini IA, sincronización de marcas (Huawei, Growatt, Hoymiles) y estimación de ahorro CFE.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-2 hover:bg-dark-3 border border-dark-4 text-cream hover:text-gold rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm"
          >
            <Settings className="w-4 h-4 text-gold" />
            Configuración
          </button>
          <button 
            onClick={handleOpenNewSystem}
            className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-gold/10"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Nuevo Sistema
          </button>
        </div>
      </div>

      {/* Navegación Interna sin Cuentas Inversores */}
      <div className="flex space-x-1 bg-dark-2 border border-dark-4 p-1 rounded-xl w-max flex-wrap gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'bg-dark-3 text-cream border border-dark-4 shadow-sm' : 'text-cream-muted hover:text-cream'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard General
        </button>
        <button
          onClick={() => setActiveTab('sistemas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'sistemas' ? 'bg-dark-3 text-cream border border-dark-4 shadow-sm' : 'text-cream-muted hover:text-cream'
          }`}
        >
          <Zap className="w-4 h-4" />
          Sistemas & Salud
        </button>
        <button
          onClick={() => setActiveTab('client_preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'client_preview' ? 'bg-dark-3 text-gold border border-gold/30 shadow-sm' : 'text-cream-muted hover:text-cream'
          }`}
        >
          <User className="w-4 h-4" />
          Vista Cliente
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <MonitoreoDashboard />}
        {activeTab === 'sistemas' && (
          <SystemsManager 
            openRegisterModal={openRegisterModal} 
            onCloseRegisterModal={() => setOpenRegisterModal(false)} 
          />
        )}
        {activeTab === 'client_preview' && (
          <div className="border border-dashed border-gold/30 rounded-3xl p-6 bg-dark-1/50">
            <div className="mb-4 pb-3 border-b border-dark-4 flex justify-between items-center">
              <span className="text-xs font-bold text-gold uppercase tracking-wider">
                Previsualización interactiva de la interfaz del cliente final
              </span>
            </div>
            <MonitoreoClientView />
          </div>
        )}
      </div>
    </div>
  );
}
