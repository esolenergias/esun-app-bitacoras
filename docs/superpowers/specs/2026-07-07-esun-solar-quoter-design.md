# Esun — Cotizador Solar Profesional
## Especificación de Diseño
**Fecha**: 2026-07-07 | **Versión**: 1.0 | **Proyecto padre**: eSol Energías

---

## 1. Visión General

**Esun** es un cotizador fotovoltaico profesional integrado al portal eSol. Genera propuestas completas de sistemas solares a partir del recibo de luz CFE del cliente: dimensionamiento eléctrico automático, análisis financiero a 25 años, impacto ambiental y exportación a PDF.

- **Audiencia**: equipo eSol (genera propuestas) + clientes finales (exploran cotización compartida)
- **Acceso**: sección "Esun" en dashboard del portal (arriba de "Presupuestos Esol")
- **Persistencia**: localStorage (fase 1) → Google Drive (fase futura)

---

## 2. Arquitectura

```
src/components/
├── esun/                        ← Módulo independiente
│   ├── EsunPage.tsx             ← Página principal / router interno
│   ├── CFEUploader.tsx          ← Drag & drop + parseo PDF
│   ├── CFEDataForm.tsx          ← Formulario editable con datos detectados
│   ├── SystemProposal.tsx       ← Propuesta automática editable
│   ├── FinancialAnalysis.tsx    ← Análisis financiero y gráficas
│   ├── EnvironmentalImpact.tsx  ← Métricas ambientales
│   ├── ExportPDF.tsx            ← Generación PDF premium
│   ├── QuoteList.tsx            ← Lista de cotizaciones guardadas
│   └── lib/
│       ├── cfeParser.ts         ← Regex patterns para extraer datos CFE
│       ├── solarCalculator.ts   ← Motor de cálculo fotovoltaico
│       ├── financialEngine.ts   ← NPV, ROI, payback, flujos 25 años
│       └── solarConstants.ts    ← Constantes (PSH, CO2, costos)
└── cotizador/                   ← Módulo Presupuestos Esol (existente, no tocar)
```

**Integración**: Portal.tsx agrega tab `esun` en sidebar. Lee insumos de Supabase (paneles, inversores del catálogo Esol).

---

## 3. Módulo 1 — Carga y Parseo del Recibo CFE

### Flujo del usuario
1. Pantalla con zona drag & drop para PDF
2. `pdfjs-dist` extrae texto completo del PDF
3. Regex detecta todos los campos automáticamente
4. Si detectión exitosa → pasa directo al M2 sin confirmación manual
5. Si faltan campos → formulario editable con los detectados pre-llenados

### Campos a extraer
| Campo | Regex | Notas |
|---|---|---|
| Número de servicio | `/Núm.{0,15}Servicio[\s:]+(\d{12})/i` | |
| Tarifa | `/Tarifa[\s:]+([A-Z0-9]+)/i` | Critical |
| Consumo (kWh) | `/Consumo[\s:]+(\d+)\s*kWh/i` | **Input principal** |
| Periodo | `/(\d{2}\/\d{2}\/\d{4})\s*al?\s*(\d{2}\/\d{2}\/\d{4})/` | Detecta bimestral |
| Total a pagar | `/Total a Pagar[\s:]+\$?([\d,]+\.?\d*)/i` | Para tarifa/kWh |
| Demanda (kW) | `/Demanda[\s:]+(\d+\.?\d*)\s*kW/i` | Comercial/Industrial |
| Factor de potencia | `/Factor de Potencia[\s:]+(\d+\.?\d*)/i` | GDMTH |

### Tarifas soportadas
- **Domésticas**: 1, 1A, 1B, 1C, 1D, 1E, 1F
- **DAC**: sin subsidio (~4–6 MXN/kWh efectivo)
- **Comercial BT**: PDBT (≤25kW demanda), GDBT (>25kW)
- **Industrial MT**: GDMTO (tarifa plana), GDMTH (time-of-use: Punta/Intermedio/Base)

