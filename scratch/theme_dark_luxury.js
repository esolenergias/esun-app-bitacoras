import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/modules/sistema-administrativo/components/compras/SolicitudesCompraTab.tsx',
  'src/modules/sistema-administrativo/components/compras/OrdenesCompraTab.tsx',
  'src/modules/sistema-administrativo/components/compras/RecepcionesTab.tsx',
  'src/modules/sistema-administrativo/components/almacen/InventarioKardexTab.tsx',
  'src/modules/sistema-administrativo/components/almacen/SolicitudesMaterialTab.tsx',
  'src/modules/sistema-administrativo/components/almacen/ValesEntregaTab.tsx',
  'src/modules/sistema-administrativo/components/almacen/DevolucionesMermasTab.tsx',
  'src/modules/sistema-administrativo/components/almacen/CierreProyectosTab.tsx',
  'src/modules/sistema-administrativo/components/finanzas/CajaBancosTab.tsx',
  'src/modules/sistema-administrativo/components/finanzas/IngresosTab.tsx',
  'src/modules/sistema-administrativo/components/finanzas/EgresosTab.tsx',
  'src/modules/sistema-administrativo/components/catalogos/ProveedoresTab.tsx',
  'src/modules/sistema-administrativo/components/catalogos/VistasEntidadesReales.tsx'
];

const replacements = [
  // Modals & Panels
  { from: /className="fixed inset-0 bg-black\/50/g, to: 'className="fixed inset-0 bg-black/80' },
  { from: /bg-white rounded-2xl border border-slate-200 shadow-sm/g, to: 'bg-dark-2 rounded-2xl border border-dark-4 shadow-xl' },
  { from: /bg-white rounded-2xl border border-slate-200 shadow-xl/g, to: 'bg-dark-2 rounded-2xl border border-dark-4 shadow-2xl' },
  { from: /bg-white rounded-2xl border border-slate-200/g, to: 'bg-dark-2 rounded-2xl border border-dark-4' },
  { from: /bg-white rounded-xl border border-slate-200/g, to: 'bg-dark-2 rounded-xl border border-dark-4' },
  { from: /bg-white rounded-2xl shadow-xl/g, to: 'bg-dark-2 rounded-2xl border border-dark-4 shadow-2xl' },
  { from: /bg-white rounded-2xl/g, to: 'bg-dark-2 rounded-2xl' },
  { from: /bg-white p-/g, to: 'bg-dark-2 p-' },
  { from: /bg-white border/g, to: 'bg-dark-2 border' },
  { from: /bg-white shadow/g, to: 'bg-dark-2 shadow' },
  
  // Headers & Theads
  { from: /bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600/g, to: 'bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider' },
  { from: /bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500/g, to: 'bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider' },
  { from: /bg-slate-50 border-b border-slate-200/g, to: 'bg-dark-3/90 border-b border-dark-4' },
  { from: /bg-slate-50 border-t border-slate-200/g, to: 'bg-dark-3/90 border-t border-dark-4' },
  { from: /bg-slate-50 border border-slate-200/g, to: 'bg-dark-3 border border-dark-4' },
  { from: /bg-slate-50 rounded/g, to: 'bg-dark-3 rounded' },
  { from: /bg-slate-50 p-/g, to: 'bg-dark-3 p-' },
  { from: /bg-slate-50/g, to: 'bg-dark-3' },
  { from: /bg-slate-100/g, to: 'bg-dark-3' },
  { from: /bg-slate-200/g, to: 'bg-dark-4' },

  // Tables
  { from: /divide-y divide-slate-100/g, to: 'divide-y divide-dark-4/70' },
  { from: /divide-y divide-slate-200/g, to: 'divide-y divide-dark-4' },
  { from: /border-slate-200/g, to: 'border-dark-4' },
  { from: /border-slate-100/g, to: 'border-dark-4/50' },
  { from: /border-slate-300/g, to: 'border-dark-4' },
  { from: /hover:bg-slate-50\/60/g, to: 'hover:bg-dark-3/60' },
  { from: /hover:bg-slate-50/g, to: 'hover:bg-dark-3/50' },
  { from: /hover:bg-slate-100/g, to: 'hover:bg-dark-4/60' },
  { from: /hover:bg-slate-200/g, to: 'hover:bg-dark-4' },

  // Typography
  { from: /text-slate-900/g, to: 'text-cream font-bold' },
  { from: /text-slate-800/g, to: 'text-cream' },
  { from: /text-slate-700/g, to: 'text-cream/90' },
  { from: /text-slate-600/g, to: 'text-cream-muted' },
  { from: /text-slate-500/g, to: 'text-cream-muted' },
  { from: /text-slate-400/g, to: 'text-cream-dim' },
  { from: /text-slate-300/g, to: 'text-cream-dim/60' },

  // Form Inputs
  { from: /focus:bg-white/g, to: 'focus:bg-dark-2' },
  { from: /focus:border-blue-500/g, to: 'focus:border-gold' },
  { from: /bg-slate-50 border border-slate-200 rounded-lg text-sm/g, to: 'bg-dark-3 border border-dark-4 rounded-lg text-sm text-cream placeholder-cream-muted/40' },

  // Primary action buttons (Blue to Gold / Dark Gold)
  { from: /bg-blue-600 hover:bg-blue-700 text-white/g, to: 'bg-gold hover:bg-gold-light text-dark-1 font-bold' },
  { from: /bg-blue-600 text-white/g, to: 'bg-gold text-dark-1 font-bold' },
  { from: /text-blue-600/g, to: 'text-gold' },
  { from: /text-blue-700/g, to: 'text-gold-light' },
  { from: /text-blue-500/g, to: 'text-gold' },
  { from: /bg-blue-50/g, to: 'bg-gold/10' },
  { from: /border-blue-200/g, to: 'border-gold/30' },
  { from: /border-blue-500/g, to: 'border-gold' },

  // Badges & Accents
  { from: /bg-emerald-50 text-emerald-700 border border-emerald-200/g, to: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
  { from: /bg-amber-50 text-amber-700 border border-amber-200/g, to: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' },
  { from: /bg-red-50 text-red-700 border border-red-200/g, to: 'bg-red-500/10 text-red-400 border border-red-500/30' },
  { from: /bg-purple-50 text-purple-700 border border-purple-200/g, to: 'bg-purple-500/10 text-purple-400 border border-purple-500/30' },
  { from: /bg-slate-100 text-slate-700 border border-slate-200/g, to: 'bg-dark-3 text-cream-muted border border-dark-4' },
];

let changedCount = 0;
filesToUpdate.forEach(relPath => {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('File not found:', fullPath);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated theme in:', relPath);
    changedCount++;
  } else {
    console.log('No changes needed in:', relPath);
  }
});

console.log(`Finished. Updated ${changedCount} files.`);
