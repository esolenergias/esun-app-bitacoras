import React, { useState } from 'react';
import type { CuentaFinanciera, MovimientoFinanciero } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import { 
  Landmark, Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Plus, Search, 
  CreditCard, RefreshCw, Eye
} from 'lucide-react';

interface CajaBancosTabProps {
  cuentas: CuentaFinanciera[];
  movimientos: MovimientoFinanciero[];
  userRole?: string;
  userName?: string;
  canEdit?: boolean;
  onRefresh: () => void;
}

export const CajaBancosTab: React.FC<CajaBancosTabProps> = ({
  cuentas,
  movimientos,
  userRole = 'master',
  userName = 'Tesorero',
  canEdit = true,
  onRefresh
}) => {
  const isAllowedToEdit = canEdit && userRole !== 'visor';
  const [activeSubTab, setActiveSubTab] = useState<'todas' | 'caja_chica' | 'caja_grande' | 'banco'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Movimiento
  const [cuentaId, setCuentaId] = useState('');
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('egreso');
  const [monto, setMonto] = useState(0);
  const [concepto, setConcepto] = useState('');
  const [referencia, setReferencia] = useState('');

  const saldoTotalGlobal = cuentas.reduce((acc, c) => acc + c.saldo_actual, 0);

  const handleGuardarMovimiento = async () => {
    if (!isAllowedToEdit) {
      alert('Operación no permitida: Tu usuario está en Modo Visor (solo lectura).');
      return;
    }
    if (!cuentaId || monto <= 0 || !concepto.trim()) {
      alert('Complete los campos requeridos y asegúrese de que el monto sea mayor a 0.');
      return;
    }

    const c = cuentas.find(acc => acc.id === cuentaId);
    if (!c) return;

    if (tipo === 'egreso' && c.saldo_actual < monto) {
      if (!confirm(`La cuenta tiene un saldo de $${c.saldo_actual.toFixed(2)}, el cual es menor al egreso de $${monto.toFixed(2)}. ¿Desea continuar de todos modos?`)) {
        return;
      }
    }

    const nuevoMov: Partial<MovimientoFinanciero> = {
      cuenta_id: cuentaId,
      tipo,
      categoria: tipo === 'ingreso' ? 'deposito' : 'gasto_operativo',
      monto,
      concepto: concepto.trim(),
      referencia: referencia.trim(),
      usuario_registro: userName
    };

    await adminDbService.crearMovimientoFinanciero(nuevoMov);
    onRefresh();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCuentaId('');
    setTipo('egreso');
    setMonto(0);
    setConcepto('');
    setReferencia('');
  };

  const filteredCuentas = cuentas.filter(c => {
    if (activeSubTab === 'todas') return true;
    return c.tipo === activeSubTab;
  });

  const filteredMovimientos = movimientos.filter(m => {
    return (
      m.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.referencia && m.referencia.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Tesorería
            </span>
            <h2 className="text-xl font-bold text-cream">Caja Chica, Caja Grande y Bancos</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Administración centralizada de cuentas de liquidez, fondos fijos de caja y estados de cuenta en tiempo real.
          </p>
        </div>

        {isAllowedToEdit ? (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Movimiento en Cuenta
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-dark-3 border border-dark-4 text-cream-muted rounded-xl text-xs font-bold select-none">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo Visor (Solo Lectura)</span>
          </div>
        )}
      </div>

      {/* Tarjetas de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cuentas.map(c => {
          const isBanco = c.tipo === 'banco';
          const isCajaChica = c.tipo === 'caja_chica';

          return (
            <div
              key={c.id}
              className={`p-5 rounded-2xl border relative overflow-hidden transition-all shadow-sm ${
                isBanco
                  ? 'bg-gradient-to-br from-slate-900 to-blue-950 text-white border-slate-800'
                  : isCajaChica
                  ? 'bg-dark-2 border-amber-200 hover:border-amber-400'
                  : 'bg-dark-2 border-emerald-200 hover:border-emerald-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isBanco ? 'bg-gold/100/20 text-blue-300' :
                    isCajaChica ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {c.tipo.replace('_', ' ')}
                  </span>
                  <h3 className={`text-base font-bold mt-2 ${isBanco ? 'text-white' : 'text-cream'}`}>
                    {c.nombre}
                  </h3>
                  {c.banco && (
                    <p className={`text-xs ${isBanco ? 'text-cream-dim/60' : 'text-cream-muted'}`}>
                      {c.banco} {c.numero_cuenta ? `• ${c.numero_cuenta}` : ''}
                    </p>
                  )}
                </div>
                <div className={`p-2.5 rounded-xl border ${isBanco ? 'bg-gold/10 text-gold border-gold/30' : isCajaChica ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                  {isBanco ? <Landmark className="w-5 h-5" /> : isCajaChica ? <Wallet className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                </div>
              </div>

              <div className="mt-6">
                <span className={`text-xs ${isBanco ? 'text-cream-dim' : 'text-cream-muted'}`}>Saldo Disponible</span>
                <div className={`text-2xl font-black font-mono mt-0.5 ${isBanco ? 'text-emerald-400' : 'text-cream'}`}>
                  ${c.saldo_actual.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {c.moneda}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de Movimientos */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-dark-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h3 className="text-base font-bold text-cream">Movimientos Recientes de Tesorería</h3>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input
              type="text"
              placeholder="Buscar movimiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-dark-3 border border-dark-4 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cuenta</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Concepto / Referencia</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-4/70">
              {filteredMovimientos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-cream-dim">
                    No hay movimientos registrados en tesorería.
                  </td>
                </tr>
              ) : (
                filteredMovimientos.map(m => {
                  const c = cuentas.find(acc => acc.id === m.cuenta_id);
                  const isIngreso = m.tipo === 'ingreso';

                  return (
                    <tr key={m.id} className="hover:bg-dark-3/60 transition-colors">
                      <td className="py-3 px-4 text-cream-muted text-xs font-mono">
                        {new Date(m.fecha).toLocaleString('es-MX')}
                      </td>
                      <td className="py-3 px-4 font-medium text-cream text-xs">
                        {c?.nombre || 'Cuenta'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isIngreso ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {isIngreso ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {m.tipo.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-cream text-xs">{m.concepto}</div>
                        {m.referencia && <div className="text-[11px] text-cream-dim font-mono">Ref: {m.referencia}</div>}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIngreso ? '+' : '-'}${m.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-cream-muted text-xs">
                        {m.usuario_registro}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Movimiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-lg w-full shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">Registrar Movimiento de Tesorería</h3>
                <p className="text-xs text-cream-muted">Afecta el saldo en tiempo real de la cuenta seleccionada.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Seleccionar Cuenta *
                </label>
                <select
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                >
                  <option value="">-- Seleccione una Cuenta --</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Saldo: ${c.saldo_actual.toLocaleString('es-MX')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('ingreso')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                    tipo === 'ingreso'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-dark-4 text-cream-muted hover:bg-dark-3'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Ingreso / Depósito
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('egreso')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                    tipo === 'egreso'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                      : 'border-dark-4 text-cream-muted hover:bg-dark-3'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Egreso / Retiro
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monto || ''}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    No. Referencia / Folio
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ej: TR-89234 / Ticket"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Concepto / Descripción del Movimiento *
                </label>
                <textarea
                  rows={2}
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Pago de gasolina para cuadrilla de instalación..."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="p-6 border-t border-dark-4/50 flex justify-end gap-3 bg-dark-3/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarMovimiento}
                disabled={!cuentaId || monto <= 0 || !concepto.trim()}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-md transition-all"
              >
                Registrar Movimiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
