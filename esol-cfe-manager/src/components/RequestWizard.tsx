import React, { useState } from 'react';
import { useStore } from '../store';
import { CFERequest } from '../types';
import { ArrowLeft, Save, ChevronRight, Check, Printer, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileUpload } from './FileUpload';
import { SignaturePad } from './SignaturePad';
import { DiagramaUnifilar } from './forms/DiagramaUnifilar';
import { AnexoAForm } from './forms/AnexoAForm';
import { CartaPoderPrint } from './printable/CartaPoderPrint';
import { FullReportPrint } from './printable/FullReportPrint';

const SECTIONS = [
  'General y Carta Poder',
  'Identificaciones y Recibo',
  'Ubicación',
  'Diagrama Unifilar',
  'Fotografías',
  'Fichas Técnicas',
  'Anexo A de CFE',
  'Generar Expediente'
];

export function RequestWizard() {
  const { requests, activeRequestId, setActiveRequest, updateRequest, addRequest } = useStore();
  const isNew = activeRequestId === 'new';
  
  const [currentStep, setCurrentStep] = useState(0);
  
  // Local state for edits
  const initialData: Partial<CFERequest> = isNew ? {
    client: { name: '', rpu: '', address: '', zipCode: '', municipality: '', state: '' },
    location: { address: '', lat: 0, lng: 0 },
    cartaPoder: { grantedTo: 'Esol', date: new Date().toISOString().split('T')[0], location: 'Tepic, Nayarit', witness1Name: '', witness2Name: '' },
    unifilar: {
      panelBrand: '', panelModel: '', panelPower: 0, panelVoc: 0, panelIsc: 0, panelVmp: 0, panelImp: 0,
      inverterBrand: '', inverterModel: '', inverterPower: 0, inverterVmaxIn: 0, inverterVminIn: 0, inverterImaxIn: 0, inverterImaxOut: 0,
      inverterQuantity: 1, panelsPerString: 0, numberOfStrings: 1,
      dcWireGauge: '10 AWG', acWireGauge: '8 AWG', acBreakerCapacity: 0, mountingSolution: 'Estructura Coplanar'
    },
    files: {},
    status: 'DRAFT'
  } : requests.find(r => r.id === activeRequestId) || {};

  const [formData, setFormData] = useState<Partial<CFERequest>>(initialData);

  const handleSave = () => {
    if (isNew) {
      addRequest(formData as any);
    } else {
      updateRequest(activeRequestId as string, formData);
    }
  };

  const updateSectionInfo = (section: keyof CFERequest, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        ...data
      }
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Contratante</label>
                <input type="text" value={formData.client?.name || ''} onChange={e => updateSectionInfo('client', { name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RPU (Registro Permanente de Usuario)</label>
                <input type="text" value={formData.client?.rpu || ''} onChange={e => updateSectionInfo('client', { rpu: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Domicilio</label>
                <input type="text" value={formData.client?.address || ''} onChange={e => updateSectionInfo('client', { address: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Municipio</label>
                <input type="text" value={formData.client?.municipality || ''} onChange={e => updateSectionInfo('client', { municipality: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <input type="text" value={formData.client?.state || ''} onChange={e => updateSectionInfo('client', { state: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                <input type="text" value={formData.client?.zipCode || ''} onChange={e => updateSectionInfo('client', { zipCode: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-6">Datos Complementarios de Carta Poder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lugar de Emisión</label>
                <input type="text" value={formData.cartaPoder?.location || ''} onChange={e => updateSectionInfo('cartaPoder', { location: e.target.value })} placeholder="Ej. Tepic, Nayarit" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Emisión</label>
                <input type="date" value={formData.cartaPoder?.date || ''} onChange={e => updateSectionInfo('cartaPoder', { date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Otorgado a (Quien Recibe)</label>
                <input type="text" value={formData.cartaPoder?.grantedTo || ''} onChange={e => updateSectionInfo('cartaPoder', { grantedTo: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-6">Testigos y Firmas</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Testigo 1</label>
                <input type="text" value={formData.cartaPoder?.witness1Name || ''} onChange={e => updateSectionInfo('cartaPoder', { witness1Name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Testigo 2</label>
                <input type="text" value={formData.cartaPoder?.witness2Name || ''} onChange={e => updateSectionInfo('cartaPoder', { witness2Name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <SignaturePad label="Firma del Otorgante (Cliente)" value={formData.cartaPoder?.grantorSignature} onChange={v => updateSectionInfo('cartaPoder', { grantorSignature: v })} />
              <SignaturePad label="Firma de quien Recibe (Esol)" value={formData.cartaPoder?.receiverSignature} onChange={v => updateSectionInfo('cartaPoder', { receiverSignature: v })} />
              <SignaturePad label="Firma Testigo 1" value={formData.cartaPoder?.witness1Signature} onChange={v => updateSectionInfo('cartaPoder', { witness1Signature: v })} />
              <SignaturePad label="Firma Testigo 2" value={formData.cartaPoder?.witness2Signature} onChange={v => updateSectionInfo('cartaPoder', { witness2Signature: v })} />
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                 <h3 className="text-lg font-medium text-gray-900">Vista Previa para Impresión</h3>
                 <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors print:hidden">
                    <Printer className="w-4 h-4" />
                    Imprimir solo Carta
                 </button>
              </div>
              <div className="border border-gray-300 bg-gray-50 p-6 rounded-md shadow-sm opacity-70 mb-4 text-center text-sm font-medium text-gray-500">
                Pulse el botón "Imprimir Carta" para descargar el PDF. Durante la visualización se mostrará en pantalla completa y limpia. O puede esperar hasta el Anexo A para descargar todo el expediente completo.
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Recibo de Luz</h3>
              <FileUpload label="Recibo de CFE" description="Debe ser el recibo más reciente, legible." value={formData.files?.electricBill} onChange={v => updateSectionInfo('files', { electricBill: v })} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Identificaciones Oficiales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload label="INE Otorgante (Cliente)" value={formData.files?.idContractor} onChange={v => updateSectionInfo('files', { idContractor: v })} />
                <FileUpload label="INE de quien Recibe" value={formData.files?.idReceiver} onChange={v => updateSectionInfo('files', { idReceiver: v })} />
                <FileUpload label="INE Testigo 1" value={formData.files?.idWitness1} onChange={v => updateSectionInfo('files', { idWitness1: v })} />
                <FileUpload label="INE Testigo 2" value={formData.files?.idWitness2} onChange={v => updateSectionInfo('files', { idWitness2: v })} />
              </div>
            </div>
          </div>
        );
      case 2:
        const handleMapLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const link = e.target.value;
          let lat = null;
          let lng = null;

          const matchAt = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (matchAt) {
            lat = parseFloat(matchAt[1]);
            lng = parseFloat(matchAt[2]);
          } else {
            const matchBang = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
            if (matchBang) {
              lat = parseFloat(matchBang[1]);
              lng = parseFloat(matchBang[2]);
            }
          }

          if (lat && lng) {
            updateSectionInfo('location', { lat, lng });
            
            // Generar una simulación de la captura
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#e5e7eb';
              ctx.fillRect(0, 0, 600, 400);
              ctx.strokeStyle = '#d1d5db';
              ctx.lineWidth = 2;
              for(let i=0; i<600; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,400); ctx.stroke(); }
              for(let i=0; i<400; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(600,i); ctx.stroke(); }
              
              ctx.fillStyle = '#ef4444';
              ctx.beginPath(); ctx.arc(300, 200, 10, 0, Math.PI*2); ctx.fill();
              ctx.beginPath(); ctx.moveTo(290, 200); ctx.lineTo(310, 200); ctx.lineTo(300, 230); ctx.fill();

              ctx.fillStyle = '#374151';
              ctx.font = 'bold 16px sans-serif';
              ctx.fillText(`Margen: ~70m radio`, 20, 30);
              ctx.font = '14px sans-serif';
              ctx.fillText(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`, 20, 50);
              ctx.fillStyle = '#6b7280';
              ctx.font = '12px sans-serif';
              ctx.fillText(`(Simulación de captura satelital)`, 20, 70);

              const dataUrl = canvas.toDataURL('image/png');
              updateSectionInfo('location', { mapScreenshot: dataUrl });
            }
          }
        };

        return (
          <div className="space-y-6">
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">Automático:</span> Pegue el enlace de Google Maps para extraer las coordenadas y generar la captura automáticamente (margen de 70m).
                </p>
             </div>

             <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Ubicación de la Instalación</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Link a Google Maps</label>
                  <input type="url" placeholder="https://www.google.com/maps/@21.5064,-104.9080,17z" onChange={handleMapLinkChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitud</label>
                  <input type="number" step="any" value={formData.location?.lat || ''} onChange={e => updateSectionInfo('location', { lat: parseFloat(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitud</label>
                   <input type="number" step="any" value={formData.location?.lng || ''} onChange={e => updateSectionInfo('location', { lng: parseFloat(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2 border" />
                </div>
             </div>
             
             <div className="mt-6 border-t pt-6">
               <div className="flex items-center justify-between mb-2">
                 <h4 className="text-sm font-medium text-gray-700">Captura del sitio Google Maps</h4>
                 <span className="text-xs text-gray-500">Puedes reemplazarla manualmente si es necesario</span>
               </div>
               <FileUpload label="Subir imagen de la ubicación (Opcional)" value={formData.location?.mapScreenshot} onChange={v => updateSectionInfo('location', { mapScreenshot: v })} />
             </div>
          </div>
        );
      case 3:
        return <DiagramaUnifilar formData={formData} onChange={data => setFormData(prev => ({ ...prev, unifilar: data }))} />;
      case 4:
         return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Evidencia Fotográfica</h3>
              <p className="text-sm text-gray-500 mb-6">Sube las fotos en alta resolución de la instalación terminada.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload label="Sistema Instalado (Panorámica)" description="Vista general de los paneles en el techo" value={formData.files?.systemPhoto} onChange={v => updateSectionInfo('files', { systemPhoto: v })} />
                <FileUpload label="Etiqueta Técnica Inversor" description="Foto real de la placa de datos en sitio" value={formData.files?.inverterLabelPhoto} onChange={v => updateSectionInfo('files', { inverterLabelPhoto: v })} />
                <FileUpload label="Etiqueta Técnica Panel" description="Foto real de la placa de datos de un módulo" value={formData.files?.panelLabelPhoto} onChange={v => updateSectionInfo('files', { panelLabelPhoto: v })} />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Documentación de Equipos</h3>
              <p className="text-sm text-gray-500 mb-6">Adjunta las fichas técnicas y certificados que coincidan con los modelos especificados en el diagrama unifilar.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 flex justify-between items-center">
                 <div>
                   <h4 className="font-medium text-gray-900 text-sm mb-2">Equipos reportados:</h4>
                   <ul className="text-sm text-gray-600 list-disc ml-4 space-y-1">
                     <li>Panel: {formData.unifilar?.panelModel || 'No definido'}</li>
                     <li>Inversor: {formData.unifilar?.inverterModel || 'No definido'}</li>
                   </ul>
                 </div>
                 <button
                   onClick={() => {
                     const isSearching = window.confirm('¿Desea buscar las fichas técnicas de estos modelos en la base de datos interna o en internet?');
                     if (isSearching) {
                       // MOCK SEARCH
                       setTimeout(() => {
                         alert('Fichas técnicas encontradas y adjuntadas exitosamente.');
                         const fileUpdates: any = {};
                         if (formData.unifilar?.panelModel) {
                            fileUpdates.panelDatasheet = `auto_ficha_${formData.unifilar.panelModel.replace(/\s+/g, '_')}.pdf`;
                         }
                         if (formData.unifilar?.inverterModel) {
                            fileUpdates.inverterDatasheet = `auto_ficha_${formData.unifilar.inverterModel.replace(/\s+/g, '_')}.pdf`;
                            fileUpdates.inverterCertificate = `auto_cert_UL_${formData.unifilar.inverterModel.replace(/\s+/g, '_')}.pdf`;
                         }
                         updateSectionInfo('files', fileUpdates);
                       }, 1500);
                     }
                   }}
                   className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
                 >
                   🔍 Buscar Automáticamente
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload label="Ficha Técnica Paneles" accept=".pdf" description="PDF del fabricante" value={formData.files?.panelDatasheet} onChange={v => updateSectionInfo('files', { panelDatasheet: v })} />
                <FileUpload label="Ficha Técnica Inversor" accept=".pdf" description="PDF del fabricante" value={formData.files?.inverterDatasheet} onChange={v => updateSectionInfo('files', { inverterDatasheet: v })} />
                <FileUpload label="Certificado UL del Inversor" accept=".pdf" description="Certificado de cumplimiento normativo" value={formData.files?.inverterCertificate} onChange={v => updateSectionInfo('files', { inverterCertificate: v })} />
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <AnexoAForm 
            formData={formData} 
            updateData={(updates) => setFormData(d => ({ ...d, anexoA: { ...d.anexoA, ...updates } }))} 
          />
        );
      case 7:
        return (
           <div className="space-y-6 flex flex-col items-center">
             <div className="bg-green-50 border border-green-200 w-full rounded-lg p-6 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-green-900 mb-2">Expediente Completo Consolidado</h3>
                <p className="text-green-700 max-w-lg mx-auto">
                  Todos los archivos, el Anexo A y el reporte final se han compilado en el Expediente General. Puedes descargar todo junto en un mismo PDF tamaño carta para su firma o almacenamiento.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  <button onClick={() => window.print()} className="px-6 py-3 bg-gray-900 text-white rounded-md shadow-lg hover:bg-gray-800 font-medium text-sm transition-all focus:ring focus:ring-gray-300 flex items-center gap-2">
                    <FileDown className="w-5 h-5" />
                    Descargar Expediente Completo (PDF)
                  </button>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-md shadow-lg hover:bg-green-700 font-medium text-sm transition-all focus:ring focus:ring-green-400">
                    Enviar a CFE
                  </button>
                </div>
             </div>
             
             <div className="border border-gray-200 rounded-lg w-full overflow-hidden mt-4">
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <span className="font-medium text-gray-900 text-sm">Resumen de Datos Técnicos</span>
                </div>
                <div className="p-4 grid grid-cols-2 text-sm gap-y-4">
                  <div>
                    <dt className="text-gray-500">Servicio / RPU</dt>
                    <dd className="font-medium text-gray-900 mt-1">{formData.client?.rpu || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Solicitante</dt>
                    <dd className="font-medium text-gray-900 mt-1">{formData.client?.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Capacidad Total a Instalar</dt>
                    <dd className="font-medium text-gray-900 mt-1">
                      {((formData.unifilar?.panelQuantity || 0) * (formData.unifilar?.panelPower || 0)) / 1000} kW
                    </dd>
                  </div>
                   <div>
                    <dt className="text-gray-500">Documentos Adjuntos</dt>
                    <dd className="font-medium text-gray-900 mt-1 flex items-center gap-2">
                       <Check className="w-4 h-4 text-green-500 inline" /> {Object.keys(formData.files || {}).filter(k=> (formData.files as any)[k]).length} recibidos
                    </dd>
                  </div>
                </div>
             </div>
           </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50/50 print:hidden relative rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveRequest(null)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isNew ? 'Nuevo Trámite' : `Expediente: ${formData.client?.name || 'Sin nombre'}`}
              </h2>
              <p className="text-sm text-gray-500">
                 {isNew ? 'Dando de alta expediente...' : `RPU: ${formData.client?.rpu}`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 rounded-md text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Nav */}
          <div className="hidden md:block w-64 bg-white border-r overflow-y-auto shrink-0">
            <div className="p-4 py-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Progreso del Expediente</h3>
              <ul className="space-y-1">
                {SECTIONS.map((section, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => setCurrentStep(idx)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between",
                        currentStep === idx 
                          ? "bg-yellow-50 text-yellow-800 font-medium" 
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {section}
                      {currentStep === idx && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-16">
              {renderStep()}

              <div className="mt-8 pt-6 border-t flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Anterior
                </button>
                
                {currentStep < SECTIONS.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(s => Math.min(SECTIONS.length - 1, s + 1))}
                    className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Siguiente Seccion
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-yellow-500 text-white rounded text-sm font-medium hover:bg-yellow-600 shadow-sm transition-colors"
                  >
                    Finalizar Expediente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE RENDER LAYERS */}
      <div className="hidden print:block absolute inset-0 bg-white z-[100]">
         {currentStep === 0 && <CartaPoderPrint formData={formData} />}
         {currentStep === 7 && <FullReportPrint formData={formData} />}
      </div>
    </>
  );
}
