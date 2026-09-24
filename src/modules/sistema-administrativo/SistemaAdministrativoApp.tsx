import React, { useState, useEffect } from 'react';
import type { 
  AdminTabType, WorkflowStepId, SolicitudCompra, OrdenCompra, RecepcionMercancia, 
  ItemInventario, MovimientoKardex, SolicitudMaterial, ValeEntrega, DevolucionMerma, 
  Proveedor, CuentaFinanciera, MovimientoFinanciero, IngresoRegistro, EgresoRegistro, 
  ClienteReal, ProyectoReal, InsumoReal, KpisFinancieros 
} from './types/adminTypes';
import { adminDbService } from './services/adminDbService';
import { AdminKpisHeader } from './components/dashboard/AdminKpisHeader';
import { AdminDashboardView } from './components/dashboard/AdminDashboardView';
import { SolicitudesCompraTab } from './components/compras/SolicitudesCompraTab';
import { OrdenesCompraTab } from './components/compras/OrdenesCompraTab';
import { RecepcionesTab } from './components/compras/RecepcionesTab';
import { InventarioKardexTab } from './components/almacen/InventarioKardexTab';
import { SolicitudesMaterialTab } from './components/almacen/SolicitudesMaterialTab';
import { ValesEntregaTab } from './components/almacen/ValesEntregaTab';
import { DevolucionesMermasTab } from './components/almacen/DevolucionesMermasTab';
import { CierreProyectosTab } from './components/almacen/CierreProyectosTab';
import { CajaBancosTab } from './components/finanzas/CajaBancosTab';
import { IngresosTab } from './components/finanzas/IngresosTab';
import { EgresosTab } from './components/finanzas/EgresosTab';
import { ProveedoresTab } from './components/catalogos/ProveedoresTab';
import { ClientesAdminView, ProyectosAdminView, MaterialesAdminView } from './components/catalogos/VistasEntidadesReales';

import { 
  ArrowLeft, LayoutDashboard, ShoppingCart, Truck, Package, ClipboardList, 
  FileCheck2, RotateCcw, FolderCheck, DollarSign, Building2, Database, Users, 
  Layers, RefreshCw, ShieldAlert, Sparkles, FileText, ChevronRight, ChevronDown, 
  ExternalLink, Menu, X, Landmark, Wallet, CheckCircle2, ShieldCheck, Box
} from 'lucide-react';

interface SistemaAdministrativoAppProps {
  userRole?: string;
  userName?: string;
  standalone?: boolean;
  onBackToPortal?: () => void;
  onNavigateToOficios?: (folioOficio?: string) => void;
}

