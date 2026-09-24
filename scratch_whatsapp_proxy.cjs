const fs = require('fs');
const file = 'src/components/legal/WhatsAppConfig.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetUrl = `const API_URL = 'http://45.132.242.95:3001/api/whatsapp';`;
const replacementUrl = `const getApiUrl = (path: string) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? \`http://45.132.242.95:3001/api/whatsapp\${path}\` : \`/whatsapp-proxy.php?endpoint=\${path}\`;
};`;

content = content.replace(targetUrl, replacementUrl);

content = content.replace(/\$\{API_URL\}\/status/g, '${getApiUrl(\'/status\')}');
content = content.replace(/\$\{API_URL\}\/qr/g, '${getApiUrl(\'/qr\')}');
content = content.replace(/\$\{API_URL\}\/config/g, '${getApiUrl(\'/config\')}');
content = content.replace(/\$\{API_URL\}\/logs/g, '${getApiUrl(\'/logs\')}');
content = content.replace(/\$\{API_URL\}\/logout/g, '${getApiUrl(\'/logout\')}');

fs.writeFileSync(file, content);
