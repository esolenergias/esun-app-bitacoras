$ftpHost = "ftp://esolenergias.com"
$ftpUser  = "u821937813.esolenergias.com"
$ftpPass  = "h+[g5P./*yW5Prd"

function ListDir($remoteUri) {
    try {
        $req = [System.Net.FtpWebRequest]::Create($remoteUri)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true
        $req.UseBinary  = $true
        $req.KeepAlive  = $false
        $resp = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $content = $reader.ReadToEnd()
        $reader.Close()
        $resp.Close()
        return $content
    } catch { return "ERROR: $_" }
}

Write-Host "=== /public_html/ ==="
ListDir "$ftpHost/public_html/"

Write-Host "`n=== /public_html/assets/ ==="
ListDir "$ftpHost/public_html/assets/"

Write-Host "`n=== /public_html/esol-cfe-manager/ ==="
ListDir "$ftpHost/public_html/esol-cfe-manager/"
