import type { CFEData } from './lib/cfeParser';

export interface LoadAppliance {
  id: string;
  name: string;
  quantity: number;
  watts: number;
  hoursPerDay: number;
  daysPerWeek: number;
}

export interface LoadProfile {
  appliances: LoadAppliance[];
  daily_Wh: number;
  peak_W: number;
}

export interface ProposalSecurity {
  share_token?: string;
  authorized_devices?: string[];
  max_devices?: number;
  created_at?: string;
  last_accessed_at?: string;
}

export interface AnteproyectoImage {
  id: string;
  slotKey: string;
  title: string;
  subtitle?: string;
  categoryTag?: string;
  driveUrl: string;
  thumbnailUrl?: string;
  uploadedAt?: string;
}

export interface PhaseCustomization {
  startWeek?: number;
  durationWeeks?: number;
}

export interface CronogramaParams {
  startDate?: string;
  customTotalWeeks?: number;
  notes?: string;
  phaseOverrides?: Record<string, number>; // Maps stepNumber (e.g. '01') to duration in weeks
  phaseCustomizations?: Record<string, PhaseCustomization>; // Maps phaseId (e.g. 'ing', 'montaje') to { startWeek, durationWeeks }
}

export interface Proposal {
  id: string;
  name: string;
  created_at: string;
  system: any; 
  financialParams: any; 
  financial: any; 
  environmental: any;
  security?: ProposalSecurity;
  anteproyecto_images?: AnteproyectoImage[];
  anteproyecto_unlocked?: boolean;
  cronograma_params?: CronogramaParams;
}

export interface SolarProject {
  id: string;
  created_at: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_rfc?: string;
  city?: string;
  project_type?: 'grid-tie' | 'off-grid' | 'hybrid';
  cfe_data?: CFEData;
  load_profile?: LoadProfile;
  proposals: Proposal[];
  status: 'draft' | 'presented' | 'accepted';
}
