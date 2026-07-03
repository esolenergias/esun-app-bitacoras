import os
import sys
import ftplib
import getpass

def safe_print(text):
    print(str(text).encode('ascii', 'replace').decode('ascii'))

def upload_item(ftp, local_path, remote_path):
    if os.path.isfile(local_path):
        filename = os.path.basename(local_path)
        safe_print(f"Uploading file: {local_path} -> {remote_path}/{filename}")
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {filename}', f)
    elif os.path.isdir(local_path):
        dirname = os.path.basename(local_path)
        # Check if remote folder exists, create if not
        try:
            ftp.cwd(dirname)
        except ftplib.error_perm:
            safe_print(f"Creating remote folder: {remote_path}/{dirname}")
            ftp.mkd(dirname)
            ftp.cwd(dirname)
        
        # Upload contents of local folder
        for item in os.listdir(local_path):
            upload_item(ftp, os.path.join(local_path, item), f"{remote_path}/{dirname}")
        
        # Go back to parent directory
        ftp.cwd('..')

def main():
    server = "82.29.81.191"
    username = "u821937813.esolenergias.com"
    remote_base = "public_html"
    local_dist = r"C:\Users\mafre\Esolenergias\dist"
    
    safe_print("=== ESOL ENERGIAS - FTP DEPLOYER ===")
    safe_print(f"Server: {server}")
    safe_print(f"Username: {username}")
    safe_print(f"Local path: {local_dist}")
    safe_print(f"Remote path: {remote_base}")
    
    if not os.path.exists(local_dist):
        safe_print(f"ERROR: Local production build folder '{local_dist}' does not exist. Run 'npm run build' first.")
        sys.exit(1)
        
    password = getpass.getpass("Introduce tu contraseña de FTP: ")
    if not password:
        # Fallback to standard input if getpass returns empty on some terminals
        password = input("Introduce tu contraseña de FTP: ")
        
    if not password:
        safe_print("ERROR: La contraseña no puede estar vacía.")
        sys.exit(1)
        
    safe_print("\nConnecting to FTP server...")
    try:
        ftp = ftplib.FTP(server)
        ftp.login(user=username, passwd=password)
        safe_print("Successfully logged in.")
        
        # Navigate to public_html
        safe_print(f"Navigating to remote directory: {remote_base}")
        ftp.cwd(remote_base)
        
        # Start recursive upload of items in local dist
        safe_print("\nStarting upload...")
        for item in os.listdir(local_dist):
            upload_item(ftp, os.path.join(local_dist, item), remote_base)
            
        safe_print("\nSUCCESS: All files successfully uploaded to Hostinger!")
        ftp.quit()
        
    except Exception as e:
        safe_print(f"\nERROR: Ocurrió un fallo durante el despliegue: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
