import { supabase } from '../context/supabase';
import { Insumo, Matriz, Presupuesto, PresupuestoConcepto } from '../types/cotizador';

// ==========================================
// 1. INSUMOS CRUD
// ==========================================

export async function getInsumos(): Promise<Insumo[]> {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveInsumo(insumo: Partial<Insumo>): Promise<Insumo> {
  const insumoToUpsert = {
    code: insumo.code,
    type: insumo.type,
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
  return data;
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
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMatrizDetails(id: string): Promise<Matriz> {
  const { data, error } = await supabase
    .from('matrices')
    .select(`
      *,
      matriz_insumos (
        quantity,
        insumos (
          *
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Matriz not found');

  const insumos = data.matriz_insumos?.map((mi: any) => {
    const ins = Array.isArray(mi.insumos) ? mi.insumos[0] : mi.insumos;
    return {
      insumo: ins,
      quantity: Number(mi.quantity)
    };
  }).filter((item: any) => !!item.insumo) || [];

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

export async function saveMatriz(matriz: Partial<Matriz>): Promise<Matriz> {
  const matrizToUpsert = {
    code: matriz.code,
    description: matriz.description,
    unit: matriz.unit,
    indirect_percentage: matriz.indirect_percentage,
    utility_percentage: matriz.utility_percentage,
    ...(matriz.id ? { id: matriz.id } : {})
  };

  const { data: savedMatrix, error: matrixError } = await supabase
    .from('matrices')
    .upsert(matrizToUpsert)
    .select()
    .single();

  if (matrixError) throw matrixError;

  // Delete pre-existing entries in matriz_insumos for that matriz_id
  const { error: deleteError } = await supabase
    .from('matriz_insumos')
    .delete()
    .eq('matriz_id', savedMatrix.id);

  if (deleteError) throw deleteError;

  // Insert the new ones
  if (matriz.insumos && matriz.insumos.length > 0) {
    const insumosToInsert = matriz.insumos.map((item) => ({
      matriz_id: savedMatrix.id,
      insumo_id: item.insumo.id,
      quantity: item.quantity
    }));

    const { error: insertError } = await supabase
      .from('matriz_insumos')
      .insert(insumosToInsert);

    if (insertError) throw insertError;
  }

  return {
    ...savedMatrix,
    indirect_percentage: Number(savedMatrix.indirect_percentage),
    utility_percentage: Number(savedMatrix.utility_percentage),
    insumos: matriz.insumos || []
  };
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
  return data || [];
}

export interface PresupuestoDetalle extends Presupuesto {
  conceptos: PresupuestoConcepto[];
}

export async function getPresupuestoDetails(id: string): Promise<PresupuestoDetalle> {
  const { data, error } = await supabase
    .from('presupuestos')
    .select(`
      *,
      presupuesto_conceptos (
        *,
        matrices (
          *,
          matriz_insumos (
            quantity,
            insumos (
              *
            )
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Presupuesto not found');

  const conceptos = data.presupuesto_conceptos?.map((pc: any) => {
    let hydratedMatriz: Matriz | undefined = undefined;
    if (pc.matrices) {
      const insumos = pc.matrices.matriz_insumos?.map((mi: any) => {
        const ins = Array.isArray(mi.insumos) ? mi.insumos[0] : mi.insumos;
        return {
          insumo: ins,
          quantity: Number(mi.quantity)
        };
      }).filter((item: any) => !!item.insumo) || [];
      
      hydratedMatriz = {
        id: pc.matrices.id,
        code: pc.matrices.code,
        description: pc.matrices.description,
        unit: pc.matrices.unit,
        indirect_percentage: Number(pc.matrices.indirect_percentage),
        utility_percentage: Number(pc.matrices.utility_percentage),
        insumos,
        created_at: pc.matrices.created_at,
        updated_at: pc.matrices.updated_at
      };
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
      created_at: pc.created_at,
      updated_at: pc.updated_at
    };
  }) || [];

  return {
    id: data.id,
    name: data.name,
    client_name: data.client_name,
    status: data.status,
    conceptos,
    created_at: data.created_at,
    updated_at: data.updated_at
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
    ...(presupuesto.id ? { id: presupuesto.id } : {})
  };

  const { data: savedPresupuesto, error: presupuestoError } = await supabase
    .from('presupuestos')
    .upsert(presupuestoToUpsert)
    .select()
    .single();

  if (presupuestoError) throw presupuestoError;

  let savedConceptos: PresupuestoConcepto[] = [];

  if (conceptos !== undefined) {
    // Delete pre-existing concepts for that presupuesto_id
    const { error: deleteError } = await supabase
      .from('presupuesto_conceptos')
      .delete()
      .eq('presupuesto_id', savedPresupuesto.id);

    if (deleteError) throw deleteError;

    // Insert the new ones
    if (conceptos.length > 0) {
      const conceptosToInsert = conceptos.map((c) => ({
        presupuesto_id: savedPresupuesto.id,
        matriz_id: c.matriz_id || null,
        quantity: c.quantity || 0,
        description: c.description || '',
        unit: c.unit || '',
        cost_price: c.cost_price || 0,
        indirect_percentage: c.indirect_percentage || 0,
        utility_percentage: c.utility_percentage || 0,
        ...(c.id ? { id: c.id } : {})
      }));

      const { data: insertedConceptos, error: insertError } = await supabase
        .from('presupuesto_conceptos')
        .insert(conceptosToInsert)
        .select(`
          *,
          matrices (
            *,
            matriz_insumos (
              quantity,
              insumos (
                *
              )
            )
          )
        `);

      if (insertError) throw insertError;

      savedConceptos = insertedConceptos?.map((pc: any) => {
        let hydratedMatriz: Matriz | undefined = undefined;
        if (pc.matrices) {
          const insumos = pc.matrices.matriz_insumos?.map((mi: any) => {
            const ins = Array.isArray(mi.insumos) ? mi.insumos[0] : mi.insumos;
            return {
              insumo: ins,
              quantity: Number(mi.quantity)
            };
          }).filter((item: any) => !!item.insumo) || [];
          
          hydratedMatriz = {
            id: pc.matrices.id,
            code: pc.matrices.code,
            description: pc.matrices.description,
            unit: pc.matrices.unit,
            indirect_percentage: Number(pc.matrices.indirect_percentage),
            utility_percentage: Number(pc.matrices.utility_percentage),
            insumos,
            created_at: pc.matrices.created_at,
            updated_at: pc.matrices.updated_at
          };
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
          created_at: pc.created_at,
          updated_at: pc.updated_at
        };
      }) || [];
    }
  } else {
    // Fetch existing concepts
    const existingDetails = await getPresupuestoDetails(savedPresupuesto.id);
    savedConceptos = existingDetails.conceptos;
  }

  return {
    id: savedPresupuesto.id,
    name: savedPresupuesto.name,
    client_name: savedPresupuesto.client_name,
    status: savedPresupuesto.status,
    conceptos: savedConceptos,
    created_at: savedPresupuesto.created_at,
    updated_at: savedPresupuesto.updated_at
  };
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

export function calculateMatrixDirectCost(insumos: { insumo: { cost: number }; quantity: number }[]): number {
  return insumos.reduce((sum, item) => sum + (Number(item.insumo.cost) * Number(item.quantity)), 0);
}

export function calculateMatrixSellingPrice(
  directCost: number,
  indirectPercentage: number,
  utilityPercentage: number
): number {
  const subtotal = Number(directCost) * (1 + Number(indirectPercentage) / 100);
  return subtotal * (1 + Number(utilityPercentage) / 100);
}

export interface BudgetTotals {
  directCostTotal: number;
  sellingPriceTotal: number;
}

export function calculateBudgetTotals(conceptos: PresupuestoConcepto[]): BudgetTotals {
  let directCostTotal = 0;
  let sellingPriceTotal = 0;

  for (const concepto of conceptos) {
    const qty = Number(concepto.quantity);
    const unitDirect = Number(concepto.cost_price);
    const unitSelling = calculateMatrixSellingPrice(
      unitDirect,
      Number(concepto.indirect_percentage),
      Number(concepto.utility_percentage)
    );

    directCostTotal += qty * unitDirect;
    sellingPriceTotal += qty * unitSelling;
  }

  return {
    directCostTotal,
    sellingPriceTotal
  };
}
