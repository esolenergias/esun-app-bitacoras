import { SOLAR_CONSTANTS } from './solarConstants';

export interface FinancialInput {
  system_kWp: number;
  installed_kWp: number;
  annual_production_kWh: number;
  monthly_consumption_kWh: number;
  tariff_rate_mxn: number; // Cost per kWh
  custom_cost?: number;    // Manual system price override
}

export interface FinancialResult {
  investment_mxn: number;
  annual_savings_yr1: number;
  payback_years: number;
  npv: number;
  roi_pct: number;
  cashflows_25yr: number[];
  co2_saved_kg_25yr: number;
  trees_equivalent: number;
  cars_equivalent: number;
  coal_equivalent_tons: number;
}

export function calculateFinancials(input: FinancialInput): FinancialResult {
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

  // 2. Year 1 savings
  const annual_consumption = input.monthly_consumption_kWh * 12;
  const annual_savings_yr1 = Math.min(input.annual_production_kWh, annual_consumption) * input.tariff_rate_mxn;

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
  const trees_equivalent = co2_saved_kg_25yr / SOLAR_CONSTANTS.CO2_PER_TREE_KG;
  const cars_equivalent = (co2_saved_kg_25yr / 1000) / SOLAR_CONSTANTS.CO2_PER_CAR_TONS;
  const coal_equivalent_tons = (co2_saved_kg_25yr / 1000) / SOLAR_CONSTANTS.CO2_PER_COAL_TON;

  return {
    investment_mxn,
    annual_savings_yr1,
    payback_years,
    npv,
    roi_pct,
    cashflows_25yr,
    co2_saved_kg_25yr,
    trees_equivalent,
    cars_equivalent,
    coal_equivalent_tons
  };
}
