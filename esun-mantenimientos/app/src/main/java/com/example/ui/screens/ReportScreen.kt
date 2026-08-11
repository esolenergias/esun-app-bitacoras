package com.example.ui.screens

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.Modifier
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
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL
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
    
    val context = LocalContext.current
    var generatedReports by remember { mutableStateOf<List<Pair<String, File>>>(emptyList()) }

    LaunchedEffect(Unit) {
        val files = context.cacheDir.listFiles { _, name -> 
            name.startsWith("Reporte_") && name.endsWith(".pdf") 
        }
        if (files != null) {
            generatedReports = files.map { it.name to it }.sortedByDescending { it.second.lastModified() }
        }
    }

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
    fun isAdmin(item: com.example.data.database.BudgetItemEntity) =
        if (item.categoryName.isNotEmpty()) item.categoryName.contains("tramit", ignoreCase = true)
        else item.description.contains("tramit", ignoreCase = true)
    val physicalItems = budgetItems.filter { !isAdmin(it) }
    val adminItems = budgetItems.filter { isAdmin(it) }

    val overallPhysicalProgress = if (physicalItems.isNotEmpty()) {
        physicalItems.sumOf { if (it.quantity > 0.0) (it.executedQuantity / it.quantity) * 100.0 else 0.0 } / physicalItems.size
    } else 0.0

    val adminProgress = if (adminItems.isNotEmpty()) {
        adminItems.sumOf { if (it.quantity > 0.0) (it.executedQuantity / it.quantity) * 100.0 else 0.0 } / adminItems.size
    } else 0.0

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

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                LedgerRow("Presupuesto Global:", "$${String.format("%,.2f", totalProjectBudget)} MXN", SlateDeep)
                LedgerRow("Gasto Total Ejecutado:", "$${String.format("%,.2f", totalCostExecuted)} MXN", SuccessGreen)
                val remanente = totalProjectBudget - totalCostExecuted
                LedgerRow("Remanente Disponible:", "$${String.format("%,.2f", remanente)} MXN", if (remanente >= 0) ConnectedBlue else WarningRed)
                LedgerRow("Avance Físico Promedio:", "${"%.1f".format(overallPhysicalProgress)}%", ConnectedBlue)
                LedgerRow("Total Registros Diarios:", "${bitacoras.size} reportes", OnSurfaceVariant)
            }
            
            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
            
            Text("Gráficas Generales", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
            ProjectStatusCharts(totalProjectBudget, totalCostExecuted, overallPhysicalProgress, adminProgress, adminItems.isNotEmpty())
            
            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

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
                            context.startActivity(intent)
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
    fun isAdmin(item: com.example.data.database.BudgetItemEntity) =
        if (item.categoryName.isNotEmpty()) item.categoryName.contains("tramit", ignoreCase = true)
        else item.description.contains("tramit", ignoreCase = true)
    val physicalItems = budgetItems.filter { !isAdmin(it) }
    val adminItems = budgetItems.filter { isAdmin(it) }

    val overallPhysicalProgress = if (physicalItems.isNotEmpty()) {
        physicalItems.sumOf { if (it.quantity > 0.0) (it.executedQuantity / it.quantity) * 100.0 else 0.0 } / physicalItems.size
    } else 0.0

    val adminProgress = if (adminItems.isNotEmpty()) {
        adminItems.sumOf { if (it.quantity > 0.0) (it.executedQuantity / it.quantity) * 100.0 else 0.0 } / adminItems.size
    } else 0.0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp))
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
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

            AnimatedVisibility(visible = expanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                    
                    Text("Resumen de Obra", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        LedgerRow("Presupuesto de Obra:", "$${String.format("%,.2f", totalProjectBudget)} MXN", SlateDeep)
                        LedgerRow("Gasto Ejecutado:", "$${String.format("%,.2f", totalCostExecuted)} MXN", SuccessGreen)
                        val remanente = totalProjectBudget - totalCostExecuted
                        LedgerRow("Remanente Disponible:", "$${String.format("%,.2f", remanente)} MXN", if (remanente >= 0) ConnectedBlue else WarningRed)
                        val isTramiteUi = bitacoras.any { it.concepto_name?.contains("tramit", ignoreCase = true) == true }
                        val lblFisicoUi = if (isTramiteUi) "Avance Admin.:" else "Avance Físico:"
                        LedgerRow(lblFisicoUi, "${"%.1f".format(overallPhysicalProgress)}%", ConnectedBlue)
                    }
                    
                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                    
                    Text("Gráficas del Proyecto", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                    ProjectStatusCharts(totalProjectBudget, totalCostExecuted, overallPhysicalProgress, adminProgress, adminItems.isNotEmpty())
                    
                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                    
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
                                    generatePdfReportMockupStyle(
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
                                        body = "El archivo se ha guardado exitosamente.",
                                        type = "SYNC"
                                    )
                                    try {
                                        val uri = FileProvider.getUriForFile(context, "${context.packageName}.provider", pdfFile)
                                        val intent = Intent(Intent.ACTION_VIEW).apply {
                                            setDataAndType(uri, "application/pdf")
                                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                        }
                                        context.startActivity(intent)
                                    } catch (e: Exception) {
                                        android.widget.Toast.makeText(context, "No hay lector PDF", android.widget.Toast.LENGTH_SHORT).show()
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
                                Text("Generando Reporte (con imágenes)...", fontSize = 13.sp, fontWeight = FontWeight.Black, color = PureWhite)
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
// GENERADOR PDF CON DISEÑO REPORT MOCKUP E IMÁGENES
// ==========================================
fun generatePdfReportMockupStyle(
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
        val pageWidth = 595   // A4
        val pageHeight = 842  // A4

        val margin = 40f
        var y = margin + 20f

        fun newPage(pageNumber: Int): Pair<PdfDocument.Page, Canvas> {
            val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber).create()
            val page = pdf.startPage(pageInfo)
            // Fondo color marfil (report_mockup.html var--bg-1)
            page.canvas.drawColor(Color.parseColor("#F8F7F2"))
            return page to page.canvas
        }

        var pageNumber = 1
        var (page, canvas) = newPage(pageNumber)

        val goldColor = Color.parseColor("#C49825")
        val text1Color = Color.parseColor("#141410")
        val text2Color = Color.parseColor("#3A3A32")
        val border1Color = Color.parseColor("#D5D4C7")
        val successColor = Color.parseColor("#10B981")

        val paintTitle = Paint().apply { color = text1Color; textSize = 22f; typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD) }
        val paintSubtitle = Paint().apply { color = goldColor; textSize = 10f; typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD) }
        val paintSection = Paint().apply { color = text1Color; textSize = 14f; typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD) }
        val paintLabel = Paint().apply { color = text2Color; textSize = 9f; typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD) }
        val paintValue = Paint().apply { color = text1Color; textSize = 11f; typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD) }
        val paintDesc = Paint().apply { color = text2Color; textSize = 11f; }
        val paintLine = Paint().apply { color = border1Color; strokeWidth = 1f }

        // ---- HEADER ----
        try {
            val logoId = context.resources.getIdentifier("logo_esol_b", "drawable", context.packageName)
            if (logoId != 0) {
                val logoBitmap = BitmapFactory.decodeResource(context.resources, logoId)
                if (logoBitmap != null) {
                    val scale = 40f / logoBitmap.height
                    val logoRect = RectF(margin, y, margin + (logoBitmap.width * scale), y + 40f)
                    canvas.drawBitmap(logoBitmap, null, logoRect, null)
                    logoBitmap.recycle()
                }
            } else {
                canvas.drawText("ESOL ENERGÍAS", margin, y + 25f, paintTitle)
            }
        } catch (e: Exception) { }

        val genDate = SimpleDateFormat("dd DE MMMM, yyyy", Locale("es", "ES")).format(Date()).uppercase()
        canvas.drawText("REPORTE OFICIAL", pageWidth - margin - 110f, y + 10f, paintSubtitle)
        canvas.drawText("BITÁCORA DE OBRA", pageWidth - margin - 220f, y + 30f, paintTitle)
        canvas.drawText("FECHA DE EMISIÓN: $genDate", pageWidth - margin - 190f, y + 45f, paintLabel)
        
        y += 60f
        canvas.drawLine(margin, y, pageWidth - margin, y, paintLine)
        y += 15f

        // ---- PROJECT INFO CARD ----
        val cardPaint = Paint().apply { color = Color.parseColor("#EFEFE8") }
        canvas.drawRoundRect(RectF(margin, y, pageWidth - margin, y + 60f), 8f, 8f, cardPaint)
        canvas.drawRoundRect(RectF(margin, y, pageWidth - margin, y + 60f), 8f, 8f, Paint().apply { style = Paint.Style.STROKE; color = border1Color })
        
        canvas.drawText("NOMBRE DEL PROYECTO", margin + 10f, y + 15f, paintLabel)
        canvas.drawText(projectName, margin + 10f, y + 28f, paintValue)

        canvas.drawText("ESTADO ACTUAL", margin + 300f, y + 15f, paintLabel)
        canvas.drawText("En Progreso", margin + 300f, y + 28f, Paint(paintValue).apply { color = successColor })

        canvas.drawText("RESPONSABLE TÉCNICO", margin + 10f, y + 43f, paintLabel)
        val reporterTitleCase = reporterName.split(" ").joinToString(" ") { word -> word.lowercase().replaceFirstChar { it.uppercase() } }
        val paintResidente = Paint(paintValue).apply { 
            color = Color.parseColor("#666666") 
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL) 
        }
        canvas.drawText(reporterTitleCase, margin + 10f, y + 55f, paintResidente)

        y += 80f

        // ---- FINANCE / PHYSICAL GRID ----
        val isTramite = bitacoras.any { it.concepto_name?.contains("tramit", ignoreCase = true) == true }
        val lblFisico = if (isTramite) "Avance Admin." else "Avance Físico"
        
        if (includeFinancial) {
            canvas.drawText("CONTROL DE GESTIÓN", margin, y, paintSection)
            canvas.drawLine(margin + 170f, y - 5f, pageWidth - margin, y - 5f, Paint().apply { color = goldColor; strokeWidth = 1f })
            y += 15f
            
            val boxW = (pageWidth - margin * 2 - 30) / 4
            val labels = listOf(lblFisico, "Presup. Aprob.", "Devengado", "Remanente")
            val values = listOf("${"%.1f".format(physicalProgress)}%", "$${String.format("%,.0f", totalBudget)}", "$${String.format("%,.0f", totalExecuted)}", "$${String.format("%,.0f", totalBudget - totalExecuted)}")
            val colors = listOf(goldColor, goldColor, successColor, goldColor)
            
            labels.forEachIndexed { i, lbl ->
                val bx = margin + (boxW + 10) * i
                canvas.drawRoundRect(RectF(bx, y, bx + boxW, y + 45f), 4f, 4f, Paint().apply { color = Color.WHITE })
                canvas.drawRoundRect(RectF(bx, y, bx + boxW, y + 45f), 4f, 4f, Paint().apply { style = Paint.Style.STROKE; color = border1Color })
                canvas.drawRect(bx, y, bx + 3f, y + 45f, Paint().apply { color = colors[i] })
                
                canvas.drawText(lbl.uppercase(), bx + 8f, y + 15f, paintLabel)
                canvas.drawText(values[i], bx + 8f, y + 35f, Paint(paintValue).apply { textSize = 14f; typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD) })
            }
            y += 65f
        } else {
            canvas.drawText("RESUMEN DE AVANCE", margin, y, paintSection)
            canvas.drawLine(margin + 160f, y - 5f, pageWidth - margin, y - 5f, Paint().apply { color = goldColor; strokeWidth = 1f })
            y += 15f
            canvas.drawText("$lblFisico: ${"%.1f".format(physicalProgress)}%", margin, y + 10f, paintValue)
            y += 35f
        }

        // ---- CONCEPTOS TRABAJADOS (CHECKLIST) ----
        val uniqueConcepts = bitacoras.mapNotNull { it.concepto_name }.filter { it.isNotBlank() }.distinct()
        if (uniqueConcepts.isNotEmpty()) {
            canvas.drawText("CONCEPTOS TRABAJADOS", margin, y, paintSection)
            canvas.drawLine(margin + 190f, y - 5f, pageWidth - margin, y - 5f, Paint().apply { color = goldColor; strokeWidth = 1f })
            y += 20f
            
            uniqueConcepts.forEach { concept ->
                // Draw elegant checkbox
                val cbX = margin
                val cbY = y - 10f
                canvas.drawRoundRect(RectF(cbX, cbY, cbX + 12f, cbY + 12f), 3f, 3f, Paint().apply { style = Paint.Style.FILL; color = successColor })
                // Draw checkmark
                canvas.drawLine(cbX + 3f, cbY + 6f, cbX + 5f, cbY + 9f, Paint().apply { color = Color.WHITE; strokeWidth = 1.5f; style = Paint.Style.STROKE })
                canvas.drawLine(cbX + 5f, cbY + 9f, cbX + 9f, cbY + 3f, Paint().apply { color = Color.WHITE; strokeWidth = 1.5f; style = Paint.Style.STROKE })
                
                // Draw concept name with simple word wrap
                val words = concept.split(" ")
                var line = ""
                words.forEach { w ->
                    if (paintValue.measureText("$line $w") < (pageWidth - margin * 2 - 20f)) {
                        line += "$w "
                    } else {
                        canvas.drawText(line.trim(), cbX + 20f, y, paintValue)
                        y += 16f
                        line = "$w "
                    }
                }
                if (line.isNotBlank()) {
                    canvas.drawText(line.trim(), cbX + 20f, y, paintValue)
                }
                y += 20f
                
                // Page break check for concepts
                if (y > pageHeight - margin) {
                    pdf.finishPage(page)
                    pageNumber++
                    val next = newPage(pageNumber)
                    page = next.first; canvas = next.second
                    y = margin + 20f
                }
            }
            y += 10f
        }

        // ---- DAILY LOGS (WITH IMAGES) ----
        canvas.drawText("REGISTROS OPERATIVOS", margin, y, paintSection)
        canvas.drawLine(margin + 190f, y - 5f, pageWidth - margin, y - 5f, Paint().apply { color = goldColor; strokeWidth = 1f })
        y += 20f

        bitacoras.forEach { bit ->
            var conceptHeight = 0f
            if (!bit.concepto_name.isNullOrBlank()) {
                conceptHeight = 22f
            }
            
            val descTextLocal = bit.description.replaceFirstChar { if (it.isLowerCase()) it.titlecase(java.util.Locale.getDefault()) else it.toString() }
            val descWordsLocal = descTextLocal.split(" ")
            var tmpLineStr = ""
            var descLineCount = 0
            descWordsLocal.forEach { word ->
                if (paintDesc.measureText("$tmpLineStr $word") < (pageWidth - margin * 2)) {
                    tmpLineStr += "$word "
                } else {
                    descLineCount++
                    tmpLineStr = "$word "
                }
            }
            if (tmpLineStr.isNotEmpty()) {
                descLineCount++
            }
            val descHeight = descLineCount * 16f + 10f
            
            val urisCount = bit.photoUri?.split(",")?.filter { it.isNotBlank() }?.size ?: 0
            val targetW = (pageWidth - margin * 2 - 20f) / 3f
            val targetH = targetW * 0.75f
            val numRows = kotlin.math.ceil(urisCount / 3.0).toInt()
            val imagesHeight = if (urisCount > 0) numRows * (targetH + 10f) else 0f
            
            val totalHeight = 20f + conceptHeight + descHeight + imagesHeight

            // Check space
            if (y + totalHeight > pageHeight - margin) {
                pdf.finishPage(page)
                pageNumber++
                val next = newPage(pageNumber)
                page = next.first; canvas = next.second
                y = margin + 20f
            }

            // Box
            val boxStartY = y
            canvas.drawText(bit.date, margin, y + 10f, paintValue)
            canvas.drawText("Clima: ${bit.weather}  |  Cuadrilla: ${bit.crewCount}", pageWidth - margin - 150f, y + 10f, paintLabel)
            y += 20f

            if (!bit.concepto_name.isNullOrBlank()) {
                canvas.drawRoundRect(RectF(margin, y, pageWidth - margin, y + 18f), 4f, 4f, Paint().apply { color = android.graphics.Color.parseColor("#F3F4F6") }) // Light gray badge
                canvas.drawText("Avance en: ${bit.concepto_name}", margin + 5f, y + 13f, Paint(paintLabel).apply { color = goldColor; textSize = 9f })
                y += 22f
            }
            
            // Text word wrap logic (simplified)
            val descText = bit.description.replaceFirstChar { if (it.isLowerCase()) it.titlecase(java.util.Locale.getDefault()) else it.toString() }
            val descWords = descText.split(" ")
            var lineStr = ""
            descWords.forEach { word ->
                if (paintDesc.measureText("$lineStr $word") < (pageWidth - margin * 2)) {
                    lineStr += "$word "
                } else {
                    canvas.drawText(lineStr, margin, y + 10f, paintDesc)
                    y += 16f
                    lineStr = "$word "
                }
            }
            if (lineStr.isNotEmpty()) {
                canvas.drawText(lineStr, margin, y + 10f, paintDesc)
                y += 16f
            }
            y += 10f

            // Load Images
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
                            val parsedUri = android.net.Uri.parse(uri)
                            val stream = context.contentResolver.openInputStream(parsedUri)
                            if (stream != null) {
                                bMap = BitmapFactory.decodeStream(stream)
                                stream.close()
                                
                                // Fix EXIF rotation
                                val exifStream = context.contentResolver.openInputStream(parsedUri)
                                if (exifStream != null && bMap != null) {
                                    val exif = android.media.ExifInterface(exifStream)
                                    val orientation = exif.getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION, android.media.ExifInterface.ORIENTATION_NORMAL)
                                    val matrix = android.graphics.Matrix()
                                    when (orientation) {
                                        android.media.ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                                        android.media.ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                                        android.media.ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                                    }
                                    if (!matrix.isIdentity) {
                                        val rotated = android.graphics.Bitmap.createBitmap(bMap!!, 0, 0, bMap!!.width, bMap!!.height, matrix, true)
                                        if (rotated != bMap) {
                                            bMap!!.recycle()
                                            bMap = rotated
                                        }
                                    }
                                    exifStream.close()
                                }
                            }
                        } catch (e: Exception) { e.printStackTrace() }
                    } else {
                        // Assume Google Drive or direct HTTP
                        val p1 = "/file/d/([a-zA-Z0-9_-]+)".toRegex()
                        val p2 = "[?&]id=([a-zA-Z0-9_-]+)".toRegex()
                        val p3 = "/open\\?id=([a-zA-Z0-9_-]+)".toRegex()
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
                        // 3 images per row (pageWidth - 2*margin - 2*10f padding) / 3
                        val targetW = (pageWidth - margin * 2 - 20f) / 3f
                        val targetH = targetW * 0.75f // Keep 4:3 aspect ratio
                        
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
                        
                        val densityFactor = 6f // 6x resolution for super sharp PDF printing (approx 432 dpi)
                        val pxTargetW = targetW * densityFactor
                        val pxTargetH = targetH * densityFactor
                        
                        val scale = Math.max(pxTargetW / bMap.width.toFloat(), pxTargetH / bMap.height.toFloat())
                        val finalScale = if (scale > 1f) 1f else scale // Don't upscale
                        
                        val scaledW = (bMap.width * finalScale).toInt()
                        val scaledH = (bMap.height * finalScale).toInt()
                        
                        if (scaledW > 0 && scaledH > 0) {
                            val scaledMap = if (finalScale < 1f) {
                                Bitmap.createScaledBitmap(bMap, scaledW, scaledH, true)
                            } else {
                                bMap
                            }
                            
                            // Crop center in pixel coordinates
                            val cropW = (targetW * (scaledW.toFloat() / targetW)).coerceAtMost(scaledW.toFloat())
                            val cropH = (targetH * (scaledW.toFloat() / targetW)).coerceAtMost(scaledH.toFloat()) 
                            // Wait, aspect ratio is targetW / targetH.
                            // To perfectly match destRect, crop aspect ratio must equal targetW / targetH.
                            val targetAspect = targetW / targetH
                            val imgAspect = scaledW.toFloat() / scaledH.toFloat()
                            
                            var finalCropW = scaledW.toFloat()
                            var finalCropH = scaledH.toFloat()
                            
                            if (imgAspect > targetAspect) {
                                // Image is wider than target. Crop width.
                                finalCropW = scaledH.toFloat() * targetAspect
                            } else {
                                // Image is taller than target. Crop height.
                                finalCropH = scaledW.toFloat() / targetAspect
                            }
                            
                            val srcRect = android.graphics.Rect(
                                ((scaledW - finalCropW) / 2).toInt().coerceAtLeast(0),
                                ((scaledH - finalCropH) / 2).toInt().coerceAtLeast(0),
                                ((scaledW + finalCropW) / 2).toInt().coerceAtMost(scaledW),
                                ((scaledH + finalCropH) / 2).toInt().coerceAtMost(scaledH)
                            )
                            val destRect = RectF(imgX, y, imgX + targetW, y + targetH)
                            
                            canvas.save()
                            val clipPath = android.graphics.Path().apply {
                                addRoundRect(destRect, 8f, 8f, android.graphics.Path.Direction.CW)
                            }
                            canvas.clipPath(clipPath)
                            canvas.drawBitmap(scaledMap, srcRect, destRect, null)
                            canvas.restore()
                            
                            // Draw stroke border
                            canvas.drawRoundRect(destRect, 8f, 8f, Paint().apply { style = Paint.Style.STROKE; color = border1Color; strokeWidth = 1f })
                            
                            if (scaledMap != bMap) {
                                scaledMap.recycle()
                            }
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
            }

            y += 10f
            canvas.drawLine(margin, y, pageWidth - margin, y, paintLine)
            y += 15f
        }

        // ---- FOOTER SIGNATURES ----
        if (y > pageHeight - 140f) {
            pdf.finishPage(page)
            pageNumber++
            val next = newPage(pageNumber)
            page = next.first; canvas = next.second
            y = margin + 20f
        }

        y += 60f // Increased space before the section title
        canvas.drawText("VALIDACIÓN TÉCNICA Y APROBACIÓN", margin, y, paintSection)
        canvas.drawLine(margin + 270f, y - 5f, pageWidth - margin, y - 5f, Paint().apply { color = goldColor; strokeWidth = 1f })
        y += 80f // Increased space for the physical signature

        val sigW = 180f
        val centerX1 = pageWidth / 4f
        val centerX2 = (pageWidth / 4f) * 3f
        
        val paintCenterValue = Paint(paintValue).apply { textAlign = Paint.Align.CENTER }
        val paintCenterLabel = Paint(paintLabel).apply { textAlign = Paint.Align.CENTER }

        val left1 = centerX1 - sigW / 2f
        canvas.drawLine(left1, y, left1 + sigW, y, paintLine)
        canvas.drawText(reporterTitleCase, centerX1, y + 15f, paintCenterValue)
        canvas.drawText("RESIDENTE DE OBRA (ELABORÓ)", centerX1, y + 27f, paintCenterLabel)

        val left2 = centerX2 - sigW / 2f
        canvas.drawLine(left2, y, left2 + sigW, y, paintLine)
        canvas.drawText("REVISIÓN CLIENTE", centerX2, y + 15f, paintCenterValue)
        canvas.drawText("SUPERVISIÓN / CLIENTE (REVISÓ)", centerX2, y + 27f, paintCenterLabel)

        pdf.finishPage(page)

        val pdfFile = File(context.cacheDir, fileName)
        pdfFile.outputStream().use { pdf.writeTo(it) }
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


