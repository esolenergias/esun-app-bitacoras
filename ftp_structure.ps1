$ftpHost = "ftp://esolenergias.com"
$ftpUser  = "u821937813.esolenergias.com"
$ftpPass  = "h+[g5P./*yW5Prd"

function ListDir($uri) {
    $req = [System.Net.FtpWebRequest]::Create($uri)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $req.UsePassive = $true; $req.UseBinary = $true; $req.KeepAlive = $false
    $resp = $req.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $out = $reader.ReadToEnd(); $reader.Close(); $resp.Close()
    return $out
}

Write-Host "=== FTP ROOT / (web root real) ==="
Write-Host (ListDir "$ftpHost/")

Write-Host "`n=== /assets/ ==="
try { Write-Host (ListDir "$ftpHost/assets/") } catch { Write-Host "No existe" }

Write-Host "`n=== /public_html/ (subcarpeta NO usada como web root) ==="
try { Write-Host (ListDir "$ftpHost/public_html/") } catch { Write-Host "No existe" }

Write-Host "`n=== /public_html/assets/ ==="
try { Write-Host (ListDir "$ftpHost/public_html/assets/") } catch { Write-Host "No existe" }
