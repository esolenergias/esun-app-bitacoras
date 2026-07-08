import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface CFEData {
  service_number?: string;
  client_name?: string;
  tariff: string;
  monthly_kWh: number;
  bimonthly_kWh: number;
  total_mxn: number;
  tariff_rate: number;
  demand_kw?: number;
  power_factor?: number;
  period_start?: string;
  period_end?: string;
  is_bimonthly: boolean;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

export function parseCFEText(fullText: string): CFEData {
  // Apply regex parsing
  const tariffMatch = fullText.match(/Tarifa[\s:]+([A-Z0-9]+)/i);
  const serviceMatch = fullText.match(/(?:Núm(?:ero)?|No\.?)(?:\s+de)?\s+Servicio[\s:]*([\d\s]{12,18})/i);
  const totalMatch = fullText.match(/Total a [Pp]agar[\s:]+\$?([\d,]+\.?\d*)/i);
  const demandMatch = fullText.match(/Demanda.*?\b(\d+\.?\d*)\s*kW/i);
  const pfMatch = fullText.match(/(?:Factor de Potencia|F\.?\s*P\.?)[\s:]+(\d+\.?\d*)/i);

  // Try extracting bimonthly/monthly consumption kWh
  const consumptionMatch = fullText.match(/(?:Consumo(?:\s+de\s+energía)?(?:\s*\(kWh\))?|Consumo\s+Total)[\s:]*(\d+)/i);
  if (!consumptionMatch) {
    throw new Error("No se pudo extraer el consumo del recibo CFE. Ingrésalo manualmente.");
  }

  // Parse values
  const tariff = tariffMatch ? tariffMatch[1].toUpperCase() : 'DAC';
  const total_mxn = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;
  const bimonthly_kWh = parseInt(consumptionMatch[1]);
  
  // Auto-detect bimonthly vs monthly (CFE residential bimonthly, commercial monthly)
  const is_bimonthly = !tariff.startsWith('G') && !tariff.startsWith('P'); // GDMTH, PDBT monthly
  const monthly_kWh = is_bimonthly ? Math.round(bimonthly_kWh / 2) : bimonthly_kWh;

  // Simplify Tariff Rate Division using total bimonthly divisor
  const tariff_rate = bimonthly_kWh > 0 ? (total_mxn / bimonthly_kWh) : 4.50;

  return {
    service_number: serviceMatch ? serviceMatch[1].replace(/\s/g, '') : undefined,
    tariff,
    monthly_kWh,
    bimonthly_kWh,
    total_mxn,
    tariff_rate: parseFloat(tariff_rate.toFixed(2)),
    demand_kw: demandMatch ? parseFloat(demandMatch[1]) : undefined,
    power_factor: pfMatch ? parseFloat(pfMatch[1]) : undefined,
    is_bimonthly
  };
}

export async function parseCFEPdf(file: File): Promise<CFEData> {
  const text = await extractTextFromPdf(file);
  return parseCFEText(text);
}
