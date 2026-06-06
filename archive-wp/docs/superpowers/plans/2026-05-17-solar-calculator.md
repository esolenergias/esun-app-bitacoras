# Smart Solar Calculator (Block 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reactive React-based solar calculator dashboard integrated into WordPress, featuring automatic CFE tariff detection and ROI visualization.

**Architecture:** We will create a new React "island" component. The state will be managed locally in React. Calculation constants (kWh price, DAC threshold, etc.) will be passed from WordPress via a global window object, configurable in the Customizer. We will use a lightweight charting library (like Recharts) for the ROI graph.

**Tech Stack:** React 18, Webpack, PHP (WP Customizer), Vanilla CSS, Recharts

---

### Task 1: Setup WordPress Customizer Settings for Calculator

**Files:**
- Modify: `esolenergias-theme/includes/customizer-b2b.php`

- [ ] **Step 1: Add the Calculator settings section**

Append this code to `esolenergias-theme/includes/customizer-b2b.php` (inside the `esol_customizer_register` scope).

```php
// ══════════════════════════════════════════
// SECCIÓN: COTIZADOR SMART
// ══════════════════════════════════════════
$c->add_section( 'esol_calculator', [
    'title'       => '🧮 Cotizador Smart',
    'panel'       => 'esol_ecommerce',
    'priority'    => 40,
    'description' => 'Configura los valores base para los cálculos del cotizador solar.',
] );

// DAC Threshold
$c->add_setting( 'esol_calc_dac_threshold', [ 'default' => 3000, 'sanitize_callback' => 'absint' ] );
$c->add_control( 'esol_calc_dac_threshold', [
    'label' => 'Límite Tarifa DAC ($ MXN)',
    'section' => 'esol_calculator',
    'type' => 'number',
    'description' => 'Gasto mensual a partir del cual se considera Tarifa de Alto Consumo.'
] );

// Price per kWh (Regular)
$c->add_setting( 'esol_calc_kwh_regular', [ 'default' => 1.5, 'sanitize_callback' => 'floatval' ] );
$c->add_control( 'esol_calc_kwh_regular', [
    'label' => 'Precio kWh Promedio (Regular)',
    'section' => 'esol_calculator',
    'type' => 'number',
    'input_attrs' => [ 'step' => 0.1 ]
] );

// Price per kWh (DAC)
$c->add_setting( 'esol_calc_kwh_dac', [ 'default' => 6.5, 'sanitize_callback' => 'floatval' ] );
$c->add_control( 'esol_calc_kwh_dac', [
    'label' => 'Precio kWh (Tarifa DAC)',
    'section' => 'esol_calculator',
    'type' => 'number',
    'input_attrs' => [ 'step' => 0.1 ]
] );

// Standard Panel Wattage
$c->add_setting( 'esol_calc_panel_w', [ 'default' => 550, 'sanitize_callback' => 'absint' ] );
$c->add_control( 'esol_calc_panel_w', [
    'label' => 'Potencia por Panel (Watts)',
    'section' => 'esol_calculator',
    'type' => 'number'
] );
```

- [ ] **Step 2: Commit**

```bash
git add esolenergias-theme/includes/customizer-b2b.php
git commit -m "feat: add calculator settings to WP customizer"
```

---

### Task 2: Pass Calculator Data to React

**Files:**
- Modify: `esolenergias-theme/header.php`

- [ ] **Step 1: Inject calculator configuration into window.esolCalcData**

Add the configuration object to the `<script>` tag in `header.php`.

```php
// Find window.esolHeroData and append this after or inside a new script tag
window.esolCalcData = {
  dacThreshold: <?php echo (int) get_theme_mod('esol_calc_dac_threshold', 3000); ?>,
  kwhRegular:   <?php echo (float) get_theme_mod('esol_calc_kwh_regular', 1.5); ?>,
  kwhDac:       <?php echo (float) get_theme_mod('esol_calc_kwh_dac', 6.5); ?>,
  panelW:       <?php echo (int) get_theme_mod('esol_calc_panel_w', 550); ?>,
  installationCostPerW: 1.2, // Default for now
  sunHours: 5.2 // Mexico average
};
```

- [ ] **Step 2: Commit**

```bash
git add esolenergias-theme/header.php
git commit -m "feat: pass calculator config from PHP to React"
```

