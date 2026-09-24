const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace the state and useEffect
const targetLoad = `    // Load esun quotes to feed general dashboard statistics
    const [esunQuotes, setEsunQuotes] = useState<any[]>([]);
  
    useEffect(() => {
      try {
        const stored = localStorage.getItem('esun_quotes');
        if (stored) {
          setEsunQuotes(JSON.parse(stored));
        } else {
          setEsunQuotes([]);
        }
      } catch (e) {
        console.error("Error loading esun quotes for dashboard stats:", e);
      }
    }, [activeTab]);`;

const replacementLoad = `    // Load presupuestos for dashboard statistics
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
                  // Add IVA to final commercial price
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
    }, [activeTab]);`;

content = content.replace(targetLoad, replacementLoad);

// 2. Replace the UI block for Stat 1 (Total Cotizado)
const targetStat1 = `<div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Total Cotizado</span>
                            <h4 className="text-2xl font-black text-gold mt-2 font-display">
                              \${esunQuotes.reduce((acc, q) => acc + (q.financial?.investment_mxn || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                            </h4>
                            <span className="text-[9px] text-green-400 font-bold block mt-3">' Total acumulado en Esun Solar</span>
                          </div>`;

const replacementStat1 = `<div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Total Cotizado</span>
                            <h4 className="text-2xl font-black text-gold mt-2 font-display">
                              \${dashboardPresupuestos.reduce((acc, p) => acc + (p.total_mxn || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                            </h4>
                            <span className="text-[9px] text-green-400 font-bold block mt-3">' Total de Presupuestos eSol</span>
                          </div>`;

content = content.replace(targetStat1, replacementStat1);

// 3. Replace the UI block for Stat 2 (Total Presupuestos)
const targetStat2 = `<div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Leads por IA</span>
                            <h4 className="text-2xl font-black text-gold mt-2 font-display">{esunQuotes.length} leads</h4>
                            <span className="text-[9px] text-cream-muted block mt-3">Cotizaciones creadas en Esun Solar</span>
                          </div>`;

const replacementStat2 = `<div className="border border-dark-4 bg-dark-2/50 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Total Presupuestos</span>
                            <h4 className="text-2xl font-black text-gold mt-2 font-display">{dashboardPresupuestos.length} presupuestos</h4>
                            <span className="text-[9px] text-cream-muted block mt-3">Registrados en Plataforma</span>
                          </div>`;

content = content.replace(targetStat2, replacementStat2);

fs.writeFileSync(file, content);
