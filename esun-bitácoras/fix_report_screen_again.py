import sys
import re

file_path = r'app/src/main/java/com/example/ui/screens/ReportScreen.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix duplicated pdfButtonText
content = content.replace('''    var generatedReports by remember { mutableStateOf<List<java.io.File>>(emptyList()) }
    var pdfButtonText by remember { mutableStateOf("Generar Reporte PDF") }
    var pdfButtonColor by remember { mutableStateOf(ConnectedBlue) }

    LaunchedEffect(Unit) {
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            val pdfDir = java.io.File(context.cacheDir, "pdfs")
            if (pdfDir.exists()) {
                val files = pdfDir.listFiles()?.filter { it.extension == "pdf" }?.sortedByDescending { it.lastModified() } ?: emptyList()
                generatedReports = files
            }
        }
    }
    var pdfButtonText by remember { mutableStateOf("Generar Reporte PDF") }
    var pdfButtonColor by remember { mutableStateOf(ConnectedBlue) }''', '''    var generatedReports by remember { mutableStateOf<List<java.io.File>>(emptyList()) }
    var pdfButtonText by remember { mutableStateOf("Generar Reporte PDF") }
    var pdfButtonColor by remember { mutableStateOf(ConnectedBlue) }

    LaunchedEffect(Unit) {
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            val pdfDir = java.io.File(context.cacheDir, "pdfs")
            if (pdfDir.exists()) {
                val files = pdfDir.listFiles()?.filter { it.extension == "pdf" }?.sortedByDescending { it.lastModified() } ?: emptyList()
                generatedReports = files
            }
        }
    }''')

# 2. Fix generatePdfReport call and success handling
old_pdf_call = '''                            val success = withContext(Dispatchers.IO) {
                                generatePdfReport(
                                    context = context,
                                    fileName = fileName,
                                    projectName = activeProjectName,
                                    reporterName = userName,
                                    bitacoras = bitacoras,
                                    budgetItems = budgetItems,
                                    totalBudget = totalProjectBudget,
                                    totalExecuted = totalCostExecuted,
                                    physicalProgress = overallPhysicalProgress
                                )
                            }

                            if (success) {
                                generatedReports = listOf(fileName to displayDate) + generatedReports
                                pdfButtonText = "Completado ✅"
                                pdfButtonColor = SuccessGreen
                                viewModel.simulatePushNotification(
                                    title = "Reporte PDF Generado",
                                    body = "El archivo '$fileName' fue guardado en Descargas/ESunBitacora.",
                                    type = "SYNC"
                                )
                                Toast.makeText(context, "PDF guardado en Descargas/ESunBitacora", Toast.LENGTH_LONG).show()
                            } else {
                                pdfButtonText = "Error al generar"
                                pdfButtonColor = WarningRed
                                Toast.makeText(context, "Error al generar el PDF", Toast.LENGTH_SHORT).show()
                            }'''
new_pdf_call = '''                            val file = withContext(Dispatchers.IO) {
                                generatePdfReport(context, fileName, activeProjectName, userName, supervisorName, bitacoras, budgetItems, totalProjectBudget, totalCostExecuted, overallPhysicalProgress)
                            }

                            if (file != null) {
                                generatedReports = listOf(file) + generatedReports
                                pdfButtonText = "Completado ✓"
                                pdfButtonColor = SuccessGreen
                                viewModel.simulatePushNotification(
                                    title = "Reporte PDF Generado",
                                    body = "El archivo '$fileName' fue guardado.",
                                    type = "SYNC"
                                )
                            } else {
                                pdfButtonText = "Error al generar"
                                pdfButtonColor = WarningRed
                            }'''
content = content.replace(old_pdf_call, new_pdf_call)

# 3. Fix CuadrillaTelemetryCard calls
old_cuadrilla_calls = '''                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        CuadrillaTelemetryCard(
                            title = "Retraso en Instalación A-12",
                            desc = "Falta de pernería estructural en sitio reportada.",
                            time = "5 min",
                            icon = Icons.Default.Warning,
                            iconColor = androidx.compose.ui.graphics.Color(0xFFEA580C),
                            bgColor = androidx.compose.ui.graphics.Color(0xFFFFF7ED)
                        )
                        CuadrillaTelemetryCard(
                            title = "Check-in: Cuadrilla #02",
                            desc = "Llegada a Zona Norte confirmada via GPS.",
                            time = "12 min",
                            icon = Icons.Default.CheckCircle,
                            iconColor = SuccessGreen,
                            bgColor = SuccessGreenBg
                        )
                        CuadrillaTelemetryCard(
                            title = "Bitácora Firmada",
                            desc = "Supervisor J. Pérez validó el avance jornada anterior.",
                            time = "45 min",
                            icon = Icons.Default.Description,
                            iconColor = ConnectedBlue,
                            bgColor = androidx.compose.ui.graphics.Color(0xFFEFF6FF)
                        )
                        CuadrillaTelemetryCard(
                            title = "Alerta de Clima",
                            desc = "Vientos > 40km/h detectados. Se recomienda precaución en izajes.",
                            time = "1 hora",
                            icon = Icons.Default.Air,
                            iconColor = androidx.compose.ui.graphics.Color(0xFF3B82F6),
                            bgColor = androidx.compose.ui.graphics.Color(0xFFEFF6FF)
                        )
                    }'''
