import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { 
  getPresupuestos, getPresupuestoDetails, calculateMatrixSellingPrice, 
  calculateMatrixDirectCost, calculateBudgetTotals, evaluateFormula,
  getInsumos, getMatrices, saveInsumo, saveMatriz
} from '../../lib/cotizadorService';
import type { Presupuesto, PresupuestoConcepto, Insumo, Matriz, InsumoType, InsumoSubcategory } from '../../types/cotizador';
import { MATERIAL_SUBCATEGORIES } from '../../types/cotizador';
import { 
  Loader2, AlertTriangle, FileText, ChevronRight, ChevronDown, 
  Layers, Package, Users, Cpu, ShieldCheck, DollarSign, 
  TrendingUp, Download, Eye, RefreshCw, X, ArrowLeft, ArrowRight, Layers2, Wrench, Plus, HelpCircle,
  ArrowUp, ArrowDown, Trash2, Folder
} from 'lucide-react';

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  step?: string;
  min?: string;
  required?: boolean;
}

const NumericInput = ({ value, onChange, className, step = "1", min, required }: NumericInputProps) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      setLocalValue(value.toString());
    }
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

const CurrencyEditCell = ({ value, onChange }: { value: number; onChange: (val: number) => Promise<void> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(value.toFixed(2));

  useEffect(() => {
    setTempValue(value.toFixed(2));
  }, [value]);

  if (isEditing) {
    return (
      <div className="flex justify-end items-center gap-1 select-none font-mono">
        <span className="text-cream-dim text-[11px] font-mono">$</span>
        <input
          type="number"
          step="0.01"
          min="0.00"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={async () => {
            setIsEditing(false);
            const parsed = parseFloat(tempValue);
            if (!isNaN(parsed) && parsed !== value) {
              await onChange(parsed);
            } else {
              setTempValue(value.toFixed(2));
            }
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              const parsed = parseFloat(tempValue);
              if (!isNaN(parsed) && parsed !== value) {
                await onChange(parsed);
              } else {
                setTempValue(value.toFixed(2));
              }
            }
          }}
          autoFocus
          className="w-20 px-1 py-0.5 bg-dark-1 border border-dark-4 text-right text-cream font-mono rounded text-[11px] focus:outline-none focus:border-gold/50"
        />
      </div>
    );
  }

  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-dark-3/30 px-1.5 py-0.5 rounded text-right font-mono text-cream hover:text-gold transition-colors select-all"
      title="Haga clic para editar el costo"
    >
      ${formatted}
    </div>
  );
};

const getInitials = (name: string): string => {
  if (!name) return '';
  return name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('')
    .replace(/[^A-Z0-9]/g, '');
};

interface PresupuestoDashboardPageProps {
  id: string;
}

