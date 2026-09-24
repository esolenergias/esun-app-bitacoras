const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFetch = `const { data, error } = await supabase.from('presupuestos').select('*');`;
const newFetch = `const { data, error } = await supabase.from('presupuestos').select(\`
              id,
              indirect_percentage,
              utility_percentage,
              presupuesto_conceptos (
                quantity,
                costo_unitario
              )
            \`);`;

if (content.includes(oldFetch)) {
    content = content.replace(oldFetch, newFetch);
}

const oldTotalVentaLogic = `                if (p.conceptos && Array.isArray(p.conceptos)) {
                  let costoDirecto = 0;
                  p.conceptos.forEach(c => {
                    costoDirecto += (Number(c.quantity) || 0) * (Number(c.costo_unitario) || 0);
                  });`;
const newTotalVentaLogic = `                if (p.presupuesto_conceptos && Array.isArray(p.presupuesto_conceptos)) {
                  let costoDirecto = 0;
                  p.presupuesto_conceptos.forEach(c => {
                    costoDirecto += (Number(c.quantity) || 0) * (Number(c.costo_unitario) || 0);
                  });`;

if (content.includes(oldTotalVentaLogic)) {
    content = content.replace(oldTotalVentaLogic, newTotalVentaLogic);
}

const oldSubtitle = `<span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Total Presupuestos</span>
                            <h4 className="text-2xl font-black text-gold mt-2 font-display">{dashboardPresupuestos.length} presupuestos</h4>`;
const newSubtitle = `<span className="text-[10px] font-black uppercase tracking-widest text-cream-dim">Total Presupuestos</span>
                            <h4 className="text-2xl font-black text-gold mt-2 font-display">{dashboardPresupuestos.length}</h4>`;

if (content.includes(oldSubtitle)) {
    content = content.replace(oldSubtitle, newSubtitle);
}

fs.writeFileSync(file, content);
