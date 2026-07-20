const fs = require('fs');

const content = fs.readFileSync('src/components/Portal.tsx', 'utf8');
const lines = content.split('\n');

const stateStart = lines.findIndex(l => l.includes('const [heroTitle'));
let stateEnd = lines.findIndex(l => l.includes('const [newPromoCode'));

const jsxStart = lines.findIndex(l => l.includes("activeTab === 'cms' && ("));
const endLine = lines.findIndex(l => l.includes("activeTab === 'modules' && ("));

const stateCode = lines.slice(stateStart, stateEnd + 1).join('\n');
const jsxCode = lines.slice(jsxStart + 1, endLine - 1).join('\n');

const tabComponent = `import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, Plus, Save, Activity, Layout, Type } from 'lucide-react';

export default function CmsTab() {
  const { content, setContent } = useApp();

${stateCode}

  return (
    <>${jsxCode}
  );
}
`;

fs.mkdirSync('src/components/portal/tabs', { recursive: true });
fs.writeFileSync('src/components/portal/tabs/CmsTab.tsx', tabComponent);

const newPortalLines = [
    ...lines.slice(0, stateStart),
    ...lines.slice(stateEnd + 1, jsxStart),
    "                  {activeTab === 'cms' && (",
    "                    <CmsTab />",
    "                  )}",
    ...lines.slice(endLine)
];

const finalPortal = newPortalLines.join('\n');
fs.writeFileSync('src/components/Portal.tsx', "import CmsTab from './portal/tabs/CmsTab';\n" + finalPortal);

console.log('Successfully extracted CmsTab');
