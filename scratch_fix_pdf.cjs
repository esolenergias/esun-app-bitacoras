const fs = require('fs');

const path = 'src/components/esun/pdfGenerator.ts';
let content = fs.readFileSync(path, 'utf8');

const splitIndex = content.indexOf('    const html = `<!DOCTYPE html>');
if (splitIndex === -1) {
  console.log("Could not find const html =");
  process.exit(1);
}

const beforeHtml = content.substring(0, splitIndex);

const newEnd = `    const contentHtml = \`
      <div class="page-content" style="background:#fff; padding:15mm; color:var(--text-1); min-height:100vh;">
        <header class="header">
          <div class="logo-container">
            <img src="\${window.location.origin}/Logo_esol_b.png" alt="ESOL Energías" crossorigin="anonymous" onerror="this.style.display='none'">
          </div>
          <div class="report-meta">
            <span class="meta-subtitle">Reporte Oficial</span>
            <h1>Bitácora de Obra</h1>
            <p><strong>FOLIO:</strong> \${folio}</p>
            <p><strong>FECHA DE EMISIÓN:</strong> \${fechaEmision}</p>
            <div class="reporter-badge">REPORTADO POR: \${reporterName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</div>
          </div>
        </header>
        <div class="project-card">
          <div class="info-group">
            <span class="info-label">Nombre del Proyecto</span>
            <span class="info-value">\${obra.nombre}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Ubicación</span>
            <span class="info-value">\${obra.ubicacion || 'No especificada'}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Cliente</span>
            <span class="info-value">\${obra.cliente || 'ESOL Energías'}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Estado Actual</span>
            <span class="info-value" style="color:var(--success)">\${obra.status}</span>
          </div>
        </div>
        \${financialSection}
        <h2 class="section-title">Registros Operativos</h2>
        \${dates.length === 0
          ? '<p style="color:var(--text-3);font-size:12px;">No hay registros de bitácora para esta obra.</p>'
          : dayRows
        }
        <div class="signatures-section">
          <h2 class="section-title">Validación Técnica y Aprobación</h2>
          <div class="signatures-grid">
            <div class="signature-box">
              <div class="sig-line"></div>
              <div class="sig-name" style="font-weight: 500; color: var(--text-3);">\${reporterName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</div>
              <div class="sig-role">RESIDENTE DE OBRA ESOL (ELABORÓ)</div>
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <div class="sig-name" style="font-weight: 500; color: var(--text-3);">Supervisión / Cliente</div>
              <div class="sig-role">REVISÓ</div>
            </div>
          </div>
        </div>
        <div class="footer">
          <div><span class="brand">ESOL ENERGÍAS</span> | SISTEMA DE BITÁCORA ELECTRÓNICA</div>
          <div>GENERADO: \${fechaEmision}</div>
        </div>
      </div>
    \`;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '8.5in'; 
    container.innerHTML = \`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Josefin+Sans:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pdf-container {
          font-family: 'Josefin Sans', sans-serif;
          --bg-1: #ffffff; --bg-2: #f8f9fa; --bg-3: #f1f3f5;
          --text-1: #1a1a1a; --text-2: #495057; --text-3: #868e96;
          --gold: #c5a880; --gold-light: #e6d5b8; --gold-dim: #a3875f;
          --gold-muted: rgba(197, 168, 128, 0.1);
          --border-1: #e9ecef; --border-2: #dee2e6;
          --success: #2b8a3e; --info: #1c7ed6;
        }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm; padding-bottom: 6mm; border-bottom: 2px solid var(--gold); }
        .logo-container { width: 160px; }
        .logo-container img { width: 100%; height: auto; }
        .report-meta { text-align: right; }
        .meta-subtitle { font-family: 'Cinzel', serif; color: var(--gold); font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
        .report-meta h1 { font-family: 'Cinzel', serif; font-size: 24px; color: var(--text-1); margin: 4px 0 8px; font-weight: 700; letter-spacing: 1px; }
        .report-meta p { font-size: 10px; color: var(--text-2); margin-bottom: 3px; font-weight: 600; }
        .reporter-badge { display: inline-block; background: var(--gold-muted); color: var(--gold-dim); padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 700; margin-top: 6px; letter-spacing: .5px; }
        .project-card { background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 12px 16px; margin-bottom: 8mm; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .info-group { display: flex; flex-direction: column; gap: 4px; }
        .info-label { font-size: 8px; color: var(--text-3); text-transform: uppercase; font-weight: 700; letter-spacing: .5px; }
        .info-value { font-size: 11px; font-weight: 600; color: var(--text-1); line-height: 1.4; }
        .section-title { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: var(--text-1); margin: 6mm 0 4mm; display: flex; align-items: center; gap: 10px; }
        .section-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(to right, var(--gold), transparent); }
        .finance-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8mm; }
        .finance-card { background: white; border: 1px solid var(--border-1); border-radius: 6px; padding: 10px 12px; position: relative; overflow: hidden; }
        .finance-card::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 3px; background: var(--gold); }
        .finance-card.success::before { background: var(--success); }
        .finance-card.warning::before { background: var(--gold-light); }
        .f-label { font-size: 8px; color: var(--text-3); text-transform: uppercase; font-weight: 700; letter-spacing: .5px; }
        .f-value { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700; color: var(--text-1); margin-top: 4px; }
        .day-container { margin-bottom: 8mm; }
        .day-header { background: var(--text-1); color: var(--bg-1); padding: 6px 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; }
        .day-title { font-family: 'Cinzel', serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; }
        .day-badge { background: var(--gold); color: var(--text-1); font-weight: 700; font-size: 9px; padding: 2px 8px; border-radius: 12px; text-transform: uppercase; letter-spacing: .5px; }
        .report-item { background: white; border: 1px solid var(--border-1); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
        .report-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed var(--border-2); }
        .report-time { font-size: 12px; font-weight: 700; color: var(--text-1); display: flex; align-items: center; gap: 6px; }
        .report-time span { color: var(--gold-dim); font-size: 11px; }
        .meta-badges { display: flex; gap: 8px; flex-wrap: wrap; }
        .badge { background: var(--bg-2); border: 1px solid var(--border-1); color: var(--text-2); font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .concept-ref { display: inline-block; background: var(--gold-muted); color: var(--gold-dim); padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; margin-bottom: 8px; letter-spacing: .5px; }
        .report-desc { font-size: 12px; color: var(--text-2); line-height: 1.8; margin-bottom: 12px; }
        .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 8px; }
        .photo-box { width: 100%; height: 160px; background: var(--bg-3); border: 1px solid var(--border-1); border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .photo-placeholder { font-size: 9px; color: var(--text-3); text-align: center; font-style: italic; padding: 8px; }
        .signatures-section { margin-top: 20mm; page-break-inside: avoid; }
        .signatures-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; max-width: 600px; margin: 0 auto; }
        .signature-box { text-align: center; }
        .sig-line { height: 1px; background: var(--text-1); margin-bottom: 6px; }
        .sig-name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 11px; color: var(--text-1); }
        .sig-role { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: .5px; }
        .footer { margin-top: 10mm; border-top: 1px solid var(--border-2); padding-top: 4mm; display: flex; justify-content: space-between; font-size: 8px; color: var(--text-3); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .footer .brand { color: var(--gold-dim); }
        .html2pdf__page-break { page-break-before: always; }
      </style>
      <div class="pdf-container">
        \${contentHtml}
      </div>
    \`;

    document.body.appendChild(container);

    const opt = {
      margin:       0,
      filename:     \`Reporte_Bitacora_\${obra.nombre.replace(/\\s+/g, '_')}.pdf\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).output('blob').then((pdfBlob) => {
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      document.body.removeChild(container);
    }).catch((err) => {
      console.error(err);
      alert('Hubo un error al generar el PDF. Revisa la consola.');
      document.body.removeChild(container);
    });
  };
`;

fs.writeFileSync(path, beforeHtml + newEnd);
console.log("Success!");
