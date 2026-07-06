import { supabase } from '../context/supabase';
import type { Insumo, InsumoType, InsumoSubcategory, Matriz, Presupuesto, PresupuestoConcepto } from '../types/cotizador';

// ==========================================
// DATABASE ROW INTERFACES (Safe typing)
// ==========================================

interface DbInsumo {
  id: string;
  code: string;
  type: string;
  subcategory?: string | null;
  description: string;
  unit: string;
  cost: number | string;
  created_at?: string;
  updated_at?: string;
}

interface DbMatrizInsumo {
  quantity: number | string;
  formula?: string | null;
  insumos: DbInsumo | DbInsumo[] | null;
}

interface DbMatriz {
  id: string;
  code: string;
  description: string;
  unit: string;
  indirect_percentage: number | string;
  utility_percentage: number | string;
  matriz_insumos?: DbMatrizInsumo[];
  created_at?: string;
  updated_at?: string;
}

interface DbConcepto {
  id: string;
  presupuesto_id: string;
  matriz_id: string | null;
  quantity: number | string;
  description: string;
  unit: string;
  cost_price: number | string;
  indirect_percentage: number | string;
  utility_percentage: number | string;
  matrices: DbMatriz | DbMatriz[] | null;
  order_index?: number | string;
  created_at?: string;
  updated_at?: string;
}

