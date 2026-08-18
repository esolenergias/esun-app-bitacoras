import { IInverterAdapter, DailyProductionResult } from "./index.ts";

export class GrowattAdapter implements IInverterAdapter {
  private apiUser: string;
  private apiToken: string | null;
  private baseUrl = 'https://openapi.growatt.com/v1';

  constructor(username: string, api_token?: string) {
    this.apiUser = username;
    this.apiToken = api_token || null;
  }

  async authenticate(): Promise<void> {
    // Growatt OpenAPI typically requires passing the token in the headers
    // If we only have username/password, we would hit the login endpoint here.
    // For OpenAPI, the token provided by Growatt is usually sufficient.
    if (!this.apiToken) {
      throw new Error("Growatt API requires a valid API token.");
    }
  }

  async getDailyProduction(plantId: string, date: string): Promise<DailyProductionResult> {
    await this.authenticate();

    try {
      // GET /v1/plant/energy
      // Parameters usually: plant_id, date
      const url = new URL(`${this.baseUrl}/plant/energy`);
      url.searchParams.append('plant_id', plantId);
      url.searchParams.append('date', date);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Token': this.apiToken!
        }
      });

      if (!response.ok) throw new Error(`Growatt API Data failed: ${response.statusText}`);
      
      const data = await response.json();
      
      if (data.error_code !== 0 || !data.data) {
         return { date, generated_kwh: 0, status_code: 'COMM_ERROR' };
      }

      const generated_kwh = parseFloat(data.data.energy) || 0;
      
      return {
        date,
        generated_kwh,
        status_code: 'OK'
      };

    } catch (e: any) {
      console.error("Growatt Fetch Error:", e);
      return { date, generated_kwh: 0, status_code: 'COMM_ERROR' };
    }
  }
}
