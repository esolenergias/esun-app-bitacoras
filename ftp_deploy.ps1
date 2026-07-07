# ============================================================
# ESOL Energias - Script de Deploy a Hostinger
# ============================================================
# HOST FTP  : ftp://esolenergias.com
# USUARIO   : u821937813.esolenergias.com
# CONTRASEÑA: h+[g5P./*yW5Prd
# WEB ROOT  : / (raiz FTP = public web root de esolenergias.com)
#             IMPORTANTE: /public_html/ NO es el web root, no usar.
# ============================================================
# USO: powershell -ExecutionPolicy Bypass -File ftp_deploy.ps1
# ============================================================

param(
    [switch]$Full  # Usar -Full para subir todos los archivos dist/
)

$ftpHost   = "ftp://esolenergias.com"
$ftpUser   = "u821937813.esolenergias.com"
$ftpPass   = "h+[g5P./*yW5Prd"
$webRoot   = ""   # FTP root = web root (NO usar /public_html/)
$localDist = "dist"

function UploadFile($localFile, $remoteUri) {
    Write-Host "  Subiendo: $(Split-Path $localFile -Leaf) -> $remoteUri"
    $req = [System.Net.FtpWebRequest]::Create($remoteUri)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $req.UsePassive = $true; $req.UseBinary = $true; $req.KeepAlive = $false
    $content = [System.IO.File]::ReadAllBytes($localFile)
    $req.ContentLength = $content.Length
    $stream = $req.GetRequestStream()
    $stream.Write($content, 0, $content.Length)
    $stream.Close()
    $resp = $req.GetResponse()
    Write-Host "    OK [$($content.Length) bytes]"
    $resp.Close()
}

function MakeDir($uri) {
    try {
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true; $req.KeepAlive = $false
        $resp = $req.GetResponse(); $resp.Close()
    } catch {}
}

# Build primero
Write-Host "=== Build de produccion ===`n"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Build fallo. Abortando deploy."; exit 1 }

# Obtener nombres de assets generados por Vite (hash dinamico)
$jsFile  = Get-ChildItem "$localDist\assets\*.js"  | Select-Object -First 1
$cssFile = Get-ChildItem "$localDist\assets\*.css" | Select-Object -First 1

Write-Host "`n=== Deploy a esolenergias.com ===`n"
Write-Host "  JS  : $($jsFile.Name)"
Write-Host "  CSS : $($cssFile.Name)`n"

if ($Full) {
    # ── Deploy completo (primera vez o cambios en imagenes/estaticos) ──
    Write-Host "Modo: COMPLETO`n"
    $allFiles = Get-ChildItem -Path $localDist -Recurse -File
    $total = $allFiles.Count; $i = 0
    foreach ($file in $allFiles) {
        $i++
        $rel = $file.FullName.Substring((Resolve-Path $localDist).Path.Length).Replace("\", "/")
        $remoteFile = "$ftpHost$webRoot$rel"
        $remoteDir  = "$ftpHost$webRoot" + ($rel | Split-Path -Parent).Replace("\", "/")
        MakeDir $remoteDir
        Write-Host "[$i/$total]"
        UploadFile $file.FullName $remoteFile
    }
} else {
    # ── Deploy parcial (solo JS, CSS e index.html cambiados por Vite) ──
    Write-Host "Modo: PARCIAL (solo archivos cambiados)`n"
    MakeDir "$ftpHost/assets"
    UploadFile "$localDist\index.html"      "$ftpHost/index.html"
    UploadFile "$localDist\.htaccess"       "$ftpHost/.htaccess"
    UploadFile $jsFile.FullName             "$ftpHost/assets/$($jsFile.Name)"
    UploadFile $cssFile.FullName            "$ftpHost/assets/$($cssFile.Name)"

    # Limpiar assets viejos con diferente hash
    Write-Host "`n  Limpiando assets obsoletos..."
    $remoteAssets = @()
    try {
        $req = [System.Net.FtpWebRequest]::Create("$ftpHost/assets/")
        $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true; $req.UseBinary = $true; $req.KeepAlive = $false
        $resp = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $remoteAssets = $reader.ReadToEnd() -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim().Split("/")[-1] }
        $reader.Close(); $resp.Close()
    } catch {}

    $keepNames = @($jsFile.Name, $cssFile.Name)
    foreach ($f in $remoteAssets) {
        if ($f -match "^index-.*\.(js|css)$" -and $keepNames -notcontains $f) {
            try {
                $delReq = [System.Net.FtpWebRequest]::Create("$ftpHost/assets/$f")
                $delReq.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
                $delReq.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                $delReq.UsePassive = $true; $delReq.KeepAlive = $false
                $delResp = $delReq.GetResponse()
                Write-Host "    Eliminado obsoleto: $f"
                $delResp.Close()
            } catch {}
        }
    }
}

Write-Host "`n✅ Deploy completo -> esolenergias.com"
