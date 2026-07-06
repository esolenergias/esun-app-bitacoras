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

  // Test 4: Revit-like Formula Evaluation
  // SEMANTIC: formula result = yield per 1 unit of concept (REND. per unit)
  // evaluateFormula divides by Q so the result is already per-unit.
  // calculateMatrixDirectCost returns cost per 1 unit of concept.
  // The dashboard then multiplies by the concept's general quantity once.
  console.log('\nRunning Test 4: Revit-like Formula Evaluation...');
  const mockInsumosWithFormulas = [
    {
      insumo: { id: '3', code: 'INS-3', type: 'material', description: 'Insumo 3', unit: 'pza', cost: 10 } as Insumo,
      quantity: 1,
      // Formula Q * 0.5 + 2:
      //   At Q=10 → (10*0.5+2)/10 = 7/10 = 0.7 yield/unit  → cost contrib = 0.7 * 10 = 7
      //   At Q=4  → (4*0.5+2)/4  = 4/4  = 1.0 yield/unit  → cost contrib = 1.0 * 10 = 10
      formula: 'Q * 0.5 + 2'
    },
    {
      insumo: { id: '4', code: 'INS-4', type: 'labor', description: 'Insumo 4', unit: 'jor', cost: 20 } as Insumo,
      quantity: 5,
      formula: null // static yield: 5 per unit → cost contrib = 5 * 20 = 100
    }
  ];
  
  // At Q = 10: 0.7*10 + 5*20 = 7 + 100 = 107
  const costAt10 = calculateMatrixDirectCost(mockInsumosWithFormulas, 10);
  assertEquals(costAt10, 107, 'Matrix Unit Cost at Q=10 (no double-multiply)');

  // At Q = 4: 1.0*10 + 5*20 = 10 + 100 = 110
  const costAt4 = calculateMatrixDirectCost(mockInsumosWithFormulas, 4);
  assertEquals(costAt4, 110, 'Matrix Unit Cost at Q=4 (no double-multiply)');

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
