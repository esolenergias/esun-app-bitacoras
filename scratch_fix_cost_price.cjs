const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/costo_unitario/g, "cost_price");

fs.writeFileSync(file, content);
