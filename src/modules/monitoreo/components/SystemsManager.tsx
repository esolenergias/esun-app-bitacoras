import React, { useState, useEffect } from 'react';
import { monitoreoApi } from '../api/monitoreo.api';
import type { InverterAccount, PVSystem } from '../types/monitoreo.types';
import { Plus, Zap, Loader2, AlertCircle } from 'lucide-react';

export const SystemsManager: React.FC = () => {
  const [systems, setSystems] = useState<PVSystem[]>([]);
  const [accounts, setAccounts] = useState<InverterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    account_id: '',
    plant_id: '',
    plant_name: '',
    capacity_kwp: '',
    cfe_tariff: 'DAC',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sysData, accData] = await Promise.all([
        monitoreoApi.getAllSystems(),
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
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar sistema');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-dark-2 border border-dark-3 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-gold" />
          Registrar Nuevo Sistema
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <label className="block text-sm text-cream-muted mb-1">Cuenta de Inversor</label>
            <select
              required
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              <option value="" disabled>Seleccione una cuenta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.brand} - {acc.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1">ID de Planta (Plant ID)</label>
            <input
              type="text"
              required
              value={formData.plant_id}
              onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Ej. NE12345678"
            />
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1">Nombre de la Planta</label>
            <input
              type="text"
              required
              value={formData.plant_name}
              onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Ej. Casa Familia Lopez"
            />
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1">Capacidad (kWp)</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.capacity_kwp}
              onChange={(e) => setFormData({ ...formData, capacity_kwp: e.target.value })}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Ej. 5.5"
            />
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1">Tarifa CFE</label>
            <select
              value={formData.cfe_tariff}
              onChange={(e) => setFormData({ ...formData, cfe_tariff: e.target.value })}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              <option value="1">Tarifa 1</option>
              <option value="1A">Tarifa 1A</option>
              <option value="1B">Tarifa 1B</option>
              <option value="1C">Tarifa 1C</option>
              <option value="DAC">DAC</option>
              <option value="PDBT">PDBT</option>
              <option value="GDMTO">GDMTO</option>
            </select>
          </div>
          
          <div className="lg:col-span-2 flex justify-end mt-2 items-end">
            <button
              type="submit"
              disabled={submitting || !formData.account_id || !formData.plant_id || !formData.plant_name || !formData.capacity_kwp}
              className="px-6 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Registrar Sistema
            </button>
          </div>
        </form>
      </div>

      <div className="bg-dark-2 border border-dark-3 rounded-2xl p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4">Sistemas Fotovoltaicos</h3>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : systems.length === 0 ? (
          <p className="text-cream-muted text-center py-8">No hay sistemas registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-cream-muted">
              <thead className="bg-dark-3 text-white uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">Nombre / Planta</th>
                  <th className="px-4 py-3">ID Planta</th>
                  <th className="px-4 py-3">Capacidad</th>
                  <th className="px-4 py-3">Tarifa CFE</th>
                  <th className="px-4 py-3 rounded-tr-xl">Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {systems.map((sys) => (
                  <tr key={sys.id} className="border-b border-dark-3 last:border-0 hover:bg-dark-3/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{sys.plant_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{sys.plant_id}</td>
                    <td className="px-4 py-3">{sys.capacity_kwp} kWp</td>
                    <td className="px-4 py-3">
                      <span className="bg-dark-4 text-cream-muted px-2 py-1 rounded-md text-xs font-bold">
                        {sys.cfe_tariff || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(sys.created_at || '').toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
