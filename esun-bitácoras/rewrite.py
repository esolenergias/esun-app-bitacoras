import os

code = """package com.example.ui.screens

import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.example.data.database.BitacoraEntity
import com.example.data.database.BudgetItemEntity
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ReportScreen(viewModel: BitacoraViewModel) {
    val bitacoras by viewModel.bitacorasList.collectAsState()
    val budgetItems by viewModel.budgetItems.collectAsState()
    val userName by viewModel.userName.collectAsState()
    val projectsList by viewModel.projectsList.collectAsState()
    val scrollState = rememberScrollState()
    
    // Store recent generated reports: List of Pair<FileName, File>
    var generatedReports by remember { mutableStateOf<List<Pair<String, File>>>(emptyList()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBg)
    ) {
        // --- 1. STICKY TOP APP BAR ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(androidx.compose.ui.graphics.Color(0xFFE2E7FF), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.SignalCellularAlt,
                        contentDescription = "Signal Logo",
                        tint = ConnectedBlue,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Text(
                    text = "Control de Gestión",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = SlateDeep
                )
            }
        }

        HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

        // --- SCROLLABLE CONTENT ---
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // General Summary for ALL projects
            GeneralSummaryCard(bitacoras, budgetItems)

            // Last 5 Generated Reports
            if (generatedReports.isNotEmpty()) {
                RecentReportsSection(generatedReports.take(5))
            }

            // Projects List to generate individual reports
            Text(
                text = "Obras y Reportes",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 18.sp,
                color = SlateDeep,
                modifier = Modifier.padding(top = 8.dp)
            )

            if (projectsList.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    Text("Aún no hay obras registradas.", color = OnSurfaceVariant, fontSize = 14.sp)
                }
            } else {
                projectsList.sortedBy { it.first }.forEach { (projectName, _) ->
                    val projectBitacoras = bitacoras.filter { it.siteName.equals(projectName, ignoreCase = true) }
                    val projectBudgetItems = budgetItems.filter { it.obraId == projectName || it.description.contains(projectName, true) }.ifEmpty { budgetItems }
                    
                    ProjectReportRow(
                        projectName = projectName,
                        bitacoras = projectBitacoras,
                        budgetItems = projectBudgetItems,
                        userName = userName,
                        viewModel = viewModel,
                        onReportGenerated = { fileName, file ->
                            generatedReports = listOf(fileName to file) + generatedReports
                        }
                    )
                }
            }
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
fun GeneralSummaryCard(
    bitacoras: List<BitacoraEntity>,
    budgetItems: List<BudgetItemEntity>
) {
    val totalProjectBudget = budgetItems.sumOf { it.quantity * it.unitPrice }
    val totalCostExecuted = budgetItems.sumOf { it.executedQuantity * it.unitPrice }
    val overallPhysicalProgress = if (budgetItems.isNotEmpty()) {
        budgetItems.sumOf { if (it.quantity > 0.0) (it.executedQuantity / it.quantity) * 100.0 else 0.0 } / budgetItems.size
    } else 65.0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "RESUMEN GENERAL",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 16.sp,
                color = SlateDeep
            )

            // Ledger Summary
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                LedgerRow("Presupuesto Global:", "$${String.format("%,.2f", totalProjectBudget)} MXN", SlateDeep)
                LedgerRow("Gasto Total Ejecutado:", "$${String.format("%,.2f", totalCostExecuted)} MXN", SuccessGreen)
                val remanente = totalProjectBudget - totalCostExecuted
                LedgerRow("Remanente Disponible:", "$${String.format("%,.2f", remanente)} MXN", if (remanente >= 0) ConnectedBlue else WarningRed)
                LedgerRow("Avance Físico Promedio:", "${"%.1f".format(overallPhysicalProgress)}%", ConnectedBlue)
                LedgerRow("Total Registros Diarios:", "${bitacoras.size} reportes", OnSurfaceVariant)
            }
            
            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

            // Cuadrillas Live Telemetry
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.NotificationsActive, contentDescription = null, tint = androidx.compose.ui.graphics.Color(0xFFEA580C), modifier = Modifier.size(20.dp))
                        Text(
                            text = "Cuadrillas Live",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp,
                            color = SlateDeep
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(androidx.compose.ui.graphics.Color(0xFFFFF7ED), RoundedCornerShape(100.dp))
                            .border(BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFFFEDD5)), RoundedCornerShape(100.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(text = "LIVE", fontSize = 9.sp, fontWeight = FontWeight.Black, color = androidx.compose.ui.graphics.Color(0xFFEA580C))
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    CuadrillaTelemetryCard(
                        title = "Retraso reportado",
                        desc = "Se registraron desviaciones menores de logística.",
                        time = "5 min",
                        icon = Icons.Default.Warning,
                        iconColor = androidx.compose.ui.graphics.Color(0xFFEA580C),
                        bgColor = androidx.compose.ui.graphics.Color(0xFFFFF7ED)
                    )
                    CuadrillaTelemetryCard(
                        title = "Bitácora Firmada",
                        desc = "Supervisor validó los avances de ayer de las obras activas.",
                        time = "45 min",
                        icon = Icons.Default.Description,
                        iconColor = SuccessGreen,
                        bgColor = SuccessGreenBg
                    )
                }
            }
        }
    }
}

@Composable
fun RecentReportsSection(reports: List<Pair<String, File>>) {
    val context = LocalContext.current
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = "Últimos Reportes",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 15.sp,
            color = SlateDeep
        )
        reports.forEach { (name, file) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PureWhite, RoundedCornerShape(12.dp))
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp))
                    .clickable {
                        try {
                            val uri = FileProvider.getUriForFile(context, "${context.packageName}.provider", file)
                            val intent = Intent(Intent.ACTION_VIEW).apply {
                                setDataAndType(uri, "application/pdf")
                                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            }
                            context.startActivity(Intent.createChooser(intent, "Abrir PDF"))
                        } catch (e: Exception) {
                            android.widget.Toast.makeText(context, "No se pudo abrir el archivo", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(24.dp))
                    Text(text = name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                }
                Icon(Icons.Default.Visibility, contentDescription = null, tint = OnSurfaceVariant, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun ProjectReportRow(
    projectName: String,
    bitacoras: List<BitacoraEntity>,
    budgetItems: List<BudgetItemEntity>,
    userName: String,
    viewModel: BitacoraViewModel,
    onReportGenerated: (String, File) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var expanded by remember { mutableStateOf(false) }
    var includeFinancial by remember { mutableStateOf(true) }
    var isGeneratingPdf by remember { mutableStateOf(false) }

    val totalProjectBudget = budgetItems.sumOf { it.quantity * it.unitPrice }
    val totalCostExecuted = budgetItems.sumOf { it.executedQuantity * it.unitPrice }
    val overallPhysicalProgress = if (budgetItems.isNotEmpty()) {
        budgetItems.sumOf { if (it.quantity > 0.0) (it.executedQuantity / it.quantity) * 100.0 else 0.0 } / budgetItems.size
    } else 65.0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp))
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Summary Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = projectName, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = SlateDeep)
                    Text(text = "${bitacoras.size} registros • Avance: ${"%.1f".format(overallPhysicalProgress)}%", fontSize = 11.sp, color = OnSurfaceVariant)
                }
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = OnSurfaceVariant
                )
            }

            // Expanded Details
            AnimatedVisibility(visible = expanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                    
                    // Financial Settings
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth().clickable { includeFinancial = !includeFinancial }
                    ) {
                        Checkbox(
                            checked = includeFinancial,
                            onCheckedChange = { includeFinancial = it },
                            colors = CheckboxDefaults.colors(checkedColor = ConnectedBlue)
                        )
                        Text("Incluir Información Monetaria en el Reporte", fontSize = 13.sp, color = SlateDeep)
                    }

                    // Generate Button
                    Button(
                        onClick = {
                            if (isGeneratingPdf) return@Button
                            coroutineScope.launch {
                                isGeneratingPdf = true
                                val timestamp = SimpleDateFormat("yyyyMMdd_HHmm", Locale.getDefault()).format(Date())
                                val fileName = "Reporte_${projectName.replace(" ", "_")}_${timestamp}.pdf"

                                var safeUserName = userName
                                if (safeUserName.contains("Menyfre", ignoreCase = true) || safeUserName.contains("Meny", ignoreCase = true)) {
                                    safeUserName = "Manuel Fregoso"
                                }

                                val pdfFile = withContext(Dispatchers.IO) {
                                    generatePdfReport(
                                        context = context,
                                        fileName = fileName,
                                        projectName = projectName,
                                        reporterName = safeUserName,
                                        bitacoras = bitacoras,
                                        budgetItems = budgetItems,
                                        totalBudget = totalProjectBudget,
                                        totalExecuted = totalCostExecuted,
                                        physicalProgress = overallPhysicalProgress,
                                        includeFinancial = includeFinancial
                                    )
                                }

                                isGeneratingPdf = false

                                if (pdfFile != null) {
                                    onReportGenerated(fileName, pdfFile)
                                    viewModel.simulatePushNotification(
                                        title = "Reporte PDF Listo",
                                        body = "El archivo se ha guardado temporalmente. Listo para visualizar.",
                                        type = "SYNC"
                                    )
                                    // Launch PDF Preview
                                    try {
                                        val uri = FileProvider.getUriForFile(context, "${context.packageName}.provider", pdfFile)
                                        val intent = Intent(Intent.ACTION_VIEW).apply {
                                            setDataAndType(uri, "application/pdf")
                                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                        }
                                        context.startActivity(Intent.createChooser(intent, "Previsualizar Reporte"))
                                    } catch (e: Exception) {
                                        android.widget.Toast.makeText(context, "No hay lector PDF instalado", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                } else {
                                    android.widget.Toast.makeText(context, "Error al generar", android.widget.Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue),
                        shape = RoundedCornerShape(100.dp),
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        enabled = !isGeneratingPdf
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (isGeneratingPdf) {
                                CircularProgressIndicator(color = PureWhite, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                Text("Generando...", fontSize = 13.sp, fontWeight = FontWeight.Black, color = PureWhite)
                            } else {
                                Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = PureWhite, modifier = Modifier.size(18.dp))
                                Text("Generar Reporte PDF", fontSize = 13.sp, fontWeight = FontWeight.Black, color = PureWhite)
                            }
                        }
                    }
                }
            }
        }
    }
}


// ==========================================
// GENERADOR REAL DE PDF (Android PdfDocument)
// ==========================================

fun generatePdfReport(
    context: android.content.Context,
    fileName: String,
    projectName: String,
    reporterName: String,
    bitacoras: List<BitacoraEntity>,
    budgetItems: List<BudgetItemEntity>,
    totalBudget: Double,
    totalExecuted: Double,
    physicalProgress: Double,
    includeFinancial: Boolean
): File? {
    return try {
        val pdf = PdfDocument()
        val pageWidth = 595   // A4 ancho en puntos (72 DPI)
        val pageHeight = 842  // A4 alto en puntos

        val margin = 40f
        var y = margin + 20f

        fun newPage(pageNumber: Int): Pair<PdfDocument.Page, Canvas> {
            val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber).create()
            val page = pdf.startPage(pageInfo)
            return page to page.canvas
        }

        var pageNumber = 1
        var (page, canvas) = newPage(pageNumber)

        val paintTitle = Paint().apply {
            color = Color.parseColor("#1E3A5F")
            textSize = 22f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val paintSubtitle = Paint().apply {
            color = Color.parseColor("#1E3A5F")
            textSize = 13f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val paintLabel = Paint().apply {
            color = Color.parseColor("#64748B")
            textSize = 10f
        }
        val paintValue = Paint().apply {
            color = Color.parseColor("#1E293B")
            textSize = 11f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val paintSmall = Paint().apply {
            color = Color.parseColor("#64748B")
            textSize = 9f
        }
        val paintLine = Paint().apply {
            color = Color.parseColor("#E2E8F0")
            strokeWidth = 1f
        }
        val paintHighlight = Paint().apply {
            color = Color.parseColor("#EFF6FF")
        }
        val paintBlue = Paint().apply {
            color = Color.parseColor("#1E3A5F")
        }
        val paintSuccess = Paint().apply {
            color = Color.parseColor("#10B981")
            textSize = 11f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }

        // ---- LOGO ESOL (Arriba a la izquierda) ----
        try {
            val logoId = context.resources.getIdentifier("logo_esol_b", "drawable", context.packageName)
            if (logoId != 0) {
                val logoBitmap = android.graphics.BitmapFactory.decodeResource(context.resources, logoId)
                if (logoBitmap != null) {
                    val scale = 50f / logoBitmap.height
                    val logoRect = android.graphics.RectF(margin, y - 10f, margin + (logoBitmap.width * scale), y - 10f + 50f)
                    canvas.drawBitmap(logoBitmap, null, logoRect, null)
                    logoBitmap.recycle()
                    y += 50f
                }
            } else {
                canvas.drawText("ESOL ENERGÍAS", margin, y + 10f, paintSubtitle)
                y += 20f
            }
        } catch (e: Exception) {
            canvas.drawText("ESOL ENERGÍAS", margin, y + 10f, paintSubtitle)
            y += 20f
        }

        y += 10f

        // ---- ENCABEZADO ----
        canvas.drawRect(margin, y - 10f, pageWidth - margin, y + 55f, paintHighlight)
        canvas.drawText("ESun Bitácora", margin + 8f, y + 20f, paintTitle)
        val genDate = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
        canvas.drawText("Generado: $genDate", pageWidth - margin - 160f, y + 12f, paintSmall)
        canvas.drawText("Proyecto: $projectName", margin + 8f, y + 40f, paintLabel)
        canvas.drawText("Por: ${reporterName.ifEmpty { "Sistema" }}", pageWidth - margin - 120f, y + 40f, paintSmall)

        y += 75f
        canvas.drawLine(margin, y, pageWidth - margin, y, paintLine)
        y += 20f

        // ---- RESUMEN FINANCIERO (Si está habilitado) ----
        if (includeFinancial) {
            canvas.drawText("RESUMEN FINANCIERO", margin, y, paintSubtitle)
            y += 18f

            val cols = listOf(
                "Presupuesto Total" to "\$${String.format("%,.2f", totalBudget)} MXN",
                "Gasto Devengado" to "\$${String.format("%,.2f", totalExecuted)} MXN",
                "Remanente" to "\$${String.format("%,.2f", totalBudget - totalExecuted)} MXN",
                "Avance Físico" to "${"%.1f".format(physicalProgress)}%"
            )

            cols.forEachIndexed { i, (lbl, val_) ->
                val xCol = margin + i * ((pageWidth - margin * 2) / 4)
                canvas.drawText(lbl, xCol, y, paintLabel)
                canvas.drawText(val_, xCol, y + 14f, paintValue)
            }
            y += 40f

            canvas.drawLine(margin, y, pageWidth - margin, y, paintLine)
            y += 20f

            // ---- PARTIDAS DE PRESUPUESTO ----
            if (budgetItems.isNotEmpty()) {
                canvas.drawText("PARTIDAS DE PRESUPUESTO", margin, y, paintSubtitle)
                y += 18f

                // Cabecera tabla
                canvas.drawRect(margin, y - 4f, pageWidth - margin, y + 14f, paintBlue)
                val headerPaint = Paint().apply { color = Color.WHITE; textSize = 9f; typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD) }
                canvas.drawText("Código", margin + 4f, y + 8f, headerPaint)
                canvas.drawText("Descripción", margin + 70f, y + 8f, headerPaint)
                canvas.drawText("Cant.", margin + 310f, y + 8f, headerPaint)
                canvas.drawText("Ejecutado", margin + 360f, y + 8f, headerPaint)
                canvas.drawText("Avance", margin + 430f, y + 8f, headerPaint)
                canvas.drawText("Importe", margin + 480f, y + 8f, headerPaint)
                y += 18f

                budgetItems.take(15).forEachIndexed { idx, item ->
                    if (y > pageHeight - 80f) {
                        pdf.finishPage(page)
                        pageNumber++
                        val next = newPage(pageNumber)
                        page = next.first; canvas = next.second
                        y = margin + 20f
                    }
                    val rowBg = if (idx % 2 == 0) Color.parseColor("#F8FAFC") else Color.WHITE
                    val rowPaint = Paint().apply { color = rowBg }
                    canvas.drawRect(margin, y - 4f, pageWidth - margin, y + 14f, rowPaint)

                    val desc = if (item.description.length > 38) item.description.take(38) + "…" else item.description
                    val pct = if (item.quantity > 0) (item.executedQuantity / item.quantity * 100).toInt() else 0
                    val importe = item.executedQuantity * item.unitPrice

                    canvas.drawText(item.code, margin + 4f, y + 8f, paintSmall)
                    canvas.drawText(desc, margin + 70f, y + 8f, paintSmall)
                    canvas.drawText("${item.quantity.toInt()} ${item.unit}", margin + 310f, y + 8f, paintSmall)
                    canvas.drawText("${item.executedQuantity.toInt()}", margin + 360f, y + 8f, paintSmall)
                    canvas.drawText("$pct%", margin + 430f, y + 8f, if (pct >= 100) paintSuccess else paintSmall)
                    canvas.drawText("\$${String.format("%,.0f", importe)}", margin + 480f, y + 8f, paintSmall)

                    canvas.drawLine(margin, y + 14f, pageWidth - margin, y + 14f, paintLine)
                    y += 18f
                }
                y += 10f
            }
        } else {
            // No financiero, solo mostrar avance físico general
            canvas.drawText("RESUMEN DE AVANCE", margin, y, paintSubtitle)
            y += 18f
            canvas.drawText("Avance Físico", margin, y, paintLabel)
            canvas.drawText("${"%.1f".format(physicalProgress)}%", margin, y + 14f, paintValue)
            y += 40f
            canvas.drawLine(margin, y, pageWidth - margin, y, paintLine)
            y += 20f
        }

        // ---- REGISTROS DE BITÁCORA ----
        if (bitacoras.isNotEmpty()) {
            if (y > pageHeight - 120f) {
                pdf.finishPage(page)
                pageNumber++
                val next = newPage(pageNumber)
                page = next.first; canvas = next.second
                y = margin + 20f
            }

            canvas.drawLine(margin, y, pageWidth - margin, y, paintLine)
            y += 16f
            canvas.drawText("REGISTROS DE BITÁCORA (${bitacoras.size} entradas)", margin, y, paintSubtitle)
            y += 18f

            bitacoras.take(20).forEachIndexed { idx, bit ->
                if (y > pageHeight - 80f) {
                    pdf.finishPage(page)
                    pageNumber++
                    val next = newPage(pageNumber)
                    page = next.first; canvas = next.second
                    y = margin + 20f
                }
                val rowBg = if (idx % 2 == 0) Color.parseColor("#F8FAFC") else Color.WHITE
                val rowPaint = Paint().apply { color = rowBg }
                canvas.drawRect(margin, y - 4f, pageWidth - margin, y + 24f, rowPaint)

                canvas.drawText("${bit.date}  •  ${bit.siteName}", margin + 4f, y + 8f, paintValue)
                canvas.drawText("Clima: ${bit.weather}  |  Cuadrilla: ${bit.crewCount}  |  Avance: ${"%.0f".format(bit.physicalProgress)}%", margin + 4f, y + 20f, paintSmall)

                canvas.drawLine(margin, y + 24f, pageWidth - margin, y + 24f, paintLine)
                y += 28f
            }
            if (bitacoras.size > 20) {
                canvas.drawText("... y ${bitacoras.size - 20} registros más.", margin + 4f, y + 8f, paintSmall)
                y += 20f
            }
        }

        // ---- PIE DE PÁGINA Y FIRMAS ----
        if (y > pageHeight - 140f) {
            pdf.finishPage(page)
            pageNumber++
            val next = newPage(pageNumber)
            page = next.first; canvas = next.second
            y = margin + 20f
        }
        
        y += 40f
        val signatureY = y
        
        val signatureWidth = 150f
        
        canvas.drawLine(margin, signatureY + 40f, margin + signatureWidth, signatureY + 40f, paintLine)
        canvas.drawText("Elaboró (Residente de Obra)", margin, signatureY + 55f, paintSmall)
        canvas.drawText(reporterName.ifEmpty { "____________________" }, margin, signatureY + 70f, paintValue)

        val sig2X = pageWidth - margin - signatureWidth
        canvas.drawLine(sig2X, signatureY + 40f, sig2X + signatureWidth, signatureY + 40f, paintLine)
        canvas.drawText("Revisó (Supervisor / Cliente)", sig2X, signatureY + 55f, paintSmall)
        canvas.drawText("____________________", sig2X, signatureY + 70f, paintValue)

        val footerY = pageHeight - 30f
        canvas.drawLine(margin, footerY - 10f, pageWidth - margin, footerY - 10f, paintLine)
        canvas.drawText("ESun Bitácora  •  Reporte Oficial  •  $genDate", margin, footerY, paintSmall)
        canvas.drawText("Página $pageNumber", pageWidth - margin - 40f, footerY, paintSmall)

        pdf.finishPage(page)

        // GUARDAR EN CACHE DIR PARA PREVISUALIZACIÓN (Y Compartir a Drive)
        val pdfFile = File(context.cacheDir, fileName)
        pdfFile.outputStream().use { outputStream ->
            pdf.writeTo(outputStream)
        }
        pdf.close()
        
        pdfFile
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

@Composable
fun LedgerRow(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontWeight = FontWeight.Bold,
            color = OnSurfaceVariant,
            fontSize = 13.sp
        )
        Text(
            text = value,
            fontWeight = FontWeight.Black,
            color = color,
            fontSize = 14.sp
        )
    }
}

@Composable
fun CuadrillaTelemetryCard(
    title: String,
    desc: String,
    time: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: androidx.compose.ui.graphics.Color,
    bgColor: androidx.compose.ui.graphics.Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(PureWhite, RoundedCornerShape(12.dp))
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(bgColor, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(18.dp))
        }

        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SlateDeep)
                Text(text = time, fontWeight = FontWeight.Bold, fontSize = 9.sp, color = OnSurfaceVariant)
            }
            Text(text = desc, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = OnSurfaceVariant, lineHeight = 14.sp)
        }
    }
}
"""

with open(r"C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt", "w", encoding="utf-8") as f:
    f.write(code)
