import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Loader2, AlertTriangle, FileText, Download, Copy 
} from 'lucide-react';
import { supabase } from '../../context/supabase';
import { 
  getPresupuestoDetails, 
  savePresupuesto, 
  deletePresupuesto, 
  getMatrices,
  calculateMatrixSellingPrice,
  calculateBudgetTotals,
  calculateMatrixDirectCost,
  getInsumos,
  saveInsumo,
  saveMatriz
} from '../../lib/cotizadorService';
import type { PresupuestoDetalle } from '../../lib/cotizadorService';
import type { Presupuesto, PresupuestoConcepto, Matriz, Insumo, InsumoType, InsumoSubcategory } from '../../types/cotizador';
import { MATERIAL_SUBCATEGORIES } from '../../types/cotizador';

interface PresupuestoWithTotals extends Presupuesto {
  conceptos: PresupuestoConcepto[];
  totals: {
    directCostTotal: number;
    sellingPriceTotal: number;
  };
}

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  step?: string;
  min?: string;
  required?: boolean;
}

const NumericInput: React.FC<NumericInputProps> = ({ value, onChange, className, step, min, required }) => {
  const [localValue, setLocalValue] = useState<string>(value === 0 ? '' : value.toString());
  const [prevValue, setPrevValue] = useState<number>(value);

  // Sync local string representation during render when the prop value changes externally
  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value === 0 ? '' : value.toString());
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setLocalValue(valStr);
    const parsed = valStr === '' ? 0 : parseFloat(valStr);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = localValue === '' ? 0 : parseFloat(localValue);
    setLocalValue(parsed === 0 ? '' : parsed.toString());
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      required={required}
    />
  );
};

