import React from 'react';
import { CFERequest } from '../../types';
import { CartaPoderPrint } from './CartaPoderPrint';
import { UnifilarViewer } from '../forms/UnifilarViewer';
import { AnexoAPrint } from './AnexoAPrint';

interface FullReportPrintProps {
  formData: Partial<CFERequest>;
}

// Renderiza un archivo, sí es PDF muestra mensaje y trata de forzar compatibilidad visual si no carga
const RenderAttachment = ({ src, label }: { src?: string; label: string }) => {
  if (!src) return <div className="p-4 border border-dashed border-gray-300 text-gray-400 text-center text-sm">{label} no proporcionado</div>;
  if (src.includes('.pdf')) {
    return (
      <div className="p-6 border border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center">
         <span className="font-bold text-gray-700">DOCUMENTO PDF</span>
         <span className="text-gray-500 mt-2">{label} adjunto en el expediente digital.</span>
      </div>
    );
  }
  return <img src={src} alt={label} className="max-w-full max-h-96 object-contain rounded-md border border-gray-200" />;
};

export function FullReportPrint({ formData }: FullReportPrintProps) {
  return (
    <div className="w-full bg-white text-black font-sans print:p-0">
      
      {/* SECTION 1: PORTADA / RESUMEN */}
      <div className="min-h-[10in] flex flex-col justify-center items-center text-center p-12">
        <div className="border-[4px] border-black p-16 w-full max-w-4xl">
           <h1 className="text-3xl font-bold uppercase tracking-widest mb-4">Expediente Técnico</h1>
           <h2 className="text-xl font-medium uppercase tracking-wide mb-12 text-gray-800">Trámite de Interconexión CFE</h2>

           <div className="text-left space-y-6 max-w-2xl mx-auto border-t border-gray-300 pt-8 mt-8">
             <div className="grid grid-cols-3 gap-4">
                <div className="font-bold uppercase text-sm text-gray-500">Cliente:</div>
                <div className="col-span-2 font-medium text-lg uppercase">{formData.client?.name || '-'}</div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="font-bold uppercase text-sm text-gray-500">RPU:</div>
                <div className="col-span-2 font-medium text-lg tracking-widest">{formData.client?.rpu || '-'}</div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="font-bold uppercase text-sm text-gray-500">Ubicación:</div>
                <div className="col-span-2 text-md uppercase">
                   {formData.client?.address} <br/>
                   CP {formData.client?.zipCode}, {formData.client?.municipality}, {formData.client?.state}
                </div>
             </div>
           </div>

           <div className="text-left space-y-4 max-w-2xl mx-auto border-t border-gray-300 pt-8 mt-8">
             <div className="grid grid-cols-3 gap-4">
                <div className="font-bold uppercase text-sm text-gray-500">Sistema:</div>
                <div className="col-span-2 font-medium text-md uppercase">Solar Fotovoltaico</div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="font-bold uppercase text-sm text-gray-500">Módulos:</div>
                <div className="col-span-2 text-md">
                   {(formData.unifilar?.panelsPerString || 0) * (formData.unifilar?.numberOfStrings || 0)} x {formData.unifilar?.panelModel} ({formData.unifilar?.panelPower}W)
                </div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="font-bold uppercase text-sm text-gray-500">Inversor(es):</div>
                <div className="col-span-2 text-md">
                   {formData.unifilar?.inverterQuantity} x {formData.unifilar?.inverterModel} ({formData.unifilar?.inverterPower}W)
                </div>
             </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="font-bold uppercase text-sm text-gray-500">Capacidad Total:</div>
                <div className="col-span-2 font-bold text-lg">
                   {(((formData.unifilar?.panelsPerString || 0) * (formData.unifilar?.numberOfStrings || 0)) * (formData.unifilar?.panelPower || 0)) / 1000} kW
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* SECTION 2: CARTA PODER */}
      <div style={{ pageBreakBefore: 'always' }} className="pt-8">
        <CartaPoderPrint formData={formData} />
      </div>

      {/* SECTION 3: DOCUMENTOS OFICIALES */}
      <div style={{ pageBreakBefore: 'always' }} className="pt-8">
        <h2 className="text-2xl font-bold uppercase mb-8 border-b-2 border-black pb-2">Documentos Oficiales</h2>
        
        <div className="space-y-12">
          <div>
            <h3 className="font-bold uppercase mb-4">1. Recibo CFE del Cliente</h3>
            <RenderAttachment src={formData.files?.electricBill} label="Recibo de Luz" />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold uppercase mb-4 text-sm">Identificación (Otorgante)</h3>
              <RenderAttachment src={formData.files?.idContractor} label="ID Otorgante" />
            </div>
            <div>
              <h3 className="font-bold uppercase mb-4 text-sm">Identificación (Quien Recibe)</h3>
              <RenderAttachment src={formData.files?.idReceiver} label="ID Quien Recibe" />
            </div>
            <div>
              <h3 className="font-bold uppercase mb-4 text-sm">Identificación (Testigo 1)</h3>
              <RenderAttachment src={formData.files?.idWitness1} label="ID Testigo 1" />
            </div>
            <div>
              <h3 className="font-bold uppercase mb-4 text-sm">Identificación (Testigo 2)</h3>
              <RenderAttachment src={formData.files?.idWitness2} label="ID Testigo 2" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: UBICACIÓN */}
      <div style={{ pageBreakBefore: 'always' }} className="pt-8">
        <h2 className="text-2xl font-bold uppercase mb-8 border-b-2 border-black pb-2">Reporte de Ubicación y Diagrama</h2>
        
        <div className="mb-12">
          <h3 className="font-bold uppercase mb-2">Coordenadas del Sitio</h3>
          <p className="font-mono text-lg">{formData.location?.lat}, {formData.location?.lng}</p>
          <div className="mt-6 border border-gray-300 p-2 block bg-white">
             {formData.location?.mapScreenshot ? (
               <img src={formData.location.mapScreenshot} alt="Croquis Google Maps" className="w-full h-auto max-h-[500px] object-cover" />
             ) : (
               <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">Croquis no proporcionado</div>
             )}
          </div>
        </div>
      </div>

      {/* SECTION 4.1: UNIFILAR DIAGRAM */}
      <div style={{ pageBreakBefore: 'always' }} className="pt-8">
        <h2 className="text-2xl font-bold uppercase mb-8 border-b-2 border-black pb-2">Plano de Diagrama Unifilar</h2>
        <div className="w-full">
           <UnifilarViewer formData={formData} />
        </div>
      </div>

      {/* SECTION 5: EVIDENCIA FOTOGRÁFICA */}
      <div style={{ pageBreakBefore: 'always' }} className="pt-8 mb-12">
        <h2 className="text-2xl font-bold uppercase mb-8 border-b-2 border-black pb-2">Evidencia Fotográfica y Técnica</h2>
        
        <div className="space-y-12">
           <div>
              <h3 className="font-bold uppercase mb-4">Sistema Fotovoltaico Instalado</h3>
              <RenderAttachment src={formData.files?.systemPhoto} label="Panorámica del Sistema" />
           </div>
           
           <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold uppercase mb-4 text-sm">Etiqueta Módulo Solar</h3>
                <RenderAttachment src={formData.files?.panelLabelPhoto} label="Etiqueta Panel" />
              </div>
              <div>
                <h3 className="font-bold uppercase mb-4 text-sm">Etiqueta Inversor</h3>
                <RenderAttachment src={formData.files?.inverterLabelPhoto} label="Etiqueta Inversor" />
              </div>
           </div>

           <div>
              <h3 className="font-bold uppercase mb-4 border-t-2 border-black pt-6">Fichas Técnicas Integradas al Expediente Digital</h3>
              <ul className="list-disc ml-6 space-y-4">
                 <li><span className="font-bold uppercase">Ficha Técnica Panel Solar:</span> {formData.files?.panelDatasheet ? 'Adjunta correctamente' : 'Pendiente'}</li>
                 <li><span className="font-bold uppercase">Ficha Técnica Inversor:</span> {formData.files?.inverterDatasheet ? 'Adjunta correctamente' : 'Pendiente'}</li>
                 <li><span className="font-bold uppercase">Certificado Inversor (UL):</span> {formData.files?.inverterCertificate ? 'Adjunta correctamente' : 'Pendiente'}</li>
              </ul>
           </div>
        </div>
      </div>

      {/* SECTION 6: ANEXO A */}
      <AnexoAPrint formData={formData} />

      <div className="pt-8 text-center font-bold text-gray-500 uppercase tracking-widest text-sm" style={{ pageBreakBefore: 'always' }}>
         FIN DEL EXPEDIENTE
      </div>

    </div>
  );
}
