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
          <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">ESOL ENERGÍAS RENOVABLES</div>
          <div style="font-size: 8.5px; font-weight: 700; color: #b89130; text-transform: uppercase; letter-spacing: 1px;">Ingeniería, Suministros y Soluciones Energéticas</div>
          <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Tepic, Nayarit • contacto@esolenergias.com • Tel: 311 234 3034</div>
        </div>
      </div>

      <div style="text-align: right;">
        <div style="display: inline-block; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; margin-bottom: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Folio de Propuesta</div>
          <div style="font-size: 12px; font-weight: 900; color: ${cot.estado === 'borrador' ? '#d97706' : '#b89130'}; font-family: monospace;">
            ${cot.folio || 'BORRADOR'}
          </div>
        </div>
        <div style="font-size: 8px; color: #64748b;">
          <strong>Emisión:</strong> ${cot.lugar || 'Tepic, Nayarit'}, a ${fechaTexto}
        </div>
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 6px; margin-top: 2px;">
          <span style="font-size: 7.5px; color: #b89130; font-weight: 700;">Vigencia: ${cot.vigencia_dias || 15} días</span>
          <span style="font-size: 7.5px; background-color: #0f172a; color: #ffffff; padding: 1px 6px; border-radius: 4px; font-weight: 700;">PÁG. ${numeroHoja} DE ${totalHojas}</span>
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
      <div>ESOL ENERGÍAS RENOVABLES S.A. DE C.V. • R.F.C. EEN190412XYZ • TEPIC, NAYARIT</div>
      <div>${cot.folio || 'BORRADOR'} | Hoja ${numeroHoja} de ${totalHojas}</div>
    </div>
  `;
}

// Generador del HTML Completo Estructurado en 3 Hojas Formales
export function buildCotizacionExpressHtml(cot: CotizacionExpressData): string {
  const fechaTexto = new Date(cot.fecha || Date.now()).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

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

  return `
    <div style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #0f172a; width: 7.5in; margin: 0 auto; box-sizing: border-box; line-height: 1.4;">
      
      <!-- ========================================== -->
      <!-- HOJA 1: CONDICIONES DE SERVICIO           -->
      <!-- ========================================== -->
      <div style="min-height: 10.2in; max-height: 10.3in; padding: 24px 28px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always;">
        <div>
          ${getHeaderHtml(cot, 1, 3, 'SECCIÓN I: PRESENTACIÓN INSTITUCIONAL Y CONDICIONES DE SERVICIO')}

          <!-- DESTINATARIO / CLIENTE -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;">
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
          <div style="margin-bottom: 14px;">
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="color: #b89130;">■</span> 1. ALCANCE Y OBJETIVOS DEL SERVICIO
            </div>
            <div style="font-size: 9px; line-height: 1.5; color: #1e293b; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 10px 12px; border-radius: 6px;">
              ${cot.descripcion_alcance}
            </div>
          </div>

          <!-- CONDICIONES GENERALES DEL SERVICIO -->
          <div style="margin-bottom: 14px;">
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="color: #b89130;">■</span> 2. TÉRMINOS, ESPECIFICACIONES Y MARCO NORMATIVO
            </div>
            <div style="font-size: 8.5px; line-height: 1.5; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 10px 12px; border-radius: 6px;">
              ${cot.condiciones_servicio || 'Los servicios descritos se prestarán bajo los más altos estándares de calidad en ingeniería y cumplimiento de la NOM-001-SEDE-2012 y lineamientos de la Comisión Reguladora de Energía (CRE).'}
            </div>
          </div>

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

        ${getFooterHtml(cot, 1, 3)}
      </div>


      <!-- ========================================== -->
      <!-- HOJA 2: CUERPO DE COTIZACIÓN (ECONÓMICA)  -->
      <!-- ========================================== -->
      <div style="min-height: 10.2in; max-height: 10.3in; padding: 24px 28px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always;">
        <div>
          ${getHeaderHtml(cot, 2, 3, 'SECCIÓN II: CUERPO DE COTIZACIÓN Y DESGLOSE ECONÓMICO')}

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
              RELACIÓN DETALLADA DE CONCEPTOS Y PARTIDAS PRESUPUESTALES:
            </div>
            <div style="font-size: 8px; color: #64748b;">
              Moneda: <strong style="color: #0f172a;">MXN (Pesos Mexicanos)</strong>
            </div>
          </div>

          <!-- TABLA DE PARTIDAS Y CONCEPTOS -->
          <div style="margin-bottom: 14px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
              <thead>
                <tr style="background-color: #0f172a; color: #ffffff; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 7px 8px; width: 28px; text-align: center;">#</th>
                  <th style="padding: 7px 8px; text-align: left;">Descripción del Concepto / Insumo</th>
                  <th style="padding: 7px 8px; width: 60px; text-align: center;">Unidad</th>
                  <th style="padding: 7px 8px; width: 45px; text-align: center;">Cant.</th>
                  <th style="padding: 7px 8px; width: 85px; text-align: right;">P. Unitario</th>
                  <th style="padding: 7px 8px; width: 90px; text-align: right;">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${partidasHtml}
              </tbody>
            </table>
          </div>

          <!-- TOTALES Y DESGLOSE -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 16px;">
            <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px;">
              <div style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Importe con Letra:</div>
              <div style="font-size: 8.5px; font-weight: bold; color: #0f172a; line-height: 1.3;">
                (${cot.total_letras || numeroALetras(cot.total)})
              </div>
              ${cot.notas_comerciales ? `
                <div style="margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 6px; font-size: 8px; color: #475569;">
                  <strong>Observaciones Comerciales:</strong> ${cot.notas_comerciales}
                </div>
              ` : ''}
            </div>

            <div style="width: 220px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 9.5px;">
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
              <div style="display: flex; justify-content: space-between; padding: 6px 0 2px 0; color: #0f172a; font-size: 11.5px; font-weight: 900;">
                <span>TOTAL:</span>
                <span style="font-family: monospace; color: #b89130;">${formatCurrency(cot.total)}</span>
              </div>
            </div>
          </div>

          <!-- RESUMEN DE CONDICIONES COMERCIALES Y CUENTA BANCARIA -->
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #b89130; border-radius: 4px; padding: 10px 12px; font-size: 8.5px; line-height: 1.45; color: #334155;">
            <div style="font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">Datos Financieros y Condiciones Comerciales:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>• <strong>Tiempo de Ejecución:</strong> ${cot.tiempo_entrega || 'Inmediata / A convenir'}</div>
              <div>• <strong>Forma de Liquidación:</strong> ${cot.condiciones_pago || '50% anticipo, 50% finiquito'}</div>
              <div>• <strong>Institución Bancaria:</strong> ${cot.banco_receptor || 'BBVA Bancomer Esol Energías'}</div>
              <div>• <strong>CLABE Interbancaria:</strong> ${cot.cuenta_clabe || 'Solicitar cuenta CLABE para transferencia SPEI'}</div>
            </div>
          </div>
        </div>

        ${getFooterHtml(cot, 2, 3)}
      </div>


      <!-- ========================================== -->
      <!-- HOJA 3: CONDICIONES DE TRABAJO Y FIRMAS   -->
      <!-- ========================================== -->
      <div style="min-height: 10.2in; max-height: 10.3in; padding: 24px 28px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${getHeaderHtml(cot, 3, 3, 'SECCIÓN III: CONDICIONES DE TRABAJO, SEGURIDAD Y CONFORMIDAD')}

          <!-- SEGURIDAD Y CONDICIONES EN SITIO -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="color: #b89130;">■</span> 1. REQUISITOS OPERATIVOS Y SEGURIDAD INDUSTRIAL
            </div>
            <div style="font-size: 8.5px; line-height: 1.5; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 9px 12px; border-radius: 6px;">
              ${cot.condiciones_trabajo || 'El personal técnico de ESOL Energías contará con Equipo de Protección Personal (EPP) completo, acreditación técnica y cumplimiento estricto de las normativas de seguridad e higiene aplicables.'}
            </div>
          </div>

          <!-- RESPONSABILIDADES DEL CLIENTE -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="color: #b89130;">■</span> 2. FACILIDADES Y RESPONSABILIDADES DEL CLIENTE
            </div>
            <div style="font-size: 8.5px; line-height: 1.5; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 9px 12px; border-radius: 6px;">
              ${cot.responsabilidades_cliente || 'El cliente se compromete a otorgar los accesos indispensables al inmueble, áreas de azotea y tableros eléctricos, así como designar un enlace técnico responsable durante la jornada de trabajo.'}
            </div>
          </div>

          <!-- EXCLUSIONES Y TÉRMINOS DE GARANTÍA -->
          <div style="margin-bottom: 14px;">
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="color: #b89130;">■</span> 3. EXCLUSIONES GENERALES Y TÉRMINOS DE GARANTÍA
            </div>
            <div style="font-size: 8.5px; line-height: 1.5; color: #334155; text-align: justify; white-space: pre-line; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 9px 12px; border-radius: 6px;">
              ${cot.exclusiones_garantias || 'No se incluyen obras civiles mayores, pago de derechos gubernamentales ante dependencias no estipuladas, ni adecuaciones eléctricas no descritas en el cuerpo de la cotización.'}
            </div>
          </div>

          <!-- DECLARACIÓN DE CONFORMIDAD -->
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 8px; color: #475569; text-align: justify; line-height: 1.4; margin-bottom: 16px;">
            <strong>DECLARACIÓN DE ACEPTACIÓN:</strong> La aceptación de la presente cotización (mediante firma, confirmación por correo electrónico o pago de anticipo) convalida la plena conformidad de ambas partes respecto a los alcances técnicos, importes económicos y condiciones de servicio y trabajo descritos en las 3 fojas de este documento.
          </div>

          <!-- FIRMAS DE EMISIÓN Y ACEPTACIÓN -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 30px; margin-top: 15px;">
            <div style="flex: 1; text-align: center;">
              <div style="height: 48px; display: flex; align-items: center; justify-content: center;">
                ${cot.incluir_firma_digital && cot.firma_digital ? `<img src="${cot.firma_digital}" style="max-height: 44px; object-fit: contain;" alt="Firma" />` : ''}
              </div>
              <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">
                <div style="font-size: 9.5px; font-weight: 800; color: #0f172a;">${cot.remitente_nombre || 'Ing. Manuel de Jesús Fregoso Samaniega'}</div>
                <div style="font-size: 8px; color: #b89130; font-weight: 600; text-transform: uppercase;">${cot.remitente_cargo || 'Representante Legal / Dirección de Operaciones'}</div>
                <div style="font-size: 7.5px; color: #64748b;">ESOL ENERGÍAS RENOVABLES</div>
              </div>
            </div>

            <div style="flex: 1; text-align: center;">
              <div style="height: 48px;"></div>
              <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">
                <div style="font-size: 9.5px; font-weight: 800; color: #0f172a;">${cot.cliente_atencion || cot.cliente_nombre || 'Cliente / Representante Autorizado'}</div>
                <div style="font-size: 8px; color: #64748b; font-weight: 600; text-transform: uppercase;">Aceptación y Visto Bueno de Propuesta</div>
                <div style="font-size: 7.5px; color: #94a3b8;">Firma de Conformidad</div>
              </div>
            </div>
          </div>
        </div>

        ${getFooterHtml(cot, 3, 3)}
      </div>

    </div>
  `;
}

export async function generateCotizacionExpressPdf(
  cotizacion: CotizacionExpressData,
  onDriveStatus?: (status: 'uploading' | 'success' | 'none') => void
): Promise<{ blob: Blob; blobUrl: string; filename: string; driveUrl: string | null }> {
  const win = window.open('about:blank', '_blank');

  const cleanFolio = (cotizacion.folio || 'BORRADOR').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanCliente = (cotizacion.cliente_nombre || 'Cliente').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Propuesta_${cleanFolio}_${cleanCliente}.pdf`;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.width = '7.5in';
  container.style.backgroundColor = '#FFFFFF';
  container.style.zIndex = '-9999';
  container.innerHTML = buildCotizacionExpressHtml(cotizacion);
  document.body.appendChild(container);

  const opt = {
    margin: [0.35, 0.35, 0.35, 0.35],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    const pdfBlob: Blob = await new Promise((resolve, reject) => {
      html2pdf()
        .set(opt)
        .from(container)
        .outputPdf('blob')
        .then(resolve)
        .catch(reject);
    });

    const blobUrl = URL.createObjectURL(pdfBlob);

    if (win && !win.closed) {
      win.location.replace(blobUrl);
    } else {
      window.open(blobUrl, '_blank');
    }

    // Subir a Drive si está emitida
    let driveUrl: string | null = null;
    if (cotizacion.estado !== 'borrador') {
      onDriveStatus?.('uploading');
      driveUrl = await cotizadorExpressService.uploadToDrive(pdfBlob, filename, cotizacion);
      if (driveUrl) {
        onDriveStatus?.('success');
      } else {
        onDriveStatus?.('none');
      }
    }

    return { blob: pdfBlob, blobUrl, filename, driveUrl };
  } catch (error) {
    if (win) win.close();
    console.error('Error generando PDF de cotización:', error);
    throw error;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