new_cuadrilla_calls = '''                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        CuadrillaTelemetryCard("Retraso en Instalación A-12", "Falta de pernería estructural en sitio reportada.", "5 min", Icons.Default.Warning, androidx.compose.ui.graphics.Color(0xFFEA580C), androidx.compose.ui.graphics.Color(0xFFFFF7ED))
                        CuadrillaTelemetryCard("Check-in: Cuadrilla #02", "Llegada a Zona Norte confirmada via GPS.", "12 min", Icons.Default.CheckCircle, SuccessGreen, SuccessGreenBg)
                        CuadrillaTelemetryCard("Bitácora Firmada", "Supervisor J. Pérez validó el avance jornada anterior.", "45 min", Icons.Default.Description, ConnectedBlue, androidx.compose.ui.graphics.Color(0xFFEFF6FF))
                        CuadrillaTelemetryCard("Alerta de Clima", "Vientos > 40km/h detectados. Se recomienda precaución en izajes.", "1 hora", Icons.Default.Air, androidx.compose.ui.graphics.Color(0xFF3B82F6), androidx.compose.ui.graphics.Color(0xFFEFF6FF))
                    }'''
content = content.replace(old_cuadrilla_calls, new_cuadrilla_calls)

# 4. Fix History List rendering
old_history = '''                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            generatedReports.forEachIndexed { index, (name, date) ->
                                val reportId = "#R-${9000 + index}"
                                ReportHistoryItem(
                                    id = reportId,
                                    type = "Reporte General",
                                    date = date,
                                    author = userName.ifEmpty { "Sistema" },
                                    status = "DISPONIBLE",
                                    onDownload = {
                                        // Abrir el PDF guardado
                                        val intent = Intent(Intent.ACTION_VIEW).apply {
                                            setDataAndType(
                                                android.net.Uri.parse("content://com.android.externalstorage.documents/document/primary:Download%2FESunBitacora%2F$name"),
                                                "application/pdf"
                                            )
                                            flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                                        }
                                        try { context.startActivity(intent) } catch (e: Exception) {
                                            Toast.makeText(context, "Abre la carpeta Descargas/ESunBitacora", Toast.LENGTH_LONG).show()
                                        }
                                    }
                                )
                            }
                        }'''
new_history = '''                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            generatedReports.forEachIndexed { index, fileItem ->
                                val reportId = "#R-${9000 + index}"
                                val name = fileItem.name
                                val date = java.text.SimpleDateFormat("dd/MM/yyyy", java.util.Locale("es", "MX")).format(java.util.Date(fileItem.lastModified()))
                                ReportHistoryItem(
                                    id = reportId,
                                    type = "Reporte General",
                                    date = date,
                                    author = name.substringAfterLast("_").removeSuffix(".pdf").uppercase(),
                                    status = "DISPONIBLE",
                                    onDelete = if (userRole == "Supervisor" || userRole == "Master") {
                                        {
                                            fileItem.delete()
                                            val pdfDir = java.io.File(context.cacheDir, "pdfs")
                                            generatedReports = pdfDir.listFiles()?.filter { it.extension == "pdf" }?.sortedByDescending { it.lastModified() } ?: emptyList()
                                        }
                                    } else null,
                                    onDownload = {
                                        val pdfFile = java.io.File(context.cacheDir, "pdfs/$name")
                                        if (pdfFile.exists()) {
                                            val uri = androidx.core.content.FileProvider.getUriForFile(context, "${context.packageName}.provider", pdfFile)
                                            val intent = Intent(Intent.ACTION_VIEW).apply {
                                                setDataAndType(uri, "application/pdf")
                                                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                            }
                                            try { context.startActivity(intent) } catch (e: Exception) {
                                                Toast.makeText(context, "No hay visor de PDF instalado", Toast.LENGTH_SHORT).show()
                                            }
                                        } else {
                                            Toast.makeText(context, "Archivo no encontrado", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    onShare = {
                                        val pdfFile = java.io.File(context.cacheDir, "pdfs/$name")
                                        if (pdfFile.exists()) {
                                            val uri = androidx.core.content.FileProvider.getUriForFile(context, "${context.packageName}.provider", pdfFile)
                                            val intent = Intent(Intent.ACTION_SEND).apply {
                                                type = "application/pdf"
                                                putExtra(Intent.EXTRA_STREAM, uri)
                                                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                            }
                                            context.startActivity(Intent.createChooser(intent, "Compartir reporte con..."))
                                        }
                                    }
                                )
                            }
                        }'''
