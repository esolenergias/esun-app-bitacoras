export type InverterBrand = 'Huawei' | 'Growatt' | 'Hoymiles';

export interface InverterAccount {
  id: string;
  client_id?: string;
  brand: InverterBrand;
  username: string;
  encrypted_password?: string;
  api_token?: string;
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
  created_at?: string;
  updated_at?: string;
}
