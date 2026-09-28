const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected!');
  conn.exec('ls -la /etc/nginx/sites-enabled/ && cat /etc/nginx/sites-available/* 2>/dev/null', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('NGINX SITES:\n', out);
      conn.end();
    });
  });
}).connect({
  host: '45.132.242.95',
  port: 22,
  username: 'root',
  password: 'Esol2024vps'
});
