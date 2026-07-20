import os
import re

file_path = r'C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix corrupted strings
replacements = {
    "BITǭCORA": "BITÁCORA",
    "BIT?CORA": "BITÁCORA",
    "Pǭgina": "Página",
    "Cdigo": "Código",
    "Descripcin": "Descripción",
    "?": "...",
    "ESOL ENERG?AS": "ESOL ENERGÍAS",
    "ESOL ENERG?AS": "ESOL ENERGÍAS",
    "ESun Bitǭcora": "ESun Bitácora",
    "'": "•"
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

# Fix the logo drawing safely
logo_pattern = r'try \{\s*val logoBitmap = android\.graphics\.BitmapFactory.*?catch \(e: Exception\) \{.*?\}'
logo_replacement = """try {
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
        }"""

content = re.sub(logo_pattern, logo_replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed ReportScreen text and logo.")
