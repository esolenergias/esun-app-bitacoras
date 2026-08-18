import React, { useState, useEffect } from 'react';
import { monitoreoApi } from '../api/monitoreo.api';
import type { PVSystem } from '../types/monitoreo.types';
import { Activity, AlertCircle, FileText, CheckCircle2, Loader2, Zap } from 'lucide-react';

export const MonitoreoDashboard: React.FC = () => {
  const [systems, setSystems] = useState<PVSystem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await monitoreoApi.getAllSystems();
      setSystems(data);
    } catch (err) {
      console.error("Error al cargar dashboard de monitoreo", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  // Cálculos básicos (simulados para alertas por ahora, ya que IA será en Fase 4)
  const totalSystems = systems.length;
  const activeSystems = systems.length; // Placeholder
  const alerts = 0; // Placeholder

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-2 border border-dark-3 rounded-2xl p-6 transition-all hover:border-dark-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-cream-muted">Sistemas Activos</p>
              <p className="text-2xl font-black text-white">{activeSystems} / {totalSystems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-dark-2 border border-dark-3 rounded-2xl p-6 transition-all hover:border-dark-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-cream-muted">Alertas / Anomalías</p>
              <p className="text-2xl font-black text-white">{alerts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-dark-2 border border-dark-3 rounded-2xl p-6 transition-all hover:border-dark-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-cream-muted">Reportes Generados</p>
              <p className="text-2xl font-black text-white">Próximamente</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-2 border border-dark-3 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Zap className="w-16 h-16 text-dark-4 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Resumen Energético</h3>
        <p className="text-cream-muted max-w-md mx-auto">
          Los gráficos de generación, consumo y diferencial contra el gemelo digital se habilitarán tras la sincronización de las APIs en la Fase 3.
        </p>
      </div>
    </div>
  );
};
