const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -o "index-[^\"]*\\.js" /var/www/esolenergias.com/index.html && nginx -T 2>&1 | grep -E "server_name|root "', (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => { console.log(out); conn.end(); });
  });
}).connect({ host: '45.132.242.95', port: 22, username: 'root', password: 'Esol2024vps' });
