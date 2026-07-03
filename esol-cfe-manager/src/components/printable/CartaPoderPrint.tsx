import React from 'react';
import { CFERequest } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface CartaPoderPrintProps {
  formData: Partial<CFERequest>;
}

export function CartaPoderPrint({ formData }: CartaPoderPrintProps) {
  const getFormattedDate = (dateStr?: string) => {
    if (!dateStr) return '[Fecha]';
    try {
      const date = parseISO(dateStr);
      return format(date, "EEEE, d 'de' MMMM 'del' yyyy", { locale: es });
    } catch {
      return '[Fecha]';
    }
  };

  const getMonthAndYear = (dateStr?: string) => {
    if (!dateStr) return '[MES Y AÑO]';
    try {
      const date = parseISO(dateStr);
      return format(date, "MMMM 'del' yyyy", { locale: es }).toUpperCase();
    } catch {
      return '[MES Y AÑO]';
    }
  };

  return (
    <div className="w-full bg-white text-[15px] text-black font-sans leading-relaxed">
      <div className="font-bold mb-4">
        <p>CARTA PODER SIMPLE</p>
        <p>{formData.cartaPoder?.location || '[Lugar]'}</p>
      </div>
      
      <div className="mb-8 capitalize">
        <p>{getFormattedDate(formData.cartaPoder?.date)}</p>
      </div>

      <div className="font-bold mb-8">
        <p>COMISION FEDERAL DE ELECTRICIDAD (C.F.E)</p>
      </div>
      
      <p className="mb-8 text-justify uppercase font-medium leading-loose">
        YO {formData.client?.name || '[NOMBRE DEL CLIENTE]'} DE NACIONALIDAD MEXICANA, OTORGO PODER A {formData.cartaPoder?.grantedTo || '[NOMBRE DE QUIEN RECIBE]'} PARA QUE ACTUE EN MI NOMBRE ANTE CFE Y HACER CONTRATOS DE INTERCONEXION, ACLARACIONES Y CUALQUIER TRAMITE CORRESPONDIENTE A CFE AL SERVICIO CON RPU: {formData.client?.rpu || '[RPU]'} PARA EL DOMICILIO {formData.client?.address || '[DOMICILIO]'} EN EL MUNICIPIO DE {formData.client?.municipality || '[MUNICIPIO]'}, ESTADO DE {formData.client?.state || '[ESTADO]'} CON CODIGO POSTAL: {formData.client?.zipCode || '[CODIGO POSTAL]'} ASI COMO CUALQUIER FIRMA DE CONTRATOS ANTE CFE.
      </p>
      
      <p className="mb-16 text-justify uppercase font-medium">
        ESTE PODER ES EFECTIVO APARTIR DE TODO EL MES DE {getMonthAndYear(formData.cartaPoder?.date)}
      </p>
      
      <div className="space-y-12 max-w-2xl mx-auto pl-8">
        <div className="flex items-end gap-4 min-h-[4rem]">
          <div className="w-32 font-bold uppercase shrink-0">OTORGANTE:</div>
          <div className="flex-1 border-b border-black text-center relative pb-1">
            {formData.cartaPoder?.grantorSignature && <img src={formData.cartaPoder.grantorSignature} alt="Firma" className="max-h-16 absolute bottom-2 left-1/2 -translate-x-1/2" />}
            <span className="uppercase font-medium z-10 relative">{formData.client?.name || '[NOMBRE DEL CLIENTE]'}</span>
          </div>
        </div>

        <div className="flex items-end gap-4 min-h-[4rem]">
          <div className="w-32 font-bold uppercase shrink-0">QUIEN RECIBE:</div>
          <div className="flex-1 border-b border-black text-center relative pb-1">
            {formData.cartaPoder?.receiverSignature && <img src={formData.cartaPoder.receiverSignature} alt="Firma" className="max-h-16 absolute bottom-2 left-1/2 -translate-x-1/2" />}
            <span className="uppercase font-medium z-10 relative">{formData.cartaPoder?.grantedTo || '[QUIEN RECIBE]'}</span>
          </div>
        </div>

        <div className="flex items-end gap-4 min-h-[4rem]">
          <div className="w-32 font-bold uppercase shrink-0">TESTIGO 1:</div>
          <div className="flex-1 border-b border-black text-center relative pb-1">
            {formData.cartaPoder?.witness1Signature && <img src={formData.cartaPoder.witness1Signature} alt="Firma" className="max-h-16 absolute bottom-2 left-1/2 -translate-x-1/2" />}
            <span className="uppercase font-medium z-10 relative">{formData.cartaPoder?.witness1Name || '[TESTIGO 1]'}</span>
          </div>
        </div>

        <div className="flex items-end gap-4 min-h-[4rem]">
          <div className="w-32 font-bold uppercase shrink-0">TESTIGO 2:</div>
          <div className="flex-1 border-b border-black text-center relative pb-1">
            {formData.cartaPoder?.witness2Signature && <img src={formData.cartaPoder.witness2Signature} alt="Firma" className="max-h-16 absolute bottom-2 left-1/2 -translate-x-1/2" />}
            <span className="uppercase font-medium z-10 relative">{formData.cartaPoder?.witness2Name || '[TESTIGO 2]'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
