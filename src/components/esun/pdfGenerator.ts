import type { Bitacora, ObraApp } from './types';

export const generateObraReport = (obra: ObraApp, bitacoras: Bitacora[], reporterName: string, includeFinancial: boolean = true) => {
    if (reporterName.toLowerCase().includes('menyfre') || reporterName.toLowerCase().includes('meny')) {
        reporterName = 'Manuel Fregoso';
    }
    const obraBitacoras = bitacoras.filter(b => b.site_name === obra.nombre);
    
    // Agrupar bitacoras por fecha
    const byDate: Record<string, Bitacora[]> = {};
    obraBitacoras.forEach(b => {
      if (!byDate[b.date]) byDate[b.date] = [];
      byDate[b.date].push(b);
    });
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    const totalBudget = obraBitacoras.reduce((s, b) => s + (b.budget_estimate || 0), 0);
    const totalExecuted = obraBitacoras.reduce((s, b) => s + (b.financial_progress || 0), 0);
    const avgProgress = obraBitacoras.length
      ? obraBitacoras.reduce((s, b) => s + (b.physical_progress || 0), 0) / obraBitacoras.length
      : 0;
    const folio = `ESOL-BIT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
    const fechaEmision = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

    const weatherIcon = (w: string) => {
      const lw = w.toLowerCase();
      if (lw.includes('sol') || lw.includes('despej') || lw.includes('clear')) return '☀️';
      if (lw.includes('nub') || lw.includes('cloud') || lw.includes('parcial')) return '⛅';
      if (lw.includes('lluv') || lw.includes('rain')) return '🌧️';
      return '🌤️';
    };

    // Resolve Drive image to printable URL
    const resolveImg = (uri: string): string => {
      if (!uri) return '';
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /[?&]id=([a-zA-Z0-9_-]+)/,
        /\/open\?id=([a-zA-Z0-9_-]+)/
      ];
      for (const p of patterns) {
        const m = uri.match(p);
        if (m && m[1]) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`;
      }
      return uri;
    };

    const dayRows = dates.map(date => {
      const items = byDate[date];
      const parsedDate = new Date(date + 'T12:00:00');
      const dayLabel = parsedDate.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

      const eventCards = items.map(bit => {
        const imgUrl = bit.photo_uri ? resolveImg(bit.photo_uri) : '';
        const photoHtml = imgUrl ? `
          <div class="photo-grid">
            <div class="photo-box">
              <img src="${imgUrl}" alt="Evidencia de obra"
                style="width:100%;height:100%;object-fit:contain;"
                crossorigin="anonymous"
                onerror="this.onerror=null; this.src='${bit.photo_uri}'; this.style.display='none'; setTimeout(() => { this.style.display='block'; }, 1000);"
              />
            </div>
          </div>` : '';
        return `
        <div class="report-item">
          <div class="report-top">
            <div class="report-time">
              ${bit.date} <span>• ${bit.site_name}</span>
            </div>
            <div class="meta-badges">
              <div class="badge">${weatherIcon(bit.weather)} ${bit.weather}</div>
              <div class="badge">👷 Cuadrilla: ${bit.crew_count} pax</div>
              ${bit.physical_progress ? `<div class="badge">Avance: ${bit.physical_progress}%</div>` : ''}
            </div>
          </div>
          ${bit.concepto ? `<div class="concept-ref">${bit.concepto}</div>` : ''}
          <div class="report-desc">${bit.description.replace(/\n/g, '<br>')}</div>
          ${photoHtml}
        </div>`;
      }).join('');

      return `
        <div class="day-container">
          <div class="day-header">
            <span class="day-title">${dayLabel}</span>
            <span class="day-badge">${items.length} EVENTO${items.length !== 1 ? 'S' : ''}</span>
          </div>
          ${eventCards}
        </div>`;
    }).join('');

    const financialSection = includeFinancial ? `
      <h2 class="section-title">Control de Gestión</h2>
      <div class="finance-grid">
        <div class="finance-card">
          <div class="f-label">Avance Físico Prom.</div>
          <div class="f-value">${avgProgress.toFixed(1)}%</div>
        </div>
        <div class="finance-card">
          <div class="f-label">Presupuesto Estimado</div>
          <div class="f-value">$${totalBudget.toLocaleString('es-MX')}</div>
        </div>
        <div class="finance-card success">
          <div class="f-label">Gasto Devengado</div>
          <div class="f-value">$${totalExecuted.toLocaleString('es-MX')}</div>
        </div>
        <div class="finance-card warning">
          <div class="f-label">Remanente Total</div>
          <div class="f-value">$${(totalBudget - totalExecuted).toLocaleString('es-MX')}</div>
        </div>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte Bitácora – ${obra.nombre}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Josefin+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-1:#F8F7F2;--bg-2:#EFEFE8;--bg-3:#E5E4DB;
      --border-1:#D5D4C7;--border-2:#C4C3B4;
      --text-1:#141410;--text-2:#3A3A32;--text-3:#6A6A5E;
      --gold:#C49825;--gold-light:#D4AE3A;--gold-dim:#8B6C1A;
      --gold-muted:rgba(196,152,37,0.12);
      --success:#10B981;--danger:#EF4444;
    }
    *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
    body{background:#333;display:flex;flex-direction:column;align-items:center;padding:2rem;
      color:var(--text-1);font-family:'Josefin Sans',sans-serif;font-size:11px;line-height:1.5;}
    h1,h2,h3,h4{font-family:'Cinzel',serif;}
    .page{width:800px;min-height:1035px;max-width:100%;margin:0 auto;background:var(--bg-1);
      box-shadow:0 20px 25px -5px rgba(0,0,0,.1);display:flex;flex-direction:column;}
    .page-content{padding:15mm 20mm;flex:1;display:flex;flex-direction:column;}
    @page{size:letter;margin:0;}
    @media print{body{background:none;padding:0;}.page{box-shadow:none;margin:0;}.no-print{display:none!important;}}
    .header{display:flex;justify-content:space-between;align-items:center;
      padding-bottom:4mm;border-bottom:1px solid var(--border-2);margin-bottom:6mm;}
    .logo-container{width:130px;}
    .logo-container img{width:100%;height:auto;object-fit:contain;}
    .report-meta{text-align:right;}
    .report-meta h1{font-size:20px;color:var(--text-1);font-weight:700;letter-spacing:1px;text-transform:uppercase;}
    .report-meta .meta-subtitle{font-size:10px;color:var(--gold);font-weight:600;text-transform:uppercase;
      letter-spacing:2px;margin-bottom:4px;display:block;}
    .report-meta p{font-size:10px;color:var(--text-2);margin-bottom:1px;}
    .reporter-badge{display:inline-block;background:var(--gold-muted);border:1px solid rgba(196,152,37,0.3);
      border-radius:4px;padding:3px 8px;font-size:9px;color:var(--gold-dim);font-weight:700;margin-top:4px;letter-spacing:.5px;}
    .project-card{background:var(--bg-2);border:1px solid var(--border-1);border-radius:8px;
      padding:12px 16px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;
      margin-bottom:8mm;box-shadow:inset 0 1px 0 rgba(255,255,255,0.4);}
    .info-group{display:flex;flex-direction:column;}
    .info-label{font-size:8px;color:var(--text-3);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:2px;}
    .info-value{font-size:12px;font-weight:600;color:var(--text-1);}
    .section-title{font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:var(--text-1);
      margin-bottom:4mm;display:flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:1px;}
    .section-title::after{content:'';flex:1;height:1px;background:linear-gradient(to right,var(--gold),transparent);}
    .finance-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8mm;}
    .finance-card{background:white;border:1px solid var(--border-1);border-radius:6px;padding:10px 12px;
      position:relative;overflow:hidden;}
    .finance-card::before{content:'';position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--gold);}
    .finance-card.success::before{background:var(--success);}
    .finance-card.warning::before{background:var(--gold-light);}
    .f-label{font-size:8px;color:var(--text-3);text-transform:uppercase;font-weight:700;letter-spacing:.5px;}
    .f-value{font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:var(--text-1);margin-top:4px;}
    .day-container{margin-bottom:8mm;}
    .day-header{background:var(--text-1);color:var(--bg-1);padding:6px 12px;border-radius:4px;
      display:flex;justify-content:space-between;align-items:center;margin-bottom:4mm;}
    .day-title{font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:1px;}
    .day-badge{background:var(--gold);color:var(--text-1);font-weight:700;font-size:9px;
      padding:2px 8px;border-radius:12px;text-transform:uppercase;letter-spacing:.5px;}
    .report-item{background:white;border:1px solid var(--border-1);border-radius:6px;
      padding:12px;margin-bottom:12px;}
    .report-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;
      padding-bottom:6px;border-bottom:1px dashed var(--border-2);}
    .report-time{font-size:12px;font-weight:700;color:var(--text-1);display:flex;align-items:center;gap:6px;}
    .report-time span{color:var(--gold-dim);font-size:11px;}
    .meta-badges{display:flex;gap:8px;flex-wrap:wrap;}
    .badge{background:var(--bg-2);border:1px solid var(--border-1);color:var(--text-2);
      font-size:9px;padding:2px 6px;border-radius:4px;font-weight:600;}
    .concept-ref{display:inline-block;background:var(--gold-muted);color:var(--gold-dim);
      padding:3px 8px;border-radius:4px;font-size:9px;font-weight:700;margin-bottom:8px;letter-spacing:.5px;}
    .report-desc{font-size:11px;color:var(--text-2);line-height:1.6;margin-bottom:10px;}
    .photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px;}
    .photo-box{width:100%;height:110px;background:var(--bg-3);border:1px solid var(--border-1);
      border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;}
    .photo-placeholder{font-size:9px;color:var(--text-3);text-align:center;font-style:italic;padding:8px;}
    .signatures-section{margin-top:auto;padding-top:10mm;page-break-inside:avoid;}
    .signatures-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:30px;}
    .signature-box{text-align:center;}
    .sig-line{height:1px;background:var(--text-1);margin-bottom:6px;}
    .sig-name{font-family:'Cinzel',serif;font-weight:700;font-size:11px;color:var(--text-1);}
    .sig-role{font-size:9px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;}
    .footer{margin-top:10mm;border-top:1px solid var(--border-2);padding-top:4mm;
      display:flex;justify-content:space-between;font-size:8px;color:var(--text-3);
      font-weight:600;text-transform:uppercase;letter-spacing:1px;}
    .footer .brand{color:var(--gold-dim);}
    .print-btn{position:fixed;bottom:2rem;right:2rem;background:var(--gold);color:#fff;
      border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;
      cursor:pointer;font-family:'Josefin Sans',sans-serif;box-shadow:0 4px 15px rgba(0,0,0,.3);z-index:999;}
    .print-btn:hover{background:var(--gold-light);}
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <button class="print-btn no-print" onclick="downloadPDF()">💾 Descargar PDF</button>
  <div class="page" id="report-content">
    <div class="page-content">
      <header class="header">
        <div class="logo-container">
          <img src="${window.location.origin}/Logo_esol_b.png" alt="ESOL Energías"
            crossorigin="anonymous"
            onerror="this.style.display='none'">
        </div>
        <div class="report-meta">
          <span class="meta-subtitle">Reporte Oficial</span>
          <h1>Bitácora de Obra</h1>
          <p><strong>FOLIO:</strong> ${folio}</p>
          <p><strong>FECHA DE EMISIÓN:</strong> ${fechaEmision}</p>
          <div class="reporter-badge">REPORTADO POR: ${reporterName.toUpperCase()}</div>
        </div>
      </header>
      <div class="project-card">
        <div class="info-group">
          <span class="info-label">Nombre del Proyecto</span>
          <span class="info-value">${obra.nombre}</span>
        </div>
        <div class="info-group">
          <span class="info-label">Ubicación</span>
          <span class="info-value">${obra.ubicacion || 'No especificada'}</span>
        </div>
        <div class="info-group">
          <span class="info-label">Cliente</span>
          <span class="info-value">${obra.cliente || 'ESOL Energías'}</span>
        </div>
        <div class="info-group">
          <span class="info-label">Estado Actual</span>
          <span class="info-value" style="color:var(--success)">${obra.status}</span>
        </div>
      </div>
      ${financialSection}
      <h2 class="section-title">Registros Operativos</h2>
      ${dates.length === 0
        ? '<p style="color:var(--text-3);font-size:12px;">No hay registros de bitácora para esta obra.</p>'
        : dayRows
      }
      <div class="signatures-section">
        <h2 class="section-title">Validación Técnica y Aprobación</h2>
        <div class="signatures-grid">
          <div class="signature-box">
            <div class="sig-line"></div>
            <div class="sig-name">${reporterName.toUpperCase()}</div>
            <div class="sig-role">RESIDENTE DE OBRA ESOL (ELABORÓ)</div>
          </div>
          <div class="signature-box">
            <div class="sig-line"></div>
            <div class="sig-name">SUPERVISIÓN / CLIENTE</div>
            <div class="sig-role">REVISÓ</div>
          </div>
        </div>
      </div>
      <div class="footer">
        <div><span class="brand">ESOL ENERGÍAS</span> | SISTEMA DE BITÁCORA ELECTRÓNICA</div>
        <div>GENERADO: ${fechaEmision}</div>
      </div>
    </div>
  </div>
  <script>
    function downloadPDF() {
      const element = document.getElementById('report-content');
      const btn = document.querySelector('.print-btn');
      btn.style.display = 'none';
      
      const origMargin = element.style.margin;
      element.style.margin = '0';
      
      const opt = {
        margin:       0,
        filename:     'Reporte_Bitacora_${obra.nombre.replace(/\\s+/g, '_')}.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      window.scrollTo(0, 0);
      html2pdf().set(opt).from(element).save().then(() => {
        element.style.margin = origMargin;
        btn.style.display = 'block';
      }).catch(err => {
        element.style.margin = origMargin;
        console.error(err);
        btn.style.display = 'block';
        alert('Hubo un error al generar el PDF. Por favor intenta de nuevo.');
      });
    }
  </script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };
