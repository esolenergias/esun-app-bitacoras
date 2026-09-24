import React, { useState, useEffect, useCallback } from 'react';
import { monitoreoApi } from '../api/monitoreo.api';
import type { PVSystem, MonitoringAlert, DailyAggregated } from '../types/monitoreo.types';
import {
  CheckCircle2, AlertCircle, Zap, Loader2, TrendingUp,
  RefreshCw, AlertTriangle, ShieldCheck, Info, XCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  LOW:      { label: 'Baja',     color: 'text-blue-500 dark:text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   Icon: Info },
  MEDIUM:   { label: 'Media',    color: 'text-amber-500 dark:text-yellow-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', Icon: AlertTriangle },
  HIGH:     { label: 'Alta',     color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', Icon: AlertCircle },
  CRITICAL: { label: 'Crítica',  color: 'text-red-500 dark:text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    Icon: XCircle },
} as const;

const formatKwh = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)} MWh` : `${n.toFixed(1)} kWh`;

const shortDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

// ─── Custom Tooltip para la gráfica ──────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-1 border border-dark-4 rounded-xl px-3 py-2 shadow-xl text-xs">
        <p className="text-cream-muted mb-1">{label}</p>
        <p className="text-gold font-black">{formatKwh(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ─── Componente AlertsPanel ───────────────────────────────────────────────────

interface AlertsPanelProps {
  alerts: MonitoringAlert[];
  loading: boolean;
  onResolve: (id: string) => void;
  resolvingId: string | null;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, loading, onResolve, resolvingId }) => {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <ShieldCheck className="w-10 h-10 text-green-500/60" />
        <p className="text-cream-muted text-sm font-medium">Sin alertas activas. Todos los sistemas operando correctamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const cfg = SEVERITY_CONFIG[alert.severity];
        const { Icon } = cfg;
        return (
          <div
            key={alert.id}
            className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3 shadow-sm`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-[10px] text-cream-dim font-mono">
                  {alert.created_at ? new Date(alert.created_at).toLocaleDateString('es-MX') : ''}
                </span>
              </div>
              <p className="text-sm text-cream font-bold leading-snug">{alert.ai_description}</p>
              <p className="text-xs text-cream-muted mt-1 leading-relaxed">
                <span className="text-emerald-600 dark:text-green-400 font-bold">↳ Rec: </span>{alert.ai_recommendation}
              </p>
            </div>
            <button
              onClick={() => onResolve(alert.id)}
              disabled={resolvingId === alert.id}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-dark-2 hover:bg-dark-3 border border-dark-4 text-cream hover:text-gold text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {resolvingId === alert.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <CheckCircle2 className="w-3 h-3" />}
              Resolver
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ─── Dashboard Principal ──────────────────────────────────────────────────────

export const MonitoreoDashboard: React.FC = () => {
  const [systems, setSystems]       = useState<PVSystem[]>([]);
  const [alerts, setAlerts]         = useState<MonitoringAlert[]>([]);
  const [chartData, setChartData]   = useState<DailyAggregated[]>([]);
  const [loading, setLoading]       = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [sysData, alertData, chartRaw] = await Promise.all([
        monitoreoApi.getAllSystems(),
        monitoreoApi.getAlerts(),
        monitoreoApi.getAggregatedProduction(30),
      ]);
      setSystems(sysData);
      setAlerts(alertData);
      setChartData(chartRaw);
    } catch (err) {
      console.error('Error al cargar dashboard de monitoreo', err);
    } finally {
      setLoading(false);
      setAlertsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleResolve = async (alertId: string) => {
    try {
      setResolvingId(alertId);
      await monitoreoApi.resolveAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Error al resolver alerta', err);
    } finally {
      setResolvingId(null);
    }
  };

  // ─── KPIs calculados ───────────────────────────────────────────────────────

  const totalSystems   = systems.length;
  const totalAlerts    = alerts.length;
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthlyKwh = chartData
    .filter(d => d.date >= startOfMonth)
    .reduce((sum, d) => sum + d.total_kwh, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Sistemas Registrados */}
        <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 hover:border-gold/40 transition-all shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 border border-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-cream-muted font-bold truncate">Sistemas</p>
              <p className="text-2xl font-black text-cream leading-tight">{totalSystems}</p>
            </div>
          </div>
        </div>

        {/* Alertas Activas */}
        <div className={`bg-dark-2 border rounded-2xl p-5 hover:border-gold/40 transition-all shadow-sm ${
          criticalAlerts > 0 ? 'border-red-500/40 bg-red-500/5' : 'border-dark-4'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              criticalAlerts > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <AlertCircle className={`w-5 h-5 ${criticalAlerts > 0 ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-cream-muted font-bold truncate">Alertas activas</p>
              <p className={`text-2xl font-black leading-tight ${
                criticalAlerts > 0 ? 'text-red-500' : totalAlerts > 0 ? 'text-amber-500' : 'text-cream'
              }`}>{totalAlerts}</p>
            </div>
          </div>
        </div>

        {/* Energía del mes */}
        <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 hover:border-gold/40 transition-all shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0 border border-gold/20">
              <Zap className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-cream-muted font-bold truncate">Energía este mes</p>
              <p className="text-2xl font-black text-cream leading-tight">
                {monthlyKwh > 0 ? formatKwh(monthlyKwh) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Tendencia 30 días */}
        <div className="bg-dark-2 border border-dark-4 rounded-2xl p-5 hover:border-gold/40 transition-all shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-cream-muted font-bold truncate">Total 30 días</p>
              <p className="text-2xl font-black text-cream leading-tight">
                {chartData.length > 0 ? formatKwh(chartData.reduce((s, d) => s + d.total_kwh, 0)) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráfica de Producción ───────────────────────────────────────────── */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-black text-cream">Generación Diaria (últimos 30 días)</h3>
            <p className="text-xs text-cream-muted mt-0.5">Suma de todos los sistemas fotovoltaicos</p>
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-1 hover:bg-dark-3 border border-dark-4 text-cream hover:text-gold text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] gap-3 text-center">
            <Zap className="w-12 h-12 text-cream-dim/30" />
            <p className="text-cream-muted text-sm max-w-xs font-medium">
              Sin datos de producción aún. Vincule una cuenta, registre un sistema y ejecute la sincronización.
            </p>
          </div>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-dark-4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fill: 'var(--theme-text-2, #8a8a8a)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `${v}`}
                  tick={{ fill: 'var(--theme-text-2, #8a8a8a)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  unit=" kWh"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(196,152,37,0.08)' }} />
                <Bar dataKey="total_kwh" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.total_kwh > 0 ? '#C49825' : 'var(--theme-border-1, #2a2a2a)'}
                      opacity={entry.total_kwh > 0 ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Panel de Alertas IA ─────────────────────────────────────────────── */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 animate-[fadeIn_0.5s_ease-out] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-cream flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gold" />
              Alertas IA Activas
            </h3>
            <p className="text-xs text-cream-muted mt-0.5">
              Anomalías detectadas por Gemini en los sistemas fotovoltaicos
            </p>
          </div>
          {totalAlerts > 0 && (
            <span className="text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/30 px-2.5 py-1 rounded-full">
              {totalAlerts} sin resolver
            </span>
          )}
        </div>
        <AlertsPanel
          alerts={alerts}
          loading={alertsLoading}
          onResolve={handleResolve}
          resolvingId={resolvingId}
        />
      </div>

    </div>
  );
};
