const fs = require('fs');

let c = fs.readFileSync('src/components/BitacorasApp.tsx', 'utf8');

// Add imports
if (!c.includes('generateCoverPDF')) {
  c = c.replace(
    "import { generateObraReport } from './esun/pdfGenerator';",
    "import { generateObraReport } from './esun/pdfGenerator';\nimport { generateCoverPDF } from './esun/pdfCoverGenerator';"
  );
}

if (!c.includes('BookOpen')) {
  c = c.replace(
    "} from 'lucide-react';",
    ", BookOpen } from 'lucide-react';"
  );
}

// Button 1 (Detail View)
const detailBtnSearch = `              <button \n                onClick={() => generateObraReport(selectedObraDetail, bitacoras, reporterName, includeFinancialReport)}\n                className="flex items-center gap-2 px-5 py-3 bg-dark-3 hover:bg-gold/20 border border-gold/30 hover:border-gold text-gold font-black rounded-xl transition-all shadow-lg"\n              >\n                <FileText className="w-5 h-5" />\n                Generar Reporte PDF\n              </button>`;

const detailBtnReplace = `              <button \n                onClick={() => generateCoverPDF(selectedObraDetail)}\n                className="flex items-center gap-2 px-5 py-3 bg-dark-3 hover:bg-gold/20 border border-gold/30 hover:border-gold text-gold font-black rounded-xl transition-all shadow-lg"\n              >\n                <BookOpen className="w-5 h-5" />\n                Portada PDF\n              </button>\n              <button \n                onClick={() => generateObraReport(selectedObraDetail, bitacoras, reporterName, includeFinancialReport)}\n                className="flex items-center gap-2 px-5 py-3 bg-dark-3 hover:bg-gold/20 border border-gold/30 hover:border-gold text-gold font-black rounded-xl transition-all shadow-lg"\n              >\n                <FileText className="w-5 h-5" />\n                Generar Reporte PDF\n              </button>`;
              
c = c.replace(detailBtnSearch, detailBtnReplace);

// Button 2 (Grid View)
const gridBtnSearch = `                    <button\n                      onClick={(e) => { e.stopPropagation(); generateObraReport(obra, bitacoras, reporterName, includeFinancialReport); }}\n                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-dim text-dark-1 font-black text-xs rounded-xl transition-all shadow-md hover:shadow-gold/30 hover:scale-[1.02] active:scale-95"\n                    >\n                      <FileText className="w-4 h-4 stroke-[2.5]" />\n                      Generar Reporte PDF\n                    </button>`;

const gridBtnReplace = `                    <div className="flex gap-2 w-full">\n                      <button\n                        onClick={(e) => { e.stopPropagation(); generateCoverPDF(obra); }}\n                        className="w-1/3 flex items-center justify-center gap-2 px-2 py-2.5 bg-dark-3 hover:bg-gold/20 border border-gold/30 text-gold font-black text-xs rounded-xl transition-all shadow-md hover:border-gold"\n                        title="Generar Portada PDF"\n                      >\n                        <BookOpen className="w-4 h-4 stroke-[2.5]" />\n                      </button>\n                      <button\n                        onClick={(e) => { e.stopPropagation(); generateObraReport(obra, bitacoras, reporterName, includeFinancialReport); }}\n                        className="w-2/3 flex items-center justify-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-dim text-dark-1 font-black text-xs rounded-xl transition-all shadow-md hover:shadow-gold/30 hover:scale-[1.02] active:scale-95"\n                      >\n                        <FileText className="w-4 h-4 stroke-[2.5]" />\n                        Generar Reporte PDF\n                      </button>\n                    </div>`;

c = c.replace(gridBtnSearch, gridBtnReplace);

fs.writeFileSync('src/components/BitacorasApp.tsx', c);
