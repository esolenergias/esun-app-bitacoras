import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const apiKeyMatch = envFile.match(/VITE_GEMINI_API_KEY="?(.*?)"?(?:\n|$)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

if (!apiKey) {
  console.error("No API key found in .env");
  process.exit(1);
}

const ocrText = `Comisión Federal de Electricidad
A Paseo de la Reforma 164, Col. Juárez,
Alcala: Cuauhtémoc, Código Postal: 06600,
Comisión Federal de Electricidad * Ciudad de México. RFC: CFE370814010
SARMIENTO BRISENO GABRIEL ALEJ — TOTALAPAGAR:
pre $6,151
GENOVA (SES MIL CIENTO CINCUENTA Y UN PESOS MN)
CIUDAD DEL VALLEC.P.63157
TEPIC,NAY.
NO. DE SERVICIO:487260201146
RMU:63157 26-02-18 SABG-850403 019 CFE
CUENTA:220X124011080246 Mille ones
duminandoaMéxeo -
LÍMITE DE PAGO:02 JUL 26 — . y 11 ERCES
M Bs
CORTE A PARTIR:03 JUL 26 L <-> 7
7 Mi
TARIFA:PDSTNO. MEDIDOR:RNEOS1 Razones para seguir E
MULTIPLICADOR:' y
AE iluminando a México. H ==
PERIODO FACTURADO:15 ABR 26-16 JUN 26 ,
(Comenpla Lectura actual Lectura anterior Total Precio Subtotal
Medida ECQMEstimada MI _ Medida EM Estimada MN periodo (MXN) (MXN)
Energía (kWh) 207 870 1.207
7 y Este gráfico refleja tu nivel de consumo, A menor uso, mayor apoyo. Subtotal
T_T —————[—ZT,UHK—;—Ue—o
Costos de la energía en el Mercado Eléctrico Mayorista Desglose del importe a pagar
Concepto s E SA Importe (MXN) Concepto Importe (MXN)
Suministro 66.14 0.00 0.00 66.14 Cargo Fiol) 66.14
Distibución 0.00 000 1,614.60 1,614.60 Energia 5,297.58
Transmisión 0.00 0.00 217.38 217.38 Subtotal 5,303.67
CENACE 0.00 0.00 917 917 IVA 18% 81859
Energía 0.00 0.00 2095.25 2095.25 Fac. del Periodo 6,152.28
Capacidad 000 000 1,292.70 1,292.70 Credito Apli. Fac.() -081
SCnvEM) 0.00 0.00 833 833 Adeudo Anterior 12,811.18
Su Pago -12,811.00
Total 6,151.63

del 16 FEB 26 al 15 ABR 26 761 $3,932.00`;

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
  ]
}

REGLAS:
- No devuelvas NADA MÁS que el JSON (sin \`\`\`json y sin explicaciones extra).
- El JSON debe poder ser parseado directamente con JSON.parse().
- Para historic_periods, si el OCR dice "del 16 FEB 26 al 15 ABR 26 761", extrae "ABR 26" como period y 761 como kwh.
- En total_mxn ignora la palabra TOTALAPAGAR o signos raros, busca el valor numérico como 6151.63.

TEXTO OCR SUCIO:
${ocrText}
`;

async function testAI() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  console.log("Calling Gemini API...");
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    });
    
    if (!res.ok) {
      console.error("API Error:", res.status, await res.text());
      return;
    }
    
    const data = await res.json();
    console.log("=== RAW GEMINI RESPONSE ===");
    console.log(data.candidates[0].content.parts[0].text);
    console.log("=== USAGE METADATA ===");
    console.log(JSON.stringify(data.usageMetadata, null, 2));
  } catch(e) {
    console.error("Fetch failed", e);
  }
}

testAI();
