import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Search, FileText, CheckCircle, Clock, AlertTriangle, FileSignature, MapPin, Zap, Camera, FileCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { RequestStatus } from '../types';
import dayjs from 'date-fns';

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const statusConfig: Record<RequestStatus, { label: string; icon: any; className: string }> = {
    DRAFT: { label: 'Borrador', icon: FileSignature, className: 'bg-gray-100 text-gray-700' },
    PENDING_DOCS: { label: 'Pendiente de Documentos', icon: Clock, className: 'bg-amber-100 text-amber-800' },
    SUBMITTED: { label: 'Enviado a CFE', icon: FileText, className: 'bg-blue-100 text-blue-800' },
    APPROVED: { label: 'Aprobado', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'Rechazado/Observaciones', icon: AlertTriangle, className: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.className)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

export function Dashboard() {
  const { requests, setActiveRequest } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(req => 
    req.client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.client.rpu.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Trámites de Interconexión CFE</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona los contratos y expedientes de tus clientes</p>
        </div>
        <button 
          onClick={() => setActiveRequest('new')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Trámite
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente o RPU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">RPU</th>
                <th className="p-4 font-medium">Estatus</th>
                <th className="p-4 font-medium">Capacidad</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-gray-900">{req.client.name || 'Sin nombre'}</td>
                  <td className="p-4 text-sm text-gray-600">{req.client.rpu || '-'}</td>
                  <td className="p-4"><StatusBadge status={req.status} /></td>
                  <td className="p-4 text-sm text-gray-600">
                    {req.unifilar.panelQuantity * req.unifilar.panelPower / 1000} kWp
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                     {new Date(req.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setActiveRequest(req.id)}
                      className="text-yellow-600 hover:text-yellow-800 font-medium text-sm"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No se encontraron trámites que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
