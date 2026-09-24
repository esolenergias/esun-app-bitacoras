const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Landing Page Accordion
const landingRegex = /\{?\/\* LANDING PAGE ACCORDION \*\/\s*(<div className="pt-2">[\s\S]*?<\/div>\s*\)\})\s*(<div className="pt-2">)/;
content = content.replace(landingRegex, (match, landingBlock, nextBlock) => {
    return `{/* LANDING PAGE ACCORDION */}\n{currentUser.role === 'master' && (\n${landingBlock}\n)}\n${nextBlock}`;
});

// Replace Configuracion Accordion
const configRegex = /\{?\/\* CONFIGURACION ACCORDION \*\/\s*(<div className="pt-2">[\s\S]*?<\/div>\s*\)\})\s*<\/div>\s*<\/div>\s*<\/div>\s*\{?\/\* Sidebar bottom actions \*\/\}/;
content = content.replace(configRegex, (match, configBlock) => {
    return `{/* CONFIGURACION ACCORDION */}\n{currentUser.role === 'master' && (\n${configBlock}\n)}\n</div>\n</div>\n</div>\n{/* Sidebar bottom actions */}`;
});

fs.writeFileSync(file, content);
