package com.example.ui.screens

import android.content.ContentValues
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.animation.core.*
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
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.database.BitacoraEntity
import com.example.data.database.BudgetItemEntity
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
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
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    val pulseAlpha = 0.8f
    val bitacorasByProject = bitacoras.groupBy { it.siteName.ifEmpty { "Proyecto Sin Nombre" } }

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

            // Online indicator badge
            Row(
                modifier = Modifier
                    .background(SuccessGreenBg, shape = RoundedCornerShape(100.dp))
                    .border(BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFD1FAE5)), RoundedCornerShape(100.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(RoundedCornerShape(100))
                        .background(SuccessGreen.copy(alpha = pulseAlpha))
                )
                Text(
                    text = "ONLINE",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    color = androidx.compose.ui.graphics.Color(0xFF047857)
                )
            }
        }

        HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
        // --- SCROLLABLE BENTO CONTENT ---
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            if (projectsList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Aún no hay obras registradas.", color = OnSurfaceVariant, fontSize = 14.sp)
                }
            } else {
                projectsList.sortedBy { it.first }.forEach { (projectName, _) ->
                    val projectBitacoras = bitacoras.filter { it.siteName.equals(projectName, ignoreCase = true) }
                    val projectBudgetItems = budgetItems.filter { it.obraId == projectName || it.description.contains(projectName, true) }.ifEmpty { budgetItems }
                    
                    ProjectSummaryCard(
                        projectName = projectName,
                        bitacoras = projectBitacoras,
                        budgetItems = projectBudgetItems,
                        userName = userName,
                        context = context,
                        coroutineScope = coroutineScope,
                        viewModel = viewModel
                    )
                }
            }
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
fun ProjectSummaryCard(
    projectName: String,
    bitacoras: List<BitacoraEntity>,
    budgetItems: List<BudgetItemEntity>,
    userName: String,
    context: android.content.Context,
    coroutineScope: kotlinx.coroutines.CoroutineScope,
    viewModel: BitacoraViewModel
) {
    var isGeneratingPdf by remember { mutableStateOf(false) }
    var pdfButtonText by remember { mutableStateOf("Generar Reporte PDF") }
    var pdfButtonColor by remember { mutableStateOf(ConnectedBlue) }
    var generatedReports by remember { mutableStateOf<List<Pair<String, String>>>(emptyList()) }

    // Aggregate physical progress
    val overallPhysicalProgress = if (budgetItems.isNotEmpty()) {
        budgetItems.sumOf {
            if (it.quantity > 0.0) (it.executedQuantity / it.quantity) * 100.0 else 0.0
        } / budgetItems.size
    } else {
        65.0
    }

    // Aggregate financial figures
    val totalProjectBudget = budgetItems.sumOf { it.quantity * it.unitPrice }
    val totalCostExecuted = budgetItems.sumOf { it.executedQuantity * it.unitPrice }
    
    val lastSyncTime = remember { java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date()) }

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
            // Header
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "OBRA",
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = ConnectedBlue,
                    letterSpacing = 1.sp
                )
                Text(
                    text = projectName,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 22.sp,
                    color = SlateDeep
                )
            }

            // PDF Button
            Button(
                onClick = {
                    if (isGeneratingPdf) return@Button
                    coroutineScope.launch {
                        isGeneratingPdf = true
                        pdfButtonText = "Generando PDF..."
                        pdfButtonColor = SlateDeep

                        val timestamp = java.text.SimpleDateFormat("yyyyMMdd_HHmmss", java.util.Locale.getDefault()).format(java.util.Date())
                        val fileName = "Reporte_${projectName.replace(" ", "_")}_${timestamp}.pdf"
                        val displayDate = java.text.SimpleDateFormat("dd/MM/yyyy HH:mm", java.util.Locale.getDefault()).format(java.util.Date())

                        var safeUserName = userName
                        if (safeUserName.contains("Menyfre", ignoreCase = true) || safeUserName.contains("Meny", ignoreCase = true)) {
                            safeUserName = "Manuel Fregoso"
                        }

                        val success = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                            generatePdfReport(
                                context = context,
                                fileName = fileName,
                                projectName = projectName,
                                reporterName = safeUserName,
                                bitacoras = bitacoras,
                                budgetItems = budgetItems,
                                totalBudget = totalProjectBudget,
                                totalExecuted = totalCostExecuted,
                                physicalProgress = overallPhysicalProgress
                            )
                        }

                        if (success) {
                            generatedReports = listOf(fileName to displayDate) + generatedReports
                            pdfButtonText = "Completado ✓"
                            pdfButtonColor = SuccessGreen
                            viewModel.simulatePushNotification(
                                title = "Reporte PDF Generado",
                                body = "El archivo '$fileName' fue guardado en Descargas/ESunBitacora.",
                                type = "SYNC"
                            )
                            android.widget.Toast.makeText(context, "PDF guardado en Descargas", android.widget.Toast.LENGTH_LONG).show()
                        } else {
                            pdfButtonText = "Error al generar"
                            pdfButtonColor = WarningRed
                            android.widget.Toast.makeText(context, "Error al generar el PDF", android.widget.Toast.LENGTH_SHORT).show()
                        }
                        isGeneratingPdf = false
                        kotlinx.coroutines.delay(3000)
                        pdfButtonText = "Generar Reporte PDF"
                        pdfButtonColor = ConnectedBlue
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = pdfButtonColor),
                shape = RoundedCornerShape(100.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                enabled = !isGeneratingPdf
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (isGeneratingPdf) {
                        CircularProgressIndicator(color = PureWhite, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = PureWhite, modifier = Modifier.size(18.dp))
                    }
                    Text(
                        text = pdfButtonText,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = PureWhite
                    )
                }
            }


            // Bar Chart — datos derivados de budgetItems reales
            val chartItems = if (budgetItems.isNotEmpty()) {
                budgetItems.take(5).map { item ->
                    val budgetPct = if (item.totalBudget > 0) (item.quantity * item.unitPrice / totalProjectBudget.coerceAtLeast(1.0)).toFloat().coerceIn(0.1f, 1f) else 0.3f
                    val realPct = if (item.quantity > 0) (item.executedQuantity / item.quantity).toFloat().coerceIn(0.05f, 1f) else 0.05f
                    val shortLabel = item.code.take(6)
                    MonthChartData(shortLabel, budgetPct, realPct)
                }
            } else {
                listOf(
                    MonthChartData("ENE", 0.85f, 0.78f),
                    MonthChartData("FEB", 0.70f, 0.92f),
                    MonthChartData("MAR", 0.95f, 0.80f),
                    MonthChartData("ABR", 0.60f, 0.55f),
                    MonthChartData("MAY", 0.88f, 1.00f)
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(androidx.compose.ui.graphics.Color(0xFFEFF6FF), RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Analytics, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(18.dp))
                        }
                        Text(
                            text = "Presupuesto vs Gasto Real",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp,
                            color = SlateDeep
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(RoundedCornerShape(100)).background(ConnectedBlue))
                            Text("Pres.", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(RoundedCornerShape(100)).background(androidx.compose.ui.graphics.Color(0xFFCBD5E1)))
                            Text("Real", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .padding(horizontal = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    chartItems.forEach { item ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Row(
                                modifier = Modifier
                                    .height(130.dp)
                                    .width(36.dp),
                                verticalAlignment = Alignment.Bottom,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(item.budgetPercent)
                                        .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                        .background(ConnectedBlue)
                                )
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(item.realPercent)
                                        .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                        .background(androidx.compose.ui.graphics.Color(0xFFCBD5E1))
                                )
                            }
                            Text(text = item.label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                        }
                    }
                }
            }

            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
            // Ledger Summary
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                LedgerRow("Presupuesto Estimado:", "$${String.format("%,.2f", totalProjectBudget)} MXN", SlateDeep)
                LedgerRow("Gasto Devengado:", "$${String.format("%,.2f", totalCostExecuted)} MXN", SuccessGreen)
                val remanente = totalProjectBudget - totalCostExecuted
                LedgerRow("Remanente Disponible:", "$${String.format("%,.2f", remanente)} MXN", if (remanente >= 0) ConnectedBlue else WarningRed)
                LedgerRow("Avance Físico:", "${"%.1f".format(overallPhysicalProgress)}%", ConnectedBlue)
                LedgerRow("Registros Diarios:", "${bitacoras.size} reportes", OnSurfaceVariant)
            }
            

            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

            // Cuadrillas Live Telemetry Sidebar Feed
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
                            text = "Cuadrillas",
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
                        desc = "Se registraron desviaciones menores en " + projectName + ".",
                        time = "5 min",
                        icon = Icons.Default.Warning,
                        iconColor = androidx.compose.ui.graphics.Color(0xFFEA580C),
                        bgColor = androidx.compose.ui.graphics.Color(0xFFFFF7ED)
                    )
                    CuadrillaTelemetryCard(
                        title = "Bitácora Firmada",
                        desc = "Supervisor validó el avance de la jornada anterior.",
                        time = "45 min",
                        icon = Icons.Default.Description,
                        iconColor = SuccessGreen,
                        bgColor = SuccessGreenBg
                    )
                }
            }

            // Historial local
            if (generatedReports.isNotEmpty()) {
                HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                Text("Reportes Generados (Sesión)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                generatedReports.forEach { (name, _) ->
                    Text(text = name, fontSize = 11.sp, color = ConnectedBlue)
                }
            }
        }
    }
}

