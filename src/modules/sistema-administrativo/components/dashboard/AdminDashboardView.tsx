import React from 'react';
import type { 
  KpisFinancieros, SolicitudCompra, OrdenCompra, RecepcionMercancia, ItemInventario, 
  SolicitudMaterial, ValeEntrega, DevolucionMerma, ProyectoReal, WorkflowStepId, AdminTabType 
} from '../../types/adminTypes';
import { WorkflowStepper } from './WorkflowStepper';
import { 
  ShoppingCart, Truck, Package, ClipboardCheck, FileCheck2, RotateCcw, 
  FolderCheck, Plus, ArrowRight, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight,
  TrendingUp, DollarSign, ExternalLink
} from 'lucide-react';

interface AdminDashboardViewProps {
  kpis: KpisFinancieros;
  solicitudesCompra: SolicitudCompra[];
  ordenesCompra: OrdenCompra[];
  recepciones: RecepcionMercancia[];
  inventario: ItemInventario[];
  solicitudesMaterial: SolicitudMaterial[];
  valesEntrega: ValeEntrega[];
  devoluciones: DevolucionMerma[];
  proyectos: ProyectoReal[];
  userRole?: string;
  userName?: string;
  onStepClick: (stepId: WorkflowStepId) => void;
  onNavigateTab: (tab: AdminTabType) => void;
  onRefresh: () => void;
  onNavigateToOficios?: (folioOficio?: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  kpis,
  solicitudesCompra,
  ordenesCompra,
  recepciones,
  inventario,
  solicitudesMaterial,
  valesEntrega,
  devoluciones,
  proyectos,
  userRole = 'master',
  onStepClick,
  onNavigateTab,
  onNavigateToOficios
}) => {
  // Conteo de pendientes para insignias del Stepper
  const pendingCounts: Record<WorkflowStepId, number> = {
    solicitud_compra: solicitudesCompra.filter(s => s.estatus === 'pendiente').length,
    autorizacion_compra: solicitudesCompra.filter(s => s.estatus === 'pendiente').length,
    orden_compra: ordenesCompra.filter(o => o.estatus === 'emitida' || o.estatus === 'aprobada').length,
    recepcion_revision: ordenesCompra.filter(o => o.estatus === 'aprobada' || o.estatus === 'recibida_parcial').length,
    inventario_kardex: inventario.filter(i => i.stock_actual <= i.stock_minimo).length,
    solicitud_material: solicitudesMaterial.filter(s => s.estatus === 'pendiente').length,
    autorizacion_material: solicitudesMaterial.filter(s => s.estatus === 'pendiente').length,
    vale_entrega: solicitudesMaterial.filter(s => s.estatus === 'aprobada').length,
    devolucion_merma: devoluciones.length,
    cierre_proyecto: proyectos.length
  };

  return (
    <div className="space-y-6">
      {/* 1. Stepper Visual del Flujo Operativo de 10 Pasos */}
      <div className="bg-dark-2 border border-dark-4 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-black text-cream flex items-center gap-2 font-display">
              <span>FLUJO OPERATIVO INTEGRAL ESOL (10 FASES)</span>
              <span className="text-[9.5px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/25 font-mono">
                Sincronizado
              </span>
            </h3>
            <p className="text-xs text-cream-muted mt-0.5 font-body">
              Monitorea el ciclo de vida de insumos: desde la requisición técnica hasta la liquidación y acta de entrega.
            </p>
          </div>
        </div>

        <WorkflowStepper
          activeStep="solicitud_compra"
          onStepClick={onStepClick}
          pendingCounts={pendingCounts}
        />
      </div>

      {/* 2. Tarjetas de Acceso por Módulo Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Módulo 1: Compras */}
        <div className="bg-dark-2 border border-dark-4 hover:border-gold/30 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Fases 1 - 4
              </span>
            </div>

            <h4 className="text-base font-bold text-cream mt-3 font-display">Módulo de Compras & Proveedores</h4>
            <p className="text-xs text-cream-muted mt-1 leading-relaxed font-body">
              Requisiciones técnicas con dictamen de Dirección, órdenes de compra oficiales a crédito y recepción contra factura fiscal.
            </p>

            <div className="mt-4 space-y-1.5 text-xs text-cream-dim bg-dark-1/60 p-3 rounded-xl border border-dark-4">
              <div className="flex justify-between">
                <span>Solicitudes pendientes:</span>
                <span className="font-mono font-bold text-amber-400">{pendingCounts.solicitud_compra}</span>
              </div>
              <div className="flex justify-between">
                <span>Órdenes de compra activas:</span>
                <span className="font-mono font-bold text-blue-400">{ordenesCompra.length}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => onNavigateTab('solicitudes_compra')}
              className="flex-1 py-2.5 px-3 bg-gold hover:bg-gold-light text-dark-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Solicitudes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('ordenes_compra')}
              className="py-2.5 px-3 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-cream rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              OCs
            </button>
          </div>
        </div>

        {/* Módulo 2: Almacén y Obra */}
        <div className="bg-dark-2 border border-dark-4 hover:border-gold/30 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                Fases 5 - 8
              </span>
            </div>

            <h4 className="text-base font-bold text-cream mt-3 font-display">Almacén, Kardex & Salida Obra</h4>
            <p className="text-xs text-cream-muted mt-1 leading-relaxed font-body">
              Valuación de existencias, solicitudes por proyecto, vales de entrega con descuento de stock y control de devoluciones/mermas.
            </p>

            <div className="mt-4 space-y-1.5 text-xs text-cream-dim bg-dark-1/60 p-3 rounded-xl border border-dark-4">
              <div className="flex justify-between">
                <span>Insumos catalogados:</span>
                <span className="font-mono font-bold text-cream">{inventario.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Vales de salida entregados:</span>
                <span className="font-mono font-bold text-emerald-400">{valesEntrega.length}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => onNavigateTab('inventario')}
              className="flex-1 py-2.5 px-3 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-gold hover:text-gold-light rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Kardex / Stock</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('vales_entrega')}
              className="py-2.5 px-3 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-cream rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Vales
            </button>
          </div>
        </div>

        {/* Módulo 3: Finanzas y Cierre */}
        <div className="bg-dark-2 border border-dark-4 hover:border-gold/30 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 text-gold flex items-center justify-center font-bold">
                <FolderCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 rounded-full">
                Fases 9 - 10
              </span>
            </div>

            <h4 className="text-base font-bold text-cream mt-3 font-display">Tesorería, Cierre & Oficios</h4>
            <p className="text-xs text-cream-muted mt-1 leading-relaxed font-body">
              Flujo de fondos en tiempo real, conciliación de costos presupuestados vs consumidos reales y actas de entrega oficiales.
            </p>

            <div className="mt-4 space-y-1.5 text-xs text-cream-dim bg-dark-1/60 p-3 rounded-xl border border-dark-4">
              <div className="flex justify-between">
                <span>Proyectos a conciliar:</span>
                <span className="font-mono font-bold text-gold">{proyectos.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Liquidez en cuentas:</span>
                <span className="font-mono font-bold text-green-400">${kpis.total_liquidez.toLocaleString('es-MX')}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => onNavigateTab('cierre')}
              className="flex-1 py-2.5 px-3 bg-dark-3 hover:bg-dark-4 border border-dark-4 text-cream hover:text-gold rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Auditoría Obra</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            {onNavigateToOficios && (
              <button
                onClick={() => onNavigateToOficios()}
                className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Oficios</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
