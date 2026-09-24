import { IInverterAdapter, DailyProductionResult, DiscoveredPlant } from "./index.ts";

export class GrowattAdapter implements IInverterAdapter {
  private apiUser: string;
  private apiToken: string | null;
  private baseUrl = 'https://openapi.growatt.com/v1';

  constructor(username: string, api_token?: string) {
    this.apiUser = username;
    this.apiToken = api_token || null;
  }

  async authenticate(): Promise<void> {
    if (!this.apiToken) {
      throw new Error("Growatt API requires a valid API token.");
    }
  }

  async listPlants(): Promise<DiscoveredPlant[]> {
    await this.authenticate();

    try {
      // GET /v1/plant/list
      const url = new URL(`${this.baseUrl}/plant/list`);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Token': this.apiToken!
        }
      });

      if (!response.ok) throw new Error(`Growatt plant/list failed: ${response.statusText}`);

      const data = await response.json();
      if (data.error_code !== 0 || !data.data) return [];

      const list = Array.isArray(data.data) ? data.data : data.data.plants || [];

      return list.map((item: any) => ({
        plant_id: String(item.plant_id || item.id),
        plant_name: item.plant_name || item.name || 'Planta Growatt',
        capacity_kwp: parseFloat(item.peak_power || item.nominal_power || 0) || 5.0,
        address: item.city || item.country || '',
        status: 'ACTIVE'
      }));
    } catch (e: any) {
      console.error("Growatt listPlants Error:", e);
      throw e;
    }
  }

  async getDailyProduction(plantId: string, date: string): Promise<DailyProductionResult> {
    await this.authenticate();

    try {
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
