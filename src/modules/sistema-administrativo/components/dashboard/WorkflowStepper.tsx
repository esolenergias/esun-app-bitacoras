import React from 'react';
import { 
  FileText, CheckCircle2, ShoppingCart, Truck, Package, ClipboardCheck, 
  FileCheck2, RotateCcw, FolderCheck, CheckCircle, ShieldCheck
} from 'lucide-react';
import type { WorkflowStepId } from '../../types/adminTypes';

interface WorkflowStepperProps {
  activeStep?: WorkflowStepId;
  onStepClick: (stepId: WorkflowStepId) => void;
  pendingCounts?: Record<WorkflowStepId, number>;
}

export const WORKFLOW_STEPS: {
  num: number;
  id: WorkflowStepId;
  title: string;
  category: 'Compras' | 'Almacén y Obra';
  description: string;
  icon: React.ElementType;
}[] = [
  {
    num: 1,
    id: 'solicitud_compra',
    title: '1. Solicitud Compra',
    category: 'Compras',
    description: 'Requisición de insumos de obra',
    icon: FileText
  },
  {
    num: 2,
    id: 'autorizacion_compra',
    title: '2. Autorización',
    category: 'Compras',
    description: 'Aprobación Dirección/Master',
    icon: ShieldCheck
  },
  {
    num: 3,
    id: 'orden_compra',
    title: '3. Orden Compra (OC)',
    category: 'Compras',
    description: 'Emisión oficial a proveedor',
    icon: ShoppingCart
  },
  {
    num: 4,
    id: 'recepcion_revision',
    title: '4. Recepción Almacén',
    category: 'Compras',
    description: 'Inspección física contra factura',
    icon: Truck
  },
  {
    num: 5,
    id: 'inventario_kardex',
    title: '5. Kardex / Stock',
    category: 'Almacén y Obra',
    description: 'Existencias y valuación real',
    icon: Package
  },
  {
    num: 6,
    id: 'solicitud_material',
    title: '6. Solicitud Obra',
    category: 'Almacén y Obra',
    description: 'Petición por proyecto',
    icon: ClipboardCheck
  },
  {
    num: 7,
    id: 'autorizacion_material',
    title: '7. Autorización Salida',
    category: 'Almacén y Obra',
    description: 'Aprobación almacén',
    icon: CheckCircle2
  },
  {
    num: 8,
    id: 'vale_entrega',
    title: '8. Vale de Entrega',
    category: 'Almacén y Obra',
    description: 'Custodia técnica en obra',
    icon: FileCheck2
  },
  {
    num: 9,
    id: 'devolucion_merma',
    title: '9. Devolución / Merma',
    category: 'Almacén y Obra',
    description: 'Sobrantes o scrap',
    icon: RotateCcw
  },
  {
    num: 10,
    id: 'cierre_proyecto',
    title: '10. Cierre de Proyecto',
    category: 'Almacén y Obra',
    description: 'Conciliación real vs presupuesto',
    icon: FolderCheck
  }
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  activeStep,
  onStepClick,
  pendingCounts = {} as any
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 select-none">
        {WORKFLOW_STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isCompras = step.category === 'Compras';
          const pending = pendingCounts[step.id] || 0;

          return (
            <button
              key={step.id + step.num}
              onClick={() => onStepClick(step.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between group min-h-[105px] cursor-pointer ${
                isActive
                  ? 'bg-gold/20 border-gold shadow-lg ring-1 ring-gold/40'
                  : 'bg-dark-2 hover:bg-dark-3 border-dark-4 hover:border-gold/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-gold text-dark-1'
                      : isCompras
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    Paso {step.num}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold' : 'text-cream-muted group-hover:text-gold'}`} />
                </div>
                <h4 className={`text-xs font-bold leading-snug line-clamp-2 mt-1 ${isActive ? 'text-gold' : 'text-cream group-hover:text-gold transition-colors'}`}>
                  {step.title.replace(/^\d+\.\s*/, '')}
                </h4>
              </div>

              <div className="mt-2 pt-1 border-t border-dark-4/50 flex items-center justify-between text-[9px] text-cream-dim">
                <span className="truncate">{step.category}</span>
                {pending > 0 && (
                  <span className="bg-amber-500 text-dark-1 font-bold px-1.5 py-0.2 rounded-full text-[8.5px]">
                    {pending}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