> Residencial = bimestral → el parser divide por 2 para obtener kWh mensual automáticamente.

---

## 4. Módulo 2 — Motor de Cálculo Fotovoltaico

### Fórmulas

```typescript
// 1. Sistema (kWp)
const system_kWp = (monthly_kWh * 1.20) / (PSH * 30 * PR);
// PR=0.77, 1.20=margen 20%, PSH=tabla por ciudad

// 2. Número de paneles
const num_panels = Math.ceil(system_kWp * 1000 / panel_Wp);

// 3. Configuración eléctrica — strings
const panels_per_string = Math.floor(inverter_max_vdc / panel_Voc_STC);
const num_strings       = Math.ceil(num_panels / panels_per_string);
const string_Voc        = panels_per_string * panel_Voc_STC * 1.05; // temp correction
// Verificar: string_Voc < inverter_max_vdc ✓

// 4. Inversor del catálogo Esol
// Seleccionar: inverter_kW ≈ system_kWp (DC/AC ratio 1.0–1.25)

// 5. Área requerida
const area_m2 = num_panels * 2.1 * 1.15;  // 2.1m²/panel, 15% espaciado

// 6. Producción anual
const annual_kWh = system_kWp * PSH * 365 * PR;

// 7. Baterías (opcional)
const battery_kWh = (daily_kWh * autonomy_days) / (0.92 * 0.92);
const battery_units = Math.ceil(battery_kWh / battery_unit_kWh);
```

### PSH por ciudad
| Ciudad | PSH | Ciudad | PSH |
|---|---|---|---|
| Hermosillo | 6.3 | Guadalajara | 5.5 |
| Mexicali | 6.0 | CDMX | 5.0 |
| Chihuahua | 5.9 | Cancún | 5.3 |
| Monterrey | 5.5 | Mérida | 5.5 |
| Tijuana | 5.8 | Puebla | 5.3 |
| **Default** | **5.0** | Veracruz | 4.8 |

> Toda la propuesta es **editable manualmente**; recalcula en tiempo real.

---

## 5. Módulo 3 — Motor Financiero y Ambiental

### Financiero

```typescript
// Ahorro anual año 1
const annual_savings_yr1 = Math.min(annual_production_kWh, annual_consumption_kWh)
  * tariff_rate_mxn;

// Proyección 25 años (con escalación CFE 6%/año + degradación 0.5%/año)
const cashflows = Array.from({ length: 25 }, (_, t) =>
  annual_savings_yr1
    * Math.pow(1.06, t)    // CFE escalación
    * Math.pow(0.995, t)   // degradación panel
);

// KPIs
const payback_years = investment_mxn / annual_savings_yr1;
const npv = cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1.10, t+1), -investment_mxn);
const roi_pct = (cashflows.reduce((a,b)=>a+b,0) - investment_mxn) / investment_mxn * 100;
```

### Costo estimado automático (editable)
| Tamaño sistema | MXN/W instalado |
|---|---|
| ≤5 kWp | $17 |
| 5–10 kWp | $15 |
| 10–50 kWp | $14 |
| >50 kWp | $12 |

### Ambiental (acumulado 25 años)
```typescript
const co2_kg   = annual_kWh * 25 * 0.444;   // SEMARNAT 2024: 0.444 kg CO₂/kWh
const trees    = co2_kg / 21.77;              // EPA: 21.77 kg CO₂/árbol/año
const cars     = (co2_kg/1000) / 4.6;         // EPA: 4.6 ton CO₂/auto/año
const coal_ton = (co2_kg/1000) / 2.42;        // factor carbón
```

### Gráficas
1. **Barras**: ahorro acumulado año a año vs inversión inicial
2. **Línea**: pago CFE proyectado sin solar vs con solar (25 años)
3. **Dona**: desglose del costo del sistema
4. **Tarjetas KPI**: Payback · ROI · NPV · CO₂ ahorrado

---

## 6. Módulo 4 — Exportación PDF

