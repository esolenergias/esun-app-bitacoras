import os
import sys
import ftplib

def safe_print(text):
    print(str(text).encode('ascii', 'replace').decode('ascii'))

def upload_item(ftp, local_path, remote_path):
    if os.path.isfile(local_path):
        filename = os.path.basename(local_path)
        
        # Check if file already exists with same size (never skip index.html)
        try:
            local_size = os.path.getsize(local_path)
            if filename != "index.html":
                remote_size = ftp.size(filename)
                if remote_size == local_size:
                    # File is identical, skip upload
                    return
        except Exception:
            pass
            
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
    password = "66Dosgelatina$fpt"
    
    # Try different possible username variations since Hostinger custom usernames often append domain or prefix
    username_variations = [
        "esolenergiasftp",
        "esolenergiasftp@esolenergias.com",
        "u821937813.esolenergiasftp"
    ]
    
    local_dist = r"C:\Users\mafre\Esolenergias\dist"
    remote_base = "public_html"
    
    safe_print("=== ESOL ENERGIAS - FTP DEPLOYER (AUTO) ===")
    safe_print(f"Server: {server}")
    safe_print(f"Local path: {local_dist}")
    
    if not os.path.exists(local_dist):
        safe_print(f"ERROR: Local production build folder '{local_dist}' does not exist.")
        sys.exit(1)
        
    ftp = None
    connected = False
    
    for username in username_variations:
        safe_print(f"Attempting login as '{username}'...")
        try:
            ftp = ftplib.FTP(server, timeout=60)
            ftp.login(user=username, passwd=password)
            safe_print(f"SUCCESS: Logged in as '{username}'!")
            connected = True
            break
        except Exception as e:
            safe_print(f"Failed login as '{username}': {e}")
            if ftp:
                try:
                    ftp.close()
                except:
                    pass
            
    if not connected or not ftp:
        safe_print("\nERROR: No se pudo iniciar sesión con ninguna de las variantes de usuario.")
        sys.exit(1)
        
    try:
        # Check current working directory
        cwd = ftp.pwd()
        safe_print(f"Current remote directory: {cwd}")
        
        # Get list of files in the current folder
        remote_files = []
        try:
            remote_files = ftp.nlst()
            safe_print(f"Remote folder contents: {remote_files}")
        except Exception as err:
            safe_print(f"Could not list directory: {err}")
            
        # Navigate to public_html only if we are not already in it or if it exists in the list
        if "public_html" in remote_files:
            safe_print(f"Navigating to remote directory: {remote_base}")
            ftp.cwd(remote_base)
        else:
            safe_print("Uploading directly to current directory since 'public_html' is not a subfolder (likely chrooted).")
        
        # Start recursive upload of items in local dist
        safe_print("\nStarting upload...")
        for item in os.listdir(local_dist):
            upload_item(ftp, os.path.join(local_dist, item), ftp.pwd())
            
        safe_print("\nSUCCESS: All files successfully uploaded to Hostinger!")
        ftp.quit()
        
    except Exception as e:
        safe_print(f"\nERROR: Ocurrió un fallo durante la transferencia de archivos: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
