import React, { useState, useEffect } from 'react';
import { monitoreoApi } from '../api/monitoreo.api';
import type { PVSystemWithHealth, MonitoringAlert, DailyAggregated } from '../types/monitoreo.types';
import { 
  Zap, HeartPulse, ShieldCheck, FileText, Loader2, Sparkles 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface MonitoreoClientViewProps {
  clientId?: string;
  clientName?: string;
}

export const MonitoreoClientView: React.FC<MonitoreoClientViewProps> = ({ clientId, clientName }) => {
  const [systems, setSystems] = useState<PVSystemWithHealth[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [chartData, setChartData] = useState<DailyAggregated[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [allSystems, allAlerts, prod] = await Promise.all([
        monitoreoApi.getSystemsWithHealth(),
        monitoreoApi.getAlerts(undefined, false),
        monitoreoApi.getAggregatedProduction(14),
      ]);

      const userSystems = clientId ? allSystems.filter(s => s.client_id === clientId) : allSystems;
      setSystems(userSystems);
      setAlerts(allAlerts);
      setChartData(prod);
    } catch (e) {
      console.error("Error al cargar vista cliente de monitoreo:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (sysId: string) => {
    try {
      setGeneratingReportId(sysId);
      const now = new Date();
      const res = await monitoreoApi.generateReport(sysId, now.getMonth() + 1, now.getFullYear());
      if (res.blobUrl) {
        window.open(res.blobUrl, '_blank');
      }
    } catch (e) {
      console.error("Error generando reporte:", e);
    } finally {
      setGeneratingReportId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="text-sm font-bold text-cream-muted">Cargando telemetría de tus paneles...</p>
      </div>
    );
  }

  const totalKwh = systems.reduce((acc, s) => acc + s.recentKwh30Days, 0);
  const totalSavings = systems.reduce((acc, s) => acc + s.estimatedSavingsMxn, 0);

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* ── Banner de Bienvenida Cliente ── */}
      <div className="bg-gradient-to-r from-dark-2 via-dark-3 to-dark-2 border border-gold/30 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Zap className="w-48 h-48 text-gold" />
        </div>
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/30 inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Portal de Inversor Fotovoltaico
          </span>
          <h2 className="text-2xl font-black text-cream">
            Monitoreo Solar {clientName ? `— ${clientName}` : ''}
          </h2>
          <p className="text-cream-muted text-sm max-w-xl mt-1 font-medium">
            Supervisión inteligente de tu generación de energía solar, estado técnico de tus inversores y ahorro financiero frente a CFE.
          </p>
        </div>
      </div>

      {/* ── KPIs para el Cliente ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-cream-muted font-bold">Generación Reciente (30 días)</p>
          <p className="text-2xl font-black text-cream mt-1">
            {totalKwh >= 1000 ? `${(totalKwh / 1000).toFixed(2)} MWh` : `${totalKwh.toFixed(1)} kWh`}
          </p>
          <p className="text-[11px] text-green-500 font-bold mt-1">100% Energía Limpia</p>
        </div>

        <div className="bg-dark-2 border border-gold/40 rounded-2xl p-5 shadow-lg shadow-gold/5">
          <p className="text-xs text-gold font-bold">Ahorro Económico Estimado</p>
          <p className="text-2xl font-black text-gold mt-1">
            ${totalSavings.toLocaleString('es-MX')} MXN
          </p>
          <p className="text-[11px] text-cream-muted mt-1">Estimado según tarifa CFE registrada</p>
        </div>

        <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-cream-muted font-bold">Estado de los Sistemas</p>
          <p className="text-2xl font-black text-cream mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-500" />
            {alerts.length === 0 ? 'Óptimo' : `${alerts.length} en revisión`}
          </p>
          <p className="text-[11px] text-cream-dim mt-1 font-medium">{systems.length} planta(s) vinculada(s)</p>
        </div>
      </div>

      {/* ── Lista de Sistemas Fotovoltaicos del Cliente ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-cream flex items-center gap-2">
          <Zap className="w-5 h-5 text-gold" />
          Mis Instalaciones Solares
        </h3>

        {systems.length === 0 ? (
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-8 text-center text-cream-muted font-medium">
            No tienes sistemas solares asignados todavía. Contacta al equipo de soporte de Esolenergias.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systems.map((sys) => (
              <div key={sys.id} className="bg-dark-2 border border-dark-4 hover:border-gold/40 rounded-2xl p-5 transition-all shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-cream text-base">{sys.plant_name}</h4>
                    <p className="text-xs text-cream-dim font-mono">{sys.plant_id}</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl text-xs font-black bg-green-500/10 text-green-500 border border-green-500/30 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5" />
                    Salud {sys.healthScore}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-dark-4 text-xs">
                  <div>
                    <span className="text-cream-dim block">Capacidad Instalada</span>
                    <span className="font-bold text-cream text-sm">{sys.capacity_kwp} kWp</span>
                  </div>
                  <div>
                    <span className="text-cream-dim block">Tarifa Asignada</span>
                    <span className="font-bold text-gold text-sm">{sys.cfe_tariff || 'DAC'}</span>
                  </div>
                  <div>
                    <span className="text-cream-dim block">Generación (30d)</span>
                    <span className="font-bold text-cream text-sm">{sys.recentKwh30Days.toFixed(1)} kWh</span>
                  </div>
                  <div>
                    <span className="text-cream-dim block">Ahorro Estimado</span>
                    <span className="font-bold text-green-500 text-sm">${sys.estimatedSavingsMxn.toLocaleString('es-MX')} MXN</span>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => handleDownloadReport(sys.id)}
                    disabled={generatingReportId === sys.id}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-1 hover:bg-gold text-cream hover:text-dark-1 border border-dark-4 hover:border-gold text-xs font-black rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {generatingReportId === sys.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    Descargar Reporte Mensual PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Gráfica Simplificada de Producción ── */}
      {chartData.length > 0 && (
        <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-cream mb-1">Tu Producción Solar Diaria</h3>
          <p className="text-xs text-cream-muted mb-4">Registro en kWh de los últimos 14 días</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-dark-4" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--theme-text-2, #8a8a8a)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--theme-text-2, #8a8a8a)', fontSize: 10 }} axisLine={false} tickLine={false} unit=" kWh" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--theme-bg-1, #1E1E1E)', borderColor: 'var(--theme-border-1, #333)', borderRadius: '12px' }} 
                  labelStyle={{ color: 'var(--theme-text-2, #aaa)' }}
                />
                <Bar dataKey="total_kwh" fill="#C49825" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
