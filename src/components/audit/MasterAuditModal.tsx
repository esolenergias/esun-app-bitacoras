import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, RefreshCw, Download, Search, Filter, Calendar, 
  Users, Activity, Eye, Edit3, Trash2, PlusCircle, LogIn, 
  Globe, Laptop, Clock, CheckCircle, BarChart3, AlertTriangle, X,
  Sun, Presentation, Smartphone, ExternalLink, ShieldCheck
} from 'lucide-react';
import { auditService } from '../../services/auditService';
import type { AuditLogEntry, AuditKpis, AuditActionType } from '../../types/audit';

interface MasterAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export const MasterAuditModal: React.FC<MasterAuditModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'esun'>('audit');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getLogs(500);
      setLogs(data);
    } catch (e) {
      console.error('Error cargando bitácora de auditoría:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      // Registrar apertura del módulo por el master
      auditService.log({
        action: 'VIEW',
        module: 'Auditoría & Tráfico',
        description: 'El rol Master consultó la Bitácora Central de Auditoría y KPIs',
        user: currentUser
      });
    }
  }, [isOpen]);

  // Polling cada 30 segundos si está abierto y activo
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(() => {
      auditService.getLogs(500).then(data => setLogs(data));
    }, 20000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  const kpis: AuditKpis = useMemo(() => {
    return auditService.computeKpis(logs);
  }, [logs]);

  // Filtros interactivos
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = selectedRole === 'all' || log.user_role === selectedRole;
      const matchAction = selectedAction === 'all' || log.action === selectedAction;
      const matchModule = selectedModule === 'all' || log.module === selectedModule;

      return matchSearch && matchRole && matchAction && matchModule;
    });
  }, [logs, searchTerm, selectedRole, selectedAction, selectedModule]);

  const availableModules = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => set.add(l.module));
    return Array.from(set).sort();
  }, [logs]);

  if (!isOpen) return null;

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'LOGIN':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"><LogIn className="w-2.5 h-2.5" /> Acceso</span>;
      case 'LOGOUT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"><LogOut className="w-2.5 h-2.5" /> Cierre Sesión</span>;
      case 'CREATE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><PlusCircle className="w-2.5 h-2.5" /> Creación</span>;
      case 'UPDATE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><Edit3 className="w-2.5 h-2.5" /> Modificación</span>;
      case 'DELETE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"><Trash2 className="w-2.5 h-2.5" /> Eliminación</span>;
      case 'EXPORT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20"><Download className="w-2.5 h-2.5" /> Descarga PDF</span>;
      case 'ESUN_VIEW':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30"><Sun className="w-2.5 h-2.5 text-amber-400" /> Esun Solar Vista</span>;
      case 'FINANCIAL':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">Finanzas</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-3 text-cream-muted border border-dark-4"><Eye className="w-2.5 h-2.5" /> Visualización / Navegación</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'master') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-gold/20 text-gold border border-gold/40">Master Director</span>;
    }
    if (role === 'admin') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">Admin Operador</span>;
    }
    if (role === 'client') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Cliente Inversor</span>;
    }
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-dark-3 text-cream-dim border border-dark-4">Público / Visita</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-1 border border-dark-4 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-dark-2/80 border-b border-dark-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold/10 border border-gold/30 rounded-2xl text-gold shadow-inner shadow-gold/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-cream tracking-tight">
                  CENTRO DE AUDITORÍA & KPIS DE TRÁFICO
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gold text-dark-1 shadow-sm">
                  Exclusivo Master
                </span>
              </div>
              <p className="text-xs text-cream-dim mt-0.5">
                Supervisión en tiempo real de accesos, movimientos, modificaciones y aperturas de propuestas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => auditService.exportToCsv(filteredLogs)}
              className="px-3 py-2 bg-dark-3 hover:bg-gold/20 text-gold border border-dark-4 hover:border-gold/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar bitácora filtrada a Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 bg-dark-3 hover:bg-dark-4 text-cream-dim hover:text-cream border border-dark-4 rounded-xl transition-all cursor-pointer"
              title="Actualizar registros"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-dark-3 hover:bg-rose-500/20 text-cream-dim hover:text-rose-400 border border-dark-4 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS (AUDITORÍA GENERAL / ESUN SOLAR) */}
        <div className="px-6 pt-3 bg-dark-2/60 border-b border-dark-4/70 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-dark-1 text-gold border-gold font-black shadow-sm'
                : 'text-cream-dim hover:text-cream border-transparent hover:bg-dark-3/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Bitácora Global & Tráfico ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('esun')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'esun'
                ? 'bg-dark-1 text-amber-400 border-amber-400 font-black shadow-sm'
                : 'text-cream-dim hover:text-cream border-transparent hover:bg-dark-3/40'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Presentaciones Esun Solar</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {kpis.totalEsunViews} vistas
            </span>
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-dark-1/60">

          {/* 1. SECCIÓN DE KPIS SUPERIORES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            
            {/* KPI: Visitas / Eventos Hoy */}
            <div className="bg-dark-2/70 p-3 rounded-2xl border border-dark-4 shadow-sm">
              <div className="flex items-center justify-between text-cream-dim text-[11px] font-bold mb-1">
                <span>Eventos Hoy</span>
                <Activity className="w-3.5 h-3.5 text-gold" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-cream font-mono">
                {kpis.todayEvents}
              </div>
              <div className="text-[10px] text-cream-dim/60 mt-1">
                De {kpis.totalEvents} históricos
              </div>
            </div>

            {/* KPI: Usuarios Únicos Hoy */}
            <div className="bg-dark-2/70 p-3 rounded-2xl border border-dark-4 shadow-sm">
              <div className="flex items-center justify-between text-cream-dim text-[11px] font-bold mb-1">
                <span>Usuarios Hoy</span>
                <Users className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
                {kpis.uniqueUsersToday}
              </div>
              <div className="text-[10px] text-cream-dim/60 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{kpis.activeNowCount} activos ahora</span>
              </div>
            </div>

            {/* KPI: Inicios de Sesión */}
            <div className="bg-dark-2/70 p-3 rounded-2xl border border-dark-4 shadow-sm">
              <div className="flex items-center justify-between text-cream-dim text-[11px] font-bold mb-1">
                <span>Logins Hoy</span>
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">
                {kpis.todayLogins}
              </div>
              <div className="text-[10px] text-cream-dim/60 mt-1">
                Accesos con clave
              </div>
            </div>

            {/* KPI: Aperturas Esun Solar */}
            <div 
              onClick={() => setActiveTab('esun')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                activeTab === 'esun'
                  ? 'bg-amber-400/15 border-amber-400/50 ring-1 ring-amber-400/30'
                  : 'bg-dark-2/70 border-dark-4 hover:border-amber-400/40 hover:bg-dark-3/60'
              }`}
            >
              <div className="flex items-center justify-between text-cream-dim text-[11px] font-bold mb-1">
                <span>Vistas Esun</span>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {kpis.totalEsunViews}
              </div>
              <div className="text-[10px] text-amber-300/70 mt-1">
                {kpis.esunPresentations.length} propuestas vistas
              </div>
            </div>

            {/* KPI: Creaciones de Registros */}
            <div className="bg-dark-2/70 p-3 rounded-2xl border border-dark-4 shadow-sm">
              <div className="flex items-center justify-between text-cream-dim text-[11px] font-bold mb-1">
                <span>Creaciones</span>
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {kpis.totalCreations}
              </div>
              <div className="text-[10px] text-cream-dim/60 mt-1">
                Nuevos datos / docs
              </div>
            </div>

            {/* KPI: Modificaciones Realizadas */}
            <div className="bg-dark-2/70 p-3 rounded-2xl border border-dark-4 shadow-sm">
              <div className="flex items-center justify-between text-cream-dim text-[11px] font-bold mb-1">
                <span>Ediciones</span>
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {kpis.totalUpdates}
              </div>
              <div className="text-[10px] text-cream-dim/60 mt-1">
                Ajustes & cambios
              </div>
            </div>

            {/* KPI: Eliminaciones */}
            <div className="bg-dark-2/70 p-3 rounded-2xl border border-dark-4 shadow-sm">
              <div className="flex items-center justify-between text-cream-dim text-[11px] font-bold mb-1">
                <span>Bajas / Delete</span>
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                {kpis.totalDeletions}
              </div>
              <div className="text-[10px] text-cream-dim/60 mt-1">
                Registros borrados
              </div>
            </div>

          </div>

          {/* VISTA 1: BITÁCORA GLOBAL Y TRÁFICO */}
          {activeTab === 'audit' && (
            <>
              {/* BARRA DE FILTROS Y BÚSQUEDA */}
              <div className="bg-dark-2/90 p-4 rounded-2xl border border-dark-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                
                {/* Buscador de texto */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-cream-dim absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por usuario, correo, detalle o folio..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl pl-9 pr-3 py-2 text-xs text-cream outline-none focus:border-gold transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cream-dim hover:text-cream text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtro por Rol */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-cream-dim uppercase">Rol:</span>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    className="bg-dark-3 border border-dark-4 rounded-xl px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="all">Todos los Roles</option>
                    <option value="master">Solo Master</option>
                    <option value="admin">Solo Admin</option>
                    <option value="client">Clientes</option>
                    <option value="anonymous">Público / Visitas</option>
                  </select>
                </div>

                {/* Filtro por Acción */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-cream-dim uppercase">Acción:</span>
                  <select
                    value={selectedAction}
                    onChange={e => setSelectedAction(e.target.value)}
                    className="bg-dark-3 border border-dark-4 rounded-xl px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="all">Todas las Acciones</option>
                    <option value="LOGIN">Accesos (Login)</option>
                    <option value="LOGOUT">Salidas (Logout / Cierre)</option>
                    <option value="ESUN_VIEW">Vistas Esun Solar</option>
                    <option value="CREATE">Creaciones</option>
                    <option value="UPDATE">Modificaciones</option>
                    <option value="DELETE">Eliminaciones</option>
                    <option value="EXPORT">Descargas PDF</option>
                    <option value="VIEW">Navegación / Vistas</option>
                  </select>
                </div>

                {/* Filtro por Módulo */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-cream-dim uppercase">Módulo:</span>
                  <select
                    value={selectedModule}
                    onChange={e => setSelectedModule(e.target.value)}
                    className="bg-dark-3 border border-dark-4 rounded-xl px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="all">Todos los Módulos</option>
                    {availableModules.map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* TABLA DE REGISTROS DE BITÁCORA */}
              <div className="bg-dark-2/80 rounded-2xl border border-dark-4 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-dark-3/90 text-cream-dim text-[10px] uppercase font-black tracking-wider border-b border-dark-4">
                        <th className="py-3 px-4">Fecha / Hora</th>
                        <th className="py-3 px-4">Usuario Responsable</th>
                        <th className="py-3 px-4">Rol</th>
                        <th className="py-3 px-4">Tipo Acción</th>
                        <th className="py-3 px-4">Módulo</th>
                        <th className="py-3 px-4">Detalle de Operación</th>
                        <th className="py-3 px-4 text-right">Dispositivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/50 font-mono text-[11px]">
                      {loading && logs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-cream-dim">
                            <RefreshCw className="w-6 h-6 animate-spin text-gold mx-auto mb-2" />
                            <span>Sincronizando bitácora de auditoría...</span>
                          </td>
                        </tr>
                      ) : filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-cream-dim">
                            No se encontraron registros con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map(log => {
                          const dateObj = new Date(log.created_at);
                          const timeStr = dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          const dateStr = dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

                          return (
                            <tr key={log.id} className="hover:bg-dark-3/40 transition-colors">
                              <td className="py-3 px-4 whitespace-nowrap text-cream-muted">
                                <div className="font-bold text-cream">{timeStr}</div>
                                <div className="text-[9.5px] text-cream-dim/60">{dateStr}</div>
                              </td>
                              <td className="py-3 px-4 font-sans">
                                <div className="font-bold text-cream truncate max-w-[160px]">{log.user_name}</div>
                                {log.user_email && log.user_email !== 'N/A' && (
                                  <div className="text-[9.5px] text-cream-dim truncate max-w-[160px]">{log.user_email}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-sans">
                                {getRoleBadge(log.user_role)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-sans">
                                {getActionBadge(log.action)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-sans font-bold text-gold">
                                {log.module}
                              </td>
                              <td className="py-3 px-4 font-sans text-cream-dim">
                                <div className="line-clamp-2 max-w-md">
                                  {log.description}
                                </div>
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <span className="text-[9px] text-cream-dim/50 font-mono mt-0.5 block truncate">
                                    Meta: {JSON.stringify(log.metadata).slice(0, 70)}...
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap text-[10px] text-cream-dim/60 font-sans">
                                {log.device_info || 'Web'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* FOOTER TABLA */}
                <div className="p-3 bg-dark-3/40 border-t border-dark-4 flex items-center justify-between text-[11px] text-cream-dim">
                  <span>Mostrando {filteredLogs.length} eventos registrados</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={e => setAutoRefresh(e.target.checked)}
                        className="accent-gold rounded cursor-pointer"
                      />
                      <span>Monitoreo en vivo (cada 20s)</span>
                    </label>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* VISTA 2: SEGUIMIENTO DE PRESENTACIONES ESUN SOLAR */}
          {activeTab === 'esun' && (
            <div className="space-y-4">
              
              {/* Encabezado informativo Esun */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 mt-0.5">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-cream flex items-center gap-2">
                    Métricas de Apertura & Tráfico de Propuestas "Esun Solar"
                  </h4>
                  <p className="text-xs text-cream-dim mt-0.5 leading-relaxed">
                    Este panel contabiliza cada vez que un cliente o prospecto abre un link de presentación interactiva de cotización solar, los dispositivos desde donde la visualizó, y el control de accesos permitidos.
                  </p>
                </div>
              </div>

              {/* Tabla de propuestas Esun vistas */}
              <div className="bg-dark-2/80 rounded-2xl border border-dark-4 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-dark-3/90 text-cream-dim text-[10px] uppercase font-black tracking-wider border-b border-dark-4">
                        <th className="py-3 px-4">Cliente / Proyecto</th>
                        <th className="py-3 px-4">Nombre de la Propuesta</th>
                        <th className="py-3 px-4 text-center">Veces Abierta</th>
                        <th className="py-3 px-4">Última Visualización</th>
                        <th className="py-3 px-4 text-center">Dispositivos Autorizados</th>
                        <th className="py-3 px-4 text-right">Potencia Sistema</th>
                        <th className="py-3 px-4 text-right">Inversión Estimada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-4/50 text-[11px]">
                      {kpis.esunPresentations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-cream-dim">
                            <Sun className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
                            <p className="font-bold text-cream">Aún no se registran aperturas de presentaciones.</p>
                            <p className="text-[11px] text-cream-dim mt-1">
                              Cada vez que un cliente abra el link compartido de Esun Solar, se registrará aquí de inmediato.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        kpis.esunPresentations.map((item, idx) => {
                          const dateObj = new Date(item.lastViewedAt);
                          const timeStr = dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                          const dateStr = dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

                          return (
                            <tr key={item.proposalId || idx} className="hover:bg-dark-3/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-cream text-xs">{item.clientName}</div>
                                {item.projectId && (
                                  <div className="text-[10px] text-cream-dim/60 font-mono">ID: {item.projectId.slice(0, 8)}...</div>
                                )}
                              </td>

                              <td className="py-3 px-4 font-medium text-amber-300">
                                {item.proposalName}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-400/15 text-amber-300 border border-amber-400/30">
                                  <Eye className="w-3 h-3 text-amber-400" />
                                  {item.viewCount} {item.viewCount === 1 ? 'vista' : 'vistas'}
                                </span>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap text-cream-muted">
                                <div className="font-bold text-cream">{timeStr}</div>
                                <div className="text-[9.5px] text-cream-dim/60">{dateStr}</div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-dark-3 border border-dark-4 text-[10px] font-bold">
                                  <Smartphone className="w-3 h-3 text-cream-dim" />
                                  <span className="text-cream">{item.devicesCount} / {item.maxDevices}</span>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-bold text-cream">
                                {item.systemPowerKw ? `${item.systemPowerKw.toFixed(2)} kWp` : '—'}
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                {item.investmentTotal ? `$${Number(item.investmentTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-dark-3/40 border-t border-dark-4 flex items-center justify-between text-[11px] text-cream-dim">
                  <span>{kpis.esunPresentations.length} propuestas registradas con métricas de lectura</span>
                  <span className="text-amber-400 font-bold">{kpis.totalEsunViews} aperturas acumuladas</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
