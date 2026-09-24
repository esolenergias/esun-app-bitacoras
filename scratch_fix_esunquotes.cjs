const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `\${esunQuotes.reduce((acc, q) => acc + (q.financial?.investment_mxn || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN`;
const newStr = `\${dashboardPresupuestos.reduce((acc, p) => acc + (p.total_mxn || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN`;

content = content.replace(oldStr, newStr);

fs.writeFileSync(file, content);
