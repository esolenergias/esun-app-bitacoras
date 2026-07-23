import React, { useState } from 'react';
import { FileText, Shield, Cloud, Settings } from 'lucide-react';
import ContratosPanelesTab from './ContratosPanelesTab';

interface LegalTabProps {
  initialBudgetId?: string | null;
}

export default function LegalTab({ initialBudgetId }: LegalTabProps) {
  const [legalSubTab, setLegalSubTab] = useState<'contratos_paneles' | 'ajustes'>('contratos_paneles');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('esol_make_webhook_url') || '');

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

      <div className="flex justify-between border-b border-dark-4">
        <div className="flex space-x-1">
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
        
        <button
          onClick={() => setLegalSubTab('ajustes')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            legalSubTab === 'ajustes'
              ? 'border-gold text-gold bg-gold/5'
              : 'border-transparent text-cream-muted hover:text-cream hover:bg-dark-3'
          }`}
        >
          <Settings className="w-4 h-4" />
          Ajustes
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {legalSubTab === 'contratos_paneles' && (
          <ContratosPanelesTab initialBudgetId={initialBudgetId} />
        )}

        {legalSubTab === 'ajustes' && (
          <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto mt-10">
            <h3 className="text-xl font-light text-cream mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" /> Ajustes de Nube e Integraciones
            </h3>
            <div className="bg-dark-3/50 p-4 rounded-xl border border-dark-4">
              <h4 className="text-sm font-medium text-gold mb-3 flex items-center gap-2 border-b border-dark-4 pb-2">
                <Cloud className="w-4 h-4" /> Integración con Google Drive
              </h4>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Webhook URL de Make.com o Zapier</label>
                <input
                  type="text"
                  placeholder="https://hook.us1.make.com/..."
                  value={webhookUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWebhookUrl(val);
                    localStorage.setItem('esol_make_webhook_url', val);
                  }}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-xs font-mono"
                />
                <p className="text-[10px] text-cream-muted mt-2 leading-relaxed">
                  Pega aquí la URL de tu Webhook. Al dar clic en "Descargar PDF y Subir a Drive", el sistema enviará automáticamente el contrato generado (PDF) a esta dirección para que Make.com lo suba a la carpeta de tu cliente en Google Drive sin ocupar espacio en tu base de datos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
