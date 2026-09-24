import paramiko, time, sys

def run(ssh, cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    r = out or err or "(ok)"
    sys.stdout.buffer.write((r[:300] + "\n").encode('utf-8'))
    sys.stdout.buffer.flush()
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.132.242.95', username='root', password='Esol2024vps', timeout=15)
sys.stdout.buffer.write(b"Connected!\n"); sys.stdout.buffer.flush()

# Start PM2
run(ssh, "cd /var/www/esol-whatsapp && pm2 delete esol-whatsapp 2>/dev/null || true")
run(ssh, "cd /var/www/esol-whatsapp && pm2 start server.js --name esol-whatsapp")
run(ssh, "pm2 save")

# Open firewall port 3001
run(ssh, "ufw allow 3001/tcp")
run(ssh, "ufw status")

# PM2 startup on reboot
run(ssh, "pm2 startup systemd -u root --hp /root | tail -1")

# Wait and check status
time.sleep(4)
out, _ = run(ssh, "pm2 status")
run(ssh, "pm2 logs esol-whatsapp --lines 10 --nostream")

ssh.close()
sys.stdout.buffer.write(b"\n=== VPS API READY ===\n"); sys.stdout.buffer.flush()
