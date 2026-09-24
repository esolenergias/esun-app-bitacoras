const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `Total acumulado en Esun Solar</span>`;
const newStr = `Total de Presupuestos eSol</span>`;

content = content.replace(oldStr, newStr);

fs.writeFileSync(file, content);
