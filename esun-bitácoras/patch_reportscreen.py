import codecs

path = r"C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt"
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

target = '''            // Load Image
            if (!bit.photoUri.isNullOrEmpty()) {
                // Determine Drive ID
                val p1 = "/file/d/([a-zA-Z0-9_-]+)".toRegex()
                val p2 = "[?&]id=([a-zA-Z0-9_-]+)".toRegex()
                val p3 = "/open\\?id=([a-zA-Z0-9_-]+)".toRegex()
                val match = p1.find(bit.photoUri) ?: p2.find(bit.photoUri) ?: p3.find(bit.photoUri)
                
                var bMap: Bitmap? = null
                if (match != null && match.groupValues.size > 1) {
                    val id = match.groupValues[1]
                    val thumbUrl = "https://drive.google.com/thumbnail?id=$id&sz=w600"
                    try {
                        val stream = URL(thumbUrl).openStream()
                        bMap = BitmapFactory.decodeStream(stream)
                    } catch (e: Exception) { e.printStackTrace() }
                }

                if (bMap != null) {
                    if (y + 160f > pageHeight - margin) {
                        pdf.finishPage(page)
                        pageNumber++
                        val next = newPage(pageNumber)
                        page = next.first; canvas = next.second
                        y = margin + 20f
                    }
                    // Draw Image 200x150
                    val targetW = 200f
                    val targetH = 150f
                    val scale = Math.max(targetW / bMap.width, targetH / bMap.height)
                    val scaledMap = Bitmap.createScaledBitmap(bMap, (bMap.width * scale).toInt(), (bMap.height * scale).toInt(), true)
                    
                    canvas.drawRoundRect(RectF(margin, y, margin + targetW, y + targetH), 6f, 6f, Paint().apply { color = border1Color })
                    canvas.drawBitmap(scaledMap, margin, y, null)
                    scaledMap.recycle()
                    if(bMap != scaledMap) bMap.recycle()
                    y += targetH + 10f
                }
            }'''

replace = '''            // Load Images
            if (!bit.photoUri.isNullOrEmpty()) {
                val uris = bit.photoUri.split(",")
                var imgX = margin
                var rowMaxH = 0f
                var imagesInRow = 0
                
                uris.forEach { rawUri ->
                    val uri = rawUri.trim()
                    if (uri.isEmpty()) return@forEach
                    
                    var bMap: Bitmap? = null
                    
                    if (uri.startsWith("content://") || uri.startsWith("file://")) {
                        try {
                            val stream = context.contentResolver.openInputStream(android.net.Uri.parse(uri))
                            if (stream != null) {
                                bMap = BitmapFactory.decodeStream(stream)
                                stream.close()
                            }
                        } catch (e: Exception) { e.printStackTrace() }
                    } else {
                        // Assume Google Drive or direct HTTP
                        val p1 = "/file/d/([a-zA-Z0-9_-]+)".toRegex()
                        val p2 = "[?&]id=([a-zA-Z0-9_-]+)".toRegex()
                        val p3 = "/open\\\\?id=([a-zA-Z0-9_-]+)".toRegex()
                        val match = p1.find(uri) ?: p2.find(uri) ?: p3.find(uri)
                        
                        if (match != null && match.groupValues.size > 1) {
                            val id = match.groupValues[1]
                            val thumbUrl = "https://drive.google.com/thumbnail?id=$id&sz=w600"
                            try {
                                val stream = URL(thumbUrl).openStream()
                                bMap = BitmapFactory.decodeStream(stream)
                                stream.close()
                            } catch (e: Exception) { e.printStackTrace() }
                        } else if (uri.startsWith("http")) {
                            try {
                                val stream = URL(uri).openStream()
                                bMap = BitmapFactory.decodeStream(stream)
                                stream.close()
                            } catch (e: Exception) { e.printStackTrace() }
                        }
                    }
                    
                    if (bMap != null) {
                        val targetW = 120f
                        val targetH = 90f
                        
                        if (imgX + targetW > pageWidth - margin) {
                            imgX = margin
                            y += rowMaxH + 10f
                            rowMaxH = 0f
                            imagesInRow = 0
                        }
                        
                        if (y + targetH > pageHeight - margin) {
                            pdf.finishPage(page)
                            pageNumber++
                            val next = newPage(pageNumber)
                            page = next.first
                            canvas = next.second
                            y = margin + 20f
                            imgX = margin
                            rowMaxH = 0f
                            imagesInRow = 0
                        }
                        
                        val scale = Math.max(targetW / bMap.width.toFloat(), targetH / bMap.height.toFloat())
                        val scaledW = (bMap.width * scale).toInt()
                        val scaledH = (bMap.height * scale).toInt()
                        
                        if (scaledW > 0 && scaledH > 0) {
                            val scaledMap = Bitmap.createScaledBitmap(bMap, scaledW, scaledH, true)
                            
                            // Rect for cropping the center
                            val srcRect = android.graphics.Rect(
                                ((scaledMap.width - targetW) / 2).toInt().coerceAtLeast(0),
                                ((scaledMap.height - targetH) / 2).toInt().coerceAtLeast(0),
                                ((scaledMap.width + targetW) / 2).toInt().coerceAtMost(scaledMap.width),
                                ((scaledMap.height + targetH) / 2).toInt().coerceAtMost(scaledMap.height)
                            )
                            val destRect = RectF(imgX, y, imgX + targetW, y + targetH)
                            
                            canvas.drawRoundRect(destRect, 4f, 4f, Paint().apply { color = border1Color })
                            canvas.drawBitmap(scaledMap, srcRect, destRect, null)
                            
                            scaledMap.recycle()
                        }
                        if (bMap != null && !bMap.isRecycled) {
                            bMap.recycle()
                        }
                        
                        imgX += targetW + 10f
                        if (targetH > rowMaxH) rowMaxH = targetH
                        imagesInRow++
                    }
                }
                if (imagesInRow > 0) {
                    y += rowMaxH + 10f
                }
            }'''

if target in content:
    content = content.replace(target, replace)
    with codecs.open(path, 'w', 'utf-8') as f:
        f.write(content)
    print("ReportScreen patched")
else:
    print("Target not found")
