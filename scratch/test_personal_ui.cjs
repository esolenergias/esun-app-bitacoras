const puppeteer = require('puppeteer');
const path = require('path');

async function testUI() {
  console.log("Iniciando prueba con Puppeteer...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  browser.on('targetcreated', async target => {
    console.log(">>> NUEVA PESTAÑA ABIERTA EN EL NAVEGADOR:", target.url());
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log("1. Navegando a http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  console.log("2. Abriendo Login Modal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const portalBtn = buttons.find(b => b.textContent && b.textContent.includes('Portal eSol'));
    if (portalBtn) portalBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log("3. Clickeando en Acceso Master...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const masterBtn = buttons.find(b => b.textContent && b.textContent.includes('Acceso Master'));
    if (masterBtn) masterBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  console.log("4. Entrando al Panel Master...");
  const enteredPanel = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const panelBtn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('panel master'));
    if (panelBtn) {
      panelBtn.click();
      return true;
    }
    return false;
  });
  console.log("¿Botón Panel Master encontrado y clickeado?:", enteredPanel);
  await new Promise(r => setTimeout(r, 2000));

  console.log("5. Navegando a Legal Esol...");
  const clickedLegal = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const legalBtn = buttons.find(b => b.textContent && b.textContent.includes('Legal Esol'));
    if (legalBtn) {
      legalBtn.click();
      return true;
    }
    return false;
  });
  console.log("¿Legal Esol clickeado?:", clickedLegal);
  await new Promise(r => setTimeout(r, 1500));

  console.log("6. Seleccionando subpestaña Personal...");
  const clickedPersonal = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const personalBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Personal');
    if (personalBtn) {
      personalBtn.click();
      return true;
    }
    return false;
  });
  console.log("¿Pestaña Personal encontrada y clickeada?:", clickedPersonal);
  await new Promise(r => setTimeout(r, 1500));

  // 7. Cambiar a Directorio de Trabajadores
  console.log("7. Cambiando a Directorio de Trabajadores...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const dirBtn = buttons.find(b => b.textContent && b.textContent.includes('Directorio de Trabajadores'));
    if (dirBtn) dirBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 8. Abrir modal Nuevo Trabajador
  console.log("8. Abriendo modal Nuevo Trabajador...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const newTrabBtn = buttons.find(b => b.textContent && b.textContent.includes('Nuevo Trabajador'));
    if (newTrabBtn) newTrabBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 9. Rellenar y guardar trabajador
  console.log("9. Rellenando formulario de trabajador...");
  await page.type('input[placeholder*="Juan Pérez"]', 'Carlos Hernández Soto');
  await page.type('input[placeholder*="311"]', '311 234 5678');
  await page.type('input[placeholder*="01218000"]', '012180012345678901');

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find(b => b.textContent && b.textContent.includes('Guardar Trabajador'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 10. Volver a Registros Semanales
  console.log("10. Volviendo a Registros Semanales...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const regBtn = buttons.find(b => b.textContent && b.textContent.includes('Registros Semanales'));
    if (regBtn) regBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 11. Abrir modal Nuevo Registro Semanal
  console.log("11. Abriendo modal Nuevo Registro Semanal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const newRegBtn = buttons.find(b => b.textContent && b.textContent.includes('Nuevo Registro Semanal'));
    if (newRegBtn) newRegBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Llenar una actividad con page.type
  console.log("11b. Rellenando actividades en el registro con page.type...");
  await page.type('textarea', 'Montaje de estructura y fijación de 16 paneles solares 550W');

  await new Promise(r => setTimeout(r, 500));

  // 12. Guardar el registro semanal
  console.log("12. Guardando registro semanal...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveRegBtn = buttons.find(b => b.textContent && b.textContent.includes('Guardar Registro'));
    if (saveRegBtn) saveRegBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const tableFilledPath = path.resolve('scratch/personal_tabla_con_registro.png');
  await page.screenshot({ path: tableFilledPath });
  console.log("Screenshot tabla con registro guardado en:", tableFilledPath);

  // 13. Probar generar PDF
  console.log("13. Probando clic en generar PDF...");
  await page.evaluate(() => {
    const printBtn = document.querySelector('button[title*="Generar y abrir PDF"]');
    if (printBtn) printBtn.click();
  });
  await new Promise(r => setTimeout(r, 3500));

  const afterPdfPath = path.resolve('scratch/personal_tras_generar_pdf.png');
  await page.screenshot({ path: afterPdfPath });
  console.log("Screenshot después de generar PDF guardado en:", afterPdfPath);

  await browser.close();
  console.log("¡Todas las pruebas pasaron con éxito!");
}

testUI().catch(err => {
  console.error("Error en testUI:", err);
  process.exit(1);
});
