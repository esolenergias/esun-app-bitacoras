const fs = require('fs');
let c = fs.readFileSync('src/components/esun/pdfGenerator.ts', 'utf8');

c = c.replace(
  /pdf\.setFillColor\(248,\s*247,\s*242\);\s*\/\/\s*Beige/g,
  'pdf.setFillColor(255, 255, 255);\n              pdf.setDrawColor(255, 255, 255);'
);

c = c.replace(
  /pdf\.rect\(0,\s*0,\s*w,\s*10\.3,\s*'F'\);/g,
  "pdf.rect(0, 0, w, 12, 'F'); // Rellenamos el margen con blanco puro"
);

fs.writeFileSync('src/components/esun/pdfGenerator.ts', c);
console.log("Margin color changed to white");
