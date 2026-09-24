# Script para desplegar SDR Backend via FTP
$ftpHost   = "ftp://esolenergias.com"
$ftpUser   = "u821937813.esolenergias.com"
$ftpPass   = "h+[g5P./*yW5Prd"
$remoteDir = "$ftpHost/sdr_backend"

function MakeDir($uri) {
    try {
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true; $req.KeepAlive = $false
        $resp = $req.GetResponse(); $resp.Close()
        Write-Host "Directorio creado: $uri"
    } catch {
        # Puede fallar si ya existe
    }
}

function UploadFile($localFile, $remoteUri) {
    Write-Host "Subiendo: $(Split-Path $localFile -Leaf) -> $remoteUri"
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
    $resp.Close()
}

MakeDir $remoteDir
UploadFile "C:\Users\mafre\Esolenergias\sdr_backend\run_sdr_agent.mjs" "$remoteDir/run_sdr_agent.mjs"
UploadFile "C:\Users\mafre\Esolenergias\sdr_backend\package.json" "$remoteDir/package.json"
UploadFile "C:\Users\mafre\Esolenergias\sdr_backend\.env.example" "$remoteDir/.env"
Write-Host "Despliegue de SDR Backend completado exitosamente por FTP."
