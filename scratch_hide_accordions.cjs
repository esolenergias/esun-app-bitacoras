const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

const landingAccordionRegex = /(<div className="pt-2">\s*\{!sidebarCollapsed && \(\s*<button\s*onClick=\{\(\) => setLandingExpanded\(!landingExpanded\)\}\s*className="w-full flex items-center justify-between px-3 py-2 text-\[10px\] font-black uppercase text-gold\/70 hover:text-gold transition-colors"\s*>\s*<div className="flex items-center gap-2">\s*<LayoutTemplate className="w-3\.5 h-3\.5" \/>\s*<span>Landing Page<\/span>[\s\S]*?<\/div>\s*\)\})/g;

content = content.replace(landingAccordionRegex, match => `{currentUser.role === 'master' && (\n                        ${match}\n                        )}`);

const configAccordionRegex = /(<div className="pt-2">\s*\{!sidebarCollapsed && \(\s*<button\s*onClick=\{\(\) => setConfigExpanded\(!configExpanded\)\}\s*className="w-full flex items-center justify-between px-3 py-2 text-\[10px\] font-black uppercase text-gold\/70 hover:text-gold transition-colors"\s*>\s*<div className="flex items-center gap-2">\s*<Settings className="w-3\.5 h-3\.5" \/>\s*<span>Configuracin<\/span>[\s\S]*?<\/div>\s*\)\})/g;

content = content.replace(configAccordionRegex, match => `{currentUser.role === 'master' && (\n                        ${match}\n                        )}`);

fs.writeFileSync(file, content);
