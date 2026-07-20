const fs = require('fs');
let code = fs.readFileSync('esun-bitácoras/app/src/main/java/com/example/ui/screens/ReportScreen.kt', 'utf8');

const regex = /if \(bitmap != null\) \{[\s\S]*?if \(bitmap != highResBitmap\) bitmap\.recycle\(\)\s*\}/;

const replacement = `if (bitmap != null) {
                                  // 1. Fix EXIF orientation
                                  var rotatedBitmap = bitmap
                                  try {
                                      var orientation = android.media.ExifInterface.ORIENTATION_NORMAL
                                      if (photoPath.startsWith("content://")) {
                                          context.contentResolver.openInputStream(android.net.Uri.parse(photoPath))?.use {
                                              orientation = android.media.ExifInterface(it).getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION, android.media.ExifInterface.ORIENTATION_NORMAL)
                                          }
                                      } else if (!photoPath.startsWith("http")) {
                                          orientation = android.media.ExifInterface(photoPath).getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION, android.media.ExifInterface.ORIENTATION_NORMAL)
                                      }
                                      val matrix = android.graphics.Matrix()
                                      when (orientation) {
                                          android.media.ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                                          android.media.ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                                          android.media.ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                                      }
                                      if (!matrix.isIdentity) {
                                          rotatedBitmap = android.graphics.Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                                      }
                                  } catch (e: Exception) { }

                                  // 2. High Res Scaling
                                  val scaledW = 800
                                  val scaledH = (rotatedBitmap.height * (800f / rotatedBitmap.width)).toInt()
                                  val highResBitmap = android.graphics.Bitmap.createScaledBitmap(rotatedBitmap, scaledW, scaledH, true)

                                  // 3. Dynamic Aspect Ratio box for PDF
                                  val imgY = textY + 6f
                                  val maxW = 180f
                                  val maxH = 180f
                                  val ratio = highResBitmap.width.toFloat() / highResBitmap.height.toFloat()
                                  
                                  val drawW: Float
                                  val drawH: Float
                                  if (ratio > 1f) {
                                      drawW = maxW
                                      drawH = maxW / ratio
                                  } else {
                                      drawH = maxH
                                      drawW = maxH * ratio
                                  }
                                  
                                  val imgRect = android.graphics.RectF(margin + 12f, imgY, margin + 12f + drawW, imgY + drawH)
                                  canvas.drawRoundRect(imgRect, 4f, 4f, paintBorder)
                                  
                                  canvas.drawBitmap(
                                      highResBitmap,
                                      null,
                                      imgRect,
                                      null
                                  )
                                  
                                  highResBitmap.recycle()
                                  if (rotatedBitmap != bitmap && rotatedBitmap != highResBitmap) rotatedBitmap.recycle()
                                  if (bitmap != highResBitmap && bitmap != rotatedBitmap) bitmap.recycle()
                              }`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('esun-bitácoras/app/src/main/java/com/example/ui/screens/ReportScreen.kt', code);
    console.log('Regex replace success');
} else {
    console.log('Regex fail');
}
