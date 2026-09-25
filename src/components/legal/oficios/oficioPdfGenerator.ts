// @ts-ignore
import html2pdf from 'html2pdf.js';
import type { OficioData } from './types';
import { supabase } from '../../../context/supabase';

export const formatFechaOficio = (dateString: string, lugar: string = 'Tepic, Nayarit'): string => {
  if (!dateString) return `${lugar}, a ____ de ________ de 2026`;
  try {
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);
    const dateObj = new Date(y, m, d);
    const dayNum = dateObj.getDate();
    const yearNum = dateObj.getFullYear();
    const monthName = dateObj.toLocaleDateString('es-MX', { month: 'long' });
    
    return `${lugar}, a ${dayNum} de ${monthName} de ${yearNum}`;
  } catch (e) {
    return dateString;
  }
};

export function buildOficioHtml(oficio: OficioData): string {
  const logoUrl = window.location.origin + '/Logo_esol_b.png';
  const fechaCompleta = formatFechaOficio(oficio.fecha, oficio.lugar || 'Tepic, Nayarit');

  const formatTextToParagraphs = (text?: string) => {
    if (!text || !text.trim()) return '';
    return text
      .split('\n\n')
      .map(p => {
        const lines = p.split('\n');
        return `<p style="margin: 0 0 10px 0; text-align: justify; line-height: 1.55; color: #1e293b; font-size: 11px;">${lines.join('<br/>')}</p>`;
      })
      .join('');
  };

  const formatNumberedOrBulletList = (text?: string) => {
    if (!text || !text.trim()) return '';
    const lines = text.split('\n').filter(l => l.trim() !== '');
    let html = '<ul style="margin: 6px 0 10px 0; padding-left: 22px; color: #1e293b; font-size: 11px; line-height: 1.5;">';
    lines.forEach(line => {
      const cleanLine = line.replace(/^[-*•\d+.)]\s*/, '').trim();
      html += `<li style="margin-bottom: 4px; text-align: justify;">${cleanLine}</li>`;
    });
    html += '</ul>';
    return html;
  };

  return `
    <div class="oficio-sheet" style="width: 816px; min-height: 1056px; box-sizing: border-box; background-color: #ffffff; color: #0f172a; padding: 40px 48px 36px 48px; margin: 0 auto; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <!-- Membrete Oficial -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${logoUrl}" alt="ESOL Energias" style="max-height: 48px; width: auto; display: block;" onerror="this.style.display='none'" crossOrigin="anonymous" />
            <div>
              <div style="font-family: 'Cinzel', 'Times New Roman', serif; font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: 1px;">ESOL ENERGIAS</div>
              <div style="font-size: 9px; text-transform: uppercase; color: #d4af37; font-weight: 700; letter-spacing: 1.5px;">Ingeniería & Soluciones Fotovoltaicas</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #0f172a; color: #d4af37; font-family: monospace; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 4px; border: 1px solid #d4af37; letter-spacing: 0.5px;">OFICIO No. ${oficio.folio || 'OF-ESOL-2026-001'}</div>
            <div style="font-size: 10px; color: #475569; margin-top: 4px; font-weight: 500;">${fechaCompleta}</div>
          </div>
        </div>

        <!-- 1. TÍTULO / ASUNTO Y REFERENCIA DE OBRA (PRIMERO) -->
        ${(oficio.asunto && oficio.asunto.trim()) || (oficio.referencia && oficio.referencia.trim()) || (oficio.nombreObra && oficio.nombreObra.trim()) ? `
          <div style="background: #f1f5f9; border-left: 3px solid #d4af37; padding: 8px 12px; margin-bottom: 14px;">
            ${oficio.asunto && oficio.asunto.trim() ? `
              <p style="font-size: 11.5px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin: 0;">${oficio.asunto}</p>
            ` : ''}
            ${(oficio.referencia && oficio.referencia.trim()) || (oficio.nombreObra && oficio.nombreObra.trim()) ? `
              <p style="font-size: 9.5px; color: #64748b; margin: 3px 0 0 0; font-weight: 600;">
                ${oficio.referencia && oficio.referencia.trim() ? oficio.referencia : `<strong>REF. OBRA:</strong> ${oficio.nombreObra || ''} ${oficio.clienteFinal ? `| Cliente: ${oficio.clienteFinal}` : ''} ${oficio.ubicacionObra ? `| Ubicación: ${oficio.ubicacionObra}` : ''}`}
              </p>
            ` : ''}
          </div>
        ` : ''}

        <!-- 2 Espacios de separación antes de indicar a quién va dirigido -->
        <div style="height: 24px;"></div>

        <!-- 2. DESTINATARIO (DESPUÉS DEL TÍTULO) -->
        <div style="margin-bottom: 14px; background: #f8fafc; border-left: 3px solid #0f172a; padding: 8px 12px; border-radius: 0 6px 6px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${oficio.destinatarioTitulo ? oficio.destinatarioTitulo + ' ' : ''}${oficio.destinatarioNombre || 'A QUIEN CORRESPONDA'}</div>
          ${oficio.destinatarioCargo ? `<div style="font-size: 10px; font-weight: 600; color: #334155;">${oficio.destinatarioCargo}</div>` : ''}
          ${oficio.destinatarioEmpresa ? `<div style="font-size: 10px; color: #475569; text-transform: uppercase;">${oficio.destinatarioEmpresa}</div>` : ''}
          ${oficio.destinatarioAtencion ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">AT'N: ${oficio.destinatarioAtencion}</div>` : ''}
          <div style="font-size: 11px; font-weight: 700; color: #0f172a; letter-spacing: 1px; margin-top: 4px;">P R E S E N T E .-</div>
        </div>

        <!-- Vocativo -->
        ${oficio.vocativo && oficio.vocativo.trim() ? `<div style="font-size: 11px; font-weight: 600; color: #1e293b; margin-bottom: 10px; font-style: italic;">${oficio.vocativo}</div>` : ''}

        <!-- Antecedentes si existen -->
        ${oficio.antecedentes && oficio.antecedentes.trim() ? `
          <div style="margin-bottom: 10px;">
            ${formatTextToParagraphs(oficio.antecedentes)}
          </div>
        ` : ''}

        <!-- Cuerpo Principal -->
        ${oficio.cuerpo && oficio.cuerpo.trim() ? `
          <div style="margin-bottom: 12px;">
            ${formatTextToParagraphs(oficio.cuerpo)}
          </div>
        ` : ''}

        <!-- Tabla de Insumos / Partidas (si existen partidas) -->
        ${oficio.partidas && oficio.partidas.length > 0 ? (() => {
          const mostrarPrecios = oficio.mostrarPreciosEnPdf ?? true;
          const totalImporte = oficio.partidas.reduce((acc, p) => acc + (p.importe ?? ((p.cantidad || 0) * (p.precio_unitario || 0))), 0);
          return `
            <div style="margin: 12px 0 16px 0; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; page-break-inside: avoid;">
              <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: left;">
                <thead>
                  <tr style="background-color: #0f172a; color: #ffffff;">
                    <th style="padding: 6px 8px; border: 1px solid #334155; width: 28px; text-align: center;">#</th>
                    <th style="padding: 6px 8px; border: 1px solid #334155;">DESCRIPCIÓN / CONCEPTO</th>
                    <th style="padding: 6px 8px; border: 1px solid #334155; width: 55px; text-align: center;">UNIDAD</th>
                    <th style="padding: 6px 8px; border: 1px solid #334155; width: 50px; text-align: center;">CANT.</th>
                    ${mostrarPrecios ? `
                      <th style="padding: 6px 8px; border: 1px solid #334155; width: 80px; text-align: right;">P. UNITARIO</th>
                      <th style="padding: 6px 8px; border: 1px solid #334155; width: 85px; text-align: right;">IMPORTE</th>
                    ` : ''}
                  </tr>
                </thead>
                <tbody>
                  ${oficio.partidas.map((item, idx) => {
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                    const pu = Number(item.precio_unitario || 0);
                    const imp = Number(item.importe ?? (item.cantidad * pu));
                    return `
                      <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #0f172a; font-weight: 600;">${item.descripcion}</td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; color: #475569; font-family: monospace;">${item.unidad || 'PZA'}</td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; color: #0f172a; font-weight: 700; font-family: monospace;">${item.cantidad}</td>
                        ${mostrarPrecios ? `
                          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; color: #475569; font-family: monospace;">$${pu.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; color: #0f172a; font-weight: 700; font-family: monospace;">$${imp.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        ` : ''}
                      </tr>
                    `;
                  }).join('')}
                  ${mostrarPrecios ? `
                    <tr style="background-color: #f1f5f9; font-weight: 700;">
                      <td colspan="5" style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; color: #0f172a; font-size: 10px;">TOTAL ESTIMADO (MXN):</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; color: #d4af37; font-size: 10.5px; font-family: monospace; font-weight: 800; background-color: #0f172a;">$${totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          `;
        })() : ''}

        <!-- Fundamentación Técnica / Normativa si existe -->
        ${oficio.fundamentacion && oficio.fundamentacion.trim() ? `
          <div style="background: #fdfbf7; border: 1px solid #fef3c7; border-left: 3px solid #d4af37; padding: 10px 14px; border-radius: 4px; margin: 12px 0;">
            <div style="margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #d4af37; background-color: #0f172a; padding: 4px 12px; border-radius: 4px; display: inline-block; line-height: 1.4; vertical-align: middle; box-sizing: border-box;">FUNDAMENTACIÓN TÉCNICA Y NORMATIVA</span>
            </div>
            <div style="font-size: 11px; color: #1e293b; line-height: 1.55;">
              ${formatTextToParagraphs(oficio.fundamentacion)}
            </div>
          </div>
        ` : ''}

        <!-- Petición / Acuerdos si existen -->
        ${oficio.peticion && oficio.peticion.trim() ? `
          <div style="margin-top: 12px; margin-bottom: 10px;">
            <div style="margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #d4af37; background-color: #0f172a; padding: 4px 12px; border-radius: 4px; display: inline-block; line-height: 1.4; vertical-align: middle; box-sizing: border-box;">PETICIÓN Y REQUERIMIENTOS PUNTUALES</span>
            </div>
            ${formatNumberedOrBulletList(oficio.peticion)}
          </div>
        ` : ''}

        <!-- Despedida -->
        ${oficio.despedida && oficio.despedida.trim() ? `
          <div style="margin-top: 12px;">
            ${formatTextToParagraphs(oficio.despedida)}
          </div>
        ` : ''}
      </div>

      <!-- Firmas y Acuse de Recibo (Sin anexos redundantes) -->
      <div>
        <div style="display: flex; justify-content: space-between; margin-top: 24px; padding-top: 10px; page-break-inside: avoid;">
          <!-- Columna Emisor ESOL -->
          <div style="width: 45%; text-align: center; position: relative;">
            <div style="font-size: 9.5px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; margin-bottom: 2px;">
              ATENTAMENTE
            </div>
            <div style="font-size: 8.5px; color: #d4af37; font-weight: 700; text-transform: uppercase;">
              ${oficio.empresaRazonSocial || 'ESOL ENERGIAS'}
            </div>
            <div style="height: 85px; display: flex; align-items: flex-end; justify-content: center; margin-top: 2px; position: relative;">
              ${oficio.incluirFirmaDigital && oficio.firmaDigital ? `
                <img src="${oficio.firmaDigital}" alt="Firma Digital" style="max-height: 105px; max-width: 315px; width: auto; object-fit: contain; margin-bottom: -22px; position: relative; z-index: 10; display: block;" onerror="this.style.display='none'" crossOrigin="anonymous" />
              ` : ''}
            </div>
            <div style="border-top: 1px solid #0f172a; margin-top: 0px; margin-bottom: 6px; position: relative; z-index: 1;"></div>
            <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; text-transform: uppercase; position: relative; z-index: 2;">${oficio.remitenteNombre || 'MANUEL DE JESUS FREGOSO SAMANIEGA'}</div>
            <div style="font-size: 9px; color: #475569; position: relative; z-index: 2;">${oficio.remitenteCargo || 'REPRESENTANTE LEGAL'}</div>
            ${oficio.remitenteCedula ? `<div style="font-size: 9px; color: #475569; position: relative; z-index: 2;">CÉD. PROF. ${oficio.remitenteCedula}</div>` : ''}
          </div>

          <!-- Columna Acuse / Recepción Destinatario -->
          <div style="width: 45%; text-align: center;">
            <div style="border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px; background: #f8fafc; height: 140px; display: flex; flex-direction: column; justify-content: space-between; text-align: left; font-size: 8.5px; color: #64748b; box-sizing: border-box;">
              <div style="font-weight: 700; color: #0f172a; text-align: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; font-size: 9px;">
                ACUSE DE RECIBIDO
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>FECHA: _____/_____/2026</span>
                <span>HORA: ________ hrs</span>
              </div>
              <div>NOMBRE DE QUIEN RECIBE: _________________________</div>
              <div style="text-align: center; color: #94a3b8; font-style: italic; font-size: 8px;">
                (Firma y Sello Oficial de la Dependencia / Empresa)
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Institucional (Sin RFC) -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 16px; display: flex; justify-content: space-between; font-size: 8px; color: #64748b; line-height: 1.3;">
          <div>
            <strong>${oficio.empresaRazonSocial || 'ESOL ENERGIAS'}</strong><br/>
            ${oficio.empresaDomicilio || 'Tepic, Nayarit, México'}
          </div>
          <div style="text-align: right;">
            Tel: ${oficio.empresaTelefono || '3112343034'} | Email: ${oficio.empresaEmail || 'contacto@esolenergias.com'}<br/>
            <span style="font-family: monospace; color: #d4af37;">SISTEMA OFICIAL DE CONTROL DE OBRA ESOL</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function uploadOficioToDrive(
  pdfBlob: Blob,
  filename: string,
  oficio: OficioData
): Promise<string | null> {
  const webhookUrl = localStorage.getItem('esol_make_webhook_url') || '';
  if (!webhookUrl || !webhookUrl.includes('http')) {
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', pdfBlob, filename);
    formData.append('filename', filename);
    formData.append('cliente', oficio.clienteFinal || 'Cliente General');
    formData.append('nombreObra', oficio.nombreObra || '');
    formData.append('presupuestoId', oficio.presupuestoId || '');
    formData.append('folio', oficio.folio);
    formData.append('modulo', 'OFICIOS');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });

    const text = await response.text();
    let driveUrl = null;

    try {
      const data = JSON.parse(text);
      if (data && (data.driveUrl || data.url)) {
        driveUrl = data.driveUrl || data.url;
      }
    } catch (e) {
      if (text.includes('drive.google.com')) {
        const match = text.match(/https:\/\/drive\.google\.com\/[^\s"']+/);
        if (match) driveUrl = match[0];
      }
    }

    if (driveUrl && oficio.id) {
      try {
        await supabase
          .from('oficios_obra')
          .update({ drive_url: driveUrl })
          .eq('id', oficio.id);
      } catch (err) {
        console.warn('Error updating drive_url in Supabase:', err);
      }
    }

    return driveUrl;
  } catch (error) {
    console.error('Error al subir oficio a Drive:', error);
    return null;
  }
}