content = content.replace(old_history, new_history)

# 5. Fix generatePdfReport function entirely
import re
generate_pdf_regex = re.compile(r'fun generatePdfReport\(.*?\): Boolean \{.*?\n}\n\ndata class MonthChartData', re.DOTALL)

new_generate_pdf = '''fun generatePdfReport(
    context: android.content.Context,
    fileName: String,
    projectName: String,
    reporterName: String,
    residenteName: String,
    bitacoras: List<BitacoraEntity>,
    budgetItems: List<BudgetItemEntity>,
    totalBudget: Double,
    totalExecuted: Double,
    physicalProgress: Double
): java.io.File? {
    return try {
        val pdf = PdfDocument()
        val pageWidth = 595
        val pageHeight = 842
        val margin = 40f
        var y = margin + 20f

        val paintBg = Paint().apply { color = Color.parseColor("#F8F7F2") }
        val paintCard = Paint().apply { color = Color.WHITE }
        val paintBorder = Paint().apply { color = Color.parseColor("#D5D4C7"); strokeWidth = 1f; style = Paint.Style.STROKE }
        val paintGold = Paint().apply { color = Color.parseColor("#C49825") }
        val paintGoldFill = Paint().apply { color = Color.parseColor("#C49825") }
        val paintTextMain = Paint().apply { color = Color.parseColor("#141410") }
        val paintTextMuted = Paint().apply { color = Color.parseColor("#6A6A5E") }
        
        val titleFont = Typeface.create(Typeface.SERIF, Typeface.BOLD)
        val bodyFont = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
        val bodyBoldFont = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)

        val paintH2 = Paint(paintTextMain).apply { textSize = 14f; typeface = titleFont }
        val paintValue = Paint(paintTextMain).apply { textSize = 12f; typeface = bodyBoldFont }
        val paintLabel = Paint(paintTextMuted).apply { textSize = 8f; typeface = bodyBoldFont }
        val paintDesc = Paint(paintTextMain).apply { textSize = 9f; typeface = bodyFont; color = Color.parseColor("#3F3F37") }
        val paintFooter = Paint(paintTextMuted).apply { textSize = 8f; typeface = bodyBoldFont }

        var pageNumber = 1
        var pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber).create()
        var page = pdf.startPage(pageInfo)
        var canvas = page.canvas

        fun newPage(num: Int): Pair<PdfDocument.Page, Canvas> {
            val pInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, num).create()
            val p = pdf.startPage(pInfo)
            val c = p.canvas
            c.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), paintBg)
            return p to c
        }

        canvas.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), paintBg)

        canvas.drawText("REPORTE OFICIAL", pageWidth - margin, y, Paint(paintGoldFill).apply { textSize = 10f; typeface = bodyBoldFont; textAlign = Paint.Align.RIGHT })
        canvas.drawText("BITÁCORA DE OBRA", pageWidth - margin, y + 20f, Paint(paintTextMain).apply { textSize = 18f; typeface = titleFont; textAlign = Paint.Align.RIGHT })

        y += 80f
        canvas.drawRoundRect(android.graphics.RectF(margin, y, pageWidth - margin, y + 60f), 8f, 8f, paintCard)
        canvas.drawRoundRect(android.graphics.RectF(margin, y, pageWidth - margin, y + 60f), 8f, 8f, paintBorder)
        canvas.drawText("NOMBRE DEL PROYECTO", margin + 15f, y + 20f, paintLabel)
        canvas.drawText(projectName, margin + 15f, y + 35f, paintValue)
        y += 80f

        canvas.drawText("CONTROL DE GESTIÓN", margin, y, paintH2)
        y += 20f
        val wCard = (pageWidth - margin * 2 - 30f) / 4
        val metrics = listOf("AVANCE" to "${"%.1f".format(physicalProgress)}%", "PRESUPUESTO" to "\$${String.format("%,.0f", totalBudget)}", "GASTO" to "\$${String.format("%,.0f", totalExecuted)}", "REMANENTE" to "\$${String.format("%,.0f", totalBudget - totalExecuted)}")
        metrics.forEachIndexed { i, m ->
            val cx = margin + i * (wCard + 10f)
            canvas.drawRoundRect(android.graphics.RectF(cx, y, cx + wCard, y + 40f), 4f, 4f, paintCard)
            canvas.drawText(m.first, cx + 10f, y + 15f, paintLabel)
            canvas.drawText(m.second, cx + 10f, y + 30f, paintValue)
        }
        y += 70f

        canvas.drawText("REGISTROS OPERATIVOS", margin, y, paintH2)
        y += 20f

        if (bitacoras.isNotEmpty()) {
            bitacoras.take(15).forEach { bit ->
                if (y > pageHeight - 140f) {
                    pdf.finishPage(page)
                    pageNumber++
                    val next = newPage(pageNumber)
                    page = next.first; canvas = next.second
                    canvas.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), paintBg)
                    y = margin + 20f
                }

                canvas.drawRoundRect(android.graphics.RectF(margin, y, pageWidth - margin, y + 25f), 4f, 4f, paintTextMain)
                canvas.drawText("${bit.date} • ${bit.siteName}", margin + 10f, y + 16f, Paint(paintH2).apply { color = Color.WHITE; textSize = 10f })
                y += 35f

                var pureDescription = bit.description
                if (pureDescription.contains("Supervisor a cargo:")) {
                    pureDescription = pureDescription.substringAfter("Supervisor a cargo:").substringAfter("\\n").trim()
                }
                
                val fullDescriptionText = "Reportado por: $reporterName\\nSupervisor a cargo: $residenteName\\n\\n" + pureDescription
                
                val maxChars = 75
                val lines = mutableListOf<String>()
                val rawLines = fullDescriptionText.split("\\n")
                
                for (rawLine in rawLines) {
                    val words = rawLine.split(" ")
                    var currentLine = ""
                    for (word in words) {
                        if ((currentLine + word).length > maxChars) {
                            lines.add(currentLine.trim())
                            currentLine = "$word "
                        } else {
                            currentLine += "$word "
                        }
                    }
                    if (currentLine.isNotBlank()) lines.add(currentLine.trim())
                }
                
                val contentHeight = 40f + (lines.size * 12f)

                canvas.drawRoundRect(android.graphics.RectF(margin, y, pageWidth - margin, y + contentHeight), 6f, 6f, paintCard)
                canvas.drawRoundRect(android.graphics.RectF(margin, y, pageWidth - margin, y + contentHeight), 6f, 6f, paintBorder)
                
                canvas.drawText("CLIMA: ${bit.weather.uppercase()}", margin + 12f, y + 18f, paintLabel)
                canvas.drawText("CUADRILLA: ${bit.crewCount} PAX", margin + 120f, y + 18f, paintLabel)

                var textY = y + 40f
                lines.forEach { lineText ->
                    canvas.drawText(lineText, margin + 12f, textY, paintDesc)
                    textY += 12f
                }

                y += contentHeight + 15f
            }
        }

        if (y > pageHeight - 120f) {
            pdf.finishPage(page)
            pageNumber++
            val next = newPage(pageNumber)
            page = next.first; canvas = next.second
            canvas.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), paintBg)
            y = margin + 20f
        }

        y += 40f
        canvas.drawText("VALIDACIÓN TÉCNICA", margin, y, paintH2)
        y += 40f

        val sigWidth = 160f
        canvas.drawLine(margin, y, margin + sigWidth, y, paintTextMain)
        canvas.drawText(residenteName.uppercase().ifEmpty { reporterName.uppercase() }, margin, y + 15f, paintValue)
        canvas.drawText("RESIDENTE DE OBRA (ELABORÓ)", margin, y + 25f, paintLabel)

        val sig2X = pageWidth - margin - sigWidth
        canvas.drawLine(sig2X, y, sig2X + sigWidth, y, paintTextMain)
        canvas.drawText("SUPERVISOR / CLIENTE", sig2X, y + 15f, paintValue)
        canvas.drawText("REVISÓ Y APROBÓ", sig2X, y + 25f, paintLabel)

        val footerY = pageHeight - 30f
        canvas.drawLine(margin, footerY - 10f, pageWidth - margin, footerY - 10f, paintBorder)
        canvas.drawText("ESOL ENERGÍAS | SISTEMA DE BITÁCORA", margin, footerY, paintFooter)
        canvas.drawText("PÁGINA $pageNumber", pageWidth - margin - 40f, footerY, paintFooter)

        pdf.finishPage(page)

        val pdfDir = java.io.File(context.cacheDir, "pdfs")
        if (!pdfDir.exists()) {
            pdfDir.mkdirs()
        }
        val file = java.io.File(pdfDir, fileName)
        
        java.io.FileOutputStream(file).use { outputStream ->
            pdf.writeTo(outputStream)
        }

        pdf.close()
        file
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

data class MonthChartData'''

