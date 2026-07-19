export interface Bitacora {
  id: string;
  site_name: string;
  date: string;
  weather: string;
  crew_count: number;
  description: string;
  physical_progress: number;
  financial_progress: number;
  budget_estimate: number;
  latitude: number;
  longitude: number;
  photo_uri: string | null;
  concepto?: string | null;
  created_at: string;
}

export interface ObraApp {
  id?: string;
  nombre: string;
  cliente: string;
  ubicacion: string;
  status: string;
  residente?: string;
  created_at: string;
}
