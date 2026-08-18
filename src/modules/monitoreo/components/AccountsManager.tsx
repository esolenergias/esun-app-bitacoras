import React, { useState, useEffect } from 'react';
import { monitoreoApi } from '../api/monitoreo.api';
import type { InverterAccount, InverterBrand } from '../types/monitoreo.types';
import { SelectBrand } from './ui/SelectBrand';
import { Plus, Server, Loader2, AlertCircle } from 'lucide-react';

export const AccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<InverterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brand: '' as InverterBrand | '',
    username: '',
    encrypted_password: '',
    api_token: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

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
      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Error al guardar cuenta');
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
          Vincular Nueva Cuenta
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-cream-muted mb-1">Marca del Inversor</label>
            <SelectBrand
              value={formData.brand}
              onChange={(val) => setFormData({ ...formData, brand: val })}
              className="w-full bg-dark-3 border-dark-4 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1">Usuario / Email</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="admin@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1">Contraseña (opcional según marca)</label>
            <input
              type="password"
              value={formData.encrypted_password}
              onChange={(e) => setFormData({ ...formData, encrypted_password: e.target.value })}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1">API Token (opcional)</label>
            <input
              type="text"
              value={formData.api_token}
              onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="token..."
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !formData.brand || !formData.username}
              className="px-6 py-2 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
              Guardar Cuenta
            </button>
          </div>
        </form>
      </div>

      <div className="bg-dark-2 border border-dark-3 rounded-2xl p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4">Cuentas Vinculadas</h3>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-cream-muted text-center py-8">No hay cuentas registradas aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-cream-muted">
              <thead className="bg-dark-3 text-white uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">Marca</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3 rounded-tr-xl">Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-dark-3 last:border-0 hover:bg-dark-3/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{acc.brand}</td>
                    <td className="px-4 py-3">{acc.username}</td>
                    <td className="px-4 py-3">{new Date(acc.created_at || '').toLocaleDateString()}</td>
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
