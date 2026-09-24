const fs = require('fs');
let c = fs.readFileSync('src/components/esun/pdfCoverGenerator.ts', 'utf8');

c = c.replace(/portada_industrial\.jpg/g, 'crosssection_16x9.jpg');

fs.writeFileSync('src/components/esun/pdfCoverGenerator.ts', c);
console.log("Updated to crosssection_16x9.jpg");
