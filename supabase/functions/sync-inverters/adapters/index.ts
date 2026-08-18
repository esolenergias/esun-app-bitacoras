export interface DailyProductionResult {
  date: string; // YYYY-MM-DD
  generated_kwh: number;
  status_code: 'OK' | 'COMM_ERROR' | 'INVERTER_FAULT';
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
}
