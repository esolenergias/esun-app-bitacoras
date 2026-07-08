import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface CFEHistoricPeriod {
  period: string;
  kwh: number;
  amount: number;
}

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
  historic_periods?: CFEHistoricPeriod[];
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

  // 6. Client Name Extraction
  // Find the header of the CFE bill. The name of the client is on the line(s) below it.
  // We must skip lines containing metadata like "REGIMEN FISCAL", "RFC", "CP", "DOMICILIO", etc.
  let client_name = undefined;
  const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Find the address of the main office as the anchor
  const cfeAddressIdx = lines.findIndex(l => 
    /Av\. Paseo de la Reforma/i.test(l) || 
    /Juárez, Alcaldía/i.test(l) || 
    /Ciudad de México/i.test(l)
  );

  if (cfeAddressIdx !== -1 && cfeAddressIdx + 1 < lines.length) {
    client_name = lines[cfeAddressIdx + 1];
  }
  
  if (!client_name || /Regimen|Régimen|Fiscal|RFC|Domicilio|Teléfono|Clave|CP|C\.P\.|Pagar/i.test(client_name)) {
    // Fallback A: Scan up to 5 lines below the header to find the real name
    const headerIdx = lines.findIndex(l => 
      /CFE\s+Suministrador\s+de\s+Servicios/i.test(l) || 
      /Suministrador\s+de\s+Servicios\s+Básicos/i.test(l)
    );
    if (headerIdx !== -1) {
      for (let i = headerIdx + 1; i <= Math.min(headerIdx + 5, lines.length - 1); i++) {
        const line = lines[i];
        if (
          line.length > 3 &&
          !/Regimen|Régimen|Fiscal|RFC|Domicilio|Teléfono|Clave|CP|C\.P\.|Pagar|Servicio|Tarifa|Medidor/i.test(line) &&
          /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s\.&,]+$/i.test(line)
        ) {
          client_name = line;
          break;
        }
      }
    }
  }

  if (!client_name) {
    // Fallback B: search for first capital word line in fullText
    const nameMatch = normalizedText.match(/(?:Nombre|Razón\s+Social|Cliente)[\s:]*([A-ZÁÉÍÓÚÑ\s\.&,]{4,50})/i);
    if (nameMatch) {
      client_name = nameMatch[1].trim();
    } else {
      const nameCandidate = lines.find(line => 
        line.length > 5 &&
        /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s\.&,]+$/i.test(line) && 
        !/Tarifa|CFE|Servicio|Total|Pagar|Consumo|Baja|Media|Dirección|Teléfono|Régimen|Fiscal|RFC/i.test(line)
      );
      if (nameCandidate) {
        client_name = nameCandidate;
      }
    }
  }

  // 7. Extract Period Match
  const periodMatch = normalizedText.match(/PERIODO FACTURADO\s*:\s*([\d\s\w-]{10,25})/i) ||
                      normalizedText.match(/PERIODO\s+FACTURADO\s*:\s*([\d\s\w-]{10,25})/i);
  const current_period = periodMatch ? periodMatch[1].replace(/-/g, ' - ').replace(/\s+/g, ' ').trim() : undefined;

  // 8. Extract Historic Periods: Period, kWh, Amount
  const historic_periods: CFEHistoricPeriod[] = [];
  
  // Strategy A: Direct line-by-line regex match for table rows (Mes Año kWh Importe)
  // Coincides on the end of the line, ignoring payment status if present
  const tableRowRegex = /\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(\d{2})\s+(\d+)\s+\$?([\d,]+(?:\.\d{2})?)\b/gi;
  let hMatch;
  while ((hMatch = tableRowRegex.exec(normalizedText)) !== null) {
    historic_periods.push({
      period: `${hMatch[1]} ${hMatch[2]}`,
      kwh: parseInt(hMatch[3]),
      amount: parseFloat(hMatch[4].replace(/,/g, ''))
    });
  }

  // Strategy B: Proximity-based extraction if desynced columns (PDF.js reads column blocks separately)
  if (historic_periods.length === 0) {
    const periods = normalizedText.match(/\b(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+\d{2}\b/gi) || [];
    const kwhMatches = normalizedText.match(/\b\d{2,5}\b/g) || [];
    const amountMatches = normalizedText.match(/\$?[\d,]+\.\d{2}\b/g) || normalizedText.match(/\$?[\d,]{3,6}\b/g) || [];
    
    const filteredKwh = kwhMatches
      .map(Number)
      .filter(n => n > 50 && n < 80000 && !periods.some(p => p.includes(String(n))));

    if (periods.length > 0) {
      periods.forEach((p, idx) => {
        const kwh = filteredKwh[idx] || 0;
        const amountStr = amountMatches[idx] || "0";
        const amount = parseFloat(amountStr.replace(/[\$,]/g, '')) || 0;
        historic_periods.push({
          period: p,
          kwh,
          amount
        });
      });
    }
  }

  // Insert current period at the beginning if extracted
  if (current_period) {
    const total_mxn = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;
    const consumptionMatch = normalizedText.match(/(?:Consumo(?:\s+de\s+energía)?(?:\s*\(kWh\))?|Consumo\s+Total)[\s:]*(\d+)/i);
    const consumption = consumptionMatch ? parseInt(consumptionMatch[1]) : 0;
    
    historic_periods.unshift({
        period: current_period,
        kwh: consumption,
        amount: total_mxn
    });
  }

  // 9. Auto-determine last payment details from the most recent period of the historic table
  let last_payment_date = undefined;
  let last_payment_amount = undefined;
  
  if (historic_periods.length > 0) {
    const latestPeriod = historic_periods[0];
    last_payment_date = latestPeriod.period;
    last_payment_amount = latestPeriod.amount;
  } else {
    // Standard regex fallback
    const paymentDateMatch = normalizedText.match(/(?:Fecha\s+de\s+Corte|Límite\s+de\s+pago|Pague\s+antes\s+de|Fecha\s+de\s+emisión)[\s:]*([\d\s\w\-]{8,18})/i);
    const paymentAmountMatch = normalizedText.match(/(?:Último\s+pago|Pago\s+anterior|Su\s+pago\s+por)[\s:]*\$?\s*([\d,]+\.?\d*)/i);
    last_payment_date = paymentDateMatch ? paymentDateMatch[1].trim() : undefined;
    last_payment_amount = paymentAmountMatch ? parseFloat(paymentAmountMatch[1].replace(/,/g, '')) : undefined;
  }

  // 10. Consumption kWh (Cascading Strategy for current period)
  let consumption: number | null = null;
  
  if (historic_periods.length > 0) {
    // If we have historic periods, the current period consumption is the most recent one
    consumption = historic_periods[0].kwh;
  }

  if (consumption === null) {
    // Strategy A: Strict match
    const consumptionStrict = normalizedText.match(/(?:Consumo(?:\s+de\s+energía)?(?:\s*\(kWh\))?|Consumo\s+Total)[\s:]*(\d+)/i);
    if (consumptionStrict) {
      consumption = parseInt(consumptionStrict[1]);
    }
  }

  if (consumption === null) {
    // Strategy B: Table-based residential "Diferencia Totales Energía <Current> <Previous> <Diff>"
    const tableMatch = normalizedText.match(/(?:Diferencia\s+Totales\s+Energía|Energía)\s+(\d+)\s+(\d+)\s+(\d+)/i);
    if (tableMatch) {
      consumption = parseInt(tableMatch[3]);
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
    historic_periods: historic_periods.length > 0 ? historic_periods : undefined
  };
}

export async function parseCFEPdf(file: File): Promise<CFEData> {
  const text = await extractTextFromPdf(file);
  return parseCFEText(text);
}
