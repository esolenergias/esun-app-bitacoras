const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function renderPdfHtml() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600 });

  // Leer base64 del logo
  const logoPath = path.resolve('public/Logo_esol_b.png');
  const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Preview PDF</title>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 20px; background: #334155; font-family: 'Montserrat', sans-serif; display: flex; justify-content: center; }
        
        .sheet {
          width: 216mm;
          min-height: 279mm;
          padding: 14mm 16mm;
          margin: 0 auto;
          background: #ffffff;
          font-size: 9px;
          line-height: 1.35;
          color: #1e293b;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2.5px solid #d4af37;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }

        .brand-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-img {
          max-height: 48px;
          width: auto;
          object-fit: contain;
        }

        .company-title {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 1px;
          margin: 0;
          line-height: 1.1;
        }

        .company-sub {
          font-size: 8px;
          color: #64748b;
          margin-top: 2px;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .doc-folio-badge {
          text-align: right;
        }

        .doc-title {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.5px;
          margin: 0;
          text-transform: uppercase;
        }

        .doc-folio {
          font-size: 10px;
          font-weight: 700;
          color: #d4af37;
          margin-top: 2px;
          letter-spacing: 1px;
        }

        .doc-date {
          font-size: 8px;
          color: #64748b;
          margin-top: 1px;
        }

        .intro-box {
          background: #f8fafc;
          border-left: 3px solid #0f172a;
          padding: 8px 12px;
          border-radius: 4px;
          margin-bottom: 12px;
          font-size: 8px;
          line-height: 1.4;
          color: #334155;
        }

        .grid-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .info-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 9px 12px;
        }

        .info-card-header {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #0f172a;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 8px;
        }

        .info-label {
          color: #64748b;
          font-weight: 500;
        }

        .info-value {
          color: #0f172a;
          font-weight: 600;
          text-align: right;
        }

        .table-container {
          margin-bottom: 14px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
        }

        .act-table {
          width: 100%;
          border-collapse: collapse;
        }

        .act-table th {
          background: #0f172a;
          color: #ffffff;
          padding: 7px 10px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-align: left;
          text-transform: uppercase;
        }

        .payment-summary {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .clause-box {
          background: #f1f5f9;
          border-radius: 6px;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
        }

        .clause-title {
          font-size: 8px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .clause-text {
          font-size: 7.5px;
          line-height: 1.4;
          color: #475569;
          text-align: justify;
        }

        .total-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          border-radius: 6px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-top: 3px solid #d4af37;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: #94a3b8;
          margin-bottom: 3px;
        }

        .total-amount-line {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-top: 1px solid #334155;
          padding-top: 6px;
          margin-top: 4px;
        }

        .total-label {
          font-size: 10px;
          font-weight: 700;
          color: #d4af37;
          text-transform: uppercase;
        }

        .total-value {
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .total-words {
          font-size: 6.8px;
          color: #cbd5e1;
          margin-top: 4px;
          font-weight: 500;
          text-align: right;
          line-height: 1.2;
        }

        .signatures-area {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 35px;
          margin-top: 20px;
          padding-top: 10px;
        }

        .sig-box {
          text-align: center;
        }

        .sig-line {
          border-top: 1.2px solid #64748b;
          margin-bottom: 5px;
        }

        .sig-name {
          font-size: 9px;
          font-weight: 700;
          color: #0f172a;
        }

        .sig-role {
          font-size: 7.5px;
          color: #64748b;
        }

        .footer-note {
          text-align: center;
          font-size: 7px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 12px;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div>
          <!-- Header Institucional -->
          <div class="header">
            <div class="brand-col">
              <img src="${logoBase64}" alt="ESOL Energías" class="logo-img" />
              <div>
                <h1 class="company-title">ESOL ENERGÍAS</h1>
                <div class="company-sub">SOLUCIONES INTEGRALES DE NAYARIT S. DE R.L. DE C.V.</div>
                <div class="company-sub">Av. Insurgentes 56-A, Centro, C.P. 63000, Tepic, Nayarit.</div>
              </div>
            </div>

            <div class="doc-folio-badge">
              <div class="doc-title">Comprobante de Actividades</div>
              <div class="doc-folio">PER-2609-CH-725</div>
              <div class="doc-date">Emisión: 07 de Septiembre de 2026</div>
            </div>
          </div>

          <!-- Descripción de Documento -->
          <div class="intro-box">
            <strong>OBJETO DEL DOCUMENTO:</strong> El presente instrumento certifica la prestación de servicios, desarrollo técnico y cumplimiento de las actividades pormenorizadas a continuación por parte del colaborador durante el periodo semanal comprendido del <strong>07/09/2026</strong> al <strong>13/09/2026</strong>, sirviendo como soporte administrativo y comprobatorio para su correspondiente liquidación semanal.
          </div>

          <!-- Información Colaborador y Periodo -->
          <div class="grid-info">
            <div class="info-card">
              <div class="info-card-header">
                <span>Datos del Colaborador</span>
                <span style="color: #d4af37;">Instalador Eléctrico</span>
              </div>
              <div class="info-row">
                <span class="info-label">Nombre Completo:</span>
                <span class="info-value">Carlos Hernández Soto</span>
              </div>
              <div class="info-row">
                <span class="info-label">Puesto / Categoría:</span>
                <span class="info-value">Instalador Eléctrico</span>
              </div>
              <div class="info-row">
                <span class="info-label">Institución Bancaria:</span>
                <span class="info-value">BBVA</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cuenta / CLABE:</span>
                <span class="info-value">012180012345678901</span>
              </div>
            </div>

            <div class="info-card">
              <div class="info-card-header">
                <span>Detalles de Liquidación</span>
                <span style="color: #16a34a; font-weight: 800;">
                  ● LIQUIDADO
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Periodo Semanal:</span>
                <span class="info-value">Semana 36 (07/09/2026 al 13/09/2026)</span>
              </div>
              <div class="info-row">
                <span class="info-label">Forma de Pago:</span>
                <span class="info-value">Transferencia Bancaria</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de Liquidación:</span>
                <span class="info-value">07/09/2026</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total de Actividades:</span>
                <span class="info-value">4 Tareas Registradas</span>
              </div>
            </div>
          </div>

          <!-- Tabla de Actividades -->
          <div class="table-container">
            <table class="act-table">
              <thead>
                <tr>
                  <th>Día / Fecha</th>
                  <th>Obra / Proyecto / Ubicación</th>
                  <th>Descripción de Actividades Realizadas</th>
                  <th style="text-align: center;">Jornada</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                  <td style="padding: 7px 10px; font-weight: 600; color: #1e293b; font-size: 8.5px; width: 14%;">
                    Lunes
                    <div style="font-size: 7.5px; color: #64748b; font-weight: normal;">07/09/2026</div>
                  </td>
                  <td style="padding: 7px 10px; font-size: 8.5px; color: #0f172a; width: 30%; font-weight: 500;">
                    <div style="font-weight: 600; color: #d4af37;">Residencial Campestre - 10kW</div>
                    <div style="font-size: 7.5px; color: #64748b; text-transform: uppercase;">Obra en Campo</div>
                  </td>
                  <td style="padding: 7px 10px; font-size: 8.5px; color: #334155; line-height: 1.35; width: 44%;">
                    Montaje de estructura coplanar de aluminio y fijación de 16 paneles solares JA Solar 550W.
                  </td>
                  <td style="padding: 7px 10px; font-size: 8px; text-align: center; color: #0f172a; width: 12%;">
                    <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">
                      Completa
                    </span>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                  <td style="padding: 7px 10px; font-weight: 600; color: #1e293b; font-size: 8.5px; width: 14%;">
                    Martes
                    <div style="font-size: 7.5px; color: #64748b; font-weight: normal;">08/09/2026</div>
                  </td>
                  <td style="padding: 7px 10px; font-size: 8.5px; color: #0f172a; width: 30%; font-weight: 500;">
                    <div style="font-weight: 600; color: #d4af37;">Residencial Campestre - 10kW</div>
                    <div style="font-size: 7.5px; color: #64748b; text-transform: uppercase;">Obra en Campo</div>
                  </td>
                  <td style="padding: 7px 10px; font-size: 8.5px; color: #334155; line-height: 1.35; width: 44%;">
                    Tendido de tubería conduit pared gruesa, cableado fotovoltaico 10 AWG y aterrizaje a tierra.
                  </td>
                  <td style="padding: 7px 10px; font-size: 8px; text-align: center; color: #0f172a; width: 12%;">
                    <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">
                      Completa
                    </span>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                  <td style="padding: 7px 10px; font-weight: 600; color: #1e293b; font-size: 8.5px; width: 14%;">
                    Miércoles
                    <div style="font-size: 7.5px; color: #64748b; font-weight: normal;">09/09/2026</div>
                  </td>
                  <td style="padding: 7px 10px; font-size: 8.5px; color: #0f172a; width: 30%; font-weight: 500;">
                    <div style="font-weight: 600; color: #d4af37;">Comercial Centro - 20kW</div>
                    <div style="font-size: 7.5px; color: #64748b; text-transform: uppercase;">Obra en Campo</div>
                  </td>
                  <td style="padding: 7px 10px; font-size: 8.5px; color: #334155; line-height: 1.35; width: 44%;">
                    Conexión e interconexión de inversor trifásico Growatt 20kW, pruebas de tensión Voc e Isc.
                  </td>
                  <td style="padding: 7px 10px; font-size: 8px; text-align: center; color: #0f172a; width: 12%;">
                    <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">
                      Completa
                    </span>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                  <td style="padding: 7px 10px; font-weight: 600; color: #1e293b; font-size: 8.5px; width: 14%;">
                    Jueves
                    <div style="font-size: 7.5px; color: #64748b; font-weight: normal;">10/09/2026</div>
                  </td>
                  <td style="padding: 7px 10px; font-size: 8.5px; color: #0f172a; width: 30%; font-weight: 500;">
                    <div style="font-weight: 600; color: #d4af37;">Taller / Almacén Central</div>
                    <div style="font-size: 7.5px; color: #64748b; text-transform: uppercase;">Actividad Interna</div>
                  </td>
                  <td style="padding: 7px 10px; font-size: 8.5px; color: #334155; line-height: 1.35; width: 44%;">
                    Armado de gabinetes de protección AC/DC, calibración de termomagnéticos e inventario.
                  </td>
                  <td style="padding: 7px 10px; font-size: 8px; text-align: center; color: #0f172a; width: 12%;">
                    <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">
                      Completa
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Resumen Financiero y Cláusula Legal Sutil -->
          <div class="payment-summary">
            <div class="clause-box">
              <div class="clause-title">Declaración de Conformidad y Finiquito de Servicios</div>
              <div class="clause-text">
                El colaborador manifiesta expresa y libre conformidad en haber desarrollado a satisfacción de la empresa las actividades aquí relacionadas. Asimismo, declara que el importe neto percibido en esta emisión cubre en su totalidad y de forma definitiva la retribución acordada exclusivamente por los servicios y tareas efectuadas en la semana indicada, sin que exista diferencia, reclamación o adeudo pendiente alguno por dicho lapso.
                <div style="margin-top: 5px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
                  <strong>Observaciones del periodo:</strong> Trabajos completados en tiempo y forma conforme a las especificaciones técnicas del supervisor de obra.
                </div>
              </div>
            </div>

            <div class="total-card">
              <div>
                <div class="total-row">
                  <span>Remuneración Base Semanal:</span>
                  <strong style="color: #ffffff;">$3,500.00</strong>
                </div>
                <div class="total-row">
                  <span>Ajuste / Imprevisto (Horas extra obra):</span>
                  <strong style="color: #4ade80;">+$500.00</strong>
                </div>
              </div>

              <div>
                <div class="total-amount-line">
                  <span class="total-label">Total Liquidado:</span>
                  <span class="total-value">$4,000.00 MXN</span>
                </div>
                <div class="total-words">(CUATRO MIL PESOS 00/100 M.N.)</div>
              </div>
            </div>
          </div>

          <!-- Firmas -->
          <div class="signatures-area">
            <div class="sig-box">
              <div style="height: 42px;"></div>
              <div class="sig-line"></div>
              <div class="sig-name">Carlos Hernández Soto</div>
              <div class="sig-role">Firma de Conformidad / Colaborador</div>
            </div>

            <div class="sig-box">
              <div style="height: 42px;"></div>
              <div class="sig-line"></div>
              <div class="sig-name">ESOL ENERGÍAS</div>
              <div class="sig-role">Vo.Bo. Autorización y Supervisión Operativa</div>
            </div>
          </div>
        </div>

        <!-- Pie de página -->
        <div class="footer-note">
          Este documento representa el registro oficial de actividades de campo y liquidación semanal de ESOL Energías. Prohibida su alteración o reproducción sin autorización previa.
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const docScreenshotPath = path.resolve('scratch/personal_documento_impreso.png');
  await page.screenshot({ path: docScreenshotPath, fullPage: true });
  console.log("Screenshot del documento PDF generado en:", docScreenshotPath);
  await browser.close();
}

renderPdfHtml().catch(console.error);
