const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{dashboardPresupuestos\.length\}\s*presupuestos/g, "{dashboardPresupuestos.length}");

fs.writeFileSync(file, content);
