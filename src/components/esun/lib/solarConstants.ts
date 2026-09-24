export const SOLAR_CONSTANTS = {
  CO2_FACTOR: 0.444,         // kg CO2/kWh (SEMARNAT 2024)
  PR_DEFAULT: 0.77,          // Performance Ratio average Mexico
  TARIFF_ESCALATION: 0.06,   // 6% annual CFE inflation
  PANEL_DEGRADATION: 0.005,  // 0.5% annual degradation (TOPCon)
  DISCOUNT_RATE: 0.10,       // 10% for NPV discount factor
  SYSTEM_LIFE: 25,
  DC_AC_RATIO: 1.10,         // Target DC capacity / Inverter AC capacity
  CO2_PER_TREE_KG: 21.77,    // Annual CO2 absorbed by one mature tree
  CO2_PER_CAR_TONS: 4.6,     // Annual CO2 emissions of average passenger car
  CO2_PER_COAL_TON: 2.42,    // CO2 produced by burning 1 ton of coal
  AREA_PER_PANEL_M2: 2.1,    // Average 550W panel area
  AREA_SPACING: 1.15,        // Spacing factor (15% additional)
  SIZING_MARGIN: 1.20,       // 20% sizing safety margin for production offset
  TEMP_COEFF_VOC: 1.05,
  DAYS_IN_MONTH: 30,
  DAYS_IN_YEAR: 365,
  PSH: {
    'Hermosillo': 6.3,
    'Mexicali': 6.0,
    'Tijuana': 5.8,
    'Chihuahua': 5.9,
    'Ciudad Juárez': 5.9,
    'Monterrey': 5.5,
    'Guadalajara': 5.5,
    'CDMX': 5.0,
    'Ciudad de México': 5.0,
    'Cancún': 5.3,
    'Mérida': 5.5,
    'Puebla': 5.3,
    'Oaxaca': 4.9,
    'Veracruz': 4.8,
    'Tampico': 5.1,
    'default': 5.0,
  } as Record<string, number>,
  COST_PER_W_MXN: {
    small: 17,      // <= 5 kWp
    medium: 15,     // 5-10 kWp
    commercial: 14, // 10-50 kWp
    industrial: 12, // >50 kWp
  }
};

/**
 * Coeficientes de estacionalidad solar mensual para México (NASA SSE / NREL / INEEL).
 * Refleja la variación por:
 * 1. Ángulo cenital y duración del día (Invierno vs Verano).
 * 2. Cielos despejados de Primavera (Marzo-Mayo: Pico de radiación).
 * 3. Nubosidad por monzón y temporada de lluvias de Verano (Junio-Septiembre: Valle por lluvias y pérdidas térmicas).
 * 4. Despeje de Otoño (Octubre-Noviembre).
 */
export const MONTHLY_SOLAR_SEASONALITY: Record<number, number> = {
  0: 0.84,  // Ene (Invierno, días más cortos)
  1: 0.92,  // Feb (Transición fin de invierno)
  2: 1.15,  // Mar (Primavera, cielo despejado)
  3: 1.24,  // Abr (Pico máximo anual de irradiancia en México)
  4: 1.20,  // May (Radiación máxima antes de temporada de lluvias)
  5: 1.04,  // Jun (Solsticio, inicio de lluvias)
  6: 0.92,  // Jul (Temporada de lluvias / nubosidad monzónica)
  7: 0.90,  // Ago (Lluvias continuas / calor húmedo)
  8: 0.88,  // Sep (Pico de tormentas y ciclones tropicales)
  9: 1.02,  // Oct (Cese de lluvias, cielos limpios)
  10: 0.97, // Nov (Otoño fresco, alta eficiencia térmica)
  11: 0.82, // Dic (Solsticio de invierno, menor insolación)
};

const MONTH_MAP: Record<string, number> = {
  'ENE': 0, 'ENERO': 0, 'JAN': 0,
  'FEB': 1, 'FEBRERO': 1,
  'MAR': 2, 'MARZO': 2,
  'ABR': 3, 'ABRIL': 3, 'APR': 3,
  'MAY': 4, 'MAYO': 4,
  'JUN': 5, 'JUNIO': 5,
  'JUL': 6, 'JULIO': 6,
  'AGO': 7, 'AGOSTO': 7, 'AUG': 7,
  'SEP': 8, 'SEPTIEMBRE': 8, 'SET': 8,
  'OCT': 9, 'OCTUBRE': 9,
  'NOV': 10, 'NOVIEMBRE': 10,
  'DIC': 11, 'DICIEMBRE': 11, 'DEC': 11
};

/**
 * Obtiene el multiplicador estacional para un periodo o mes dado.
 */
export function getSeasonalSolarMultiplier(periodStr?: string, fallbackIndex: number = 0): number {
  if (!periodStr) {
    const idx = (fallbackIndex % 12 + 12) % 12;
    return MONTHLY_SOLAR_SEASONALITY[idx] ?? 1.0;
  }

  const clean = periodStr.toUpperCase();
  const matchedMonths: number[] = [];

  for (const [key, mIdx] of Object.entries(MONTH_MAP)) {
    if (clean.includes(key)) {
      if (!matchedMonths.includes(mIdx)) {
        matchedMonths.push(mIdx);
      }
    }
  }

  if (matchedMonths.length > 0) {
    const sum = matchedMonths.reduce((acc, m) => acc + (MONTHLY_SOLAR_SEASONALITY[m] ?? 1.0), 0);
    return sum / matchedMonths.length;
  }

  const idx = (fallbackIndex % 12 + 12) % 12;
  return MONTHLY_SOLAR_SEASONALITY[idx] ?? 1.0;
}
