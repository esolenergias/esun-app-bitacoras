# Spec Design: Rounding "pza" Unit Quantities to Integer

This specification outlines the changes required to ensure that all concepts and insumos (supplies) with the unit `"pza"` (pieza) are strictly handled as integer quantities. This prevents fractional pieces in both visual representation and financial calculations, resolving discrepancies between displayed quantities and calculated costs.

## Context & Objectives
In the APU (Análisis de Precios Unitarios) and budget editor, some concepts or insumos represent indivisible physical items (e.g., solar panels, inverters, structures). Their unit is `"pza"`.
- When calculating the cost of an insumo, the total required quantity is `conceptQty * yieldPerUnit`. If the result is a decimal (e.g., `5.4 * 2.5 = 13.5`), it must be rounded to an integer (e.g., `14`) so we calculate the cost of full pieces and display full pieces.
- Similarly, concepts whose unit is `"pza"` (e.g. installing a main inverter) must have integer quantities.

## Proposed Changes

### 1. `src/lib/cotizadorService.ts`
- **`calculateMatrixDirectCost`**:
  Adjust the evaluated yield (`qty`) for any insumo with unit `"pza"` (case-insensitive) scaled by `conceptQty`.
  ```typescript
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
  ```
- **`saveMatriz`**:
  When syncing `matriz_insumos`, round `item.quantity` to integer if the unit is `"pza"` and there is no formula.
  ```typescript
  const insumosToUpsert = matriz.insumos.map((item) => {
    const isPza = item.insumo?.unit?.trim().toLowerCase() === 'pza';
    const qty = isPza && !item.formula ? Math.round(Number(item.quantity)) : Number(item.quantity);
    return {
      matriz_id: savedMatrix.id,
      insumo_id: item.insumo.id,
      quantity: qty,
      formula: item.formula || null
    };
  });
  ```

### 2. `src/components/cotizador/PresupuestoDashboardPage.tsx`
- **Concept Creation & Editing**:
  - In `handleAddConceptFromMatrix` and `handleAddCustomConcept`, round the quantity to an integer if the unit is `"pza"`.
  - In the concepts list table, set the `step` of the `NumericInput` to `"1"` if `c.unit === 'pza'`, and round the value in the `onChange` callback before calling `handleUpdateConceptQuantity`.
- **Insumo Aggregation (`aggregatedInsumos`)**:
  - Round the final quantity (`matrixQty * qty`) of any `"pza"` insumo to an integer before multiplying by its cost.
- **Matrix Editor Modal**:
  - In the matrix editor table, calculate the `importe` using the adjusted quantity (rounded to integer for `"pza"` based on the concept quantity).

### 3. `src/components/cotizador/PresupuestosTab.tsx`
- **Concept Editing (`handleUpdateConceptField`)**:
  - Round the quantity value to an integer if the concept unit is `"pza"`.
- **Concept Creation**:
  - Round the quantity to an integer in concept creation functions if the unit is `"pza"`.
- **Insumos Explosion (`getAggregatedInsumos`)**:
  - In the nested loop, round `neededQty = conceptQty * quantityPerUnit` to an integer if `insumo.unit === 'pza'`.

## Verification Plan
1. Edit a budget concept with unit `"pza"` and verify it accepts/updates only whole integers.
2. Edit a matrix containing a `"pza"` unit insumo:
   - Assign a numeric quantity and verify it saves as an integer.
   - Assign a formula that yields a fractional result for the current concept quantity (e.g. `Q * 0.15` for `Q = 10` which yields `1.5`), and verify that the total quantity in the report/dashboard aggregates to a rounded integer (e.g., `2`), and the cost matches `2 * unit cost`.
