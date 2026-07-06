import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { 
  getPresupuestos, getPresupuestoDetails, calculateMatrixSellingPrice, 
  calculateMatrixDirectCost, calculateBudgetTotals,
  getInsumos, getMatrices, saveInsumo, saveMatriz
} from '../../lib/cotizadorService';
import type { Presupuesto, PresupuestoConcepto, Insumo, Matriz, InsumoType, InsumoSubcategory } from '../../types/cotizador';
import { MATERIAL_SUBCATEGORIES } from '../../types/cotizador';
import { 
  Loader2, AlertTriangle, FileText, ChevronRight, ChevronDown, 
  Layers, Package, Users, Cpu, ShieldCheck, DollarSign, 
  TrendingUp, Download, Eye, RefreshCw, X, ArrowLeft, Layers2, Wrench, Plus
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
  const [addConceptTab, setAddConceptTab] = useState<'apu' | 'custom' | 'new_matrix' | 'new_insumo'>('apu');
  
  // Selector / Custom Concept
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>('');
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
  const [insumoQtyForMatrixForm, setInsumoQtyForMatrixForm] = useState<number>(1);
  const [matrixFormError, setMatrixFormError] = useState<string | null>(null);
  const [matrixFormSubmitting, setMatrixFormSubmitting] = useState<boolean>(false);

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
          utility_percentage: conceptData.utility_percentage
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

  const handleAddExistingAPU = async () => {
    if (!selectedMatrixId) {
      setSubModalError('Selecciona una matriz de la lista.');
      return;
    }
    const matrix = matrices.find(m => m.id === selectedMatrixId);
    if (!matrix) return;
    
    const costPrice = calculateMatrixDirectCost(matrix.insumos || []);
    await handleSaveConceptToDb({
      matriz_id: matrix.id,
      description: matrix.description,
      unit: matrix.unit,
      cost_price: costPrice,
      indirect_percentage: matrix.indirect_percentage,
      utility_percentage: matrix.utility_percentage,
      quantity: customQty > 0 ? customQty : 1.00
    });
  };

  const handleAddCustomConcept = async () => {
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
    
    await handleSaveConceptToDb({
      matriz_id: null,
      description: customDesc.trim(),
      unit: customUnit.trim(),
      cost_price: customCost,
      indirect_percentage: customIndirect,
      utility_percentage: customUtility,
      quantity: customQty
    });
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
      await handleSaveConceptToDb({
        matriz_id: saved.id,
        description: saved.description,
        unit: saved.unit,
        cost_price: costPrice,
        indirect_percentage: saved.indirect_percentage,
        utility_percentage: saved.utility_percentage,
        quantity: customQty > 0 ? customQty : 1.00
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

  const handleOpenMatrixEditor = (matrix: Matriz) => {
    setEditingMatrix(matrix);
    setMatrixFormCode(matrix.code);
    setMatrixFormDesc(matrix.description);
    setMatrixFormUnit(matrix.unit);
    setMatrixFormIndirect(matrix.indirect_percentage);
    setMatrixFormUtility(matrix.utility_percentage);
    setMatrixFormInsumos(matrix.insumos || []);
    setSelectedInsumoIdForMatrixForm('');
    setInsumoQtyForMatrixForm(1);
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

    setMatrixFormInsumos(prev => [...prev, { insumo, quantity: insumoQtyForMatrixForm }]);
    setSelectedInsumoIdForMatrixForm('');
    setInsumoQtyForMatrixForm(1);
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
        indirect_percentage: matrixFormIndirect,
        utility_percentage: matrixFormUtility,
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
          matrices (
            id,
            matriz_insumos (
              quantity,
              insumos (
                cost
              )
            )
          )
        `)
        .eq('presupuesto_id', budget.id);

      if (!fetchAllErr && allConcepts) {
        for (const c of allConcepts) {
          if (c.matrices) {
            const insList = (c.matrices.matriz_insumos || []).map((mi: any) => ({
              quantity: Number(mi.quantity),
              insumo: { cost: Number(mi.insumos?.cost || 0) }
            }));
            const newDirect = calculateMatrixDirectCost(insList as any);
            
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

  const getStatusBadgeStyles = (status: 'borrador' | 'enviado' | 'aprobado' | 'rechazado') => {
    switch (status) {
      case 'borrador': return 'bg-gray-500/15 text-gray-400 border border-gray-500/30';
      case 'enviado': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'aprobado': return 'bg-green-500/15 text-green-400 border border-green-500/30';
      case 'rechazado': return 'bg-red-500/15 text-red-400 border border-red-500/30';
      default: return 'bg-cream/15 text-cream border border-cream/20';
    }
  };

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
            Tu cuenta con rol <strong className="text-gold font-mono">"{currentUser.role}"</strong> no tiene permisos de visualización ni edición en el Cotizador IA.
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
  const totals = calculateBudgetTotals(concepts);
  const directCost = totals.directCostTotal;
  const sellingPrice = totals.sellingPriceTotal;
  const marginVal = sellingPrice - directCost;
  const marginPct = sellingPrice > 0 ? (marginVal / sellingPrice) * 100 : 0;

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
    const qty = Number(c.quantity) || 0;
    const matrix = c.matriz;
    if (matrix && matrix.insumos) {
      matrix.insumos.forEach(item => {
        const costVal = Number(item.insumo.cost) || 0;
        const matrixQty = Number(item.quantity) || 0;
        const totalCost = costVal * matrixQty * qty;
        
        const type = item.insumo.type;
        if (type in aggregatedInsumos) {
          aggregatedInsumos[type as keyof typeof aggregatedInsumos] += totalCost;
          aggregatedInsumos.total += totalCost;
        }
      });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Costo Directo Consolidado', value: formatCurrencyMXN(directCost), icon: DollarSign, color: 'text-cream' },
          { label: 'Precio de Venta Sugerido', value: formatCurrencyMXN(sellingPrice), icon: TrendingUp, color: 'text-gold' },
          { label: 'Margen Estimado (Utilidad)', value: formatCurrencyMXN(marginVal), icon: DollarSign, color: 'text-green-400' },
          { label: 'Porcentaje de Margen', value: `${marginPct.toFixed(2)}%`, icon: Layers, color: marginPct > 15 ? 'text-green-400' : 'text-amber-400' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-dark-2/60 border border-dark-4 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden group hover:border-gold/20 transition-all select-none">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-cream-muted">{kpi.label}</span>
              <span className={`p-2 bg-dark-1/80 border border-dark-4 rounded-xl ${kpi.color} group-hover:scale-105 transition-transform`}>
                <kpi.icon className="w-4 h-4" />
              </span>
            </div>
            <p className={`text-xl font-mono font-bold tracking-wide select-all ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
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
                      <th className="py-3 px-4 w-32">Código</th>
                      <th className="py-3 px-4 text-center w-24">Tipo</th>
                      <th className="py-3 px-4">Descripción / Insumo</th>
                      <th className="py-3 px-4 text-center w-16">Unidad</th>
                      <th className="py-3 px-4 text-right w-28">CANTIDAD</th>
                      <th className="py-3 px-4 text-right w-36">Costo Unit.</th>
                      <th className="py-3 px-4 text-right w-36">Importe Tot.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-4/50">
                    {concepts.map((c) => {
                      const unitSelling = calculateMatrixSellingPrice(Number(c.cost_price), Number(c.indirect_percentage), Number(c.utility_percentage));
                      const totalSelling = Number(c.quantity) * unitSelling;

                      return (
                        <tr 
                          key={c.id}
                          className="hover:bg-dark-3/20 select-none bg-dark-2/20 transition-colors font-bold text-cream"
                        >
                          <td className="py-3 px-4 font-mono text-[10px] text-gold/90 font-bold select-all">
                            {c.matriz?.code || 'S/C'}
                          </td>
                          <td className="py-3 px-4 text-center select-none">
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
                              MATRIZ
                            </span>
                          </td>
                          <td className="py-3 px-4 leading-relaxed font-sans text-xs">
                            <div>{c.description}</div>
                            {/* Small badges for margins */}
                            <div className="flex gap-2 mt-1 select-none">
                              <span className="text-[8px] font-mono text-cream-muted uppercase bg-dark-3 px-1.5 py-0.5 rounded border border-dark-4">
                                Indirecto: {c.indirect_percentage.toFixed(1)}%
                              </span>
                              <span className="text-[8px] font-mono text-cream-muted uppercase bg-dark-3 px-1.5 py-0.5 rounded border border-dark-4">
                                Utilidad: {c.utility_percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-cream-muted select-none">{c.unit}</td>
                          <td className="py-3 px-4 text-right font-mono select-none">
                            <NumericInput
                              step="0.01"
                              min="0.00"
                              value={Number(c.quantity)}
                              onChange={async (val) => {
                                await handleUpdateConceptQuantity(c.id, val);
                              }}
                              className="w-20 px-1 py-0.5 bg-dark-1/80 border border-dark-4 focus:border-gold/40 text-cream rounded font-mono text-right focus:outline-none text-[11px]"
                            />
                          </td>
                          <td 
                            className="py-3 px-4 text-right font-mono text-cream select-all cursor-pointer hover:text-gold hover:underline transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (c.matriz) handleOpenMatrixEditor(c.matriz);
                            }}
                            title="Haga clic para editar la matriz de costos completa"
                          >
                            {formatCurrencyMXN(unitSelling)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gold select-all">
                            {formatCurrencyMXN(totalSelling)}
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
            
            <div className="border-t border-dark-4 pt-3 mt-4 flex justify-between items-center font-mono text-[10px] text-cream font-bold">
              <span>Costo Directo Total:</span>
              <span className="text-gold">{formatCurrencyMXN(directCost)}</span>
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
                      disabled={subModalSubmitting}
                      className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark-1 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-gold/5 flex items-center gap-1.5"
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Indirecto %</label>
                  <NumericInput
                    step="0.1"
                    value={matrixFormIndirect}
                    onChange={setMatrixFormIndirect}
                    className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider block select-none">Utilidad %</label>
                  <NumericInput
                    step="0.1"
                    value={matrixFormUtility}
                    onChange={setMatrixFormUtility}
                    className="w-full p-2.5 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Insumos list builder */}
              <div className="border border-dark-4 p-4 rounded-xl space-y-3 bg-dark-1/30">
                <span className="text-[9px] font-black uppercase tracking-widest text-gold block select-none">Desglose de Insumos</span>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 select-none">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8.5px] text-cream-muted uppercase font-bold block">Seleccionar Insumo del Catálogo</label>
                    <select
                      value={selectedInsumoIdForMatrixForm}
                      onChange={(e) => setSelectedInsumoIdForMatrixForm(e.target.value)}
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
                      value={insumoQtyForMatrixForm}
                      onChange={setInsumoQtyForMatrixForm}
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
                          <th className="py-1.5 px-2 text-right">Rend.</th>
                          <th className="py-1.5 px-2 text-right">Costo U.</th>
                          <th className="py-1.5 px-2 text-right">Importe</th>
                          <th className="py-1.5 px-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4 font-body">
                        {matrixFormInsumos.map((item, idx) => {
                          const importe = item.insumo.cost * item.quantity;
                          return (
                            <tr key={idx} className="hover:bg-dark-1/25 transition-colors">
                              <td className="py-1.5 px-2 font-mono font-bold text-gold/80 select-all">{item.insumo.code}</td>
                              <td className="py-1.5 px-2 text-cream truncate max-w-[180px]">{item.insumo.description}</td>
                              <td className="py-1.5 px-2 text-right font-mono select-none">
                                <NumericInput
                                  step="0.0001"
                                  min="0.0000"
                                  value={item.quantity}
                                  onChange={(val) => {
                                    setMatrixFormInsumos(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                                  }}
                                  className="w-16 px-1 bg-dark-1 border border-dark-4 text-right text-cream font-mono rounded"
                                />
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
                  const direct = calculateMatrixDirectCost(matrixFormInsumos);
                  const sale = calculateMatrixSellingPrice(direct, matrixFormIndirect, matrixFormUtility);
                  return (
                    <div className="font-mono text-[9.5px] text-cream-dim">
                      <span>Costo Directo: {formatCurrencyMXN(direct)} &bull; </span>
                      <span className="text-gold font-bold">P.V. Venta APU: {formatCurrencyMXN(sale)}</span>
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

    </div>
  );
}
