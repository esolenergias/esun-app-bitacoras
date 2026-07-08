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
