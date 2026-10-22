// @ts-ignore
import html2pdf from 'html2pdf.js';
import type { VisitaTecnica } from './types';

// Convert image URL to Base64 to guarantee 0% CORS taint in html2canvas
async function resolvePhotoToBase64(rawUrl: string): Promise<string> {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl;
  }

  // Extract Drive ID if available
  const match = rawUrl.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
  const driveId = match ? match[1] : null;

  // Build target URL compatible with proxy.php (requires drive.google.com)
  let targetUrl = rawUrl;
  if (driveId) {
    const driveThumbnail = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
    targetUrl = `https://esolenergias.com/proxy.php?url=${encodeURIComponent(driveThumbnail)}`;
  } else if (rawUrl.includes('drive.google.com')) {
    targetUrl = `https://esolenergias.com/proxy.php?url=${encodeURIComponent(rawUrl)}`;
  }

  try {
    const resp = await fetch(targetUrl);
    if (!resp.ok) {
      console.warn('No se pudo descargar foto para PDF (HTTP ' + resp.status + '):', targetUrl);
      return '';
    }
    const blob = await resp.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Error convirtiendo imagen a Base64:', err);
    return '';
  }
}

// Convert institutional logo to Base64
async function getLogoBase64(): Promise<string> {
  try {
    const res = await fetch('/Logo_esol_b.png');
    if (!res.ok) return '';
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

export async function buildVisitaTecnicaHtml(visita: VisitaTecnica): Promise<string> {
  const folio = visita.folio || `ESOL-VT-${new Date().getFullYear()}-0001`;

  // Pre-process all assets into Base64 in parallel
  const [logoBase64, processedPhotos] = await Promise.all([
    getLogoBase64(),
    Promise.all(
      (visita.fotografias || []).map(async (f, idx) => {
        const b64 = await resolvePhotoToBase64(f.url || f.thumbnailUrl || '');
        return {
          ...f,
          resolvedSrc: b64,
          index: idx + 1
        };
      })
    )
  ]);

  // Format dates
  const formatMxDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
      return d.toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      }).toUpperCase();
    } catch {
      return dateStr;
    }
  };

  const fechaVisitaFormateada = formatMxDate(visita.fecha_visita);
  const fechaEmisionFormateada = formatMxDate(visita.fecha_expedicion || new Date().toISOString().split('T')[0]);

  // Render Puntos Clave
  const puntosClaveItemsHtml = (visita.puntos_clave && visita.puntos_clave.length > 0) ? `
    <div style="display:flex; flex-direction:column; gap:6px;">
      ${visita.puntos_clave.map((pt) => `
        <div style="background:var(--bg-2); padding:6px 8px; border-radius:4px; border-left:2.5px solid var(--gold);">
          <strong style="font-size:9.5px; color:var(--text-1); display:block; margin-bottom:2px; line-height:1.25; word-break:break-word;">${pt.titulo}</strong>
          ${pt.descripcion ? `<p style="font-size:9px; color:var(--text-2); margin:0; line-height:1.35; word-break:break-word;">${pt.descripcion}</p>` : ''}
        </div>
      `).join('')}
    </div>
  ` : `
    <div style="font-size:8.5px; color:var(--text-3); font-style:italic; padding:8px; text-align:center;">
      Sin hallazgos adicionales registrados.
    </div>
  `;

  // Render Parametros Tecnicos (en una sola columna, renglones subsecuentes)
  const params = visita.parametros_tecnicos;
  const paramItems = [
    params?.tipo_red ? { label: 'Acometida / Red', value: params.tipo_red, highlight: false } : null,
    params?.voltaje_medido ? { label: 'Voltaje Medido', value: params.voltaje_medido, highlight: false } : null,
    params?.capacidad_interruptor ? { label: 'Interruptor Pral.', value: params.capacidad_interruptor, highlight: false } : null,
    params?.tipo_techumbre ? { label: 'Tipo Techumbre', value: params.tipo_techumbre, highlight: false } : null,
    params?.area_disponible_m2 ? { label: 'Área Disponible', value: `${params.area_disponible_m2} m²`, highlight: true } : null,
    params?.tarifa_cfe ? { label: 'Tarifa CFE', value: params.tarifa_cfe, highlight: false } : null,
    visita.elaboro_nombre ? { label: 'Elaboró', value: visita.elaboro_nombre, highlight: false } : null,
    visita.tipo_visita ? { label: 'Tipo de Visita', value: visita.tipo_visita, highlight: false } : null,
    params?.condicion_techumbre ? { label: 'Estado de Sistema', value: params.condicion_techumbre, highlight: false } : null,
    params?.nivel_sombras ? { label: 'Nivel Sombras', value: params.nivel_sombras, highlight: false } : null
  ].filter(Boolean) as Array<{ label: string; value: string; highlight: boolean }>;

  const hasParams = paramItems.length > 0;

  // Render Evidencia Fotográfica (Sin deformaciones con object-fit contain y sin numero de imagen)
  const fotosHtml = processedPhotos.length > 0 ? `
    <div class="day-container">
      <div style="page-break-inside: avoid;">
        <div class="day-header">
          <span class="day-title">REGISTRO FOTOGRÁFICO DE EVIDENCIA EN SITIO</span>
        </div>
      </div>
      <div class="report-item">
        <div class="photo-grid" style="grid-template-columns: repeat(3, 1fr); gap: 8px;">
          ${processedPhotos.map(p => {
            if (p.resolvedSrc) {
              return `
                <div class="photo-box">
                  <img 
                    src="${p.resolvedSrc}" 
                    alt="Evidencia técnica"
                  />
                </div>
              `;
            } else {
              return `
                <div class="photo-box" style="flex-direction:column; gap:4px; padding:10px; text-align:center;">
                  <span style="font-size:24px;">📷</span>
                  <span style="font-size:8.5px; color:var(--text-3); font-weight:600;">(Expediente Drive)</span>
                </div>
              `;
            }
          }).join('')}
        </div>
      </div>
    </div>
  ` : '';

  // Signatures
  const firmaElaboroImg = visita.firma_elaboro 
    ? `<img src="${visita.firma_elaboro}" alt="Firma Elaboró" style="max-height: 42px; max-width: 120px; margin: 0 auto 3px auto; display: block;" />`
    : '';

  const firmaRecibeImg = visita.firma_recibe 
    ? `<img src="${visita.firma_recibe}" alt="Firma Recibió" style="max-height: 42px; max-width: 120px; margin: 0 auto 3px auto; display: block;" />`
    : '';

  return `
  <div class="visita-pdf-doc">
    <style>
      .visita-pdf-doc {
        --bg-page: #FFFFFF;
        --bg-1: #FFFFFF;
        --bg-2: #EFEFE8;
        --bg-3: #E5E4DB;
        --border-1: #D5D4C7;
        --border-2: #C4C3B4;
        --text-1: #141410;
        --text-2: #3A3A32;
        --text-3: #6A6A5E;
        --gold: #C49825;
        --gold-light: #D4AE3A;
        --gold-dim: #8B6C1A;
        --gold-muted: rgba(196,152,37,0.12);
        --success: #10B981;
        --danger: #EF4444;
        width: 800px;
        margin: 0 auto;
        padding: 0;
        background: #FFFFFF;
        color: var(--text-1);
        font-family: 'Josefin Sans', sans-serif;
        font-size: 11px;
        line-height: 1.45;
      }
      .visita-pdf-doc, .visita-pdf-doc * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .visita-pdf-doc h1, 
      .visita-pdf-doc h2, 
      .visita-pdf-doc h3, 
      .visita-pdf-doc h4 {
        font-family: 'Cinzel', serif;
      }
      .visita-pdf-doc .page {
        width: 800px;
        max-width: 100%;
        margin: 0 auto;
        background: #FFFFFF;
        display: flex;
        flex-direction: column;
      }
      .visita-pdf-doc .page-content {
        padding: 6mm 14mm 8mm 14mm;
        display: flex;
        flex-direction: column;
        background: #FFFFFF;
      }
      
      /* Compact, clean, symmetric Header with original logo aspect ratio */
      .visita-pdf-doc .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 2.5mm;
        border-bottom: 1.5px solid var(--border-2);
        margin-bottom: 3.5mm;
        gap: 12px;
      }
      .visita-pdf-doc .logo-container {
        height: 38px;
        width: auto;
        max-width: 130px;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      .visita-pdf-doc .logo-container img {
        height: 38px;
        width: auto;
        max-width: 100%;
        object-fit: contain;
        display: block;
      }
      .visita-pdf-doc .header-center {
        flex: 1;
        text-align: center;
        padding: 0 8px;
      }
      .visita-pdf-doc .header-center .meta-subtitle {
        font-size: 8px;
        color: var(--gold-dim);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 1px;
        display: block;
      }
      .visita-pdf-doc .header-center h1 {
        font-size: 15px;
        color: var(--text-1);
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin: 0;
        line-height: 1.1;
      }
      .visita-pdf-doc .header-center .header-tagline {
        font-size: 7.5px;
        color: var(--text-3);
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-top: 1px;
      }
      .visita-pdf-doc .header-meta-box {
        text-align: right;
        flex-shrink: 0;
        font-size: 9px;
        color: var(--text-2);
        line-height: 1.35;
      }
      .visita-pdf-doc .header-meta-box .folio-badge {
        font-family: 'Cinzel', serif;
        font-size: 10px;
        font-weight: 800;
        color: var(--gold-dim);
        background: var(--gold-muted);
        border: 1px solid rgba(196,152,37,0.3);
        border-radius: 4px;
        padding: 1.5px 6px;
        display: inline-block;
        margin-bottom: 2px;
        letter-spacing: 0.5px;
      }

      /* 2-Column Split: Cliente (58%) & Diagnóstico (42%) */
      .visita-pdf-doc .split-row {
        display: grid;
        grid-template-columns: 58% 42%;
        gap: 10px;
        margin-bottom: 3.5mm;
        page-break-inside: avoid;
        break-inside: avoid;
        align-items: stretch;
      }
      /* 2-Column Split: Puntos Clave (1/3 ~ 33%) & Alcance y Descripción (2/3 ~ 67%) */
      .visita-pdf-doc .inspection-split-row {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 10px;
        margin-bottom: 3.5mm;
        page-break-inside: avoid;
        break-inside: avoid;
        align-items: stretch;
      }
      .visita-pdf-doc .column-card {
        background: var(--bg-2);
        border: 1px solid var(--border-1);
        border-radius: 6px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
      }
      .visita-pdf-doc .column-header {
        font-family: 'Cinzel', serif;
        font-size: 9px;
        font-weight: 700;
        color: var(--gold-dim);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        padding-bottom: 3px;
        margin-bottom: 5px;
        border-bottom: 1px solid var(--border-2);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      /* Cliente side grid */
      .visita-pdf-doc .cliente-grid {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
        justify-content: center;
      }
      .visita-pdf-doc .info-row {
        background: white;
        border: 1px solid var(--border-1);
        border-left: 2.5px solid var(--gold-dim);
        border-radius: 3px;
        padding: 3.5px 7px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .visita-pdf-doc .info-row-label {
        font-size: 7.5px;
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .visita-pdf-doc .info-row-value {
        font-size: 9.5px;
        font-weight: 600;
        color: var(--text-1);
        text-align: right;
        line-height: 1.25;
        word-break: break-word;
      }

      /* Parámetros en una sola columna con renglones subsecuentes */
      .visita-pdf-doc .params-single-column {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
        justify-content: center;
      }
      .visita-pdf-doc .param-row {
        background: white;
        border: 1px solid var(--border-1);
        border-left: 2.5px solid var(--gold);
        border-radius: 3px;
        padding: 2.5px 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .visita-pdf-doc .param-row.highlight {
        border-left-color: var(--success);
      }
      .visita-pdf-doc .p-label {
        font-size: 7.5px;
        color: var(--text-3);
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.4px;
        white-space: nowrap;
      }
      .visita-pdf-doc .p-value {
        font-family: 'Cinzel', serif;
        font-size: 9.5px;
        font-weight: 700;
        color: var(--text-1);
        text-align: right;
        white-space: nowrap;
      }
      .visita-pdf-doc .params-empty {
        font-size: 9px;
        color: var(--text-3);
        font-style: italic;
        padding: 10px;
        text-align: center;
        margin: auto;
      }

      /* Sections & Bitácora style elements */
      .visita-pdf-doc .day-container {
        margin-bottom: 3.5mm;
      }
      .visita-pdf-doc .day-header {
        background: var(--text-1);
        color: var(--bg-1);
        padding: 4px 10px;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2.5mm;
        page-break-after: avoid;
        break-after: avoid;
      }
      .visita-pdf-doc .day-title {
        font-family: 'Cinzel', serif;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.8px;
      }
      .visita-pdf-doc .day-badge {
        background: var(--gold);
        color: var(--text-1);
        font-weight: 700;
        font-size: 7.5px;
        padding: 1px 6px;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .visita-pdf-doc .report-item {
        background: white;
        border: 1px solid var(--border-1);
        border-radius: 6px;
        padding: 8px 11px;
        margin-bottom: 6px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .visita-pdf-doc .report-desc {
        font-size: 10px;
        color: var(--text-2);
        line-height: 1.55;
      }

      /* Photos: Proportional, squared, no deformation */
      .visita-pdf-doc .photo-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .visita-pdf-doc .photo-box {
        width: 100%;
        height: 140px;
        background: #F1F3F5;
        border: 1px solid #C49825;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        page-break-inside: avoid;
        box-shadow: inset 0 0 0 1px rgba(196, 152, 37, 0.2);
      }
      .visita-pdf-doc .photo-box img {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        display: block;
      }

      .visita-pdf-doc .signatures-section {
        padding-top: 5mm;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .visita-pdf-doc .signatures-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 36px;
        max-width: 520px;
        margin: 0 auto;
      }
      .visita-pdf-doc .signature-box {
        text-align: center;
      }
      .visita-pdf-doc .sig-line {
        height: 1px;
        background: var(--text-1);
        margin-bottom: 4px;
      }
      .visita-pdf-doc .sig-name {
        font-family: 'Cinzel', serif;
        font-weight: 700;
        font-size: 9.5px;
        color: var(--text-1);
      }
      .visita-pdf-doc .sig-role {
        font-size: 7.5px;
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .visita-pdf-doc .footer {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-top: 4mm;
        border-top: 1px solid var(--border-2);
        padding-top: 2.5mm;
        display: flex;
        justify-content: space-between;
        font-size: 7.5px;
        color: var(--text-3);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      .visita-pdf-doc .footer .brand {
        color: var(--gold-dim);
      }
    </style>

    <div class="page" id="report-content">
      <div class="page-content">
        <!-- Compact, Symmetrical Header with properly proportioned logo -->
        <header class="header">
          <div class="logo-container">
            ${logoBase64 ? `<img src="${logoBase64}" alt="ESOL Energías" />` : '<div style="font-size:13px;font-weight:900;color:#C49825;">ESOL ENERGÍAS</div>'}
          </div>
          <div class="header-center">
            <span class="meta-subtitle">Reporte Oficial de Ingeniería</span>
            <h1>Visita Técnica</h1>
            <div class="header-tagline">Ingeniería, Levantamiento y Diagnóstico en Sitio</div>
          </div>
          <div class="header-meta-box">
            <div class="folio-badge">${folio}</div>
            <div><strong>VISITA:</strong> ${fechaVisitaFormateada}</div>
            <div><strong>EMISIÓN:</strong> ${fechaEmisionFormateada}</div>
          </div>
        </header>

        <!-- 2-Column Split: Datos del Cliente (58%) + Diagnóstico / Parámetros en Renglones (42%) -->
        <div class="split-row">
          <!-- Columna Izquierda: Datos del Cliente (más espacio) -->
          <div class="column-card">
            <div class="column-header">
              <span>Información General del Sitio</span>
              <span style="font-size:7.5px; color:var(--text-3); font-family:sans-serif; text-transform:none;">ID de Proyecto</span>
            </div>
            <div class="cliente-grid">
              <div class="info-row">
                <span class="info-row-label">Cliente / Solicitante</span>
                <span class="info-row-value">${visita.cliente_nombre || 'Cliente Independiente'}</span>
              </div>
              <div class="info-row">
                <span class="info-row-label">Sitio o Predio</span>
                <span class="info-row-value">${visita.sitio_nombre || 'No especificado'}</span>
              </div>
              <div class="info-row">
                <span class="info-row-label">Ubicación / Domicilio</span>
                <span class="info-row-value">${visita.ubicacion || 'No especificada'}</span>
              </div>
              ${visita.es_obra_existente && visita.obra_nombre ? `
              <div class="info-row">
                <span class="info-row-label">Obra Vinculada</span>
                <span class="info-row-value">${visita.obra_nombre}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-row-label">Atendió en Sitio</span>
                <span class="info-row-value">${visita.recibe_nombre} ${visita.recibe_cargo ? `(${visita.recibe_cargo})` : ''}</span>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Parámetros Técnicos y Diagnóstico de Sitio en una sola columna con renglones subsecuentes -->
          <div class="column-card">
            <div class="column-header">
              <span>Parámetros & Diagnóstico</span>
              <span style="font-size:7.5px; color:var(--gold-dim); font-family:sans-serif; text-transform:uppercase;">Técnico</span>
            </div>
            ${hasParams ? `
              <div class="params-single-column">
                ${paramItems.map(p => `
                  <div class="param-row ${p.highlight ? 'highlight' : ''}">
                    <span class="p-label">${p.label}</span>
                    <span class="p-value">${p.value}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="params-empty">
                Sin parámetros técnicos levantados en sitio.
              </div>
            `}
          </div>
        </div>

        <!-- Fila Dividida: Puntos Clave (1/3) + Alcance y Descripción (2/3) -->
        <div class="inspection-split-row">
          <!-- Columna Izquierda (1/3): Puntos Clave y Hallazgos Técnicos -->
          <div class="day-container" style="margin-bottom:0; display:flex; flex-direction:column;">
            <div style="page-break-inside: avoid;">
              <div class="day-header" style="margin-bottom:4px;">
                <span class="day-title" style="font-size:8.5px;">PUNTOS CLAVE Y HALLAZGOS</span>
              </div>
            </div>
            <div class="report-item" style="flex:1; margin-bottom:0;">
              ${puntosClaveItemsHtml}
            </div>
          </div>

          <!-- Columna Derecha (2/3): Alcance y Descripción de la Inspección Técnica -->
          <div class="day-container" style="margin-bottom:0; display:flex; flex-direction:column;">
            <div style="page-break-inside: avoid;">
              <div class="day-header" style="margin-bottom:4px;">
                <span class="day-title" style="font-size:8.5px;">ALCANCE Y DESCRIPCIÓN DE LA INSPECCIÓN TÉCNICA</span>
              </div>
            </div>
            <div class="report-item" style="flex:1; margin-bottom:0;">
              <div class="report-desc">
                ${(visita.descripcion || 'Sin descripción detallada.').replace(/\n/g, '<br/>')}
              </div>
              ${(visita.recomendaciones || visita.siguientes_pasos) ? `
                <div style="margin-top:7px; padding-top:6px; border-top:1px dashed var(--border-2); display:flex; flex-direction:column; gap:6px;">
                  ${visita.recomendaciones ? `
                    <div style="background:var(--bg-2); border-left:2.5px solid var(--border-2); padding:5px 8px; border-radius:3px;">
                      <strong style="font-size:8.5px; color:var(--gold-dim); display:block; margin-bottom:2px; letter-spacing:0.5px; text-transform:uppercase;">Recomendaciones Técnicas:</strong>
                      <p style="font-size:9px; color:var(--text-2); margin:0; line-height:1.4;">${visita.recomendaciones.replace(/\n/g, '<br/>')}</p>
                    </div>
                  ` : ''}
                  ${visita.siguientes_pasos ? `
                    <div style="background:rgba(196,152,37,0.08); border:1px solid rgba(196,152,37,0.35); border-left:3.5px solid var(--gold); padding:7px 10px; border-radius:4px;">
                      <div style="margin-bottom:3px;">
                        <span style="font-family:'Cinzel',serif; font-size:9.5px; font-weight:700; color:var(--gold-dim); letter-spacing:0.8px; text-transform:uppercase;">
                          Siguientes Pasos / Acciones
                        </span>
                      </div>
                      <p style="font-size:11.5px; font-weight:400; color:var(--text-1); margin:0; line-height:1.45;">${visita.siguientes_pasos.replace(/\n/g, '<br/>')}</p>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Evidencias Fotográficas -->
        ${fotosHtml}

        <!-- Firmas Oficiales de Bitácora -->
        <div class="signatures-section">
          <div class="signatures-grid">
            <div class="signature-box">
              ${firmaElaboroImg}
              <div class="sig-line"></div>
              <div class="sig-name">${visita.elaboro_nombre}</div>
              <div class="sig-role">${visita.elaboro_cargo || 'ESOL ENERGÍAS (ELABORÓ)'}</div>
            </div>
            <div class="signature-box">
              ${firmaRecibeImg}
              <div class="sig-line"></div>
              <div class="sig-name">${visita.recibe_nombre || 'Cliente / Atendió'}</div>
              <div class="sig-role">${visita.recibe_cargo || 'CLIENTE / SUPERVISIÓN (RECIBIÓ)'}</div>
              ${visita.recibe_telefono ? `<div style="font-size:7.5px; color:var(--text-3); margin-top:1px;">${visita.recibe_telefono}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Footer Oficial -->
        <div class="footer">
          <div><span class="brand">ESOL ENERGÍAS</span> | SISTEMA DE REPORTE Y LEVANTAMIENTO TÉCNICO</div>
          <div>FOLIO: ${folio} • EMISIÓN: ${fechaEmisionFormateada}</div>
        </div>
      </div>
    </div>
  </div>`;
}

// Generate real PDF Blob
export async function generateVisitaTecnicaPdfBlob(visita: VisitaTecnica): Promise<Blob> {
  const folio = visita.folio || `ESOL-VT-${new Date().getFullYear()}-0001`;
  const cleanFolio = folio.replace(/[/\\?%*:|"<>]/g, '_');
  const cleanSitio = (visita.sitio_nombre || 'Sitio').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Visita_Tecnica_${cleanFolio}_${cleanSitio}.pdf`;

  const html = await buildVisitaTecnicaHtml(visita);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '800px';
  container.style.zIndex = '-99999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.innerHTML = html;
  document.body.appendChild(container);

  const renderElement = container.querySelector('.visita-pdf-doc') as HTMLElement || container;

  const opt = {
    margin:       0,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true, 
      allowTaint: false,
      backgroundColor: '#FFFFFF',
      logging: false,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' },
    pagebreak:    { 
      mode: ['avoid-all', 'css', 'legacy'],
      avoid: ['.photo-box', '.signatures-section', '.split-row', '.inspection-split-row', '.day-container']
    }
  };

  try {
    const pdfBlob: Blob = await new Promise((resolve, reject) => {
      html2pdf()
        .set(opt)
        .from(renderElement)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(7.5);
            pdf.setTextColor(106, 106, 94);
            pdf.text(`Página ${i} de ${totalPages}`, 215.9 - 16, 279.4 - 5, { align: 'right' });
            pdf.text(`FOLIO: ${folio}`, 16, 279.4 - 5);
          }
        })
        .outputPdf('blob')
        .then((blob: Blob) => resolve(blob))
        .catch(reject);
    });

    return pdfBlob;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export const generateVisitaTecnicaPdf = async (visita: VisitaTecnica) => {
  const folio = visita.folio || `ESOL-VT-${new Date().getFullYear()}-0001`;
  const cleanFolio = folio.replace(/[/\\?%*:|"<>]/g, '_');
  const cleanSitio = (visita.sitio_nombre || 'Sitio').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `Visita_Tecnica_${cleanFolio}_${cleanSitio}.pdf`;

  let win: Window | null = null;
  try {
    win = window.open('', '_blank');
    if (win) {
      win.document.title = `Generando PDF | ${folio}`;
      win.document.body.style.margin = '0';
      win.document.body.style.background = '#0F172A';
      win.document.body.style.fontFamily = "'Josefin Sans', sans-serif";
      win.document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#F8F7F2;text-align:center;padding:24px;box-sizing:border-box;">
          <div style="width:44px;height:44px;border:3px solid rgba(196,152,37,0.2);border-top:3px solid #C49825;border-radius:50%;animation:esolSpin 1s linear infinite;margin-bottom:16px;"></div>
          <style>@keyframes esolSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
          <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#C49825;text-transform:uppercase;margin-bottom:4px;">ESOL ENERGÍAS</div>
          <h2 style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;margin:0 0 8px 0;letter-spacing:1px;">Generando Reporte Oficial</h2>
          <p style="font-size:12px;color:#94A3B8;max-width:440px;line-height:1.5;margin:0 0 8px 0;">
            Compilando dictamen técnico y evidencias fotográficas para <strong>${folio}</strong>.
          </p>
          <span style="font-size:11px;color:#64748B;">El documento se abrirá automáticamente en este visor...</span>
        </div>
      `;
    }
  } catch (winErr) {
    console.warn('No se pudo abrir ventana previa:', winErr);
  }

  try {
    const pdfBlob = await generateVisitaTecnicaPdfBlob(visita);
    const blobUrl = URL.createObjectURL(pdfBlob);

    if (win && !win.closed) {
      win.location.href = blobUrl;
    } else {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (err) {
    console.error('Error generando PDF de Visita Técnica:', err);
    if (win && !win.closed) {
      win.document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0F172A;color:#F87171;font-family:sans-serif;text-align:center;padding:24px;">
          <h2 style="margin:0 0 10px 0;font-size:18px;">No se pudo generar el PDF</h2>
          <p style="color:#94A3B8;margin:0 0 20px 0;max-width:400px;font-size:12px;line-height:1.5;">
            Ocurrió un inconveniente al compilar el documento. Puedes cerrarlo e intentar nuevamente.
          </p>
          <button onclick="window.close()" style="background:#334155;color:#F8FAFC;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:11px;">Cerrar esta pestaña</button>
        </div>
      `;
    }
    alert('Hubo un error al generar el PDF de Visita Técnica. Revisa la consola.');
  }
};
