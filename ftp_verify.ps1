$ftpHost = "ftp://esolenergias.com"
$ftpUser  = "u821937813.esolenergias.com"
$ftpPass  = "h+[g5P./*yW5Prd"

# Download index.html from server to verify content
$req = [System.Net.FtpWebRequest]::Create("$ftpHost/public_html/index.html")
$req.Method = [System.Net.WebRequestMethods+Ftp]::DownloadFile
$req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
$req.UsePassive = $true
$req.UseBinary  = $false
$resp = $req.GetResponse()
$reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
$content = $reader.ReadToEnd()
$reader.Close()
$resp.Close()

Write-Host "=== index.html en servidor ==="
Write-Host $content
