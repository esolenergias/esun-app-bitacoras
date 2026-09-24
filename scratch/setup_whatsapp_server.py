import paramiko
import time

def run(ssh, cmd, timeout=60):
    print(f">>> {cmd[:80]}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    r = out or err or "(ok)"
    print(r[:300])
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.132.242.95', username='root', password='Esol2024vps', timeout=15)
print("Connected!")

# Install express + cors + node-cron
run(ssh, "cd /var/www/esol-whatsapp && npm install express cors node-cron 2>&1 | tail -5", timeout=120)

# Create the API server
server_js = r"""
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = 3001;
const API_KEY = 'esol-whatsapp-2024';
const LOG_FILE = '/var/log/esol-whatsapp.log';
const CONFIG_FILE = '/var/www/esol-whatsapp/config.json';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Auth middleware
function auth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.apikey;
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Default config
let config = {
  messages: [
    {
      id: "msg-default-1",
      name: "Recordatorio Viernes",
      phone: "5213112854134",
      message: "🔔 *ESOL Energías – Recordatorio*\n\nSon las 4:00 PM del viernes. Es momento de entrar al Portal ESOL y *redactar el Reporte Semanal de Actividades* del personal para generar su liquidación.\n\n🔗 esolenergias.com",
      time: "16:00",
      days: [5],
      enabled: true
    },
    {
      id: "msg-default-2",
      name: "Recordatorio Lunes",
      phone: "5213112854134",
      message: "📋 *ESOL Energías – Recordatorio*\n\nBuenos días. Recuerda *imprimir y obtener las firmas* de los Comprobantes de Actividades generados el viernes pasado.\n\n🔗 esolenergias.com",
      time: "08:30",
      days: [1],
      enabled: true
    }
  ]
};

if (fs.existsSync(CONFIG_FILE)) {
  try { 
    const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    // Migrate old format to new format if needed
    if (savedConfig.phone && !savedConfig.messages) {
      config.messages[0].phone = savedConfig.phone;
      config.messages[1].phone = savedConfig.phone;
      if (savedConfig.friday_message) config.messages[0].message = savedConfig.friday_message;
      if (savedConfig.monday_message) config.messages[1].message = savedConfig.monday_message;
      if (savedConfig.friday_enabled !== undefined) config.messages[0].enabled = savedConfig.friday_enabled;
      if (savedConfig.monday_enabled !== undefined) config.messages[1].enabled = savedConfig.monday_enabled;
    } else if (savedConfig.messages) {
      config = savedConfig;
    }
  } catch(e) {}
}

let scheduledJobs = {};

function scheduleMessages() {
  for (let id in scheduledJobs) {
    scheduledJobs[id].stop();
  }
  scheduledJobs = {};

  if (!config.messages) return;

  config.messages.forEach(msg => {
    if (!msg.enabled) return;
    if (!msg.time || !msg.days || msg.days.length === 0) return;

    const [hour, minute] = msg.time.split(':');
    const daysStr = msg.days.join(',');
    const cronStr = `${minute} ${hour} * * ${daysStr}`;

    scheduledJobs[msg.id] = cron.schedule(cronStr, async () => {
      if (clientStatus !== 'connected') {
        const log = `[${new Date().toISOString()}] Omitido envio de "${msg.name}" - No conectado\n`;
        fs.appendFileSync(LOG_FILE, log);
        return;
      }
      try {
        let cleanPhone = msg.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('52') && cleanPhone.length === 12) {
          cleanPhone = '521' + cleanPhone.substring(2);
        }
        const chatId = cleanPhone + '@c.us';
        await waClient.sendMessage(chatId, msg.message);
        const log = `[${new Date().toISOString()}] Programado: "${msg.name}" enviado a ${cleanPhone}\n`;
        fs.appendFileSync(LOG_FILE, log);
      } catch (e) {
        const log = `[${new Date().toISOString()}] Error enviando "${msg.name}": ${e.message}\n`;
        fs.appendFileSync(LOG_FILE, log);
      }
    });
  });
}

// WhatsApp client state
let clientStatus = 'initializing'; // 'initializing' | 'qr' | 'connected' | 'disconnected'
let currentQR = null;
let waClient = null;

function initClient() {
  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: '/var/www/esol-whatsapp/.wwebjs_auth' }),
    puppeteer: {
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
  });

  waClient.on('qr', (qr) => {
    clientStatus = 'qr';
    currentQR = qr;
    qrcode.generate(qr, { small: true });
    console.log('QR generado - escanea con WhatsApp');
  });

  waClient.on('authenticated', () => {
    console.log('Autenticado correctamente');
    currentQR = null;
  });

  waClient.on('ready', () => {
    clientStatus = 'connected';
    currentQR = null;
    console.log('WhatsApp Bot conectado y listo!');
  });

  waClient.on('disconnected', (reason) => {
    clientStatus = 'disconnected';
    console.log('Desconectado:', reason);
    setTimeout(initClient, 5000);
  });

  waClient.on('auth_failure', () => {
    clientStatus = 'disconnected';
    setTimeout(initClient, 5000);
  });

  waClient.initialize();
  scheduleMessages();
}

initClient();

// ── ENDPOINTS ──────────────────────────────────────────────

// Status
app.get('/api/whatsapp/status', auth, (req, res) => {
  res.json({ status: clientStatus, hasQR: !!currentQR });
});

// Get QR as text (for display)
app.get('/api/whatsapp/qr', auth, (req, res) => {
  if (!currentQR) return res.json({ qr: null, message: 'No hay QR disponible. Bot ya conectado o iniciando.' });
  res.json({ qr: currentQR });
});

// Send message
app.post('/api/whatsapp/send', auth, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'Faltan phone o message' });
  if (clientStatus !== 'connected') return res.status(503).json({ error: 'WhatsApp no conectado' });
  try {
    let cleanPhone = phone.replace(/\D/g, '');
    // Auto-fix for Mexico: if 52 + 10 digits, add '1'
    if (cleanPhone.startsWith('52') && cleanPhone.length === 12) {
      cleanPhone = '521' + cleanPhone.substring(2);
    }
    const chatId = cleanPhone + '@c.us';
    await waClient.sendMessage(chatId, message);
    const log = `[${new Date().toISOString()}] Mensaje enviado a ${cleanPhone}: ${message.substring(0, 50)}...\n`;
    fs.appendFileSync(LOG_FILE, log);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get config
app.get('/api/whatsapp/config', auth, (req, res) => {
  res.json(config);
});

// Update config
app.post('/api/whatsapp/config', auth, (req, res) => {
  config = { ...config, ...req.body };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  scheduleMessages();
  res.json({ success: true, config });
});

// Get logs
app.get('/api/whatsapp/logs', auth, (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) return res.json({ logs: [] });
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(Boolean).slice(-50).reverse();
    res.json({ logs: lines });
  } catch(e) {
    res.json({ logs: [] });
  }
});

// Disconnect / logout
app.post('/api/whatsapp/logout', auth, async (req, res) => {
  try {
    await waClient.logout();
    clientStatus = 'disconnected';
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`ESOL WhatsApp API corriendo en puerto ${PORT}`);
});
"""

# Write server.js
sftp = ssh.open_sftp()
with sftp.open('/var/www/esol-whatsapp/server.js', 'w') as f:
    f.write(server_js)
sftp.close()
print("server.js written via SFTP")

# Start API server with PM2
run(ssh, "cd /var/www/esol-whatsapp && pm2 delete esol-whatsapp 2>/dev/null; pm2 start server.js --name esol-whatsapp && pm2 save")

# Open port 3001 in firewall
run(ssh, "ufw allow 3001/tcp && ufw status")

# Check PM2 status
time.sleep(3)
run(ssh, "pm2 list")

ssh.close()
print("\n=== VPS BACKEND READY ===")

