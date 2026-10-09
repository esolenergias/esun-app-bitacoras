import { supabase } from '../context/supabase';
import type { AuditLogEntry, AuditActionType, AuditKpis } from '../types/audit';

const LOCAL_STORAGE_KEY = 'esol_audit_logs_v1';
const MAX_LOCAL_ENTRIES = 1000;

class AuditService {
  private memoryCache: AuditLogEntry[] = [];
  private isInitialized = false;

  constructor() {
    this.initLocalCache();
  }

  private initLocalCache() {
    if (this.isInitialized) return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        this.memoryCache = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('No se pudo cargar la cache local de auditoría:', e);
    }
    this.isInitialized = true;
  }

  private persistLocal(entry: AuditLogEntry) {
    try {
      this.memoryCache.unshift(entry);
      if (this.memoryCache.length > MAX_LOCAL_ENTRIES) {
        this.memoryCache = this.memoryCache.slice(0, MAX_LOCAL_ENTRIES);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.memoryCache));
    } catch (e) {
      console.warn('Error guardando log localmente:', e);
    }
  }

  private getDeviceSummary(): string {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    let browser = 'Navegador Web';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return `${isMobile ? 'Móvil' : 'Escritorio'} • ${browser}`;
  }

  /**
   * Registrar cualquier evento en el sistema
   */
  async log(params: {
    action: AuditActionType;
    module: string;
    description: string;
    user?: {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
    } | null;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      user_id: params.user?.id || 'anon',
      user_name: params.user?.name || 'Usuario Público / Anónimo',
      user_email: params.user?.email || 'N/A',
      user_role: params.user?.role || 'anonymous',
      action: params.action,
      module: params.module,
      description: params.description,
      metadata: params.metadata || {},
      device_info: this.getDeviceSummary()
    };

    // Guardar inmediatamente en cache local
    this.persistLocal(entry);

    // Intentar sincronizar con Supabase en background sin bloquear la interfaz
    try {
      await supabase.from('system_audit_logs').insert([
        {
          id: entry.id,
          created_at: entry.created_at,
          user_id: entry.user_id,
          user_name: entry.user_name,
          user_email: entry.user_email,
          user_role: entry.user_role,
          action: entry.action,
          module: entry.module,
          description: entry.description,
          metadata: entry.metadata,
          device_info: entry.device_info
        }
      ]);
    } catch (err) {
      // Si la tabla aún no existe en Supabase o hay error de red, el log sigue seguro en localStorage
      console.debug('Log almacenado en almacenamiento seguro local.');
    }
  }

  /**
   * Obtener todos los registros disponibles combinando Supabase y local
   */
  async getLogs(limit = 300): Promise<AuditLogEntry[]> {
    this.initLocalCache();
    try {
      const { data, error } = await supabase
        .from('system_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        // Mezclar con memoria local y eliminar duplicados
        const map = new Map<string, AuditLogEntry>();
        data.forEach(item => map.set(item.id, item));
        this.memoryCache.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return combined.slice(0, limit);
      }
    } catch (e) {
      console.warn('Recuperando auditoría desde almacenamiento de respaldo local:', e);
    }
    return this.memoryCache.slice(0, limit);
  }

  /**
   * Calcular KPIs de tráfico, usuarios y actividad
   */
  computeKpis(logs: AuditLogEntry[]): AuditKpis {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.created_at.startsWith(today));

    const todayUsersSet = new Set<string>();
    todayLogs.forEach(l => {
      if (l.user_email && l.user_email !== 'N/A') todayUsersSet.add(l.user_email);
      else todayUsersSet.add(l.user_name);
    });

    const activeRecent = logs.filter(l => {
      const diffMinutes = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60);
      return diffMinutes <= 15;
    });
    const activeNowSet = new Set<string>();
    activeRecent.forEach(l => activeNowSet.add(l.user_name));

    // Top módulos
    const moduleCountMap: Record<string, number> = {};
    const roleCountMap: Record<string, number> = {};
    const hoursMap: Record<string, number> = {};

    logs.forEach(l => {
      moduleCountMap[l.module] = (moduleCountMap[l.module] || 0) + 1;
      const r = l.user_role || 'anonymous';
      roleCountMap[r] = (roleCountMap[r] || 0) + 1;
    });

    todayLogs.forEach(l => {
      const hour = new Date(l.created_at).getHours().toString().padStart(2, '0') + ':00';
      hoursMap[hour] = (hoursMap[hour] || 0) + 1;
    });

    const topModules = Object.entries(moduleCountMap)
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const activityByRole = Object.entries(roleCountMap)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);

    const hourlyActivityToday = Object.entries(hoursMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Agrupación de aperturas de presentaciones Esun Solar
    const esunLogs = logs.filter(l => l.action === 'ESUN_VIEW');
    const esunMap = new Map<string, {
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
    }>();

    esunLogs.forEach(l => {
      const pId = l.metadata?.proposalId || l.metadata?.projectId || l.id;
      const existing = esunMap.get(pId);
      const viewTime = l.created_at;

      if (!existing) {
        esunMap.set(pId, {
          projectId: l.metadata?.projectId || '',
          proposalId: l.metadata?.proposalId || pId,
          clientName: l.metadata?.clientName || l.user_name || 'Cliente Solar',
          proposalName: l.metadata?.proposalName || 'Propuesta Solar',
          viewCount: 1,
          lastViewedAt: viewTime,
          devicesCount: l.metadata?.devicesCount || 1,
          maxDevices: l.metadata?.maxDevices || 2,
          authorizedDevices: l.metadata?.deviceId ? [l.metadata.deviceId] : [],
          systemPowerKw: l.metadata?.systemPowerKw,
          investmentTotal: l.metadata?.investmentTotal,
          clientCity: l.metadata?.clientCity
        });
      } else {
        existing.viewCount += 1;
        if (new Date(viewTime).getTime() > new Date(existing.lastViewedAt).getTime()) {
          existing.lastViewedAt = viewTime;
        }
        if (l.metadata?.devicesCount && l.metadata.devicesCount > existing.devicesCount) {
          existing.devicesCount = l.metadata.devicesCount;
        }
        if (l.metadata?.deviceId && !existing.authorizedDevices.includes(l.metadata.deviceId)) {
          existing.authorizedDevices.push(l.metadata.deviceId);
        }
        if (!existing.systemPowerKw && l.metadata?.systemPowerKw) {
          existing.systemPowerKw = l.metadata.systemPowerKw;
        }
        if (!existing.investmentTotal && l.metadata?.investmentTotal) {
          existing.investmentTotal = l.metadata.investmentTotal;
        }
      }
    });

    const esunPresentations = Array.from(esunMap.values()).sort(
      (a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime()
    );

    return {
      totalEvents: logs.length,
      todayEvents: todayLogs.length,
      todayLogins: todayLogs.filter(l => l.action === 'LOGIN').length,
      uniqueUsersToday: todayUsersSet.size,
      activeNowCount: Math.max(1, activeNowSet.size),
      totalCreations: logs.filter(l => l.action === 'CREATE').length,
      totalUpdates: logs.filter(l => l.action === 'UPDATE').length,
      totalDeletions: logs.filter(l => l.action === 'DELETE').length,
      totalEsunViews: esunLogs.length,
      topModules,
      activityByRole,
      hourlyActivityToday,
      esunPresentations
    };
  }

  /**
   * Exportar registros a formato CSV
   */
  exportToCsv(logs: AuditLogEntry[]): void {
    const headers = ['Fecha/Hora', 'Usuario', 'Email', 'Rol', 'Accion', 'Modulo', 'Descripcion', 'Dispositivo'];
    const rows = logs.map(l => [
      `"${new Date(l.created_at).toLocaleString('es-MX')}"`,
      `"${l.user_name.replace(/"/g, '""')}"`,
      `"${(l.user_email || '').replace(/"/g, '""')}"`,
      `"${l.user_role}"`,
      `"${l.action}"`,
      `"${l.module.replace(/"/g, '""')}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${(l.device_info || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bitacora_Auditoria_ESOL_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const auditService = new AuditService();
