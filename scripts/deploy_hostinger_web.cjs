const fs = require('fs');
const path = require('path');
const https = require('https');

const uploadUrl = 'https://srv637-files.hstgr.io/rest/63d26e1fd0d72bfd/api/tus/public_html';
const authKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJsb2NhbGUiOiJlbl9VUyIsInZpZXdNb2RlIjoibGlzdCIsInNpbmdsZUNsaWNrIjpmYWxzZSwicmVkaXJlY3RBZnRlckNvcHlNb3ZlIjpmYWxzZSwicGVybSI6eyJhZG1pbiI6ZmFsc2UsImV4ZWN1dGUiOmZhbHNlLCJjcmVhdGUiOnRydWUsInJlbmFtZSI6dHJ1ZSwibW9kaWZ5Ijp0cnVlLCJkZWxldGUiOnRydWUsInNoYXJlIjpmYWxzZSwiZG93bmxvYWQiOnRydWV9LCJjb21tYW5kcyI6W10sImxvY2tQYXNzd29yZCI6dHJ1ZSwiaGlkZURvdGZpbGVzIjpmYWxzZSwiZGF0ZUZvcm1hdCI6ZmFsc2UsInVzZXJuYW1lIjoidTgyMTkzNzgxMyIsImFjZUVkaXRvclRoZW1lIjoiIn0sImlzcyI6IkZpbGUgQnJvd3NlciIsImV4cCI6MTc5MDY0NDQ4NywiaWF0IjoxNzkwNjIyODg3fQ.qfEtlmeN_NtasdGA5_9p_DCuDVjvkBQ64VUyckJiTtw';
const restAuthKey = '8cdbbb743283f8e8233b1ced1e052918132507ead36e4a22e8d94a89cfbb4c3f-63d26e1fd0d72bfd';

function uploadFile(localPath, relativePath) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(localPath);
    const size = fileBuffer.length;
    const destUrl = `${uploadUrl}/${encodeURIComponent(relativePath.replace(/\\/g, '/'))}?override=true`;

    const parsed = new URL(destUrl);

    // 1. POST
    const postReq = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'X-Auth': authKey,
        'X-Auth-Rest': restAuthKey,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': size,
        'Upload-Offset': 0
      }
    }, (res) => {
      // 2. PATCH
      const patchReq = https.request({
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: 'PATCH',
        headers: {
          'X-Auth': authKey,
          'X-Auth-Rest': restAuthKey,
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': 0,
          'Content-Length': size
        }
      }, (patchRes) => {
        if (patchRes.statusCode === 204 || patchRes.statusCode === 200 || patchRes.statusCode === 201) {
          console.log(`✓ Uploaded ${relativePath} (${size} bytes)`);
          resolve();
        } else {
          reject(new Error(`PATCH failed with status ${patchRes.statusCode}`));
        }
      });

      patchReq.on('error', reject);
      patchReq.write(fileBuffer);
      patchReq.end();
    });

    postReq.on('error', reject);
    postReq.end();
  });
}

async function main() {
  const distDir = path.resolve(__dirname, '../dist');
  
  // Upload only modified core SPA files
  console.log('Uploading index.html and assets...');
  await uploadFile(path.join(distDir, 'index.html'), 'index.html');
  
  const assetFiles = fs.readdirSync(path.join(distDir, 'assets'));
  for (const f of assetFiles) {
    const full = path.join(distDir, 'assets', f);
    if (!fs.statSync(full).isDirectory()) {
      await uploadFile(full, `assets/${f}`);
    }
  }
  console.log('Core files uploaded successfully!');
}

main().catch(console.error);
