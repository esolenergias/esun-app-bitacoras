export type InverterBrand = 'Huawei' | 'Growatt' | 'Hoymiles';

export interface InverterAccount {
  id: string;
  client_id?: string;
  brand: InverterBrand;
  username: string;
  encrypted_password?: string;
  api_token?: string;
  technician_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PVSystem {
  id: string;
  account_id: string;
  plant_id: string;
  plant_name: string;
  capacity_kwp: number;
  cfe_tariff?: string;
  client_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DiscoveredPlant {
  plant_id: string;
  plant_name: string;
  capacity_kwp: number;
  address?: string;
  status?: string;
  already_registered?: boolean;
}

export interface ProductionLog {
  id: string;
  system_id: string;
  date: string;           // YYYY-MM-DD
  generated_kwh: number;
  estimated_consumption_kwh?: number;
  status_code?: 'OK' | 'COMM_ERROR' | 'INVERTER_FAULT';
  created_at?: string;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MonitoringAlert {
  id: string;
  system_id: string;
  severity: AlertSeverity;
  ai_description: string;
  ai_recommendation: string;
  is_resolved: boolean;
  created_at?: string;
  resolved_at?: string;
}

/** Returned by getAggregatedProduction */
export interface DailyAggregated {
  date: string;
  total_kwh: number;
}

/** Sistema Fotovoltaico con Salud y Métricas Extendidas */
export interface PVSystemWithHealth extends PVSystem {
  healthScore: number;         // 0 - 100
  healthStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  recentKwh30Days: number;
  estimatedSavingsMxn: number; // Ahorro estimado CFE en MXN
  unresolvedAlertsCount: number;
  lastLogDate?: string;
  brand?: InverterBrand;
  accountUsername?: string;
  
  // Métricas Oficiales de API FusionSolar / Inversores
  kwhToday?: number;          // Rendimiento de Hoy (kWh)
  kwhMonth?: number;          // Rendimiento Este Mes (kWh)
  kwhYear?: number;           // Energía Anual (kWh)
  kwhTotal?: number;          // Rendimiento Total Acumulado (kWh/MWh)
  currentPowerKw?: number;    // Potencia Actual en Tiempo Real (kW)
  realPlantStatus?: string;   // Estado de la planta (Normal, Alarma, Desconectado)
}

/** Tarifas CFE estimadas promedio en MXN por kWh */
export const CFE_TARIFF_RATES: Record<string, number> = {
  '1': 1.15,
  '1A': 1.25,
  '1B': 1.35,
  '1C': 1.45,
  'DAC': 5.80,    // Tarifa Doméstica de Alto Consumo
  'PDBT': 4.10,   // Pequeña Demanda Baja Tensión
  'GDMTO': 3.45,  // Gran Demanda Media Tensión Ordinaria
};
