$ftpHost = "ftp://esolenergias.com"
$ftpUser  = "u821937813.esolenergias.com"
$ftpPass  = "h+[g5P./*yW5Prd"

function FtpRequest($uri, $method) {
    $req = [System.Net.FtpWebRequest]::Create($uri)
    $req.Method = $method
    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $req.UsePassive = $true
    $req.UseBinary  = $true
    $req.KeepAlive  = $false
    return $req
}

function SetPermissions($uri, $chmod) {
    try {
        $req = FtpRequest $uri "SITE CHMOD $chmod"
        $resp = $req.GetResponse()
        Write-Host "  chmod $chmod -> $($resp.StatusDescription)"
        $resp.Close()
    } catch { Write-Host "  chmod error: $_" }
}

# List parent directory to understand full FTP structure
Write-Host "=== FTP Root ==="
$req = FtpRequest "$ftpHost/" [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
$resp = $req.GetResponse()
$reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
Write-Host $reader.ReadToEnd()
$reader.Close()
$resp.Close()

Write-Host "`n=== Setting permissions on assets folder and files ==="
# Try chmod 755 on assets directory and 644 on files
$req2 = [System.Net.FtpWebRequest]::Create("$ftpHost/public_html/assets/")
$req2.Method = "SITE CHMOD 755 /public_html/assets"
$req2.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
$req2.UsePassive = $true
try { $r = $req2.GetResponse(); Write-Host $r.StatusDescription; $r.Close() } catch { Write-Host "chmod attempt: $_" }
