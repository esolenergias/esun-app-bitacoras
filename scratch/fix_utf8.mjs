import fs from 'fs';

let content = fs.readFileSync('src/components/BitacorasApp.tsx', 'utf8');

const fixes = {
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã±': 'ñ',
  'Â¿': '¿',
  'AÃºn': 'Aún',
  'diseÃ±o': 'diseño',
  'Â·': '·',
  'â€”': '—',
  'â€“': '–',
  'Ã': 'É',
  'ǟ': 'ñ',
  "ǽ'": '°',
  "'C": '°C',
  'Descripciǟn': 'Descripción',
  'Ubicaciǟn': 'Ubicación'
};

for (const [bad, good] of Object.entries(fixes)) {
  if (bad === 'Ã' && !content.includes('Ã')) continue;
  content = content.split(bad).join(good);
}

content = content.replace(/Ãxito/g, 'Éxito');
content = content.replace(/AÃºn/g, 'Aún');

// Also fix the PDF drive images cross origin logic that the user requested:
// "en el PDF generado (dentro de generateObraReport), la función resolveImg() debe usar la misma lógica de getDriveImageUrl"
// and "crossorigin='anonymous' y un onerror" and "logo de esol arriba a la izquierda"

fs.writeFileSync('src/components/BitacorasApp.tsx', content, 'utf8');
console.log('Fixed UTF-8 issues in BitacorasApp.tsx');
