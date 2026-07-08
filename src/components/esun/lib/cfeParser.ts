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
  last_payment_date?: string;
  last_payment_amount?: number;
  historic_consumptions?: number[];
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
  const tariff = tariffMatch ? tariffMatch[1].toUpperCase() : 'DAC';

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

  // 6. Client Name (supports person or company name)
  // Usually the client name is in the first lines of the bill. We'll search for labels first,
  // or fall back to the first line of the PDF that has words but no numbers (which is typically the name).
  let client_name = undefined;
  const nameMatch = normalizedText.match(/(?:Nombre|Razón\s+Social|Cliente)[\s:]*([A-ZÁÉÍÓÚÑ\s\.&,]{4,50})/i);
  if (nameMatch) {
    client_name = nameMatch[1].trim();
  } else {
    // Fallback: search for first capital word line in fullText
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    // Find a line that looks like a name (words, no numbers/tariffs/addresses)
    const nameCandidate = lines.find(line => 
      /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s\.&,]+$/i.test(line) && 
      !/Tarifa|CFE|Servicio|Total|Pagar|Consumo|Baja|Media|Dirección|Teléfono/i.test(line)
    );
    if (nameCandidate) {
      client_name = nameCandidate;
    }
  }

  // 7. Last payment date and amount
  const paymentDateMatch = normalizedText.match(/(?:Fecha\s+de\s+Corte|Límite\s+de\s+pago|Pague\s+antes\s+de|Fecha\s+de\s+emisión)[\s:]*([\d\s\w\-]{8,18})/i);
  const paymentAmountMatch = normalizedText.match(/(?:Último\s+pago|Pago\s+anterior|Su\s+pago\s+por)[\s:]*\$?\s*([\d,]+\.?\d*)/i);
  
  const last_payment_date = paymentDateMatch ? paymentDateMatch[1].trim() : undefined;
  const last_payment_amount = paymentAmountMatch ? parseFloat(paymentAmountMatch[1].replace(/,/g, '')) : undefined;

  // 8. Historic consumption (Cascading Strategy for kWh list)
  const historic_consumptions: number[] = [];
  const monthRegex = /\b(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+\d{2}\s+(\d+)\b/gi;
  let hMatch;
  while ((hMatch = monthRegex.exec(normalizedText)) !== null) {
    historic_consumptions.push(parseInt(hMatch[1]));
  }

  // 9. Consumption kWh (Cascading Strategy for current period)
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

  const total_mxn = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;
  
  // Rule: MT (Media Tensión) tariffs are monthly, BT (Baja Tensión) are bimonthly.
  // MT tariffs starts with GDM (GDMTO, GDMTH) or DI (DIST, DIT, RAMT/APMT are media).
  const is_bimonthly = !tariff.startsWith('GDM') && !tariff.startsWith('APM') && !tariff.startsWith('RAM') && !tariff.startsWith('DIS') && !tariff.startsWith('DI');
  const monthly_kWh = is_bimonthly ? Math.round(consumption / 2) : consumption;

  // Simplify Tariff Rate Division using total divisor, fallback to 4.50 if total amount is missing
  const tariff_rate = (consumption > 0 && total_mxn > 0) ? (total_mxn / consumption) : 4.50;

  return {
    service_number: serviceMatch ? serviceMatch[1].replace(/\s/g, '') : undefined,
    client_name,
    tariff,
    monthly_kWh,
    bimonthly_kWh: consumption,
    total_mxn,
    tariff_rate: parseFloat(tariff_rate.toFixed(2)),
    demand_kw: demandMatch ? parseFloat(demandMatch[1]) : undefined,
    power_factor: pfMatch ? parseFloat(pfMatch[1]) : undefined,
    is_bimonthly,
    last_payment_date,
    last_payment_amount,
    historic_consumptions: historic_consumptions.length > 0 ? historic_consumptions : undefined
  };
}

export async function parseCFEPdf(file: File): Promise<CFEData> {
  const text = await extractTextFromPdf(file);
  return parseCFEText(text);
}
