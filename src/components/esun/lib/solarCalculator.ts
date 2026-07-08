import { SOLAR_CONSTANTS } from './solarConstants';

export interface SizingInput {
  monthly_kWh: number;
  city: string;
  panel_Wp: number;
  panel_Voc: number;
  inverter_max_vdc: number;
  inverter_kw: number;
  historic_consumptions?: number[];
}

export interface SizingResult {
  system_kWp: number;
  installed_kWp: number;
  num_panels: number;
  panels_per_string: number;
  num_strings: number;
  string_Voc: number;
  is_electrical_safe: boolean;
  area_m2: number;
  annual_production_kWh: number;
  monthly_production_kWh: number;
}

export function calculateSizing(input: SizingInput): SizingResult {
  if (input.panel_Wp <= 0 || input.panel_Voc <= 0 || input.monthly_kWh <= 0 || input.inverter_max_vdc <= 0) {
    return {
      system_kWp: 0,
      installed_kWp: 0,
      num_panels: 0,
      panels_per_string: 0,
      num_strings: 0,
      string_Voc: 0,
      is_electrical_safe: false,
      area_m2: 0,
      annual_production_kWh: 0,
      monthly_production_kWh: 0
    };
  }

  const psh = SOLAR_CONSTANTS.PSH[input.city] || SOLAR_CONSTANTS.PSH['default'];
  const pr = SOLAR_CONSTANTS.PR_DEFAULT;

  // Compute effective monthly kWh from historic list if present to balance yearly seasonality
  let effectiveMonthlyKWh = input.monthly_kWh;
  if (input.historic_consumptions && input.historic_consumptions.length > 0) {
    const sum = input.historic_consumptions.reduce((acc, v) => acc + v, 0);
    // 6 bimonthly periods = 12 months, 12 monthly periods = 12 months
    const isBim = input.historic_consumptions.length <= 6;
    const totalMonths = isBim ? input.historic_consumptions.length * 2 : input.historic_consumptions.length;
    effectiveMonthlyKWh = totalMonths > 0 ? (sum / totalMonths) : input.monthly_kWh;
  }

  // 1. Target kWp sizing with 20% margin
  const system_kWp = (effectiveMonthlyKWh * SOLAR_CONSTANTS.SIZING_MARGIN) / (psh * SOLAR_CONSTANTS.DAYS_IN_MONTH * pr);
  
  // 2. Initial number of panels
  const initial_num_panels = Math.ceil((system_kWp * 1000) / input.panel_Wp);

  // 3. Electrical strings check & Balancing
  const max_panels_per_string = Math.floor(input.inverter_max_vdc / (input.panel_Voc * SOLAR_CONSTANTS.TEMP_COEFF_VOC));
  const num_strings = max_panels_per_string > 0 ? Math.ceil(initial_num_panels / max_panels_per_string) : 0;
  
  // Distribute panels evenly across strings
  const panels_per_string = num_strings > 0 ? Math.ceil(initial_num_panels / num_strings) : 0;
  
  // Adjust num_panels to match balanced configuration (strings * panels_per_string)
  const num_panels = num_strings * panels_per_string;

  const string_Voc = panels_per_string * input.panel_Voc * SOLAR_CONSTANTS.TEMP_COEFF_VOC;
  const is_electrical_safe = max_panels_per_string > 0 && string_Voc <= input.inverter_max_vdc;

  // Calculate actual installed capacity based on balanced panels
  const installed_kWp = (num_panels * input.panel_Wp) / 1000;

  // 4. Area
  const area_m2 = num_panels * SOLAR_CONSTANTS.AREA_PER_PANEL_M2 * SOLAR_CONSTANTS.AREA_SPACING;

  // 5. Production
  const annual_production_kWh = installed_kWp * psh * SOLAR_CONSTANTS.DAYS_IN_YEAR * pr;
  const monthly_production_kWh = annual_production_kWh / 12;

  return {
    system_kWp,
    installed_kWp,
    num_panels,
    panels_per_string,
    num_strings,
    string_Voc,
    is_electrical_safe,
    area_m2,
    annual_production_kWh,
    monthly_production_kWh
  };
}
