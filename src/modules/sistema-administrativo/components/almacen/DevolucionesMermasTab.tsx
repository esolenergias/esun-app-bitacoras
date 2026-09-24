import React, { useState } from 'react';
import type { DevolucionMerma, ProyectoReal, InsumoReal } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import { 
  RotateCcw, AlertTriangle, Plus, Search, CheckCircle, PackageMinus, RefreshCw
} from 'lucide-react';

interface DevolucionesMermasTabProps {
  devoluciones: DevolucionMerma[];
  proyectos: ProyectoReal[];
  insumos: InsumoReal[];
  userName?: string;
  onRefresh: () => void;
}

export const DevolucionesMermasTab: React.FC<DevolucionesMermasTabProps> = ({
  devoluciones,
  proyectos,
  insumos,
  userName = 'Almacenista',
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'devolucion' | 'merma'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [tipo, setTipo] = useState<'devolucion' | 'merma'>('devolucion');
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [descripcionInsumo, setDescripcionInsumo] = useState('');
  const [unidad, setUnidad] = useState('PZA');
  const [cantidad, setCantidad] = useState(1);
  const [costoEstimado, setCostoEstimado] = useState(0);
  const [motivo, setMotivo] = useState('');

  const handleSelectInsumo = (insumoId: string) => {
    setSelectedInsumoId(insumoId);
    const ins = insumos.find(i => i.id === insumoId);
    if (ins) {
      setDescripcionInsumo(ins.nombre);
      setUnidad(ins.unidad || 'PZA');
      setCostoEstimado(ins.precio_unitario || 0);
    }
  };

  const handleGuardarRegistro = async () => {
    if (!descripcionInsumo.trim() || cantidad <= 0) {
      alert('Por favor ingrese un material y una cantidad válida.');
      return;
    }

    const proy = proyectos.find(p => p.id === selectedProyectoId);

    const nuevoReg: Partial<DevolucionMerma> = {
      tipo,
      proyecto_id: selectedProyectoId || undefined,
      proyecto_nombre: proy?.titulo || 'Sin proyecto asignado',
      insumo_id: selectedInsumoId || undefined,
      insumo_nombre: descripcionInsumo,
      unidad,
      cantidad,
      costo_unitario: costoEstimado,
      motivo,
      responsable: userName
    };

    await adminDbService.crearDevolucionMerma(nuevoReg);
    onRefresh();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTipo('devolucion');
    setSelectedProyectoId('');
    setSelectedInsumoId('');
    setDescripcionInsumo('');
    setCantidad(1);
    setCostoEstimado(0);
    setMotivo('');
  };

  const filteredRegistros = devoluciones.filter(r => {
    const matchesSearch = 
      r.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.insumo_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.proyecto_nombre && r.proyecto_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTipo = filterTipo === 'todos' || r.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Paso 9 del Flujo
            </span>
            <h2 className="text-xl font-bold text-cream">Devoluciones de Obra y Registro de Mermas</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Reintegro de materiales sobrantes al stock de almacén o registro de pérdidas y scrap para auditoría de costos.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Devolución / Merma
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por folio, material o proyecto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(['todos', 'devolucion', 'merma'] as const).map(tp => (
            <button
              key={tp}
              onClick={() => setFilterTipo(tp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterTipo === tp
                  ? 'bg-amber-600 text-white'
                  : 'bg-dark-3 text-cream-muted hover:bg-dark-4'
              }`}
            >
              {tp === 'todos' ? 'Todos los Registros' : tp === 'devolucion' ? 'Devoluciones a Stock' : 'Mermas / Pérdidas'}
            </button>
          ))}
        </div>
      </div>

      {/* Registros List */}
      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        {filteredRegistros.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw className="w-12 h-12 text-cream-dim/60 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-cream/90">No hay devoluciones o mermas registradas</h4>
            <p className="text-sm text-cream-dim max-w-sm mx-auto mt-1">
              Aquí aparecerán los sobrantes reingresados a inventario y las mermas reportadas en obra.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Insumo</th>
                  <th className="py-3 px-4">Proyecto Origen</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-right">Costo Est.</th>
                  <th className="py-3 px-4">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70">
                {filteredRegistros.map((reg) => (
                  <tr key={reg.id} className="hover:bg-dark-3/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cream">
                      {reg.folio}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                        reg.tipo === 'devolucion'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {reg.tipo === 'devolucion' ? <RotateCcw className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {reg.tipo === 'devolucion' ? 'DEVOLUCIÓN' : 'MERMA'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cream-muted">
                      {new Date(reg.fecha).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-cream">
                      {reg.insumo_nombre}
                    </td>
                    <td className="py-3 px-4 text-cream-muted text-xs">
                      {reg.proyecto_nombre || 'Sin proyecto'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-cream">
                      {reg.cantidad} {reg.unidad}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-cream/90">
                      ${((reg.costo_unitario || 0) * reg.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-cream-muted text-xs max-w-xs truncate">
                      {reg.motivo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Registro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-xl w-full shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">Registrar Devolución o Merma</h3>
                <p className="text-xs text-cream-muted">Paso 9: Registra el retorno a almacén o desecho por daño.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('devolucion')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                    tipo === 'devolucion'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-dark-4 text-cream-muted hover:bg-dark-3'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Devolución (Suma a Almacén)
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('merma')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                    tipo === 'merma'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                      : 'border-dark-4 text-cream-muted hover:bg-dark-3'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Merma / Daño (No suma)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Proyecto / Obra de Procedencia
                </label>
                <select
                  value={selectedProyectoId}
                  onChange={(e) => setSelectedProyectoId(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                >
                  <option value="">-- Seleccione un Proyecto (Opcional) --</option>
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Material / Insumo *
                </label>
                <select
                  value={selectedInsumoId}
                  onChange={(e) => handleSelectInsumo(e.target.value)}
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                >
                  <option value="">-- Seleccionar de Insumos --</option>
                  {insumos.map(ins => (
                    <option key={ins.id} value={ins.id}>{ins.nombre} ({ins.unidad})</option>
                  ))}
                </select>
              </div>

              {!selectedInsumoId && (
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    O descripción manual de material:
                  </label>
                  <input
                    type="text"
                    value={descripcionInsumo}
                    onChange={(e) => setDescripcionInsumo(e.target.value)}
                    placeholder="Ej: Cable solar excedente..."
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Unidad
                  </label>
                  <input
                    type="text"
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Motivo / Descripción de la Causa *
                </label>
                <textarea
                  rows={2}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Material no utilizado en obra, devuelto en caja original / o Conector roto durante el tensado..."
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
                onClick={handleGuardarRegistro}
                disabled={!descripcionInsumo.trim() || cantidad <= 0}
                className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-amber-500/20 transition-all"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
