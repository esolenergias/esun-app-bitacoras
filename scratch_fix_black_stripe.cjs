const fs = require('fs');

let c = fs.readFileSync('src/components/esun/pdfGenerator.ts', 'utf8');

const regex = /\.get\('pdf'\)[\s\S]*?\.then\(\(pdf:\s*any\)\s*=>\s*\{[\s\S]*?resolve\(pdf\.output\('blob'\)\);\s*\}\)/;

if (regex.test(c)) {
  c = c.replace(regex, `.outputPdf('blob')\n          .then((blob: Blob) => resolve(blob))`);
  fs.writeFileSync('src/components/esun/pdfGenerator.ts', c);
  console.log("Successfully removed the custom pdf.rect hack!");
} else {
  console.log("Regex did not match.");
}
