const fs = require('fs');

const content = fs.readFileSync('src/components/Portal.tsx', 'utf8');
const lines = content.split('\n');

const stateStart = lines.findIndex(l => l.includes('const [showAddProductForm'));
let stateEnd = lines.findIndex(l => l.includes('setNewProdStock(50);'));
while (!lines[stateEnd].includes('};') && !lines[stateEnd + 1].includes('const [heroTitle')) {
    stateEnd++;
}

const jsxStart = lines.findIndex(l => l.includes("activeTab === 'inventory' && ("));
const logisticsLine = lines.findIndex(l => l.includes("activeTab === 'logistics' && ("));

const stateCode = lines.slice(stateStart, stateEnd + 1).join('\n');
const jsxCode = lines.slice(jsxStart + 1, logisticsLine - 1).join('\n'); 

const tabComponent = `import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { B2BProduct } from '../../context/AppContext';
import { Package, Plus, Save, Trash2, Edit, X, Bot, Sparkles, RefreshCw, Layers, DollarSign, Activity } from 'lucide-react';

const CATEGORIES = [
  'Paneles Solares',
  'Inversores',
  'Microinversores',
  'Estructuras',
  'Cable Solar',
  'Baterías'
];

export default function InventoryTab() {
  const { currentUser, products, addProduct, updateProduct, deleteProduct, cfeApiKey, cfeSelectedModel } = useApp();

${stateCode}

  return (
    <>${jsxCode}
  );
}
`;

fs.mkdirSync('src/components/portal/tabs', { recursive: true });
fs.writeFileSync('src/components/portal/tabs/InventoryTab.tsx', tabComponent);

const newPortalLines = [
    ...lines.slice(0, stateStart),
    ...lines.slice(stateEnd + 1, jsxStart),
    "              {(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'inventory' && (",
    "                <InventoryTab />",
    "              )}",
    ...lines.slice(logisticsLine)
];

const finalPortal = newPortalLines.join('\n');
fs.writeFileSync('src/components/Portal.tsx', "import InventoryTab from './portal/tabs/InventoryTab';\n" + finalPortal);

console.log('Successfully extracted InventoryTab');
