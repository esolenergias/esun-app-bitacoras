import paramiko
import time

def run(ssh, cmd, timeout=120):
    print(f">>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    result = out or err or "(ok)"
    print(result[:500])
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.132.242.95', username='root', password='Esol2024vps', timeout=15)
print("Connected to VPS!")

# Install chromium dependencies for whatsapp-web.js
steps = [
    # Create project dir
    'mkdir -p /var/www/esol-whatsapp',
    # Init node project
    'cd /var/www/esol-whatsapp && npm init -y 2>&1',
    # Install whatsapp-web.js + qrcode-terminal
    'cd /var/www/esol-whatsapp && npm install whatsapp-web.js qrcode-terminal node-cron 2>&1 | tail -5',
    # Install chromium for puppeteer
    'apt-get install -y chromium-browser 2>&1 | tail -3',
    # Verify installs
    'ls /var/www/esol-whatsapp/node_modules | grep whatsapp',
]

for cmd in steps:
    run(ssh, cmd, timeout=300)
    time.sleep(1)

ssh.close()
print("\n=== INSTALLATION DONE ===")