export const SistemaAdministrativoApp: React.FC<SistemaAdministrativoAppProps> = ({
  userRole = 'master',
  userName = 'Administrador General',
  standalone = false,
  onBackToPortal,
  onNavigateToOficios
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabType>('resumen');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Accordion section states
  const [comprasOpen, setComprasOpen] = useState(true);
  const [almacenOpen, setAlmacenOpen] = useState(true);
  const [finanzasOpen, setFinanzasOpen] = useState(true);
  const [catalogosOpen, setCatalogosOpen] = useState(true);

  // Data States
  const [kpis, setKpis] = useState<KpisFinancieros>({
    inventario_disponible: 0,
    valor_inventario: 0,
    cuentas_por_cobrar: 0,
    cuentas_por_pagar: 0,
    ingresos_registrados: 0,
    egresos_registrados: 0,
    saldo_caja_chica: 0,
    saldo_caja_grande: 0,
    saldo_bancos: 0,
    total_liquidez: 0
  });

  const [solicitudesCompra, setSolicitudesCompra] = useState<SolicitudCompra[]>([]);
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([]);
  const [recepciones, setRecepciones] = useState<RecepcionMercancia[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [kardex, setKardex] = useState<MovimientoKardex[]>([]);
  const [solicitudesMaterial, setSolicitudesMaterial] = useState<SolicitudMaterial[]>([]);
  const [valesEntrega, setValesEntrega] = useState<ValeEntrega[]>([]);
  const [devoluciones, setDevoluciones] = useState<DevolucionMerma[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);
  const [ingresos, setIngresos] = useState<IngresoRegistro[]>([]);
  const [egresos, setEgresos] = useState<EgresoRegistro[]>([]);

  // Real connected tables
  const [clientes, setClientes] = useState<ClienteReal[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoReal[]>([]);
  const [insumos, setInsumos] = useState<InsumoReal[]>([]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await adminDbService.cargarDatosCompletos();
      setKpis(data.kpis);
      setSolicitudesCompra(data.solicitudesCompra);
      setOrdenesCompra(data.ordenesCompra);
      setRecepciones(data.recepciones);
      setInventario(data.inventario);
      setKardex(data.kardex);
      setSolicitudesMaterial(data.solicitudesMaterial);
      setValesEntrega(data.valesEntrega);
      setDevoluciones(data.devoluciones);
      setProveedores(data.proveedores);
      setCuentas(data.cuentas);
      setMovimientos(data.movimientos);
      setIngresos(data.ingresos);
      setEgresos(data.egresos);
      setClientes(data.clientes);
      setProyectos(data.proyectos);
      setInsumos(data.insumos);
    } catch (err) {
      console.error('Error cargando datos del sistema administrativo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleStepClick = (stepId: WorkflowStepId) => {
    const stepTabMap: Record<WorkflowStepId, AdminTabType> = {
      solicitud_compra: 'solicitudes_compra',
      autorizacion_compra: 'solicitudes_compra',
      orden_compra: 'ordenes_compra',
      recepcion_revision: 'recepciones',
      inventario_kardex: 'inventario',
      solicitud_material: 'solicitudes_material',
      autorizacion_material: 'solicitudes_material',
      vale_entrega: 'vales_entrega',
      devolucion_merma: 'devoluciones',
      cierre_proyecto: 'cierre'
    };
    setActiveTab(stepTabMap[stepId] || 'resumen');
  };

  const handleOpenOficiosModule = (folio?: string) => {
    if (onNavigateToOficios) {
      onNavigateToOficios(folio);
    } else {
      localStorage.setItem('esol_legal_active_subtab', 'oficios');
      if (folio) localStorage.setItem('esol_oficio_editing_target', folio);
      window.location.href = '/?tab=legal';
    }
  };

  // Badges calculation
  const pendingSc = solicitudesCompra.filter(s => s.estatus === 'pendiente').length;
  const pendingSm = solicitudesMaterial.filter(s => s.estatus === 'pendiente').length;
  const pendingRec = ordenesCompra.filter(o => o.estatus === 'aprobada').length;
  const bajoStockCount = inventario.filter(i => i.stock_actual <= i.stock_minimo).length;

  return (
    <div className="min-h-screen bg-dark-1 text-cream flex flex-col font-sans selection:bg-gold selection:text-dark-1">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-dark-2/95 backdrop-blur border-b border-dark-4 shadow-xl">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Brand & Left Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-dark-3 hover:bg-dark-4 text-gold border border-dark-4 transition-colors"
              title="Alternar Menú Lateral"
            >
              <Menu className="w-5 h-5" />
            </button>

            {onBackToPortal && (
              <button
                onClick={onBackToPortal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream transition-all text-xs font-bold border border-dark-4"
                title="Regresar al Portal Principal"
              >
                <ArrowLeft className="w-4 h-4 text-gold" />
                <span className="hidden sm:inline">Portal Principal</span>
              </button>
            )}

            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-dark-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-dark-1 font-black text-sm shadow-md shadow-gold/20">
                SA
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-cream tracking-tight flex items-center gap-2 font-display">
                  SISTEMA ADMINISTRATIVO
                  <span className="text-[9px] font-mono font-bold bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded-full uppercase">
                    ERP eSol
                  </span>
                </h1>
                <p className="text-[10px] text-cream-dim hidden md:block">
                  Control Financiero, Compras, Almacén, Kardex y Cierre de Obra
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={cargarDatos}
              className="p-2 rounded-xl bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-gold transition-colors border border-dark-4"
              title="Actualizar datos en tiempo real"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
            </button>

            <button
              onClick={() => handleOpenOficiosModule()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Oficios Oficiales</span>
            </button>

            <a
              href="/?sistema_administrativo=1"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream border border-dark-4 rounded-xl text-xs font-bold transition-all"
              title="Abrir en ventana independiente"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gold" />
              <span>Nueva Ventana</span>
            </a>

            <div className="flex items-center gap-2 pl-2 border-l border-dark-4 text-xs">
              <div className="w-7 h-7 rounded-full bg-gold/20 text-gold border border-gold/30 flex items-center justify-center font-bold text-xs">
                {userName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-cream text-xs leading-none">{userName}</div>
                <div className="text-[9px] text-gold uppercase font-mono mt-0.5">{userRole}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body: Left Sidebar Navigation + Content Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================= */}
        {/* COLUMNA IZQUIERDA: MENÚ DE MÓDULOS Y SUBMÓDULOS */}
        {/* ========================================================= */}
        <aside
          className={`${
            sidebarOpen ? 'w-72' : 'w-0 -ml-72'
          } lg:static fixed inset-y-16 left-0 z-30 bg-dark-2 border-r border-dark-4 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none overflow-y-auto scrollbar-thin select-none`}
        >
          <div className="p-4 space-y-4">
            
            {/* Dashboard General */}
            <button
              onClick={() => setActiveTab('resumen')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'resumen'
                  ? 'bg-gold/15 text-gold border-l-2 border-gold shadow-inner shadow-gold/5'
                  : 'text-cream-muted hover:text-cream hover:bg-dark-3'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 stroke-[2]" />
                <span>Dashboard Ejecutivo</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>

            <div className="pt-2 border-t border-dark-4/50 space-y-3">
              
              {/* ----------------------------------------------------- */}
              {/* MÓDULO 1: COMPRAS */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-1">
                <button
                  onClick={() => setComprasOpen(!comprasOpen)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-black uppercase text-gold/80 hover:text-gold tracking-wider rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-gold" />
                    <span>1. Compras</span>
                  </div>
                  {comprasOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {comprasOpen && (
                  <div className="pl-3 space-y-1 border-l border-dark-4 ml-3">
                    <button
                      onClick={() => setActiveTab('solicitudes_compra')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'solicitudes_compra'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>1-2. Solicitudes de Compra</span>
                      {pendingSc > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-dark-1 rounded-full text-[9px] font-mono font-bold">
                          {pendingSc}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('ordenes_compra')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'ordenes_compra'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>3. Órdenes de Compra (OC)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('recepciones')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'recepciones'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>4. Recepción y Revisión</span>
                      {pendingRec > 0 && (
                        <span className="px-1.5 py-0.2 bg-blue-500 text-cream rounded-full text-[9px] font-mono font-bold">
                          {pendingRec}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ----------------------------------------------------- */}
              {/* MÓDULO 2: ALMACÉN E INVENTARIO */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-1">
                <button
                  onClick={() => setAlmacenOpen(!almacenOpen)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-black uppercase text-gold/80 hover:text-gold tracking-wider rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-gold" />
                    <span>2. Almacén & Obra</span>
                  </div>
                  {almacenOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {almacenOpen && (
                  <div className="pl-3 space-y-1 border-l border-dark-4 ml-3">
                    <button
                      onClick={() => setActiveTab('inventario')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'inventario'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>5. Inventario / Kardex</span>
                      {bajoStockCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[9px] font-mono font-bold">
                          {bajoStockCount} mín
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('solicitudes_material')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'solicitudes_material'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>6-7. Solicitud a Obra</span>
                      {pendingSm > 0 && (
                        <span className="px-1.5 py-0.2 bg-violet-400 text-dark-1 rounded-full text-[9px] font-mono font-bold">
                          {pendingSm}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('vales_entrega')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'vales_entrega'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>8. Vales de Entrega</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('devoluciones')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'devoluciones'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>9. Devoluciones & Mermas</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('cierre')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'cierre'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>10. Cierre de Proyecto</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ----------------------------------------------------- */}
              {/* MÓDULO 3: TESORERÍA Y FINANZAS */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-1">
                <button
                  onClick={() => setFinanzasOpen(!finanzasOpen)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-black uppercase text-gold/80 hover:text-gold tracking-wider rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-gold" />
                    <span>3. Tesorería & Finanzas</span>
                  </div>
                  {finanzasOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {finanzasOpen && (
                  <div className="pl-3 space-y-1 border-l border-dark-4 ml-3">
                    <button
                      onClick={() => setActiveTab('finanzas_caja_bancos')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'finanzas_caja_bancos'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>Caja Chica, Grande & Bancos</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('finanzas_ingresos')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'finanzas_ingresos'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>Ingresos (CxC)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('finanzas_egresos')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'finanzas_egresos'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>Egresos (CxP)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ----------------------------------------------------- */}
              {/* MÓDULO 4: CATÁLOGOS Y DB REAL */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-1">
                <button
                  onClick={() => setCatalogosOpen(!catalogosOpen)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-black uppercase text-gold/80 hover:text-gold tracking-wider rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-gold" />
                    <span>4. Catálogos & BD</span>
                  </div>
                  {catalogosOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {catalogosOpen && (
                  <div className="pl-3 space-y-1 border-l border-dark-4 ml-3">
                    <button
                      onClick={() => setActiveTab('catalogo_proveedores')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'catalogo_proveedores'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>Proveedores</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('db_clientes')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'db_clientes'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>Clientes CRM (Real)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('db_proyectos')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'db_proyectos'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>Proyectos Presupuestos (Real)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('db_materiales')}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'db_materiales'
                          ? 'bg-gold/10 text-gold border-l-2 border-gold'
                          : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      <span>Insumos Maestros (Real)</span>
                    </button>

                    <button
                      onClick={() => handleOpenOficiosModule()}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-dark-3 transition-all"
                    >
                      <span>Módulo Oficios</span>
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="p-4 border-t border-dark-4 bg-dark-1/60">
            <div className="text-[10px] text-cream-dim text-center font-mono">
              eSol Energías Renovables &bull; ERP v2.0
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* ÁREA PRINCIPAL DE TRABAJO (DASHBOARD & VISTAS) */}
        {/* ========================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-dark-1">
          {/* Top Real-time Executive Financial Header Cards */}
          <AdminKpisHeader kpis={kpis} onRefresh={cargarDatos} />

          {/* Render Active Tab / Workspace */}
          {activeTab === 'resumen' && (
            <AdminDashboardView
              kpis={kpis}
              solicitudesCompra={solicitudesCompra}
              ordenesCompra={ordenesCompra}
              recepciones={recepciones}
              inventario={inventario}
              solicitudesMaterial={solicitudesMaterial}
              valesEntrega={valesEntrega}
              devoluciones={devoluciones}
              proyectos={proyectos}
              userRole={userRole}
              userName={userName}
              onStepClick={handleStepClick}
              onNavigateTab={setActiveTab}
              onRefresh={cargarDatos}
              onNavigateToOficios={handleOpenOficiosModule}
            />
          )}

          {activeTab === 'solicitudes_compra' && (
            <SolicitudesCompraTab
              solicitudes={solicitudesCompra}
              proyectos={proyectos}
              insumos={insumos}
              userRole={userRole}
              userName={userName}
              onRefresh={cargarDatos}
              onNavigateToOficios={handleOpenOficiosModule}
              onGenerarOc={(sc) => {
                setActiveTab('ordenes_compra');
              }}
            />
          )}

          {activeTab === 'ordenes_compra' && (
            <OrdenesCompraTab
              ordenes={ordenesCompra}
              solicitudes={solicitudesCompra}
              proveedores={proveedores}
              userRole={userRole}
              userName={userName}
              onRefresh={cargarDatos}
              onNavigateToOficios={handleOpenOficiosModule}
              onRecepcionar={(oc) => {
                setActiveTab('recepciones');
              }}
            />
          )}

          {activeTab === 'recepciones' && (
            <RecepcionesTab
              ordenesCompra={ordenesCompra}
              recepciones={recepciones}
              insumos={insumos}
              onRefresh={cargarDatos}
              onNavigateToOficios={handleOpenOficiosModule}
            />
          )}

          {activeTab === 'inventario' && (
            <InventarioKardexTab
              inventario={inventario}
              kardex={kardex}
              onRefresh={cargarDatos}
            />
          )}

          {activeTab === 'solicitudes_material' && (
            <SolicitudesMaterialTab
              solicitudes={solicitudesMaterial}
              proyectos={proyectos}
              insumos={insumos}
              userRole={userRole}
              userName={userName}
              onRefresh={cargarDatos}
              onNavigateToOficios={handleOpenOficiosModule}
              onGenerarVale={(sm) => {
                setActiveTab('vales_entrega');
              }}
            />
          )}

          {activeTab === 'vales_entrega' && (
            <ValesEntregaTab
              vales={valesEntrega}
              solicitudesMaterial={solicitudesMaterial}
              inventario={inventario}
              userName={userName}
              onRefresh={cargarDatos}
              onNavigateToOficios={handleOpenOficiosModule}
            />
          )}

          {activeTab === 'devoluciones' && (
            <DevolucionesMermasTab
              devoluciones={devoluciones}
              proyectos={proyectos}
              insumos={insumos}
              userName={userName}
              onRefresh={cargarDatos}
            />
          )}

          {activeTab === 'cierre' && (
            <CierreProyectosTab
              proyectos={proyectos}
              vales={valesEntrega}
              solicitudesMaterial={solicitudesMaterial}
              userName={userName}
              onRefresh={cargarDatos}
              onNavigateToOficios={handleOpenOficiosModule}
            />
          )}

          {activeTab === 'finanzas_caja_bancos' && (
            <CajaBancosTab
              cuentas={cuentas}
              movimientos={movimientos}
              userName={userName}
              onRefresh={cargarDatos}
            />
          )}

          {activeTab === 'finanzas_ingresos' && (
            <IngresosTab
              ingresos={ingresos}
              clientes={clientes}
              proyectos={proyectos}
              cuentas={cuentas}
              userName={userName}
              onRefresh={cargarDatos}
            />
          )}

          {activeTab === 'finanzas_egresos' && (
            <EgresosTab
              egresos={egresos}
              proveedores={proveedores}
              cuentas={cuentas}
              ordenesCompra={ordenesCompra}
              userName={userName}
              onRefresh={cargarDatos}
            />
          )}

          {activeTab === 'catalogo_proveedores' && (
            <ProveedoresTab
              proveedores={proveedores}
              onRefresh={cargarDatos}
            />
          )}

          {activeTab === 'db_clientes' && (
            <ClientesAdminView clientes={clientes} />
          )}

          {activeTab === 'db_proyectos' && (
            <ProyectosAdminView proyectos={proyectos} />
          )}

          {activeTab === 'db_materiales' && (
            <MaterialesAdminView insumos={insumos} />
          )}
        </main>
      </div>
    </div>
  );
};

export default SistemaAdministrativoApp;
