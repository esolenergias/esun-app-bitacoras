$ftpHost = "ftp://82.29.81.191"
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

Write-Host "=== / ==="
ListDir "$ftpHost/"

Write-Host "`n=== /assets/ ==="
ListDir "$ftpHost/assets/"
