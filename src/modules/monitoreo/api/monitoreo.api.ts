import { supabase } from '../../../context/supabase';
import type { InverterAccount, PVSystem } from '../types/monitoreo.types';

export const monitoreoApi = {
  // Accounts
  async getAccounts(): Promise<InverterAccount[]> {
    const { data, error } = await supabase
      .from('esun_inverter_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as InverterAccount[];
  },

  async createAccount(account: Omit<InverterAccount, 'id' | 'created_at' | 'updated_at'>): Promise<InverterAccount> {
    const { data, error } = await supabase
      .from('esun_inverter_accounts')
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data as InverterAccount;
  },

  // Systems
  async getSystemsByAccount(accountId: string): Promise<PVSystem[]> {
    const { data, error } = await supabase
      .from('esun_pv_systems')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PVSystem[];
  },

  async createSystem(system: Omit<PVSystem, 'id' | 'created_at' | 'updated_at'>): Promise<PVSystem> {
    const { data, error } = await supabase
      .from('esun_pv_systems')
      .insert(system)
      .select()
      .single();

    if (error) throw error;
    return data as PVSystem;
  }
};
