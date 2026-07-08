import { SOLAR_CONSTANTS } from './solarConstants';

export interface SizingInput {
  monthly_kWh: number;
  city: string;
  panel_Wp: number;
  panel_Voc: number;
  inverter_max_vdc: number;
  inverter_kw: number;
}

export interface SizingResult {
  system_kWp: number;
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
  const psh = SOLAR_CONSTANTS.PSH[input.city] || SOLAR_CONSTANTS.PSH['default'];
  const pr = SOLAR_CONSTANTS.PR_DEFAULT;

  // 1. Target kWp sizing with 20% margin
  const system_kWp = (input.monthly_kWh * SOLAR_CONSTANTS.SIZING_MARGIN) / (psh * 30 * pr);
  
  // 2. Number of panels
  const num_panels = Math.ceil((system_kWp * 1000) / input.panel_Wp);

  // 3. Electrical strings check
  // Max panels per string based on Voc limit (with 5% cold temperature safe margin)
  const panels_per_string = Math.floor(input.inverter_max_vdc / (input.panel_Voc * 1.05));
  
  const num_strings = panels_per_string > 0 ? Math.ceil(num_panels / panels_per_string) : 0;
  const string_Voc = panels_per_string * input.panel_Voc * 1.05;
  const is_electrical_safe = panels_per_string > 0 && string_Voc < input.inverter_max_vdc;

  // 4. Area
  const area_m2 = num_panels * SOLAR_CONSTANTS.AREA_PER_PANEL_M2 * SOLAR_CONSTANTS.AREA_SPACING;

  // 5. Production
  const annual_production_kWh = system_kWp * psh * 365 * pr;
  const monthly_production_kWh = annual_production_kWh / 12;

  return {
    system_kWp,
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
