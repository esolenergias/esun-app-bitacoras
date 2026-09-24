import React, { useState, useEffect } from 'react';
import { monitoreoApi } from '../api/monitoreo.api';
import type { InverterAccount, InverterBrand, DiscoveredPlant } from '../types/monitoreo.types';
import { SelectBrand } from './ui/SelectBrand';
import { 
  Plus, Server, Loader2, AlertCircle, Trash2, CheckCircle2, 
  X, Search, Download, CheckSquare, Square, Building2, User, Settings
} from 'lucide-react';
import { supabase } from '../../../context/supabase';

const BRAND_COLORS: Record<string, string> = {
  Huawei:   'bg-red-500/10 text-red-500 border-red-500/30',
  Growatt:  'bg-green-500/10 text-green-500 border-green-500/30',
  Hoymiles: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
};

interface CRMClient {
  id: string;
  nombre_razon_social: string;
  email: string | null;
}

interface PlantToImport extends DiscoveredPlant {
  selected: boolean;
  assigned_client_id: string;
  assigned_tariff: string;
  edited_plant_name: string;
  edited_capacity_kwp: number;
}

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
          className="px-4 py-2 text-xs font-black text-dark-1 bg-gold hover:bg-gold-light rounded-xl transition-all cursor-pointer"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

export const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<InverterAccount[]>([]);
  const [crmClients, setCrmClients] = useState<CRMClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Discovery Modal state
  const [discoveryModalAccount, setDiscoveryModalAccount] = useState<InverterAccount | null>(null);
  const [discoveredPlants, setDiscoveredPlants] = useState<PlantToImport[]>([]);
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState({
    brand: '' as InverterBrand | '',
    username: '',
    encrypted_password: '',
    api_token: '',
  });

  useEffect(() => {
    fetchAccounts();
    fetchCrmClients();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await monitoreoApi.getAccounts();
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  };

  const fetchCrmClients = async () => {
    try {
      const { data } = await supabase
        .from('clientes')
        .select('id, nombre_razon_social, email')
        .order('nombre_razon_social', { ascending: true });
      setCrmClients(data || []);
    } catch (err) {
      console.warn("Could not load CRM clients:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.username) return;

    try {
      setSubmitting(true);
      setError(null);
      await monitoreoApi.createAccount({
        brand: formData.brand as InverterBrand,
        username: formData.username,
        encrypted_password: formData.encrypted_password,
        api_token: formData.api_token,
      });
      setFormData({ brand: '', username: '', encrypted_password: '', api_token: '' });
      showToast('Cuenta Maestra vinculada exitosamente');
      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Error al guardar cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (acc: InverterAccount) => {
    setConfirm({
      title: 'Eliminar Cuenta de Inversor',
      message: `¿Estás seguro de eliminar la cuenta ${acc.brand} (${acc.username})? Se eliminarán todos los sistemas y registros asociados a esta cuenta.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          setDeletingId(acc.id);
          await monitoreoApi.deleteAccount(acc.id);
          setAccounts(prev => prev.filter(a => a.id !== acc.id));
          showToast('Cuenta eliminada correctamente');
        } catch (err: any) {
          setError(err.message || 'Error al eliminar cuenta');
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleDiscover = async (acc: InverterAccount) => {
    try {
      setDiscoveringId(acc.id);
      setError(null);
      const res = await monitoreoApi.discoverPlants(acc.id);
      
      const plants: PlantToImport[] = (res.plants || []).map((p) => ({
        ...p,
        selected: !p.already_registered,
        assigned_client_id: '',
        assigned_tariff: 'DAC',
        edited_plant_name: p.plant_name,
        edited_capacity_kwp: p.capacity_kwp || 5.0,
      }));

      setDiscoveredPlants(plants);
      setDiscoveryModalAccount(acc);
      
      if (plants.length === 0) {
        showToast('No se encontraron plantas en esta cuenta o ya están todas importadas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al descubrir plantas de la cuenta');
      showToast(err.message || 'Falla de conexión con la API del inversor');
    } finally {
      setDiscoveringId(null);
    }
  };

  const toggleSelectAll = () => {
    const areAllSelected = discoveredPlants.every(p => p.selected || p.already_registered);
    setDiscoveredPlants(prev => prev.map(p => ({
      ...p,
      selected: p.already_registered ? false : !areAllSelected
    })));
  };

  const toggleSelectPlant = (plantId: string) => {
    setDiscoveredPlants(prev => prev.map(p => 
      p.plant_id === plantId ? { ...p, selected: !p.selected } : p
    ));
  };

  const handleConfirmBulkImport = async () => {
    if (!discoveryModalAccount) return;
    const selected = discoveredPlants.filter(p => p.selected);
    if (selected.length === 0) {
      showToast('Selecciona al menos un sistema para importar');
      return;
    }

    try {
      setImporting(true);
      const payload = selected.map(p => ({
        account_id: discoveryModalAccount.id,
        plant_id: p.plant_id,
        plant_name: p.edited_plant_name,
        capacity_kwp: p.edited_capacity_kwp,
        cfe_tariff: p.assigned_tariff,
        client_id: p.assigned_client_id || undefined,
      }));

      await monitoreoApi.bulkImportSystems(payload);
      showToast(`¡${selected.length} sistema(s) importado(s) y vinculado(s) con éxito!`);
      setDiscoveryModalAccount(null);
      setDiscoveredPlants([]);
    } catch (err: any) {
      setError(err.message || 'Error al importar sistemas masivamente');
    } finally {
      setImporting(false);
    }
  };

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Form de Configuración global
  const [configData, setConfigData] = useState({
    autoSyncInterval: '60',
    notifyAlertsEmail: true,
    geminiAiAnalysis: true,
  });

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

      {/* ── MODAL DE CONFIGURACIÓN GLOBAL ── */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-dark-2 border border-dark-4 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-dark-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                <h3 className="text-base font-black text-cream">Configuración de Monitoreo</h3>
              </div>
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="text-cream-muted hover:text-cream p-1 rounded-lg hover:bg-dark-3 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-cream mb-1">Frecuencia de Sincronización Automática</label>
                <select
                  value={configData.autoSyncInterval}
                  onChange={(e) => setConfigData({ ...configData, autoSyncInterval: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-xl px-3.5 py-2 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="15">Cada 15 minutos</option>
                  <option value="30">Cada 30 minutos</option>
                  <option value="60">Cada hora (Recomendado)</option>
                  <option value="360">Cada 6 horas</option>
                  <option value="1440">Una vez al día</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-1 rounded-xl border border-dark-4">
                <div>
                  <p className="text-xs font-bold text-cream">Notificaciones de Alerta por Email</p>
                  <p className="text-[10px] text-cream-muted">Enviar correos cuando se detecten fallas críticas</p>
                </div>
                <input
                  type="checkbox"
                  checked={configData.notifyAlertsEmail}
                  onChange={(e) => setConfigData({ ...configData, notifyAlertsEmail: e.target.checked })}
                  className="accent-gold w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-1 rounded-xl border border-dark-4">
                <div>
                  <p className="text-xs font-bold text-cream">Diagnóstico Continuo con Gemini IA</p>
                  <p className="text-[10px] text-cream-muted">Analizar variaciones anómalas de generación automáticamente</p>
                </div>
                <input
                  type="checkbox"
                  checked={configData.geminiAiAnalysis}
                  onChange={(e) => setConfigData({ ...configData, geminiAiAnalysis: e.target.checked })}
                  className="accent-gold w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-dark-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-cream-muted hover:text-cream bg-dark-1 hover:bg-dark-3 border border-dark-4 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfigModalOpen(false);
                  showToast('Configuración guardada correctamente');
                }}
                className="px-5 py-2 text-xs font-black text-dark-1 bg-gold hover:bg-gold-light rounded-xl transition-all cursor-pointer shadow-md shadow-gold/10"
              >
                Guardar Ajustes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE AUTO-DESCUBRIMIENTO E IMPORTACIÓN MASIVA ── */}
      {discoveryModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-dark-2 border border-dark-4 rounded-3xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-dark-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/30">
                  Auto-Descubrimiento Activo
                </span>
                <h3 className="text-xl font-black text-cream mt-1 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gold" />
                  Plantas detectadas en {discoveryModalAccount.brand} ({discoveryModalAccount.username})
                </h3>
                <p className="text-xs text-cream-muted mt-0.5">
                  Selecciona las plantas que deseas agregar a Esol y asígnalas a su cliente y tarifa CFE.
                </p>
              </div>
              <button 
                onClick={() => setDiscoveryModalAccount(null)} 
                className="text-cream-muted hover:text-cream p-1.5 rounded-xl hover:bg-dark-3 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabla de Plantas Descubiertas */}
            <div className="flex-1 overflow-y-auto py-4">
              {discoveredPlants.length === 0 ? (
                <div className="text-center py-12 text-cream-muted">
                  <p className="font-bold">No se detectaron plantas disponibles en esta cuenta.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-xs font-bold text-cream hover:text-gold transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4 text-gold" />
                      Seleccionar / Deseleccionar Todos
                    </button>
                    <span className="text-xs font-mono text-cream-dim">
                      {discoveredPlants.filter(p => p.selected).length} seleccionados de {discoveredPlants.length}
                    </span>
                  </div>

                  <div className="border border-dark-4 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs text-cream-muted">
                      <thead className="bg-dark-1 text-cream border-b border-dark-4 uppercase text-[11px]">
                        <tr>
                          <th className="px-3 py-3 w-10 text-center">Sel.</th>
                          <th className="px-3 py-3">ID / Nombre de Planta</th>
                          <th className="px-3 py-3 w-28">Capacidad (kWp)</th>
                          <th className="px-3 py-3 w-36">Tarifa CFE</th>
                          <th className="px-3 py-3 w-56">Cliente (CRM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4">
                        {discoveredPlants.map((plant) => (
                          <tr 
                            key={plant.plant_id} 
                            className={`transition-colors ${plant.already_registered ? 'opacity-40 bg-dark-1/30' : plant.selected ? 'bg-gold/5' : 'hover:bg-dark-1/50'}`}
                          >
                            <td className="px-3 py-3 text-center">
                              {plant.already_registered ? (
                                <span className="text-[10px] font-bold text-cream-dim block">Ya en BD</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleSelectPlant(plant.plant_id)}
                                  className="text-gold cursor-pointer"
                                >
                                  {plant.selected ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4 text-cream-dim" />
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <div>
                                <input
                                  type="text"
                                  disabled={plant.already_registered || !plant.selected}
                                  value={plant.edited_plant_name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDiscoveredPlants(prev => prev.map(p => 
                                      p.plant_id === plant.plant_id ? { ...p, edited_plant_name: val } : p
                                    ));
                                  }}
                                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-2.5 py-1 text-cream font-bold focus:border-gold outline-none"
                                />
                                <span className="text-[10px] font-mono text-cream-dim block mt-0.5">ID: {plant.plant_id}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                step="0.1"
                                disabled={plant.already_registered || !plant.selected}
                                value={plant.edited_capacity_kwp}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setDiscoveredPlants(prev => prev.map(p => 
                                    p.plant_id === plant.plant_id ? { ...p, edited_capacity_kwp: val } : p
                                  ));
                                }}
                                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-2.5 py-1 text-cream font-bold focus:border-gold outline-none"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <select
                                disabled={plant.already_registered || !plant.selected}
                                value={plant.assigned_tariff}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDiscoveredPlants(prev => prev.map(p => 
                                    p.plant_id === plant.plant_id ? { ...p, assigned_tariff: val } : p
                                  ));
                                }}
                                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-2 py-1 text-cream font-bold focus:border-gold outline-none"
                              >
                                {['1', '1A', '1B', '1C', 'DAC', 'PDBT', 'GDMTO'].map(t => (
                                  <option key={t} value={t}>Tarifa {t}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              <select
                                disabled={plant.already_registered || !plant.selected}
                                value={plant.assigned_client_id}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDiscoveredPlants(prev => prev.map(p => 
                                    p.plant_id === plant.plant_id ? { ...p, assigned_client_id: val } : p
                                  ));
                                }}
                                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-2 py-1 text-cream focus:border-gold outline-none"
                              >
                                <option value="">— Sin asignar a Cliente —</option>
                                {crmClients.map(c => (
                                  <option key={c.id} value={c.id}>{c.nombre_razon_social}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con Acciones */}
            <div className="pt-4 border-t border-dark-4 flex justify-between items-center">
              <span className="text-xs text-cream-muted">
                {discoveredPlants.filter(p => p.selected).length} de {discoveredPlants.length} sistema(s) listos para importar.
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDiscoveryModalAccount(null)}
                  className="px-4 py-2 text-xs font-bold text-cream-muted hover:text-cream bg-dark-1 hover:bg-dark-3 border border-dark-4 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkImport}
                  disabled={importing || discoveredPlants.filter(p => p.selected).length === 0}
                  className="px-5 py-2 text-xs font-black text-dark-1 bg-gold hover:bg-gold-light rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-gold/10"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Importar y Vincular ({discoveredPlants.filter(p => p.selected).length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold border border-green-500/40 bg-green-500/10 text-green-500 animate-[fadeIn_0.3s_ease-out]">
          <CheckCircle2 className="w-4 h-4" />
          {successToast}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Formulario de Alta de Cuenta Maestra */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-cream flex items-center gap-2">
              <Plus className="w-5 h-5 text-gold" />
              Vincular Cuenta Maestra de Inversor
            </h3>
            <p className="text-xs text-cream-muted mt-0.5">
              Registra tu cuenta instaladora/maestra de Huawei, Growatt o Hoymiles para escanear e importar todos sus sistemas anidados.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-cream-muted mb-1">Marca del Inversor</label>
            <SelectBrand
              value={formData.brand}
              onChange={(val) => setFormData({ ...formData, brand: val })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-cream-muted mb-1">Usuario / Email Maestro</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="instalador@esolenergias.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-cream-muted mb-1">Contraseña / SystemCode (Huawei / Hoymiles)</label>
            <input
              type="password"
              value={formData.encrypted_password}
              onChange={(e) => setFormData({ ...formData, encrypted_password: e.target.value })}
              className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-cream-muted mb-1">API Token (Growatt OpenAPI)</label>
            <input
              type="text"
              value={formData.api_token}
              onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
              className="w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="token..."
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !formData.brand || !formData.username}
              className="px-6 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-gold/10"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
              Guardar Cuenta Maestra
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Cuentas Maestras con Botón de Auto-Descubrimiento */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 overflow-hidden shadow-sm">
        <h3 className="text-lg font-bold text-cream mb-4">Cuentas Maestras Registradas</h3>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-cream-muted text-center py-8 font-medium">No hay cuentas registradas aún. Registra tu cuenta instaladora arriba.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-cream-muted">
              <thead className="bg-dark-1 text-cream border-b border-dark-4 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl font-bold">Marca</th>
                  <th className="px-4 py-3 font-bold">Usuario / Email Maestro</th>
                  <th className="px-4 py-3 font-bold">Fecha Registro</th>
                  <th className="px-4 py-3 rounded-tr-xl text-center font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => {
                  const isDiscovering = discoveringId === acc.id;
                  return (
                    <tr key={acc.id} className="border-b border-dark-4 last:border-0 hover:bg-dark-1/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-cream">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${BRAND_COLORS[acc.brand] || 'bg-dark-3 text-cream-muted border-dark-4'}`}>
                          {acc.brand}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-cream">{acc.username}</td>
                      <td className="px-4 py-3 text-xs">{acc.created_at ? new Date(acc.created_at).toLocaleDateString('es-MX') : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDiscover(acc)}
                            disabled={isDiscovering}
                            title="Auto-descubrir y escanear sistemas anidados"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-1 hover:bg-gold text-cream hover:text-dark-1 border border-dark-4 hover:border-gold rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isDiscovering ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Search className="w-3.5 h-3.5 text-gold group-hover:text-dark-1" />
                            )}
                            <span>{isDiscovering ? 'Escaneando...' : 'Descubrir Plantas'}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(acc)}
                            disabled={deletingId === acc.id || isDiscovering}
                            title="Eliminar cuenta"
                            className="p-1.5 bg-dark-1 hover:bg-red-500/10 border border-dark-4 hover:border-red-500/30 text-cream-muted hover:text-red-500 rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                          >
                            {deletingId === acc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