### Estructura del reporte (html2pdf.js, mismo estilo Presupuestos Esol)
1. **Portada**: logo eSol, nombre cliente, dirección, fecha, número de cotización
2. **Resumen ejecutivo**: sistema propuesto, kWh anuales, ahorro mensual, payback
3. **Especificaciones técnicas**: tabla paneles/inversor/baterías/estructura + configuración eléctrica
4. **Análisis financiero**: KPIs + tabla flujo 25 años
5. **Impacto ambiental**: CO₂ · árboles · autos · carbón (visual, con íconos)
6. **Condiciones**: garantías, términos (texto configurable)

### Fase futura — Presentación HTML
- `EsunPresentation.tsx` con scroll-triggered animations (Framer Motion)
- Gráficas interactivas, diseñado para proyectar en pantalla con cliente

---

## 7. Persistencia

### Estructura de datos
```typescript
interface EsunQuote {
  id: string;
  created_at: string;
  client_name: string;
  client_address: string;
  city: string;
  cfe_data: {
    tariff: string; monthly_kWh: number; bimonthly_kWh: number;
    total_mxn: number; tariff_rate: number; demand_kw?: number;
    service_number?: string; period_start: string; period_end: string;
  };
  system: {
    kWp: number; num_panels: number; panel_id: string; panel_wp: number;
    num_strings: number; panels_per_string: number;
    inverter_id: string; inverter_kw: number;
    has_battery: boolean; battery_units?: number; battery_kwh_total?: number;
    area_m2: number; annual_production_kWh: number;
    psh: number; pr: number;
  };
  financial: {
    investment_mxn: number; annual_savings_yr1: number;
    payback_years: number; npv: number; roi_pct: number;
    cashflows_25yr: number[];
  };
  environmental: {
    co2_kg_25yr: number; trees_25yr: number;
    cars_25yr: number; coal_ton_25yr: number;
  };
  status: 'draft' | 'sent' | 'approved';
}
// localStorage key: 'esun_quotes' → EsunQuote[]
```

---

## 8. Integración con Presupuestos Esol

### Conexión actual (lectura)
- `solarCalculator.ts` consulta `insumos` de Supabase filtrados por categoría `'Paneles Solares'`, `'Inversores'`, `'Baterías'`, `'Estructuras'`
- Usa el tipo `Insumo` existente de `src/types/cotizador.ts`

### Conexión futura (escritura)
- Botón "Enviar a Presupuesto Esol"
- Crea presupuesto en Supabase con los materiales del sistema dimensionado

---

## 9. Constantes del sistema

```typescript
// src/components/esun/lib/solarConstants.ts
export const SOLAR_CONSTANTS = {
  CO2_FACTOR: 0.444,         // kg CO₂/kWh (SEMARNAT 2024)
  PR_DEFAULT: 0.77,          // Performance Ratio promedio México
  TARIFF_ESCALATION: 0.06,   // 6% anual CFE
  PANEL_DEGRADATION: 0.005,  // 0.5%/año (TOPCon)
  DISCOUNT_RATE: 0.10,       // 10% NPV
  SYSTEM_LIFE: 25,
  DC_AC_RATIO: 1.10,
  CO2_PER_TREE_KG: 21.77,
  CO2_PER_CAR_TONS: 4.6,
  CO2_PER_COAL_TON: 2.42,
  AREA_PER_PANEL_M2: 2.1,
  AREA_SPACING: 1.15,
  SIZING_MARGIN: 1.20,       // 20% margen en kWp
};
```

---

## 10. Roadmap

| Fase | Contenido |
|---|---|
| **v1** (sprint actual) | PDF parsing, motor cálculo, propuesta editable, análisis financiero, export PDF |
| **v2** | Gráficas Recharts, localStorage con lista de cotizaciones, filtros y búsqueda |
| **v3** | Presentación HTML animada, Google Drive sync |
| **v4** | Exportar cotización → Presupuesto Esol (integración bidireccional) |
