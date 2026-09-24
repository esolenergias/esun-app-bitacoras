const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove Client block
content = content.replace(/\{\/\* CLIENT ROLE SIDEBAR TABS[\s\S]*?\{\/\* ADMIN ROLE SIDEBAR TABS/m, '{/* ADMIN ROLE SIDEBAR TABS');

// Remove Admin block
content = content.replace(/\{\/\* ADMIN ROLE SIDEBAR TABS[\s\S]*?\{\/\* MASTER ROLE SIDEBAR TABS/m, '{/* MASTER ROLE SIDEBAR TABS');

// Change Master block to all roles
content = content.replace(/\{currentUser\.role === 'master' && \(/, '{true && (');

fs.writeFileSync(file, content);