---

### Task 3: Create the Calculator React Components

**Files:**
- Create: `esolenergias-theme/assets/js/src/components/Calculator.jsx`
- Create: `esolenergias-theme/assets/js/src/components/ROIGraph.jsx`

- [ ] **Step 1: Implement the Logic Engine and Main UI**

Create `Calculator.jsx` with basic state for bill amount and roof space.

```jsx
import React, { useState, useMemo } from 'react';
import ROIGraph from './ROIGraph';

const Calculator = () => {
  const config = window.esolCalcData || { dacThreshold: 3000, kwhRegular: 1.5, kwhDac: 6.5, panelW: 550, sunHours: 5.2 };
  
  const [bill, setBill] = useState(2500);
  const [space, setRoofSpace] = useState(20);

  const stats = useMemo(() => {
    const isDac = bill >= config.dacThreshold;
    const rate = isDac ? config.kwhDac : config.kwhRegular;
    const kwhPerMonth = bill / rate;
    const kwpNeeded = kwhPerMonth / (30 * config.sunHours);
    const panelsNeeded = Math.ceil((kwpNeeded * 1000) / config.panelW);
    const investment = kwpNeeded * 1000 * 1.2; // Example cost
    const monthlySaving = bill * 0.95; // 95% saving
    const paybackYears = investment / (monthlySaving * 12);

    return { isDac, panelsNeeded, monthlySaving, paybackYears, investment };
  }, [bill, config]);

  return (
    <div className="calc-container glass-card">
      <h3>Calcula tu Ahorro</h3>
      <div className="calc-grid">
        <div className="inputs">
          <label>Recibo Mensual (MXN): ${bill}</label>
          <input type="range" min="500" max="20000" step="100" value={bill} onChange={e => setBill(Number(e.target.value))} />
          
          <div className="stats-row">
            <div className="stat">
              <span>Paneles:</span>
              <strong>{stats.panelsNeeded}</strong>
            </div>
            <div className="stat">
              <span>Ahorro Mensual:</span>
              <strong className="text-gold">${Math.round(stats.monthlySaving)}</strong>
            </div>
          </div>
        </div>
        <div className="graph-area">
          <ROIGraph investment={stats.investment} annualSaving={stats.monthlySaving * 12} />
        </div>
      </div>
    </div>
  );
};

export default Calculator;
```

- [ ] **Step 2: Implement the Graph Component**

Create `ROIGraph.jsx` (simplified logic for now).

```jsx
import React from 'react';

const ROIGraph = ({ investment, annualSaving }) => {
  // We'll use a simple CSS-based visualization or a small SVG for now
  // to avoid heavy charting libs in the first iteration
  const years = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const data = years.map(y => (y * annualSaving) - investment);
  const max = Math.max(...data, 1000);
  
  return (
    <div className="roi-viz">
      <p className="label">Retorno de Inversión (10 años)</p>
      <div className="bars">
        {data.map((val, i) => (
           <div key={i} className="bar-wrap">
             <div 
               className={`bar ${val >= 0 ? 'positive' : 'negative'}`} 
               style={{ height: `${Math.abs(val / max * 100)}%` }}
             ></div>
             <small>{i+1}y</small>
           </div>
        ))}
      </div>
    </div>
  );
};

export default ROIGraph;
```

---

### Task 4: Integration and Mounting

**Files:**
- Modify: `esolenergias-theme/assets/js/src/index.js`
- Modify: `esolenergias-theme/front-page.php`

- [ ] **Step 1: Add mount point for Calculator**

Update `index.js` to look for `#esol-calc-root`.

```javascript
import Calculator from './components/Calculator';
const calcRoot = document.getElementById('esol-calc-root');
if (calcRoot) {
  ReactDOM.createRoot(calcRoot).render(<Calculator />);
}
```

- [ ] **Step 2: Add HTML in front-page.php**

Find a suitable place in `front-page.php` (e.g., after the "Anteproyecto" section) and add:

```php
<section id="cotizador" class="section sect-bg1">
  <div class="container">
    <div id="esol-calc-root"></div>
  </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add esolenergias-theme/assets/js/src/ esolenergias-theme/front-page.php
git commit -m "feat: integrate solar calculator into homepage"
```
