// @ts-ignore
import html2pdf from 'html2pdf.js';
import type { CotizacionExpressData } from '../../types/cotizadorExpress';
import { cotizadorExpressService } from '../../services/cotizadorExpressService';

export const numeroALetras = (numero: number): string => {
  if (numero === 0) return 'CERO PESOS 00/100 M.N.';
  const integerPart = Math.floor(numero);
  const decimalPart = Math.round((numero - integerPart) * 100);

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const diezA19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const convertirGrupo = (n: number): string => {
    let texto = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c === 1 && d === 0 && u === 0) texto += 'CIEN ';
    else if (c > 0) texto += centenas[c] + ' ';

    if (d === 1) texto += diezA19[u] + ' ';
    else {
      if (d === 2 && u === 0) texto += 'VEINTE ';
      else if (d === 2) texto += 'VEINTI' + unidades[u] + ' ';
      else if (d > 2) {
        texto += decenas[d] + ' ';
        if (u > 0) texto += 'Y ' + unidades[u] + ' ';
      } else if (u > 0) {
        texto += unidades[u] + ' ';
      }
    }
    return texto.trim();
  };

  let letras = '';
  let resto = integerPart;

  if (resto >= 1000000) {
    const millones = Math.floor(resto / 1000000);
    if (millones === 1) letras += 'UN MILLON ';
    else letras += convertirGrupo(millones) + ' MILLONES ';
    resto = resto % 1000000;
  }

  if (resto >= 1000) {
    const miles = Math.floor(resto / 1000);
    if (miles === 1) letras += 'MIL ';
    else letras += convertirGrupo(miles) + ' MIL ';
    resto = resto % 1000;
  }

  if (resto > 0) {
    letras += convertirGrupo(resto) + ' ';
  }

  return (letras.trim() + ' PESOS ' + decimalPart.toString().padStart(2, '0') + '/100 M.N.').toUpperCase();
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(val || 0);
};

