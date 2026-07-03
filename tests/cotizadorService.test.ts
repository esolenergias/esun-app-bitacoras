import {
  calculateMatrixDirectCost,
  calculateMatrixSellingPrice,
  calculateBudgetTotals
} from '../src/lib/cotizadorService';
import { Insumo, PresupuestoConcepto } from '../src/types/cotizador';

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

  // Test 2: Selling Price of a Matrix
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
  
  const totals = calculateBudgetTotals(mockConceptos);
  // Concepto 1: qty = 2, cost = 100, indirect = 10%, utility = 8%
  // unit direct = 100, unit selling = 100 * 1.1 * 1.08 = 118.8
  // total direct = 2 * 100 = 200, total selling = 2 * 118.8 = 237.6
  //
  // Concepto 2: qty = 5, cost = 50, indirect = 15%, utility = 10%
  // unit direct = 50, unit selling = 50 * 1.15 * 1.10 = 63.25
  // total direct = 5 * 50 = 250, total selling = 5 * 63.25 = 316.25
  //
  // Totals:
  // direct = 200 + 250 = 450
  // selling = 237.6 + 316.25 = 553.85
  assertEquals(totals.directCostTotal, 450, 'Budget Total Direct Cost');
  assertEquals(totals.sellingPriceTotal, 553.85, 'Budget Total Selling Price');

  console.log('\nAll calculations tests passed successfully!');
}

try {
  runTests();
  process.exit(0);
} catch (error: any) {
  console.error('\nTests FAILED:', error.message);
  process.exit(1);
}
