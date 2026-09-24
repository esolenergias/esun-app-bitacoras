const fs = require('fs');
const c = fs.readFileSync('src/components/crm/SdrTab.tsx', 'utf8');
const match = c.match(/\{\/\* WORKFLOW \/ FLOWCHART VIEW \*\/\}[\s\S]*?(?=\{\/\* CONFIGURATION VIEW \*\/\})/m);
if (match) {
  console.log("Match found! Length:", match[0].length);
} else {
  console.log("No match found.");
}
