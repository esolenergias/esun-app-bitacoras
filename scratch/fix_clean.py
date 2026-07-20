import os
import re

file_path = r'C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Map Menyfre
name_pattern = r'val residenteReal = projectDetails\["residente"\] \?\: userName'
name_replacement = """var residenteReal = projectDetails["residente"] ?: userName
                            var safeUserName = userName
                            if (safeUserName.contains("Menyfre", ignoreCase = true) || safeUserName.contains("Meny", ignoreCase = true)) {
                                safeUserName = "Manuel Fregoso"
                            }
                            if (residenteReal.contains("Menyfre", ignoreCase = true) || residenteReal.contains("Meny", ignoreCase = true)) {
                                residenteReal = "Manuel Fregoso"
                            }"""
code = code.replace(name_pattern, name_replacement)

generate_pattern = r'generatePdfReport\(\s*context = context,\s*fileName = fileName,\s*projectName = activeProjectName,\s*reporterName = userName,\s*bitacoras = bitacoras,'
generate_replacement = """generatePdfReport(
                                    context = context,
                                    fileName = fileName,
                                    projectName = activeProjectName,
                                    reporterName = safeUserName,
                                    bitacoras = bitacoras,"""
code = re.sub(generate_pattern, generate_replacement, code)

# 2. Add Logo logic where "REPORTE OFICIAL" is drawn
# In the original file, it was:
# canvas.drawText("REPORTE OFICIAL", pageWidth - margin, y, Paint(paintGoldFill).apply { textSize = 10f; typeface = bodyBoldFont; textAlign = Paint.Align.RIGHT })
# canvas.drawText("BITÁCORA DE OBRA", pageWidth - margin, y + 20f, Paint(paintTextMain)...
logo_pattern = r'(canvas\.drawText\("REPORTE OFICIAL", [^\n]+\n\s*)(canvas\.drawText\("BITÁCORA DE OBRA")'
logo_replacement = r"""\1// Logo ESOL
        try {
            val drawable = androidx.core.content.ContextCompat.getDrawable(context, com.example.R.drawable.logo_esol_b)
            if (drawable != null) {
                val targetHeight = 40f
                val aspectRatio = drawable.intrinsicWidth.toFloat() / drawable.intrinsicHeight.toFloat()
                val targetWidth = targetHeight * aspectRatio
                drawable.setBounds(margin.toInt(), margin.toInt(), (margin + targetWidth).toInt(), (margin + targetHeight).toInt())
                drawable.draw(canvas)
            } else {
                throw Exception("Null drawable")
            }
        } catch (e: Exception) {
            canvas.drawText("ESOL ENERGÍAS", margin, margin + 25f, Paint(paintTextMain).apply { textSize = 14f; typeface = titleFont; color = android.graphics.Color.parseColor("#C49825") })
        }
        
        \2"""
code = re.sub(logo_pattern, logo_replacement, code)

# 3. Add Image EXIF and scaling
img_pattern = r'if \(bitmap != null\) \{\s*val imgY = textY \+ 6f\s*val imgRect = android\.graphics\.RectF\(margin \+ 12f, imgY, margin \+ 12f \+ 160f, imgY \+ 90f\).*?if \(bitmap != highResBitmap\) bitmap\.recycle\(\)\s*\}'

img_replacement = """if (bitmap != null) {
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
                              }"""

code = re.sub(img_pattern, img_replacement, code, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Applied 3 fixes cleanly!")
