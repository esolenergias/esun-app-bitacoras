package com.example.utils

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.os.Environment
import android.widget.Toast
import com.example.data.database.BitacoraEntity
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object PdfReportGenerator {

    fun generateBitacoraPdf(context: Context, bitacora: BitacoraEntity): File? {
        try {
            val pdfDocument = PdfDocument()
            val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4 Size (595x842 pt)
            val page = pdfDocument.startPage(pageInfo)
            val canvas: Canvas = page.canvas

            val paint = Paint()
            val titlePaint = Paint()
            val headerPaint = Paint()

            // Header Background Bar
            paint.color = Color.parseColor("#0B2545") // ConnectedBlue / Dark Header
            canvas.drawRect(0f, 0f, 595f, 70f, paint)

            // Header Title
            titlePaint.color = Color.WHITE
            titlePaint.textSize = 20f
            titlePaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText("ESOL ENERGIAS - BITÁCORA DE OBRA", 30f, 42f, titlePaint)

            // Subtitle
            headerPaint.color = Color.parseColor("#EEF4F8")
            headerPaint.textSize = 10f
            canvas.drawText("Reporte Diario de Avance de Campo y Seguridad", 30f, 58f, headerPaint)

            // Details Block
            val textPaint = Paint().apply {
                color = Color.BLACK
                textSize = 11f
            }
            val boldPaint = Paint().apply {
                color = Color.parseColor("#0B2545")
                textSize = 11f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            }

            var y = 100f

            canvas.drawText("Proyecto / Frente:", 30f, y, boldPaint)
            canvas.drawText(bitacora.siteName, 160f, y, textPaint)
            y += 20f

            canvas.drawText("Fecha de Registro:", 30f, y, boldPaint)
            canvas.drawText(bitacora.date, 160f, y, textPaint)
            y += 20f

            canvas.drawText("Condición del Clima:", 30f, y, boldPaint)
            canvas.drawText(bitacora.weather, 160f, y, textPaint)
            y += 20f

            canvas.drawText("Personal Total en Obra:", 30f, y, boldPaint)
            canvas.drawText("${bitacora.crewCount} trabajadores", 160f, y, textPaint)
            y += 20f

            canvas.drawText("Concepto Vinculado:", 30f, y, boldPaint)
            canvas.drawText(bitacora.concepto_name ?: "General / No catalogado", 160f, y, textPaint)
            y += 25f

            // Line separator
            paint.color = Color.LTGRAY
            canvas.drawLine(30f, y, 565f, y, paint)
            y += 20f

            // Progress Section
            canvas.drawText("AVANCE FÍSICO Y FINANCIERO", 30f, y, boldPaint)
            y += 18f
            canvas.drawText("Avance Físico Registrado: ${bitacora.physicalProgress.toInt()}%", 30f, y, textPaint)
            y += 16f
            canvas.drawText("Avance Financiero Ejercido: $${bitacora.financialProgress} MXN", 30f, y, textPaint)
            y += 25f

            // Activities Section
            canvas.drawText("TRABAJOS Y ACTIVIDADES EJECUTADAS", 30f, y, boldPaint)
            y += 18f
            
            // Multi-line wrap for activities text
            val words = bitacora.description.split(" ")
            var line = ""
            for (word in words) {
                if (textPaint.measureText("$line $word") < 530f) {
                    line = "$line $word".trim()
                } else {
                    canvas.drawText(line, 30f, y, textPaint)
                    y += 15f
                    line = word
                }
            }
            if (line.isNotEmpty()) {
                canvas.drawText(line, 30f, y, textPaint)
                y += 25f
            }

            // Safety Section
            if (bitacora.safetyRemarks.isNotEmpty()) {
                canvas.drawText("OBSERVACIONES DE SEGURIDAD / INCIDENTES", 30f, y, boldPaint)
                y += 18f
                canvas.drawText(bitacora.safetyRemarks, 30f, y, textPaint)
                y += 25f
            }

            // Footer
            paint.color = Color.parseColor("#0B2545")
            canvas.drawRect(0f, 810f, 595f, 842f, paint)
            titlePaint.textSize = 9f
            canvas.drawText("Generado offline desde la app móvil ESun Bitácoras | EsolEnergías © ${SimpleDateFormat("yyyy", Locale.getDefault()).format(Date())}", 30f, 828f, titlePaint)

            pdfDocument.finishPage(page)

            // Save PDF File
            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val pdfDir = File(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "ESunBitacoraPDFs")
            if (!pdfDir.exists()) pdfDir.mkdirs()

            val pdfFile = File(pdfDir, "Bitacora_${bitacora.id}_${timeStamp}.pdf")
            val outputStream = FileOutputStream(pdfFile)
            pdfDocument.writeTo(outputStream)
            outputStream.close()
            pdfDocument.close()

            return pdfFile
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
}
