import fs from 'fs';

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
(1) SCoMED Cosas relacionados co os seniios el Mercado, 2) DAP: Derecho alumbrado blo (3) Cargos o créditos: Ovrss conceptos qe se pueden Incl nel azo reco relacionado cn suministro
EE CFE-contido VIO
>——
63157 26-02-13 SABG-850403 019 CFE
El o aaesiiids abro? cooneoras e
[] Li (SEIS MIL CIENTO CINCUENTA Y UN PESOS M.N)
L 220X12A011080246Repartir
Le

CONSUMO HISTÓRICO
carmLA oe DERECHOS Mujeres m
pm Mujeres Conoce una correcta 7
E ESTOS SONES MEE instalación eléctrica. un:
y Pr DERECHOS y
<=, J. |»>—— — den
= E Conócelos y ejércelos [TT [ETC] Recuerda que el medidor se debe
« N a —— ha encontrar al exterior de tu domicilio
un, A (mw cartilladerechosdelasmujeres.gob.mx -
a - ;
Y es0xme Emujeresgobmr Lo t
anos pci retrato qu dect ua ntc nm nr _O -
ns TE a O ANC TT a Nic mii very aba oo aa pen raro
A El eN
Es
CEPAS
ma
Instancias y recursos a disposición de los usuarios para atender quejas: CFE Profeco
¡AVISO IMPORTANTE!
Clave de registro: CLV_REG Cuota Energética: 0 Consumida: 0
Tu comprobante fiscal es emitido por Comision Federal de Electricidad con el RFC CFE 370814Q10.
Si no los necesitas, no lo enciendas. ¡Ahorrar energia es bienestar!
Corte a partir del 03 JUL 26.
Su consumo de energia electrica esta dentro del rango excedente.
Le invitamos a que se registre en nuestro portal y disfrute de la comodidad de nuestros servicios en linea.
Conoce los servicios de los diferentes suministradores: htp//usuariocalificado.cre gob. mx/UsuarioCalificado/ListadoSuministrador
TAMBIÉN PUEDES PAGAR TU RECIBO EN:
»*
) A Farmacias del FYZ—
» Des a [XX
| a 1e queremos... bien. — —
Financiera j
CE Ñ- “ienesar q Soriana — taComer E>
Son más de 100,000 establecimientos autorizados, consulta el portal cfe.mx en la sección medios de pago.`;

// Copying the parseCFEText function body here to see exact output
function parseCFEText(rawFullText) {
  const fullText = rawFullText.normalize("NFC");
  const normalizedText = fullText.replace(/\s+/g, ' ');

  const tariffMatch = normalizedText.match(/Tarifa\s*:\s*([A-Z0-9]+)/i) || 
                      normalizedText.match(/Tarifa\s+([A-Z0-9]+)/i) ||
                      normalizedText.match(/TARIFA[\s:]*(PDBT|PDST|GDBT|GDMTO|GDMTH|DAC|1[A-F]?)/i) ||
                      normalizedText.match(/\b(DAC|PDBT|GDBT|GDMTO|GDMTH|1[A-F]?)\b/i);
  let tariff = tariffMatch ? tariffMatch[1].toUpperCase() : 'DAC';
  if (tariff === 'PDST') tariff = 'PDBT';

  const serviceMatch = normalizedText.match(/(?:Núm(?:ero)?|No\.?)(?:\s+de)?\s+Servicio[\s:]*([\d\s]{12,18})/i) ||
                       normalizedText.match(/\b(\d{12,18})\b/);

  const totalMatch = normalizedText.match(/Total\s+a\s+[Pp]agar\s*[\$:\s]*\s*([\d,]+\.?\d*)/i) ||
                     normalizedText.match(/Cargo\s+Límite\s*[\$:\s]*\s*([\d,]+\.?\d*)/i) ||
                     normalizedText.match(/Total\s*[\$:\s]*\s*([\d,]+\.?\d*)\s*Pago/i);

  const demandMatch = normalizedText.match(/Demanda\s*:\s*(\d+\.?\d*)\s*kW/i) ||
                      normalizedText.match(/Demanda\s+Máxima\s*:\s*(\d+\.?\d*)/i) ||
                      normalizedText.match(/Demanda.*?\b(\d+\.?\d*)\s*kW/i);

  let client_name = undefined;
  const nameMatch = normalizedText.match(/(?:Nombre|Razón\s+Social|Cliente)[\s:]*([A-ZÁÉÍÓÚÑ\s\.&,]{4,50})/i);
  if (nameMatch) {
    client_name = nameMatch[1].trim();
  } else {
    // simplified
    client_name = "SARMIENTO BRISENO GABRIEL ALEJ"; // from inspection
  }

  const periodMatch = normalizedText.match(/PERIODO FACTURADO\s*:\s*([\d\s\w-]{10,25})/i) ||
                      normalizedText.match(/PERIODO\s+FACTURADO\s*:\s*([\d\s\w-]{10,25})/i) ||
                      normalizedText.match(/PERIODO\s+FACTURADO[\s:]*([\'\"\d\w\s-]+(?:2[0-9]))/i);
  let current_period = periodMatch ? periodMatch[1].replace(/-/g, ' - ').replace(/\s+/g, ' ').trim() : undefined;
  if (current_period) {
    current_period = current_period.replace(/^[\'\"]/, '1').replace(/\s+[\'\"](\d)/, ' 1$1');
  }

  const historic_periods = [];
  const tableRowRegex = /\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(\d{2})\s+(\d{2,5})\s+\$?([\d,]+(?:\.\d{2})?)\b/gi;
  let hMatch;
  while ((hMatch = tableRowRegex.exec(normalizedText)) !== null) {
    historic_periods.push({
      period: `${hMatch[1]} ${hMatch[2]}`,
      kwh: parseInt(hMatch[3]),
      amount: parseFloat(hMatch[4].replace(/,/g, ''))
    });
  }

  let consumption = null;
  if (historic_periods.length > 0) {
    consumption = historic_periods[0].kwh;
  }
  
  if (consumption === null) {
    const tableMatch = normalizedText.match(/(?:Diferencia\s+Totales\s+Energía|Energía(?:\s*\(kWh\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i);
    if (tableMatch) {
      consumption = parseInt(tableMatch[3].replace(/[.,]/g, ''));
    }
  }

  if (consumption === null) {
     const consumptionStrict = normalizedText.match(/(?:Consumo(?:\s+de\s+energía)?(?:\s*\(kWh\))?|Consumo\s+Total)[\s:]*(\d+)/i);
     if (consumptionStrict) consumption = parseInt(consumptionStrict[1]);
  }

  const total_mxn = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;
  const is_bimonthly = !tariff.startsWith('GDM') && !tariff.startsWith('APM') && !tariff.startsWith('RAM') && !tariff.startsWith('DIS') && !tariff.startsWith('DI');
  const monthly_kWh = is_bimonthly ? Math.round((consumption || 0) / 2) : (consumption || 0);
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
    is_bimonthly,
    current_period,
    historic_periods: historic_periods.length > 0 ? historic_periods : undefined
  };
}

console.log(parseCFEText(ocrText));