// Generador de Encabezado Oficial Reutilizable para cada hoja
function getHeaderHtml(cot: CotizacionExpressData, numeroHoja: number, totalHojas: number, tituloHoja: string): string {
  const logoUrl = window.location.origin + '/Logo_esol_b.png';
  const fechaTexto = new Date(cot.fecha || Date.now()).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #b89130; padding-bottom: 12px; margin-bottom: 14px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${logoUrl}" alt="ESOL Energías" style="height: 48px; object-fit: contain;" />
        <div>
          <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">ESOL ENERGÍAS</div>
          <div style="font-size: 8.5px; font-weight: 700; color: #b89130; text-transform: uppercase; letter-spacing: 1px;">Ingeniería, Suministros y Soluciones Energéticas</div>
          <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Tepic, Nayarit • contacto@esolenergias.com • Tel: 311 234 3034</div>
        </div>
      </div>

      <div style="text-align: right; min-width: 140px;">
        <table style="border-collapse: collapse; margin-left: auto; margin-bottom: 4px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px;">
          <tr>
            <td style="padding: 4px 10px; text-align: center;">
              <div style="font-size: 8px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">FOLIO DE PROPUESTA</div>
              <div style="font-size: 13px; font-weight: 900; color: ${cot.estado === 'borrador' ? '#b45309' : '#0f172a'}; margin-top: 2px;">
                ${cot.folio || 'BORRADOR'}
              </div>
            </td>
          </tr>
        </table>
        <div style="font-size: 8px; color: #64748b; margin-top: 3px;">
          <strong>Emisión:</strong> ${cot.lugar || 'Tepic, Nayarit'}, a ${fechaTexto}
        </div>
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 6px; margin-top: 3px;">
          <span style="font-size: 7.5px; color: #b89130; font-weight: 700;">Vigencia: ${cot.vigencia_dias || 15} días</span>
          <span style="font-size: 7.5px; background: #0f172a; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">PÁG. ${numeroHoja} DE ${totalHojas}</span>
        </div>
      </div>
    </div>

    <!-- BANNER IDENTIFICADOR DE SECCIÓN / HOJA -->
    <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f1f5f9; border-left: 4px solid #b89130; padding: 6px 12px; margin-bottom: 14px; border-radius: 0 4px 4px 0;">
      <span style="font-size: 9px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${tituloHoja}</span>
      <span style="font-size: 8px; color: #64748b; font-weight: 600;">OFICIO: ${cot.asunto ? cot.asunto.slice(0, 45) + '...' : 'PROPUESTA TÉCNICA'}</span>
    </div>
  `;
}

// Generador de Pie de Página Oficial Reutilizable para cada hoja
function getFooterHtml(cot: CotizacionExpressData, numeroHoja: number, totalHojas: number): string {
  return `
    <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 7.5px; color: #94a3b8;">
      <div>ESOL ENERGÍAS • TEPIC, NAYARIT</div>
      <div>${cot.folio || 'BORRADOR'} | Hoja ${numeroHoja} de ${totalHojas}</div>
    </div>
  `;
}

// Bloque de Firmas Reutilizable (en Hoja 2 justo arriba del pie de página)
function getFirmasHtml(cot: CotizacionExpressData): string {
  return `
    <div style="margin-top: auto; padding-top: 18px; margin-bottom: 8px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 36px;">
        <div style="flex: 1; text-align: center;">
          <div style="height: 75px; display: flex; align-items: center; justify-content: center;">
            ${cot.incluir_firma_digital && cot.firma_digital ? `<img src="${cot.firma_digital}" style="max-height: 70px; object-fit: contain;" alt="Firma" />` : ''}
          </div>
          <div style="border-top: 1.5px solid #64748b; padding-top: 5px;">
            <div style="font-size: 9.5px; font-weight: 800; color: #0f172a;">${cot.remitente_nombre || 'Ing. Manuel de Jesús Fregoso Samaniega'}</div>
            <div style="font-size: 8px; color: #b89130; font-weight: 700; text-transform: uppercase;">${cot.remitente_cargo || 'Representante Legal / Dirección de Operaciones'}</div>
            <div style="font-size: 7.5px; color: #64748b;">ESOL ENERGÍAS</div>
          </div>
        </div>

        <div style="flex: 1; text-align: center;">
          <!-- Espacio amplio de ~2 cm adicionales para firma física holgada -->
          <div style="height: 75px;"></div>
          <div style="border-top: 1.5px solid #64748b; padding-top: 5px;">
            <div style="font-size: 9.5px; font-weight: 800; color: #0f172a;">${cot.cliente_atencion || cot.cliente_nombre || 'Cliente / Representante Autorizado'}</div>
            <div style="font-size: 8px; color: #475569; font-weight: 700; text-transform: uppercase;">Aceptación y Visto Bueno de Propuesta</div>
            <div style="font-size: 7.5px; color: #94a3b8;">Firma de Conformidad en Original</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generador del HTML Completo con Hojas Dinámicas (Habilitar / Inhabilitar Hoja 1 y Hoja 3)
export function buildCotizacionExpressHtml(cot: CotizacionExpressData): string {
  // Las hojas habilitadas por defecto son true a menos que se hayan inhabilitado explícitamente
  const hasHoja1 = cot.incluir_condiciones_servicio !== false;
  const hasHoja2 = true; // El cuerpo de la cotización siempre está presente
  const hasHoja3 = cot.incluir_condiciones_trabajo !== false;

  // Calcular número total de hojas reales
  let totalHojas = 0;
  if (hasHoja1) totalHojas++;
  if (hasHoja2) totalHojas++;
  if (hasHoja3) totalHojas++;

  // Calcular el índice real de cada hoja (1-based)
  let paginaHoja1 = 0;
  let paginaHoja2 = 0;
  let paginaHoja3 = 0;

  let currentNumber = 1;
  if (hasHoja1) {
    paginaHoja1 = currentNumber++;
  }
  if (hasHoja2) {
    paginaHoja2 = currentNumber++;
  }
  if (hasHoja3) {
    paginaHoja3 = currentNumber++;
  }

  const partidasHtml = (cot.partidas || []).map((p, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 9.5px;">
      <td style="padding: 6px 8px; text-align: center; color: #64748b; font-weight: bold;">${idx + 1}</td>
      <td style="padding: 6px 8px; color: #1e293b;">
        <div style="font-weight: 700;">${p.descripcion}</div>
        ${p.notas ? `<div style="font-size: 8px; color: #64748b; margin-top: 1px;">${p.notas}</div>` : ''}
      </td>
      <td style="padding: 6px 8px; text-align: center; color: #475569; font-weight: 600;">${p.unidad}</td>
      <td style="padding: 6px 8px; text-align: center; color: #0f172a; font-weight: bold;">${p.cantidad}</td>
      <td style="padding: 6px 8px; text-align: right; color: #0f172a; font-family: monospace;">${formatCurrency(p.precio_unitario)}</td>
      <td style="padding: 6px 8px; text-align: right; color: #0f172a; font-weight: bold; font-family: monospace;">${formatCurrency(p.importe)}</td>
    </tr>
  `).join('');

  // Cuadro de cliente reutilizable
  const clienteBoxHtml = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
        <div>
          <div style="font-size: 7.5px; font-weight: 800; color: #b89130; text-transform: uppercase; letter-spacing: 0.5px;">Propuesta Dirigida a:</div>
          <div style="font-size: 11.5px; font-weight: 900; color: #0f172a; margin-top: 1px;">${cot.cliente_nombre || 'Cliente General'}</div>
          ${cot.cliente_atencion ? `<div style="font-size: 9px; color: #334155; margin-top: 1px;"><strong>Atención:</strong> ${cot.cliente_atencion}</div>` : ''}
          ${cot.cliente_direccion ? `<div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">${cot.cliente_direccion}</div>` : ''}
        </div>
        <div style="text-align: right; font-size: 8.5px; color: #475569;">
          ${cot.cliente_rfc ? `<div><strong>RFC:</strong> <span style="font-family: monospace;">${cot.cliente_rfc}</span></div>` : ''}
          ${cot.cliente_telefono ? `<div><strong>Tel:</strong> ${cot.cliente_telefono}</div>` : ''}
          ${cot.cliente_email ? `<div><strong>Email:</strong> ${cot.cliente_email}</div>` : ''}
        </div>
      </div>
    </div>
  `;

  return `
    <div class="cotizacion-document" style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; width: 7.5in; margin: 0 auto; box-sizing: border-box; line-height: 1.45;">
      
      <!-- ============================================================== -->
      <!-- HOJA 1: CONDICIONES DE SERVICIO (SI ESTÁ HABILITADA)          -->
      <!-- ============================================================== -->
      ${hasHoja1 ? `
        <div id="cotizacion-page-hoja1" class="cotizacion-page" style="min-height: 10.2in; max-height: 10.3in; padding: 24px 28px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; ${hasHoja2 || hasHoja3 ? 'page-break-after: always;' : ''}">
          <div>
            ${getHeaderHtml(cot, paginaHoja1, totalHojas, 'SECCIÓN I: PRESENTACIÓN INSTITUCIONAL Y CONDICIONES DE SERVICIO')}

            ${clienteBoxHtml}

            <!-- ASUNTO Y VOCATIVO -->
            <div style="margin-bottom: 12px;">
              <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-left: 3px solid #b89130; padding-left: 8px; margin-bottom: 5px;">
                ASUNTO: ${cot.asunto}
              </div>
              <div style="font-size: 9.5px; color: #334155; font-style: italic;">
                ${cot.vocativo || 'Estimado(a) Cliente:'}
              </div>
            </div>

            <!-- OBJETIVO Y ALCANCE GENERAL DEL SERVICIO -->
            ${cot.descripcion_alcance ? `
              <div style="margin-bottom: 14px;">
                <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                  <span style="color: #b89130;">■</span> 1. ALCANCE Y OBJETIVOS DEL SERVICIO
                </div>
                <div style="font-size: 9px; line-height: 1.5; color: #1e293b; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 10px 12px; border-radius: 6px;">
                  ${cot.descripcion_alcance}
                </div>
              </div>
            ` : ''}

            <!-- CONDICIONES GENERALES DEL SERVICIO -->
            ${cot.condiciones_servicio ? `
              <div style="margin-bottom: 14px;">
                <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                  <span style="color: #b89130;">■</span> 2. TÉRMINOS, ESPECIFICACIONES Y MARCO NORMATIVO
                </div>
                <div style="font-size: 8.5px; line-height: 1.5; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 10px 12px; border-radius: 6px;">
                  ${cot.condiciones_servicio}
                </div>
              </div>
            ` : ''}

            <!-- METODOLOGÍA Y ENTREGABLES -->
            ${cot.metodologia_servicio ? `
              <div style="margin-bottom: 12px;">
                <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                  <span style="color: #b89130;">■</span> 3. METODOLOGÍA DE EJECUCIÓN Y ENTREGABLES
                </div>
                <div style="font-size: 8.5px; line-height: 1.5; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 8px 12px; border-radius: 6px;">
                  ${cot.metodologia_servicio}
                </div>
              </div>
            ` : ''}
          </div>

          ${getFooterHtml(cot, paginaHoja1, totalHojas)}
        </div>
      ` : ''}


      <!-- ============================================================== -->
      <!-- HOJA 2: CUERPO DE COTIZACIÓN (ECONÓMICA)                       -->
      <!-- ============================================================== -->
      <div id="cotizacion-page-hoja2" class="cotizacion-page" style="min-height: 10.2in; max-height: 10.3in; padding: 24px 28px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; ${hasHoja3 ? 'page-break-after: always;' : ''}">
        <div>
          ${getHeaderHtml(cot, paginaHoja2, totalHojas, hasHoja1 ? 'SECCIÓN II: CUERPO DE COTIZACIÓN Y DESGLOSE ECONÓMICO' : 'COTIZACIÓN ECONÓMICA DE SERVICIOS')}

          <!-- Si Hoja 1 está inhabilitada, mostramos aquí el cliente y el asunto para que la cotización sea completa y autosuficiente -->
          ${!hasHoja1 ? `
            ${clienteBoxHtml}
            <div style="margin-bottom: 12px;">
              <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-left: 3px solid #b89130; padding-left: 8px; margin-bottom: 4px;">
                ASUNTO: ${cot.asunto}
              </div>
              <div style="font-size: 9px; color: #334155; line-height: 1.4; text-align: justify; white-space: pre-line; background-color: #f8fafc; padding: 6px 10px; border-radius: 4px;">
                ${cot.descripcion_alcance}
              </div>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
              RELACIÓN DETALLADA DE CONCEPTOS Y PARTIDAS PRESUPUESTALES:
            </div>
            <div style="font-size: 8px; color: #64748b;">
              Moneda: <strong style="color: #0f172a;">MXN (Pesos Mexicanos)</strong>
            </div>
          </div>

          <!-- TABLA DE PARTIDAS Y CONCEPTOS -->
          <div style="margin-bottom: 12px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
              <thead>
                <tr style="background-color: #0f172a; color: #ffffff; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 6px 8px; width: 28px; text-align: center;">#</th>
                  <th style="padding: 6px 8px; text-align: left;">Descripción del Concepto / Insumo</th>
                  <th style="padding: 6px 8px; width: 60px; text-align: center;">Unidad</th>
                  <th style="padding: 6px 8px; width: 45px; text-align: center;">Cant.</th>
                  <th style="padding: 6px 8px; width: 85px; text-align: right;">P. Unitario</th>
                  <th style="padding: 6px 8px; width: 90px; text-align: right;">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${partidasHtml}
              </tbody>
            </table>
          </div>

          <!-- TOTALES Y DESGLOSE -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 14px;">
            <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 9px 12px;">
              <div style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Importe con Letra:</div>
              <div style="font-size: 8.5px; font-weight: bold; color: #0f172a; line-height: 1.3;">
                (${cot.total_letras || numeroALetras(cot.total)})
              </div>
              ${cot.notas_comerciales ? `
                <div style="margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 5px; font-size: 8px; color: #475569;">
                  <strong>Observaciones Comerciales:</strong> ${cot.notas_comerciales}
                </div>
              ` : ''}
            </div>

            <div style="width: 215px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 12px; font-size: 9.5px;">
              <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569;">
                <span>Subtotal:</span>
                <span style="font-family: monospace; font-weight: bold;">${formatCurrency(cot.subtotal)}</span>
              </div>
              ${cot.descuento > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #b91c1c;">
                  <span>Descuento:</span>
                  <span style="font-family: monospace; font-weight: bold;">-${formatCurrency(cot.descuento)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569; border-bottom: 1px solid #e2e8f0;">
                <span>IVA (${cot.iva_porcentaje || 16}%):</span>
                <span style="font-family: monospace; font-weight: bold;">${formatCurrency(cot.iva_monto)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 5px 0 2px 0; color: #0f172a; font-size: 11.5px; font-weight: 900;">
                <span>TOTAL:</span>
                <span style="font-family: monospace; color: #b89130;">${formatCurrency(cot.total)}</span>
              </div>
            </div>
          </div>

          <!-- RESUMEN DE CONDICIONES COMERCIALES Y CUENTA BANCARIA -->
          ${(cot.tiempo_entrega || cot.condiciones_pago || cot.banco_receptor || cot.cuenta_clabe) ? `
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #b89130; border-radius: 4px; padding: 8px 12px; font-size: 8px; line-height: 1.45; color: #334155;">
              <div style="font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 3px;">Datos Financieros y Términos Comerciales:</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                ${cot.tiempo_entrega ? `<div>• <strong>Tiempo de Ejecución:</strong> ${cot.tiempo_entrega}</div>` : ''}
                ${cot.condiciones_pago ? `<div>• <strong>Forma de Liquidación:</strong> ${cot.condiciones_pago}</div>` : ''}
                ${cot.banco_receptor ? `<div>• <strong>Institución Bancaria:</strong> ${cot.banco_receptor}</div>` : ''}
                ${cot.cuenta_clabe ? `<div>• <strong>CLABE Interbancaria:</strong> ${cot.cuenta_clabe}</div>` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- FIRMAS DE EMISIÓN Y ACEPTACIÓN DIRECTAMENTE HASTA ABAJO ARRIBA DEL PIE DE PÁGINA -->
        ${getFirmasHtml(cot)}

        ${getFooterHtml(cot, paginaHoja2, totalHojas)}
      </div>


      <!-- ============================================================== -->
      <!-- HOJA 3: CONDICIONES DE TRABAJO Y SEGURIDAD (SI ESTÁ HABILITADA) -->
      <!-- ============================================================== -->
      ${hasHoja3 ? `
        <div id="cotizacion-page-hoja3" class="cotizacion-page" style="min-height: 10.2in; max-height: 10.3in; padding: 24px 28px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            ${getHeaderHtml(cot, paginaHoja3, totalHojas, 'SECCIÓN III: CONDICIONES DE TRABAJO, SEGURIDAD Y CONFORMIDAD')}

            <!-- SEGURIDAD Y CONDICIONES EN SITIO -->
            ${cot.condiciones_trabajo ? `
              <div style="margin-bottom: 16px;">
                <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                  <span style="color: #b89130;">■</span> 1. REQUISITOS OPERATIVOS Y SEGURIDAD INDUSTRIAL
                </div>
                <div style="font-size: 8.5px; line-height: 1.6; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 12px 14px; border-radius: 6px;">
                  ${cot.condiciones_trabajo}
                </div>
              </div>
            ` : ''}

            <!-- RESPONSABILIDADES DEL CLIENTE -->
            ${cot.responsabilidades_cliente ? `
              <div style="margin-bottom: 16px;">
                <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                  <span style="color: #b89130;">■</span> 2. FACILIDADES Y RESPONSABILIDADES DEL CLIENTE
                </div>
                <div style="font-size: 8.5px; line-height: 1.6; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 12px 14px; border-radius: 6px;">
                  ${cot.responsabilidades_cliente}
                </div>
              </div>
            ` : ''}

            <!-- EXCLUSIONES Y TÉRMINOS DE GARANTÍA -->
            ${cot.exclusiones_garantias ? `
              <div style="margin-bottom: 16px;">
                <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                  <span style="color: #b89130;">■</span> 3. EXCLUSIONES GENERALES Y TÉRMINOS DE GARANTÍA
                </div>
                <div style="font-size: 8.5px; line-height: 1.6; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 12px 14px; border-radius: 6px;">
                  ${cot.exclusiones_garantias}
                </div>
              </div>
            ` : ''}

            <!-- DECLARACIÓN DE CONFORMIDAD -->
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #b89130; border-radius: 6px; padding: 12px 14px; font-size: 8.5px; color: #334155; text-align: justify; line-height: 1.6; margin-top: 14px;">
              <strong>DECLARACIÓN DE ACEPTACIÓN:</strong> La aceptación de la presente cotización (mediante firma en la Sección II, confirmación por correo electrónico o pago de anticipo) convalida la plena conformidad de ambas partes respecto a los alcances técnicos, importes económicos y condiciones estipuladas en el presente documento.
            </div>
          </div>

          ${getFooterHtml(cot, paginaHoja3, totalHojas)}
        </div>
      ` : ''}

    </div>
  `;
}

// Generador del documento HTML completo e interactivo (idéntico al de la vista previa Blob)
export function buildCotizacionExpressFullDocument(cot: CotizacionExpressData): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Cotización - ${cot.folio || 'ESOL'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            background-color: #0b0f17;
            min-height: 100vh;
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
          }
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 16px;
          }
          .doc-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 8.5in;
          }
          .cotizacion-document {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 36px;
            width: 100% !important;
          }
          /* Cada hoja con dimensiones y márgenes idénticos a la vista previa */
          .cotizacion-page {
            background-color: #ffffff !important;
            width: 7.5in !important;
            min-height: 10.3in !important;
            box-shadow: 0 16px 38px -6px rgba(0, 0, 0, 0.7), 0 8px 16px -6px rgba(0, 0, 0, 0.5) !important;
            border-radius: 8px !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            position: relative !important;
            padding: 28px 32px !important;
            line-height: 1.5 !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          @page {
            size: letter portrait;
            margin: 0.35in 0.45in;
          }

          @media print {
            html, body {
              background-color: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .doc-wrapper {
              max-width: 100% !important;
              width: 100% !important;
            }
            .cotizacion-document {
              gap: 0 !important;
              width: 100% !important;
            }
            .cotizacion-page {
              width: 100% !important;
              min-height: 10in !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: 10px 0 !important;
              page-break-after: always !important;
              break-after: page !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="position: sticky; top: 12px; z-index: 9999; display: flex; gap: 10px; align-items: center; background: rgba(15, 23, 42, 0.95); padding: 10px 18px; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;">
          <span style="color: #b89130; font-weight: 800; font-size: 13px;">${cot.folio || 'COTIZACIÓN'}</span>
          <span style="color: #94a3b8; font-size: 12px;">| ${cot.cliente_nombre || 'Cliente'}</span>
          
          <!-- BOTÓN DESCARGAR PDF DIRECTO -->
          <button id="btn-descargar-pdf" onclick="descargarPdfDirecto()" style="background: #b89130; color: #000; font-weight: 800; border: none; padding: 7px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: inherit; margin-left: 10px; box-shadow: 0 2px 8px rgba(184, 145, 48, 0.4); display: flex; align-items: center; gap: 6px;">
            <span>📥 Descargar PDF</span>
          </button>

          <!-- BOTÓN IMPRIMIR OPCIONAL -->
          <button onclick="window.print()" style="background: #1e293b; color: #f1f5f9; border: 1px solid #475569; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit;">
            🖨️ Imprimir
          </button>

          <button onclick="window.close()" style="background: #334155; color: #fff; border: none; padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit;">
            Cerrar
          </button>
        </div>
        <div class="doc-wrapper" id="documento-impresion">
          ${buildCotizacionExpressHtml(cot)}
        </div>
        <script>
          // Generar y descargar PDF con fidelidad exacta al Blob (hoja por hoja sin desajustes)
          async function descargarPdfDirecto() {
            var btn = document.getElementById('btn-descargar-pdf');
            if (btn) btn.innerHTML = '<span>⏳ Generando PDF...</span>';

            try {
              var pages = document.querySelectorAll('.cotizacion-page');
              if (!pages || pages.length === 0) {
                window.print();
                if (btn) btn.innerHTML = '<span>📥 Descargar PDF</span>';
                return;
              }

              // Usar jsPDF con html2canvas integrado
              const { jsPDF } = window.jspdf || window;
              const pdf = new (window.jspdf ? window.jspdf.jsPDF : window.jsPDF)({
                orientation: 'portrait',
                unit: 'in',
                format: 'letter'
              });

              // Esperar a que las tipografías estén 100% cargadas en el documento
              if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
              }

              for (var i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage('letter', 'portrait');
                var pageEl = pages[i];
                var canvas = await html2canvas(pageEl, {
                  scale: 2,
                  useCORS: true,
                  backgroundColor: '#ffffff',
                  logging: false,
                  windowWidth: 1024,
                  onclone: function(clonedDoc) {
                    var boxes = clonedDoc.querySelectorAll('*');
                    boxes.forEach(function(el) {
                      // Asegurar que ningún elemento tenga texto transparente o colapsado
                      if (window.getComputedStyle(el).opacity === '0') {
                        el.style.opacity = '1';
                      }
                    });
                  }
                });
                var imgData = canvas.toDataURL('image/jpeg', 0.98);
                // Hoja carta: 8.5 x 11 in. Margen: 0.5 in horizontal, 0.45 in vertical. Ancho imagen: 7.5 in, Alto imagen: 10.1 in
                pdf.addImage(imgData, 'JPEG', 0.5, 0.45, 7.5, 10.1, undefined, 'FAST');
              }

              var filename = '${(cot.folio || 'Cotizacion').replace(/[/\\?%*:|"<>]/g, '_')}_${(cot.cliente_nombre || 'Cliente').replace(/[/\\?%*:|"<>]/g, '_')}.pdf';
              pdf.save(filename);
            } catch (err) {
              console.error('Error generando PDF de alta precisión:', err);
              // Como fallback si canvas es bloqueado por navegador
              window.print();
            } finally {
              if (btn) btn.innerHTML = '<span>📥 Descargar PDF</span>';
            }
          }
        </script>
      </body>
    </html>
  `;
}

export async function generateCotizacionExpressPdf(
  cotizacion: CotizacionExpressData,
  onDriveStatus?: (status: 'uploading' | 'success' | 'none') => void
): Promise<{ blob?: Blob; blobUrl?: string; filename: string; driveUrl: string | null }> {
  const cleanFolio = (cotizacion.folio || 'BORRADOR').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanCliente = (cotizacion.cliente_nombre || 'Cliente').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Propuesta_${cleanFolio}_${cleanCliente}.pdf`;

  // Construir documento HTML autónomo idéntico al de vista previa
  const fullHtml = buildCotizacionExpressFullDocument(cotizacion);

  // Crear Blob URL con tipo HTML para abrir una URL blob: real y respetable
  const htmlBlob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const htmlBlobUrl = URL.createObjectURL(htmlBlob);

  // Abrir directamente la URL blob: en nueva pestaña
  window.open(htmlBlobUrl, '_blank');

  let driveUrl: string | null = null;
  // Subir a Drive si la cotización está emitida
  if (cotizacion.estado !== 'borrador') {
    try {
      onDriveStatus?.('uploading');
      driveUrl = await cotizadorExpressService.uploadToDrive(htmlBlob, filename.replace('.pdf', '.html'), cotizacion);
      onDriveStatus?.(driveUrl ? 'success' : 'none');
    } catch (e) {
      console.warn('Error subiendo a Drive:', e);
      onDriveStatus?.('none');
    }
  }

  return { blob: htmlBlob, blobUrl: htmlBlobUrl, filename, driveUrl };
}