interface DbPresupuesto {
  id: string;
  name: string;
  client_name: string;
  status: string;
  presupuesto_conceptos?: DbConcepto[];
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// DB MAPPING HELPERS (De-duplicated logic)
// ==========================================

export function mapInsumoFromDb(dbInsumo: DbInsumo): Insumo {
  return {
    id: dbInsumo.id,
    code: dbInsumo.code,
    type: dbInsumo.type as InsumoType,
    subcategory: dbInsumo.subcategory as InsumoSubcategory | null,
    description: dbInsumo.description,
    unit: dbInsumo.unit,
    cost: Number(dbInsumo.cost),
    created_at: dbInsumo.created_at,
    updated_at: dbInsumo.updated_at
  };
}

export function mapMatrizFromDb(data: DbMatriz): Matriz {
  const insumos = data.matriz_insumos?.map((mi) => {
    const ins = Array.isArray(mi.insumos) ? mi.insumos[0] : mi.insumos;
    if (!ins) return null;
    return {
      insumo: mapInsumoFromDb(ins),
      quantity: Number(mi.quantity),
      formula: mi.formula
    };
  }).filter((item): item is { insumo: Insumo; quantity: number; formula?: string | null } => item !== null) || [];

  return {
    id: data.id,
    code: data.code,
    description: data.description,
    unit: data.unit,
    indirect_percentage: Number(data.indirect_percentage),
    utility_percentage: Number(data.utility_percentage),
    insumos,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export function mapConceptoFromDb(pc: DbConcepto): PresupuestoConcepto {
  let hydratedMatriz: Matriz | undefined = undefined;
  const rawMatriz = Array.isArray(pc.matrices) ? pc.matrices[0] : pc.matrices;
  if (rawMatriz) {
    hydratedMatriz = mapMatrizFromDb(rawMatriz);
  }

  return {
    id: pc.id,
    presupuesto_id: pc.presupuesto_id,
    matriz_id: pc.matriz_id,
    quantity: Number(pc.quantity),
    description: pc.description,
    unit: pc.unit,
    cost_price: Number(pc.cost_price),
    indirect_percentage: Number(pc.indirect_percentage),
    utility_percentage: Number(pc.utility_percentage),
    matriz: hydratedMatriz,
    order_index: pc.order_index !== undefined ? Number(pc.order_index) : 0,
    created_at: pc.created_at,
    updated_at: pc.updated_at
  };
}

// ==========================================
// 1. INSUMOS CRUD
// ==========================================

export async function getInsumos(): Promise<Insumo[]> {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  const rows = (data || []) as DbInsumo[];
  return rows.map(mapInsumoFromDb);
}

export async function saveInsumo(insumo: Partial<Insumo>): Promise<Insumo> {
  const insumoToUpsert = {
    code: insumo.code,
    type: insumo.type,
    subcategory: insumo.subcategory,
    description: insumo.description,
    unit: insumo.unit,
    cost: insumo.cost,
    ...(insumo.id ? { id: insumo.id } : {})
  };

  const { data, error } = await supabase
    .from('insumos')
    .upsert(insumoToUpsert)
    .select()
    .single();

  if (error) throw error;
  return mapInsumoFromDb(data as DbInsumo);
}

export async function deleteInsumo(id: string): Promise<void> {
  const { error } = await supabase
    .from('insumos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==========================================
// 2. MATRICES CRUD
// ==========================================

export async function getMatrices(): Promise<Matriz[]> {
  const { data, error } = await supabase
    .from('matrices')
    .select(`
      *,
      matriz_insumos (
        quantity,
        formula,
        insumos (
          *
        )
      )
    `)
    .order('code', { ascending: true });

  if (error) throw error;
  const rows = (data || []) as DbMatriz[];
  return rows.map(mapMatrizFromDb);
}

export async function getMatrizDetails(id: string): Promise<Matriz> {
  const { data, error } = await supabase
    .from('matrices')
    .select(`
      *,
      matriz_insumos (
        quantity,
        formula,
        insumos (
          *
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Matriz not found');

  return mapMatrizFromDb(data as DbMatriz);
}

export async function saveMatriz(matriz: Partial<Matriz>): Promise<Matriz> {
  const matrizToUpsert = {
    code: matriz.code,
    description: matriz.description,
    unit: matriz.unit,
    indirect_percentage: matriz.indirect_percentage,
    utility_percentage: matriz.utility_percentage,
    ...(matriz.id ? { id: matriz.id } : {})
  };

  const { data: savedMatrixData, error: matrixError } = await supabase
    .from('matrices')
    .upsert(matrizToUpsert)
    .select()
    .single();

  if (matrixError) throw matrixError;
  const savedMatrix = savedMatrixData as DbMatriz;

  if (matriz.insumos !== undefined) {
    // Perform a delta sync for matriz_insumos
    const { data: currentInsumosData, error: fetchError } = await supabase
      .from('matriz_insumos')
      .select('insumo_id')
      .eq('matriz_id', savedMatrix.id);

    if (fetchError) throw fetchError;
    const currentInsumos = (currentInsumosData || []) as { insumo_id: string }[];

    const incomingInsumoIds = new Set(
      matriz.insumos.map((item) => item.insumo?.id || '')
    );
    const insumoIdsToDelete = currentInsumos
      .map((item) => item.insumo_id)
      .filter((id) => !incomingInsumoIds.has(id));

    const insumosToUpsert = matriz.insumos.map((item) => {
      return {
        matriz_id: savedMatrix.id,
        insumo_id: item.insumo?.id || '',
        quantity: Number(item.quantity),
        formula: item.formula || null
      };
    });

    if (insumoIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('matriz_insumos')
        .delete()
        .eq('matriz_id', savedMatrix.id)
        .in('insumo_id', insumoIdsToDelete);

      if (deleteError) throw deleteError;
    }

    if (insumosToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('matriz_insumos')
        .upsert(insumosToUpsert);

      if (upsertError) throw upsertError;
    }
  }

  // Load and return fully hydrated details
  return getMatrizDetails(savedMatrix.id);
}

export async function deleteMatriz(id: string): Promise<void> {
  const { error } = await supabase
    .from('matrices')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==========================================
// 3. PRESUPUESTOS CRUD
// ==========================================

export async function getPresupuestos(): Promise<Presupuesto[]> {
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data || []) as DbPresupuesto[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    client_name: row.client_name,
    status: row.status as 'borrador' | 'enviado' | 'aprobado' | 'rechazado',
    indirect_percentage: Number(row.indirect_percentage ?? 10.00),
    utility_percentage: Number(row.utility_percentage ?? 8.00),
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export interface PresupuestoDetalle extends Presupuesto {
  conceptos: PresupuestoConcepto[];
}

export async function getPresupuestoDetails(idOrName: string): Promise<PresupuestoDetalle> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName);

  let query = supabase
    .from('presupuestos')
    .select(`
      *,
      presupuesto_conceptos (
        *,
        matrices (
          *,
          matriz_insumos (
            quantity,
            formula,
            insumos (
              *
            )
          )
        )
      )
    `);

  if (isUuid) {
    query = query.eq('id', idOrName);
  } else {
    query = query.eq('name', idOrName);
  }

  const { data, error } = await query
    .order('order_index', { foreignTable: 'presupuesto_conceptos', ascending: true })
    .order('created_at', { foreignTable: 'presupuesto_conceptos', ascending: true })
    .order('id', { foreignTable: 'presupuesto_conceptos', ascending: true })
    .single();

  if (error) throw error;
  if (!data) throw new Error('Presupuesto not found');

  const dbPresupuesto = data as DbPresupuesto;
  const conceptos = dbPresupuesto.presupuesto_conceptos?.map(mapConceptoFromDb) || [];

  return {
    id: dbPresupuesto.id,
    name: dbPresupuesto.name,
    client_name: dbPresupuesto.client_name,
    status: dbPresupuesto.status as 'borrador' | 'enviado' | 'aprobado' | 'rechazado',
    indirect_percentage: Number(dbPresupuesto.indirect_percentage ?? 10.00),
    utility_percentage: Number(dbPresupuesto.utility_percentage ?? 8.00),
    conceptos,
    created_at: dbPresupuesto.created_at,
    updated_at: dbPresupuesto.updated_at
  };
}

export async function savePresupuesto(
  presupuesto: Partial<Presupuesto>,
  conceptos?: Partial<PresupuestoConcepto>[]
): Promise<PresupuestoDetalle> {
  const presupuestoToUpsert = {
    name: presupuesto.name,
    client_name: presupuesto.client_name,
    status: presupuesto.status,
    indirect_percentage: presupuesto.indirect_percentage ?? 10.00,
    utility_percentage: presupuesto.utility_percentage ?? 8.00,
    ...(presupuesto.id ? { id: presupuesto.id } : {})
  };

  const { data: savedPresupuestoData, error: presupuestoError } = await supabase
    .from('presupuestos')
    .upsert(presupuestoToUpsert)
    .select()
    .single();

  if (presupuestoError) throw presupuestoError;
  const savedPresupuesto = savedPresupuestoData as DbPresupuesto;

  if (conceptos !== undefined) {
    // Delta updates for concepts:
    // 1. Fetch existing concepts for this budget
    const { data: existingConceptosData, error: fetchError } = await supabase
      .from('presupuesto_conceptos')
      .select('id')
      .eq('presupuesto_id', savedPresupuesto.id);

    if (fetchError) throw fetchError;
    const existingConceptos = (existingConceptosData || []) as { id: string }[];
    const existingIds = existingConceptos.map((ec) => ec.id);

    // Ensure all incoming concepts have an order_index corresponding to their position in the list
    const conceptsWithOrder = conceptos.map((c, index) => ({
      ...c,
      order_index: c.order_index !== undefined ? c.order_index : index
    }));

    // Split incoming concepts
    const incomingWithId = conceptsWithOrder.filter((c) => !!c.id);
    const incomingWithoutId = conceptsWithOrder.filter((c) => !c.id);
    const incomingIdsSet = new Set(incomingWithId.map((c) => c.id));

    // 2. Identify concepts to delete
    const idsToDelete = existingIds.filter((id) => !incomingIdsSet.has(id));

    // 3. Delete old concepts
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('presupuesto_conceptos')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;
    }

    // 4. Insert new concepts (without ID)
    if (incomingWithoutId.length > 0) {
      const newConceptsToInsert = incomingWithoutId.map((c) => ({
        presupuesto_id: savedPresupuesto.id,
        matriz_id: c.matriz_id || null,
        quantity: c.quantity || 0,
        description: c.description || '',
        unit: c.unit || '',
        cost_price: c.cost_price || 0,
        indirect_percentage: c.indirect_percentage || 0,
        utility_percentage: c.utility_percentage || 0,
        order_index: c.order_index
      }));

      const { error: insertError } = await supabase
        .from('presupuesto_conceptos')
        .insert(newConceptsToInsert);

      if (insertError) throw insertError;
    }

    // 5. Update existing concepts (with ID)
    if (incomingWithId.length > 0) {
      const conceptsToUpdate = incomingWithId.map((c) => ({
        id: c.id,
        presupuesto_id: savedPresupuesto.id,
        matriz_id: c.matriz_id || null,
        quantity: c.quantity || 0,
        description: c.description || '',
        unit: c.unit || '',
        cost_price: c.cost_price || 0,
        indirect_percentage: c.indirect_percentage || 0,
        utility_percentage: c.utility_percentage || 0,
        order_index: c.order_index
      }));

      const { error: updateError } = await supabase
        .from('presupuesto_conceptos')
        .upsert(conceptsToUpdate);

      if (updateError) throw updateError;
    }
  }

  // Load fully hydrated details to return
  return getPresupuestoDetails(savedPresupuesto.id);
}

export async function deletePresupuesto(id: string): Promise<void> {
  const { error } = await supabase
    .from('presupuestos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==========================================
// 4. CALCULATION HELPERS
// ==========================================

export function calculateMatrixDirectCost(
  insumos: { insumo: { cost: number; unit?: string }; quantity: number; formula?: string | null }[],
  conceptQty: number = 1
): number {
  return insumos.reduce((sum, item) => {
    const qty = item.formula 
      ? evaluateFormula(item.formula, conceptQty) 
      : Number(item.quantity);
    const isPza = item.insumo?.unit?.trim().toLowerCase() === 'pza';
    const adjustedQty = isPza && conceptQty > 0
      ? Math.round(qty * conceptQty) / conceptQty
      : qty;
    return sum + (Number(item.insumo?.cost || 0) * adjustedQty);
  }, 0);
}

export function calculateMatrixSellingPrice(
  directCost: number,
  indirectPercentage: number,
  utilityPercentage: number
): number {
  const subtotal = Number(directCost) * (1 + Number(indirectPercentage) / 100);
  const sellingPrice = subtotal * (1 + Number(utilityPercentage) / 100);
  return Math.round((sellingPrice + Number.EPSILON) * 100) / 100;
}

export interface BudgetTotals {
  directCostTotal: number;
  sellingPriceTotal: number;
}

export function calculateBudgetTotals(
  conceptos: PresupuestoConcepto[],
  indirectPercentage?: number,
  utilityPercentage?: number
): BudgetTotals {
  let directCostTotal = 0;
  for (const concepto of conceptos) {
    const qty = Number(concepto.quantity);
    // Since matrix direct cost can depend on the concept qty (formula), pass it here!
    const unitDirect = concepto.matriz 
      ? calculateMatrixDirectCost(concepto.matriz.insumos || [], qty) 
      : Number(concepto.cost_price);
    directCostTotal += qty * unitDirect;
  }

  const indPct = indirectPercentage !== undefined ? Number(indirectPercentage) : 10.00;
  const utPct = utilityPercentage !== undefined ? Number(utilityPercentage) : 8.00;

  const subtotal = directCostTotal * (1 + indPct / 100);
  const sellingPriceTotal = subtotal * (1 + utPct / 100);

  return {
    directCostTotal: Math.round((directCostTotal + Number.EPSILON) * 100) / 100,
    sellingPriceTotal: Math.round((sellingPriceTotal + Number.EPSILON) * 100) / 100
  };
}

/**
 * Evaluates a parametric formula for an insumo's REND. (rendimiento por unidad).
 *
 * The result IS the rendimiento per unit of the concept — exactly as written.
 * `Q` (or `C`, `CANTIDAD`) is the concept's general quantity, available as a
 * parameter so users can model non-linear / scale-dependent consumption:
 *
 *   Examples:
 *     "0.25"          → static: 0.25 units of insumo per unit of concept
 *     "2 / Q"         → 2 fixed items distributed over the total quantity
 *     "1/Q + 0.005"   → fixed overhead + linear rate (economy of scale)
 *     "Q / 5000"      → grows with project size (e.g., transport rounds)
 *
 * The caller (calculateMatrixDirectCost) then does:
 *     Σ(REND_i × CostoU_i)  →  unit cost of the matrix
 * And the dashboard does:
 *     unitCost × conceptQty  →  total cost (ONE multiplication, no double)
 */
export function evaluateFormula(formula: string, conceptQty: number): number {
  try {
    if (!formula) return 0;
    const sanitized = formula
      .replace(/q|c|cantidad/gi, String(conceptQty))
      .replace(/[^0-9+\-*/().\s]/g, ''); // strip unsafe chars
    const fn = new Function(`return (${sanitized});`);
    const val = fn();
    return typeof val === 'number' && !isNaN(val) && isFinite(val) ? val : 0;
  } catch (e) {
    console.error('Error evaluating formula:', formula, e);
    return 0;
  }
}
