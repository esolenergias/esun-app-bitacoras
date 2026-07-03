import React from 'react';
import { CFERequest, UnifilarData } from '../../types';
import { cn } from '../../lib/utils';
import { UnifilarViewer } from './UnifilarViewer';

interface DiagramaUnifilarProps {
  formData: Partial<CFERequest>;
  onChange: (data: UnifilarData) => void;
}

export function DiagramaUnifilar({ formData, onChange }: DiagramaUnifilarProps) {
  const data = formData.unifilar || {} as UnifilarData;
  const handlePrimaryChange = (field: keyof UnifilarData, value: any) => {
    const merged = { ...data, [field]: value };
    
    // Auto-calculate logic if any core parameter changes
    if (['panelQuantity', 'panelPower', 'inverterPower', 'inverterQuantity'].includes(field)) {
      const power = merged.panelPower || 550;
      const qty = merged.panelQuantity || 1;
      const invPower = merged.inverterPower || 5000;
      
      const vmp = 41.2;
      const imp = power / vmp;
      const voc = vmp * 1.2;
      const isc = imp * 1.06;

      merged.panelVmp = parseFloat(vmp.toFixed(1));
      merged.panelImp = parseFloat(imp.toFixed(2));
      merged.panelVoc = parseFloat(voc.toFixed(1));
      merged.panelIsc = parseFloat(isc.toFixed(2));

      merged.numberOfStrings = qty > 12 ? 2 : 1;
      merged.panelsPerString = Math.ceil(qty / merged.numberOfStrings);

      merged.inverterVmaxIn = 600;
      merged.inverterVminIn = 100;
      merged.inverterImaxIn = parseFloat((isc * merged.numberOfStrings * 1.2).toFixed(1));
      merged.inverterImaxOut = parseFloat((invPower / 220).toFixed(1));

      const acOvercurrent = merged.inverterImaxOut * 1.25;
      const standardSizes = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100];
      merged.acBreakerCapacity = standardSizes.find(size => size >= acOvercurrent) || Math.ceil(acOvercurrent + 5);
      
      if (acOvercurrent <= 15) merged.acWireGauge = '14 AWG';
      else if (acOvercurrent <= 20) merged.acWireGauge = '12 AWG';
      else if (acOvercurrent <= 30) merged.acWireGauge = '10 AWG';
      else if (acOvercurrent <= 40) merged.acWireGauge = '8 AWG';
      else if (acOvercurrent <= 55) merged.acWireGauge = '6 AWG';
      else merged.acWireGauge = '4 AWG';

      const dcOvercurrent = isc * 1.56;
      if (dcOvercurrent <= 30) merged.dcWireGauge = '10 AWG';
      else merged.dcWireGauge = '8 AWG';
    }

    onChange(merged);
  };

  const handleChange = (field: keyof UnifilarData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const totalSysPower = ((data.panelsPerString || 0) * (data.numberOfStrings || 0) * (data.panelPower || 0)) / 1000;
  const totalSysVoc = (data.panelVoc || 0) * (data.panelsPerString || 0);

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between border-b pb-2">
           <h3 className="text-xl font-medium text-gray-900">Configuración Técnica Unifilar</h3>
           <span className="text-sm text-gray-500 italic">Los cálculos técnicos se realizan automáticamente.</span>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PRIMARY INPUTS */}
          <div className="space-y-6">
             <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-blue-500">
                <h4 className="font-bold text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center justify-between">
                   <span>Módulos Solares (Información Principal)</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-semibold text-gray-600 uppercase">Cantidad</label>
                     <input type="number" value={data.panelQuantity || ''} onChange={e => handlePrimaryChange('panelQuantity', parseInt(e.target.value) || 0)} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-blue-50" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-gray-600 uppercase">Potencia (W)</label>
                     <input type="number" value={data.panelPower || ''} onChange={e => handlePrimaryChange('panelPower', parseFloat(e.target.value) || 0)} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-blue-50" />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs font-semibold text-gray-600 uppercase">Marca</label>
                     <input type="text" value={data.panelBrand || ''} onChange={e => handlePrimaryChange('panelBrand', e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border" />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs font-semibold text-gray-600 uppercase">Modelo</label>
                     <input type="text" value={data.panelModel || ''} onChange={e => handlePrimaryChange('panelModel', e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border" />
                   </div>
                </div>
             </div>

             <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-yellow-500">
                <h4 className="font-bold text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center justify-between">
                   <span>Inversores (Información Principal)</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-semibold text-gray-600 uppercase">Cantidad</label>
                     <input type="number" value={data.inverterQuantity || ''} onChange={e => handlePrimaryChange('inverterQuantity', parseInt(e.target.value) || 0)} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-blue-50" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-gray-600 uppercase">Capacidad (W)</label>
                     <input type="number" value={data.inverterPower || ''} onChange={e => handlePrimaryChange('inverterPower', parseFloat(e.target.value) || 0)} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-blue-50" />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs font-semibold text-gray-600 uppercase">Marca</label>
                     <input type="text" value={data.inverterBrand || ''} onChange={e => handlePrimaryChange('inverterBrand', e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border" />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs font-semibold text-gray-600 uppercase">Modelo</label>
                     <input type="text" value={data.inverterModel || ''} onChange={e => handlePrimaryChange('inverterModel', e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2 border" />
                   </div>
                </div>
             </div>
          </div>

          {/* ADVANCED/COMPUTED DATA (User can manually override) */}
          <div className="space-y-6">
            <details className="group bg-gray-50 border border-gray-200 rounded-lg open:shadow-md transition-all duration-200">
               <summary className="font-bold text-gray-700 p-4 cursor-pointer flex justify-between items-center outline-none">
                 Detalles Técnicos Calculados (Módulos y Arreglo)
                 <span className="text-blue-500 text-xs font-normal">Modificar Manualmente ▼</span>
               </summary>
               <div className="p-4 pt-0 border-t border-gray-200 grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Voc (V)</label>
                    <input type="number" value={data.panelVoc || ''} onChange={e => handleChange('panelVoc', parseFloat(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Isc (A)</label>
                    <input type="number" value={data.panelIsc || ''} onChange={e => handleChange('panelIsc', parseFloat(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Vmp (V)</label>
                    <input type="number" value={data.panelVmp || ''} onChange={e => handleChange('panelVmp', parseFloat(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Imp (A)</label>
                    <input type="number" value={data.panelImp || ''} onChange={e => handleChange('panelImp', parseFloat(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div className="col-span-2 border-t my-2 border-gray-200"></div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Cadenas (Strings)</label>
                    <input type="number" value={data.numberOfStrings || ''} onChange={e => handleChange('numberOfStrings', parseInt(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Módulos x Cadena</label>
                    <input type="number" value={data.panelsPerString || ''} onChange={e => handleChange('panelsPerString', parseInt(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
               </div>
            </details>

            <details className="group bg-gray-50 border border-gray-200 rounded-lg open:shadow-md transition-all duration-200">
               <summary className="font-bold text-gray-700 p-4 cursor-pointer flex justify-between items-center outline-none">
                 Detalles Técnicos Calculados (Inversor y Protecciones)
                 <span className="text-blue-500 text-xs font-normal">Modificar Manualmente ▼</span>
               </summary>
               <div className="p-4 pt-0 border-t border-gray-200 grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">I. Max Salida CA (A)</label>
                    <input type="number" value={data.inverterImaxOut || ''} onChange={e => handleChange('inverterImaxOut', parseFloat(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">V. Max In (V)</label>
                    <input type="number" value={data.inverterVmaxIn || ''} onChange={e => handleChange('inverterVmaxIn', parseFloat(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">V. Min/Start (V)</label>
                    <input type="number" value={data.inverterVminIn || ''} onChange={e => handleChange('inverterVminIn', parseFloat(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">I. Max In (A)</label>
                    <input type="number" value={data.inverterImaxIn || ''} onChange={e => handleChange('inverterImaxIn', parseFloat(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div className="col-span-2 border-t my-2 border-gray-200"></div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Cable CD (Solar)</label>
                    <input type="text" value={data.dcWireGauge || ''} onChange={e => handleChange('dcWireGauge', e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Cable CA (Red)</label>
                    <input type="text" value={data.acWireGauge || ''} onChange={e => handleChange('acWireGauge', e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Breaker ITM CA (A)</label>
                    <input type="number" value={data.acBreakerCapacity || ''} onChange={e => handleChange('acBreakerCapacity', parseInt(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
                   <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Tipo de Montaje</label>
                    <input type="text" value={data.mountingSolution || ''} onChange={e => handleChange('mountingSolution', e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm sm:text-sm p-2 border bg-white" />
                  </div>
               </div>
            </details>
          </div>
       </div>

       <div>
         <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">Plano Generado Automáticamente</h4>
         <p className="text-sm text-gray-500 mb-4">Previsualización interactiva del Plano (Formato ARCH D - 60x90 cm). La vista se encuentra escalada, pero en el reporte final conservará su alta resolución.</p>
         <div className="w-full bg-gray-100 border border-gray-300 shadow-inner p-4 sm:p-8 rounded-lg flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-4xl shadow-md ring-1 ring-black ring-opacity-5">
              <UnifilarViewer formData={formData} />
            </div>
         </div>
       </div>
    </div>
  );
}

