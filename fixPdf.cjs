const fs = require('fs');
let code = fs.readFileSync('src/components/esun/pdfGenerator.ts', 'utf8');

// Fix text encodings
code = code.replace(/°Cinzel/g, "'Cinzel");
code = code.replace(/Avance FÉ­sico Prom./g, 'Avance Físico Prom.');
code = code.replace(/ESOL ENERGÉ AS/g, 'ESOL ENERGÍAS');
code = code.replace(/SISTEMA DE BITÉ CORA ELECTRÉ“NICA/g, 'SISTEMA DE BITÁCORA ELECTRÓNICA');
code = code.replace(/Bitácora de Obra/g, 'Bitácora de Obra');
code = code.replace(/Registro Operativos/g, 'Registros Operativos');

// Fix reporter name
code = code.replace(/\(obra.residente \|\| reporterName\)/g, 'reporterName');

// Fix Logo URL
code = code.replace(/https:\/\/esolenergias.com\/img\/logo_esol_b.png/g, 'https://esolenergias.com/assets/logos/Logo_esol_b.png');

// Fix window.print to wait for images
code = code.replace(/win.document.close\(\);/g, "win.document.close();\n      win.onload = () => { setTimeout(() => win.print(), 1000); };");

fs.writeFileSync('src/components/esun/pdfGenerator.ts', code);
