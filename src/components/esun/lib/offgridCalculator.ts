import type { LoadProfile } from '../esunTypes';
import { SOLAR_CONSTANTS } from './solarConstants';

export interface OffGridSystemParams {
  loadProfile: LoadProfile;
  autonomyDays: number;
  batteryDoD: number; // e.g. 0.8 for Lithium, 0.5 for Lead-Acid
  systemVoltage: 12 | 24 | 48;
  hsp: number; // Horas Solar Pico
  inverterSurgeFactor: number; // e.g. 1.25
  panelWattage: number; // Wattage of chosen panel
}

export interface OffGridSystemResult {
  dailyConsumptionWh: number;
  peakDemandW: number;
  
  // Inverter
  requiredInverterW: number;
  
  // Battery Bank
  requiredBatteryCapacityWh: number;
  requiredBatteryCapacityAh: number;
  
  // PV Array
  requiredArrayWp: number;
  numberOfPanels: number;
}

export function calculateOffGridSystem(params: OffGridSystemParams): OffGridSystemResult {
  const { loadProfile, autonomyDays, batteryDoD, systemVoltage, hsp, inverterSurgeFactor, panelWattage } = params;
  
  const dailyConsumptionWh = loadProfile.daily_Wh;
  const peakDemandW = loadProfile.peak_W;

  // Inverter Sizing
  const requiredInverterW = peakDemandW * inverterSurgeFactor;

  // Battery Bank Sizing
  // Cap = (Daily Wh * Autonomy) / (Voltage * DoD * Inverter Efficiency)
  // Assuming 0.95 inverter efficiency for off-grid
  const inverterEfficiency = 0.95;
  const requiredBatteryCapacityWh = (dailyConsumptionWh * autonomyDays) / (batteryDoD * inverterEfficiency);
  const requiredBatteryCapacityAh = requiredBatteryCapacityWh / systemVoltage;

  // PV Array Sizing
  // Array needs to supply daily load + battery losses
  const batteryEfficiency = 0.9;
  const totalDailyGenerationRequired = dailyConsumptionWh / (inverterEfficiency * batteryEfficiency);
  
  // Power = Energy / HSP
  // Accounting for system losses (wiring, dust, temp) ~ 0.75 global efficiency
  const systemEfficiency = 0.75;
  const requiredArrayWp = totalDailyGenerationRequired / (hsp * systemEfficiency);
  
  const numberOfPanels = Math.ceil(requiredArrayWp / panelWattage);

  return {
    dailyConsumptionWh,
    peakDemandW,
    requiredInverterW,
    requiredBatteryCapacityWh,
    requiredBatteryCapacityAh,
    requiredArrayWp,
    numberOfPanels
  };
}
