import React from 'react';
import { CFERequest } from '../../types';

export function AnexoAPrint({ formData }: { formData: Partial<CFERequest> }) {
  const anexo = formData.anexoA || {};
  const client = formData.client || {};
  const unifilar = formData.unifilar || {};
  const capkW = ((unifilar.panelQuantity || 0) * (unifilar.panelPower || 0) / 1000).toFixed(2);
  
  return (
    <div className="w-full bg-white text-black font-sans text-sm p-8" style={{ pageBreakBefore: 'always' }}>
      <div className="text-right mb-4">
        <p className="font-bold underline">ANEXO A</p>
      </div>
      <h2 className="text-center font-bold uppercase mb-2">SOLICITUD DE INTERCONEXIÓN DE CENTRALES ELÉCTRICAS CON CAPACIDAD MENOR A 0.5 MW</h2>

      <div className="border border-black p-4 mt-6 mb-6 font-bold uppercase text-center bg-gray-100">
        1. DATOS DEL SUMINISTRADOR (A LLENAR POR EL SOLICITANTE)
      </div>
      <div className="flex border-b border-black mb-2 pb-1">
        <div className="w-1/3 font-bold">1.1 Nombre o Razón Social:</div>
        <div className="w-2/3 uppercase">CFE SUMINISTRADOR DE SERVICIOS BÁSICOS</div>
      </div>

      <div className="border border-black p-4 mt-6 mb-6 font-bold uppercase text-center bg-gray-100">
        2. DATOS DEL SOLICITANTE
      </div>
      <div className="space-y-4">
        <div className="flex border-b border-black pb-1">
          <div className="w-1/3 font-bold">2.1 Nombre completo, denominación o Razón Social:</div>
          <div className="w-2/3 uppercase">{client.name}</div>
        </div>
        <div className="flex border-b border-black pb-1">
          <div className="w-1/3 font-bold">2.2 R.F.C.:</div>
          <div className="w-2/3 uppercase">{anexo.rfc}</div>
        </div>
        <div className="flex border-b border-black pb-1">
          <div className="w-1/3 font-bold">2.3 Domicilio (Calle, Número, Colonia, C.P., Entidad):</div>
          <div className="w-2/3 uppercase">
            {client.address}, CP {client.zipCode}, {client.municipality}, {client.state}
          </div>
        </div>
        <div className="flex border-b border-black pb-1">
          <div className="w-1/3 font-bold">2.4 Teléfono principal:</div>
          <div className="w-2/3 uppercase">{anexo.phone}</div>
        </div>
        <div className="flex border-b border-black pb-1">
          <div className="w-1/3 font-bold">2.5 Correo electrónico:</div>
          <div className="w-2/3">{anexo.email}</div>
        </div>
      </div>

      <div className="border border-black p-4 mt-6 mb-6 font-bold uppercase text-center bg-gray-100">
        3. DATOS DE LA CENTRAL ELÉCTRICA
      </div>
      <div className="space-y-4 mb-8">
        <div className="flex border-b border-black pb-1">
          <div className="w-1/3 font-bold">3.1 Ubicación:</div>
          <div className="w-2/3 uppercase">
            {client.address}, CP {client.zipCode}, {client.municipality}, {client.state}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 border-b border-black pb-2">
          <div className="flex items-center">
             <div className="font-bold mr-2">3.2 Capacidad Instalada Bruta:</div>
             <div>{capkW} kW</div>
          </div>
          <div className="flex items-center">
             <div className="font-bold mr-2">3.3 Capacidad a instalar(1):</div>
             <div><span className="inline-block w-4 h-4 border border-black mr-2 bg-black"></span> (X) Solicitud Nueva</div>
          </div>
        </div>

        <div className="flex border-b border-black pb-1 mt-2">
          <div className="font-bold mr-2">3.5 Tecnología (Eólica, Biogás, Biomasa, Solar fotovoltaica...):</div>
          <div className="uppercase">Solar Fotovoltaica</div>
        </div>
      </div>

       <div className="border border-black p-4 mt-6 mb-6 font-bold uppercase text-center bg-gray-100">
        4. CARACTERÍSTICAS DEL SERVICIO (A LLENAR POR EL SOLICITANTE)
       </div>
       <div className="space-y-4">
         <div className="grid grid-cols-2 gap-4 border-b border-black pb-2">
           <div className="flex items-center">
             <div className="font-bold mr-2">4.1 Registro Promovente (RPU):</div>
             <div>{client.rpu}</div>
           </div>
           <div className="flex items-center">
             <div className="font-bold mr-2">4.2 Tarifa:</div>
             <div className="uppercase">{anexo.tarifa}</div>
           </div>
         </div>
         <div className="grid grid-cols-2 gap-4 border-b border-black pb-2 mt-2">
           <div className="flex items-center">
             <div className="font-bold mr-2">4.3 Nivel de Tensión:</div>
             <div className="uppercase">{anexo.tensionLevel}</div>
           </div>
           <div className="flex items-center">
             <div className="font-bold mr-2">4.4 Fases y Hilos:</div>
             <div className="uppercase">{anexo.phases} FASES, {anexo.wires} HILOS</div>
           </div>
         </div>
         <div className="flex border-b border-black pb-1 mt-2">
          <div className="font-bold mr-2">4.5 Distancia del Punto de Interconexión al centro de carga (m):</div>
          <div className="uppercase">{anexo.distanceMeter} m</div>
        </div>
       </div>

       <div className="mt-16 text-center">
         <div className="w-1/2 mx-auto border-b border-black mb-2 h-16"></div>
         <p className="font-bold uppercase">FIRMA DEL SOLICITANTE</p>
         <p className="uppercase">{client.name}</p>
       </div>
    </div>
  );
}
