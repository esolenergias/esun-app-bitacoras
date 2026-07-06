export type InsumoType = 'material' | 'labor' | 'equipment' | 'tool' | 'service';

export type InsumoSubcategory =
  | 'Panel solar'
  | 'Inversor'
  | 'Estructura de montaje'
  | 'Estructura PTR'
  | 'Material electrico DC'
  | 'Material electrico AC';

export const MATERIAL_SUBCATEGORIES: InsumoSubcategory[] = [
  'Panel solar',
  'Inversor',
  'Estructura de montaje',
  'Estructura PTR',
  'Material electrico DC',
  'Material electrico AC',
];

export interface Insumo {
  id: string;
  code: string;
  type: InsumoType;
  subcategory?: InsumoSubcategory | null;
  description: string;
  unit: string;
  cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface Matriz {
  id: string;
  code: string;
  description: string;
  unit: string;
  indirect_percentage: number;
  utility_percentage: number;
  insumos?: { insumo: Insumo; quantity: number; formula?: string | null }[];
  created_at?: string;
  updated_at?: string;
}

export interface Presupuesto {
  id: string;
  name: string;
  client_name: string;
  status: 'borrador' | 'enviado' | 'aprobado' | 'rechazado';
  indirect_percentage?: number;
  utility_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PresupuestoConcepto {
  id: string;
  presupuesto_id: string;
  matriz_id: string | null;
  quantity: number;
  description: string;
  unit: string;
  cost_price: number;
  indirect_percentage: number;
  utility_percentage: number;
  matriz?: Matriz;
  created_at?: string;
  updated_at?: string;
}
