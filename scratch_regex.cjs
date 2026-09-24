const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const \[esunQuotes, setEsunQuotes\] = useState<any\[\]>\(\[\]\);\s*useEffect\(\(\) => \{\s*try \{\s*const stored = localStorage\.getItem\('esun_quotes'\);\s*if \(stored\) \{\s*setEsunQuotes\(JSON\.parse\(stored\)\);\s*\} else \{\s*setEsunQuotes\(\[\]\);\s*\}\s*\} catch \(e\) \{\s*console\.error\("Error loading esun quotes for dashboard stats:", e\);\s*\}\s*\}, \[activeTab\]\);/g,
  `// Load presupuestos for dashboard statistics
    const [dashboardPresupuestos, setDashboardPresupuestos] = useState<any[]>([]);
  
    useEffect(() => {
      if (activeTab === 'dashboard') {
        const fetchStats = async () => {
          try {
            const { data, error } = await supabase.from('presupuestos').select('*');
            if (data && !error) {
              const mapped = data.map(p => {
                let totalVenta = 0;
                if (p.conceptos && Array.isArray(p.conceptos)) {
                  let costoDirecto = 0;
                  p.conceptos.forEach(c => {
                    costoDirecto += (Number(c.quantity) || 0) * (Number(c.costo_unitario) || 0);
                  });
                  const indPct = p.indirect_percentage ?? 10.00;
                  const utPct = p.utility_percentage ?? 8.00;
                  const indirectCost = costoDirecto * (indPct / 100);
                  const utility = (costoDirecto + indirectCost) * (utPct / 100);
                  totalVenta = costoDirecto + indirectCost + utility;
                  totalVenta = totalVenta * 1.16;
                }
                return {
                  id: p.id,
                  total_mxn: totalVenta
                };
              });
              setDashboardPresupuestos(mapped);
            }
          } catch (e) {
            console.error("Error loading dashboard presupuestos:", e);
          }
        };
        fetchStats();
      }
    }, [activeTab]);`
);

content = content.replace(
  /<div className="border border-dark-4 bg-dark-2\/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">\s*<span className="text-\[10px\] font-black uppercase tracking-widest text-cream-dim">Total Cotizado<\/span>\s*<h4 className="text-2xl font-black text-gold mt-2 font-display">\s*\$\{esunQuotes\.reduce\(\(acc, q\) => acc \+ \(q\.financial\?\.investment_mxn \|\| 0\), 0\)\.toLocaleString\('es-MX', \{ maximumFractionDigits: 0 \}\)\} MXN\s*<\/h4>\s*<span className="text-\[9px\] text-green-400 font-bold block mt-3">' Total acumulado en Esun Solar<\/span>\s*<\/div>/g,
  `<div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Total Cotizado</span>
                            <h4 className="text-2xl font-black text-gold mt-2 font-display">
                              \${dashboardPresupuestos.reduce((acc, p) => acc + (p.total_mxn || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                            </h4>
                            <span className="text-[9px] text-green-400 font-bold block mt-3">' Total de Presupuestos eSol</span>
                          </div>`
);

content = content.replace(
  /<div className="border border-dark-4 bg-dark-2\/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">\s*<span className="text-\[10px\] font-black uppercase tracking-widest text-cream-dim">Leads por IA<\/span>\s*<h4 className="text-2xl font-black text-gold mt-2 font-display">\{esunQuotes\.length\} leads<\/h4>\s*<span className="text-\[9px\] text-cream-muted block mt-3">Cotizaciones creadas en Esun Solar<\/span>\s*<\/div>/g,
  `<div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Total Presupuestos</span>
                            <h4 className="text-2xl font-black text-gold mt-2 font-display">{dashboardPresupuestos.length} presupuestos</h4>
                            <span className="text-[9px] text-cream-muted block mt-3">Registrados en Plataforma</span>
                          </div>`
);

fs.writeFileSync(file, content);
