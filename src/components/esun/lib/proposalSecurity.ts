import { supabase } from '../../../context/supabase';
import type { Proposal, SolarProject } from '../esunTypes';

export interface ProposalSecurity {
  share_token?: string;
  authorized_devices?: string[];
  max_devices?: number;
  created_at?: string;
  last_accessed_at?: string;
}

/**
 * Genera o recupera la huella digital criptográfica única para este dispositivo/navegador.
 */
export function getOrCreateDeviceFingerprint(): string {
  try {
    const storageKey = 'esol_device_fingerprint';
    const existing = localStorage.getItem(storageKey);
    if (existing && existing.length >= 8) {
      return existing;
    }

    // Generate unique composite device ID
    const randomPart = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 12) : Math.random().toString(36).slice(2, 14);
    const screenPart = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown';
    const rawId = `dev_${randomPart}_${screenPart}`;
    
    localStorage.setItem(storageKey, rawId);
    return rawId;
  } catch (e) {
    // Fallback in case of restricted cookie/storage environments
    return 'dev_' + Math.random().toString(36).slice(2, 14);
  }
}

/**
 * Verifica si el usuario actual en el navegador es Staff/Administrador de ESOL.
 * Si es Staff, tiene acceso de supervisión irrestricto sin consumir cupos del cliente.
 */
export function isStaffUser(): boolean {
  try {
    const userJson = localStorage.getItem('esol_current_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user && (user.role === 'master' || user.role === 'admin' || user.email === 'menyfre@gmail.com')) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

export interface DeviceVerificationResult {
  authorized: boolean;
  isStaff?: boolean;
  reason?: 'device_limit_reached' | 'proposal_not_found';
  devicesCount: number;
  maxDevices: number;
}

/**
 * Valida y registra el dispositivo actual para la propuesta especificada.
 * Permite hasta max_devices (por defecto 2: Ingeniero de revisión + Cliente final).
 */
export async function verifyAndRegisterDevice(
  projectId: string,
  proposalId: string,
  project: SolarProject,
  proposal: Proposal
): Promise<DeviceVerificationResult> {
  const maxDevices = proposal.security?.max_devices || 2;
  const authorizedDevices = proposal.security?.authorized_devices || [];

  // 1. Si es Staff autenticado de ESOL, otorgar acceso libre de supervisión
  if (isStaffUser()) {
    return {
      authorized: true,
      isStaff: true,
      devicesCount: authorizedDevices.length,
      maxDevices
    };
  }

  const currentDeviceId = getOrCreateDeviceFingerprint();

  // 2. Si el dispositivo ya está previamente autorizado (el cliente o el ingeniero re-abriendo el link)
  if (authorizedDevices.includes(currentDeviceId)) {
    // Actualizar last_accessed_at en segundo plano
    updateDeviceAccessTime(projectId, proposalId, project);
    return {
      authorized: true,
      devicesCount: authorizedDevices.length,
      maxDevices
    };
  }

  // 3. Si hay cupo disponible (< maxDevices, ej. 1er o 2do dispositivo)
  if (authorizedDevices.length < maxDevices) {
    const updatedDevices = [...authorizedDevices, currentDeviceId];
    await persistAuthorizedDevices(projectId, proposalId, project, updatedDevices, maxDevices);

    return {
      authorized: true,
      devicesCount: updatedDevices.length,
      maxDevices
    };
  }

  // 4. Si ya se ocuparon los cupos autorizados (3er dispositivo o reenvío no autorizado)
  return {
    authorized: false,
    reason: 'device_limit_reached',
    devicesCount: authorizedDevices.length,
    maxDevices
  };
}

/**
 * Guarda la lista actualizada de dispositivos autorizados en Supabase y localStorage
 */
async function persistAuthorizedDevices(
  projectId: string,
  proposalId: string,
  project: SolarProject,
  devices: string[],
  maxDevices: number
) {
  try {
    const updatedProposals = project.proposals.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          security: {
            ...p.security,
            authorized_devices: devices,
            max_devices: maxDevices,
            last_accessed_at: new Date().toISOString()
          }
        };
      }
      return p;
    });

    // Actualizar Supabase
    await supabase
      .from('esun_proyectos')
      .update({
        proposals: updatedProposals,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // Actualizar cache local si existe
    try {
      const stored = localStorage.getItem('esun_projects');
      if (stored) {
        const list: SolarProject[] = JSON.parse(stored);
        const pIdx = list.findIndex(p => p.id === projectId);
        if (pIdx !== -1) {
          list[pIdx].proposals = updatedProposals;
          localStorage.setItem('esun_projects', JSON.stringify(list));
        }
      }
    } catch {}
  } catch (e) {
    console.error("Error persistiendo dispositivos autorizados:", e);
  }
}

/**
 * Actualiza la estampa de tiempo de último acceso
 */
async function updateDeviceAccessTime(
  projectId: string,
  proposalId: string,
  project: SolarProject
) {
  try {
    const updatedProposals = project.proposals.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          security: {
            ...p.security,
            last_accessed_at: new Date().toISOString()
          }
        };
      }
      return p;
    });

    await supabase
      .from('esun_proyectos')
      .update({ proposals: updatedProposals })
      .eq('id', projectId);
  } catch {}
}

/**
 * Resetea los dispositivos autorizados (útil si el cliente cambió de celular o el asesor quiere reiniciar accesos)
 */
export async function resetProposalDevices(
  projectId: string,
  proposalId: string,
  project: SolarProject
): Promise<SolarProject> {
  const updatedProposals = project.proposals.map(p => {
    if (p.id === proposalId) {
      return {
        ...p,
        security: {
          ...p.security,
          authorized_devices: [],
          max_devices: p.security?.max_devices || 2,
          last_accessed_at: new Date().toISOString()
        }
      };
    }
    return p;
  });

  const updatedProject = {
    ...project,
    proposals: updatedProposals
  };

  // Guardar en Supabase
  await supabase
    .from('esun_proyectos')
    .update({
      proposals: updatedProposals,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId);

  // Guardar en localStorage
  try {
    const stored = localStorage.getItem('esun_projects');
    if (stored) {
      const list: SolarProject[] = JSON.parse(stored);
      const pIdx = list.findIndex(p => p.id === projectId);
      if (pIdx !== -1) {
        list[pIdx] = updatedProject;
        localStorage.setItem('esun_projects', JSON.stringify(list));
      }
    }
  } catch {}

  return updatedProject;
}
