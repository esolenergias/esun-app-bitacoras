import { SOLAR_CONSTANTS, getSeasonalSolarMultiplier } from './solarConstants';
import type { CFEHistoricPeriod } from './cfeParser';

export interface FinancialInput {
  system_kWp: number;
  installed_kWp: number;
  annual_production_kWh: number;
  monthly_consumption_kWh: number;
  tariff_rate_mxn: number; // Cost per kWh
  custom_cost?: number;    // Manual system price override
  custom_min_fee?: number; // Manual CFE minimum connection fee override
  historic_periods?: CFEHistoricPeriod[];
  is_bimonthly?: boolean;
  tariff_name?: string;
  demand_kw?: number;
}

export function calculateCFEMinimumFee(params: {
  tariff_name?: string;
  is_bimonthly?: boolean;
  tariff_rate_mxn: number;
  demand_kw?: number;
  custom_min_fee?: number;
}): number {
  if (params.custom_min_fee !== undefined && params.custom_min_fee >= 0) {
    return params.custom_min_fee;
  }

  const t = (params.tariff_name || '').toUpperCase().trim();
  const isBim = params.is_bimonthly ?? true;

  // 1. GDMTO / GDMTH (Gran Demanda Media Tensión Ordinaria/Horaria)
  // Fórmula CRE/CFE: (Cargo Fijo Suministro $520 + (Demanda Facturable kW * Cargo Capacidad $180)) * 1.16 IVA
  if (t.includes('GDMTO') || t.includes('GDMTH') || t.includes('DISTRIBUCION')) {
    const fixedSupplyMonthly = 520.00; // Cargo fijo suministro mensual CFE
    const demandKw = params.demand_kw && params.demand_kw > 0 ? params.demand_kw : 0;
    const capacityCostPerKw = 180.00; // Cargo promedio distribución/capacidad $/kW
    const minMonthlyNoTax = fixedSupplyMonthly + (demandKw * capacityCostPerKw);
    const minMonthlyWithTax = minMonthlyNoTax * 1.16;
    return Math.round(isBim ? minMonthlyWithTax * 2 : minMonthlyWithTax);
  }

  // 2. Tarifa DAC (Doméstica de Alto Consumo)
  // Fórmula CRE/CFE: (Cargo Fijo Mensual $130.90 + 25 kWh * Precio kWh DAC $6.50) * 1.16 IVA
  if (t.includes('DAC')) {
    const dacFixedMonthly = 130.90;
    const minKwhMonthly = 25;
    const dacKwhRate = params.tariff_rate_mxn > 0 ? params.tariff_rate_mxn : 6.50;
    const minMonthlyNoTax = dacFixedMonthly + (minKwhMonthly * dacKwhRate);
    const minMonthlyWithTax = minMonthlyNoTax * 1.16;
    return Math.round(isBim ? minMonthlyWithTax * 2 : minMonthlyWithTax);
  }

  // 3. Tarifa PDBT (Pequeña Demanda Baja Tensión - Comercial hasta 25 kW)
  // Fórmula CRE/CFE: (Cargo Fijo Suministro Básico $75.00/mes) * 1.16 IVA
  if (t.includes('PDBT') || t.includes('COMERCIAL')) {
    const pdbtFixedMonthly = 75.00 * 1.16; // ~$87 MXN/mes
    return Math.round(isBim ? pdbtFixedMonthly * 2 : pdbtFixedMonthly);
  }

  // 4. Tarifas Domésticas Subsidiadas (Tarifas 01, 1A, 1B, 1C, 1D, 1E, 1F, PDBT Residencial)
  // Fórmula CRE/CFE: (Cargo Fijo Suministro $32.50/mes + 25 kWh/mes * Tarifa Base $1.02) * 1.16 IVA
  const minKwhMonthly = 25;
  const isBimonthlyMult = isBim ? 2 : 1;
  const fixedSuministroMonthly = 32.50;
  const baseRateKwh = params.tariff_rate_mxn > 0 ? Math.min(params.tariff_rate_mxn, 1.05) : 1.02;
  
  const minMonthlyNoTax = fixedSuministroMonthly + (minKwhMonthly * baseRateKwh);
  const minMonthlyWithTax = minMonthlyNoTax * 1.16;

  return Math.round(minMonthlyWithTax * isBimonthlyMult);
}

