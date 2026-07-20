const fs = require('fs');

// Fix CmsTab.tsx
let cms = fs.readFileSync('src/components/portal/tabs/CmsTab.tsx', 'utf8');
cms = cms.replace('const { content, setContent } = useApp();', 'const { content, setContent, addPromo, togglePromo, updateHeroText, updatePromoBanner } = useApp();');

const handlers = `
  const handleSaveCMS = () => {
    updateHeroText('title', heroTitle);
    updateHeroText('subtitle', heroSubtitle);
    updateHeroText('statProjects', heroProjects);
    updateHeroText('statBrands', heroBrands);
    updateHeroText('statCapacity', heroCapacity);
    updatePromoBanner(bannerActive, bannerText);
    alert('Cambios de contenido y promociones guardados correctamente en local.');
  };

  const handleAddPromoSubmit = (e) => {
    e.preventDefault();
    if (!newPromoTitle || !newPromoDesc || !newPromoCode) {
      alert('Por favor llena todos los campos de la promoción.');
      return;
    }
    addPromo(newPromoTitle, newPromoDesc, newPromoCode);
    setNewPromoTitle('');
    setNewPromoDesc('');
    setNewPromoCode('');
  };
`;

cms = cms.replace("const [newPromoCode, setNewPromoCode] = useState('');", "const [newPromoCode, setNewPromoCode] = useState('');\n" + handlers);
fs.writeFileSync('src/components/portal/tabs/CmsTab.tsx', cms);

// Fix Portal.tsx
let portal = fs.readFileSync('src/components/Portal.tsx', 'utf8');
const portalLines = portal.split('\n');
const saveStart = portalLines.findIndex(l => l.includes('const handleSaveCMS = () => {'));
let saveEnd = saveStart;
if (saveStart !== -1) {
    while (!portalLines[saveEnd].includes("setNewPromoCode('');")) {
        saveEnd++;
    }
    saveEnd += 2; // close brace
    const newPortal = [...portalLines.slice(0, saveStart), ...portalLines.slice(saveEnd)].join('\n');
    fs.writeFileSync('src/components/Portal.tsx', newPortal);
}
console.log('Fixed handlers!');
