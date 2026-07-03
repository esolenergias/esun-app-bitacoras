import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Loader2, AlertTriangle, Layers, Check
} from 'lucide-react';
import { 
  getMatrices, getMatrizDetails, saveMatriz, deleteMatriz, getInsumos,
  calculateMatrixDirectCost, calculateMatrixSellingPrice
} from '../../lib/cotizadorService';
import type { Insumo, Matriz } from '../../types/cotizador';

export default function MatricesTab() {
  // State variables
  const [matrices, setMatrices] = useState<Matriz[]>([]);
  const [insumosCatalog, setInsumosCatalog] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMatriz, setEditingMatriz] = useState<Matriz | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  
  // Form states
  const [formCode, setFormCode] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('');
  const [formIndirectPercentage, setFormIndirectPercentage] = useState<number>(0);
  const [formUtilityPercentage, setFormUtilityPercentage] = useState<number>(0);
  const [formInsumos, setFormInsumos] = useState<{ insumo: Insumo; quantity: number }[]>([]);
  
  // Selector state inside editor
  const [selectedInsumoId, setSelectedInsumoId] = useState<string>('');
  
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Delete Confirmation states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState<string>('');

  // Fetch matrices and insumos on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [matricesData, insumosData] = await Promise.all([
        getMatrices(),
        getInsumos()
      ]);
      setMatrices(matricesData);
      setInsumosCatalog(insumosData);
    } catch (err: any) {
      console.error('Error fetching initial matrices/insumos data:', err);
      setError('Error al cargar la información. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating
  const handleOpenCreateModal = () => {
    setEditingMatriz(null);
    setFormCode('');
    setFormDescription('');
    setFormUnit('');
    setFormIndirectPercentage(0);
    setFormUtilityPercentage(0);
    setFormInsumos([]);
    setSelectedInsumoId('');
    setFormValidationError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing (fetches fresh details)
  const handleOpenEditModal = async (matriz: Matriz) => {
    setLoadingDetails(true);
    try {
      const details = await getMatrizDetails(matriz.id);
      setEditingMatriz(details);
      setFormCode(details.code);
      setFormDescription(details.description);
      setFormUnit(details.unit);
      setFormIndirectPercentage(details.indirect_percentage);
      setFormUtilityPercentage(details.utility_percentage);
      setFormInsumos(details.insumos || []);
      setSelectedInsumoId('');
      setFormValidationError(null);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Error fetching matrix details:', err);
      alert('No se pudieron cargar los detalles de la matriz.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMatriz(null);
    setFormValidationError(null);
  };

  // Add selected insumo to breakdown list
  const handleAddInsumo = () => {
    if (!selectedInsumoId) return;
    
    // Find the insumo in catalog
    const insumoToAdd = insumosCatalog.find(item => item.id === selectedInsumoId);
    if (!insumoToAdd) return;

    // Check if already added
    if (formInsumos.some(item => item.insumo.id === selectedInsumoId)) {
      setFormValidationError('Este insumo ya ha sido añadido a la matriz.');
      return;
    }

    setFormInsumos(prev => [...prev, { insumo: insumoToAdd, quantity: 1 }]);
    setSelectedInsumoId('');
    setFormValidationError(null);
  };

  // Remove insumo from breakdown list
  const handleRemoveInsumo = (insumoId: string) => {
    setFormInsumos(prev => prev.filter(item => item.insumo.id !== insumoId));
  };

  // Update insumo quantity in breakdown list
  const handleUpdateInsumoQuantity = (insumoId: string, quantity: number) => {
    setFormInsumos(prev => prev.map(item => {
      if (item.insumo.id === insumoId) {
        return { ...item, quantity: Math.max(0, quantity) };
      }
      return item;
    }));
  };

  // Validation & Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    // Basic Validation
    if (!formCode.trim()) {
      setFormValidationError('El código de la matriz es obligatorio.');
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
    if (formIndirectPercentage < 0 || formUtilityPercentage < 0) {
      setFormValidationError('Los porcentajes de indirecto y utilidad deben ser mayores o iguales a 0.');
      return;
    }
    if (formInsumos.length === 0) {
      setFormValidationError('Debe añadir al menos un insumo al desglose.');
      return;
    }

    setIsSubmitting(true);
    try {
      const matrizData: Partial<Matriz> = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim(),
        unit: formUnit.trim(),
        indirect_percentage: formIndirectPercentage,
        utility_percentage: formUtilityPercentage,
        insumos: formInsumos,
        ...(editingMatriz?.id ? { id: editingMatriz.id } : {})
      };

      const saved = await saveMatriz(matrizData);
      
      // Update local state
      if (editingMatriz?.id) {
        setMatrices(prev => prev.map(item => item.id === saved.id ? saved : item));
      } else {
        setMatrices(prev => [...prev, saved].sort((a, b) => a.code.localeCompare(b.code)));
      }
      
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving matrix:', err);
      setFormValidationError(err.message || 'Error al guardar la matriz. Verifique si el código ya existe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteConfirm = (matriz: Matriz) => {
    setDeleteConfirmId(matriz.id);
    setDeleteConfirmCode(matriz.code);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmId(null);
    setDeleteConfirmCode('');
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteMatriz(deleteConfirmId);
      setMatrices(prev => prev.filter(item => item.id !== deleteConfirmId));
      handleCloseDeleteConfirm();
    } catch (err: any) {
      console.error('Error deleting matrix:', err);
      alert('No se pudo eliminar la matriz. Puede estar en uso en algún presupuesto.');
      handleCloseDeleteConfirm();
    }
  };

  // Searching
  const filteredMatrices = matrices.filter(matriz => {
    const query = searchQuery.toLowerCase();
    return (
      (matriz.code || '').toLowerCase().includes(query) ||
      (matriz.description || '').toLowerCase().includes(query) ||
      (matriz.unit || '').toLowerCase().includes(query)
    );
  });

  // Calculation helpers
  const getMatrixTotals = (insumosList: { insumo: Insumo; quantity: number }[], indirect: number, utility: number) => {
    const directCost = calculateMatrixDirectCost(insumosList);
    const subtotal = directCost * (1 + indirect / 100);
    const sellingPrice = calculateMatrixSellingPrice(directCost, indirect, utility);
    return { directCost, subtotal, sellingPrice };
  };

  // Helper to format currency exactly as spec: $2,400.00 MXN
  const formatCurrencyMXN = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `$${formatted} MXN`;
  };

  // Helper for available insumos (excluding already added)
  const availableInsumos = insumosCatalog.filter(
    insumo => !formInsumos.some(item => item.insumo.id === insumo.id)
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out] font-sans">
      {/* Header Info */}
      <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
        <div>
          <h3 className="font-display font-black text-xl text-cream">
            MATRICES DE COSTOS UNITARIOS
          </h3>
          <p className="text-xs text-cream-muted mt-1 leading-relaxed">
            Estructura tus Análisis de Precios Unitarios (APU). Asocia insumos (materiales, mano de obra, equipos) y define los márgenes de indirecto y utilidad.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-gold/10 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear Matriz</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full lg:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cream-muted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por código, descripción, unidad..."
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
      <div className="border border-dark-4 bg-dark-2/40 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-cream-muted font-bold">Cargando catálogo de matrices...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4 font-sans">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-xs text-cream">{error}</p>
            <button 
              onClick={fetchInitialData}
              className="px-4 py-2 bg-dark-3 border border-dark-4 text-[10px] font-black uppercase tracking-wider text-gold rounded-xl hover:bg-dark-4 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : filteredMatrices.length === 0 ? (
          <div className="p-16 text-center space-y-2 select-none">
            <Layers className="w-8 h-8 text-cream-muted mx-auto opacity-40" />
            <p className="text-xs font-bold text-cream-dim">No se encontraron matrices de costos</p>
            <p className="text-[10px] text-cream-muted font-body">Crea una nueva matriz o ajusta tu criterio de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-4 bg-dark-2/65 text-cream-dim text-[10px] font-mono uppercase tracking-wider select-none">
                  <th className="py-3 px-4 font-bold">Código</th>
                  <th className="py-3 px-4 font-bold">Descripción</th>
                  <th className="py-3 px-4 font-bold">Unidad</th>
                  <th className="py-3 px-4 font-bold text-right">Costo Directo</th>
                  <th className="py-3 px-4 font-bold text-right">Indirecto %</th>
                  <th className="py-3 px-4 font-bold text-right">Utilidad %</th>
                  <th className="py-3 px-4 font-bold text-right">Precio de Venta</th>
                  <th className="py-3 px-4 font-bold text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/45">
                {filteredMatrices.map((matriz) => {
                  const totals = getMatrixTotals(matriz.insumos || [], matriz.indirect_percentage, matriz.utility_percentage);
                  return (
                    <tr 
                      key={matriz.id}
                      className="hover:bg-dark-2/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-gold tracking-wide select-all">
                        {matriz.code}
                      </td>
                      <td className="py-3.5 px-4 text-cream font-body leading-relaxed max-w-xs md:max-w-md lg:max-w-lg truncate" title={matriz.description}>
                        {matriz.description}
                      </td>
                      <td className="py-3.5 px-4 text-cream-muted font-mono select-none">
                        {matriz.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-cream select-all">
                        {formatCurrencyMXN(totals.directCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-cream-dim">
                        {matriz.indirect_percentage.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-cream-dim">
                        {matriz.utility_percentage.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gold select-all">
                        {formatCurrencyMXN(totals.sellingPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center select-none">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(matriz)}
                            disabled={loadingDetails}
                            className="p-1.5 border border-dark-4 bg-dark-1 hover:border-gold/30 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-gold transition-all cursor-pointer disabled:opacity-40"
                            title="Editar matriz"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteConfirm(matriz)}
                            className="p-1.5 border border-red-500/10 bg-dark-1 hover:border-red-500/30 hover:bg-red-500/5 rounded-lg text-cream-muted hover:text-red-400 transition-all cursor-pointer"
                            title="Eliminar matriz"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] font-sans">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.25s_ease-out]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4 bg-dark-2 flex-shrink-0">
              <h4 className="font-display font-black text-base text-cream uppercase tracking-wider">
                {editingMatriz ? 'Editar Matriz' : 'Crear Nueva Matriz'}
              </h4>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-cream transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto min-h-0 flex-1">
                {formValidationError && (
                  <div className="p-3.5 bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl text-xs flex items-start gap-2 select-none animate-[shake_0.4s_ease-in-out]">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{formValidationError}</span>
                  </div>
                )}

                {/* 1. Basic Details */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black uppercase tracking-widest text-gold border-b border-dark-4 pb-2">Datos Básicos</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Code */}
                    <div className="space-y-1.5">
                      <label htmlFor="matriz-code" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Código de la Matriz</label>
                      <input
                        id="matriz-code"
                        type="text"
                        placeholder="APU-ESTRUCTURA-2P"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        disabled={!!editingMatriz}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors uppercase font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                      {!editingMatriz && (
                        <span className="text-[9px] text-cream-muted font-body mt-1 block">Código único identificador (inalterable luego).</span>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="matriz-desc" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Descripción</label>
                      <input
                        id="matriz-desc"
                        type="text"
                        placeholder="Estructura de aluminio anodizado para 2 paneles solares"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Unit */}
                    <div className="space-y-1.5">
                      <label htmlFor="matriz-unit" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Unidad</label>
                      <input
                        id="matriz-unit"
                        type="text"
                        placeholder="pza, m, equipo, etc."
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                        required
                      />
                    </div>

                    {/* Indirect Cost % */}
                    <div className="space-y-1.5">
                      <label htmlFor="matriz-indirect" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Costo Indirecto (%)</label>
                      <input
                        id="matriz-indirect"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="15.0"
                        value={formIndirectPercentage}
                        onChange={(e) => setFormIndirectPercentage(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                        required
                      />
                    </div>

                    {/* Utility % */}
                    <div className="space-y-1.5">
                      <label htmlFor="matriz-utility" className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Utilidad (%)</label>
                      <input
                        id="matriz-utility"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="10.0"
                        value={formUtilityPercentage}
                        onChange={(e) => setFormUtilityPercentage(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Breakdown Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center border-b border-dark-4 pb-2">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-gold">Desglose de Componentes (Insumos)</h5>
                    <span className="text-[10px] font-mono text-cream-muted uppercase font-bold">
                      Componentes: {formInsumos.length}
                    </span>
                  </div>

                  {/* Add Insumo controls */}
                  <div className="bg-dark-1/50 border border-dark-4 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 space-y-1.5 w-full">
                      <label htmlFor="add-insumo-select" className="text-[9.5px] text-cream-muted uppercase font-bold tracking-wider block select-none">Seleccionar Insumo del Catálogo</label>
                      <select
                        id="add-insumo-select"
                        value={selectedInsumoId}
                        onChange={(e) => setSelectedInsumoId(e.target.value)}
                        className="w-full p-2 bg-dark-2 border border-dark-4 focus:border-gold/30 text-xs text-cream rounded-lg focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Seleccionar Insumo para Añadir --</option>
                        {availableInsumos.map((insumo) => (
                          <option key={insumo.id} value={insumo.id}>
                            [{insumo.code}] {insumo.description} ({formatCurrencyMXN(insumo.cost)} / {insumo.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddInsumo}
                      disabled={!selectedInsumoId}
                      className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed h-9 flex-shrink-0 select-none cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Añadir Insumo</span>
                    </button>
                  </div>

                  {/* Added Insumos list */}
                  {formInsumos.length === 0 ? (
                    <div className="border border-dashed border-dark-4 rounded-xl p-10 text-center text-cream-muted select-none">
                      <Layers className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold text-cream-dim">No hay insumos en esta matriz</p>
                      <p className="text-[9.5px] mt-0.5">Utiliza el selector superior para añadir materiales o mano de obra.</p>
                    </div>
                  ) : (
                    <div className="border border-dark-4 bg-dark-1/25 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-dark-4 bg-dark-2/45 text-[9.5px] font-mono uppercase text-cream-dim select-none">
                            <th className="py-2.5 px-3">Código</th>
                            <th className="py-2.5 px-3">Insumo</th>
                            <th className="py-2.5 px-3">Unidad</th>
                            <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                            <th className="py-2.5 px-3 text-center w-36">Cantidad</th>
                            <th className="py-2.5 px-3 text-right">Total</th>
                            <th className="py-2.5 px-3 text-center w-12">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-4/40">
                          {formInsumos.map((item) => (
                            <tr key={item.insumo.id} className="hover:bg-dark-2/15 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-gold tracking-wide select-all">
                                {item.insumo.code}
                              </td>
                              <td className="py-2.5 px-3 text-cream leading-relaxed font-body">
                                {item.insumo.description}
                              </td>
                              <td className="py-2.5 px-3 text-cream-muted font-mono font-bold select-none">
                                {item.insumo.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-cream-dim">
                                {formatCurrencyMXN(item.insumo.cost)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  step="0.000001"
                                  min="0.000001"
                                  placeholder="0.000000"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateInsumoQuantity(item.insumo.id, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                  className="w-full max-w-[120px] text-center font-mono font-bold text-xs bg-dark-1 border border-dark-4 focus:border-gold/30 rounded p-1.5 focus:outline-none"
                                  required
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-cream select-all">
                                {formatCurrencyMXN(item.quantity * item.insumo.cost)}
                              </td>
                              <td className="py-2.5 px-3 text-center select-none">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInsumo(item.insumo.id)}
                                  className="p-1 text-cream-muted hover:text-red-400 rounded hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                                  title="Remover insumo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Calculations Footer */}
              <div className="bg-dark-2 border-t border-dark-4 p-5 flex-shrink-0 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div className="grid grid-cols-3 gap-6 text-left select-none font-mono">
                  {/* Direct Cost */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-cream-muted font-sans font-bold">Costo Directo Total</span>
                    <p className="text-sm font-bold text-cream">
                      {formatCurrencyMXN(getMatrixTotals(formInsumos, formIndirectPercentage, formUtilityPercentage).directCost)}
                    </p>
                  </div>
                  
                  {/* Subtotal (Indirect added) */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-cream-muted font-sans font-bold">Subtotal (Indirecto)</span>
                    <p className="text-sm font-bold text-cream">
                      {formatCurrencyMXN(getMatrixTotals(formInsumos, formIndirectPercentage, formUtilityPercentage).subtotal)}
                    </p>
                  </div>

                  {/* Selling Price */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-gold font-sans font-bold">Precio de Venta Final</span>
                    <p className="text-sm font-black text-gold">
                      {formatCurrencyMXN(getMatrixTotals(formInsumos, formIndirectPercentage, formUtilityPercentage).sellingPrice)}
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 justify-end">
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
                    className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-gold/10"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingMatriz ? 'Guardar Cambios' : 'Crear Matriz'}</span>
                      </>
                    )}
                  </button>
                </div>
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
                  ¿Eliminar Matriz de Costos?
                </h4>
                <p className="text-xs text-cream-muted leading-relaxed font-body">
                  Estás a punto de eliminar permanentemente la matriz <strong className="text-gold font-mono">{deleteConfirmCode}</strong> de tu catálogo de eSol. Esta acción no se puede deshacer.
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
