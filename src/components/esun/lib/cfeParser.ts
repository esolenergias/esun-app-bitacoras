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
  // Print full text in console to simplify developer/user debugging of PDF layouts
  console.log("=== ESUN CFE PARSER DEBUG: EXTRACTED TEXT FROM PDF ===");
  console.log(fullText);
  console.log("======================================================");

  // Normalize string: squash multiple spaces and line breaks into single spaces for easier regex matches
  const normalizedText = fullText.replace(/\s+/g, ' ');

  // 1. Tariff (search normalized string)
  const tariffMatch = normalizedText.match(/Tarifa\s*:\s*([A-Z0-9]+)/i) || 
                      normalizedText.match(/Tarifa\s+([A-Z0-9]+)/i) ||
                      normalizedText.match(/\b(DAC|PDBT|GDBT|GDMTO|GDMTH|1[A-F]?)\b/i);

  // 2. Service Number (remove spaces in matched output)
  const serviceMatch = normalizedText.match(/(?:Núm(?:ero)?|No\.?)(?:\s+de)?\s+Servicio[\s:]*([\d\s]{12,18})/i) ||
                       normalizedText.match(/\b(\d{12,18})\b/);

  // 3. Total MXN Amount
  const totalMatch = normalizedText.match(/Total\s+a\s+[Pp]agar\s*[\$:\s]*\s*([\d,]+\.?\d*)/i) ||
                     normalizedText.match(/Cargo\s+Límite\s*[\$:\s]*\s*([\d,]+\.?\d*)/i) ||
                     normalizedText.match(/Total\s*[\$:\s]*\s*([\d,]+\.?\d*)\s*Pago/i);

  // 4. Demand kW
  const demandMatch = normalizedText.match(/Demanda\s*:\s*(\d+\.?\d*)\s*kW/i) ||
                      normalizedText.match(/Demanda\s+Máxima\s*:\s*(\d+\.?\d*)/i) ||
                      normalizedText.match(/Demanda.*?\b(\d+\.?\d*)\s*kW/i);

  // 5. Power Factor %
  const pfMatch = normalizedText.match(/(?:Factor\s+de\s+Potencia|F\.?\s*P\.?)\s*[\s:]+\s*(\d+\.?\d*)/i) ||
                  normalizedText.match(/(?:Factor\s+de\s+Potencia|F\.?\s*P\.?)\s+(\d+\.?\d*)/i);

  // 6. Consumption kWh (Cascading Strategy)
  let consumption: number | null = null;

  // Strategy A: Strict match
  const consumptionStrict = normalizedText.match(/(?:Consumo(?:\s+de\s+energía)?(?:\s*\(kWh\))?|Consumo\s+Total)[\s:]*(\d+)/i);
  if (consumptionStrict) {
    consumption = parseInt(consumptionStrict[1]);
  }

  // Strategy B: Table-based residential "Diferencia Totales Energía <Current> <Previous> <Diff>"
  if (consumption === null) {
    const tableMatch = normalizedText.match(/(?:Diferencia\s+Totales\s+Energía|Energía)\s+(\d+)\s+(\d+)\s+(\d+)/i);
    if (tableMatch) {
      consumption = parseInt(tableMatch[3]);
    }
  }

  // Strategy C: Flexible proximity-based match
  if (consumption === null) {
    const energyMatch = normalizedText.match(/(?:Consumo\s+de\s+energía|Consumo\s+Total|Energía).*?\b(\d+)\b/i);
    if (energyMatch) {
      consumption = parseInt(energyMatch[1]);
    }
  }

  if (consumption === null || isNaN(consumption) || consumption <= 0) {
    throw new Error("No se pudo extraer el consumo del recibo CFE. Ingrésalo manualmente.");
  }

  // Parse values
  const tariff = tariffMatch ? tariffMatch[1].toUpperCase() : 'DAC';
  const total_mxn = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;
  
  // Auto-detect bimonthly vs monthly (CFE residential bimonthly, commercial monthly)
  const is_bimonthly = !tariff.startsWith('G') && !tariff.startsWith('P'); // GDMTH, PDBT monthly
  const monthly_kWh = is_bimonthly ? Math.round(consumption / 2) : consumption;

  // Simplify Tariff Rate Division using total bimonthly divisor, fallback to 4.50 if total amount is missing
  const tariff_rate = (consumption > 0 && total_mxn > 0) ? (total_mxn / consumption) : 4.50;

  return {
    service_number: serviceMatch ? serviceMatch[1].replace(/\s/g, '') : undefined,
    tariff,
    monthly_kWh,
    bimonthly_kWh: consumption,
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
