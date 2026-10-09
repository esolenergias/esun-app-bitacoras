export type AuditActionType = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'
  | 'ESUN_VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'FINANCIAL'
  | 'SYSTEM';

export interface AuditLogEntry {
  id: string;
  created_at: string;
  user_id?: string;
  user_name: string;
  user_email?: string;
  user_role: 'master' | 'admin' | 'client' | 'anonymous' | string;
  action: AuditActionType;
  module: string;
  description: string;
  metadata?: Record<string, any>;
  ip?: string;
  device_info?: string;
}

export interface EsunPresentationStat {
  projectId: string;
  proposalId: string;
  clientName: string;
  proposalName: string;
  viewCount: number;
  lastViewedAt: string;
  devicesCount: number;
  maxDevices: number;
  authorizedDevices: string[];
  systemPowerKw?: number;
  investmentTotal?: number;
  clientCity?: string;
}

export interface AuditKpis {
  totalEvents: number;
  todayEvents: number;
  todayLogins: number;
  uniqueUsersToday: number;
  activeNowCount: number;
  totalCreations: number;
  totalUpdates: number;
  totalDeletions: number;
  totalEsunViews: number;
  topModules: { module: string; count: number }[];
  activityByRole: { role: string; count: number }[];
  hourlyActivityToday: { hour: string; count: number }[];
  esunPresentations: EsunPresentationStat[];
}
