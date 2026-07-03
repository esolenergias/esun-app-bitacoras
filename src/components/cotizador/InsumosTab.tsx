import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Loader2, AlertTriangle, Filter 
} from 'lucide-react';
import { getInsumos, saveInsumo, deleteInsumo } from '../../lib/cotizadorService';
import type { Insumo, InsumoType } from '../../types/cotizador';

export default function InsumosTab() {
  // State variables
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeFilter, setActiveFilter] = useState<'all' | InsumoType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  
  // Form states
  const [formCode, setFormCode] = useState<string>('');
  const [formType, setFormType] = useState<InsumoType>('material');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('');
  const [formCost, setFormCost] = useState<number>(0);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Delete Confirmation states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState<string>('');

  // Fetch insumos on mount
  useEffect(() => {
    fetchInsumos();
  }, []);

  const fetchInsumos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err: any) {
      console.error('Error fetching insumos:', err);
      setError('Error al cargar el catálogo de insumos. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating
  const handleOpenCreateModal = () => {
    setEditingInsumo(null);
    setFormCode('');
    setFormType('material');
    setFormDescription('');
    setFormUnit('');
    setFormCost(0);
    setFormValidationError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setFormCode(insumo.code);
    setFormType(insumo.type);
    setFormDescription(insumo.description);
    setFormUnit(insumo.unit);
    setFormCost(insumo.cost);
    setFormValidationError(null);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInsumo(null);
    setFormValidationError(null);
  };

  // Validation & Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    // Basic Validation
    if (!formCode.trim()) {
      setFormValidationError('El código del insumo es obligatorio.');
      return;
    }
    if (!formDescription.trim()) {
      setFormValidationError('La descripción es obligatoria.');
      return;
    }
    if (!formUnit.trim()) {
      setFormValidationError('La unidad de medida es obligatoria.');
      return;
    }
    if (formCost < 0) {
      setFormValidationError('El costo unitario debe ser mayor o igual a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const insumoData: Partial<Insumo> = {
        code: formCode.trim().toUpperCase(),
        type: formType,
        description: formDescription.trim(),
        unit: formUnit.trim(),
        cost: formCost,
        ...(editingInsumo?.id ? { id: editingInsumo.id } : {})
      };

      const saved = await saveInsumo(insumoData);
      
      // Update local state
      if (editingInsumo?.id) {
        setInsumos(prev => prev.map(item => item.id === saved.id ? saved : item));
      } else {
        setInsumos(prev => [...prev, saved].sort((a, b) => a.code.localeCompare(b.code)));
      }
      
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving insumo:', err);
      setFormValidationError(err.message || 'Error al guardar el insumo. Verifique si el código ya existe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteConfirm = (insumo: Insumo) => {
    setDeleteConfirmId(insumo.id);
    setDeleteConfirmCode(insumo.code);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmId(null);
    setDeleteConfirmCode('');
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteInsumo(deleteConfirmId);
      setInsumos(prev => prev.filter(item => item.id !== deleteConfirmId));
      handleCloseDeleteConfirm();
    } catch (err: any) {
      console.error('Error deleting insumo:', err);
      alert('No se pudo eliminar el insumo. Puede estar en uso en alguna matriz.');
      handleCloseDeleteConfirm();
    }
  };

  // Filtering and Searching
  const filteredInsumos = insumos.filter(insumo => {
    const matchesFilter = activeFilter === 'all' || insumo.type === activeFilter;
    const matchesSearch = 
      insumo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insumo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insumo.unit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Helper to format currency exactly as spec: $2,400.00 MXN
  const formatCurrencyMXN = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `$${formatted} MXN`;
  };

  // Helper for badges custom colors
  const getTypeBadgeStyles = (type: InsumoType) => {
    switch (type) {
      case 'material':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'labor':
        return 'bg-green-500/10 text-green-400 border border-green-500/25';
      case 'equipment':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      case 'tool':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/25';
      default:
        return 'bg-cream/10 text-cream-dim border border-cream/20';
    }
  };

  // Helper for translated types
  const translateType = (type: InsumoType) => {
    switch (type) {
      case 'material': return 'Material';
      case 'labor': return 'Mano de Obra';
      case 'equipment': return 'Equipo';
      case 'tool': return 'Herramienta';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Banner / Info Header */}
      <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
        <div>
          <h3 className="font-display font-black text-xl text-cream">
            CATÁLOGO DE INSUMOS
          </h3>
          <p className="text-xs text-cream-muted mt-1 leading-relaxed">
            Administra materiales, mano de obra, equipo y herramientas base para la estructuración de matrices de costos unitarios.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-gold/10 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear Insumo</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Tab filters */}
        <div className="flex flex-wrap gap-1.5 bg-dark-2 p-1 rounded-xl border border-dark-4 self-start select-none font-sans">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-gold/10 text-gold border border-gold/30 font-bold'
                : 'text-cream-muted hover:text-cream hover:bg-dark-3 border border-transparent'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('material')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === 'material'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold'
                : 'text-cream-muted hover:text-cream hover:bg-dark-3 border border-transparent'
            }`}
          >
            Materiales
          </button>
          <button
            onClick={() => setActiveFilter('labor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === 'labor'
                ? 'bg-green-500/10 text-green-400 border border-green-500/30 font-bold'
                : 'text-cream-muted hover:text-cream hover:bg-dark-3 border border-transparent'
            }`}
          >
            Mano de Obra
          </button>
          <button
            onClick={() => setActiveFilter('equipment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === 'equipment'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold'
                : 'text-cream-muted hover:text-cream hover:bg-dark-3 border border-transparent'
            }`}
          >
            Equipos
          </button>
          <button
            onClick={() => setActiveFilter('tool')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === 'tool'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold'
                : 'text-cream-muted hover:text-cream hover:bg-dark-3 border border-transparent'
            }`}
          >
            Herramientas
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md w-full lg:w-72 font-sans">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cream-muted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por código o desc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-2 border border-dark-4 focus:border-gold/45 text-xs text-cream placeholder-cream-muted rounded-xl focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-cream-muted hover:text-cream cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="border border-dark-4 bg-dark-2/40 rounded-2xl overflow-hidden shadow-sm font-sans">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-cream-muted font-bold">Cargando catálogo de insumos...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-xs text-cream">{error}</p>
            <button 
              onClick={fetchInsumos}
              className="px-4 py-2 bg-dark-3 border border-dark-4 text-[10px] font-black uppercase tracking-wider text-gold rounded-xl hover:bg-dark-4 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : filteredInsumos.length === 0 ? (
          <div className="p-16 text-center space-y-2 select-none">
            <Filter className="w-8 h-8 text-cream-muted mx-auto opacity-40" />
            <p className="text-xs font-bold text-cream-dim">No se encontraron insumos</p>
            <p className="text-[10px] text-cream-muted font-body">Prueba cambiando los filtros o crea un nuevo insumo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-4 bg-dark-2/65 text-cream-dim text-[10px] font-mono uppercase tracking-wider select-none">
                  <th className="py-3 px-4 font-bold">Código</th>
                  <th className="py-3 px-4 font-bold">Tipo</th>
                  <th className="py-3 px-4 font-bold">Descripción</th>
                  <th className="py-3 px-4 font-bold">Unidad</th>
                  <th className="py-3 px-4 font-bold text-right">Costo Unitario</th>
                  <th className="py-3 px-4 font-bold text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/45">
                {filteredInsumos.map((insumo) => (
                  <tr 
                    key={insumo.id}
                    className="hover:bg-dark-2/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-gold tracking-wide select-all">
                      {insumo.code}
                    </td>
                    <td className="py-3.5 px-4 select-none">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getTypeBadgeStyles(insumo.type)}`}>
                        {translateType(insumo.type)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-cream font-body leading-relaxed max-w-xs md:max-w-md lg:max-w-lg truncate" title={insumo.description}>
                      {insumo.description}
                    </td>
                    <td className="py-3.5 px-4 text-cream-muted font-mono select-none">
                      {insumo.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cream select-all">
                      {formatCurrencyMXN(insumo.cost)}
                    </td>
                    <td className="py-3.5 px-4 text-center select-none">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(insumo)}
                          className="p-1.5 border border-dark-4 bg-dark-1 hover:border-gold/30 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-gold transition-all cursor-pointer"
                          title="Editar insumo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm(insumo)}
                          className="p-1.5 border border-red-500/10 bg-dark-1 hover:border-red-500/30 hover:bg-red-500/5 rounded-lg text-cream-muted hover:text-red-400 transition-all cursor-pointer"
                          title="Eliminar insumo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] font-sans">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-[scaleUp_0.25s_ease-out]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4 bg-dark-2">
              <h4 className="font-display font-black text-base text-cream uppercase tracking-wider">
                {editingInsumo ? 'Editar Insumo' : 'Crear Nuevo Insumo'}
              </h4>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-cream transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formValidationError && (
                <div className="p-3.5 bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl text-xs flex items-start gap-2 select-none animate-[shake_0.4s_ease-in-out]">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formValidationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code Field */}
                <div className="space-y-1.5">
                  <label htmlFor="insumo-code" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Código del Insumo</label>
                  <input
                    id="insumo-code"
                    type="text"
                    placeholder="M-PANEL-550W"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    disabled={!!editingInsumo} // Code should be immutable once created for integrity
                    className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors uppercase font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {!editingInsumo && (
                    <span className="text-[9px] text-cream-muted font-body mt-1 block">Código único identificador.</span>
                  )}
                </div>

                {/* Type Field */}
                <div className="space-y-1.5">
                  <label htmlFor="insumo-type" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Tipo de Insumo</label>
                  <select
                    id="insumo-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as InsumoType)}
                    className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="material">Material (Panel, Inversor, etc.)</option>
                    <option value="labor">Mano de Obra (Instalador, Supervisor)</option>
                    <option value="equipment">Equipo (Andamios, Grúa)</option>
                    <option value="tool">Herramienta (Herramientas de mano)</option>
                  </select>
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <label htmlFor="insumo-desc" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Descripción</label>
                <input
                  id="insumo-desc"
                  type="text"
                  placeholder="Panel Solar LONGi Hi-MO 6 550W Monocristalino PERC"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unit Field */}
                <div className="space-y-1.5">
                  <label htmlFor="insumo-unit" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Unidad de Medida</label>
                  <input
                    id="insumo-unit"
                    type="text"
                    placeholder="pz, m, hr, jor, etc."
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                    required
                  />
                </div>

                {/* Cost Field */}
                <div className="space-y-1.5">
                  <label htmlFor="insumo-cost" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Costo Unitario (MXN)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cream-muted font-mono text-xs select-none">
                      $
                    </span>
                    <input
                      id="insumo-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formCost}
                      onChange={(e) => setFormCost(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-full pl-7 pr-4 py-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-xs font-black uppercase tracking-wider text-cream-dim hover:text-cream rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingInsumo ? 'Guardar Cambios' : 'Crear Insumo'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] font-sans">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-[scaleUp_0.25s_ease-out] select-none">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/25">
                <Trash2 className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-display font-black text-base text-cream uppercase tracking-wider">
                  ¿Eliminar Insumo?
                </h4>
                <p className="text-xs text-cream-muted leading-relaxed font-body">
                  Estás a punto de eliminar permanentemente el insumo <strong className="text-gold font-mono">{deleteConfirmCode}</strong> del catálogo de eSol. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex bg-dark-3/30 border-t border-dark-4 p-4 gap-3 justify-end">
              <button
                type="button"
                onClick={handleCloseDeleteConfirm}
                className="px-4 py-2 border border-dark-4 text-xs font-black uppercase tracking-wider text-cream-muted hover:text-cream rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
