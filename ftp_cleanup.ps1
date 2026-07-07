$ftpHost = "ftp://esolenergias.com"
$ftpUser  = "u821937813.esolenergias.com"
$ftpPass  = "h+[g5P./*yW5Prd"

function ListNames($uri) {
    try {
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true; $req.UseBinary = $true; $req.KeepAlive = $false
        $resp = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $out = $reader.ReadToEnd(); $reader.Close(); $resp.Close()
        return $out -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
    } catch { return @() }
}

function DeleteFile($uri) {
    try {
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true; $req.KeepAlive = $false
        $resp = $req.GetResponse(); Write-Host "  Eliminado: $uri"; $resp.Close()
    } catch { Write-Host "  Error: $uri -> $_" }
}

function RemoveDir($uri) {
    try {
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::RemoveDirectory
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true; $req.KeepAlive = $false
        $resp = $req.GetResponse(); Write-Host "  Dir eliminado: $uri"; $resp.Close()
    } catch { Write-Host "  Dir error: $uri -> $_" }
}

Write-Host "=== Limpieza final de /public_html/ ===`n"

# Limpiar archivos restantes en Paneles intro
$paneles = ListNames "$ftpHost/public_html/Paneles intro/"
foreach ($f in $paneles) {
    $name = $f.Split("/")[-1]
    if ($name -and $name -ne "." -and $name -ne "..") {
        DeleteFile "$ftpHost/public_html/Paneles intro/$name"
    }
}
Start-Sleep -Milliseconds 500
RemoveDir "$ftpHost/public_html/Paneles intro"
Start-Sleep -Milliseconds 500
RemoveDir "$ftpHost/public_html"

Write-Host "`n=== Estado final del servidor ===`n"
$root = ListNames "$ftpHost/"
foreach ($item in $root) { Write-Host "  $item" }

Write-Host "`n✅ Servidor limpio."
