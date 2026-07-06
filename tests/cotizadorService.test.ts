import {
  calculateMatrixDirectCost,
  calculateMatrixSellingPrice,
  calculateBudgetTotals
} from '../src/lib/cotizadorService';
import type { Insumo, PresupuestoConcepto } from '../src/types/cotizador';

function assertEquals(actual: number, expected: number, message?: string) {
  if (Math.abs(actual - expected) > 1e-9) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}${message ? ` (${message})` : ''}`);
  }
  console.log(`✓ Assertion passed: ${actual} === ${expected} ${message ? `(${message})` : ''}`);
}

function runTests() {
  console.log('Starting Cotizador Calculation Tests...');

  // Test 1: Direct Cost of a Matrix
  console.log('\nRunning Test 1: Direct Cost...');
  const mockInsumos = [
    {
      insumo: { id: '1', code: 'INS-1', type: 'material', description: 'Insumo 1', unit: 'pza', cost: 100 } as Insumo,
      quantity: 2
    },
    {
      insumo: { id: '2', code: 'INS-2', type: 'labor', description: 'Insumo 2', unit: 'jor', cost: 50 } as Insumo,
      quantity: 3
    }
  ];
  const directCost = calculateMatrixDirectCost(mockInsumos);
  assertEquals(directCost, 350, 'Direct Cost of matrix');

  // Test 2: Selling Price of a Matrix (with rounded math)
  console.log('\nRunning Test 2: Selling Price...');
  const indirectPercentage = 10;
  const utilityPercentage = 8;
  const sellingPrice = calculateMatrixSellingPrice(directCost, indirectPercentage, utilityPercentage);
  // Expected: 350 * 1.10 * 1.08 = 415.8
  assertEquals(sellingPrice, 415.8, 'Selling Price of matrix');

  // Test 3: Total Budget Sums
  console.log('\nRunning Test 3: Total Budget Sums...');
  const mockConceptos: PresupuestoConcepto[] = [
    {
      id: 'c1',
      presupuesto_id: 'p1',
      matriz_id: 'm1',
      quantity: 2,
      description: 'Concepto 1',
      unit: 'pza',
      cost_price: 100,
      indirect_percentage: 10,
      utility_percentage: 8
    },
    {
      id: 'c2',
      presupuesto_id: 'p1',
      matriz_id: 'm2',
      quantity: 5,
      description: 'Concepto 2',
      unit: 'pza',
      cost_price: 50,
      indirect_percentage: 15,
      utility_percentage: 10
    }
  ];
  
  const globalIndirect = 12;
  const globalUtility = 10;
  const totals = calculateBudgetTotals(mockConceptos, globalIndirect, globalUtility);
  // Concepto 1: qty = 2, cost = 100 -> direct = 200
  // Concepto 2: qty = 5, cost = 50  -> direct = 250
  // Total Direct = 450
  // Global Indirect = 12% -> 450 * 1.12 = 504.00
  // Global Utility = 10%  -> 504 * 1.10 = 554.40
  assertEquals(totals.directCostTotal, 450, 'Budget Total Direct Cost');
  assertEquals(totals.sellingPriceTotal, 554.4, 'Budget Total Selling Price');

  // Test 4: Parametric Formula Evaluation
  // SEMANTIC: formula result = REND per unit of concept (IS the rendimiento, no further division)
  //   Q = concept's general quantity, used for non-linear/scale-dependent consumption.
  //   calculateMatrixDirectCost returns cost per 1 unit of concept.
  //   Dashboard multiplies by conceptQty exactly ONCE (no double).
  //
  //   Useful patterns:
  //     "2 / Q"       → 2 fixed items spread over total qty (e.g. fixed supervision)
  //     "1/Q + 0.005" → fixed overhead + linear component (economy of scale)
  //     "0.25"        → static yield per unit
  console.log('\nRunning Test 4: Parametric Formula Evaluation (per-unit REND)...');
  const mockInsumosWithFormulas = [
    {
      // Supervisor: 1 fixed supervisor + 0.01 hr/unit → at Q=10: (1/10)+0.01 = 0.11 hr/unit
      insumo: { id: '3', code: 'INS-3', type: 'labor', description: 'Supervisor', unit: 'hr', cost: 100 } as Insumo,
      quantity: 0,
      formula: '1/Q + 0.01'  
    },
    {
      // Material estático: 0.5 por unidad (sin Q)
      insumo: { id: '4', code: 'INS-4', type: 'material', description: 'Material A', unit: 'pza', cost: 20 } as Insumo,
      quantity: 0.5,
      formula: null  // static: 0.5 per unit → cost = 0.5 * 20 = 10
    }
  ];

  // At Q=10:
  //   Supervisor REND = 1/10 + 0.01 = 0.11 hr/unit → cost = 0.11 × 100 = 11
  //   Material  REND = 0.5           → cost = 0.5  × 20  = 10
  //   Unit cost = 21
  const costAt10 = calculateMatrixDirectCost(mockInsumosWithFormulas, 10);
  assertEquals(costAt10, 21, 'Matrix unit cost at Q=10 (parametric formula, no double-mult)');

  // At Q=100:
  //   Supervisor REND = 1/100 + 0.01 = 0.02 hr/unit → cost = 0.02 × 100 = 2
  //   Material  REND = 0.5            → cost = 0.5 × 20  = 10
  //   Unit cost = 12  (economy of scale: supervisor is cheaper per unit at larger Q)
  const costAt100 = calculateMatrixDirectCost(mockInsumosWithFormulas, 100);
  assertEquals(costAt100, 12, 'Matrix unit cost at Q=100 (economy of scale demonstrated)');

  // Test 5: Rounding for "pza" units
  console.log('\nRunning Test 5: Rounding for pza units...');
  const mockInsumosPza = [
    {
      insumo: { id: 'pza-1', code: 'INS-P1', type: 'material', description: 'Insumo Pza 1', unit: 'pza', cost: 100 } as Insumo,
      quantity: 1.4
    }
  ];
  const costPzaQ1 = calculateMatrixDirectCost(mockInsumosPza, 1);
  assertEquals(costPzaQ1, 100, 'Pza unit cost at Q=1 should round 1.4 to 1');

  const costPzaQ5 = calculateMatrixDirectCost(mockInsumosPza, 5);
  assertEquals(costPzaQ5, 140, 'Pza unit cost at Q=5 should scale and round (1.4*5=7) -> 140');

  console.log('\nAll calculations tests passed successfully!');
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('\nTests FAILED:', message);
  process.exit(1);
}