export async function generateOficioPdf(
  oficio: OficioData,
  onDriveUploadStatus?: (status: 'uploading' | 'success' | 'none') => void
): Promise<{ blob: Blob; blobUrl: string; filename: string; driveUrl: string | null }> {
  // Pre-open window immediately to avoid popup blocker
  const win = window.open('about:blank', '_blank');

  const container = document.createElement('div');
  container.innerHTML = buildOficioHtml(oficio);
  const element = container.firstElementChild || container;

  const cleanFolio = (oficio.folio || 'ESOL').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanDest = (oficio.destinatarioNombre || 'Destinatario').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Oficio_${cleanFolio}_${cleanDest}.pdf`;

  const opt = {
    margin: [0, 0, 0, 0],
    filename: filename,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#FFFFFF' },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    const pdfBlob: Blob = await new Promise((resolve, reject) => {
      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          resolve(pdf.output('blob'));
        })
        .catch(reject);
    });

    const blobUrl = URL.createObjectURL(pdfBlob);

    // Open directly in blob: URL tab
    if (win) {
      win.location.replace(blobUrl);
    } else {
      window.open(blobUrl, '_blank');
    }

    // Upload to Google Drive via Make Webhook
    let driveUrl: string | null = null;
    const webhookUrl = localStorage.getItem('esol_make_webhook_url') || '';
    if (webhookUrl && webhookUrl.includes('http')) {
      onDriveUploadStatus?.('uploading');
      driveUrl = await uploadOficioToDrive(pdfBlob, filename, oficio);
      if (driveUrl) {
        onDriveUploadStatus?.('success');
      }
    } else {
      onDriveUploadStatus?.('none');
    }

    return { blob: pdfBlob, blobUrl, filename, driveUrl };
  } catch (error) {
    if (win) win.close();
    console.error('Error generando PDF blob:', error);
    throw error;
  }
}