export default function PresupuestoDashboardPage({ id }: PresupuestoDashboardPageProps) {
  const [budget, setBudget] = useState<(Presupuesto & { conceptos: PresupuestoConcepto[] }) | null>(null);
  const [budgetNumber, setBudgetNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [expandedConcepts, setExpandedConcepts] = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [editingDescriptionConceptId, setEditingDescriptionConceptId] = useState<string | null>(null);
  const [editingDescriptionValue, setEditingDescriptionValue] = useState<string>('');

  // Auth check states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Auth fields
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // ----------------------------------------------------
  // SUB-MODAL CONCEPT BUILDER STATES
  // ----------------------------------------------------
  const [matrices, setMatrices] = useState<Matriz[]>([]);
  const [insumosCatalog, setInsumosCatalog] = useState<Insumo[]>([]);
  const [isAddConceptModalOpen, setIsAddConceptModalOpen] = useState<boolean>(false);
  const [addConceptTab, setAddConceptTab] = useState<'apu' | 'use_insumo' | 'group_insumos' | 'create_group' | 'new_matrix' | 'new_insumo'>('apu');
  
  // Selector / Custom Concept / Insumo Concept
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>('');
  const [selectedInsumoId, setSelectedInsumoId] = useState<string>('');
  const [customDesc, setCustomDesc] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customCost, setCustomCost] = useState<number>(0);
  const [customIndirect, setCustomIndirect] = useState<number>(10);
  const [customUtility, setCustomUtility] = useState<number>(8);

  // Grupo de Insumos Form
  const [groupName, setGroupName] = useState<string>('');
  const [groupUnit, setGroupUnit] = useState<string>('lote');
  const [groupQty, setGroupQty] = useState<number>(1);
  const [selectedInsumoIdForGroup, setSelectedInsumoIdForGroup] = useState<string>('');
  const [insumoQtyForGroup, setInsumoQtyForGroup] = useState<number>(1);
  const [groupInsumos, setGroupInsumos] = useState<{ insumo: Insumo; quantity: number }[]>([]);
  
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

  // ----------------------------------------------------
  // STANDALONE MATRIX EDITOR STATES (FOR ACCORDION EDITING)
  // ----------------------------------------------------
  const [editingMatrix, setEditingMatrix] = useState<Matriz | null>(null);
  const [isMatrixEditorOpen, setIsMatrixEditorOpen] = useState<boolean>(false);
  const [matrixFormCode, setMatrixFormCode] = useState<string>('');
  const [matrixFormDesc, setMatrixFormDesc] = useState<string>('');
  const [matrixFormUnit, setMatrixFormUnit] = useState<string>('');
  const [matrixFormIndirect, setMatrixFormIndirect] = useState<number>(10);
  const [matrixFormUtility, setMatrixFormUtility] = useState<number>(8);
  const [matrixFormInsumos, setMatrixFormInsumos] = useState<{ insumo: Insumo; quantity: number }[]>([]);
  const [selectedInsumoIdForMatrixForm, setSelectedInsumoIdForMatrixForm] = useState<string>('');
  const [insumoQtyForMatrixForm, setInsumoQtyForMatrixForm] = useState<string>('1');
  const [activeConceptQty, setActiveConceptQty] = useState<number>(1);
  const [matrixFormError, setMatrixFormError] = useState<string | null>(null);
  const [matrixFormSubmitting, setMatrixFormSubmitting] = useState<boolean>(false);
  const [matrixFormInsumoSearch, setMatrixFormInsumoSearch] = useState<string>('');
  const [matrixFormInsumoTypeFilter, setMatrixFormInsumoTypeFilter] = useState<'all' | 'material' | 'labor' | 'equipment' | 'tool' | 'service'>('all');
  const [isFormulaHelpOpen, setIsFormulaHelpOpen] = useState<boolean>(false);

  // Fetch user session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile);
          } else {
            // Fallback role mapping
            const email = session.user.email || '';
            let role = 'user';
            if (email === 'menyfre@gmail.com' || email.includes('master')) {
              role = 'master';
            } else if (email.includes('admin')) {
              role = 'admin';
            }
            setCurrentUser({ id: session.user.id, email, role, name: email.split('@')[0] });
          }
        }
      } catch (e) {
        console.error('Error fetching session:', e);
      } finally {
        setCheckingAuth(false);
      }
    };
    fetchSession();
  }, []);

  // Fetch budget details and catalog cache
  const fetchBudgetDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, matricesData, insumosData] = await Promise.all([
        getPresupuestoDetails(id),
        getMatrices(),
        getInsumos()
      ]);

      const allBudgets = await getPresupuestos();
      const sorted = [...allBudgets].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });
      const idx = sorted.findIndex(b => b.id === data.id);
      const seqNum = idx !== -1 ? idx + 1 : 1;

      setBudget(data);
      setBudgetNumber(seqNum);
      setMatrices(matricesData);
      setInsumosCatalog(insumosData);
    } catch (err: any) {
      console.error('Error fetching budget details:', err);
      setError('No se pudo encontrar el presupuesto o no tienes permisos para acceder a él.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
      fetchBudgetDetails();
    }
  }, [id, currentUser]);

  const handleUpdateStatus = async (newStatus: 'borrador' | 'enviado' | 'aprobado' | 'rechazado') => {
    if (!budget) return;
    setUpdatingStatus(true);
    try {
      const { error: dbError } = await supabase
        .from('presupuestos')
        .update({ status: newStatus })
        .eq('id', budget.id);

      if (dbError) throw dbError;
      setBudget(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('No se pudo actualizar el estado.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleProduccion = async () => {
    if (!budget) return;
    setUpdatingStatus(true);
    try {
      const newValue = !(budget.produccion ?? false);
      const { error: dbError } = await supabase
        .from('presupuestos')
        .update({ produccion: newValue })
        .eq('id', budget.id);

      if (dbError) throw dbError;
      setBudget(prev => prev ? { ...prev, produccion: newValue } : null);
    } catch (err: any) {
      console.error('Error toggling produccion:', err);
      alert('No se pudo actualizar el estado de producci\u00f3n.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [updatingMargins, setUpdatingMargins] = useState<boolean>(false);

  const handleUpdateBudgetMargins = async (indirectPct: number, utilityPct: number) => {
    if (!budget) return;
    setUpdatingMargins(true);
    try {
      const { error: dbError } = await supabase
        .from('presupuestos')
        .update({
          indirect_percentage: indirectPct,
          utility_percentage: utilityPct
        })
        .eq('id', budget.id);

      if (dbError) throw dbError;
      
      setBudget(prev => prev ? {
        ...prev,
        indirect_percentage: indirectPct,
        utility_percentage: utilityPct
      } : null);
    } catch (err: any) {
      console.error('Error updating budget margins:', err);
      alert('No se pudo actualizar los porcentajes generales. Asegúrate de aplicar la migración DDL en Supabase.');
    } finally {
      setUpdatingMargins(false);
    }
  };

  // ----------------------------------------------------
  // SUB-MODAL ACTION HANDLERS & DB PERSISTENCE
  // ----------------------------------------------------
  const handleSaveConceptToDb = async (conceptData: {
    matriz_id: string | null;
    description: string;
    unit: string;
    quantity: number;
    cost_price: number;
    indirect_percentage: number;
    utility_percentage: number;
  }) => {
    if (!budget) {
      setSubModalError('El presupuesto no está cargado.');
      return;
    }
    setSubModalSubmitting(true);
    setSubModalError(null);
    try {
      const nextOrderIndex = budget.conceptos ? budget.conceptos.length : 0;
      const { error: insertError } = await supabase
        .from('presupuesto_conceptos')
        .insert({
          presupuesto_id: budget.id,
          matriz_id: conceptData.matriz_id,
          description: conceptData.description,
          unit: conceptData.unit,
          quantity: conceptData.quantity,
          cost_price: conceptData.cost_price,
          indirect_percentage: conceptData.indirect_percentage,
          utility_percentage: conceptData.utility_percentage,
          order_index: nextOrderIndex
        });

      if (insertError) throw insertError;
      
      // Close modal and refresh budget details
      setIsAddConceptModalOpen(false);
      await fetchBudgetDetails();
    } catch (err: any) {
      console.error('Error saving concept:', err);
      setSubModalError(err.message || 'Error al guardar el concepto.');
    } finally {
      setSubModalSubmitting(false);
    }
  };

  const handleOpenAddConceptModal = () => {
    setAddConceptTab('apu');
    setSelectedMatrixId('');
    setSelectedInsumoId('');
    
    setCustomDesc('');
    setCustomUnit('pza');
    setCustomQty(1);
    setCustomCost(0);
    setCustomIndirect(10);
    setCustomUtility(8);

    setGroupName('');
    setGroupUnit('lote');
    setGroupQty(1);
    setSelectedInsumoIdForGroup('');
    setInsumoQtyForGroup(1);
    setGroupInsumos([]);
    
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

  const handleAddExistingAPU = async () => {
    if (!selectedMatrixId) {
      setSubModalError('Selecciona una matriz de la lista.');
      return;
    }
    const matrix = matrices.find(m => m.id === selectedMatrixId);
    if (!matrix) return;
    
    const costPrice = calculateMatrixDirectCost(matrix.insumos || []);
    const isPza = matrix.unit?.trim().toLowerCase() === 'pza';
    const rawQty = customQty > 0 ? customQty : 1.00;
    const finalQty = isPza ? Math.max(1, Math.round(rawQty)) : rawQty;

    await handleSaveConceptToDb({
      matriz_id: matrix.id,
      description: matrix.description,
      unit: matrix.unit,
      cost_price: costPrice,
      indirect_percentage: matrix.indirect_percentage,
      utility_percentage: matrix.utility_percentage,
      quantity: finalQty
    });
  };

  const handleAddInsumoAsConcept = async () => {
    if (!selectedInsumoId) {
      setSubModalError('Selecciona un insumo de la lista.');
      return;
    }
    const ins = insumosCatalog.find(i => i.id === selectedInsumoId);
    if (!ins) return;

    if (customQty <= 0) {
      setSubModalError('La cantidad debe ser mayor a 0.');
      return;
    }

    const isPza = ins.unit?.trim().toLowerCase() === 'pza';
    const finalQty = isPza ? Math.max(1, Math.round(customQty)) : customQty;

    await handleSaveConceptToDb({
      matriz_id: null, // Independiente de matrices
      description: ins.description,
      unit: ins.unit,
      cost_price: ins.cost,
      indirect_percentage: customIndirect,
      utility_percentage: customUtility,
      quantity: finalQty
    });
  };

  const handleCreateAndAddGroupOfInsumos = async () => {
    if (!groupName.trim()) {
      setSubModalError('El nombre del grupo es obligatorio.');
      return;
    }
    if (!groupUnit.trim()) {
      setSubModalError('La unidad es obligatoria.');
      return;
    }
    if (groupQty <= 0) {
      setSubModalError('La cantidad del grupo debe ser mayor a 0.');
      return;
    }
    if (groupInsumos.length === 0) {
      setSubModalError('Debes añadir al menos un insumo al grupo.');
      return;
    }

    setSubModalSubmitting(true);
    setSubModalError(null);

    try {
      const nextOrderIndex = budget.conceptos ? budget.conceptos.length : 0;
      
      // 1. Save the parent group concept
      const { data: parentGroupData, error: parentError } = await supabase
        .from('presupuesto_conceptos')
        .insert({
          presupuesto_id: budget.id,
          matriz_id: null,
          description: groupName.trim(),
          unit: groupUnit.trim(),
          quantity: groupQty,
          cost_price: 0,
          indirect_percentage: customIndirect,
          utility_percentage: customUtility,
          order_index: nextOrderIndex,
          type: 'group',
          parent_id: null
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // 2. Save all insumos as child concepts of type 'insumo_directo'
      const childConcepts = groupInsumos.map((item, idx) => {
        const isPza = item.insumo.unit?.trim().toLowerCase() === 'pza';
        const rawChildQty = item.quantity;
        const finalChildQty = isPza ? Math.max(1, Math.round(rawChildQty)) : rawChildQty;

        return {
          presupuesto_id: budget.id,
          matriz_id: null,
          description: item.insumo.description,
          unit: item.insumo.unit,
          quantity: finalChildQty,
          cost_price: item.insumo.cost,
          indirect_percentage: customIndirect,
          utility_percentage: customUtility,
          order_index: idx,
          type: 'insumo_directo',
          parent_id: parentGroupData.id
        };
      });

      const { error: childrenError } = await supabase
        .from('presupuesto_conceptos')
        .insert(childConcepts);

      if (childrenError) throw childrenError;

      setIsAddConceptModalOpen(false);
      await fetchBudgetDetails();
    } catch (err: any) {
      console.error('Error saving group of insumos:', err);
      setSubModalError(err.message || 'Error al guardar el grupo de insumos.');
    } finally {
      setSubModalSubmitting(false);
    }
  };

  const handleCreateAgrupador = async () => {
    if (!groupName.trim()) {
      setSubModalError('El nombre del agrupador es obligatorio.');
      return;
    }
    
    setSubModalSubmitting(true);
    setSubModalError(null);
    try {
      const nextOrderIndex = budget.conceptos ? budget.conceptos.length : 0;
      const { error } = await supabase
        .from('presupuesto_conceptos')
        .insert({
          presupuesto_id: budget.id,
          matriz_id: null,
          description: groupName.trim(),
          unit: groupUnit || 'grp',
          quantity: 1,
          cost_price: 0,
          indirect_percentage: customIndirect,
          utility_percentage: customUtility,
          order_index: nextOrderIndex,
          type: 'group',
          parent_id: selectedMatrixId || null // Reused selectedMatrixId as parentId in this tab
        });

      if (error) throw error;
      setIsAddConceptModalOpen(false);
      await fetchBudgetDetails();
    } catch (err: any) {
      console.error('Error creating agrupador:', err);
      setSubModalError(err.message || 'Error al crear el agrupador.');
    } finally {
      setSubModalSubmitting(false);
    }
  };

  const handleAddInsumoToGroup = () => {
    if (!selectedInsumoIdForGroup) return;
    const insumo = insumosCatalog.find(i => i.id === selectedInsumoIdForGroup);
    if (!insumo) return;
    
    if (groupInsumos.some(item => item.insumo.id === insumo.id)) {
      alert('Este insumo ya está añadido al grupo.');
      return;
    }
    
    setGroupInsumos(prev => [...prev, { insumo, quantity: insumoQtyForGroup }]);
    setSelectedInsumoIdForGroup('');
    setInsumoQtyForGroup(1);
  };

  const handleRemoveInsumoFromGroup = (insumoId: string) => {
    setGroupInsumos(prev => prev.filter(item => item.insumo.id !== insumoId));
  };

  const handleAddInsumoToNewMatrix = () => {
    if (!selectedInsumoIdForNewMatrix) return;
    const insumo = insumosCatalog.find(i => i.id === selectedInsumoIdForNewMatrix);
    if (!insumo) return;
    
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
      
      // Update matrices catalog
      setMatrices(prev => [...prev, saved].sort((a, b) => a.code.localeCompare(b.code)));
      
      // Save it directly as a concept
      const costPrice = calculateMatrixDirectCost(saved.insumos || []);
      const isPza = saved.unit?.trim().toLowerCase() === 'pza';
      const rawQty = customQty > 0 ? customQty : 1.00;
      const finalQty = isPza ? Math.max(1, Math.round(rawQty)) : rawQty;

      await handleSaveConceptToDb({
        matriz_id: saved.id,
        description: saved.description,
        unit: saved.unit,
        cost_price: costPrice,
        indirect_percentage: saved.indirect_percentage,
        utility_percentage: saved.utility_percentage,
        quantity: finalQty
      });
    } catch (err: any) {
      console.error('Error creating matrix:', err);
      setSubModalError(err.message || 'Error al guardar la matriz. Verifica si el código ya existe.');
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

  // ----------------------------------------------------
  // INLINE YIELD AND MATRIX EDITOR ACTIONS
  // ----------------------------------------------------
  const handleUpdateInsumoQuantity = async (matrixId: string, insumoId: string, newQty: number) => {
    try {
      const { error: dbError } = await supabase
        .from('matriz_insumos')
        .update({ quantity: newQty })
        .eq('matriz_id', matrixId)
        .eq('insumo_id', insumoId);
         
      if (dbError) throw dbError;
      
      // Calculate the new direct cost of the matrix
      const updatedDetails = await getPresupuestoDetails(id);
      const matrix = updatedDetails.conceptos.find(c => c.matriz_id === matrixId)?.matriz;
      if (matrix) {
        const newDirectCost = calculateMatrixDirectCost(matrix.insumos || []);
        
        // Update all concepts using this matrix in the database
        const conceptsToUpdate = updatedDetails.conceptos.filter(c => c.matriz_id === matrixId);
        for (const c of conceptsToUpdate) {
          await supabase
            .from('presupuesto_conceptos')
            .update({ cost_price: newDirectCost })
            .eq('id', c.id);
        }
      }
      
      await fetchBudgetDetails();
    } catch (err: any) {
      console.error('Error updating insumo quantity:', err);
      alert('No se pudo actualizar el rendimiento en la base de datos.');
    }
  };

  const handleUpdateConceptQuantity = async (conceptId: string, newQty: number) => {
    try {
      const { error: dbError } = await supabase
        .from('presupuesto_conceptos')
        .update({ quantity: newQty })
        .eq('id', conceptId);
         
      if (dbError) throw dbError;
      
      await fetchBudgetDetails();
    } catch (err: any) {
      console.error('Error updating concept quantity:', err);
      alert('No se pudo actualizar la cantidad del concepto.');
    }
  };

  const handleMoveConcept = async (conceptId: string, direction: -1 | 1) => {
    if (!budget || !budget.conceptos) return;
    
    const targetConcept = budget.conceptos.find(c => c.id === conceptId);
    if (!targetConcept) return;

    // Find siblings (concepts with the same parent_id)
    const siblings = budget.conceptos
      .filter(c => c.parent_id === targetConcept.parent_id)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const currentIndex = siblings.findIndex(s => s.id === conceptId);
    const targetIndex = currentIndex + direction;
    
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const siblingA = siblings[currentIndex];
    const siblingB = siblings[targetIndex];

    try {
      // Rewrite all sibling indices sequentially, swapping the target ones to avoid duplicate collision lockups
      const updates = siblings.map((sib, idx) => {
        let targetOrder = idx;
        if (sib.id === siblingA.id) {
          targetOrder = targetIndex;
        } else if (sib.id === siblingB.id) {
          targetOrder = currentIndex;
        }
        return supabase
          .from('presupuesto_conceptos')
          .update({ order_index: targetOrder })
          .eq('id', sib.id);
      });

      const results = await Promise.all(updates);
      const errorResult = results.find(r => r.error);
      if (errorResult) throw errorResult.error;

      await fetchBudgetDetails();
    } catch (err: any) {
      console.error("Error updating concept order:", err);
      alert(`No se pudo guardar el nuevo orden de los conceptos: ${err.message || err}`);
      await fetchBudgetDetails();
    }
  };

  const handleUpdateConceptParent = async (conceptId: string, parentId: string | null) => {
    try {
      const { error } = await supabase
        .from('presupuesto_conceptos')
        .update({ parent_id: parentId })
        .eq('id', conceptId);
        
      if (error) throw error;
      await fetchBudgetDetails();
    } catch (err) {
      console.error('Error updating parent:', err);
      alert('No se pudo reasignar el agrupador del concepto.');
    }
  };

  const handleSaveConceptDescription = async (conceptId: string) => {
    if (!editingDescriptionValue.trim()) {
      setEditingDescriptionConceptId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('presupuesto_conceptos')
        .update({ description: editingDescriptionValue.trim() })
        .eq('id', conceptId);

      if (error) throw error;
      
      setBudget(prev => {
        if (!prev) return null;
        return {
          ...prev,
          conceptos: prev.conceptos.map(c => 
            c.id === conceptId ? { ...c, description: editingDescriptionValue.trim() } : c
          )
        };
      });
      setEditingDescriptionConceptId(null);
    } catch (err: any) {
      console.error('Error saving concept description:', err);
      alert('No se pudo guardar la descripción.');
    }
  };

  const handleIndentConcept = async (conceptId: string) => {
    if (!budget || !budget.conceptos) return;
    
    const flatIndex = flatConceptsList.findIndex(fc => fc.concept.id === conceptId);
    if (flatIndex <= 0) return;

    const currentItem = flatConceptsList[flatIndex].concept;

    try {
      // 1. Create a new agrupador concept row directly at currentItem's current parent level
      const newGroupRow = {
        presupuesto_id: budget.id,
        type: 'group',
        description: 'NUEVO AGRUPADOR',
        unit: 'grp',
        quantity: 1,
        cost_price: 0,
        indirect_percentage: 0,
        utility_percentage: 0,
        parent_id: currentItem.parent_id,
        order_index: (currentItem.order_index ?? 0) - 1
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('presupuesto_conceptos')
        .insert(newGroupRow)
        .select()
        .single();

      if (insertError) throw insertError;
      const newGroupId = insertedData.id;

      // 2. Set currentItem's parent_id to the new group's id
      const { error: updateError } = await supabase
        .from('presupuesto_conceptos')
        .update({ parent_id: newGroupId })
        .eq('id', currentItem.id);

      if (updateError) throw updateError;

      // 3. Reload budget details
      await fetchBudgetDetails();

      // 4. Activate description editing state for the new group
      setEditingDescriptionConceptId(newGroupId);
      setEditingDescriptionValue('NUEVO AGRUPADOR');
    } catch (err: any) {
      console.error('Error creating group and indenting concept:', err);
      alert('No se pudo agrupar el concepto.');
    }
  };

  const handleOutdentConcept = async (conceptId: string) => {
    if (!budget || !budget.conceptos) return;
    
    const currentItem = budget.conceptos.find(c => c.id === conceptId);
    if (!currentItem || !currentItem.parent_id) return;

    const parentItem = budget.conceptos.find(c => c.id === currentItem.parent_id);
    const newParentId = parentItem ? parentItem.parent_id : null;

    try {
      const { error } = await supabase
        .from('presupuesto_conceptos')
        .update({ parent_id: newParentId })
        .eq('id', currentItem.id);

      if (error) throw error;
      await fetchBudgetDetails();
    } catch (err: any) {
      console.error('Error outdenting concept:', err);
      alert('No se pudo desagrupar el concepto.');
    }
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleDeleteConcept = async (conceptId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este concepto del presupuesto?')) return;
    try {
      const { error } = await supabase
        .from('presupuesto_conceptos')
        .delete()
        .eq('id', conceptId);

      if (error) throw error;
      
      await fetchBudgetDetails();
    } catch (err: any) {
      console.error('Error deleting concept:', err);
      alert('No se pudo eliminar el concepto del presupuesto.');
    }
  };

  const handleUpdateInsumoCatalogCost = async (insumoId: string, newCost: number) => {
    try {
      const { error: dbError } = await supabase
        .from('insumos')
        .update({ cost: newCost })
        .eq('id', insumoId);
         
      if (dbError) throw dbError;
      
      setInsumosCatalog(prev => prev.map(ins => ins.id === insumoId ? { ...ins, cost: newCost } : ins));
      
      setMatrixFormInsumos(prev => prev.map(item => {
        if (item.insumo.id === insumoId) {
          return {
            ...item,
            insumo: { ...item.insumo, cost: newCost }
          };
        }
        return item;
      }));

      setNewMatrixInsumos(prev => prev.map(item => {
        if (item.insumo.id === insumoId) {
          return {
            ...item,
            insumo: { ...item.insumo, cost: newCost }
          };
        }
        return item;
      }));
      
      setMatrices(prev => prev.map(mat => {
        if (mat.insumos) {
          return {
            ...mat,
            insumos: mat.insumos.map(item => {
              if (item.insumo.id === insumoId) {
                return {
                  ...item,
                  insumo: { ...item.insumo, cost: newCost }
                };
              }
              return item;
            })
          };
        }
        return mat;
      }));
      
    } catch (err: any) {
      console.error('Error updating insumo catalog cost:', err);
      alert('No se pudo actualizar el costo del insumo en el catálogo general.');
    }
  };

  const handleOpenMatrixEditor = (matrix: Matriz, conceptQty: number = 1) => {
    setEditingMatrix(matrix);
    setMatrixFormCode(matrix.code);
    setMatrixFormDesc(matrix.description);
    setMatrixFormUnit(matrix.unit);
    setMatrixFormIndirect(matrix.indirect_percentage);
    setMatrixFormUtility(matrix.utility_percentage);
    setMatrixFormInsumos(matrix.insumos || []);
    setSelectedInsumoIdForMatrixForm('');
    setInsumoQtyForMatrixForm('1');
    setActiveConceptQty(conceptQty);
    setMatrixFormInsumoSearch('');
    setMatrixFormInsumoTypeFilter('all');
    setMatrixFormError(null);
    setMatrixFormSubmitting(false);
    setIsMatrixEditorOpen(true);
  };

  const handleAddInsumoToMatrixForm = () => {
    if (!selectedInsumoIdForMatrixForm) return;
    const insumo = insumosCatalog.find(i => i.id === selectedInsumoIdForMatrixForm);
    if (!insumo) return;

    if (matrixFormInsumos.some(item => item.insumo.id === insumo.id)) {
      alert('Este insumo ya está añadido al desglose.');
      return;
    }

    const inputVal = String(insumoQtyForMatrixForm).trim();
    const isNumeric = /^[0-9]+(\.[0-9]+)?$/.test(inputVal);
    let qty = 0;
    let formula: string | null = null;

    if (isNumeric) {
      qty = Number(inputVal);
    } else {
      formula = inputVal;
      qty = evaluateFormula(formula, activeConceptQty);
    }

    setMatrixFormInsumos(prev => [...prev, { insumo, quantity: qty, formula }]);
    setSelectedInsumoIdForMatrixForm('');
    setInsumoQtyForMatrixForm('1');
  };

  const handleRemoveInsumoFromMatrixForm = (insumoId: string) => {
    setMatrixFormInsumos(prev => prev.filter(item => item.insumo.id !== insumoId));
  };

  const handleSaveMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatrixFormError(null);

    if (!budget) {
      setMatrixFormError('El presupuesto no está cargado.');
      return;
    }
    if (!matrixFormCode.trim()) {
      setMatrixFormError('El código de la matriz es obligatorio.');
      return;
    }
    if (!matrixFormDesc.trim()) {
      setMatrixFormError('La descripción es obligatoria.');
      return;
    }
    if (!matrixFormUnit.trim()) {
      setMatrixFormError('La unidad es obligatoria.');
      return;
    }
    if (matrixFormInsumos.length === 0) {
      setMatrixFormError('Debes añadir al menos un insumo al desglose.');
      return;
    }

    setMatrixFormSubmitting(true);
    try {
      const matrixData: Partial<Matriz> = {
        id: editingMatrix?.id,
        code: matrixFormCode.trim().toUpperCase(),
        description: matrixFormDesc.trim(),
        unit: matrixFormUnit.trim(),
        indirect_percentage: 0,
        utility_percentage: 0,
        insumos: matrixFormInsumos
      };

      const saved = await saveMatriz(matrixData);
      const newDirectCost = calculateMatrixDirectCost(saved.insumos || []);

      // First, update metadata & margins for concepts that use this specific matrix
      const { data: budgetConcepts, error: fetchError } = await supabase
        .from('presupuesto_conceptos')
        .select('*')
        .eq('presupuesto_id', budget.id)
        .eq('matriz_id', saved.id);

      if (fetchError) throw fetchError;

      if (budgetConcepts && budgetConcepts.length > 0) {
        for (const concept of budgetConcepts) {
          await supabase
            .from('presupuesto_conceptos')
            .update({
              description: saved.description,
              unit: saved.unit,
              cost_price: newDirectCost,
              indirect_percentage: saved.indirect_percentage,
              utility_percentage: saved.utility_percentage
            })
            .eq('id', concept.id);
        }
      }

      // Second, perform global recalculation of snapshot cost_price for all matrix-backed concepts in the budget
      const { data: allConcepts, error: fetchAllErr } = await supabase
        .from('presupuesto_conceptos')
        .select(`
          id,
          matriz_id,
          quantity,
          matrices (
            id,
            matriz_insumos (
              quantity,
              formula,
              insumos (
                id,
                cost,
                unit
              )
            )
          )
        `)
        .eq('presupuesto_id', budget.id);

      if (!fetchAllErr && allConcepts) {
        for (const c of allConcepts) {
          const rawMatriz = Array.isArray(c.matrices) ? c.matrices[0] : c.matrices;
          if (rawMatriz) {
            const conceptQty = Number(c.quantity) || 1;
            const insList = (rawMatriz.matriz_insumos || []).map((mi: any) => {
              const ins = Array.isArray(mi.insumos) ? mi.insumos[0] : mi.insumos;
              return {
                quantity: Number(mi.quantity),
                formula: mi.formula || null,
                insumo: ins ? {
                  cost: Number(ins.cost || 0),
                  unit: String(ins.unit || '')
                } : { cost: 0, unit: '' }
              };
            });
            const newDirect = calculateMatrixDirectCost(insList as any, conceptQty);
            
            await supabase
              .from('presupuesto_conceptos')
              .update({ cost_price: newDirect })
              .eq('id', c.id);
          }
        }
      }

      setIsMatrixEditorOpen(false);
      setEditingMatrix(null);
      await fetchBudgetDetails();
    } catch (err: any) {
      console.error('Error saving matrix:', err);
      setMatrixFormError(err.message || 'Error al guardar la matriz.');
    } finally {
      setMatrixFormSubmitting(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput,
        options: {
          emailRedirectTo: window.location.href,
        }
      });
      if (error) throw error;
      setCodeSent(true);
      alert('¡Enlace de acceso enviado! Revisa tu bandeja de entrada.');
    } catch (err: any) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Error al iniciar sesión.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Toggle concept accordion
  const toggleConcept = (conceptId: string) => {
    setExpandedConcepts(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }));
  };

  // Helper currency formatting
  const formatCurrencyMXN = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `$${formatted} MXN`;
  };

  /**
   * Formats a quantity value. If the unit is "pza" (pieza), rounds to the nearest
   * integer with no decimals. Otherwise displays exactly 2 decimal places.
   */
  const formatQty = (qty: number, unit?: string, decimals = 2): string => {
    const isPza = unit?.trim().toLowerCase() === 'pza';
    if (isPza) return Math.round(qty).toString();
    return qty.toFixed(decimals);
  };

  const getStatusBadgeStyles = (status: 'borrador' | 'enviado' | 'aprobado' | 'rechazado') => {
    switch (status) {
      case 'borrador': return 'bg-gray-500/15 text-gray-400 border border-gray-500/30';
      case 'enviado': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'aprobado': return 'bg-green-500/15 text-green-400 border border-green-500/30';
      case 'rechazado': return 'bg-red-500/15 text-red-400 border border-red-500/30';
      default: return 'bg-cream/15 text-cream border border-cream/20';
    }
  };

  const getProduccionBadgeStyles = (produccion: boolean) =>
    produccion
      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      : 'bg-dark-3/60 text-cream-muted border border-dark-4';

  // ----------------------------------------------------
  // CALCULATIONS / ANALYTICS
  // ----------------------------------------------------
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
          <p className="text-xs uppercase tracking-widest text-cream-dim mt-3 font-bold">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Auth requirement guard
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center p-4 font-sans selection:bg-gold selection:text-dark-1">
        <div className="w-full max-w-md bg-dark-2 border border-dark-4 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gold/30 via-gold to-gold/30" />
          
          <div className="text-center space-y-2">
            <span className="inline-flex p-3 bg-gold/10 text-gold rounded-full border border-gold/20 mb-2">
              <ShieldCheck className="w-7 h-7" />
            </span>
            <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider">Dashboard Cotizador</h3>
            <p className="text-xs text-cream-muted leading-relaxed font-body">
              Acceso restringido para el personal máster y administrador de eSol Energías. Introduce tu correo para ingresar.
            </p>
          </div>

          <form onSubmit={handleSendMagicLink} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl text-xs flex items-start gap-2 select-none animate-[shake_0.4s_ease-in-out]">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider">Correo Electrónico</label>
              <input
                type="email"
                placeholder="usuario@esol.com.mx"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-3 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                required
                disabled={authLoading}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-gold hover:bg-gold-light disabled:opacity-50 text-dark-1 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-gold/10"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando enlace...</span>
                </>
              ) : (
                <span>Enviar enlace de acceso</span>
              )}
            </button>
          </form>

          {codeSent && (
            <p className="text-center text-[10px] text-green-400 font-mono">
              ✓ Te hemos enviado un link de acceso. Haz clic en el enlace del correo para iniciar sesión.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Admin / Master Access Guard
  if (currentUser.role !== 'admin' && currentUser.role !== 'master') {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-dark-2 border border-dark-4 p-8 rounded-3xl space-y-4 text-center shadow-2xl relative">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full border border-red-500/25 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-display font-black text-base text-cream uppercase tracking-wider">Acceso Restringido</h3>
          <p className="text-xs text-cream-muted leading-relaxed font-body">
            Tu cuenta con rol <strong className="text-gold font-mono">"{currentUser.role}"</strong> no tiene permisos de visualización ni edición en Presupuestos esol.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
              className="px-4 py-2 border border-dark-4 hover:bg-dark-3 text-xs text-cream-muted hover:text-cream rounded-xl transition-colors cursor-pointer"
            >
              Cerrar Sesión / Cambiar Cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
          <p className="text-xs uppercase tracking-widest text-cream-dim mt-3 font-bold">Cargando dashboard del presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-dark-2 border border-dark-4 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="font-display font-black text-base text-cream uppercase tracking-wide">Error al Cargar</h3>
          <p className="text-xs text-cream-muted font-body leading-relaxed">{error || 'No se pudo cargar la información del presupuesto.'}</p>
          <div className="pt-2">
            <button 
              onClick={() => window.close()}
              className="px-4 py-2 bg-dark-3 border border-dark-4 text-xs font-black uppercase tracking-wider text-gold rounded-xl hover:bg-dark-4 transition-colors cursor-pointer"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Calculations ---
  const concepts = budget.conceptos || [];
  const indirectPct = budget.indirect_percentage ?? 10.00;
  const utilityPct = budget.utility_percentage ?? 8.00;

  // Tree helper maps and recursive calculation methods
  const conceptMap = new Map<string, PresupuestoConcepto[]>();
  concepts.forEach(c => {
    if (c.parent_id) {
      if (!conceptMap.has(c.parent_id)) {
        conceptMap.set(c.parent_id, []);
      }
      conceptMap.get(c.parent_id)!.push(c);
    }
  });

  const getConceptCosts = (
    c: PresupuestoConcepto
  ): { directUnit: number; totalDirect: number } => {
    if (c.type === 'group') {
      const children = conceptMap.get(c.id) || [];
      let sumTotalDirect = 0;
      children.forEach(child => {
        const childCosts = getConceptCosts(child);
        sumTotalDirect += childCosts.totalDirect;
      });
      const qty = Number(c.quantity) || 1;
      return {
        directUnit: sumTotalDirect / qty,
        totalDirect: sumTotalDirect
      };
    } else if (c.type === 'insumo_directo') {
      const directUnit = Number(c.cost_price) || 0;
      const qty = Number(c.quantity) || 0;
      return {
        directUnit,
        totalDirect: qty * directUnit
      };
    } else {
      const qty = Number(c.quantity) || 0;
      const unitDirect = c.matriz 
        ? calculateMatrixDirectCost(c.matriz.insumos || [], qty) 
        : Number(c.cost_price);
      return {
        directUnit: unitDirect,
        totalDirect: qty * unitDirect
      };
    }
  };

  const getConceptSellingCosts = (
    c: PresupuestoConcepto
  ): { sellingUnit: number; totalSelling: number } => {
    if (c.type === 'group') {
      const children = conceptMap.get(c.id) || [];
      let sumTotalSelling = 0;
      children.forEach(child => {
        const childCosts = getConceptSellingCosts(child);
        sumTotalSelling += childCosts.totalSelling;
      });
      const qty = Number(c.quantity) || 1;
      return {
        sellingUnit: sumTotalSelling / qty,
        totalSelling: sumTotalSelling
      };
    } else if (c.type === 'insumo_directo') {
      const directUnit = Number(c.cost_price) || 0;
      const sellingUnit = calculateMatrixSellingPrice(directUnit, indirectPct, utilityPct);
      const qty = Number(c.quantity) || 0;
      return {
        sellingUnit,
        totalSelling: qty * sellingUnit
      };
    } else {
      const qty = Number(c.quantity) || 0;
      const unitDirect = c.matriz 
        ? calculateMatrixDirectCost(c.matriz.insumos || [], qty) 
        : Number(c.cost_price);
      const sellingUnit = calculateMatrixSellingPrice(unitDirect, indirectPct, utilityPct);
      return {
        sellingUnit,
        totalSelling: qty * sellingUnit
      };
    }
  };

  const rootConcepts = concepts.filter(c => !c.parent_id);

  const directCost = rootConcepts.reduce((sum, c) => {
    return sum + getConceptCosts(c).totalDirect;
  }, 0);

  const sellingPrice = rootConcepts.reduce((sum, c) => {
    return sum + getConceptSellingCosts(c).totalSelling;
  }, 0);

  // Flatten the tree for rendering
  const getFlatNodes = (flatConcepts: PresupuestoConcepto[]) => {
    const nodeMap = new Map<string, { concept: PresupuestoConcepto; children: any[] }>();
    
    flatConcepts.forEach(c => {
      nodeMap.set(c.id, { concept: c, children: [] });
    });

    const roots: any[] = [];

    flatConcepts.forEach(c => {
      const node = nodeMap.get(c.id)!;
      if (c.parent_id && nodeMap.has(c.parent_id)) {
        const parent = nodeMap.get(c.parent_id)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortAndFlatten = (nodes: any[], currentLevel: number, accumulator: any[]) => {
      nodes.sort((a, b) => (a.concept.order_index ?? 0) - (b.concept.order_index ?? 0));
      nodes.forEach(n => {
        accumulator.push({ concept: n.concept, level: currentLevel });
        const isCollapsed = collapsedGroups[n.concept.id];
        if (!isCollapsed) {
          sortAndFlatten(n.children, currentLevel + 1, accumulator);
        }
      });
    };

    const accumulator: { concept: PresupuestoConcepto; level: number }[] = [];
    sortAndFlatten(roots, 0, accumulator);
    return accumulator;
  };

  const flatConceptsList = getFlatNodes(concepts);
  const indirectCost = directCost * (indirectPct / 100);
  const subtotalWithIndirect = directCost + indirectCost;
  const utilityCost = subtotalWithIndirect * (utilityPct / 100);
  const ivaCost = sellingPrice * 0.16;
  const totalWithIva = sellingPrice + ivaCost;
  const marginVal = sellingPrice - directCost;
  const marginPct = utilityPct;

  const filteredCatalogForForm = insumosCatalog.filter(ins => {
    if (matrixFormInsumoTypeFilter !== 'all' && ins.type !== matrixFormInsumoTypeFilter) {
      return false;
    }
    if (matrixFormInsumoSearch) {
      const q = matrixFormInsumoSearch.toLowerCase();
      return ins.code.toLowerCase().includes(q) || ins.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Insumos Aggregation for sharing analytics
  const aggregatedInsumos = {
    material: 0,
    labor: 0,
    equipment: 0,
    tool: 0,
    service: 0,
    total: 0
  };

  concepts.forEach(c => {
    if (c.type === 'group') return;
    const qty = Number(c.quantity) || 0;

    if (c.type === 'insumo_directo') {
      const insumo = insumosCatalog.find(i => i.description === c.description && i.unit === c.unit);
      if (insumo) {
        const costVal = Number(c.cost_price) || insumo.cost || 0;
        const totalCost = costVal * qty;
        const type = insumo.type;
        if (type in aggregatedInsumos) {
          aggregatedInsumos[type as keyof typeof aggregatedInsumos] += totalCost;
          aggregatedInsumos.total += totalCost;
        }
      }
    } else {
      const matrix = c.matriz;
      if (matrix && matrix.insumos) {
        matrix.insumos.forEach(item => {
          const costVal = Number(item.insumo.cost) || 0;
          const matrixQty = item.formula 
            ? evaluateFormula(item.formula, qty) 
            : Number(item.quantity) || 0;
          const isPza = item.insumo.unit?.trim().toLowerCase() === 'pza';
          const finalQty = isPza ? Math.round(matrixQty * qty) : (matrixQty * qty);
          const totalCost = costVal * finalQty;
          
          const type = item.insumo.type;
          if (type in aggregatedInsumos) {
            aggregatedInsumos[type as keyof typeof aggregatedInsumos] += totalCost;
            aggregatedInsumos.total += totalCost;
          }
        });
      }
    }
  });

  return (
    <div className="min-h-screen bg-dark-1 text-cream font-sans p-6 space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-dark-2 border border-dark-4 p-5 rounded-2xl shadow-md select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gold/10 text-gold rounded-lg border border-gold/20">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="font-display font-black text-lg text-cream uppercase tracking-wide">
              DASHBOARD DE PRESUPUESTO
            </h1>
          </div>
          <p className="text-xs text-cream-muted leading-relaxed font-body">
            Cliente: <strong className="text-cream">{budget.client_name}</strong> &bull; Nombre: <strong className="text-cream">{budget.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status selector */}
          <div className="flex items-center gap-2 bg-dark-1 border border-dark-4 p-1.5 rounded-xl">
            <span className="text-[9px] font-black uppercase tracking-widest text-cream-muted pl-2">Estado:</span>
            <select
              value={budget.status}
              disabled={updatingStatus}
              onChange={(e) => handleUpdateStatus(e.target.value as any)}
              className="bg-transparent text-xs text-cream outline-none border-none pr-6 cursor-pointer font-bold uppercase tracking-wider"
            >
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
            {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-gold mr-1.5" />}
          </div>

          {/* Produccion toggle */}
          <button
            onClick={handleToggleProduccion}
            disabled={updatingStatus}
            title={budget.produccion ? 'Quitar de Producci\u00f3n' : 'Marcar en Producci\u00f3n'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${
              budget.produccion
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                : 'bg-dark-1 border-dark-4 text-cream-muted hover:border-cream/20 hover:text-cream'
            }`}
          >
            <span className={`inline-block w-3 h-3 rounded-full border-2 transition-colors ${
              budget.produccion ? 'bg-amber-400 border-amber-400' : 'bg-dark-3 border-dark-4'
            }`} />
            <span>Producción</span>
          </button>

          <button
            onClick={() => window.close()}
            className="px-4 py-2.5 bg-dark-3 border border-dark-4 hover:border-cream/20 text-cream-muted hover:text-cream text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Costo Directo Consolidado */}
        <div className="bg-dark-2/60 border border-dark-4 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden group hover:border-gold/20 transition-all select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-cream-muted">Costo Directo Consolidado</span>
            <span className="p-2 bg-dark-1/80 border border-dark-4 rounded-xl text-cream group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-bold tracking-wide select-all text-cream">{formatCurrencyMXN(directCost)}</p>
        </div>

        {/* Card 2: INDIRECTOS (Editable) */}
        <div className="bg-dark-2/60 border border-dark-4 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden group hover:border-gold/20 transition-all select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-cream-muted">INDIRECTOS (%)</span>
            <span className="p-2 bg-dark-1/80 border border-dark-4 rounded-xl text-cream group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <NumericInput
                step="0.1"
                min="0.0"
                value={indirectPct}
                onChange={async (val) => {
                  await handleUpdateBudgetMargins(val, utilityPct);
                }}
                className="w-20 px-2 py-1 bg-dark-1 border border-dark-4 text-cream font-mono font-bold rounded focus:outline-none focus:border-gold/50 text-sm text-right"
              />
              <span className="text-xs text-cream-muted font-bold font-mono">%</span>
            </div>
            <span className="text-[10px] font-mono text-cream-dim">
              Valor: {formatCurrencyMXN(indirectCost)}
            </span>
          </div>
        </div>

        {/* Card 3: UTILIDAD % (Editable) */}
        <div className="bg-dark-2/60 border border-dark-4 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden group hover:border-gold/20 transition-all select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-cream-muted">UTILIDAD %</span>
            <span className="p-2 bg-dark-1/80 border border-dark-4 rounded-xl text-cream group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <NumericInput
                step="0.1"
                min="0.0"
                value={utilityPct}
                onChange={async (val) => {
                  await handleUpdateBudgetMargins(indirectPct, val);
                }}
                className="w-20 px-2 py-1 bg-dark-1 border border-dark-4 text-cream font-mono font-bold rounded focus:outline-none focus:border-gold/50 text-sm text-right"
              />
              <span className="text-xs text-cream-muted font-bold font-mono">%</span>
            </div>
            <span className="text-[10px] font-mono text-cream-dim">
              Valor: {formatCurrencyMXN(utilityCost)}
            </span>
          </div>
        </div>

        {/* Card 4: Precio de Venta Sugerido */}
        <div className="bg-dark-2/60 border border-dark-4 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden group hover:border-gold/20 transition-all select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-cream-muted">Precio de Venta Sugerido</span>
            <span className="p-2 bg-dark-1/80 border border-dark-4 rounded-xl text-gold group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-bold tracking-wide select-all text-gold">{formatCurrencyMXN(totalWithIva)}</p>
        </div>

        {/* Card 5: Margen Estimado */}
        <div className="bg-dark-2/60 border border-dark-4 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden group hover:border-gold/20 transition-all select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-cream-muted">Margen Estimado</span>
            <span className="p-2 bg-dark-1/80 border border-dark-4 rounded-xl text-green-400 group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-bold tracking-wide select-all text-green-400">{formatCurrencyMXN(marginVal)}</p>
        </div>

      </div>

      {/* 3. Main Dashboard Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Concept List Breakdown (Accordion) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-dark-2/40 border border-dark-4 p-4 rounded-2xl flex justify-between items-center select-none">
            <h2 className="font-display font-black text-xs uppercase tracking-wider text-cream flex items-center gap-1.5 font-sans">
              <Layers2 className="w-4 h-4 text-gold" />
              Desglose de Conceptos de Obra ({concepts.length})
            </h2>
            <span className="text-[10px] font-mono text-cream-muted">Haz clic en un concepto para expandir su APU</span>
          </div>

          {concepts.length === 0 ? (
            <div className="border border-dashed border-dark-4 p-12 text-center rounded-2xl select-none text-cream-muted text-xs font-body flex flex-col items-center justify-center gap-3 bg-dark-2/20">
              <span>No hay conceptos añadidos en este presupuesto.</span>
              <button
                type="button"
                onClick={handleOpenAddConceptModal}
                className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-gold/5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nuevo concepto</span>
              </button>
            </div>
          ) : (
            <div className="bg-dark-2/40 border border-dark-4 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-dark-4 bg-dark-2/80 text-cream-dim select-none text-[9px] uppercase tracking-wider font-bold">
                      <th className="py-3 px-4 text-center w-28 select-none">Orden / Nivel</th>
                      <th className="py-3 px-4 w-32">Código</th>
                      <th className="py-3 px-4 text-center w-24">Tipo</th>
                      <th className="py-3 px-4">Descripción / Insumo</th>
                      <th className="py-3 px-4 text-center w-16">Unidad</th>
                      <th className="py-3 px-4 text-right w-28">CANTIDAD</th>
                      <th className="py-3 px-4 text-right w-36">Costo Unit.</th>
                      <th className="py-3 px-4 text-right w-36">Importe Tot.</th>
                      <th className="py-3 px-4 text-center w-24 select-none">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-4/50">
                    {flatConceptsList.map(({ concept: c, level }) => {
                      const costs = getConceptCosts(c);
                      const unitDirect = costs.directUnit;
                      const totalDirect = costs.totalDirect;

                      // Sibling indices for moving up/down
                      const siblings = concepts.filter(sib => sib.parent_id === c.parent_id);
                      siblings.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
                      const sibIndex = siblings.findIndex(sib => sib.id === c.id);
                      const isFirstSibling = sibIndex === 0;
                      const isLastSibling = sibIndex === siblings.length - 1;

                      const isGroup = c.type === 'group';
                      const flatIndex = flatConceptsList.findIndex(fc => fc.concept.id === c.id);

                      return (
                        <tr 
                          key={c.id}
                          className={`select-none transition-colors font-bold ${
                            isGroup 
                              ? 'bg-dark-3/60 hover:bg-dark-3/80 border-l-4 border-l-gold text-cream-dim' 
                              : 'bg-dark-2/20 hover:bg-dark-3/20 text-cream'
                          }`}
                        >
                          {/* Sibling movement and level adjustment arrows */}
                          <td className="py-3 px-4 text-center select-none w-28">
                            <div className="flex items-center justify-center gap-0.5">
                              {/* Left Arrow (Desagrupar) */}
                              <button
                                type="button"
                                disabled={!c.parent_id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOutdentConcept(c.id);
                                }}
                                className="p-1 hover:text-gold text-cream-muted disabled:opacity-20 disabled:hover:text-cream-muted transition-colors cursor-pointer"
                                title="Desagrupar (Mover a la izquierda)"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>

                              {/* Up Arrow */}
                              <button
                                type="button"
                                disabled={isFirstSibling}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveConcept(c.id, -1);
                                }}
                                className="p-1 hover:text-gold text-cream-muted disabled:opacity-20 disabled:hover:text-cream-muted transition-colors cursor-pointer"
                                title="Mover arriba"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>

                              {/* Down Arrow */}
                              <button
                                type="button"
                                disabled={isLastSibling}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveConcept(c.id, 1);
                                }}
                                className="p-1 hover:text-gold text-cream-muted disabled:opacity-20 disabled:hover:text-cream-muted transition-colors cursor-pointer"
                                title="Mover abajo"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              {/* Right Arrow (Agrupar) */}
                              <button
                                type="button"
                                disabled={flatIndex === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIndentConcept(c.id);
                                }}
                                className="p-1 hover:text-gold text-cream-muted disabled:opacity-20 disabled:hover:text-cream-muted transition-colors cursor-pointer"
                                title="Agrupar (Mover a la derecha)"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-[10px] text-gold/90 font-bold select-all">
                            {isGroup ? 'AGRUPADOR' : (c.matriz?.code || 'INSUMO')}
                          </td>
                          <td className="py-3 px-4 text-center select-none">
                            {isGroup ? (
                              <span className="inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-gold/25 text-gold border border-gold/45">
                                GRUPO
                              </span>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider ${
                                c.type === 'insumo_directo' 
                                  ? 'bg-cream/10 text-cream-muted border border-cream/20' 
                                  : 'bg-gold/10 text-gold border border-gold/20'
                              }`}>
                                {c.type === 'insumo_directo' ? 'INSUMO' : 'MATRIZ'}
                              </span>
                            )}
                          </td>
                          <td 
                            className="py-3 px-4 leading-relaxed font-sans text-xs"
                            style={{ paddingLeft: `${16 + level * 20}px` }}
                          >
                            <div className="flex items-center gap-1">
                              {level > 0 && <span className="text-gold/40 select-none font-mono">└─</span>}
                              
                              {/* Toggle expand/collapse button for groups */}
                              {isGroup ? (
                                <button
                                  type="button"
                                  onClick={() => toggleGroupCollapse(c.id)}
                                  className="p-1 hover:bg-dark-3 rounded text-cream-muted hover:text-cream transition-colors cursor-pointer flex-shrink-0"
                                >
                                  {collapsedGroups[c.id] ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-gold" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gold" />
                                  )}
                                </button>
                              ) : null}

                              {isGroup ? (
                                <Folder className="w-3.5 h-3.5 text-gold/90 flex-shrink-0" />
                              ) : null}
                              {editingDescriptionConceptId === c.id ? (
                                <input
                                  type="text"
                                  value={editingDescriptionValue}
                                  onChange={(e) => setEditingDescriptionValue(e.target.value)}
                                  onBlur={() => handleSaveConceptDescription(c.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveConceptDescription(c.id);
                                    if (e.key === 'Escape') setEditingDescriptionConceptId(null);
                                  }}
                                  className="bg-dark-1 border border-gold/45 text-cream text-xs rounded px-2 py-0.5 w-72 focus:outline-none font-sans font-bold"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span 
                                  className={`${isGroup ? 'font-black text-cream hover:underline cursor-pointer' : 'hover:underline cursor-pointer'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingDescriptionConceptId(c.id);
                                    setEditingDescriptionValue(c.description);
                                  }}
                                  title="Haga clic para editar la descripción"
                                >
                                  {c.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-cream-muted select-none">{isGroup ? 'grp' : c.unit}</td>
                          <td className="py-3 px-4 text-right font-mono select-none">
                            <NumericInput
                              step={c.unit?.trim().toLowerCase() === 'pza' ? "1" : "0.01"}
                              min="1"
                              value={Number(c.quantity)}
                              onChange={async (val) => {
                                const isPza = c.unit?.trim().toLowerCase() === 'pza';
                                const finalVal = (isPza || isGroup) ? Math.max(1, Math.round(val)) : val;
                                await handleUpdateConceptQuantity(c.id, finalVal);
                              }}
                              className="w-20 px-1 py-0.5 bg-dark-1/80 border border-dark-4 focus:border-gold/40 text-cream rounded font-mono text-right focus:outline-none text-[11px]"
                            />
                          </td>
                          <td 
                            className={`py-3 px-4 text-right font-mono select-all ${
                              (!isGroup && c.matriz) 
                                ? 'text-cream cursor-pointer hover:text-gold hover:underline transition-colors' 
                                : 'text-cream-dim'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isGroup && c.matriz) {
                                handleOpenMatrixEditor(c.matriz, Number(c.quantity) || 1);
                              }
                            }}
                            title={(!isGroup && c.matriz) ? "Haga clic para editar la matriz de costos completa" : undefined}
                          >
                            {formatCurrencyMXN(unitDirect)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gold select-all">
                            {formatCurrencyMXN(totalDirect)}
                          </td>
                          <td className="py-3 px-4 text-center select-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConcept(c.id);
                              }}
                              className="p-1 hover:text-red-400 text-cream-muted hover:bg-red-500/10 rounded transition-colors cursor-pointer animate-pulse-subtle"
                              title="Eliminar concepto"
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

              {/* Master Table Button Nuevo concepto */}
              <div className="p-4 bg-dark-2/40 border-t border-dark-4 flex justify-start select-none">
                <button
                  type="button"
                  onClick={handleOpenAddConceptModal}
                  className="px-4 py-2.5 bg-dark-3 border border-dark-4 hover:border-gold/30 text-gold hover:bg-dark-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-gold/5 hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4 text-gold stroke-[2.5]" />
                  <span>Nuevo concepto</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Analytics & Metadata Summary */}
        <div className="space-y-6">
          
          {/* Categoría Share Analytics card */}
          <div className="bg-dark-2/60 border border-dark-4 p-5 rounded-2xl space-y-4 shadow-sm select-none">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-cream flex items-center gap-1.5 font-sans">
              <Package className="w-4 h-4 text-gold" />
              Explosión Analítica de Costos
            </h3>
            <p className="text-[10px] text-cream-muted font-body leading-relaxed">
              Distribución total consolidada del costo directo acumulado por categoría de insumo.
            </p>

            <div className="space-y-3.5 pt-2">
              {([
                { key: 'material',  label: 'Materiales',   colorBg: 'bg-blue-500/15', colorFill: 'bg-blue-400', border: 'border-blue-500/20', text: 'text-blue-400' },
                { key: 'labor',     label: 'Mano de Obra', colorBg: 'bg-green-500/15', colorFill: 'bg-green-400', border: 'border-green-500/20', text: 'text-green-400' },
                { key: 'equipment', label: 'Equipos',      colorBg: 'bg-amber-500/15', colorFill: 'bg-amber-400', border: 'border-amber-500/20', text: 'text-amber-400' },
                { key: 'tool',      label: 'Herramientas', colorBg: 'bg-purple-500/15', colorFill: 'bg-purple-400', border: 'border-purple-500/20', text: 'text-purple-400' },
                { key: 'service',   label: 'Trámites',     colorBg: 'bg-rose-500/15', colorFill: 'bg-rose-400', border: 'border-rose-500/20', text: 'text-rose-400' }
              ] as const).map(cat => {
                const cost = aggregatedInsumos[cat.key];
                const pct = aggregatedInsumos.total > 0 ? (cost / aggregatedInsumos.total) * 100 : 0;

                return (
                  <div key={cat.key} className="space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between items-center text-cream-dim">
                      <span className="font-bold">{cat.label}</span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                    {/* Visual bar progress */}
                    <div className="h-2 w-full bg-dark-1 rounded-full overflow-hidden border border-dark-4/40">
                      <div className={`h-full ${cat.colorFill} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-cream-muted pt-0.5">
                      <span>Importe:</span>
                      <span className="font-bold text-cream">{formatCurrencyMXN(cost)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-dark-4 pt-3 mt-4 space-y-2 font-mono text-[10px] text-cream font-bold">
              <div className="flex justify-between items-center text-cream-dim font-medium">
                <span>Costo Directo Total:</span>
                <span>{formatCurrencyMXN(directCost)}</span>
              </div>
              <div className="flex justify-between items-center text-cream-dim font-medium">
                <span>Indirectos ({indirectPct.toFixed(1)}%):</span>
                <span>{formatCurrencyMXN(indirectCost)}</span>
              </div>
              <div className="flex justify-between items-center text-cream-dim font-medium">
                <span>Utilidad ({utilityPct.toFixed(1)}%):</span>
                <span>{formatCurrencyMXN(utilityCost)}</span>
              </div>
              <div className="flex justify-between items-center text-cream font-black border-t border-dark-4/30 pt-2">
                <span>Subtotal:</span>
                <span>{formatCurrencyMXN(sellingPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-cream-dim font-medium">
                <span>IVA (16.0%):</span>
                <span>{formatCurrencyMXN(ivaCost)}</span>
              </div>
              <div className="flex justify-between items-center text-gold font-black border-t border-dark-4/50 pt-2 text-xs">
                <span>Precio de Venta Sugerido:</span>
                <span>{formatCurrencyMXN(totalWithIva)}</span>
              </div>
            </div>
          </div>

          {/* Budget metadata card */}
          <div className="bg-dark-2/60 border border-dark-4 p-5 rounded-2xl space-y-4 shadow-sm select-none font-mono text-[10px]">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-cream flex items-center gap-1.5 font-sans">
              <FileText className="w-4 h-4 text-gold" />
              Metadatos del Presupuesto
            </h3>
            
            <div className="divide-y divide-dark-4 space-y-2.5">
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-cream-dim">ID del Presupuesto</span>
                <span className="text-gold font-bold select-all" title={`UUID: ${budget.id}`}>
                  {`PS${String(budgetNumber).padStart(4, '0')}${getInitials(budget.name)}`}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-cream-dim">Fecha de Creación</span>
                <span className="text-cream">{budget.created_at ? new Date(budget.created_at).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-cream-dim">Última Modificación</span>
                <span className="text-cream">{budget.updated_at ? new Date(budget.updated_at).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-cream-dim">Creado por</span>
                <span className="text-cream">eSol APU Portal</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4.5 NESTED ADD CONCEPT CREATOR SUB-MODAL */}
      {isAddConceptModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] font-sans">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.25s_ease-out]">
            
            {/* Sub-modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4 bg-dark-2 flex-shrink-0 select-none">
              <h4 className="font-display font-black text-sm text-cream uppercase tracking-wider flex items-center gap-1.5 font-sans">
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
            <div className="flex bg-dark-1 border-b border-dark-4 p-1.5 gap-1 select-none flex-shrink-0 text-[10px] font-black uppercase tracking-wider font-sans">
              {([
                { key: 'apu', label: 'Usar Plantilla APU' },
                { key: 'use_insumo', label: 'Usar Insumo' },
                { key: 'group_insumos', label: 'Grupo de Insumos' },
                { key: 'create_group', label: 'Crear Agrupador' },
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
                      const sellingPrice = calculateMatrixSellingPrice(directCost, indirectPct, utilityPct);
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
                      disabled={!selectedMatrixId || subModalSubmitting}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5 flex items-center gap-1.5"
                    >
                      {subModalSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando concepto...</span>
                        </>
                      ) : (
                        <span>Añadir al Presupuesto</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Use Catalog Insumo directly */}
              {addConceptTab === 'use_insumo' && (
                <div className="space-y-4 font-sans">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Seleccionar Insumo del Catálogo</label>
                    <select
                      value={selectedInsumoId}
                      onChange={(e) => setSelectedInsumoId(e.target.value)}
                      className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none cursor-pointer font-mono"
                    >
                      <option value="">-- Elige un Insumo --</option>
                      {insumosCatalog.map(ins => (
                        <option key={ins.id} value={ins.id}>
                          [{ins.code}] {ins.description} ({ins.unit}) - {formatCurrencyMXN(ins.cost)}
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
                    {selectedInsumoId && (() => {
                      const ins = insumosCatalog.find(i => i.id === selectedInsumoId);
                      if (!ins) return null;
                      return (
                        <div className="space-y-1 bg-dark-1/50 border border-dark-4 p-3 rounded-xl font-mono text-[10px] select-none">
                          <span className="text-cream-dim block uppercase text-[8px] font-black tracking-widest">Información Insumo</span>
                          <span className="text-cream block">Costo Directo Unit: {formatCurrencyMXN(ins.cost)}</span>
                          <span className="text-cream-muted block">Unidad: {ins.unit}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Indirecto (%)</label>
                      <NumericInput
                        step="0.1"
                        min="0"
                        value={customIndirect}
                        onChange={setCustomIndirect}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Utilidad (%)</label>
                      <NumericInput
                        step="0.1"
                        min="0"
                        value={customUtility}
                        onChange={setCustomUtility}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {selectedInsumoId && (() => {
                    const ins = insumosCatalog.find(i => i.id === selectedInsumoId);
                    if (!ins) return null;
                    const directCost = ins.cost;
                    const sellingPrice = calculateMatrixSellingPrice(directCost, customIndirect, customUtility);
                    const totalDirect = directCost * customQty;
                    const totalSelling = sellingPrice * customQty;
                    return (
                      <div className="bg-dark-1/50 border border-dark-4 p-4 rounded-xl font-mono text-xs select-none space-y-1">
                        <span className="text-cream-dim block uppercase text-[8px] font-black tracking-widest mb-1">Cálculo de Precios</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-cream-muted block">Directo Unit: {formatCurrencyMXN(directCost)}</span>
                            <span className="text-cream-muted block">Venta Unit: {formatCurrencyMXN(sellingPrice)}</span>
                          </div>
                          <div>
                            <span className="text-cream block font-bold">Total Directo: {formatCurrencyMXN(totalDirect)}</span>
                            <span className="text-gold block font-black">Total Venta: {formatCurrencyMXN(totalSelling)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddInsumoAsConcept}
                      disabled={!selectedInsumoId || subModalSubmitting}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5 flex items-center gap-1.5"
                    >
                      {subModalSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando concepto...</span>
                        </>
                      ) : (
                        <span>Añadir al Presupuesto</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Grupo de Insumos */}
              {addConceptTab === 'group_insumos' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Nombre del Grupo</label>
                      <input
                        type="text"
                        placeholder="Ej. Kit de Fijación Estructura..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Unidad</label>
                        <input
                          type="text"
                          value={groupUnit}
                          onChange={(e) => setGroupUnit(e.target.value)}
                          className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Cantidad</label>
                        <NumericInput
                          step="1"
                          min="1"
                          value={groupQty}
                          onChange={setGroupQty}
                          className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  {/* Add Insumos to Group Builder */}
                  <div className="border border-dark-4 p-4 rounded-xl bg-dark-1/30 space-y-3">
                    <span className="text-[9px] uppercase tracking-wider font-black text-gold block">Añadir Insumos al Grupo</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select
                        value={selectedInsumoIdForGroup}
                        onChange={(e) => setSelectedInsumoIdForGroup(e.target.value)}
                        className="p-2.5 bg-dark-1 border border-dark-4 text-xs text-cream rounded-xl focus:outline-none md:col-span-2 cursor-pointer"
                      >
                        <option value="">Selecciona un insumo...</option>
                        {insumosCatalog.map(ins => (
                          <option key={ins.id} value={ins.id}>
                            [{ins.code}] {ins.description} ({formatCurrencyMXN(ins.cost)}/{ins.unit})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <NumericInput
                          step="0.0001"
                          min="0.0001"
                          value={insumoQtyForGroup}
                          onChange={setInsumoQtyForGroup}
                          className="w-24 p-2.5 bg-dark-1 border border-dark-4 text-xs text-cream rounded-xl focus:outline-none text-right font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAddInsumoToGroup}
                          className="flex-1 bg-dark-3 border border-dark-4 hover:border-gold/30 hover:text-gold text-cream text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>

                    {/* Temporary Insumos List */}
                    {groupInsumos.length > 0 && (
                      <div className="border border-dark-4 rounded-xl overflow-hidden bg-dark-2/40 max-h-[150px] overflow-y-auto mt-2">
                        <table className="w-full text-left text-[11px] font-sans border-collapse">
                          <thead>
                            <tr className="bg-dark-1/80 text-cream-muted uppercase font-bold text-[8px] tracking-wider border-b border-dark-4 select-none">
                              <th className="py-2 px-3">Código</th>
                              <th className="py-2 px-3">Descripción</th>
                              <th className="py-2 px-3 text-right">Cantidad</th>
                              <th className="py-2 px-3 text-right">Costo</th>
                              <th className="py-2 px-3 text-right">Importe</th>
                              <th className="py-2 px-3 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-4/50">
                            {groupInsumos.map(item => {
                              const totalCost = item.quantity * item.insumo.cost;
                              return (
                                <tr key={item.insumo.id} className="text-cream">
                                  <td className="py-1.5 px-3 font-mono text-[9px] text-gold/90">{item.insumo.code}</td>
                                  <td className="py-1.5 px-3 leading-tight">{item.insumo.description}</td>
                                  <td className="py-1.5 px-3 text-right font-mono">{item.quantity}</td>
                                  <td className="py-1.5 px-3 text-right font-mono">{formatCurrencyMXN(item.insumo.cost)}</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-gold">{formatCurrencyMXN(totalCost)}</td>
                                  <td className="py-1.5 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveInsumoFromGroup(item.insumo.id)}
                                      className="p-1 hover:text-red-400 text-cream-muted transition-colors cursor-pointer"
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
                    )}
                  </div>

                  {/* Calculations Preview Summary */}
                  {groupInsumos.length > 0 && (
                    <div className="bg-dark-1/50 border border-dark-4 p-3 rounded-xl font-mono text-[10px] grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-cream-muted uppercase text-[8px] font-black tracking-widest block">Costo Directo Grupo</span>
                        <span className="text-cream font-bold text-xs">
                          {formatCurrencyMXN(groupInsumos.reduce((sum, item) => sum + item.quantity * item.insumo.cost, 0))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-cream-muted uppercase text-[8px] font-black tracking-widest block">Precio de Venta Sugerido (Total)</span>
                        <span className="text-gold font-bold text-xs">
                          {formatCurrencyMXN(
                            calculateMatrixSellingPrice(
                              groupInsumos.reduce((sum, item) => sum + item.quantity * item.insumo.cost, 0),
                              customIndirect,
                              customUtility
                            ) * groupQty
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateAndAddGroupOfInsumos}
                      disabled={subModalSubmitting}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5 flex items-center gap-1.5"
                    >
                      {subModalSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando grupo...</span>
                        </>
                      ) : (
                        <span>Añadir Grupo al Presupuesto</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Crear Agrupador */}
              {addConceptTab === 'create_group' && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Nombre del Agrupador (Dependencia/Subdependencia)</label>
                    <input
                      type="text"
                      placeholder="Ej. Instalaciones Eléctricas, Obra Civil..."
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Unidad</label>
                      <input
                        type="text"
                        placeholder="Ej. grp, pza, lote"
                        value={groupUnit}
                        onChange={(e) => setGroupUnit(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Dependencia Padre (Opcional)</label>
                      <select
                        value={selectedMatrixId}
                        onChange={(e) => setSelectedMatrixId(e.target.value)}
                        className="w-full p-2.5 bg-dark-1 border border-dark-4 text-xs text-cream rounded-xl focus:outline-none cursor-pointer"
                      >
                        <option value="">Ninguno (Raíz / Dependencia Principal)</option>
                        {concepts
                          .filter(c => c.type === 'group')
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.description}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateAgrupador}
                      disabled={subModalSubmitting}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5 flex items-center gap-1.5"
                    >
                      {subModalSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creando agrupador...</span>
                        </>
                      ) : (
                        <span>Crear Agrupador</span>
                      )}
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-1">
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
                              <th className="py-1.5 px-2 text-right">
                                <span className="inline-flex items-center gap-1 justify-end w-full">
                                  <span>Rend. / Fórmula</span>
                                  <button
                                    type="button"
                                    onClick={() => setIsFormulaHelpOpen(true)}
                                    className="text-cream-dim hover:text-gold transition-colors focus:outline-none cursor-pointer"
                                    title="Ver guía de fórmulas paramétricas"
                                  >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              </th>
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
                                  <td className="py-1.5 px-2 text-right font-mono select-all">{parseFloat(item.quantity.toFixed(4)).toString()}</td>
                                  <td className="py-1.5 px-2 text-right font-mono select-none">
                                    <CurrencyEditCell
                                      value={item.insumo.cost}
                                      onChange={async (val) => {
                                        await handleUpdateInsumoCatalogCost(item.insumo.id, val);
                                      }}
                                    />
                                  </td>
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
                      const indPct = budget?.indirect_percentage ?? 10.00;
                      const utPct = budget?.utility_percentage ?? 8.00;
                      const sale = calculateMatrixSellingPrice(direct, indPct, utPct);
                      return (
                        <div className="font-mono text-[9.5px] text-cream-dim">
                          <span>Directo: {formatCurrencyMXN(direct)} &bull; </span>
                          <span className="text-gold font-bold">Venta Sugerido: {formatCurrencyMXN(sale)}</span>
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

      {/* 4.6 STANDALONE MATRIX DETAILS EDITOR MODAL */}
      {isMatrixEditorOpen && editingMatrix && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out] font-sans">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.25s_ease-out]">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-dark-4 bg-dark-2 flex-shrink-0 select-none">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold text-gold px-2 py-0.5 bg-gold/10 border border-gold/25 rounded-md">
                  {matrixFormCode}
                </span>
                <h4 className="font-display font-black text-sm text-cream uppercase tracking-wider block">
                  Editar Matriz de Costos (APU)
                </h4>
              </div>
              <button 
                onClick={() => { setIsMatrixEditorOpen(false); setEditingMatrix(null); }}
                className="p-1 hover:bg-dark-3 rounded-lg text-cream-muted hover:text-cream transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveMatrix} className="flex-1 overflow-y-auto p-6 min-h-0 space-y-4">
              {matrixFormError && (
                <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl text-xs flex items-start gap-2 select-none animate-[shake_0.4s_ease-in-out]">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{matrixFormError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Descripción Matriz</label>
                <input
                  type="text"
                  placeholder="Ej. Suministro e instalación..."
                  value={matrixFormDesc}
                  onChange={(e) => setMatrixFormDesc(e.target.value)}
                  className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Unidad</label>
                  <input
                    type="text"
                    placeholder="pza, m"
                    value={matrixFormUnit}
                    onChange={(e) => setMatrixFormUnit(e.target.value)}
                    className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* Insumos list builder */}
              <div className="border border-dark-4 p-4 rounded-xl space-y-3 bg-dark-1/30">
                <span className="text-[9px] font-black uppercase tracking-widest text-gold block select-none">Desglose de Insumos</span>
                
                {/* Category Filter tabs inside the matrix form */}
                <div className="flex flex-wrap gap-1 border-b border-dark-4 pb-2 select-none">
                  {([
                    { value: 'all',      label: 'Todos' },
                    { value: 'material',  label: 'Materiales' },
                    { value: 'labor',     label: 'Mano de Obra' },
                    { value: 'equipment', label: 'Equipos' },
                    { value: 'tool',      label: 'Herramientas' },
                    { value: 'service',   label: 'Trámites' }
                  ] as const).map(tab => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => {
                        setMatrixFormInsumoTypeFilter(tab.value);
                        setSelectedInsumoIdForMatrixForm('');
                      }}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                        matrixFormInsumoTypeFilter === tab.value
                          ? 'bg-gold/10 text-gold border-gold/30 shadow-md'
                          : 'bg-dark-1 border-dark-4 hover:border-cream/20 text-cream-muted hover:text-cream'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 select-none">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8.5px] text-cream-muted uppercase font-bold block">Buscar Insumo</label>
                    <input
                      type="text"
                      placeholder="Filtrar por código o descripción..."
                      value={matrixFormInsumoSearch}
                      onChange={(e) => {
                        setMatrixFormInsumoSearch(e.target.value);
                        setSelectedInsumoIdForMatrixForm('');
                      }}
                      className="w-full p-2 bg-dark-1 border border-dark-4 text-xs text-cream rounded-lg focus:outline-none focus:border-gold/50"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="text-[8.5px] text-cream-muted uppercase font-bold block">Seleccionar Insumo ({filteredCatalogForForm.length})</label>
                    <select
                      value={selectedInsumoIdForMatrixForm}
                      onChange={(e) => setSelectedInsumoIdForMatrixForm(e.target.value)}
                      className="w-full p-2 bg-dark-1 border border-dark-4 text-xs text-cream rounded-lg focus:outline-none font-mono cursor-pointer"
                    >
                      <option value="">-- Elige un Insumo --</option>
                      {filteredCatalogForForm.map(ins => (
                        <option key={ins.id} value={ins.id}>
                          [{ins.code}] ({ins.type === 'service' ? 'Trámite' : ins.type}) {ins.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28 space-y-1">
                    <label className="text-[8.5px] text-cream-muted uppercase font-bold block">Cant. / Rend. / Fórmula</label>
                    <input
                      type="text"
                      placeholder="Ej. 0.25 o Q * 0.1"
                      value={insumoQtyForMatrixForm}
                      onChange={(e) => setInsumoQtyForMatrixForm(e.target.value)}
                      className="w-full p-2 bg-dark-1 border border-dark-4 text-xs text-cream rounded-lg text-right font-mono focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddInsumoToMatrixForm}
                    disabled={!selectedInsumoIdForMatrixForm}
                    className="px-3 py-2 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 font-black text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>

                {/* Insumos breakdown table */}
                {matrixFormInsumos.length > 0 ? (
                  <div className="border border-dark-4 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[11px] border-collapse bg-dark-2/40">
                      <thead>
                        <tr className="border-b border-dark-4 bg-dark-2 select-none text-[8.5px] uppercase text-cream-dim">
                          <th className="py-1.5 px-2">Código</th>
                          <th className="py-1.5 px-2">Insumo</th>
                          <th className="py-1.5 px-2 text-right">
                            <span className="inline-flex items-center gap-1 justify-end w-full">
                              <span>Rend. / Fórmula</span>
                              <button
                                type="button"
                                onClick={() => setIsFormulaHelpOpen(true)}
                                className="text-cream-dim hover:text-gold transition-colors focus:outline-none cursor-pointer"
                                title="Ver guía de fórmulas paramétricas"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          </th>
                          <th className="py-1.5 px-2 text-right">Costo U.</th>
                          <th className="py-1.5 px-2 text-right">Importe</th>
                          <th className="py-1.5 px-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4 font-body">
                        {matrixFormInsumos.map((item, idx) => {
                          const isPza = item.insumo.unit?.trim().toLowerCase() === 'pza';
                          const qty = item.formula 
                            ? evaluateFormula(item.formula, activeConceptQty) 
                            : Number(item.quantity) || 0;
                          const finalQty = isPza ? Math.round(qty * activeConceptQty) / activeConceptQty : qty;
                          const importe = item.insumo.cost * finalQty;
                          return (
                            <tr key={idx} className="hover:bg-dark-1/25 transition-colors">
                              <td className="py-1.5 px-2 font-mono font-bold text-gold/80 select-all">{item.insumo.code}</td>
                              <td className="py-1.5 px-2 text-cream truncate max-w-[180px]">{item.insumo.description}</td>
                              <td className="py-1.5 px-2 text-right font-mono select-none">
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  value={item.formula || String(item.quantity)}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const trimmed = val.trim();
                                    const isNumeric = /^[0-9]+(\.[0-9]+)?$/.test(trimmed);
                                    setMatrixFormInsumos(prev => prev.map((it, i) => {
                                      if (i === idx) {
                                        if (isNumeric) {
                                          return { ...it, quantity: Number(trimmed), formula: null };
                                        } else {
                                          const evalQty = evaluateFormula(trimmed, activeConceptQty);
                                          return { ...it, quantity: evalQty, formula: trimmed || null };
                                        }
                                      }
                                      return it;
                                    }));
                                  }}
                                  className="w-24 px-1 py-0.5 bg-dark-1 border border-dark-4 text-right text-cream font-mono rounded text-[10px] focus:outline-none focus:border-gold/40"
                                />
                                {item.formula && (
                                  <span className="block text-[8px] text-cream-dim text-right font-mono mt-0.5">
                                    Res: {parseFloat(qty.toFixed(4))} {item.insumo.unit} {isPza && `(Ajustado: ${parseFloat(finalQty.toFixed(4))} | ${Math.round(finalQty * activeConceptQty)} pza tot)`}
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono select-none">
                                <CurrencyEditCell
                                  value={item.insumo.cost}
                                  onChange={async (val) => {
                                    await handleUpdateInsumoCatalogCost(item.insumo.id, val);
                                  }}
                                />
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-cream select-all">{formatCurrencyMXN(importe)}</td>
                              <td className="py-1.5 px-2 text-center select-none">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInsumoFromMatrixForm(item.insumo.id)}
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

              {/* Calculations preview and submit */}
              <div className="pt-4 flex justify-between items-center select-none border-t border-dark-4">
                {(() => {
                  const direct = calculateMatrixDirectCost(matrixFormInsumos, activeConceptQty);
                  const indPct = budget?.indirect_percentage ?? 10.00;
                  const utPct = budget?.utility_percentage ?? 8.00;
                  const sale = calculateMatrixSellingPrice(direct, indPct, utPct);
                  return (
                    <div className="font-mono text-[9.5px] text-cream-dim flex flex-col gap-0.5">
                      <div>Costo Directo Unitario (evaluado a Cant: {activeConceptQty}): <span className="text-cream font-bold">{formatCurrencyMXN(direct)}</span></div>
                      <div>P.V. Venta Sugerido Unitario: <span className="text-gold font-bold">{formatCurrencyMXN(sale)}</span></div>
                    </div>
                  );
                })()}
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsMatrixEditorOpen(false); setEditingMatrix(null); }}
                    className="px-4 py-2 border border-dark-4 hover:bg-dark-3 text-cream-muted hover:text-cream text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={matrixFormSubmitting}
                    className="px-5 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:hover:bg-gold text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5 flex items-center gap-1.5"
                  >
                    {matrixFormSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando Matriz...</span>
                      </>
                    ) : (
                      <span>Guardar Matriz</span>
                    )}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Floating formulas guide dialog */}
      {isFormulaHelpOpen && (
        <div className="fixed inset-0 bg-dark-1/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-dark-2 border border-dark-4 p-5 rounded-2xl shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsFormulaHelpOpen(false)}
              className="absolute top-3 right-3 text-cream-muted hover:text-cream cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-gold">
              <HelpCircle className="w-5 h-5" />
              <h4 className="font-display font-black text-xs uppercase tracking-wider">Fórmulas Paramétricas</h4>
            </div>
            <div className="text-[10.5px] text-cream-dim space-y-2.5 font-body leading-relaxed text-left">
              <p>
                El campo <span className="text-cream font-semibold font-mono">REND.</span> es la cantidad del insumo
                necesaria <span className="text-cream font-semibold">por 1 unidad</span> del concepto.
                El resultado de la fórmula <span className="text-cream font-semibold">ES ese REND. directamente</span> —
                la cantidad general se aplica automáticamente después.
              </p>

              <div className="bg-dark-1/50 border border-dark-4 p-2.5 rounded-lg space-y-1">
                <span className="font-mono text-gold font-bold block text-[9px] uppercase">Variable Disponible</span>
                <p className="font-mono text-cream font-bold">Q (o C, CANTIDAD)</p>
                <span className="block text-[8px] text-cream-muted">
                  Cantidad total del concepto. Úsala para modelar consumos no-lineales.
                  La multiplicación final (×Q) la hace la matriz automáticamente.
                </span>
              </div>

              <div className="bg-dark-1/50 border border-dark-4 p-2.5 rounded-lg space-y-1.5">
                <span className="font-mono text-gold font-bold block text-[9px] uppercase">Ejemplo Práctico — Concepto: 100 m de cable</span>
                <div className="text-[9px] space-y-0.5 font-mono">
                  <div className="flex justify-between text-cream-dim">
                    <span>Fórmula: <span className="text-cream font-bold">2 / Q</span></span>
                    <span>→ REND = 2/100 = <span className="text-gold font-bold">0.02 /m</span></span>
                  </div>
                  <div className="flex justify-between text-cream-dim text-[8px]">
                    <span className="italic">Total = 100 m × 0.02 = 2 conectores</span>
                  </div>
                  <div className="flex justify-between text-cream-dim mt-1">
                    <span>Fórmula: <span className="text-cream font-bold">1/Q + 0.005</span></span>
                    <span>→ REND = <span className="text-gold font-bold">0.015 /m</span></span>
                  </div>
                  <div className="flex justify-between text-cream-dim text-[8px]">
                    <span className="italic">Base fija (1 pieza) + 0.5% lineal → economía de escala</span>
                  </div>
                </div>
              </div>

              <div className="bg-dark-1/50 border border-dark-4 p-2.5 rounded-lg space-y-1">
                <span className="font-mono text-gold font-bold block text-[9px] uppercase">Patrones Útiles</span>
                <ul className="space-y-0.5 list-disc list-inside font-mono text-[9px]">
                  <li><span className="text-cream font-bold">0.25</span> — estático: 0.25 por unidad de concepto</li>
                  <li><span className="text-cream font-bold">5 / Q</span> — 5 piezas fijas (independiente de Q)</li>
                  <li><span className="text-cream font-bold">1/Q + 0.01</span> — overhead fijo + tasa lineal</li>
                  <li><span className="text-cream font-bold">Q / 5000</span> — crece con el proyecto (viajes, rondas)</li>
                </ul>
              </div>

              <p className="text-[9px] text-cream-muted italic">Solo se permiten: números, paréntesis y los operadores <span className="font-mono">+ - * /</span></p>
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsFormulaHelpOpen(false)}
                className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
