import { IInverterAdapter, DailyProductionResult, DiscoveredPlant } from "./index.ts";

export interface PeriodKpiRecord {
  periodKey: string; // e.g. "09:00" (hour), "2026-08-01" (day), "2026-08" (month), "2026" (year)
  label: string;     // display label
  kwh: number;       // real kWh generated
}

export class HuaweiAdapter implements IInverterAdapter {
  private apiUser: string;
  private apiPassword: string;
  public token: string | null = null;
  private baseUrl = 'https://la5.fusionsolar.huawei.com/thirdData';
  public onTokenUpdate?: (token: string) => Promise<void>;

  constructor(username: string, encrypted_password?: string, api_token?: string) {
    this.apiUser = username;
    this.apiPassword = encrypted_password || '';
    if (api_token && api_token.trim().length > 10) {
      this.token = api_token.trim();
    }
  }

  async authenticate(): Promise<void> {
    if (this.token) {
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: this.apiUser,
          systemCode: this.apiPassword
        })
      });

      if (!response.ok) {
        throw new Error(`Huawei API Login HTTP error: ${response.status} ${response.statusText}`);
      }

      const body = await response.json();

      if (body?.failCode === 407) {
        console.warn("Huawei rate limit (407). Waiting 5s and retrying...");
        await new Promise(r => setTimeout(r, 5000));
        return this.authenticate();
      }

      if (!body?.success && body?.failCode !== 0) {
        throw new Error(`Huawei Login failed: failCode=${body?.failCode} data=${body?.data}`);
      }

      const xsrfToken = response.headers.get('xsrf-token');
      if (!xsrfToken) {
        throw new Error("No xsrf-token returned from Huawei login response headers");
      }

      this.token = xsrfToken;
      if (this.onTokenUpdate) {
        await this.onTokenUpdate(xsrfToken).catch((err: any) => console.warn("Failed saving token to DB:", err.message));
      }
    } catch (e: any) {
      console.error("Huawei Auth Error (LA5):", e.message);
      throw e;
    }
  }

  async postRequestPublic(endpoint: string, payload: any): Promise<any> {
    return this.postRequest(endpoint, payload);
  }

  private async postRequest(endpoint: string, payload: any, isRetry = false): Promise<any> {
    if (!this.token) await this.authenticate();

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xsrf-token': this.token!
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Huawei API ${endpoint} HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data?.failCode === 305 || data?.message === 'USER_MUST_RELOGIN') {
      if (isRetry) throw new Error(`Huawei session expired even after re-login (${endpoint})`);
      console.log("Huawei session expired (305), renewing token...");
      this.token = null;
      await this.authenticate();
      return this.postRequest(endpoint, payload, true);
    }

    if (data?.failCode === 407) {
      if (isRetry) throw new Error(`Huawei still rate-limited after wait (${endpoint})`);
      console.warn("Huawei rate limit on endpoint, waiting 2s...");
      await new Promise(r => setTimeout(r, 2000));
      return this.postRequest(endpoint, payload, true);
    }

    return data;
  }

  async listPlants(): Promise<DiscoveredPlant[]> {
    try {
      const data = await this.postRequest('getStationList', { pageNo: 1, pageSize: 100 });

      if (!data?.data?.list) return [];

      return data.data.list.map((item: any) => {
        let cap = parseFloat(item.capacity || item.installedCapacity || 0);
        if (cap > 0 && cap < 0.5) {
          cap = Math.round(cap * 1000 * 100) / 100;
        }
        if (cap <= 0) cap = 5.0;

        return {
          plant_id: item.stationCode || item.plantCode || String(item.id),
          plant_name: item.stationName || item.plantName || 'Planta Huawei',
          capacity_kwp: cap,
          address: item.stationAddr || item.plantAddress || '',
          status: item.buildState || 'ACTIVE'
        };
      });
    } catch (e: any) {
      console.error("Huawei listPlants Error (LA5):", e.message);
      throw e;
    }
  }

  /**
   * Resumen en tiempo real (FusionSolar API):
   * day_power (Hoy), month_power (Mes), total_power (Total), real_health_state
   */
  async getRealKpi(plantId: string): Promise<{
    day_power: number;
    month_power: number;
    total_power: number;
    real_health_state: number;
  }> {
    try {
      const data = await this.postRequest('getStationRealKpi', {
        stationCodes: plantId,
        collectTime: Date.now()
      });

      const station = data?.data?.find((s: any) => s.stationCode === plantId);
      if (!station?.dataItemMap) {
        return { day_power: 0, month_power: 0, total_power: 0, real_health_state: 1 };
      }

      const map = station.dataItemMap;
      return {
        day_power: parseFloat(map.day_power ?? 0) || 0,
        month_power: parseFloat(map.month_power ?? 0) || 0,
        total_power: parseFloat(map.total_power ?? 0) || 0,
        real_health_state: parseInt(map.real_health_state ?? 1)
      };
    } catch (e: any) {
      console.error(`Huawei getRealKpi Error (${plantId}):`, e.message);
      return { day_power: 0, month_power: 0, total_power: 0, real_health_state: 1 };
    }
  }

  /**
   * Energía Anual del año en curso
   */
  async getYearKpi(plantId: string): Promise<number> {
    try {
      const data = await this.postRequest('getKpiStationYear', {
        stationCodes: plantId,
        collectTime: Date.now()
      });

      if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
        return 0;
      }

      const last = data.data[data.data.length - 1];
      const map = last.dataItemMap || {};
      const kwh = map.inverter_power ?? map.inverterYield ?? map.PVYield ?? map.use_power ?? 0;
      return parseFloat(kwh) || 0;
    } catch (e: any) {
      console.error(`Huawei getYearKpi Error (${plantId}):`, e.message);
      return 0;
    }
  }

  /**
   * 1. PERIODO DIARIO (Día): 24 horas del día de hoy en kWh (getKpiStationHour)
   * Formateado en zona horaria America/Mexico_City para alinear horas exactas
   */
  async getHourlyKpi(plantId: string): Promise<PeriodKpiRecord[]> {
    try {
      const data = await this.postRequest('getKpiStationHour', {
        stationCodes: plantId,
        collectTime: Date.now()
      });

      if (!data?.data || !Array.isArray(data.data)) return [];

      const formatter = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return data.data.map((item: any) => {
        const map = item.dataItemMap || {};
        const raw = map.inverter_power ?? map.inverterYield ?? map.PVYield ?? map.use_power ?? map.day_power ?? 0;
        const kwh = Math.round((parseFloat(raw) || 0) * 100) / 100;
        
        let label = '00:00';
        if (item.collectTime) {
          label = formatter.format(new Date(item.collectTime));
        }

        return {
          periodKey: label,
          label,
          kwh
        };
      });
    } catch (e: any) {
      console.error(`Huawei getHourlyKpi Error (${plantId}):`, e.message);
      return [];
    }
  }

  /**
   * 2. PERIODO MENSUAL (Mes): Días del mes en kWh (getKpiStationDay)
   */
  async getDailyKpi(plantId: string): Promise<PeriodKpiRecord[]> {
    try {
      const data = await this.postRequest('getKpiStationDay', {
        stationCodes: plantId,
        collectTime: Date.now()
      });

      if (!data?.data || !Array.isArray(data.data)) return [];

      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      return data.data.map((item: any) => {
        const map = item.dataItemMap || {};
        const raw = map.inverter_power ?? map.inverterYield ?? map.PVYield ?? map.use_power ?? map.day_power ?? 0;
        const kwh = Math.round((parseFloat(raw) || 0) * 100) / 100;
        
        let label = '';
        let periodKey = '';
        if (item.collectTime) {
          periodKey = formatter.format(new Date(item.collectTime)); // YYYY-MM-DD
          label = String(parseInt(periodKey.substring(8, 10), 10)); // Día: 1, 2, 3...
        }

        return {
          periodKey,
          label,
          kwh
        };
      });
    } catch (e: any) {
      console.error(`Huawei getDailyKpi Error (${plantId}):`, e.message);
      return [];
    }
  }

  /**
   * 3. PERIODO ANUAL (Año): Meses del año en kWh (getKpiStationMonth)
   */
  async getMonthlyKpi(plantId: string): Promise<PeriodKpiRecord[]> {
    try {
      const data = await this.postRequest('getKpiStationMonth', {
        stationCodes: plantId,
        collectTime: Date.now()
      });

      if (!data?.data || !Array.isArray(data.data)) return [];

      const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
      });

      return data.data.map((item: any) => {
        const map = item.dataItemMap || {};
        const raw = map.inverter_power ?? map.inverterYield ?? map.PVYield ?? map.use_power ?? 0;
        const kwh = Math.round((parseFloat(raw) || 0) * 100) / 100;
        
        let label = '';
        let periodKey = '';
        if (item.collectTime) {
          periodKey = formatter.format(new Date(item.collectTime)); // YYYY-MM
          const mIdx = parseInt(periodKey.substring(5, 7), 10) - 1;
          label = MONTH_NAMES[mIdx] || String(mIdx + 1);
        }

        return {
          periodKey,
          label,
          kwh
        };
      });
    } catch (e: any) {
      console.error(`Huawei getMonthlyKpi Error (${plantId}):`, e.message);
      return [];
    }
  }

  /**
   * 4. PERIODO TOTAL (Vida Útil): Años históricos en kWh (getKpiStationYear)
   */
  async getYearlyKpi(plantId: string): Promise<PeriodKpiRecord[]> {
    try {
      const data = await this.postRequest('getKpiStationYear', {
        stationCodes: plantId,
        collectTime: Date.now()
      });

      if (!data?.data || !Array.isArray(data.data)) return [];

      return data.data.map((item: any) => {
        const map = item.dataItemMap || {};
        const raw = map.inverter_power ?? map.inverterYield ?? map.PVYield ?? map.use_power ?? 0;
        const kwh = Math.round((parseFloat(raw) || 0) * 100) / 100;
        
        let label = '';
        if (item.collectTime) {
          const d = new Date(item.collectTime);
          label = String(d.getFullYear());
        }

        return {
          periodKey: label,
          label,
          kwh
        };
      });
    } catch (e: any) {
      console.error(`Huawei getYearlyKpi Error (${plantId}):`, e.message);
      return [];
    }
  }

  async getMultipleDailyProduction(plantId: string, collectTimeMs?: number): Promise<DailyProductionResult[]> {
    const dailyRecords = await this.getDailyKpi(plantId);
    return dailyRecords.map(r => ({
      date: r.periodKey || new Date().toISOString().slice(0, 10),
      generated_kwh: r.kwh,
      status_code: 'OK' as const
    }));
  }

  async getDailyProduction(plantId: string, date: string): Promise<DailyProductionResult> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (date === today) {
        const kpi = await this.getRealKpi(plantId);
        return {
          date,
          generated_kwh: kpi.day_power,
          status_code: 'OK'
        };
      }

      const logs = await this.getMultipleDailyProduction(plantId);
      const exactMatch = logs.find(l => l.date === date);
      if (exactMatch) return exactMatch;
      if (logs.length > 0) return logs[logs.length - 1];

      return { date, generated_kwh: 0, status_code: 'COMM_ERROR' };
    } catch (e: any) {
      console.error("Huawei getDailyProduction Error:", e.message);
      return { date, generated_kwh: 0, status_code: 'COMM_ERROR' };
    }
  }
}
