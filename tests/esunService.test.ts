import { calculateSizing } from '../src/components/esun/lib/solarCalculator';

function assertEquals(actual: any, expected: any, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`FAIL: ${message}. Expected ${expected}, got ${actual}`);
  }
  console.log(`✓ PASS: ${message}`);
}

function runTests() {
  console.log('Running Esun Sizing Engine tests...');

  // Monterrey (PSH = 5.5), 1200 kWh/bimonthly = 600 kWh/month. Panel = 550W, Voc = 50V. Inverter Max Vdc = 600V.
  const result = calculateSizing({
    monthly_kWh: 600,
    city: 'Monterrey',
    panel_Wp: 550,
    panel_Voc: 50,
    inverter_max_vdc: 600,
    inverter_kw: 5
  });

  // 1. kWp = (600 * 1.20) / (5.5 * 30 * 0.77) = 720 / 127.05 = 5.667 kWp
  assertEquals(Math.round(result.system_kWp * 100) / 100, 5.67, 'system_kWp calculation');

  // 2. Panels = ceil(5.667 * 1000 / 550) = ceil(10.3) = 11 panels
  assertEquals(result.num_panels, 11, 'num_panels calculation');

  // 3. Max panels per string = floor(600 / (50 * 1.05)) = floor(600 / 52.5) = floor(11.4) = 11
  assertEquals(result.panels_per_string, 11, 'panels_per_string calculation');
  assertEquals(result.num_strings, 1, 'num_strings calculation');
  assertEquals(result.is_electrical_safe, true, 'electrical safety check');

  console.log('All Esun Sizing Engine tests passed.');
}

try {
  runTests();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
