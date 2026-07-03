import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  label: string;
  value?: string;
  onChange: (sign: string) => void;
}

export function SignaturePad({ label, value, onChange }: SignaturePadProps) {
  const sigPad = useRef<SignatureCanvas>(null);

  const clear = (e: React.MouseEvent) => {
    e.preventDefault();
    sigPad.current?.clear();
    onChange('');
  };

  const handleEnd = () => {
    if (sigPad.current) {
      onChange(sigPad.current.toDataURL());
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {value && !sigPad.current?.isEmpty() ? (
         <div className="border border-gray-300 rounded-lg bg-gray-50 p-2 relative h-32 flex items-center justify-center">
            <img src={value} alt={label} className="max-h-full max-w-full" />
            <button
              onClick={clear}
              className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
            >
              Borrar
            </button>
         </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigPad}
            canvasProps={{ className: 'w-full h-32 cursor-crosshair' }}
            onEnd={handleEnd}
          />
          <div className="bg-gray-50 border-t border-gray-200 p-2 flex justify-between items-center">
            <span className="text-xs text-gray-500">Firme en el recuadro</span>
            <button
              onClick={clear}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
