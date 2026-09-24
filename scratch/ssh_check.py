import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.132.242.95', username='root', password='Esol2024vps', timeout=15)

commands = [
    'uname -a',
    'node --version',
    'npm --version',
    'pm2 --version',
    'which curl',
    'ls /root/',
    'ls /home/',
    'crontab -l',
    'df -h | head -5',
]

for cmd in commands:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"[{cmd}]\n{out or err}\n")

ssh.close()
print("=== SSH OK ===")
