import React from 'react';
import { CFERequest } from '../../types';

interface AnexoAFormProps {
  formData: Partial<CFERequest>;
  updateData: (updates: Partial<CFERequest['anexoA']>) => void;
}

export function AnexoAForm({ formData, updateData }: AnexoAFormProps) {
  const anexo = formData.anexoA || {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Anexo A: Solicitud de Interconexión</h3>
        <p className="text-sm text-gray-500 mb-6">Completa la información faltante para el Anexo A de CFE. Algunos campos han sido autocompletados con la información previa.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">C.C. Suministrador (Automático)</label>
            <input type="text" readOnly value="CFE Suministrador de Servicios Básicos" className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Denominación Social (Automático)</label>
            <input type="text" readOnly value={formData.client?.name || ''} className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dato de RPU o RMU (Automático)</label>
            <input type="text" readOnly value={formData.client?.rpu || ''} className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Instalada Bruta (kW) (Automático)</label>
            <input type="text" readOnly value={((formData.unifilar?.panelQuantity || 0) * (formData.unifilar?.panelPower || 0) / 1000).toFixed(2)} className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm px-4 py-2" />
          </div>
        </div>

        <h4 className="font-medium text-gray-900 mb-4">Información Adicional para el Formato</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RFC del Solicitante</label>
            <input 
              type="text" 
              value={anexo.rfc || ''} 
              onChange={e => updateData({ rfc: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-4 py-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={anexo.email || ''} 
              onChange={e => updateData({ email: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-4 py-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Fijo / Móvil</label>
            <input 
              type="tel" 
              value={anexo.phone || ''} 
              onChange={e => updateData({ phone: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-4 py-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Tensión de Suministro</label>
            <select 
              value={anexo.tensionLevel || ''} 
              onChange={e => updateData({ tensionLevel: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-4 py-2 border"
            >
              <option value="">Selecciona...</option>
              <option value="Baja Tensión">Baja Tensión (hasta 1kV)</option>
              <option value="Media Tensión">Media Tensión (mayor a 1kV y menor o igual a 35kV)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa CFE</label>
            <select 
              value={anexo.tarifa || ''} 
              onChange={e => updateData({ tarifa: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-4 py-2 border"
            >
              <option value="">Selecciona...</option>
              <option value="1">1</option>
              <option value="1A">1A</option>
              <option value="1B">1B</option>
              <option value="1C">1C</option>
              <option value="DAC">DAC</option>
              <option value="PDBT">PDBT</option>
              <option value="GDBT">GDBT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fases / Hilos (Ej. 2 Fases, 3 Hilos)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="Fases"
                value={anexo.phases || ''} 
                onChange={e => updateData({ phases: Number(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-4 py-2 border" 
              />
              <input 
                type="number" 
                placeholder="Hilos"
                value={anexo.wires || ''} 
                onChange={e => updateData({ wires: Number(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-4 py-2 border" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distancia al Punto de Interconexión (m)</label>
            <input 
              type="number" 
              value={anexo.distanceMeter || ''} 
              onChange={e => updateData({ distanceMeter: Number(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 px-4 py-2 border" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
