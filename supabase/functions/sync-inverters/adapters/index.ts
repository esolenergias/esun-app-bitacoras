export interface DailyProductionResult {
  date: string; // YYYY-MM-DD
  generated_kwh: number;
  status_code: 'OK' | 'COMM_ERROR' | 'INVERTER_FAULT';
}

export interface DiscoveredPlant {
  plant_id: string;
  plant_name: string;
  capacity_kwp: number;
  address?: string;
  status?: string;
}

export interface IInverterAdapter {
  /**
   * Authenticates with the provider's API.
   * Throws an error if authentication fails.
   */
  authenticate(): Promise<void>;

  /**
   * Fetches the daily production for a specific plant.
   * @param plantId The provider's ID for the PV system
   * @param date The date to fetch data for (YYYY-MM-DD)
   */
  getDailyProduction(plantId: string, date: string): Promise<DailyProductionResult>;

  /**
   * Fetches multiple daily production records (history) for a specific plant in batch.
   */
  getMultipleDailyProduction?(plantId: string, collectTimeMs?: number): Promise<DailyProductionResult[]>;

  /**
   * Discovers all PV plants/stations associated with this master account.
   */
  listPlants?(): Promise<DiscoveredPlant[]>;
}
