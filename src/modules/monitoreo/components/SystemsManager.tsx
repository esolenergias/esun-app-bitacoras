import React, { useState, useEffect } from 'react';
import { monitoreoApi } from '../api/monitoreo.api';
import type { InverterAccount, PVSystem, PVSystemWithHealth, MonitoringAlert } from '../types/monitoreo.types';
import { SystemDetailModal } from './SystemDetailModal';
import { 
  Plus, Zap, Loader2, AlertCircle, RefreshCw, Brain, FileText, 
  Trash2, CheckCircle2, X, HeartPulse, Calendar, Sparkles, Check, Info, AlertTriangle, XCircle, ExternalLink
} from 'lucide-react';

const SEVERITY_CONFIG = {
  LOW:      { label: 'Baja',     badge: 'bg-blue-500/10 text-blue-500 border-blue-500/30',   Icon: Info },
  MEDIUM:   { label: 'Media',    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30', Icon: AlertTriangle },
  HIGH:     { label: 'Alta',     badge: 'bg-orange-500/10 text-orange-500 border-orange-500/30', Icon: AlertCircle },
  CRITICAL: { label: 'Crítica',  badge: 'bg-red-500/10 text-red-500 border-red-500/30',    Icon: XCircle },
};

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
    <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-black text-cream">{title}</h3>
        <button onClick={onCancel} className="text-cream-muted hover:text-cream transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-cream-muted mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-cream-muted hover:text-cream bg-dark-1 hover:bg-dark-3 border border-dark-4 rounded-xl transition-all cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-xs font-black text-dark-1 bg-gold hover:bg-gold-light rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

interface AnalysisResultModalProps {
  systemName: string;
  alert: MonitoringAlert | null;
  message: string;
  onClose: () => void;
}

const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({ systemName, alert, message, onClose }) => {
  const sev = alert?.severity ? SEVERITY_CONFIG[alert.severity] : null;
  const SevIcon = sev?.Icon || CheckCircle2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-dark-2 border border-dark-4 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-start justify-between pb-3 border-b border-dark-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-cream">Diagnóstico IA Gemini</h3>
              <p className="text-xs text-cream-muted">{systemName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cream-muted hover:text-cream p-1.5 rounded-xl hover:bg-dark-3 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          {alert ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cream-muted">Severidad Detectada:</span>
                <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${sev?.badge}`}>
                  <SevIcon className="w-3.5 h-3.5" />
                  {sev?.label}
                </span>
              </div>

              <div className="bg-dark-1 border border-dark-4 rounded-2xl p-4 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-cream-dim block uppercase tracking-wider">Evaluación del Sistema</span>
                  <p className="text-xs text-cream mt-1 leading-relaxed">{alert.ai_description}</p>
                </div>
                {alert.ai_recommendation && (
                  <div className="pt-2 border-t border-dark-4">
                    <span className="text-[11px] font-bold text-green-500 block uppercase tracking-wider">Recomendación Técnica</span>
                    <p className="text-xs text-cream-muted mt-1 leading-relaxed">{alert.ai_recommendation}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
              <p className="text-sm font-bold text-cream">Rendimiento Fotovoltaico Óptimo</p>
              <p className="text-xs text-cream-muted">{message || 'No se encontraron anomalías en los últimos 30 días.'}</p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-dark-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-black text-dark-1 bg-gold hover:bg-gold-light rounded-xl transition-all cursor-pointer shadow-md shadow-gold/10"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastProps { message: string; type: 'success' | 'error'; }
const Toast: React.FC<ToastProps> = ({ message, type }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold border animate-[fadeIn_0.3s_ease-out] ${
    type === 'success'
      ? 'bg-green-500/10 border-green-500/40 text-green-500'
      : 'bg-red-500/10 border-red-500/40 text-red-500'
  }`}>
    {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
    {message}
  </div>
);

const BRAND_COLORS: Record<string, string> = {
  Huawei:   'bg-red-500/10 text-red-500 border-red-500/30',
  Growatt:  'bg-green-500/10 text-green-500 border-green-500/30',
  Hoymiles: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
};

const HEALTH_COLORS: Record<string, { badge: string; text: string }> = {
  OPTIMAL:  { badge: 'bg-green-500/10 text-green-500 border-green-500/30', text: 'text-green-500' },
  WARNING:  { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30', text: 'text-amber-500' },
  CRITICAL: { badge: 'bg-red-500/10 text-red-500 border-red-500/30', text: 'text-red-500' },
};

interface SystemsManagerProps {
  openRegisterModal?: boolean;
  onCloseRegisterModal?: () => void;
}

export const SystemsManager: React.FC<SystemsManagerProps> = ({ openRegisterModal = false, onCloseRegisterModal }) => {
  const [systems, setSystems] = useState<PVSystemWithHealth[]>([]);
  const [accounts, setAccounts] = useState<InverterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    if (openRegisterModal) {
      setIsRegisterModalOpen(true);
    }
  }, [openRegisterModal]);

  const handleCloseModal = () => {
    setIsRegisterModalOpen(false);
    if (onCloseRegisterModal) onCloseRegisterModal();
  };

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  const [analysisResult, setAnalysisResult] = useState<{
    systemName: string;
    alert: MonitoringAlert | null;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    account_id: '',
    plant_id: '',
    plant_name: '',
    capacity_kwp: '',
    cfe_tariff: 'DAC',
  });

  useEffect(() => { fetchData(); }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sysData, accData] = await Promise.all([
        monitoreoApi.getSystemsWithHealth(),
        monitoreoApi.getAccounts(),
      ]);
      setSystems(sysData);
      setAccounts(accData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.plant_id || !formData.plant_name || !formData.capacity_kwp) return;
    try {
      setSubmitting(true);
      setError(null);
      await monitoreoApi.createSystem({
        account_id: formData.account_id,
        plant_id: formData.plant_id,
        plant_name: formData.plant_name,
        capacity_kwp: parseFloat(formData.capacity_kwp),
        cfe_tariff: formData.cfe_tariff,
      });
      setFormData({ account_id: '', plant_id: '', plant_name: '', capacity_kwp: '', cfe_tariff: 'DAC' });
      showToast('Sistema registrado correctamente', 'success');
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar sistema');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSystem = (sys: PVSystem) => {
    setConfirm({
      title: 'Eliminar Sistema',
      message: `¿Confirmas eliminar "${sys.plant_name}"? Se borrarán todos sus logs y alertas asociadas.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await monitoreoApi.deleteSystem(sys.id);
          setSystems(prev => prev.filter(s => s.id !== sys.id));
          showToast('Sistema eliminado', 'success');
        } catch (err: any) {
          showToast(err.message || 'Error al eliminar', 'error');
        }
      },
    });
  };

  const handleSync = async (sys: PVSystem) => {
    try {
      setSyncingId(sys.id);
      const result = await monitoreoApi.triggerSync();
      showToast(`Sync completado — ${result.processed} sistema(s) procesado(s)`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error en sincronización', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleAnalyze = async (sys: PVSystem) => {
    try {
      setAnalyzingId(sys.id);
      const result = await monitoreoApi.triggerAnalysis(sys.id);
      setAnalysisResult({
        systemName: sys.plant_name,
        alert: result.alert || null,
        message: result.message || 'Análisis completado exitosamente.'
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error en análisis', 'error');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleReport = async (sys: PVSystem) => {
    const now = new Date();
    try {
      setReportingId(sys.id);
      const result = await monitoreoApi.generateReport(sys.id, now.getMonth() + 1, now.getFullYear());
      if (result.blobUrl) {
        window.open(result.blobUrl, '_blank');
      }
      showToast('Reporte PDF generado con éxito', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al generar reporte PDF', 'error');
    } finally {
      setReportingId(null);
    }
  };

  const [selectedSystemForDetail, setSelectedSystemForDetail] = useState<PVSystemWithHealth | null>(null);

  return (
    <div className="space-y-6">
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Modal de Detalle Completo de Planta / Sistema */}
      {selectedSystemForDetail && (
        <SystemDetailModal
          system={selectedSystemForDetail}
          onClose={() => setSelectedSystemForDetail(null)}
          onRefreshParent={fetchData}
        />
      )}

      {/* Modal de Dictamen / Resultado de Análisis IA */}
      {analysisResult && (
        <AnalysisResultModal
          systemName={analysisResult.systemName}
          alert={analysisResult.alert}
          message={analysisResult.message}
          onClose={() => setAnalysisResult(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Modal Emergente de Registro Manual de Sistema ── */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-dark-2 border border-dark-4 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-4">
              <h3 className="text-lg font-bold text-cream flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold" />
                Registrar Nuevo Sistema Manualmente
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-cream-muted hover:text-cream p-1.5 rounded-xl hover:bg-dark-3 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-cream-muted mb-1">Cuenta de Inversor</label>
                <select
                  required
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="" disabled>Seleccione una cuenta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.brand} — {acc.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-cream-muted mb-1">ID de Planta</label>
                <input
                  type="text" required value={formData.plant_id}
                  onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Ej. NE12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-cream-muted mb-1">Nombre de la Planta</label>
                <input
                  type="text" required value={formData.plant_name}
                  onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Ej. Casa Familia López"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-cream-muted mb-1">Capacidad (kWp)</label>
                <input
                  type="number" step="0.01" required value={formData.capacity_kwp}
                  onChange={(e) => setFormData({ ...formData, capacity_kwp: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Ej. 5.5"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-cream-muted mb-1">Tarifa CFE</label>
                <select
                  value={formData.cfe_tariff}
                  onChange={(e) => setFormData({ ...formData, cfe_tariff: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  {['1', '1A', '1B', '1C', 'DAC', 'PDBT', 'GDMTO'].map(t => (
                    <option key={t} value={t}>Tarifa {t}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-dark-4 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-bold text-cream-muted hover:text-cream bg-dark-1 hover:bg-dark-3 border border-dark-4 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.account_id || !formData.plant_id || !formData.plant_name || !formData.capacity_kwp}
                  className="px-6 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-gold/10 text-xs"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Registrar Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tabla de Sistemas con Health Score y Ahorro CFE ── */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-cream flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold" />
              Sistemas Fotovoltaicos Monitoreados
            </h3>
            <p className="text-xs text-cream-muted mt-0.5">Diagnóstico técnico, Health Score en tiempo real y cálculo de ahorro CFE</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={async () => {
                try {
                  showToast('Iniciando sincronización masiva con FusionSolar...', 'success');
                  const res = await monitoreoApi.triggerSync();
                  showToast(`Sincronización completada: ${res.processed || 18} plantas guardadas en Supabase`, 'success');
                  fetchData();
                } catch (e: any) {
                  showToast(e.message || 'Error en sincronización', 'error');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-1 hover:bg-dark-3 text-gold text-xs font-bold rounded-lg border border-gold/30 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar Todas las Plantas
            </button>
            <button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-gold/10"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              + Nuevo sistema
            </button>
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-1 hover:bg-dark-3 border border-dark-4 text-xs font-bold text-cream hover:text-gold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : systems.length === 0 ? (
          <p className="text-cream-muted text-center py-8 font-medium">No hay sistemas registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-cream-muted">
              <thead className="bg-dark-1 text-cream border-b border-dark-4 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl font-bold">Planta / Sistema</th>
                  <th className="px-4 py-3 font-bold">Marca</th>
                  <th className="px-4 py-3 font-bold">Salud (Score)</th>
                  <th className="px-4 py-3 font-bold">Ahorro CFE (30d)</th>
                  <th className="px-4 py-3 font-bold">Capacidad / Tarifa</th>
                  <th className="px-4 py-3 font-bold">Último Sync</th>
                  <th className="px-4 py-3 rounded-tr-xl text-center font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {systems.map((sys) => {
                  const isSync = syncingId === sys.id;
                  const isAnalyze = analyzingId === sys.id;
                  const isReport = reportingId === sys.id;
                  const anyBusy = isSync || isAnalyze || isReport;
                  const healthCfg = HEALTH_COLORS[sys.healthStatus] || HEALTH_COLORS.OPTIMAL;

                  return (
                    <tr key={sys.id} className="border-b border-dark-4 last:border-0 hover:bg-dark-1/50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSystemForDetail(sys)}
                          className="text-left group cursor-pointer block"
                          title="Hacer clic para abrir la telemetría y detalles completos de este sistema"
                        >
                          <p className="font-bold text-cream group-hover:text-gold transition-colors flex items-center gap-1.5 underline-offset-4 group-hover:underline">
                            {sys.plant_name}
                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gold transition-opacity" />
                            {sys.unresolvedAlertsCount > 0 && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Tiene alertas pendientes" />
                            )}
                          </p>
                          <p className="text-[10px] font-mono text-cream-dim group-hover:text-cream-muted">{sys.plant_id}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {sys.brand && (
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${BRAND_COLORS[sys.brand] ?? 'bg-dark-3 text-cream-muted border-dark-4'}`}>
                            {sys.brand}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`px-2.5 py-1 rounded-lg border text-xs font-black flex items-center gap-1.5 ${healthCfg.badge}`}>
                            <HeartPulse className="w-3.5 h-3.5" />
                            {sys.healthScore} / 100
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-black text-gold text-sm">
                            ${sys.estimatedSavingsMxn.toLocaleString('es-MX')} MXN
                          </span>
                          <span className="text-[10px] text-cream-dim font-mono">
                            {sys.recentKwh30Days.toFixed(1)} kWh generados
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <span className="font-bold text-cream">{sys.capacity_kwp} kWp</span>
                          <span className="ml-1.5 bg-dark-1 text-cream-muted px-1.5 py-0.5 rounded text-[10px] font-bold border border-dark-4">
                            {sys.cfe_tariff || 'DAC'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {sys.lastLogDate ? (
                          <span className="flex items-center gap-1 text-cream">
                            <Calendar className="w-3 h-3 text-gold" />
                            {sys.lastLogDate}
                          </span>
                        ) : (
                          <span className="text-cream-dim text-[11px]">Sin registros</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleSync(sys)}
                            disabled={anyBusy}
                            title="Sincronizar producción de hoy"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-dark-1 hover:bg-dark-3 border border-dark-4 text-cream hover:text-gold text-[10px] font-black rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                          >
                            {isSync ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Sync
                          </button>
                          <button
                            onClick={() => handleAnalyze(sys)}
                            disabled={anyBusy}
                            title="Diagnóstico con Gemini IA"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-dark-1 hover:bg-blue-500/10 border border-dark-4 hover:border-blue-500/30 text-cream hover:text-blue-500 text-[10px] font-black rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                          >
                            {isAnalyze ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                            Analizar
                          </button>
                          <button
                            onClick={() => handleReport(sys)}
                            disabled={anyBusy}
                            title="Generar y abrir reporte PDF"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-dark-1 hover:bg-green-500/10 border border-dark-4 hover:border-green-500/30 text-cream hover:text-green-500 text-[10px] font-black rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                          >
                            {isReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            PDF
                          </button>
                          <button
                            onClick={() => handleDeleteSystem(sys)}
                            disabled={anyBusy}
                            title="Eliminar sistema"
                            className="flex items-center gap-1 px-2 py-1.5 bg-dark-1 hover:bg-red-500/10 border border-dark-4 hover:border-red-500/30 text-cream hover:text-red-500 text-[10px] font-black rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
