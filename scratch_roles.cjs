const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\('roles'\)\}[\s\S]*?<\/button>/,
  `{currentUser.role === 'master' && (
$&
)}`
);

fs.writeFileSync(file, content);
