const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/p\.conceptos/g, "p.presupuesto_conceptos");

fs.writeFileSync(file, content);
