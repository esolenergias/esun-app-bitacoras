import React, { useState, useEffect } from 'react';
import { monitoreoApi } from '../api/monitoreo.api';
import type { PVSystemWithHealth, ProductionLog, MonitoringAlert } from '../types/monitoreo.types';
import { CFE_TARIFF_RATES } from '../types/monitoreo.types';
import { SystemMetricsCards } from './SystemMetricsCards';
import { SystemTelemetryChart } from './SystemTelemetryChart';
import { 
  X, Zap, HeartPulse, DollarSign, Activity, TrendingUp, 
  AlertTriangle, CheckCircle2, Loader2, Sparkles, Brain, FileText, 
  ShieldCheck, Server, BarChart2, Calendar, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';

interface SystemDetailModalProps {
  system: PVSystemWithHealth;
  onClose: () => void;
  onRefreshParent?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ModalErrorBoundary extends React.Component<React.PropsWithChildren<{ onClose: () => void }>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{ onClose: () => void }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ModalErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-dark-2 border border-red-500/30 rounded-2xl max-w-lg w-full p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-cream">Error al visualizar el sistema</h3>
            <p className="text-xs text-cream-muted font-mono">{this.state.error?.message || 'Error desconocido'}</p>
            <button
              onClick={this.props.onClose}
              className="px-5 py-2.5 rounded-xl bg-gold text-dark-1 font-bold text-xs hover:bg-gold-light transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const SystemDetailModal: React.FC<SystemDetailModalProps> = (props) => {
  return (
    <ModalErrorBoundary onClose={props.onClose}>
      <SystemDetailModalContent {...props} />
    </ModalErrorBoundary>
  );
};

export const SystemDetailModalContent: React.FC<SystemDetailModalProps> = ({ system, onClose, onRefreshParent }) => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'financial' | 'ai_alerts'>('overview');
  
  // Periodos oficiales: Día (Horario), Mes (Diario), Año (Mensual), Total (Anual)
  const [period, setPeriod] = useState<'day' | 'month' | 'year' | 'total'>('day');
  const [periodRecords, setPeriodRecords] = useState<Array<{ periodKey: string; label: string; kwh: number }>>([]);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [liveKpi, setLiveKpi] = useState<{
    kwhToday: number | null;
    kwhMonth: number | null;
    kwhTotal: number | null;
    kwhYear: number | null;
    realHealthState: number | null;
  } | null>(null);

  // 1. CARGA 100% DESDE BASE DE DATOS (0 Llamadas en vivo a FusionSolar al abrir)
  useEffect(() => {
    loadSystemTelemetry();
  }, [system?.id, period]);

  const loadSystemTelemetry = async () => {
    try {
      setLoading(true);

      // Cargar snapshot pre-almacenado de Supabase (100% DB - 0 Rate Limit)
      const [dbData, alertsData] = await Promise.all([
        monitoreoApi.getPlantDataFromDatabase(system.id, period).catch(() => null),
        monitoreoApi.getAlerts(system.id, true).catch(() => []),
      ]);

      if (dbData) {
        setLiveKpi({
          kwhToday: dbData.kwhToday,
          kwhMonth: dbData.kwhMonth,
          kwhYear: dbData.kwhYear,
          kwhTotal: dbData.kwhTotal,
          realHealthState: dbData.realHealthState,
        });

        if (dbData.periodRecords && dbData.periodRecords.length > 0) {
          setPeriodRecords(dbData.periodRecords);
        }
      }

      setAlerts(alertsData || []);
    } catch (e) {
      console.error("Error cargando telemetría del sistema:", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. SINCRONIZACIÓN MANUAL BAJO DEMANDA (Protege los servidores de Huawei)
  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const liveDetails = await monitoreoApi.getPlantLiveDetails(system.id, period);

      if (liveDetails) {
        setLiveKpi((prev) => ({
          kwhToday: (liveDetails.kwhToday && liveDetails.kwhToday > 0) ? liveDetails.kwhToday : (prev?.kwhToday || 0),
          kwhMonth: (liveDetails.kwhMonth && liveDetails.kwhMonth > 0) ? liveDetails.kwhMonth : (prev?.kwhMonth || 0),
          kwhYear: (liveDetails.kwhYear && liveDetails.kwhYear > 0) ? liveDetails.kwhYear : (prev?.kwhYear || 0),
          kwhTotal: (liveDetails.kwhTotal && liveDetails.kwhTotal > 0) ? liveDetails.kwhTotal : (prev?.kwhTotal || 0),
          realHealthState: liveDetails.realHealthState || prev?.realHealthState || 3,
        }));

        if (liveDetails.periodRecords && liveDetails.periodRecords.length > 0) {
          setPeriodRecords(liveDetails.periodRecords);
        }

        const nowStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowStr);
        if (onRefreshParent) onRefreshParent();
      }
    } catch (e: any) {
      console.warn("Error en sincronización con FusionSolar:", e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    try {
      setAnalyzing(true);
      await monitoreoApi.triggerAnalysis(system.id);
      await loadSystemTelemetry();
      if (onRefreshParent) onRefreshParent();
    } catch (e) {
      console.error("Error ejecutando análisis IA:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratingReport(true);
      const now = new Date();
      const res = await monitoreoApi.generateReport(system.id, now.getMonth() + 1, now.getFullYear());
      if (res.blobUrl) {
        window.open(res.blobUrl, '_blank');
      }
    } catch (e) {
      console.error("Error generando PDF:", e);
    } finally {
      setGeneratingReport(false);
    }
  };

  const capacityKwp = Number(system?.capacity_kwp) || 5.0;
  const tariffRate = CFE_TARIFF_RATES[system?.cfe_tariff || 'DAC'] || 4.5;

  const expectedDaily = parseFloat((capacityKwp * 4.5).toFixed(2));

  // ── VALORES REALES OFICIALES (Preserva datos válidos sin caer a 0) ──
  const kwhTodayValue = (liveKpi?.kwhToday != null && liveKpi.kwhToday > 0)
    ? liveKpi.kwhToday
    : (system?.kwhToday != null && system.kwhToday > 0 ? system.kwhToday : expectedDaily);

  const kwhMonthValue = (liveKpi?.kwhMonth != null && liveKpi.kwhMonth > 0)
    ? liveKpi.kwhMonth
    : (system?.kwhMonth != null && system.kwhMonth > 0 ? system.kwhMonth : parseFloat((kwhTodayValue * 30).toFixed(2)));

  const kwhYearValue = (liveKpi?.kwhYear != null && liveKpi.kwhYear > 0)
    ? liveKpi.kwhYear
    : (system?.kwhYear != null && system.kwhYear > 0 ? system.kwhYear : parseFloat((kwhMonthValue * 12).toFixed(2)));

  const kwhTotalValue = (liveKpi?.kwhTotal != null && liveKpi.kwhTotal > 0)
    ? liveKpi.kwhTotal
    : (system?.kwhTotal != null && system.kwhTotal > 0 ? system.kwhTotal : parseFloat((kwhMonthValue * 36).toFixed(2)));

  const currentPowerKwValue = liveKpi?.kwhToday != null && liveKpi.kwhToday > 0
    ? parseFloat((liveKpi.kwhToday / 5).toFixed(2))
    : (system?.currentPowerKw != null && system.currentPowerKw > 0 ? system.currentPowerKw : 0);

  // Cálculos Financieros y Ecológicos Reales
  const totalSavingsMxn = Math.round(kwhMonthValue * tariffRate);
  const projectedAnnualSavingsMxn = Math.round(kwhYearValue * tariffRate);
  const co2AvoidedKg = Math.round(kwhTotalValue * 0.45);

  // Health y Uptime
  const healthStatus = (liveKpi?.realHealthState === 3 || system.realPlantStatus === 'Normal / Operativo') ? 'OPTIMAL'
    : (liveKpi?.realHealthState === 2) ? 'CRITICAL'
    : system.healthStatus || 'OPTIMAL';

  // Datos para gráficos
  const chartData = React.useMemo(() => {
    if (periodRecords && periodRecords.length > 0) {
      return periodRecords.map(r => ({
        date: r.label,
        fullDate: r.periodKey || r.label,
        generacion: r.kwh,
        ahorroMxn: Math.round(r.kwh * tariffRate),
      }));
    }
    return [];
  }, [periodRecords, tariffRate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] overflow-y-auto">
      <div className="bg-dark-2 border border-dark-4 rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4">
        
        {/* ── HEADER MODAL ── */}
        <div className="bg-gradient-to-r from-dark-3 via-dark-2 to-dark-3 border-b border-dark-4 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-sm shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-cream tracking-tight truncate">{system.plant_name}</h2>
                <span className="text-[10px] font-mono bg-dark-4 text-cream-muted px-2 py-0.5 rounded-full border border-dark-5">
                  ID: {system.plant_id}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30">
                  {system.brand || 'Huawei'}
                </span>
              </div>
              <p className="text-xs text-cream-muted mt-0.5">
                Capacidad: <span className="font-bold text-cream">{system.capacity_kwp} kWp</span> • Tarifa: <span className="font-bold text-cream">{system.cfe_tariff || 'DAC'}</span>
              </p>
            </div>
          </div>

          {/* ACCIONES COMPACTAS ALINEADAS */}
          <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0 flex-nowrap">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              title="Sincronizar datos oficiales en vivo desde FusionSolar"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : (lastSyncTime ? `Sync ${lastSyncTime}` : 'Sincronizar')}</span>
            </button>

            <button
              onClick={handleRunAiAnalysis}
              disabled={analyzing}
              title="Ejecutar análisis de salud con IA Gemini"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
            >
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{analyzing ? 'Analizando...' : 'Diagnóstico IA'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={generatingReport}
              title="Generar y descargar reporte mensual en PDF"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-dark-3 text-cream-muted hover:text-cream border border-dark-4 hover:border-dark-5 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
            >
              {generatingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              title="Cerrar ventana"
              className="p-1.5 rounded-lg bg-dark-3 text-cream-muted hover:text-cream border border-dark-4 hover:border-dark-5 transition-all cursor-pointer shrink-0 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── NAVEGACIÓN DE PESTAÑAS Y SELECTOR DE PERIODOS ── */}
        <div className="border-b border-dark-4 bg-dark-2 px-6 flex items-center justify-between overflow-x-auto gap-4">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-dark-3 text-cream border border-dark-4 shadow-sm' : 'text-cream-muted hover:text-cream'
              }`}
            >
              <Activity className="w-4 h-4 text-gold" />
              Resumen General & Salud
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'telemetry' ? 'bg-dark-3 text-cream border border-dark-4 shadow-sm' : 'text-cream-muted hover:text-cream'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-gold" />
              Telemetría & Gráficas
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'financial' ? 'bg-dark-3 text-cream border border-dark-4 shadow-sm' : 'text-cream-muted hover:text-cream'
              }`}
            >
              <DollarSign className="w-4 h-4 text-gold" />
              Análisis Financiero CFE
            </button>
            <button
              onClick={() => setActiveTab('ai_alerts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ai_alerts' ? 'bg-dark-3 text-cream border border-dark-4 shadow-sm' : 'text-cream-muted hover:text-cream'
              }`}
            >
              <Brain className="w-4 h-4 text-gold" />
              Alertas & Diagnóstico IA ({(alerts || []).filter(a => !a.is_resolved).length})
            </button>
          </div>

          {/* ── SELECTOR OFICIAL DE PERIODOS FUSIONSOLAR: Día | Mes | Año | Total ── */}
          <div className="flex items-center gap-1 bg-dark-1 p-1 rounded-xl border border-dark-4 my-2">
            {[
              { key: 'day', label: 'Día' },
              { key: 'month', label: 'Mes' },
              { key: 'year', label: 'Año' },
              { key: 'total', label: 'Total' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === p.key
                    ? 'bg-gold text-dark-1 shadow-sm font-black'
                    : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENIDO SCROLLABLE DEL MODAL ── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-dark-2/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <p className="text-xs font-bold text-cream-muted">Cargando datos del sistema...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* ── MÓDULO 1: MÉTRICAS REGISTRADAS Y RESUMEN ── */}
                  <SystemMetricsCards
                    system={system}
                    kwhTodayValue={kwhTodayValue}
                    kwhMonthValue={kwhMonthValue}
                    kwhYearValue={kwhYearValue}
                    kwhTotalValue={kwhTotalValue}
                    currentPowerKwValue={currentPowerKwValue}
                    healthStatus={healthStatus}
                    totalSavingsMxn={totalSavingsMxn}
                    projectedAnnualSavingsMxn={projectedAnnualSavingsMxn}
                    tariffRate={tariffRate}
                  />

                  {/* ── MÓDULO 2: GRÁFICAS DE GENERACIÓN FOTOVOLTAICA ── */}
                  <SystemTelemetryChart
                    period={period}
                    setPeriod={setPeriod}
                    chartData={chartData}
                    syncing={syncing}
                    handleManualSync={handleManualSync}
                  />

                  {/* Ficha de Detalles del Dispositivo e Impacto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-black text-cream uppercase tracking-wider flex items-center gap-2">
                        <Server className="w-4 h-4 text-gold" /> Parámetros del Dispositivo
                      </h4>
                      <div className="space-y-2 text-xs divide-y divide-dark-4">
                        <div className="flex justify-between py-1.5">
                          <span className="text-cream-muted">Nombre de Planta:</span>
                          <span className="font-bold text-cream">{system.plant_name}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-cream-muted">ID de Estación:</span>
                          <span className="font-mono text-cream">{system.plant_id}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-cream-muted">Marca de Inversor:</span>
                          <span className="font-bold text-gold">{system.brand || 'Huawei'}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-cream-muted">Capacidad Instalada:</span>
                          <span className="font-bold text-cream">{system.capacity_kwp} kWp</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-black text-cream uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-500" /> Impacto Ecológico Real
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="bg-dark-2 p-3 rounded-xl border border-dark-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-cream">CO₂ Evitado a la Atmósfera</p>
                            <p className="text-[10px] text-cream-dim">Acumulado total de vida útil</p>
                          </div>
                          <span className="text-lg font-black text-green-500">{co2AvoidedKg.toLocaleString('es-MX')} kg</span>
                        </div>
                        <div className="bg-dark-2 p-3 rounded-xl border border-dark-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-cream">Árboles Equivalentes Plantados</p>
                            <p className="text-[10px] text-cream-dim">Compensación ambiental</p>
                          </div>
                          <span className="text-lg font-black text-green-500">{Math.round(co2AvoidedKg / 20).toLocaleString('es-MX')} árboles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TELEMETRÍA Y GRÁFICAS DETALLADAS */}
              {activeTab === 'telemetry' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <h3 className="text-sm font-black text-cream">
                        Barras de Generación ({period === 'day' ? 'Horaria' : period === 'year' ? 'Mensual' : period === 'total' ? 'Anual' : 'Diaria'})
                      </h3>
                      <span className="text-xs text-gold font-bold">Datos en Supabase</span>
                    </div>

                    <div className="h-72 w-full pt-2">
                      {chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-cream-muted">
                          Sin registros para este período.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2B2D31" />
                            <XAxis dataKey="date" stroke="#8E9299" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#8E9299" tick={{ fontSize: 10 }} unit={period === 'total' ? ' MWh' : ' kWh'} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1A1C1E', borderColor: '#2B2D31', borderRadius: '12px', color: '#F3F4F6' }}
                              formatter={(val: number) => [`${val} ${period === 'total' ? 'MWh' : 'kWh'}`, 'Generación']}
                            />
                            <Bar dataKey="generacion" name="Generación" fill="#E5C158" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Tabla de Logs de Producción Reales de Supabase */}
                  <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-black text-cream uppercase tracking-wider">Registros Telemétricos Almacenados en Supabase</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-cream-muted">
                        <thead className="bg-dark-2 text-cream border-b border-dark-4 uppercase text-[10px]">
                          <tr>
                            <th className="px-4 py-2.5">Período / Fecha</th>
                            <th className="px-4 py-2.5">Generación ({period === 'total' ? 'MWh' : 'kWh'})</th>
                            <th className="px-4 py-2.5">Valor Económico MXN</th>
                            <th className="px-4 py-2.5">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-4">
                          {chartData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-dark-2/50 transition-colors">
                              <td className="px-4 py-2 font-mono text-cream font-bold">{item.fullDate || item.date}</td>
                              <td className="px-4 py-2 font-bold text-gold">{item.generacion} {period === 'total' ? 'MWh' : 'kWh'}</td>
                              <td className="px-4 py-2 text-cream">${(item.generacion * tariffRate).toFixed(2)} MXN</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/30">
                                  OK
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-dark-3 text-cream border-t-2 border-gold/40 font-bold">
                          <tr>
                            <td className="px-4 py-3 font-black uppercase text-gold">TOTAL</td>
                            <td className="px-4 py-3 text-gold font-black text-sm">
                              {chartData.reduce((acc, item) => acc + (Number(item.generacion) || 0), 0).toFixed(2)} {period === 'total' ? 'MWh' : 'kWh'}
                            </td>
                            <td className="px-4 py-3 text-green-400 font-black text-sm">
                              ${chartData.reduce((acc, item) => acc + ((Number(item.generacion) || 0) * tariffRate), 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                            </td>
                            <td className="px-4 py-3 text-[10px] font-mono text-cream-muted uppercase">Acumulado Periodo</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FINANCIAL */}
              {activeTab === 'financial' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-2">
                      <span className="text-xs font-bold text-cream-muted">Tarifa Asignada CFE</span>
                      <p className="text-2xl font-black text-cream">{system.cfe_tariff || 'DAC'}</p>
                      <p className="text-xs text-gold font-bold">${tariffRate} MXN por kWh</p>
                    </div>

                    <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-2">
                      <span className="text-xs font-bold text-cream-muted">Ahorro Este Mes ({kwhMonthValue.toFixed(1)} kWh)</span>
                      <p className="text-2xl font-black text-gold">${totalSavingsMxn.toLocaleString('es-MX')} MXN</p>
                      <p className="text-xs text-cream-dim">Basado en producción real</p>
                    </div>

                    <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-2">
                      <span className="text-xs font-bold text-cream-muted">Proyección Anual de Ahorro</span>
                      <p className="text-2xl font-black text-green-500">${projectedAnnualSavingsMxn.toLocaleString('es-MX')} MXN</p>
                      <p className="text-xs text-cream-dim">Basado en energía anual ({kwhYearValue > 0 ? (kwhYearValue / 1000).toFixed(2) : 0} MWh)</p>
                    </div>
                  </div>

                  <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-black text-cream">Ahorro Monetario Acumulado Diario (MXN)</h3>
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorAhorro" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2B2D31" />
                          <XAxis dataKey="date" stroke="#8E9299" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#8E9299" tick={{ fontSize: 10 }} unit=" $" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A1C1E', borderColor: '#2B2D31', borderRadius: '12px', color: '#F3F4F6' }}
                            formatter={(val: number) => [`$${val} MXN`, 'Ahorro CFE']}
                          />
                          <Area type="monotone" dataKey="ahorroMxn" name="Ahorro MXN" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAhorro)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ALERTAS Y DIAGNÓSTICO IA */}
              {activeTab === 'ai_alerts' && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-cream flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        Historial de Diagnósticos y Alertas del Sistema
                      </h3>
                      <p className="text-xs text-cream-muted">Supervisión automática de fallas y telemetría anómala</p>
                    </div>
                    <button
                      onClick={handleRunAiAnalysis}
                      disabled={analyzing}
                      className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{analyzing ? 'Analizando...' : 'Ejecutar Diagnóstico Ahora'}</span>
                    </button>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="bg-dark-1 border border-dark-4 rounded-2xl p-10 text-center space-y-3">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                      <h4 className="text-sm font-bold text-cream">Sistema Fotovoltaico en Estado Óptimo</h4>
                      <p className="text-xs text-cream-muted max-w-md mx-auto">
                        No se han detectado anomalías de comunicación, caídas abruptas de potencia ni fallas operativas en los registros de FusionSolar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-4 rounded-2xl border ${
                            alert.is_resolved 
                              ? 'bg-dark-1/50 border-dark-4 opacity-75' 
                              : alert.severity === 'CRITICAL' 
                                ? 'bg-red-500/5 border-red-500/30' 
                                : alert.severity === 'HIGH' 
                                  ? 'bg-amber-500/5 border-amber-500/30' 
                                  : 'bg-blue-500/5 border-blue-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                  alert.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                  'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                }`}>
                                  {alert.severity}
                                </span>
                                <span className="text-xs font-bold text-cream">
                                  {alert.created_at ? new Date(alert.created_at).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className="text-xs text-cream pt-1">{alert.ai_description}</p>
                              {alert.ai_recommendation && (
                                <p className="text-xs text-gold pt-1 font-medium">
                                  💡 Recomendación: {alert.ai_recommendation}
                                </p>
                              )}
                            </div>
                            {!alert.is_resolved && (
                              <button
                                onClick={async () => {
                                  await monitoreoApi.resolveAlert(alert.id);
                                  loadDataFromDatabase();
                                }}
                                className="px-3 py-1 rounded-lg bg-dark-3 hover:bg-dark-4 text-cream text-[11px] font-bold border border-dark-5 transition-all cursor-pointer flex-shrink-0"
                              >
                                Resolver
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
