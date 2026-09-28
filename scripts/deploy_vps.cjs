const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const passwords = ['xiYF5w&..Q/7QzH5', 'Esol2024vps'];
const host = '45.132.242.95';
const username = 'root';

async function tryConnect(password) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log(`✓ Connected successfully to VPS with password: ${password.substring(0, 4)}...`);
      resolve(conn);
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host,
      port: 22,
      username,
      password,
      readyTimeout: 10000
    });
  });
}

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`Exit code ${code}: ${stderr || stdout}`));
      }).on('data', (data) => {
        stdout += data.toString();
      }).stderr.on('data', (data) => {
        stderr += data.toString();
      });
    });
  });
}

function uploadRecursive(conn, sftp, localDir, remoteDir) {
  return new Promise(async (resolve, reject) => {
    try {
      const items = fs.readdirSync(localDir);
      for (const item of items) {
        const localPath = path.join(localDir, item);
        const remotePath = `${remoteDir}/${item}`.replace(/\\/g, '/');
        const stat = fs.statSync(localPath);

        if (stat.isDirectory()) {
          try {
            await new Promise((res) => sftp.mkdir(remotePath, () => res()));
          } catch (e) {}
          await uploadRecursive(conn, sftp, localPath, remotePath);
        } else {
          console.log(`Uploading ${item} (${stat.size} bytes)...`);
          await new Promise((res, rej) => {
            sftp.fastPut(localPath, remotePath, (err) => {
              if (err) rej(err);
              else res();
            });
          });
        }
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function main() {
  let conn = null;
  for (const pwd of passwords) {
    try {
      conn = await tryConnect(pwd);
      break;
    } catch (e) {
      console.log(`Failed with password: ${pwd.substring(0, 4)}... : ${e.message}`);
    }
  }

  if (!conn) {
    console.error('Could not authenticate to VPS with known credentials.');
    process.exit(1);
  }

  console.log('Opening SFTP...');
  const sftp = await new Promise((resolve, reject) => {
    conn.sftp((err, s) => {
      if (err) reject(err);
      else resolve(s);
    });
  });

  const distDir = path.resolve(__dirname, '../dist');
  const remoteDir = '/var/www/esolenergias.com';

  console.log(`Deploying ${distDir} -> ${remoteDir}...`);
  await uploadRecursive(conn, sftp, distDir, remoteDir);

  console.log('Setting permissions and reloading Nginx...');
  const out = await runCommand(conn, 'chown -R www-data:www-data /var/www/esolenergias.com && chmod -R 755 /var/www/esolenergias.com && systemctl reload nginx && ls -lh /var/www/esolenergias.com/index.html && ls -lh /var/www/esolenergias.com/assets');
  console.log('Nginx reload output:\n', out);

  conn.end();
  console.log('=== DEPLOY TO VPS FINISHED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Deploy error:', err);
  process.exit(1);
});
