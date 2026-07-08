import React, { useState, useRef } from 'react';
import { FileText, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { extractTextFromPdf, parseCFEText, CFEData } from './lib/cfeParser';

interface CFEUploaderProps {
  onParsed: (data: CFEData) => void;
}

export default function CFEUploader({ onParsed }: CFEUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setError("Por favor, selecciona un archivo PDF válido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await extractTextFromPdf(file);
      const data = parseCFEText(text);
      onParsed(data);
    } catch (err: any) {
      console.error("Error al parsear CFE PDF:", err);
      setError(err?.message || "Ocurrió un error inesperado al leer el PDF. Asegúrate de que sea un recibo de CFE válido.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleManualFallback = () => {
    const defaultData: CFEData = {
      service_number: '',
      client_name: '',
      tariff: 'DAC',
      monthly_kWh: 0,
      bimonthly_kWh: 0,
      total_mxn: 0,
      tariff_rate: 4.50,
      is_bimonthly: true,
    };
    onParsed(defaultData);
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-dark-1 border border-dark-4 rounded-2xl shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-display text-gold mb-2 text-center uppercase tracking-wide">Carga tu Recibo de CFE</h2>
        <p className="text-cream-muted text-sm">
          Sube el archivo PDF de tu recibo para extraer automáticamente tu consumo y tarifa.
        </p>
      </div>

      <div
        className={`relative p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
          dragActive
            ? "border-gold bg-gold/5"
            : "border-[#C49825]/40 hover:border-gold hover:bg-white/5"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="application/pdf"
          onChange={handleChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-12 w-12 text-gold animate-spin mb-4" />
            <p className="text-cream font-semibold">Procesando recibo...</p>
            <p className="text-cream-muted text-xs mt-1">Extrayendo texto y calculando variables</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="p-4 bg-[#C49825]/10 rounded-full text-gold mb-4 border border-[#C49825]/20">
              <FileText className="h-10 w-10 text-[#C49825]" />
            </div>
            <p className="text-cream font-medium text-lg mb-2">
              Arrastra tu recibo CFE PDF aquí o haz clic para buscar
            </p>
            <p className="text-cream-muted text-xs">
              Solo archivos PDF oficiales de CFE.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 border border-red-500/20 bg-red-950/20 rounded-xl flex flex-col sm:flex-row gap-4 items-start animate-[fadeIn_0.2s_ease-out]">
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg mt-0.5">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-red-400 font-semibold text-sm mb-1">Error al procesar el PDF</h4>
            <p className="text-cream-muted text-xs leading-relaxed mb-3">{error}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleManualFallback();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Ingresar datos manualmente
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
