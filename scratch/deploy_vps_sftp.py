import os
import sys
import paramiko

def main():
    host = '45.132.242.95'
    user = 'root'
    password = 'Esol2024vps'
    
    local_dist = r'C:\Users\mafre\Esolenergias\dist'
    remote_dir = '/var/www/esolenergias.com'
    
    print(f"Connecting to {host} as {user}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=15)
    
    sftp = ssh.open_sftp()
    print("SFTP session opened.")
    
    def put_dir(source, target):
        try:
            sftp.stat(target)
        except IOError:
            print(f"Creating remote dir: {target}")
            sftp.mkdir(target)
            
        for item in os.listdir(source):
            src_path = os.path.join(source, item)
            tgt_path = f"{target}/{item}"
            if os.path.isdir(src_path):
                put_dir(src_path, tgt_path)
            else:
                local_size = os.path.getsize(src_path)
                try:
                    remote_stat = sftp.stat(tgt_path)
                    # For html and assets always overwrite or compare size/mtime
                    if remote_stat.st_size == local_size and not item.endswith('.html'):
                        # file identical, skip
                        continue
                except IOError:
                    pass
                print(f"Uploading {item} ({local_size} bytes) -> {tgt_path}")
                sftp.put(src_path, tgt_path)
                
    print(f"Uploading from {local_dist} to {remote_dir}...")
    put_dir(local_dist, remote_dir)
    
    print("Files uploaded successfully.")
    sftp.close()
    
    # Check permissions and reload nginx
    stdin, stdout, stderr = ssh.exec_command('chown -R www-data:www-data /var/www/esolenergias.com; chmod -R 755 /var/www/esolenergias.com; systemctl reload nginx; ls -lh /var/www/esolenergias.com/index.html; ls -lh /var/www/esolenergias.com/assets | tail -10')
    print("Post-deploy output:")
    print(stdout.read().decode('utf-8', 'ignore'))
    print(stderr.read().decode('utf-8', 'ignore'))
    
    ssh.close()
    print("=== DEPLOY TO VPS COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    main()
