import React, { useState } from 'react';
import type { IngresoRegistro, ClienteReal, ProyectoReal, CuentaFinanciera } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import { 
  TrendingUp, DollarSign, Plus, Search, CheckCircle, Clock, ArrowDownRight, Eye, CreditCard
} from 'lucide-react';

interface IngresosTabProps {
  ingresos: IngresoRegistro[];
  clientes: ClienteReal[];
  proyectos: ProyectoReal[];
  cuentas: CuentaFinanciera[];
  userName?: string;
  onRefresh: () => void;
}

export const IngresosTab: React.FC<IngresosTabProps> = ({
  ingresos,
  clientes,
  proyectos,
  cuentas,
  userName = 'Administrador',
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'cobrado' | 'pendiente' | 'parcial'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [concepto, setConcepto] = useState('');
  const [montoTotal, setMontoTotal] = useState(0);
  const [montoCobrado, setMontoCobrado] = useState(0);
  const [selectedCuentaId, setSelectedCuentaId] = useState('');
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'efectivo' | 'tarjeta' | 'cheque'>('transferencia');
  const [referenciaFactura, setReferenciaFactura] = useState('');

  // KPIs
  const totalCobrado = ingresos.reduce((acc, i) => acc + i.monto_cobrado, 0);
  const totalPorCobrar = ingresos.reduce((acc, i) => acc + (i.monto_total - i.monto_cobrado), 0);

  const handleSelectCliente = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    const cliProys = proyectos.filter(p => p.cliente_id === clienteId);
    if (cliProys.length > 0) {
      setSelectedProyectoId(cliProys[0].id);
      setConcepto(`Anticipo / Pago de Proyecto: ${cliProys[0].titulo}`);
      setMontoTotal(cliProys[0].total);
    }
  };

  const handleGuardarIngreso = async () => {
    if (!concepto.trim() || montoTotal <= 0) {
      alert('Por favor complete los campos requeridos con un monto válido.');
      return;
    }

    const cli = clientes.find(c => c.id === selectedClienteId);
    const proy = proyectos.find(p => p.id === selectedProyectoId);

    const estatusFinal = montoCobrado >= montoTotal ? 'cobrado' : montoCobrado > 0 ? 'parcial' : 'pendiente';

    const nuevoIng: Partial<IngresoRegistro> = {
      cliente_id: selectedClienteId || undefined,
      cliente_nombre: cli?.nombre || 'Público en General',
      proyecto_id: selectedProyectoId || undefined,
      proyecto_nombre: proy?.titulo,
      concepto: concepto.trim(),
      monto_total: montoTotal,
      monto_cobrado: montoCobrado,
      estatus: estatusFinal,
      metodo_pago: metodoPago,
      cuenta_destino_id: selectedCuentaId || undefined,
      referencia_factura: referenciaFactura.trim(),
      usuario_registro: userName
    };

    await adminDbService.crearIngreso(nuevoIng);
    onRefresh();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedClienteId('');
    setSelectedProyectoId('');
    setConcepto('');
    setMontoTotal(0);
    setMontoCobrado(0);
    setSelectedCuentaId('');
    setReferenciaFactura('');
  };

  const filteredIngresos = ingresos.filter(ing => {
    const matchesSearch = 
      ing.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ing.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ing.cliente_nombre && ing.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ing.referencia_factura && ing.referencia_factura.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'todos' || ing.estatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Ingresos y CxC
            </span>
            <h2 className="text-xl font-bold text-cream">Cuentas por Cobrar e Ingresos</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Registro de cobros, anticipos y liquidaciones de clientes vinculados a proyectos y presupuestos reales.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Ingreso / Factura
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-500 p-5 rounded-2xl text-white shadow-md shadow-emerald-500/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-emerald-100">Ingresos Cobrados</span>
            <ArrowDownRight className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">
            ${totalCobrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-100 mt-1">Total ingresado efectivamente a cuentas</p>
        </div>

        <div className="bg-blue-600 p-5 rounded-2xl text-white shadow-md shadow-blue-500/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-blue-100">Cuentas por Cobrar (CxC)</span>
            <Clock className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">
            ${totalPorCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-blue-100 mt-1">Saldos pendientes por cobrar a clientes</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por folio, cliente, factura o concepto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2"
          />
        </div>

        <div className="flex gap-2">
          {(['todos', 'cobrado', 'parcial', 'pendiente'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === st ? 'bg-emerald-600 text-white' : 'bg-dark-3 text-cream-muted hover:bg-dark-4'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        {filteredIngresos.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay registros de ingresos</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              Registra los cobros a clientes y anticipos de proyectos para mantener el flujo de caja al día.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente / Proyecto</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4 text-right">Cobrado</th>
                  <th className="py-3 px-4 text-right">Saldo CxC</th>
                  <th className="py-3 px-4 text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredIngresos.map((ing) => {
                  const saldo = ing.monto_total - ing.monto_cobrado;
                  return (
                    <tr key={ing.id} className="hover:bg-dark-3/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cream">
                        {ing.folio}
                      </td>
                      <td className="py-3 px-4 text-cream-muted text-xs">
                        {new Date(ing.fecha).toLocaleDateString('es-MX')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-cream">{ing.cliente_nombre}</div>
                        {ing.proyecto_nombre && <div className="text-xs text-cream-dim">{ing.proyecto_nombre}</div>}
                      </td>
                      <td className="py-3 px-4 text-cream/90 text-xs">
                        {ing.concepto}
                        {ing.referencia_factura && <div className="text-[11px] text-cream-dim font-mono">Fact: {ing.referencia_factura}</div>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cream">
                        ${ing.monto_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        ${ing.monto_cobrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gold">
                        ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                          ing.estatus === 'cobrado' ? 'bg-emerald-100 text-emerald-700' :
                          ing.estatus === 'parcial' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-gold-light'
                        }`}>
                          {ing.estatus === 'cobrado' && <CheckCircle className="w-3 h-3" />}
                          {ing.estatus === 'parcial' && <Clock className="w-3 h-3" />}
                          {ing.estatus.toUpperCase()}
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

      {/* Modal Nuevo Ingreso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">Registrar Ingreso / Facturación</h3>
                <p className="text-xs text-cream-muted">Conecta el cobro con el cliente y presupuesto correspondiente.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Cliente *
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => handleSelectCliente(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || c.email || 'CRM'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Proyecto / Presupuesto Relacionado
                </label>
                <select
                  value={selectedProyectoId}
                  onChange={(e) => setSelectedProyectoId(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                >
                  <option value="">-- Seleccionar Proyecto (Opcional) --</option>
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.titulo} (${p.total.toLocaleString('es-MX')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Concepto del Cobro *
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Anticipo 50% instalación paneles solares..."
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
                    Monto Cobrado Hoy ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoCobrado || ''}
                    onChange={(e) => setMontoCobrado(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold font-mono text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Cuenta Destino
                  </label>
                  <select
                    value={selectedCuentaId}
                    onChange={(e) => setSelectedCuentaId(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                  >
                    <option value="">-- Sin ingresar a caja/banco --</option>
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
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
                    <option value="tarjeta">Tarjeta de Débito/Crédito</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Factura / Folio Fiscal (Opcional)
                </label>
                <input
                  type="text"
                  value={referenciaFactura}
                  onChange={(e) => setReferenciaFactura(e.target.value)}
                  placeholder="Ej: FAC-A-1092"
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
                onClick={handleGuardarIngreso}
                disabled={!concepto.trim() || montoTotal <= 0}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-md transition-all"
              >
                Guardar Ingreso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
