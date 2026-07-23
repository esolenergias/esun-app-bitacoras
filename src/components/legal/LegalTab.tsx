import React, { useState } from 'react';
import { FileText, Shield } from 'lucide-react';
import ContratosPanelesTab from './ContratosPanelesTab';

interface LegalTabProps {
  initialBudgetId?: string | null;
}

export default function LegalTab({ initialBudgetId }: LegalTabProps) {
  const [legalSubTab, setLegalSubTab] = useState<'contratos_paneles'>('contratos_paneles');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-light text-gold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Legal Esol
          </h2>
          <p className="text-cream-muted text-sm mt-1">
            Gestión de contratos, notificaciones y recibos oficiales.
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-dark-4">
        <button
          onClick={() => setLegalSubTab('contratos_paneles')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            legalSubTab === 'contratos_paneles'
              ? 'border-gold text-gold bg-gold/5'
              : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
          }`}
        >
          <FileText className="w-4 h-4" />
          Contratos Paneles
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {legalSubTab === 'contratos_paneles' && (
          <ContratosPanelesTab initialBudgetId={initialBudgetId} />
        )}
      </div>
    </div>
  );
}
