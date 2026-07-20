<?php
if (isset($_GET['url'])) {
    $url = $_GET['url'];
    // Validar que sea un enlace de drive
    if (strpos($url, 'drive.google.com') === false) {
        die("Invalid URL");
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $data = curl_exec($ch);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    header("Content-Type: " . $contentType);
    header("Access-Control-Allow-Origin: *");
    echo $data;
} else {
    echo "No URL provided";
}
?>
