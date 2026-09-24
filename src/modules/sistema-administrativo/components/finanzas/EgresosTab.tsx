import React, { useState } from 'react';
import type { EgresoRegistro, Proveedor, CuentaFinanciera, OrdenCompra } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import { 
  CreditCard, DollarSign, Plus, Search, CheckCircle, Clock, ArrowUpRight, AlertTriangle
} from 'lucide-react';

interface EgresosTabProps {
  egresos: EgresoRegistro[];
  proveedores: Proveedor[];
  cuentas: CuentaFinanciera[];
  ordenesCompra: OrdenCompra[];
  userName?: string;
  onRefresh: () => void;
}

export const EgresosTab: React.FC<EgresosTabProps> = ({
  egresos,
  proveedores,
  cuentas,
  ordenesCompra,
  userName = 'Administrador',
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pagado' | 'pendiente' | 'parcial'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedProveedorId, setSelectedProveedorId] = useState('');
  const [selectedOcId, setSelectedOcId] = useState('');
  const [concepto, setConcepto] = useState('');
  const [montoTotal, setMontoTotal] = useState(0);
  const [montoPagado, setMontoPagado] = useState(0);
  const [selectedCuentaId, setSelectedCuentaId] = useState('');
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'efectivo' | 'tarjeta' | 'cheque'>('transferencia');
  const [referenciaFactura, setReferenciaFactura] = useState('');

  // KPIs
  const totalPagado = egresos.reduce((acc, e) => acc + e.monto_pagado, 0);
  const totalPorPagar = egresos.reduce((acc, e) => acc + (e.monto_total - e.monto_pagado), 0);

  const handleSelectOc = (ocId: string) => {
    setSelectedOcId(ocId);
    const oc = ordenesCompra.find(o => o.id === ocId);
    if (oc) {
      setSelectedProveedorId(oc.proveedor_id);
      setConcepto(`Liquidación Orden de Compra ${oc.folio} (${oc.proveedor_nombre})`);
      setMontoTotal(oc.total);
      setMontoPagado(0);
    }
  };

  const handleGuardarEgreso = async () => {
    if (!concepto.trim() || montoTotal <= 0) {
      alert('Por favor complete los campos requeridos con un monto válido.');
      return;
    }

    const prov = proveedores.find(p => p.id === selectedProveedorId);
    const oc = ordenesCompra.find(o => o.id === selectedOcId);

    const estatusFinal = montoPagado >= montoTotal ? 'pagado' : montoPagado > 0 ? 'parcial' : 'pendiente';

    const nuevoEg: Partial<EgresoRegistro> = {
      proveedor_id: selectedProveedorId || undefined,
      proveedor_nombre: prov?.nombre || (oc ? oc.proveedor_nombre : 'Proveedor General'),
      orden_compra_id: selectedOcId || undefined,
      folio_oc: oc?.folio,
      concepto: concepto.trim(),
      monto_total: montoTotal,
      monto_pagado: montoPagado,
      estatus: estatusFinal,
      metodo_pago: metodoPago,
      cuenta_origen_id: selectedCuentaId || undefined,
      referencia_factura: referenciaFactura.trim(),
      usuario_registro: userName
    };

    await adminDbService.crearEgreso(nuevoEg);
    onRefresh();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedProveedorId('');
    setSelectedOcId('');
    setConcepto('');
    setMontoTotal(0);
    setMontoPagado(0);
    setSelectedCuentaId('');
    setReferenciaFactura('');
  };

  const filteredEgresos = egresos.filter(eg => {
    const matchesSearch = 
      eg.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eg.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eg.proveedor_nombre && eg.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (eg.referencia_factura && eg.referencia_factura.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'todos' || eg.estatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
              Egresos y CxP
            </span>
            <h2 className="text-xl font-bold text-cream">Cuentas por Pagar y Egresos</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Control de pasivos a proveedores, pagos de órdenes de compra y gastos operativos de la empresa.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Egreso / CxP
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-600 p-5 rounded-2xl text-white shadow-md shadow-rose-500/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-rose-100">Egresos Pagados</span>
            <ArrowUpRight className="w-5 h-5 text-rose-200" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">
            ${totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-rose-100 mt-1">Total liquidado a proveedores y gastos</p>
        </div>

        <div className="bg-amber-600 p-5 rounded-2xl text-white shadow-md shadow-amber-500/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-amber-100">Cuentas por Pagar (CxP)</span>
            <Clock className="w-5 h-5 text-amber-200" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">
            ${totalPorPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-amber-100 mt-1">Pasivos pendientes de liquidación</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por folio, proveedor, factura o concepto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2"
          />
        </div>

        <div className="flex gap-2">
          {(['todos', 'pagado', 'parcial', 'pendiente'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === st ? 'bg-rose-600 text-white' : 'bg-dark-3 text-cream-muted hover:bg-dark-4'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        {filteredEgresos.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay registros de egresos</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              Aquí se listan las facturas de proveedores y órdenes de compra con saldo por liquidar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Proveedor / OC</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4 text-right">Pagado</th>
                  <th className="py-3 px-4 text-right">Saldo CxP</th>
                  <th className="py-3 px-4 text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredEgresos.map((eg) => {
                  const saldo = eg.monto_total - eg.monto_pagado;
                  return (
                    <tr key={eg.id} className="hover:bg-dark-3/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cream">
                        {eg.folio}
                      </td>
                      <td className="py-3 px-4 text-cream-muted text-xs">
                        {new Date(eg.fecha).toLocaleDateString('es-MX')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-cream">{eg.proveedor_nombre}</div>
                        {eg.folio_oc && <div className="text-xs font-mono text-gold">{eg.folio_oc}</div>}
                      </td>
                      <td className="py-3 px-4 text-cream/90 text-xs">
                        {eg.concepto}
                        {eg.referencia_factura && <div className="text-[11px] text-cream-dim font-mono">Fact: {eg.referencia_factura}</div>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cream">
                        ${eg.monto_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        ${eg.monto_pagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                        ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                          eg.estatus === 'pagado' ? 'bg-emerald-100 text-emerald-700' :
                          eg.estatus === 'parcial' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {eg.estatus === 'pagado' && <CheckCircle className="w-3 h-3" />}
                          {eg.estatus === 'parcial' && <Clock className="w-3 h-3" />}
                          {eg.estatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Egreso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">Registrar Egreso / Cuenta por Pagar</h3>
                <p className="text-xs text-cream-muted">Conecta el pago con una Orden de Compra o proveedor directo.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Vincular a Orden de Compra (Opcional)
                </label>
                <select
                  value={selectedOcId}
                  onChange={(e) => handleSelectOc(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                >
                  <option value="">-- Sin OC / Gasto Directo --</option>
                  {ordenesCompra.map(oc => (
                    <option key={oc.id} value={oc.id}>
                      {oc.folio} | {oc.proveedor_nombre} | ${oc.total.toLocaleString('es-MX')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Proveedor *
                </label>
                <select
                  value={selectedProveedorId}
                  onChange={(e) => setSelectedProveedorId(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.rfc || 'Sin RFC'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Concepto del Egreso *
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Pago de material eléctrico e inversores..."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Monto Total ($) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={montoTotal || ''}
                    onChange={(e) => setMontoTotal(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Monto Pagado Hoy ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoPagado || ''}
                    onChange={(e) => setMontoPagado(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold font-mono text-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Cuenta Origen
                  </label>
                  <select
                    value={selectedCuentaId}
                    onChange={(e) => setSelectedCuentaId(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                  >
                    <option value="">-- Sin descontar de cuenta --</option>
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (${c.saldo_actual.toLocaleString('es-MX')})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as any)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta Empresarial</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Factura de Proveedor (Opcional)
                </label>
                <input
                  type="text"
                  value={referenciaFactura}
                  onChange={(e) => setReferenciaFactura(e.target.value)}
                  placeholder="Ej: FAC-PROV-901"
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
                onClick={handleGuardarEgreso}
                disabled={!concepto.trim() || montoTotal <= 0}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 rounded-xl shadow-md transition-all"
              >
                Guardar Egreso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
