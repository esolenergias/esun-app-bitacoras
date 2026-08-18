import { IInverterAdapter, DailyProductionResult } from "./index.ts";

export class HuaweiAdapter implements IInverterAdapter {
  private apiUser: string;
  private apiPassword: string; // The OpenAPI signature or password
  private token: string | null = null;
  private baseUrl = 'https://intl.fusionsolar.huawei.com/thirdData';

  constructor(username: string, encrypted_password?: string) {
    this.apiUser = username;
    this.apiPassword = encrypted_password || '';
  }

  async authenticate(): Promise<void> {
    // Implementación real según la documentación OpenAPI de Huawei:
    // POST /thirdData/login
    // Body: { "userName": this.apiUser, "systemCode": this.apiPassword }
    
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: this.apiUser,
          systemCode: this.apiPassword
        })
      });

      if (!response.ok) throw new Error(`Huawei API Login failed: ${response.statusText}`);
      
      // Huawei returns XSRF-TOKEN in headers
      const xsrfToken = response.headers.get('xsrf-token');
      if (!xsrfToken) throw new Error("No xsrf-token returned from Huawei");
      
      this.token = xsrfToken;
    } catch (e: any) {
      console.error("Huawei Auth Error:", e);
      throw e;
    }
  }

  async getDailyProduction(plantId: string, date: string): Promise<DailyProductionResult> {
    if (!this.token) await this.authenticate();

    try {
      // POST /thirdData/getKpiStationDay
      const response = await fetch(`${this.baseUrl}/getKpiStationDay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xsrf-token': this.token!
        },
        body: JSON.stringify({
          stationCodes: plantId,
          collectTime: new Date(date).getTime()
        })
      });

      if (!response.ok) throw new Error(`Huawei API Data failed: ${response.statusText}`);
      
      const data = await response.json();
      
      if (!data || !data.data || data.data.length === 0) {
         return { date, generated_kwh: 0, status_code: 'COMM_ERROR' };
      }

      // Supongamos que data.data[0].productPower contiene la energía en kWh
      const generated_kwh = data.data[0].dataItemMap.productPower || 0;
      
      return {
        date,
        generated_kwh,
        status_code: 'OK'
      };

    } catch (e: any) {
      console.error("Huawei Fetch Error:", e);
      return { date, generated_kwh: 0, status_code: 'COMM_ERROR' };
    }
  }
}
