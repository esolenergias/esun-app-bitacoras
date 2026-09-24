const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '45.132.242.95',
  port: 22,
  username: 'root',
  password: 'xiYF5w&..Q/7QzH5'
};

function runRemoteCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> EXECUTING: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      }).on('data', (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      }).stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });
    });
  });
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> UPLOADING: ${localPath} -> ${remotePath}`);
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) return reject(err);
        console.log(`✓ Uploaded ${localPath} successfully!`);
        resolve();
      });
    });
  });
}

async function setup() {
  const conn = new Client();
  
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject).connect(config);
  });

  console.log('=== CONEXIÓN CON EL VPS DE HOSTINGER CONECTADA EXITOSAMENTE ===');

  // 1. Actualizar apt e instalar dependencias básicas
  await runRemoteCommand(conn, 'apt-get update');
  await runRemoteCommand(conn, 'apt-get install -y curl git unzip ufw build-essential nginx certbot python3-certbot-nginx');

  // 2. Instalación de Node.js v20 LTS y PM2
  await runRemoteCommand(conn, 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
  await runRemoteCommand(conn, 'apt-get install -y nodejs');
  await runRemoteCommand(conn, 'npm install -g pm2');

  // 3. Crear directorio web
  await runRemoteCommand(conn, 'mkdir -p /var/www/esolenergias.com');
  await runRemoteCommand(conn, 'mkdir -p /var/www/esolenergias.com/scripts');

  // 4. Subir dist.zip y scripts
  await uploadFile(conn, path.join(__dirname, '../dist.zip'), '/var/www/esolenergias.com/dist.zip');
  await uploadFile(conn, path.join(__dirname, 'sync-plants.js'), '/var/www/esolenergias.com/scripts/sync-plants.js');

  // 5. Extraer dist.zip
  await runRemoteCommand(conn, 'cd /var/www/esolenergias.com && (unzip -o dist.zip || true) && rm -f dist.zip');

  // 6. Configurar Nginx
  const nginxConfig = `server {
    listen 80;
    server_name esolenergias.com www.esolenergias.com 45.132.242.95;

    root /var/www/esolenergias.com;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
`;

  await runRemoteCommand(conn, `cat << 'EOF' > /etc/nginx/sites-available/esolenergias.com\n${nginxConfig}\nEOF`);
  await runRemoteCommand(conn, 'ln -sf /etc/nginx/sites-available/esolenergias.com /etc/nginx/sites-enabled/');
  await runRemoteCommand(conn, 'rm -f /etc/nginx/sites-enabled/default');
  await runRemoteCommand(conn, 'nginx -t');
  await runRemoteCommand(conn, 'systemctl reload nginx');

  // 7. Configurar CronJob en Linux (11 AM y 5 PM)
  const cronJobText = '0 11,17 * * * /usr/bin/node /var/www/esolenergias.com/scripts/sync-plants.js >> /var/log/sync-plants.log 2>&1\n';
  await runRemoteCommand(conn, `(crontab -l 2>/dev/null | grep -v 'sync-plants.js' ; echo "${cronJobText.trim()}") | crontab -`);

  // 8. Habilitar Firewall UFW
  await runRemoteCommand(conn, 'ufw allow OpenSSH');
  await runRemoteCommand(conn, 'ufw allow "Nginx Full"');
  await runRemoteCommand(conn, 'ufw --force enable');

  console.log('\n================================================================');
  console.log('=== CONFIGURACIÓN DEL VPS COMPLETADA EXITOSAMENTE DE PRINCIPIO A FIN ===');
  console.log('================================================================');

  conn.end();
}

setup().catch((err) => {
  console.error('Error durante la configuración del VPS:', err);
  process.exit(1);
});
