const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace state and useEffect
const targetLoad = `    // Load esun quotes to feed general dashboard statistics
    const [esunQuotes, setEsunQuotes] = useState<any[]>([]);
  
    useEffect(() => {
      if (activeTab === 'dashboard') {
        const fetchStats = async () => {
          try {
            // Priority: load from Supabase for real-time global stats
            const { data, error } = await supabase.from('esun_proyectos').select('*');
            if (data && !error) {
              // Transform to match expected format for stats
              const mapped = data.map(p => {
                let investment = 0;
                if (p.proposals && Array.isArray(p.proposals) && p.proposals.length > 0) {
                  investment = p.proposals[0]?.financial?.investment_mxn || p.proposals[0]?.financial?.total_cost_mxn || 0;
                }
                return {
                  id: p.id,
                  client_name: p.client_name,
                  financial: { investment_mxn: investment }
                };
              });
              setEsunQuotes(mapped);
            } else {
              // Fallback to localStorage if Supabase fails
              const stored = localStorage.getItem('esun_quotes');
              if (stored) setEsunQuotes(JSON.parse(stored));
            }
          } catch (e) {
            console.error("Error loading global quotes:", e);
          }
        };
        fetchStats();
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

if (content.includes("const [esunQuotes, setEsunQuotes] = useState<any[]>([])")) {
    content = content.replace(targetLoad, replacementLoad);
} else {
    // Wait, earlier my script didn't apply because I committed BEFORE my script ran, so Portal still has localStorage!
    // Let me check what's in Portal.tsx currently.
}
fs.writeFileSync(file, content);
