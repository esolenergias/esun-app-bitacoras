import os

code = """package com.example.ui.screens

import android.content.Intent
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.webkit.WebView
import android.webkit.WebViewClient
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
                RecentReportsSection(
                    reports = generatedReports.take(5),
                    onDelete = { fileToDelete ->
                        if (fileToDelete.exists()) fileToDelete.delete()
                        generatedReports = generatedReports.filter { it.second != fileToDelete }
                    }
                )
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
fun RecentReportsSection(reports: List<Pair<String, File>>, onDelete: (File) -> Unit) {
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
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(24.dp))
                    Text(text = name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SlateDeep, maxLines = 1, modifier = Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(
                        onClick = { onDelete(file) },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = WarningRed, modifier = Modifier.size(18.dp))
                    }
                }
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
                    
                    // INDIVIDUAL SUMMARY FOR THIS OBRA
                    Text("Resumen Individual", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        LedgerRow("Presupuesto de Obra:", "$${String.format("%,.2f", totalProjectBudget)} MXN", SlateDeep)
                        LedgerRow("Gasto Ejecutado:", "$${String.format("%,.2f", totalCostExecuted)} MXN", SuccessGreen)
                        val remanente = totalProjectBudget - totalCostExecuted
                        LedgerRow("Remanente Disponible:", "$${String.format("%,.2f", remanente)} MXN", if (remanente >= 0) ConnectedBlue else WarningRed)
                        LedgerRow("Avance Físico:", "${"%.1f".format(overallPhysicalProgress)}%", ConnectedBlue)
                    }
                    
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
                            isGeneratingPdf = true
                            
                            val timestamp = SimpleDateFormat("yyyyMMdd_HHmm", Locale.getDefault()).format(Date())
                            val fileName = "Reporte_${projectName.replace(" ", "_")}_${timestamp}.pdf"
                            var safeUserName = userName
                            if (safeUserName.contains("Menyfre", ignoreCase = true) || safeUserName.contains("Meny", ignoreCase = true)) {
                                safeUserName = "Manuel Fregoso"
                            }

                            generatePdfReportWebView(
                                context = context,
                                fileName = fileName,
                                projectName = projectName,
                                reporterName = safeUserName,
                                bitacoras = bitacoras,
                                budgetItems = budgetItems,
                                totalBudget = totalProjectBudget,
                                totalExecuted = totalCostExecuted,
                                physicalProgress = overallPhysicalProgress,
                                includeFinancial = includeFinancial,
                                onFinished = { pdfFile ->
                                    isGeneratingPdf = false
                                    if (pdfFile != null) {
                                        onReportGenerated(fileName, pdfFile)
                                        viewModel.simulatePushNotification(
                                            title = "Reporte PDF Listo",
                                            body = "El archivo se ha generado con el formato web.",
                                            type = "SYNC"
                                        )
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
                            )
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
                                Text("Generando HTML a PDF...", fontSize = 13.sp, fontWeight = FontWeight.Black, color = PureWhite)
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
// GENERADOR PDF BASADO EN WEBVIEW (MOCKUP)
// ==========================================
fun generatePdfReportWebView(
    context: android.content.Context,
    fileName: String,
    projectName: String,
    reporterName: String,
    bitacoras: List<BitacoraEntity>,
    budgetItems: List<BudgetItemEntity>,
    totalBudget: Double,
    totalExecuted: Double,
    physicalProgress: Double,
    includeFinancial: Boolean,
    onFinished: (File?) -> Unit
) {
    val genDate = SimpleDateFormat("dd DE MMMM, yyyy", Locale("es", "ES")).format(Date()).uppercase()
    
    // Convert photo URIs to Google Drive Thumbnail URLs safely
    fun resolveDriveUrl(uri: String): String {
        if (uri.isBlank()) return ""
        val p1 = "/file/d/([a-zA-Z0-9_-]+)".toRegex()
        val p2 = "[?&]id=([a-zA-Z0-9_-]+)".toRegex()
        val p3 = "/open\\?id=([a-zA-Z0-9_-]+)".toRegex()
        
        val match = p1.find(uri) ?: p2.find(uri) ?: p3.find(uri)
        return if (match != null && match.groupValues.size > 1) {
            "https://drive.google.com/thumbnail?id=${match.groupValues[1]}&sz=w800"
        } else {
            uri
        }
    }

    var htmlContent = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Reporte de Obra - ESOL</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Josefin+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-1: #F8F7F2; --bg-2: #EFEFE8; --bg-3: #E5E4DB;
                --border-1: #D5D4C7; --border-2: #C4C3B4;
                --text-1: #141410; --text-2: #3A3A32; --text-3: #6A6A5E;
                --gold: #C49825; --gold-dim: #8B6C1A; --gold-muted: rgba(196, 152, 37, 0.12);
                --success: #10B981; --danger: #EF4444; --info: #3B82F6;
            }
            body { background-color: #fff; padding: 2rem; color: var(--text-1); font-family: 'Josefin Sans', sans-serif; font-size: 11px; }
            h1, h2, .font-display { font-family: 'Cinzel', serif; }
            .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4mm; border-bottom: 1px solid var(--border-2); margin-bottom: 6mm; }
            .logo-container img { height: 45px; object-fit: contain; }
            .report-meta { text-align: right; }
            .report-meta h1 { font-size: 22px; font-weight: 700; text-transform: uppercase; margin:0; }
            .meta-subtitle { font-size: 10px; color: var(--gold); font-weight: 600; text-transform: uppercase; letter-spacing: 2px; }
            .report-meta p { font-size: 10px; color: var(--text-2); margin:0; }
            
            .project-card { background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 8mm; }
            .info-label { font-size: 8px; color: var(--text-3); text-transform: uppercase; font-weight: 600; margin-bottom: 2px; display:block;}
            .info-value { font-size: 12px; font-weight: 600; color: var(--text-1); display:block; }
            
            .section-title { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: var(--text-1); margin-bottom: 4mm; text-transform: uppercase; border-bottom: 1px solid var(--gold); padding-bottom: 4px; }
            
            .finance-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8mm; }
            .finance-card { border: 1px solid var(--border-1); border-radius: 6px; padding: 10px; position: relative; }
            .finance-card::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 3px; background: var(--gold); }
            .finance-card.success::before { background: var(--success); }
            .finance-card.warning::before { background: var(--gold-dim); }
            .f-label { font-size: 8px; color: var(--text-3); text-transform: uppercase; font-weight: 700; }
            .f-value { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700; margin-top: 4px; }
            
            .report-item { border: 1px solid var(--border-1); border-left: 3px solid var(--gold); border-radius: 6px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
            .report-top { display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-2); padding-bottom: 6px; margin-bottom: 8px; }
            .report-time { font-size: 12px; font-weight: 700; }
            .badge { background: var(--bg-2); border: 1px solid var(--border-1); font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
            .report-desc { font-size: 11px; color: var(--text-2); line-height: 1.6; margin-bottom: 10px; }
            
            .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            .photo-box { height: 120px; background: var(--bg-3); border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center;}
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
            
            .signatures-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-top: 15mm; page-break-inside: avoid; }
            .signature-box { text-align: center; }
            .sig-line { height: 1px; background: var(--text-1); margin-bottom: 6px; }
            .sig-name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 11px; }
            .sig-role { font-size: 9px; color: var(--text-3); text-transform: uppercase; }
        </style>
    </head>
    <body>
        <header class="header">
            <div class="logo-container">
                <img src="https://esolenergias.com/img/logo_esol_b.png" alt="ESOL">
            </div>
            <div class="report-meta">
                <span class="meta-subtitle">Reporte Oficial</span>
                <h1>Bitácora de Obra</h1>
                <p><strong>PROYECTO:</strong> $projectName</p>
                <p><strong>FECHA DE EMISIÓN:</strong> $genDate</p>
            </div>
        </header>

        <div class="project-card">
            <div class="info-group"><span class="info-label">Nombre del Proyecto</span><span class="info-value">$projectName</span></div>
            <div class="info-group"><span class="info-label">Responsable</span><span class="info-value">$reporterName</span></div>
            <div class="info-group"><span class="info-label">Estado</span><span class="info-value" style="color: var(--success);">En Progreso</span></div>
            <div class="info-group"><span class="info-label">Avance Físico</span><span class="info-value">${"%.1f".format(physicalProgress)}%</span></div>
        </div>
    """
    
    if (includeFinancial) {
        val remanente = totalBudget - totalExecuted
        htmlContent += """
        <h2 class="section-title">Control de Gestión (Financiero)</h2>
        <div class="finance-grid">
            <div class="finance-card"><div class="f-label">Avance Físico</div><div class="f-value">${"%.1f".format(physicalProgress)}%</div></div>
            <div class="finance-card"><div class="f-label">Presupuesto Aprob.</div><div class="f-value">$${String.format("%,.0f", totalBudget)}</div></div>
            <div class="finance-card success"><div class="f-label">Gasto Devengado</div><div class="f-value">$${String.format("%,.0f", totalExecuted)}</div></div>
            <div class="finance-card warning"><div class="f-label">Remanente Total</div><div class="f-value">$${String.format("%,.0f", remanente)}</div></div>
        </div>
        """
    }

    htmlContent += """<h2 class="section-title">Registros Operativos</h2>"""
    
    if (bitacoras.isEmpty()) {
        htmlContent += """<p>Aún no hay reportes diarios para esta obra.</p>"""
    } else {
        bitacoras.forEach { bit ->
            htmlContent += """
            <div class="report-item">
                <div class="report-top">
                    <div class="report-time">${bit.date}</div>
                    <div>
                        <span class="badge">Clima: ${bit.weather}</span>
                        <span class="badge">Cuadrilla: ${bit.crewCount} pax</span>
                    </div>
                </div>
                <div class="report-desc">${bit.activities}</div>
            """
            
            val photoUrl = resolveDriveUrl(bit.photoUri)
            if (photoUrl.isNotEmpty()) {
                htmlContent += """
                <div class="photo-grid">
                    <div class="photo-box"><img src="$photoUrl" alt="Foto Evidencia" crossorigin="anonymous"></div>
                </div>
                """
            }
            htmlContent += """</div>"""
        }
    }

    htmlContent += """
        <div class="signatures-grid">
            <div class="signature-box">
                <div class="sig-line"></div>
                <div class="sig-name">${reporterName.uppercase()}</div>
                <div class="sig-role">RESIDENTE DE OBRA ESOL (ELABORÓ)</div>
            </div>
            <div class="signature-box">
                <div class="sig-line"></div>
                <div class="sig-name">REVISOR</div>
                <div class="sig-role">SUPERVISIÓN / CLIENTE (REVISÓ)</div>
            </div>
        </div>
    </body>
    </html>
    """

    // Instantiate WebView on Main Thread
    val handler = android.os.Handler(android.os.Looper.getMainLooper())
    handler.post {
        try {
            val webView = WebView(context)
            webView.settings.javaScriptEnabled = false
            webView.settings.loadsImagesAutomatically = true
            webView.settings.blockNetworkImage = false

            webView.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView, url: String) {
                    val destFile = File(context.cacheDir, fileName)
                    val printAdapter = view.createPrintDocumentAdapter(fileName)
                    val printAttributes = PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setResolution(PrintAttributes.Resolution("pdf", "pdf", 600, 600))
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build()

                    try {
                        val descriptor = ParcelFileDescriptor.open(destFile, ParcelFileDescriptor.MODE_READ_WRITE or ParcelFileDescriptor.MODE_CREATE or ParcelFileDescriptor.MODE_TRUNCATE)
                        
                        printAdapter.onLayout(null, printAttributes, null, object : PrintDocumentAdapter.LayoutResultCallback() {
                            override fun onLayoutFinished(info: PrintDocumentInfo, changed: Boolean) {
                                printAdapter.onWrite(arrayOf(PageRange.ALL_PAGES), descriptor, null, object : PrintDocumentAdapter.WriteResultCallback() {
                                    override fun onWriteFinished(pages: Array<PageRange>) {
                                        descriptor.close()
                                        onFinished(destFile)
                                    }
                                })
                            }
                        }, null)
                    } catch (e: Exception) {
                        e.printStackTrace()
                        onFinished(null)
                    }
                }
            }
            webView.loadDataWithBaseURL("https://esolenergias.com", htmlContent, "text/html", "UTF-8", null)
        } catch (e: Exception) {
            e.printStackTrace()
            onFinished(null)
        }
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