content = generate_pdf_regex.sub(new_generate_pdf, content)

# 6. Fix CuadrillaTelemetryCard signature and implementation
cuadrilla_regex = re.compile(r'@Composable\nfun CuadrillaTelemetryCard\(\n.*?\) \{.*?\}\n\}', re.DOTALL)
new_cuadrilla_card = '''@Composable
fun CuadrillaTelemetryCard(title: String, desc: String, time: String, icon: androidx.compose.ui.graphics.vector.ImageVector, iconColor: androidx.compose.ui.graphics.Color, bgColor: androidx.compose.ui.graphics.Color) {
    Row(modifier = Modifier.fillMaxWidth().background(PureWhite, RoundedCornerShape(12.dp)).border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp)).padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
        Box(modifier = Modifier.size(36.dp).background(bgColor, RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
            Icon(imageVector = icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(18.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SlateDeep, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = time, fontWeight = FontWeight.Bold, fontSize = 9.sp, color = OnSurfaceVariant)
            }
            Text(text = desc, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = OnSurfaceVariant, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
        }
    }
}'''
content = cuadrilla_regex.sub(new_cuadrilla_card, content)

# 7. Fix ReportHistoryItem signature and implementation
history_item_regex = re.compile(r'@Composable\nfun ReportHistoryItem\(\n.*?\) \{.*?\}\n\}', re.DOTALL)
new_history_item = '''@Composable
fun ReportHistoryItem(
    id: String,
    type: String,
    date: String,
    author: String,
    status: String,
    onDelete: (() -> Unit)? = null,
    onDownload: () -> Unit,
    onShare: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(PureWhite, RoundedCornerShape(12.dp))
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(text = id, fontWeight = FontWeight.Black, color = OnSurfaceVariant, fontSize = 11.sp)
                Text(text = type, fontWeight = FontWeight.ExtraBold, color = SlateDeep, fontSize = 13.sp)
            }
            Text(text = "Fecha: $date  •  Por: $author", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = OnSurfaceVariant)
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .background(
                        if (status == "DISPONIBLE") SuccessGreenBg else LightGrayBg,
                        RoundedCornerShape(100.dp)
                    )
                    .border(
                        BorderStroke(1.dp, if (status == "DISPONIBLE") androidx.compose.ui.graphics.Color(0xFFD1FAE5) else SubtleOutline),
                        RoundedCornerShape(100.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = status,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Black,
                    color = if (status == "DISPONIBLE") androidx.compose.ui.graphics.Color(0xFF047857) else OnSurfaceVariant
                )
            }

            IconButton(
                onClick = onDownload,
                modifier = Modifier
                    .size(36.dp)
                    .background(LightGrayBg, RoundedCornerShape(100.dp))
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(100.dp))
            ) {
                Icon(
                    imageVector = Icons.Default.Visibility,
                    contentDescription = "Ver PDF",
                    tint = ConnectedBlue,
                    modifier = Modifier.size(16.dp)
                )
            }
            IconButton(
                onClick = onShare,
                modifier = Modifier
                    .size(36.dp)
                    .background(SuccessGreenBg, RoundedCornerShape(100.dp))
                    .border(BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFD1FAE5)), RoundedCornerShape(100.dp))
            ) {
                Icon(
                    imageVector = Icons.Default.CloudUpload,
                    contentDescription = "Backup en Drive",
                    tint = androidx.compose.ui.graphics.Color(0xFF047857),
                    modifier = Modifier.size(16.dp)
                )
            }
            if (onDelete != null) {
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier
                        .size(36.dp)
                        .background(androidx.compose.ui.graphics.Color(0xFFFEE2E2), RoundedCornerShape(100.dp))
                        .border(BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFFECACA)), RoundedCornerShape(100.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Eliminar Reporte",
                        tint = androidx.compose.ui.graphics.Color(0xFFDC2626),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}'''
content = history_item_regex.sub(new_history_item, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