@Composable
fun ProjectStatusCharts(
    totalBudget: Double,
    totalExecuted: Double,
    physicalProgress: Double,
    adminProgress: Double = 0.0,
    hasAdmin: Boolean = false
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        val finProgress = if (totalBudget > 0) (totalExecuted / totalBudget) else 0.0
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Avance Físico", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SlateDeep, modifier = Modifier.width(130.dp))
            LinearProgressIndicator(
                progress = { (physicalProgress / 100.0).toFloat().coerceIn(0f, 1f) },
                modifier = Modifier.weight(1f).height(10.dp).clip(RoundedCornerShape(100.dp)),
                color = SuccessGreen,
                trackColor = LightGrayBg
            )
            Text("${"%.1f".format(physicalProgress)}%", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SuccessGreen, modifier = Modifier.padding(start = 12.dp).width(50.dp))
        }
        
        if (hasAdmin) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Avance Admin.", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SlateDeep, modifier = Modifier.width(130.dp))
                LinearProgressIndicator(
                    progress = { (adminProgress / 100.0).toFloat().coerceIn(0f, 1f) },
                    modifier = Modifier.weight(1f).height(10.dp).clip(RoundedCornerShape(100.dp)),
                    color = ConnectedBlue,
                    trackColor = LightGrayBg
                )
                Text("${"%.1f".format(adminProgress)}%", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = ConnectedBlue, modifier = Modifier.padding(start = 12.dp).width(50.dp))
            }
        }
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Gasto Devengado", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SlateDeep, modifier = Modifier.width(130.dp))
            LinearProgressIndicator(
                progress = { finProgress.toFloat().coerceIn(0f, 1f) },
                modifier = Modifier.weight(1f).height(10.dp).clip(RoundedCornerShape(100.dp)),
                color = if (finProgress > 1.0) WarningRed else ConnectedBlue,
                trackColor = LightGrayBg
            )
            Text("${"%.1f".format(finProgress * 100)}%", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = if (finProgress > 1.0) WarningRed else ConnectedBlue, modifier = Modifier.padding(start = 12.dp).width(50.dp))
        }
    }
}
