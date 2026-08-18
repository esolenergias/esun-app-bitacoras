import { IInverterAdapter, DailyProductionResult } from "./index.ts";

export class HoymilesAdapter implements IInverterAdapter {
  private apiUser: string;
  private apiPassword: string;
  private token: string | null = null;
  private baseUrl = 'https://api.hoymiles.com/miles-api';

  constructor(username: string, encrypted_password?: string) {
    this.apiUser = username;
    this.apiPassword = encrypted_password || '';
  }

  async authenticate(): Promise<void> {
    try {
      // POST /auth/login
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: this.apiUser,
          password: this.apiPassword
        })
      });

      if (!response.ok) throw new Error(`Hoymiles API Login failed: ${response.statusText}`);
      
      const data = await response.json();
      if (data.status !== '1') throw new Error("Hoymiles Login Rejected");
      
      this.token = data.data.token;
    } catch (e: any) {
      console.error("Hoymiles Auth Error:", e);
      throw e;
    }
  }

  async getDailyProduction(plantId: string, date: string): Promise<DailyProductionResult> {
    if (!this.token) await this.authenticate();

    try {
      // POST /data/station/daily
      const response = await fetch(`${this.baseUrl}/data/station/daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          station_id: plantId,
          date: date
        })
      });

      if (!response.ok) throw new Error(`Hoymiles API Data failed: ${response.statusText}`);
      
      const data = await response.json();
      
      if (data.status !== '1' || !data.data) {
         return { date, generated_kwh: 0, status_code: 'COMM_ERROR' };
      }

      const generated_kwh = parseFloat(data.data.daily_energy) || 0;
      
      return {
        date,
        generated_kwh,
        status_code: 'OK'
      };

    } catch (e: any) {
      console.error("Hoymiles Fetch Error:", e);
      return { date, generated_kwh: 0, status_code: 'COMM_ERROR' };
    }
  }
}
