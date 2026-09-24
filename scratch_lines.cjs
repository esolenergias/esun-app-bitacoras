const fs = require('fs');
const file = 'src/components/Portal.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* LANDING PAGE ACCORDION */}')) {
        lines.splice(i + 1, 0, "                        {currentUser.role === 'master' && (");
        i++;
    }
    
    // Find the end of Landing Page Accordion which is right before Tienda Esol
    if (lines[i].includes('onClick={() => setTiendaExpanded(!tiendaExpanded)}')) {
        // Go back up to the enclosing div
        let j = i;
        while (j > 0 && !lines[j].includes('<div className="pt-2">')) {
            j--;
        }
        lines.splice(j, 0, "                        )}");
        i++; // adjust for the inserted line
    }

    if (lines[i].includes('{/* CONFIGURACION ACCORDION */}')) {
        lines.splice(i + 1, 0, "                      {currentUser.role === 'master' && (");
        i++;
    }

    if (lines[i].includes('{/* Sidebar bottom actions */}')) {
        // Go back up to close the Configuration Accordion
        let j = i;
        let divCount = 0;
        while (j > 0) {
            j--;
            if (lines[j].includes('</div>')) divCount++;
            if (divCount >= 3) break; // Before the last 3 closing divs
        }
        lines.splice(j + 1, 0, "                      )}");
        i++;
    }
}

fs.writeFileSync(file, lines.join('\n'));
