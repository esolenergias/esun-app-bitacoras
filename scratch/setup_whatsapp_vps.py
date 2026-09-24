import paramiko

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out or err or "(ok)"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.132.242.95', username='root', password='Esol2024vps', timeout=15)

# ── Script 1: setup.js (escanear QR una sola vez) ──
setup_js = r"""
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('Iniciando ESOL WhatsApp Bot...');
console.log('Escanea el codigo QR con tu WhatsApp personal.');
console.log('(Menu → Dispositivos vinculados → Vincular dispositivo)\n');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '/var/www/esol-whatsapp/.wwebjs_auth' }),
  puppeteer: {
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('\nEscanea el QR de arriba con tu WhatsApp.');
});

client.on('authenticated', () => {
  console.log('\n✅ Autenticado correctamente. Sesion guardada.');
});

client.on('ready', () => {
  console.log('✅ Bot listo. Ya puedes cerrar esta terminal.');
  console.log('Las notificaciones automaticas estan configuradas.');
  process.exit(0);
});

client.on('auth_failure', () => {
  console.log('❌ Error de autenticacion. Intenta de nuevo.');
  process.exit(1);
});

client.initialize();
"""

# ── Script 2: notify.js (ejecutado por cron) ──
notify_js = r"""
const { Client, LocalAuth } = require('whatsapp-web.js');

const NUMERO_DESTINO = '523112343034@c.us';
const tipo = process.argv[2] || 'viernes';

const mensajes = {
  viernes: '🔔 *ESOL Energías – Recordatorio*\n\nSon las 4:00 PM del viernes. Es momento de entrar al Portal ESOL y *redactar el Reporte Semanal de Actividades* del personal para generar su liquidación.\n\n🔗 esolenergias.com',
  lunes: '📋 *ESOL Energías – Recordatorio*\n\nBuenos días. Recuerda *imprimir y obtener las firmas* de los Comprobantes de Actividades generados el viernes pasado.\n\n🔗 esolenergias.com'
};

const mensaje = mensajes[tipo];

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '/var/www/esol-whatsapp/.wwebjs_auth' }),
  puppeteer: {
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

client.on('ready', async () => {
  try {
    await client.sendMessage(NUMERO_DESTINO, mensaje);
    console.log(`[${new Date().toISOString()}] Mensaje "${tipo}" enviado OK`);
  } catch (e) {
    console.error('Error enviando mensaje:', e.message);
  } finally {
    await client.destroy();
    process.exit(0);
  }
});

client.on('auth_failure', () => {
  console.error('Error: sesion no encontrada. Ejecuta setup.js primero.');
  process.exit(1);
});

client.initialize();
"""

# Write files to VPS
print(run(ssh, f"cat > /var/www/esol-whatsapp/setup.js << 'ENDOFFILE'\n{setup_js}\nENDOFFILE"))
print(run(ssh, f"cat > /var/www/esol-whatsapp/notify.js << 'ENDOFFILE'\n{notify_js}\nENDOFFILE"))

# Set up cron jobs
# Mexico Nayarit = UTC-7 (MST) / UTC-6 (CST standard)
# Friday 4:00 PM CST = 22:00 UTC → cron: 0 22 * * 5
# Monday 8:30 AM CST = 14:30 UTC → cron: 30 14 * * 1
cron_cmd = """(crontab -l 2>/dev/null; echo "0 22 * * 5 /usr/bin/node /var/www/esol-whatsapp/notify.js viernes >> /var/log/esol-whatsapp.log 2>&1") | crontab -"""
print(run(ssh, cron_cmd))

cron_cmd2 = """(crontab -l 2>/dev/null; echo "30 14 * * 1 /usr/bin/node /var/www/esol-whatsapp/notify.js lunes >> /var/log/esol-whatsapp.log 2>&1") | crontab -"""
print(run(ssh, cron_cmd2))

# Verify
print("\n=== CRONTAB ACTUAL ===")
print(run(ssh, "crontab -l"))
print("\n=== ARCHIVOS CREADOS ===")
print(run(ssh, "ls -la /var/www/esol-whatsapp/"))

ssh.close()
print("\n=== TODO LISTO ===")
