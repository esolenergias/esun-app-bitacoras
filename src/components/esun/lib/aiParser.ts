import type { CFEData } from './cfeParser';

export async function parseCFETextWithAI(ocrText: string): Promise<CFEData> {
  const apiKey = localStorage.getItem('cfe_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const model = localStorage.getItem('cfe_gemini_model') || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `
Eres un experto analista de recibos de luz (CFE) en México. 
A continuación te proporcionaré el texto "sucio" extraído por un OCR de un recibo CFE. El OCR comete muchos errores (confunde 'l' con '1', introduce letras raras, etc.).

Tu tarea es leer ese texto ruidoso, interpretarlo, limpiar los datos y devolver UNICAMENTE un objeto JSON válido con la siguiente estructura y tipos de datos:
{
  "service_number": "cadena de 12 a 18 dígitos sin espacios",
  "client_name": "nombre del cliente en mayúsculas",
  "tariff": "tarifa (ej. PDBT, GDBT, DAC, 1, 1A, etc.)",
  "current_period": "periodo actual (ej. 15 ABR 26 - 16 JUN 26)",
  "monthly_kWh": número entero (si la tarifa es bimestral, divide el consumo total entre 2, si es mensual pon el total),
  "bimonthly_kWh": número entero (el consumo total del periodo facturado),
  "total_mxn": número flotante (el total a pagar, sin símbolos de moneda),
  "tariff_rate": número flotante (divide el total_mxn entre bimonthly_kWh. Si no se puede, pon 4.50),
  "is_bimonthly": booleano (true si NO es GDM, APM, RAM, DIS, DI),
  "historic_periods": [ // Esto es muy importante. En recibos PDBT/GDBT suele decir "del 13 FEB al 17 ABR 26 1752".
    {
      "period": "MES AÑO (ej. ABR 26)",
      "kwh": número entero,
      "amount": número flotante (0 si no se puede leer bien)
    }
  ],
  "city": "ciudad y estado si aparece, ej. HERMOSILLO, CDMX. En mayúsculas, si no se encuentra pon 'CDMX'"
}

REGLAS:
- No devuelvas NADA MÁS que el JSON (sin \`\`\`json y sin explicaciones extra).
- El JSON debe poder ser parseado directamente con JSON.parse().
- Para historic_periods, si el OCR dice "del 16 FEB 26 al 15 ABR 26 761", extrae "ABR 26" como period y 761 como kwh.
- En total_mxn ignora la palabra TOTALAPAGAR o signos raros, busca el valor numérico como 6151.63.

TEXTO OCR SUCIO:
${ocrText}
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error en la API de Gemini: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.candidates[0].content.parts[0].text;
    
    // Clean up markdown if the AI mistakenly included it
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData: CFEData = JSON.parse(responseText);
    return parsedData;

  } catch (error) {
    console.error("Error parsing with AI:", error);
    throw error;
  }
}