export interface MonthlyBreakdownItem {
  month: string;
  kwh: number;
  original_mxn: number;
  new_mxn: number;
  savings_mxn: number;
}

export interface TariffConceptBreakdown {
  supply: number;
  distribution: number;
  transmission: number;
  cenace: number;
  energy: number;
  capacity: number;
  scnmem: number;
  low_voltage: number;
  taxes: number;
}

export interface FinancialResult {
  investment_mxn: number;
  annual_savings_yr1: number;
  annual_savings_usd: number;
  daily_generation_kWh: number;
  daily_co2_kg: number;
  payback_years: number;
  npv: number;
  roi_pct: number;
  cashflows_25yr: number[];
  co2_saved_kg_25yr: number;
  trees_equivalent: number;
  cars_equivalent: number;
  coal_equivalent_tons: number;
  monthly_breakdown: MonthlyBreakdownItem[];
  tariff_concept_breakdown: TariffConceptBreakdown;
  calculated_min_fee: number;
}

export function calculateFinancials(input: FinancialInput): FinancialResult {
  if (input.installed_kWp <= 0 || input.annual_production_kWh <= 0) {
    return {
      investment_mxn: input.custom_cost || 0,
      annual_savings_yr1: 0,
      annual_savings_usd: 0,
      daily_generation_kWh: 0,
      daily_co2_kg: 0,
      payback_years: 99,
      npv: 0,
      roi_pct: 0,
      cashflows_25yr: Array(25).fill(0),
      co2_saved_kg_25yr: 0,
      trees_equivalent: 0,
      cars_equivalent: 0,
      coal_equivalent_tons: 0,
      monthly_breakdown: [],
      tariff_concept_breakdown: {
        supply: 0, distribution: 0, transmission: 0, cenace: 0,
        energy: 0, capacity: 0, scnmem: 0, low_voltage: 0, taxes: 0
      },
      calculated_min_fee: 0
    };
  }
  // 1. Calculate investment cost based on installed size if not custom overridden
  let costPerWatt = SOLAR_CONSTANTS.COST_PER_W_MXN.small;
  const size = input.installed_kWp; // Use installed size for cost
  if (size > 50) {
    costPerWatt = SOLAR_CONSTANTS.COST_PER_W_MXN.industrial;
  } else if (size > 10) {
    costPerWatt = SOLAR_CONSTANTS.COST_PER_W_MXN.commercial;
  } else if (size > 5) {
    costPerWatt = SOLAR_CONSTANTS.COST_PER_W_MXN.medium;
  }
  const investment_mxn = input.custom_cost ?? (size * 1000 * costPerWatt);

  // 2. Year 1 savings & Daily Generation
  const annual_consumption = input.monthly_consumption_kWh * 12;
  const annual_savings_yr1 = Math.min(input.annual_production_kWh, annual_consumption) * input.tariff_rate_mxn;
  const annual_savings_usd = annual_savings_yr1 / 18.5;
  const daily_generation_kWh = input.annual_production_kWh / 365;

  // 3. Cashflows over 25 years with CFE inflation escalation and panel degradation
  const cashflows_25yr: number[] = [];
  let cumulative_savings = 0;
  for (let yr = 1; yr <= SOLAR_CONSTANTS.SYSTEM_LIFE; yr++) {
    const savings = annual_savings_yr1
      * Math.pow(1 + SOLAR_CONSTANTS.TARIFF_ESCALATION, yr - 1)
      * Math.pow(1 - SOLAR_CONSTANTS.PANEL_DEGRADATION, yr - 1);
    cashflows_25yr.push(savings);
    cumulative_savings += savings;
  }

  // 4. Payback years (simple)
  const payback_years = annual_savings_yr1 > 0 ? investment_mxn / annual_savings_yr1 : 99;

  // 5. NPV
  let npv = -investment_mxn;
  cashflows_25yr.forEach((cf, t) => {
    npv += cf / Math.pow(1 + SOLAR_CONSTANTS.DISCOUNT_RATE, t + 1);
  });

  // 6. ROI percentage
  const roi_pct = investment_mxn > 0 ? ((cumulative_savings - investment_mxn) / investment_mxn) * 100 : 0;

  // 7. Environmental Metrics
  const total_production_25yr = input.annual_production_kWh * SOLAR_CONSTANTS.SYSTEM_LIFE;
  const co2_saved_kg_25yr = total_production_25yr * SOLAR_CONSTANTS.CO2_FACTOR;
  const daily_co2_kg = (input.annual_production_kWh * SOLAR_CONSTANTS.CO2_FACTOR) / 365;
  const trees_equivalent = co2_saved_kg_25yr / SOLAR_CONSTANTS.CO2_PER_TREE_KG;
  const cars_equivalent = (co2_saved_kg_25yr / 1000) / SOLAR_CONSTANTS.CO2_PER_CAR_TONS;
  const coal_equivalent_tons = (co2_saved_kg_25yr / 1000) / SOLAR_CONSTANTS.CO2_PER_COAL_TON;

  // 8. Dynamic CFE Minimum Fee Calculation based on Tariff formulas
  const min_fee = calculateCFEMinimumFee({
    tariff_name: input.tariff_name,
    is_bimonthly: input.is_bimonthly,
    tariff_rate_mxn: input.tariff_rate_mxn,
    demand_kw: input.demand_kw,
    custom_min_fee: input.custom_min_fee
  });

  // 9. Monthly Breakdown Table (Use real historic CFE periods if available, or fallback to 12 months)
  let monthly_breakdown: MonthlyBreakdownItem[] = [];

  if (input.historic_periods && input.historic_periods.length > 0) {
    const numPeriods = input.historic_periods.length;
    const baseProdPerPeriod = input.annual_production_kWh / numPeriods;

    monthly_breakdown = input.historic_periods.map((period, idx) => {
      const kwh = period.kwh;
      const original_mxn = period.amount;
      
      // Aplicación de estacionalidad solar por mes/bimestre (lluvias, temperatura, ángulo cenital)
      const seasonalMultiplier = getSeasonalSolarMultiplier(period.period, idx);
      const prodPerPeriod = baseProdPerPeriod * seasonalMultiplier;

      const residual_kwh = Math.max(0, kwh - prodPerPeriod);
      
      const effective_rate = kwh > 0 ? (original_mxn / kwh) : input.tariff_rate_mxn;
      const new_mxn = Math.max(min_fee, residual_kwh * effective_rate);
      const savings_mxn = Math.max(0, original_mxn - new_mxn);

      return {
        month: period.period,
        kwh,
        original_mxn,
        new_mxn,
        savings_mxn
      };
    });
  } else {
    const monthNames = ['JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO'];
    const baseMonthlyProd = input.annual_production_kWh / 12;
    monthly_breakdown = monthNames.map((month, idx) => {
      const kwh = input.monthly_consumption_kWh;
      const original_mxn = kwh * input.tariff_rate_mxn;
      
      const seasonalMultiplier = getSeasonalSolarMultiplier(month, idx);
      const monthly_prod = baseMonthlyProd * seasonalMultiplier;

      const residual_kwh = Math.max(0, kwh - monthly_prod);
      const new_mxn = Math.max(min_fee, residual_kwh * input.tariff_rate_mxn);
      const savings_mxn = Math.max(0, original_mxn - new_mxn);

      return {
        month,
        kwh,
        original_mxn,
        new_mxn,
        savings_mxn
      };
    });
  }

  // 9. Tariff Concept Breakdown (CFE components approximation)
  const total_bill = input.monthly_consumption_kWh * input.tariff_rate_mxn;
  const tariff_concept_breakdown: TariffConceptBreakdown = {
    supply: total_bill * 0.05,        // Suministro ~5%
    distribution: total_bill * 0.15,  // Distribución ~15%
    transmission: total_bill * 0.10,  // Transmisión ~10%
    cenace: total_bill * 0.02,        // CENACE ~2%
    energy: total_bill * 0.45,        // Energía ~45%
    capacity: total_bill * 0.12,      // Capacidad ~12%
    scnmem: total_bill * 0.01,        // SCnMEM ~1%
    low_voltage: total_bill * 0.02,   // 2% Baja Tensión
    taxes: total_bill * 0.08          // DAP / Impuestos ~8%
  };

  return {
    investment_mxn,
    annual_savings_yr1,
    annual_savings_usd,
    daily_generation_kWh,
    daily_co2_kg,
    payback_years,
    npv,
    roi_pct,
    cashflows_25yr,
    co2_saved_kg_25yr,
    trees_equivalent,
    cars_equivalent,
    coal_equivalent_tons,
    monthly_breakdown,
    tariff_concept_breakdown
  };
}
