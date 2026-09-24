const fs = require('fs');
const file = 'src/components/Portal.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

let landingStart = -1;
let tiendaStart = -1;
let configStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('LANDING PAGE ACCORDION')) landingStart = i;
  if (lines[i].includes('TIENDA ACCORDION')) tiendaStart = i;
  if (lines[i].includes('CONFIGURACION ACCORDION')) configStart = i;
}

// For landing: find "Lighthouse & SEO", then find the next "</div>"
let landingClose = -1;
for (let i = landingStart; i < tiendaStart; i++) {
  if (lines[i].includes('Lighthouse & SEO')) {
    for (let j = i; j < tiendaStart; j++) {
      if (lines[j].trim() === '</div>' && lines[j-1].trim() === ')}') {
        landingClose = j;
        break;
      }
    }
    break;
  }
}

// For config: find "Ajustes Generales", then find the next "</div>"
let configClose = -1;
for (let i = configStart; i < lines.length; i++) {
  if (lines[i].includes('Ajustes Generales')) {
    for (let j = i; j < lines.length; j++) {
      if (lines[j].trim() === '</div>' && lines[j-1].trim() === ')}') {
        configClose = j;
        break;
      }
    }
    break;
  }
}

console.log({ landingStart, landingClose, configStart, configClose });

// Insert closing )} AFTER the respective </div> lines
lines.splice(configClose + 1, 0, "                      )}");
lines.splice(configStart + 1, 0, "                      {currentUser.role === 'master' && (");

lines.splice(landingClose + 1, 0, "                      )}");
lines.splice(landingStart + 1, 0, "                      {currentUser.role === 'master' && (");

fs.writeFileSync(file, lines.join('\n'));
