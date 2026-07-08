import { calculateSizing } from '../src/components/esun/lib/solarCalculator';
import { calculateFinancials } from '../src/components/esun/lib/financialEngine';

function assertEquals(actual: any, expected: any, message: string) {
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Math.abs(actual - expected) > 1e-3) {
      throw new Error(`FAIL: ${message}. Expected ${expected}, got ${actual}`);
    }
  } else if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`FAIL: ${message}. Expected ${expected}, got ${actual}`);
  }
  console.log(`✓ PASS: ${message}`);
}

function runTests() {
  console.log('Running Esun Sizing Engine tests...');

  // Test Case 1: Standard Monterrey Sizing with 550W panel
  console.log('\n--- Test Case 1: Monterrey Sizing (550W panel) ---');
  const result1 = calculateSizing({
    monthly_kWh: 600,
    city: 'Monterrey',
    panel_Wp: 550,
    panel_Voc: 50,
    inverter_max_vdc: 600,
    inverter_kw: 5
  });

  // system_kWp = (600 * 1.20) / (5.5 * 30 * 0.77) = 720 / 127.05 = 5.667 kWp
  assertEquals(result1.system_kWp, 5.667060212514758, 'system_kWp calculation');
  // Panels = ceil(5.667 * 1000 / 550) = ceil(10.3) = 11 panels
  assertEquals(result1.num_panels, 11, 'num_panels calculation');
  // installed_kWp = (11 * 550) / 1000 = 6.05
  assertEquals(result1.installed_kWp, 6.05, 'installed_kWp calculation');
  // Max panels per string = floor(600 / (50 * 1.05)) = 11.
  // num_strings = ceil(11 / 11) = 1.
  // panels_per_string = 11.
  assertEquals(result1.panels_per_string, 11, 'panels_per_string calculation');
  assertEquals(result1.num_strings, 1, 'num_strings calculation');
  assertEquals(result1.string_Voc, 577.5, 'string_Voc calculation');
  assertEquals(result1.is_electrical_safe, true, 'electrical safety check');
  // annual_production_kWh = 6.05 * 5.5 * 365 * 0.77 = 9351.93875
  assertEquals(result1.annual_production_kWh, 9351.93875, 'annual_production_kWh calculation');


  // Test Case 2: Balanced string configurations where num_panels > max_panels_per_string
  console.log('\n--- Test Case 2: Balanced string configuration (num_panels > max_panels_per_string) ---');
  const result2 = calculateSizing({
    monthly_kWh: 600,
    city: 'Monterrey',
    panel_Wp: 500,
    panel_Voc: 50,
    inverter_max_vdc: 600,
    inverter_kw: 5
  });

  // system_kWp = 5.67 kWp (same)
  // Panels initial = ceil(5.667 * 1000 / 500) = ceil(11.33) = 12 panels
  // Max panels per string = floor(600 / (50 * 1.05)) = 11
  // num_strings = ceil(12 / 11) = 2
  // panels_per_string = ceil(12 / 2) = 6
  // num_panels = 2 * 6 = 12
  assertEquals(result2.num_panels, 12, 'num_panels calculation');
  assertEquals(result2.installed_kWp, 6.0, 'installed_kWp calculation');
  assertEquals(result2.num_strings, 2, 'num_strings calculation');
  assertEquals(result2.panels_per_string, 6, 'panels_per_string calculation');
  // string_Voc = 6 * 50 * 1.05 = 315
  assertEquals(result2.string_Voc, 315, 'string_Voc calculation');
  assertEquals(result2.is_electrical_safe, true, 'electrical safety check');
  // annual_production_kWh = 6 * 5.5 * 365 * 0.77 = 9274.65
  assertEquals(result2.annual_production_kWh, 9274.65, 'annual_production_kWh calculation');


  // Test Case 3: Sanitized input (panel_Wp <= 0)
  console.log('\n--- Test Case 3: Sanitized input (panel_Wp <= 0) ---');
  const result3 = calculateSizing({
    monthly_kWh: 600,
    city: 'Monterrey',
    panel_Wp: 0,
    panel_Voc: 50,
    inverter_max_vdc: 600,
    inverter_kw: 5
  });
  assertEquals(result3.system_kWp, 0, 'system_kWp is 0');
  assertEquals(result3.installed_kWp, 0, 'installed_kWp is 0');
  assertEquals(result3.num_panels, 0, 'num_panels is 0');
  assertEquals(result3.panels_per_string, 0, 'panels_per_string is 0');
  assertEquals(result3.num_strings, 0, 'num_strings is 0');
  assertEquals(result3.string_Voc, 0, 'string_Voc is 0');
  assertEquals(result3.is_electrical_safe, false, 'is_electrical_safe is false');
  assertEquals(result3.area_m2, 0, 'area_m2 is 0');
  assertEquals(result3.annual_production_kWh, 0, 'annual_production_kWh is 0');
  assertEquals(result3.monthly_production_kWh, 0, 'monthly_production_kWh is 0');

  // Test Case 4: Sanitized input (panel_Voc <= 0)
  console.log('\n--- Test Case 4: Sanitized input (panel_Voc <= 0) ---');
  const result4 = calculateSizing({
    monthly_kWh: 600,
    city: 'Monterrey',
    panel_Wp: 550,
    panel_Voc: -10,
    inverter_max_vdc: 600,
    inverter_kw: 5
  });
  assertEquals(result4.system_kWp, 0, 'system_kWp is 0');
  assertEquals(result4.installed_kWp, 0, 'installed_kWp is 0');
  assertEquals(result4.num_panels, 0, 'num_panels is 0');
  assertEquals(result4.panels_per_string, 0, 'panels_per_string is 0');
  assertEquals(result4.num_strings, 0, 'num_strings is 0');
  assertEquals(result4.string_Voc, 0, 'string_Voc is 0');
  assertEquals(result4.is_electrical_safe, false, 'is_electrical_safe is false');

  // Test Case 5: Sanitized input (monthly_kWh <= 0)
  console.log('\n--- Test Case 5: Sanitized input (monthly_kWh <= 0) ---');
  const result5 = calculateSizing({
    monthly_kWh: 0,
    city: 'Monterrey',
    panel_Wp: 550,
    panel_Voc: 50,
    inverter_max_vdc: 600,
    inverter_kw: 5
  });
  assertEquals(result5.system_kWp, 0, 'system_kWp is 0');
  assertEquals(result5.installed_kWp, 0, 'installed_kWp is 0');
  assertEquals(result5.num_panels, 0, 'num_panels is 0');
  assertEquals(result5.panels_per_string, 0, 'panels_per_string is 0');
  assertEquals(result5.num_strings, 0, 'num_strings is 0');
  assertEquals(result5.string_Voc, 0, 'string_Voc is 0');
  assertEquals(result5.is_electrical_safe, false, 'is_electrical_safe is false');

  console.log('\nRunning Esun Financial Engine tests...');
  const finResult = calculateFinancials({
    system_kWp: 5.67,
    installed_kWp: 6.05,
    annual_production_kWh: 9351.93875,
    monthly_consumption_kWh: 600, // 7200 kWh/year
    tariff_rate_mxn: 4.50 // DAC
  });

  // Investment should be 6.05 kWp * 1000 * 15 MXN/W (since size is between 5 and 10 kWp) = 90750 MXN
  assertEquals(finResult.investment_mxn, 90750, 'investment calculation');
  
  // Year 1 savings = min(9351.94, 7200) * 4.50 = 7200 * 4.50 = 32400 MXN
  assertEquals(finResult.annual_savings_yr1, 32400, 'annual savings year 1');

  // Payback = 90750 / 32400 = 2.80 years
  assertEquals(finResult.payback_years, 2.800925925925926, 'simple payback years');

  // CO2 saved 25yr = 9351.93875 * 25 * 0.444 = 103806.519825 kg
  assertEquals(finResult.co2_saved_kg_25yr, 103806.520125, 'CO2 savings over 25 years');

  // Test Case 6: Sanitized financial inputs (<= 0)
  console.log('\n--- Test Case 6: Sanitized financial inputs (<= 0) ---');
  const finResultSanitized = calculateFinancials({
    system_kWp: 5.67,
    installed_kWp: 0,
    annual_production_kWh: -10,
    monthly_consumption_kWh: 600,
    tariff_rate_mxn: 4.50
  });
  assertEquals(finResultSanitized.investment_mxn, 0, 'sanitized investment is 0');
  assertEquals(finResultSanitized.annual_savings_yr1, 0, 'sanitized savings is 0');
  assertEquals(finResultSanitized.payback_years, 99, 'sanitized payback is 99');
  assertEquals(finResultSanitized.co2_saved_kg_25yr, 0, 'sanitized CO2 is 0');

  console.log('\nAll Esun Sizing and Financial Engine tests passed successfully.');
}

try {
  runTests();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
