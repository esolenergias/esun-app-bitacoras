const fs = require('fs');

let c = fs.readFileSync('src/components/esun/pdfGenerator.ts', 'utf8');

const searchRegex = /const eventCards = items\.map\(bit => \{[\s\S]*?\}\)\.join\(''\);\s*return `\s*<div class="day-container">\s*<div class="day-header">\s*<span class="day-title">\$\{dayLabel\}<\/span>\s*<span class="day-badge">\$\{items\.length\} EVENTO\$\{items\.length !== 1 \? 'S' : ''\}<\/span>\s*<\/div>\s*\$\{eventCards\}\s*<\/div>`;/m;

const replacement = `const eventHtmls = items.map(bit => {
        const uris = bit.photo_uri ? bit.photo_uri.split(',').map(u => u.trim()).filter(Boolean) : [];
        const photoHtml = uris.length > 0 ? \`
          <div class="photo-grid">
            \${uris.map(uri => {
              const imgUrl = resolveImg(uri);
              return \`
              <div class="photo-box">
                <img src="\${imgUrl}" alt="Evidencia de obra"
                  style="width:100%;height:100%;object-fit:contain;"
                  crossorigin="anonymous"
                  onerror="this.onerror=null; this.src='\${uri}'; this.style.display='none'; setTimeout(() => { this.style.display='block'; }, 1000);"
                />
              </div>\`;
            }).join('')}
          </div>\` : '';
        return \`
        <div class="report-item">
          <div class="report-top">
            <div class="report-time">
              \${bit.date} <span>• \${bit.site_name}</span>
            </div>
            <div class="meta-badges">
              <div class="badge">\${weatherIcon(bit.weather)} \${bit.weather}</div>
              <div class="badge">👷 Cuadrilla: \${bit.crew_count} pax</div>
              \${bit.physical_progress ? \`<div class="badge">Avance: \${bit.physical_progress}%</div>\` : ''}
            </div>
          </div>
          \${bit.concepto ? \`<div class="concept-ref">\${bit.concepto}</div>\` : ''}
          <div class="report-desc">\${(bit.description.charAt(0).toUpperCase() + bit.description.slice(1)).replace(/\\n/g, '<br>')}</div>
          \${photoHtml}
        </div>\`;
      });

      const firstEvent = eventHtmls[0] || '';
      const restEvents = eventHtmls.slice(1).join('');

      return \`
        <div class="day-container">
          <div style="page-break-inside: avoid;">
            <div class="day-header">
              <span class="day-title">\${dayLabel}</span>
              <span class="day-badge">\${items.length} EVENTO\${items.length !== 1 ? 'S' : ''}</span>
            </div>
            \${firstEvent}
          </div>
          \${restEvents}
        </div>\`;`;

if (searchRegex.test(c)) {
  c = c.replace(searchRegex, replacement);
  fs.writeFileSync('src/components/esun/pdfGenerator.ts', c);
  console.log("Successfully fixed the page break logic!");
} else {
  console.log("Regex didn't match.");
  process.exit(1);
}