export default function PresupuestosTab() {
  // State variables
  const [presupuestos, setPresupuestos] = useState<PresupuestoWithTotals[]>([]);
  const [matrices, setMatrices] = useState<Matriz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Editor Modal states
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  
  // Editor Form states
  const [formName, setFormName] = useState<string>('');
  const [formClientName, setFormClientName] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'borrador' | 'enviado' | 'aprobado' | 'rechazado'>('borrador');
  const [formConceptos, setFormConceptos] = useState<Partial<PresupuestoConcepto>[]>([]);
  const [formIndirect, setFormIndirect] = useState<number>(10.00);
  const [formUtility, setFormUtility] = useState<number>(8.00);
  
  // Concept selector inside editor
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>('');
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Report Modal states
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportDetails, setReportDetails] = useState<PresupuestoDetalle | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportTab, setReportTab] = useState<'resumen' | 'explosion'>('resumen');
  
  // Deletion Confirmation states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  // ----------------------------------------------------
  // NESTED CONCEPT CREATOR SUB-MODAL STATES
  // ----------------------------------------------------
  const [isAddConceptModalOpen, setIsAddConceptModalOpen] = useState<boolean>(false);
  const [addConceptTab, setAddConceptTab] = useState<'apu' | 'custom' | 'new_matrix' | 'new_insumo'>('apu');
  
  // Cache of insumos for matrix builder
  const [insumosCatalog, setInsumosCatalog] = useState<Insumo[]>([]);
  
  // Custom Concept Form
  const [customDesc, setCustomDesc] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customCost, setCustomCost] = useState<number>(0);
  const [customIndirect, setCustomIndirect] = useState<number>(10);
  const [customUtility, setCustomUtility] = useState<number>(8);
  
  // New Matrix Form
  const [newMatrixCode, setNewMatrixCode] = useState<string>('');
  const [newMatrixDesc, setNewMatrixDesc] = useState<string>('');
  const [newMatrixUnit, setNewMatrixUnit] = useState<string>('');
  const [newMatrixIndirect, setNewMatrixIndirect] = useState<number>(10);
  const [newMatrixUtility, setNewMatrixUtility] = useState<number>(8);
  const [newMatrixInsumos, setNewMatrixInsumos] = useState<{ insumo: Insumo; quantity: number }[]>([]);
  const [selectedInsumoIdForNewMatrix, setSelectedInsumoIdForNewMatrix] = useState<string>('');
  const [insumoQtyForNewMatrix, setInsumoQtyForNewMatrix] = useState<number>(1);
  
  // New Insumo Form
  const [newInsumoCode, setNewInsumoCode] = useState<string>('');
  const [newInsumoType, setNewInsumoType] = useState<InsumoType>('material');
  const [newInsumoSubcategory, setNewInsumoSubcategory] = useState<InsumoSubcategory | ''>('');
  const [newInsumoDesc, setNewInsumoDesc] = useState<string>('');
  const [newInsumoUnit, setNewInsumoUnit] = useState<string>('');
  const [newInsumoCost, setNewInsumoCost] = useState<number>(0);

  const [subModalError, setSubModalError] = useState<string | null>(null);
  const [subModalSubmitting, setSubModalSubmitting] = useState<boolean>(false);

  const fetchBudgets = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('presupuestos')
        .select(`
          *,
          presupuesto_conceptos (
            *
          )
        `)
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'presupuesto_conceptos', ascending: true })
        .order('id', { foreignTable: 'presupuesto_conceptos', ascending: true });

      if (dbError) throw dbError;

      const mapped: PresupuestoWithTotals[] = (data || []).map((row: any) => {
        const conceptos: PresupuestoConcepto[] = (row.presupuesto_conceptos || []).map((pc: any) => ({
          id: pc.id,
          presupuesto_id: pc.presupuesto_id,
          matriz_id: pc.matriz_id,
          quantity: Number(pc.quantity),
          description: pc.description,
          unit: pc.unit,
          cost_price: Number(pc.cost_price),
          indirect_percentage: Number(pc.indirect_percentage),
          utility_percentage: Number(pc.utility_percentage),
          created_at: pc.created_at,
          updated_at: pc.updated_at
        }));

        const indPct = row.indirect_percentage !== undefined ? Number(row.indirect_percentage) : 10.00;
        const utPct = row.utility_percentage !== undefined ? Number(row.utility_percentage) : 8.00;
        const totals = calculateBudgetTotals(conceptos, indPct, utPct);

        return {
          id: row.id,
          name: row.name,
          client_name: row.client_name,
          status: row.status as 'borrador' | 'enviado' | 'aprobado' | 'rechazado',
          indirect_percentage: indPct,
          utility_percentage: utPct,
          created_at: row.created_at,
          updated_at: row.updated_at,
          conceptos,
          totals
        };
      });

      setPresupuestos(mapped);
    } catch (err: any) {
      console.error('Error fetching budgets:', err);
      setError('Error al cargar la lista de presupuestos.');
    } finally {
      setLoading(false);
    }
  };

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
      await fetchBudgets();
    } catch (err: any) {
      console.error('Error fetching initial data:', err);
      setError('Error al cargar la información inicial. Por favor intenta de nuevo.');
      setLoading(false);
    }
  };

  // Fetch initial budgets and matrices on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchInitialData(); }, []);

  // Open modal for creating
  const handleOpenCreateModal = () => {
    setEditingPresupuesto(null);
    setFormName('');
    setFormClientName('');
    setFormStatus('borrador');
    setFormConceptos([]);
    setFormIndirect(10.00);
    setFormUtility(8.00);
    setSelectedMatrixId('');
    setFormValidationError(null);
    setIsEditorOpen(true);
  };

  // Open modal for editing (fetches fresh details)
  const handleOpenEditModal = async (id: string) => {
    setLoadingDetails(true);
    try {
      const details = await getPresupuestoDetails(id);
      setEditingPresupuesto(details);
      setFormName(details.name);
      setFormClientName(details.client_name);
      setFormStatus(details.status);
      setFormConceptos(details.conceptos || []);
      setFormIndirect(details.indirect_percentage ?? 10.00);
      setFormUtility(details.utility_percentage ?? 8.00);
      setSelectedMatrixId('');
      setFormValidationError(null);
      setIsEditorOpen(true);
    } catch (err: any) {
      console.error('Error loading budget details:', err);
      alert('No se pudieron cargar los detalles del presupuesto.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Close editor
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingPresupuesto(null);
    setFormValidationError(null);
  };

  // Add concept from selected matrix
  const handleAddConcepto = () => {
    if (!selectedMatrixId) return;
    const matrix = matrices.find(m => m.id === selectedMatrixId);
    if (!matrix) return;

    // Calculate unit direct cost (sum of insumos)
    const costPrice = calculateMatrixDirectCost(matrix.insumos || []);

    const newConcept: Partial<PresupuestoConcepto> = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      presupuesto_id: editingPresupuesto?.id || '',
      matriz_id: matrix.id,
      description: matrix.description,
      unit: matrix.unit,
      cost_price: costPrice,
      indirect_percentage: matrix.indirect_percentage,
      utility_percentage: matrix.utility_percentage,
      quantity: 1.00,
      matriz: matrix
    };

    setFormConceptos(prev => [...prev, newConcept]);
    setSelectedMatrixId('');
    setFormValidationError(null);
  };

  // ----------------------------------------------------
  // SUB-MODAL ACTION HANDLERS
  // ----------------------------------------------------
  const handleOpenAddConceptModal = () => {
    setAddConceptTab('apu');
    setSelectedMatrixId('');
    
    setCustomDesc('');
    setCustomUnit('pza');
    setCustomQty(1);
    setCustomCost(0);
    setCustomIndirect(10);
    setCustomUtility(8);
    
    setNewMatrixCode('');
    setNewMatrixDesc('');
    setNewMatrixUnit('pza');
    setNewMatrixIndirect(10);
    setNewMatrixUtility(8);
    setNewMatrixInsumos([]);
    setSelectedInsumoIdForNewMatrix('');
    setInsumoQtyForNewMatrix(1);
    
    setNewInsumoCode('');
    setNewInsumoType('material');
    setNewInsumoSubcategory('');
    setNewInsumoDesc('');
    setNewInsumoUnit('pza');
    setNewInsumoCost(0);
    
    setSubModalError(null);
    setSubModalSubmitting(false);
    setIsAddConceptModalOpen(true);
  };

  const handleAddExistingAPU = () => {
    if (!selectedMatrixId) {
      setSubModalError('Selecciona una matriz de la lista.');
      return;
    }
    const matrix = matrices.find(m => m.id === selectedMatrixId);
    if (!matrix) return;
    
    const costPrice = calculateMatrixDirectCost(matrix.insumos || []);
    const newConcept: Partial<PresupuestoConcepto> = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      presupuesto_id: editingPresupuesto?.id || '',
      matriz_id: matrix.id,
      description: matrix.description,
      unit: matrix.unit,
      cost_price: costPrice,
      indirect_percentage: matrix.indirect_percentage,
      utility_percentage: matrix.utility_percentage,
      quantity: customQty > 0 ? customQty : 1.00,
      matriz: matrix
    };
    
    setFormConceptos(prev => [...prev, newConcept]);
    setIsAddConceptModalOpen(false);
  };

  const handleAddCustomConcept = () => {
    if (!customDesc.trim()) {
      setSubModalError('La descripción es obligatoria.');
      return;
    }
    if (!customUnit.trim()) {
      setSubModalError('La unidad es obligatoria.');
      return;
    }
    if (customQty <= 0) {
      setSubModalError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (customCost < 0) {
      setSubModalError('El costo no puede ser negativo.');
      return;
    }
    
    const newConcept: Partial<PresupuestoConcepto> = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      presupuesto_id: editingPresupuesto?.id || '',
      matriz_id: null,
      description: customDesc.trim(),
      unit: customUnit.trim(),
      cost_price: customCost,
      indirect_percentage: customIndirect,
      utility_percentage: customUtility,
      quantity: customQty,
      matriz: undefined
    };
    
    setFormConceptos(prev => [...prev, newConcept]);
    setIsAddConceptModalOpen(false);
  };

  const handleAddInsumoToNewMatrix = () => {
    if (!selectedInsumoIdForNewMatrix) return;
    const insumo = insumosCatalog.find(i => i.id === selectedInsumoIdForNewMatrix);
    if (!insumo) return;
    
    // Check if already added
    if (newMatrixInsumos.some(item => item.insumo.id === insumo.id)) {
      alert('Este insumo ya está añadido al desglose.');
      return;
    }
    
    setNewMatrixInsumos(prev => [...prev, { insumo, quantity: insumoQtyForNewMatrix }]);
    setSelectedInsumoIdForNewMatrix('');
    setInsumoQtyForNewMatrix(1);
  };

  const handleRemoveInsumoFromNewMatrix = (insumoId: string) => {
    setNewMatrixInsumos(prev => prev.filter(item => item.insumo.id !== insumoId));
  };

  const handleCreateAndAddMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubModalError(null);
    
    if (!newMatrixCode.trim()) {
      setSubModalError('El código de la matriz es obligatorio.');
      return;
    }
    if (!newMatrixDesc.trim()) {
      setSubModalError('La descripción es obligatoria.');
      return;
    }
    if (!newMatrixUnit.trim()) {
      setSubModalError('La unidad es obligatoria.');
      return;
    }
    if (newMatrixInsumos.length === 0) {
      setSubModalError('Debes añadir al menos un insumo al desglose.');
      return;
    }
    
    setSubModalSubmitting(true);
    try {
      const matrixData: Partial<Matriz> = {
        code: newMatrixCode.trim().toUpperCase(),
        description: newMatrixDesc.trim(),
        unit: newMatrixUnit.trim(),
        indirect_percentage: newMatrixIndirect,
        utility_percentage: newMatrixUtility,
        insumos: newMatrixInsumos
      };
      
      const saved = await saveMatriz(matrixData);
      
      // Update local matrices list
      setMatrices(prev => [...prev, saved].sort((a, b) => a.code.localeCompare(b.code)));
      
      // Add it directly as a concept
      const costPrice = calculateMatrixDirectCost(saved.insumos || []);
      const newConcept: Partial<PresupuestoConcepto> = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        presupuesto_id: editingPresupuesto?.id || '',
        matriz_id: saved.id,
        description: saved.description,
        unit: saved.unit,
        cost_price: costPrice,
        indirect_percentage: saved.indirect_percentage,
        utility_percentage: saved.utility_percentage,
        quantity: customQty > 0 ? customQty : 1.00,
        matriz: saved
      };
      
      setFormConceptos(prev => [...prev, newConcept]);
      setIsAddConceptModalOpen(false);
    } catch (err: any) {
      console.error('Error creating matrix:', err);
      setSubModalError(err.message || 'Error al guardar la matriz. Verifica si el código ya existe.');
    } finally {
      setSubModalSubmitting(false);
    }
  };

  const handleCreateNewInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubModalError(null);
    
    if (!newInsumoCode.trim()) {
      setSubModalError('El código del insumo es obligatorio.');
      return;
    }
    if (!newInsumoDesc.trim()) {
      setSubModalError('La descripción es obligatoria.');
      return;
    }
    if (!newInsumoUnit.trim()) {
      setSubModalError('La unidad es obligatoria.');
      return;
    }
    if (newInsumoCost < 0) {
      setSubModalError('El costo no puede ser negativo.');
      return;
    }
    
    setSubModalSubmitting(true);
    try {
      const insumoData: Partial<Insumo> = {
        code: newInsumoCode.trim().toUpperCase(),
        type: newInsumoType,
        subcategory: newInsumoType === 'material' && newInsumoSubcategory ? newInsumoSubcategory : null,
        description: newInsumoDesc.trim(),
        unit: newInsumoUnit.trim(),
        cost: newInsumoCost
      };
      
      const saved = await saveInsumo(insumoData);
      
      // Update cached catalog
      setInsumosCatalog(prev => [...prev, saved].sort((a, b) => a.code.localeCompare(b.code)));
      
      alert('¡Insumo creado con éxito! Ya puedes seleccionarlo en la pestaña de crear matrices.');
      setAddConceptTab('new_matrix');
      setSelectedInsumoIdForNewMatrix(saved.id);
    } catch (err: any) {
      console.error('Error creating insumo:', err);
      setSubModalError(err.message || 'Error al guardar el insumo. Verifica si el código ya existe.');
    } finally {
      setSubModalSubmitting(false);
    }
  };

  // Remove concept from list
  const handleRemoveConcepto = (conceptId: string) => {
    setFormConceptos(prev => prev.filter(c => c.id !== conceptId));
  };

  // Update concept numeric field
  const handleUpdateConceptField = (conceptId: string, field: 'quantity' | 'cost_price' | 'indirect_percentage' | 'utility_percentage', value: number) => {
    setFormConceptos(prev => prev.map(c => {
      if (c.id === conceptId) {
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  // Save budget
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    // Validation
    if (!formName.trim()) {
      setFormValidationError('El nombre del presupuesto es obligatorio.');
      return;
    }
    if (!formClientName.trim()) {
      setFormValidationError('El nombre del cliente es obligatorio.');
      return;
    }
    if (formConceptos.length === 0) {
      setFormValidationError('Debe añadir al menos un concepto.');
      return;
    }

    // Verify quantities are valid numbers
    for (const c of formConceptos) {
      if (c.quantity === undefined || isNaN(c.quantity) || c.quantity <= 0) {
        setFormValidationError(`El concepto "${c.description}" debe tener una cantidad válida mayor que 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const budgetData: Partial<Presupuesto> = {
        name: formName.trim(),
        client_name: formClientName.trim(),
        status: formStatus,
        ...(editingPresupuesto?.id ? { id: editingPresupuesto.id } : {})
      };

      // Clean concepts (remove client-side temp prefix ids so savePresupuesto classifies them as new inserts)
      const cleanedConcepts = formConceptos.map(c => {
        const { id, ...rest } = c;
        if (id && id.toString().startsWith('temp_')) {
          return rest;
        }
        return { id, ...rest };
      });

      await savePresupuesto(budgetData, cleanedConcepts);
      await fetchBudgets();
      handleCloseEditor();
    } catch (err: any) {
      console.error('Error saving budget:', err);
      setFormValidationError(err.message || 'Error al guardar el presupuesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete budget confirmation handlers
  const handleOpenDeleteConfirm = (budget: Presupuesto) => {
    setDeleteConfirmId(budget.id);
    setDeleteConfirmName(budget.name);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmId(null);
    setDeleteConfirmName('');
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deletePresupuesto(deleteConfirmId);
      setPresupuestos(prev => prev.filter(item => item.id !== deleteConfirmId));
      handleCloseDeleteConfirm();
    } catch (err: any) {
      console.error('Error deleting budget:', err);
      alert('Error al intentar eliminar el presupuesto.');
      handleCloseDeleteConfirm();
    }
  };

  // Report loading triggered by clicking reports icon
  const handleOpenReport = async (id: string) => {
    setLoadingReport(true);
    setIsReportOpen(true);
    setReportDetails(null);
    setReportTab('resumen');
    try {
      const details = await getPresupuestoDetails(id);
      setReportDetails(details);
    } catch (err: any) {
      console.error('Error loading report details:', err);
      alert('No se pudieron obtener los detalles del presupuesto para generar el reporte.');
      setIsReportOpen(false);
    } finally {
      setLoadingReport(false);
    }
  };

  // Insumos Explosion Calculations
  const getAggregatedInsumos = () => {
    if (!reportDetails) return { materials: [], labor: [], equipment: [], tools: [], overallInsumosCost: 0 };
    
    const insumosAggregation: {
      [code: string]: {
        insumo: Insumo;
        totalQuantity: number;
      };
    } = {};

    for (const concepto of reportDetails.conceptos) {
      const conceptQty = Number(concepto.quantity);
      const matrix = concepto.matriz;
      if (!matrix || !matrix.insumos) continue;

      for (const mi of matrix.insumos) {
        const insumo = mi.insumo;
        const quantityPerUnit = Number(mi.quantity);
        const neededQty = conceptQty * quantityPerUnit;

        if (insumosAggregation[insumo.code]) {
          insumosAggregation[insumo.code].totalQuantity += neededQty;
        } else {
          insumosAggregation[insumo.code] = {
            insumo: { ...insumo },
            totalQuantity: neededQty
          };
        }
      }
    }

    const materials: any[] = [];
    const labor: any[] = [];
    const equipment: any[] = [];
    const tools: any[] = [];

    let materialsCostTotal = 0;
    let laborCostTotal = 0;
    let equipmentCostTotal = 0;
    let toolsCostTotal = 0;

    for (const code of Object.keys(insumosAggregation)) {
      const aggregated = insumosAggregation[code];
      const type = aggregated.insumo.type;
      const cost = Number(aggregated.insumo.cost);
      const qty = aggregated.totalQuantity;
      const totalCost = qty * cost;

      const item = {
        ...aggregated,
        totalCost
      };

      if (type === 'material') {
        materials.push(item);
        materialsCostTotal += totalCost;
      } else if (type === 'labor') {
        labor.push(item);
        laborCostTotal += totalCost;
      } else if (type === 'equipment') {
        equipment.push(item);
        equipmentCostTotal += totalCost;
      } else if (type === 'tool') {
        tools.push(item);
        toolsCostTotal += totalCost;
      }
    }

    const overallInsumosCost = materialsCostTotal + laborCostTotal + equipmentCostTotal + toolsCostTotal;

    return {
      materials,
      labor,
      equipment,
      tools,
      overallInsumosCost
    };
  };

  // Generate clean formatted markdown copy-paste report
  const generateMarkdownReport = (details: PresupuestoDetalle, aggregated: any) => {
    const indPct = details.indirect_percentage ?? 10.00;
    const utPct = details.utility_percentage ?? 8.00;
    const totals = calculateBudgetTotals(details.conceptos, indPct, utPct);
    
    let md = `# REPORTE TÉCNICO Y COMERCIAL - ESOL ENERGÍAS\n\n`;
    md += `**Presupuesto:** ${details.name}\n`;
    md += `**Cliente:** ${details.client_name}\n`;
    md += `**Estado:** ${details.status.toUpperCase()}\n`;
    md += `**Fecha de Generación:** ${new Date().toLocaleDateString('es-MX')}\n\n`;
    
    md += `## 1. RESUMEN DE CONCEPTOS (PRECIO DE VENTA)\n\n`;
    md += `| Concepto | Unidad | Cantidad | P.U. Venta (MXN) | Importe Venta (MXN) |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: |\n`;
    
    for (const c of details.conceptos) {
      const unitSelling = calculateMatrixSellingPrice(c.cost_price, indPct, utPct);
      const totalSelling = Number(c.quantity) * unitSelling;
      const safeDesc = c.description.replace(/\|/g, '\\|');
      const safeUnit = c.unit.replace(/\|/g, '\\|');
      md += `| ${safeDesc} | ${safeUnit} | ${Number(c.quantity).toFixed(2)} | $${unitSelling.toFixed(2)} | $${totalSelling.toFixed(2)} |\n`;
    }
    
    md += `\n**Resumen de Totales:**\n`;
    md += `- **Costo Directo Consolidado:** $${totals.directCostTotal.toFixed(2)} MXN\n`;
    md += `- **Indirectos (${indPct.toFixed(1)}%):** $${(totals.directCostTotal * (indPct / 100)).toFixed(2)} MXN\n`;
    md += `- **Utilidad (${utPct.toFixed(1)}%):** $${((totals.directCostTotal + (totals.directCostTotal * (indPct / 100))) * (utPct / 100)).toFixed(2)} MXN\n`;
    md += `- **Precio de Venta Sugerido (con Indirectos y Utilidad):** $${totals.sellingPriceTotal.toFixed(2)} MXN\n\n`;
    
    md += `## 2. EXPLOSIÓN DE INSUMOS GENERAL\n\n`;
    md += `Consolidado de materiales, mano de obra, maquinaria y herramientas requeridas para la ejecución total de la obra.\n\n`;
    
    const groupInsumosToMd = (items: any[], title: string) => {
      if (items.length === 0) return '';
      let grp = `### ${title}\n\n`;
      grp += `| Código | Descripción del Insumo | Unidad | Cantidad Requerida | Costo Unitario | Importe Total (MXN) |\n`;
      grp += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`;
      let subtotal = 0;
      for (const item of items) {
        const safeCode = item.insumo.code.replace(/\|/g, '\\|');
        const safeInsumoDesc = item.insumo.description.replace(/\|/g, '\\|');
        const safeInsumoUnit = item.insumo.unit.replace(/\|/g, '\\|');
        grp += `| ${safeCode} | ${safeInsumoDesc} | ${safeInsumoUnit} | ${item.totalQuantity.toFixed(4)} | $${item.insumo.cost.toFixed(2)} | $${item.totalCost.toFixed(2)} |\n`;
        subtotal += item.totalCost;
      }
      grp += `\n**Subtotal ${title}:** $${subtotal.toFixed(2)} MXN\n\n`;
      return grp;
    };

    md += groupInsumosToMd(aggregated.materials, 'Materiales');
    md += groupInsumosToMd(aggregated.labor, 'Mano de Obra');
    md += groupInsumosToMd(aggregated.equipment, 'Equipos');
    md += groupInsumosToMd(aggregated.tools, 'Herramientas');
    
    md += `\n**Costo Total Acumulado de la Explosión de Insumos:** $${aggregated.overallInsumosCost.toFixed(2)} MXN\n`;
    
    return md;
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('¡Reporte copiado al portapapeles (método alternativo)!');
      } else {
        alert('No se pudo copiar el reporte al portapapeles.');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('No se pudo copiar el reporte.');
    }
    document.body.removeChild(textArea);
  };

  const handleCopyReport = () => {
    if (!reportDetails) return;
    const aggregated = getAggregatedInsumos();
    const markdown = generateMarkdownReport(reportDetails, aggregated);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(markdown)
        .then(() => {
          alert('¡Reporte exportado y copiado al portapapeles en formato Markdown!');
        })
        .catch(err => {
          console.error('Error al copiar:', err);
          fallbackCopyToClipboard(markdown);
        });
    } else {
      fallbackCopyToClipboard(markdown);
    }
  };

  // Helper currency formatting
  const formatCurrencyMXN = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `$${formatted} MXN`;
  };

  // Helper translated status colors
  const getStatusBadgeStyles = (status: 'borrador' | 'enviado' | 'aprobado' | 'rechazado') => {
    switch (status) {
      case 'borrador':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/25';
      case 'enviado':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'aprobado':
        return 'bg-green-500/10 text-green-400 border border-green-500/25';
      case 'rechazado':
        return 'bg-red-500/10 text-red-400 border border-red-500/25';
      default:
        return 'bg-cream/10 text-cream-dim border border-cream/20';
    }
  };

  // Filter budgets list based on query
  const filteredPresupuestos = presupuestos.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.status.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const safeConceptos = formConceptos.map(c => ({
    ...c,
    quantity: Number(c.quantity) || 0,
    cost_price: Number(c.cost_price) || 0,
    indirect_percentage: Number(c.indirect_percentage) || 0,
    utility_percentage: Number(c.utility_percentage) || 0
  })) as PresupuestoConcepto[];

  const totals = safeConceptos.length > 0 
    ? calculateBudgetTotals(safeConceptos, formIndirect, formUtility) 
    : { directCostTotal: 0, sellingPriceTotal: 0 };
  const aggregatedReport = getAggregatedInsumos();

  return (
    <div className="space-y-6 font-body">
      
      {/* 1. Header Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-dark-2 border border-dark-4 p-4 rounded-2xl shadow-sm select-none">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cream-muted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por presupuesto, cliente, estado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-1 border border-dark-4 focus:border-gold/45 text-xs text-cream placeholder-cream-muted rounded-xl focus:outline-none transition-colors"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 font-black text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-gold/10"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear Presupuesto</span>
        </button>
      </div>

      {/* 2. Main Budget Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 select-none border border-dark-4 bg-dark-2/20 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-cream-dim mt-3 font-bold">Cargando presupuestos...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 select-none">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-display font-black text-sm text-cream uppercase tracking-wide">Error de Conexión</h4>
            <p className="text-xs text-cream-muted font-body mt-1">{error}</p>
          </div>
        </div>
      ) : filteredPresupuestos.length === 0 ? (
        <div className="border border-dark-4 bg-dark-2/20 p-16 rounded-2xl text-center space-y-4 select-none">
          <FileText className="w-10 h-10 text-gold mx-auto opacity-50" />
          <h4 className="font-display font-black text-base text-cream">No se encontraron presupuestos</h4>
          <p className="text-xs text-cream-muted max-w-sm mx-auto font-body">
            {searchQuery ? 'Prueba ajustando los términos de búsqueda.' : 'Inicia creando un nuevo presupuesto presionando el botón superior.'}
          </p>
        </div>
      ) : (
        <div className="border border-dark-4 bg-dark-2/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-dark-4 bg-dark-2/65 select-none">
                  <th className="py-3 px-4 text-left font-display font-black text-[10px] text-cream-dim uppercase tracking-wider">Nombre del Presupuesto</th>
                  <th className="py-3 px-4 text-left font-display font-black text-[10px] text-cream-dim uppercase tracking-wider">Cliente</th>
                  <th className="py-3 px-4 text-center font-display font-black text-[10px] text-cream-dim uppercase tracking-wider">Estado</th>
                  <th className="py-3 px-4 text-right font-display font-black text-[10px] text-cream-dim uppercase tracking-wider">Costo Directo</th>
                  <th className="py-3 px-4 text-right font-display font-black text-[10px] text-cream-dim uppercase tracking-wider">Precio de Venta</th>
                  <th className="py-3 px-4 text-center font-display font-black text-[10px] text-cream-dim uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4">
                {filteredPresupuestos.map((budget) => (
                  <tr 
                    key={budget.id} 
                    className="hover:bg-gold/5 transition-colors cursor-pointer group"
                    onClick={() => window.open(`/?presupuestoId=${encodeURIComponent(budget.name)}`, '_blank')}
                    title="Ver Dashboard del Presupuesto (abre en nueva pestaña)"
                  >
                    <td className="py-3.5 px-4 font-display font-bold text-cream select-all">
                      {budget.name}
                    </td>
                    <td className="py-3.5 px-4 text-cream-muted font-body">
                      {budget.client_name}
                    </td>
                    <td className="py-3.5 px-4 text-center select-none">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadgeStyles(budget.status)}`}>
                        {budget.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-cream-dim select-all">
                      {formatCurrencyMXN(budget.totals.directCostTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gold select-all">
                      {formatCurrencyMXN(budget.totals.sellingPriceTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-center select-none" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(budget.id)}
                          disabled={loadingDetails}
                          className="p-1.5 border border-dark-4 bg-dark-1 hover:border-gold/30 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-gold transition-all cursor-pointer disabled:opacity-40"
                          title="Editar presupuesto"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenReport(budget.id)}
                          className="p-1.5 border border-dark-4 bg-dark-1 hover:border-gold/30 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-gold transition-all cursor-pointer"
                          title="Ver Reporte y Explosión de Insumos"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm(budget)}
                          className="p-1.5 border border-red-500/10 bg-dark-1 hover:border-red-500/30 hover:bg-red-500/5 rounded-lg text-cream-muted hover:text-red-400 transition-all cursor-pointer"
                          title="Eliminar presupuesto"
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
        </div>
      )}

      {/* 3. MODAL EDITOR / PANEL */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.25s_ease-out]">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4 bg-dark-2 flex-shrink-0 select-none">
              <h4 className="font-display font-black text-sm md:text-base text-cream uppercase tracking-wider">
                {editingPresupuesto ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}
              </h4>
              <button 
                onClick={handleCloseEditor}
                className="p-1.5 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-cream transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto min-h-0 flex-1">
                
                {formValidationError && (
                  <div className="p-3.5 bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl text-xs flex items-start gap-2 select-none animate-[shake_0.4s_ease-in-out]">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{formValidationError}</span>
                  </div>
                )}

                {/* 3.1 Basic budget info */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gold border-b border-dark-4 pb-1.5 select-none">Datos Generales</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] text-cream-dim uppercase font-bold tracking-wider block select-none">Nombre del Presupuesto</label>
                      <input
                        type="text"
                        placeholder="Ej. Proyecto Solar Industrial 50kW"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] text-cream-dim uppercase font-bold tracking-wider block select-none">Nombre del Cliente</label>
                      <input
                        type="text"
                        placeholder="Ej. Comercializadora del Norte S.A."
                        value={formClientName}
                        onChange={(e) => setFormClientName(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] text-cream-dim uppercase font-bold tracking-wider block select-none">Estado</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors font-mono cursor-pointer"
                      >
                        <option value="borrador">Borrador</option>
                        <option value="enviado">Enviado</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3.2 Add concepts section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-dark-4 pb-1.5 select-none">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gold">Líneas de Concepto</h5>
                  </div>
                  
                  {/* Concept line items list */}
                  {formConceptos.length === 0 ? (
                    <div className="border border-dashed border-dark-4 p-12 text-center rounded-xl select-none text-cream-muted text-xs font-body flex flex-col items-center justify-center gap-3">
                      <span>No hay conceptos añadidos en este presupuesto.</span>
                      <button
                        type="button"
                        onClick={handleOpenAddConceptModal}
                        className="px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-gold/10 hover:scale-[1.02]"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Nuevo concepto</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dark-4 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-dark-4 bg-dark-2 select-none">
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider">Descripción</th>
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-center">Unidad</th>
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right w-24">Cantidad</th>
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right">Costo Directo U.</th>
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right">Ind. %</th>
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right">Util %</th>
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right">P.U. Venta</th>
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right">Importe Venta</th>
                              <th className="py-2.5 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-4 text-xs font-body">
                            {formConceptos.map((c, index) => {
                              const qty = Number(c.quantity) || 0;
                              const unitDirect = Number(c.cost_price) || 0;
                              const indirect = Number(c.indirect_percentage) || 0;
                              const utility = Number(c.utility_percentage) || 0;

                              const unitSelling = calculateMatrixSellingPrice(unitDirect, indirect, utility);
                              const totalSelling = qty * unitSelling;

                              return (
                                <tr key={c.id || index} className="hover:bg-dark-1/20 transition-colors">
                                  <td className="py-2.5 px-3 text-cream leading-relaxed font-bold">
                                    {c.description}
                                  </td>
                                  <td className="py-2.5 px-3 text-cream-muted text-center font-mono">
                                    {c.unit}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <NumericInput
                                      step="0.01"
                                      min="0.01"
                                      value={c.quantity || 0}
                                      onChange={(val) => handleUpdateConceptField(c.id!, 'quantity', val)}
                                      className="w-full px-2 py-1 bg-dark-1 border border-dark-4 focus:border-gold/40 text-cream rounded-lg text-right font-mono focus:outline-none"
                                      required
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-cream-muted">
                                    <NumericInput
                                      step="0.01"
                                      value={c.cost_price || 0}
                                      onChange={(val) => handleUpdateConceptField(c.id!, 'cost_price', val)}
                                      className="w-24 px-2 py-1 bg-dark-1 border border-dark-4 focus:border-gold/40 text-cream rounded-lg text-right font-mono focus:outline-none"
                                      required
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-cream-dim">
                                    <NumericInput
                                      step="0.1"
                                      value={c.indirect_percentage || 0}
                                      onChange={(val) => handleUpdateConceptField(c.id!, 'indirect_percentage', val)}
                                      className="w-16 px-2 py-1 bg-dark-1 border border-dark-4 focus:border-gold/40 text-cream rounded-lg text-right font-mono focus:outline-none"
                                      required
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-cream-dim">
                                    <NumericInput
                                      step="0.1"
                                      value={c.utility_percentage || 0}
                                      onChange={(val) => handleUpdateConceptField(c.id!, 'utility_percentage', val)}
                                      className="w-16 px-2 py-1 bg-dark-1 border border-dark-4 focus:border-gold/40 text-cream rounded-lg text-right font-mono focus:outline-none"
                                      required
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-cream-dim select-all">
                                    {formatCurrencyMXN(unitSelling)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-gold select-all">
                                    {formatCurrencyMXN(totalSelling)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveConcepto(c.id!)}
                                      className="p-1 hover:bg-red-500/10 hover:text-red-400 text-cream-muted rounded-lg transition-colors cursor-pointer"
                                      title="Quitar concepto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Button Nuevo concepto */}
                      <div className="p-3 bg-dark-2/45 border-t border-dark-4 flex justify-start select-none">
                        <button
                          type="button"
                          onClick={handleOpenAddConceptModal}
                          className="px-4 py-2 bg-dark-3 border border-dark-4 hover:border-gold/30 text-gold hover:bg-dark-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Nuevo concepto</span>
                        </button>
                      </div>

                      {/* Calculations Footer */}
                      <div className="bg-dark-2/90 border-t border-dark-4 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono select-none">
                        <div className="flex justify-between items-center py-1.5 border-b sm:border-b-0 sm:border-r border-dark-4 pr-0 sm:pr-4">
                          <span className="text-cream-dim uppercase font-bold">Total Costo Directo:</span>
                          <span className="text-cream font-bold">{formatCurrencyMXN(totals.directCostTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 pl-0 sm:pl-4">
                          <span className="text-cream-dim uppercase font-bold">Total Precio de Venta:</span>
                          <span className="text-gold font-bold text-sm">{formatCurrencyMXN(totals.sellingPriceTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="px-6 py-4 border-t border-dark-4 bg-dark-2 flex justify-end gap-3 flex-shrink-0 select-none">
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  className="px-4 py-2 border border-dark-4 hover:bg-dark-3 text-cream-muted hover:text-cream text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-gold/5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Presupuesto</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. REPORTS / INSUMOS EXPLOSION MODAL */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.25s_ease-out]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4 bg-dark-2 flex-shrink-0 select-none">
              <div>
                <h4 className="font-display font-black text-base text-cream uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" />
                  <span>Reporte y Explosión de Insumos</span>
                </h4>
                {reportDetails && (
                  <span className="text-[10px] font-mono text-cream-dim tracking-wider uppercase font-bold mt-1 block">
                    Presupuesto: {reportDetails.name} &mdash; Cliente: {reportDetails.client_name}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsReportOpen(false)}
                className="p-1.5 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-cream transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col min-h-0">
              {loadingReport ? (
                <div className="flex-1 flex flex-col items-center justify-center p-16 select-none">
                  <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-cream-dim mt-3 font-bold">Calculando explosión de insumos...</p>
                </div>
              ) : !reportDetails ? (
                <div className="flex-1 p-6 text-center space-y-3 select-none">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                  <h5 className="text-cream text-sm font-display font-black uppercase">Error al Generar Reporte</h5>
                  <p className="text-xs text-cream-muted font-body">No se pudieron recuperar los conceptos del presupuesto.</p>
                </div>
              ) : (
                <>
                  {/* Tabs switch */}
                  <div className="flex border-b border-dark-4 bg-dark-2 select-none flex-shrink-0">
                    <button
                      onClick={() => setReportTab('resumen')}
                      className={`px-6 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                        reportTab === 'resumen'
                          ? 'border-gold text-gold bg-gold/5'
                          : 'border-transparent text-cream-dim hover:text-cream hover:border-dark-4'
                      }`}
                    >
                      Resumen Presupuesto
                    </button>
                    <button
                      onClick={() => setReportTab('explosion')}
                      className={`px-6 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                        reportTab === 'explosion'
                          ? 'border-gold text-gold bg-gold/5'
                          : 'border-transparent text-cream-dim hover:text-cream hover:border-dark-4'
                      }`}
                    >
                      Explosión de Insumos
                    </button>
                  </div>

                  {/* Tab Scroll Content */}
                  <div className="p-6 overflow-y-auto min-h-0 flex-1 space-y-6">
                    
                    {reportTab === 'resumen' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center select-none border-b border-dark-4 pb-2">
                          <h5 className="text-xs font-black uppercase tracking-widest text-gold">Resumen de Conceptos (Venta)</h5>
                          <span className="text-[10px] font-mono text-cream-dim bg-dark-1 border border-dark-4 px-2 py-0.5 rounded-lg">
                            {reportDetails.conceptos.length} conceptos
                          </span>
                        </div>
                        
                        <div className="border border-dark-4 rounded-xl overflow-hidden">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="border-b border-dark-4 bg-dark-2 select-none">
                                <th className="py-2.5 px-4 font-display font-black text-[9.5px] text-cream-dim uppercase tracking-wider">Concepto / Matriz</th>
                                <th className="py-2.5 px-4 font-display font-black text-[9.5px] text-cream-dim uppercase tracking-wider text-center">Unidad</th>
                                <th className="py-2.5 px-4 font-display font-black text-[9.5px] text-cream-dim uppercase tracking-wider text-right">Cantidad</th>
                                <th className="py-2.5 px-4 font-display font-black text-[9.5px] text-cream-dim uppercase tracking-wider text-right">P.U. Venta</th>
                                <th className="py-2.5 px-4 font-display font-black text-[9.5px] text-cream-dim uppercase tracking-wider text-right">Importe Venta</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-4 text-xs font-body">
                              {(() => {
                                const indPct = reportDetails.indirect_percentage ?? 10.00;
                                const utPct = reportDetails.utility_percentage ?? 8.00;
                                const reportTotals = calculateBudgetTotals(reportDetails.conceptos, indPct, utPct);
                                const indVal = reportTotals.directCostTotal * (indPct / 100);
                                const utVal = (reportTotals.directCostTotal + indVal) * (utPct / 100);

                                return (
                                  <>
                                    {reportDetails.conceptos.map((c) => {
                                      const unitSelling = calculateMatrixSellingPrice(c.cost_price, indPct, utPct);
                                      const totalSelling = Number(c.quantity) * unitSelling;
                                      return (
                                        <tr key={c.id} className="hover:bg-dark-1/10 transition-colors">
                                          <td className="py-3 px-4 text-cream font-bold">{c.description}</td>
                                          <td className="py-3 px-4 text-cream-muted text-center font-mono">{c.unit}</td>
                                          <td className="py-3 px-4 text-right font-mono select-all">{Number(c.quantity).toFixed(2)}</td>
                                          <td className="py-3 px-4 text-right font-mono text-cream-dim select-all">{formatCurrencyMXN(unitSelling)}</td>
                                          <td className="py-3 px-4 text-right font-mono font-bold text-gold select-all">{formatCurrencyMXN(totalSelling)}</td>
                                        </tr>
                                      );
                                    })}
                                    
                                    </tbody>
                                    </table>
                                    </div>

                                    {/* Summary Totals */}
                                    <div className="bg-dark-1/30 p-4 border border-dark-4 rounded-xl space-y-2 text-xs font-mono select-none">
                                      <div className="flex justify-between items-center text-cream-dim">
                                        <span className="uppercase font-bold">Costo Directo Consolidado:</span>
                                        <span className="text-cream font-bold">{formatCurrencyMXN(reportTotals.directCostTotal)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-cream-dim">
                                        <span className="uppercase font-bold">Indirectos ({indPct.toFixed(1)}%):</span>
                                        <span className="text-cream font-bold">{formatCurrencyMXN(indVal)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-cream-dim">
                                        <span className="uppercase font-bold">Utilidad ({utPct.toFixed(1)}%):</span>
                                        <span className="text-cream font-bold">{formatCurrencyMXN(utVal)}</span>
                                      </div>
                                      <div className="flex justify-between items-center border-t border-dark-4/50 pt-2 text-gold">
                                        <span className="uppercase font-black text-sm">Precio Comercial Total (Venta):</span>
                                        <span className="font-bold text-base">{formatCurrencyMXN(reportTotals.sellingPriceTotal)}</span>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                      </div>
                    )}

                    {reportTab === 'explosion' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center select-none border-b border-dark-4 pb-2">
                          <h5 className="text-xs font-black uppercase tracking-widest text-gold">Cómputo Métrico Insumos Requeridos</h5>
                          <span className="text-[10px] font-mono text-cream-dim bg-dark-1 border border-dark-4 px-2 py-0.5 rounded-lg">
                            Desglose de APU
                          </span>
                        </div>

                        {/* Group Render Table helper */}
                        {(() => {
                          const renderInsumosGroup = (groupList: any[], groupName: string) => {
                            if (groupList.length === 0) return null;
                            const grpSubtotal = groupList.reduce((sum, i) => sum + i.totalCost, 0);

                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center select-none pl-2 border-l-2 border-gold/70 bg-gold/5 py-1 pr-3">
                                  <h6 className="text-[10px] font-black uppercase tracking-widest text-cream">{groupName}</h6>
                                  <span className="font-mono text-[10px] text-cream-dim">Subtotal: {formatCurrencyMXN(grpSubtotal)}</span>
                                </div>
                                <div className="border border-dark-4 rounded-xl overflow-hidden">
                                  <table className="w-full border-collapse text-left">
                                    <thead>
                                      <tr className="border-b border-dark-4 bg-dark-2 select-none">
                                        <th className="py-2 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider">Código</th>
                                        <th className="py-2 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider">Descripción</th>
                                        <th className="py-2 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-center">Unidad</th>
                                        <th className="py-2 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right">Cant. Requerida</th>
                                        <th className="py-2 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right">Costo Unitario</th>
                                        <th className="py-2 px-3 font-display font-black text-[9px] text-cream-dim uppercase tracking-wider text-right">Importe Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-4 text-xs font-body">
                                      {groupList.map((item, index) => (
                                        <tr key={index} className="hover:bg-dark-1/10 transition-colors">
                                          <td className="py-2 px-3 font-mono font-bold text-gold select-all">{item.insumo.code}</td>
                                          <td className="py-2 px-3 text-cream">{item.insumo.description}</td>
                                          <td className="py-2 px-3 text-cream-muted text-center font-mono">{item.insumo.unit}</td>
                                          <td className="py-2 px-3 text-right font-mono select-all">{item.totalQuantity.toFixed(4)}</td>
                                          <td className="py-2 px-3 text-right font-mono text-cream-dim select-all">{formatCurrencyMXN(item.insumo.cost)}</td>
                                          <td className="py-2 px-3 text-right font-mono text-cream font-bold select-all">{formatCurrencyMXN(item.totalCost)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="space-y-6">
                              {renderInsumosGroup(aggregatedReport.materials, 'Materiales')}
                              {renderInsumosGroup(aggregatedReport.labor, 'Mano de Obra')}
                              {renderInsumosGroup(aggregatedReport.equipment, 'Equipos y Maquinaria')}
                              {renderInsumosGroup(aggregatedReport.tools, 'Herramientas y Accesorios')}

                              {/* Explosion Total */}
                              <div className="bg-dark-2 border border-dark-4 p-4 rounded-xl flex justify-between items-center text-xs font-mono select-none">
                                <span className="text-cream-dim uppercase font-black">Costo de Insumos Consolidado (Explosión):</span>
                                <span className="text-gold font-bold text-sm md:text-base">{formatCurrencyMXN(aggregatedReport.overallInsumosCost)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Controls */}
                  <div className="px-6 py-4 border-t border-dark-4 bg-dark-2 flex justify-between items-center flex-shrink-0 select-none">
                    <span className="text-[10px] font-mono text-cream-muted">eSol Energías APU Engine v2.0</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsReportOpen(false)}
                        className="px-4 py-2 border border-dark-4 hover:bg-dark-3 text-cream-muted hover:text-cream text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Cerrar
                      </button>
                      <button
                        onClick={handleCopyReport}
                        className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-gold/5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Reporte</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4.5 NESTED ADD CONCEPT CREATOR SUB-MODAL */}
      {isAddConceptModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] font-sans">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.25s_ease-out]">
            
            {/* Sub-modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4 bg-dark-2 flex-shrink-0 select-none">
              <h4 className="font-display font-black text-sm text-cream uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-gold stroke-[2.5]" />
                <span>Nuevo Concepto</span>
              </h4>
              <button 
                onClick={() => setIsAddConceptModalOpen(false)}
                className="p-1 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-cream transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-modal Navigation Tabs */}
            <div className="flex bg-dark-1 border-b border-dark-4 p-1.5 gap-1 select-none flex-shrink-0 text-[10px] font-black uppercase tracking-wider">
              {([
                { key: 'apu', label: 'Usar Plantilla APU' },
                { key: 'custom', label: 'Concepto Personalizado' },
                { key: 'new_matrix', label: 'Crear Nueva Matriz' },
                { key: 'new_insumo', label: 'Crear Nuevo Insumo' }
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setAddConceptTab(tab.key); setSubModalError(null); }}
                  className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
                    addConceptTab === tab.key
                      ? 'bg-gold/10 text-gold border border-gold/20 font-bold'
                      : 'text-cream-muted hover:text-cream hover:bg-dark-2'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-modal Body */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 space-y-4">
              {subModalError && (
                <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl text-xs flex items-start gap-2 select-none animate-[shake_0.4s_ease-in-out]">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{subModalError}</span>
                </div>
              )}

              {/* Tab 1: APU Template */}
              {addConceptTab === 'apu' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Seleccionar de Matriz Existente (Catálogo APU)</label>
                    <select
                      value={selectedMatrixId}
                      onChange={(e) => setSelectedMatrixId(e.target.value)}
                      className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none cursor-pointer font-mono"
                    >
                      <option value="">-- Elige una Matriz APU --</option>
                      {matrices.map(m => (
                        <option key={m.id} value={m.id}>
                          [{m.code}] {m.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Cantidad requerida</label>
                      <NumericInput
                        step="0.01"
                        min="0.01"
                        value={customQty}
                        onChange={setCustomQty}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                    {selectedMatrixId && (() => {
                      const matrix = matrices.find(m => m.id === selectedMatrixId);
                      if (!matrix) return null;
                      const directCost = calculateMatrixDirectCost(matrix.insumos || []);
                      const sellingPrice = calculateMatrixSellingPrice(directCost, matrix.indirect_percentage, matrix.utility_percentage);
                      return (
                        <div className="space-y-1 bg-dark-1/50 border border-dark-4 p-3 rounded-xl font-mono text-[10px] select-none">
                          <span className="text-cream-dim block uppercase text-[8px] font-black tracking-widest">Previsualización APU</span>
                          <span className="text-cream block">Costo Directo U: {formatCurrencyMXN(directCost)}</span>
                          <span className="text-gold block font-bold">Venta U: {formatCurrencyMXN(sellingPrice)}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddExistingAPU}
                      disabled={!selectedMatrixId}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5"
                    >
                      Añadir al Presupuesto
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Custom Concept (Ad-hoc) */}
              {addConceptTab === 'custom' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Descripción del Concepto</label>
                    <input
                      type="text"
                      placeholder="Ej. Suministro e instalación de ducto galvanizado..."
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Unidad</label>
                      <input
                        type="text"
                        placeholder="pza, m, jor"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Cantidad</label>
                      <NumericInput
                        step="0.01"
                        min="0.01"
                        value={customQty}
                        onChange={setCustomQty}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Costo Directo Unitario (MXN)</label>
                      <NumericInput
                        step="0.01"
                        value={customCost}
                        onChange={setCustomCost}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Indirecto %</label>
                      <NumericInput
                        step="0.1"
                        value={customIndirect}
                        onChange={setCustomIndirect}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Utilidad %</label>
                      <NumericInput
                        step="0.1"
                        value={customUtility}
                        onChange={setCustomUtility}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                    <div className="bg-dark-1/50 border border-dark-4 p-3 rounded-xl font-mono text-[10px] select-none flex flex-col justify-center">
                      <span className="text-cream-dim uppercase text-[8px] font-black tracking-widest block">Precio de Venta Unitario</span>
                      <span className="text-gold font-bold text-sm">
                        {formatCurrencyMXN(calculateMatrixSellingPrice(customCost, customIndirect, customUtility))}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddCustomConcept}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5"
                    >
                      Añadir al Presupuesto
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Create New Matrix (APU) */}
              {addConceptTab === 'new_matrix' && (
                <form onSubmit={handleCreateAndAddMatrix} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Código Matriz</label>
                      <input
                        type="text"
                        placeholder="APU-CONCEPTO-N"
                        value={newMatrixCode}
                        onChange={(e) => setNewMatrixCode(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none uppercase font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Descripción Matriz</label>
                      <input
                        type="text"
                        placeholder="Ej. Suministro e instalacion de panel..."
                        value={newMatrixDesc}
                        onChange={(e) => setNewMatrixDesc(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Unidad</label>
                      <input
                        type="text"
                        placeholder="pza, m"
                        value={newMatrixUnit}
                        onChange={(e) => setNewMatrixUnit(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Indirecto %</label>
                      <NumericInput
                        step="0.1"
                        value={newMatrixIndirect}
                        onChange={setNewMatrixIndirect}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Utilidad %</label>
                      <NumericInput
                        step="0.1"
                        value={newMatrixUtility}
                        onChange={setNewMatrixUtility}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Matrix breakdown list builder */}
                  <div className="border border-dark-4 p-4 rounded-xl space-y-3 bg-dark-1/30">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gold block select-none">Desglose de Insumos de la Matriz</span>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 select-none">
                      <div className="flex-1 space-y-1">
                        <label className="text-[8.5px] text-cream-muted uppercase font-bold block">Seleccionar Insumo del Catálogo</label>
                        <select
                          value={selectedInsumoIdForNewMatrix}
                          onChange={(e) => setSelectedInsumoIdForNewMatrix(e.target.value)}
                          className="w-full p-2 bg-dark-1 border border-dark-4 text-xs text-cream rounded-lg focus:outline-none font-mono cursor-pointer"
                        >
                          <option value="">-- Elige un Insumo --</option>
                          {insumosCatalog.map(ins => (
                            <option key={ins.id} value={ins.id}>
                              [{ins.code}] ({ins.type === 'service' ? 'Trámite' : ins.type}) {ins.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24 space-y-1">
                        <label className="text-[8.5px] text-cream-muted uppercase font-bold block">Cantidad / Rend.</label>
                        <NumericInput
                          step="0.0001"
                          min="0.0001"
                          value={insumoQtyForNewMatrix}
                          onChange={setInsumoQtyForNewMatrix}
                          className="w-full p-2 bg-dark-1 border border-dark-4 text-xs text-cream rounded-lg text-right font-mono focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddInsumoToNewMatrix}
                        disabled={!selectedInsumoIdForNewMatrix}
                        className="px-3 py-2 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 font-black text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </button>
                    </div>

                    {/* Breakdown list */}
                    {newMatrixInsumos.length > 0 ? (
                      <div className="border border-dark-4 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-[11px] border-collapse bg-dark-2/40">
                          <thead>
                            <tr className="border-b border-dark-4 bg-dark-2 select-none text-[8.5px] uppercase text-cream-dim">
                              <th className="py-1.5 px-2">Código</th>
                              <th className="py-1.5 px-2">Insumo</th>
                              <th className="py-1.5 px-2 text-right">Rend.</th>
                              <th className="py-1.5 px-2 text-right">Costo U.</th>
                              <th className="py-1.5 px-2 text-right">Importe</th>
                              <th className="py-1.5 px-2 text-center w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-4 font-body">
                            {newMatrixInsumos.map((item, idx) => {
                              const importe = item.insumo.cost * item.quantity;
                              return (
                                <tr key={idx} className="hover:bg-dark-1/25 transition-colors">
                                  <td className="py-1.5 px-2 font-mono font-bold text-gold/80 select-all">{item.insumo.code}</td>
                                  <td className="py-1.5 px-2 text-cream truncate max-w-[150px]">{item.insumo.description}</td>
                                  <td className="py-1.5 px-2 text-right font-mono select-all">{item.quantity.toFixed(4)}</td>
                                  <td className="py-1.5 px-2 text-right font-mono text-cream-dim select-all">{formatCurrencyMXN(item.insumo.cost)}</td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold text-cream select-all">{formatCurrencyMXN(importe)}</td>
                                  <td className="py-1.5 px-2 text-center select-none">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveInsumoFromNewMatrix(item.insumo.id)}
                                      className="p-1 text-cream-muted hover:text-red-400 transition-colors cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[10px] text-cream-muted font-body italic text-center py-2">Ningún insumo añadido a la matriz aún.</p>
                    )}
                  </div>

                  <div className="pt-4 flex justify-between items-center select-none border-t border-dark-4">
                    {/* Live preview cost calculations */}
                    {(() => {
                      const direct = calculateMatrixDirectCost(newMatrixInsumos);
                      const sale = calculateMatrixSellingPrice(direct, newMatrixIndirect, newMatrixUtility);
                      return (
                        <div className="font-mono text-[9.5px] text-cream-dim">
                          <span>Directo: {formatCurrencyMXN(direct)} &bull; </span>
                          <span className="text-gold font-bold">Venta APU: {formatCurrencyMXN(sale)}</span>
                        </div>
                      );
                    })()}
                    <button
                      type="submit"
                      disabled={subModalSubmitting}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5 flex items-center gap-1.5"
                    >
                      {subModalSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando Matriz...</span>
                        </>
                      ) : (
                        <span>Guardar Matriz y Añadir Concepto</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 4: Create New Insumo */}
              {addConceptTab === 'new_insumo' && (
                <form onSubmit={handleCreateNewInsumo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Código Insumo</label>
                      <input
                        type="text"
                        placeholder="MAT-NUEVO-01"
                        value={newInsumoCode}
                        onChange={(e) => setNewInsumoCode(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none uppercase font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Tipo Insumo</label>
                      <select
                        value={newInsumoType}
                        onChange={(e) => { setNewInsumoType(e.target.value as InsumoType); setNewInsumoSubcategory(''); }}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none cursor-pointer"
                      >
                        <option value="material">Material</option>
                        <option value="labor">Mano de Obra</option>
                        <option value="equipment">Equipo</option>
                        <option value="tool">Herramienta</option>
                        <option value="service">Trámite</option>
                      </select>
                    </div>
                  </div>

                  {newInsumoType === 'material' && (
                    <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Subcategoría de Material</label>
                      <select
                        value={newInsumoSubcategory}
                        onChange={(e) => setNewInsumoSubcategory(e.target.value as InsumoSubcategory | '')}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none cursor-pointer"
                      >
                        <option value="">— Sin subcategoría —</option>
                        {MATERIAL_SUBCATEGORIES.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Descripción del Insumo</label>
                    <input
                      type="text"
                      placeholder="Ej. Inversor Central trifásico Fronius..."
                      value={newInsumoDesc}
                      onChange={(e) => setNewInsumoDesc(e.target.value)}
                      className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Unidad</label>
                      <input
                        type="text"
                        placeholder="pza, m, hr"
                        value={newInsumoUnit}
                        onChange={(e) => setNewInsumoUnit(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Costo Unitario (MXN)</label>
                      <NumericInput
                        step="0.01"
                        value={newInsumoCost}
                        onChange={setNewInsumoCost}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end border-t border-dark-4">
                    <button
                      type="submit"
                      disabled={subModalSubmitting}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5 flex items-center gap-1.5"
                    >
                      {subModalSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando Insumo...</span>
                        </>
                      ) : (
                        <span>Guardar Insumo en Catálogo</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Sub-modal Footer */}
            <div className="px-6 py-4 border-t border-dark-4 bg-dark-2 flex justify-between items-center flex-shrink-0 select-none">
              <span className="text-[10px] font-mono text-cream-muted">Añadiendo concepto al presupuesto</span>
              <button
                type="button"
                onClick={() => setIsAddConceptModalOpen(false)}
                className="px-4 py-2 border border-dark-4 hover:bg-dark-3 text-cream-muted hover:text-cream text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. DELETION CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] font-sans select-none">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl animate-[scaleUp_0.2s_ease-out]">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h4 className="font-display font-black text-base uppercase tracking-wide">Eliminar Presupuesto</h4>
            </div>
            
            <p className="text-xs text-cream-dim leading-relaxed font-body">
              ¿Estás completamente seguro de que deseas eliminar el presupuesto <strong className="text-cream font-mono select-all">"{deleteConfirmName}"</strong>?<br/>
              Esta acción no se puede deshacer y se borrarán todos los conceptos de estimación asociados.
            </p>

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={handleCloseDeleteConfirm}
                className="px-4 py-2 border border-dark-4 hover:bg-dark-3 text-cream-muted hover:text-cream font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer shadow-md shadow-red-500/10"
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