// ==========================================
// GENERADOR REAL DE PDF (Android PdfDocument)
// ==========================================

/**
 * Genera un reporte PDF real con los datos de la bitácora y lo guarda
 * en el directorio público Downloads/ESunBitacora.
 * Retorna true si tuvo éxito.
 */
fun generatePdfReport(
    context: android.content.Context,
    fileName: String,
    projectName: String,
    reporterName: String,
    bitacoras: List<BitacoraEntity>,
    budgetItems: List<BudgetItemEntity>,
    totalBudget: Double,
    totalExecuted: Double,
    physicalProgress: Double
): Boolean {
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

        // ---- RESUMEN FINANCIERO ----
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
                    // Nueva página si se acaba el espacio
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

            bitacoras.take(10).forEachIndexed { idx, bit ->
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
            if (bitacoras.size > 10) {
                canvas.drawText("... y ${bitacoras.size - 10} registros más.", margin + 4f, y + 8f, paintSmall)
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
        
        // Cajas de firma
        val signatureWidth = 150f
        
        // Firma 1 (Residente / Creador)
        canvas.drawLine(margin, signatureY + 40f, margin + signatureWidth, signatureY + 40f, paintLine)
        canvas.drawText("Elaboró (Residente de Obra)", margin, signatureY + 55f, paintSmall)
        canvas.drawText(reporterName.ifEmpty { "____________________" }, margin, signatureY + 70f, paintValue)

        // Firma 2 (Supervisor / Cliente)
        val sig2X = pageWidth - margin - signatureWidth
        canvas.drawLine(sig2X, signatureY + 40f, sig2X + signatureWidth, signatureY + 40f, paintLine)
        canvas.drawText("Revisó (Supervisor / Cliente)", sig2X, signatureY + 55f, paintSmall)
        canvas.drawText("____________________", sig2X, signatureY + 70f, paintValue)

        // Numeración de página en el fondo real
        val footerY = pageHeight - 30f
        canvas.drawLine(margin, footerY - 10f, pageWidth - margin, footerY - 10f, paintLine)
        canvas.drawText("ESun Bitácora  •  Reporte Oficial  •  $genDate", margin, footerY, paintSmall)
        canvas.drawText("Página $pageNumber", pageWidth - margin - 40f, footerY, paintSmall)

        pdf.finishPage(page)

        // ---- GUARDAR EN MEDIASTORE (Downloads/ESunBitacora) ----
        val contentValues = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, fileName)
            put(MediaStore.Downloads.MIME_TYPE, "application/pdf")
            put(MediaStore.Downloads.RELATIVE_PATH, "${Environment.DIRECTORY_DOWNLOADS}/ESunBitacora")
        }

        val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            ?: return false

        context.contentResolver.openOutputStream(uri)?.use { outputStream ->
            pdf.writeTo(outputStream)
        }

        pdf.close()
        true
    } catch (e: Exception) {
        e.printStackTrace()
        false
    }
}

data class MonthChartData(
    val label: String,
    val budgetPercent: Float,
    val realPercent: Float
)

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

@Composable
fun ReportHistoryItem(
    id: String,
    type: String,
    date: String,
    author: String,
    status: String,
    onDownload: () -> Unit
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
                    imageVector = Icons.Default.Download,
                    contentDescription = "Descargar",
                    tint = ConnectedBlue,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
