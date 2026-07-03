import React from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  label: string;
  description?: string;
  value?: string;
  onChange: (fileUrl: string) => void;
  accept?: string;
  className?: string;
}

export function FileUpload({ label, description, value, onChange, accept = "image/*,.pdf", className }: FileUploadProps) {
  
  // Fake upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onChange(url);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      
      {value ? (
        <div className="relative border rounded-lg overflow-hidden bg-gray-50 p-2 flex items-center gap-4">
           {value.startsWith('blob:') && !value.includes('.pdf') ? (
               <img src={value} alt="Preview" className="w-16 h-16 object-cover rounded" />
           ) : (
              <div className="w-16 h-16 bg-blue-50 text-blue-500 flex items-center justify-center rounded uppercase font-bold text-xs">
                FILE
              </div>
           )}
           <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Documento cargado</p>
              <button 
                onClick={() => onChange('')}
                className="text-xs text-red-500 hover:text-red-700 mt-1"
              >
                Eliminar
              </button>
           </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-6 h-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Haga clic para subir un archivo</p>
             <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF hasta 10MB</p>
          </div>
          <input type="file" className="hidden" accept={accept} onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}
