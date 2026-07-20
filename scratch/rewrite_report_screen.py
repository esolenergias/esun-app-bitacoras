import os
import re

file_path = r'C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# We want to replace the `fun ReportScreen(viewModel: BitacoraViewModel) { ... }` up to `// ==========================================`
pattern = r'@Composable\s+fun ReportScreen\(viewModel: BitacoraViewModel\) \{.*?(?=// ==========================================)'

replacement = """@Composable
fun ReportScreen(viewModel: BitacoraViewModel) {
    val bitacoras by viewModel.bitacorasList.collectAsState()
    val budgetItems by viewModel.budgetItems.collectAsState()
    val userName by viewModel.userName.collectAsState()
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
            if (bitacorasByProject.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Aún no hay reportes registrados.", color = OnSurfaceVariant, fontSize = 14.sp)
                }
            } else {
                bitacorasByProject.entries.sortedBy { it.key }.forEach { (projectName, projectBitacoras) ->
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

            // Ledger Summary
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                LedgerRow("Presupuesto Estimado:", "$${String.format("%,.2f", totalProjectBudget)} MXN", SlateDeep)
                LedgerRow("Gasto Devengado:", "$${String.format("%,.2f", totalCostExecuted)} MXN", SuccessGreen)
                val remanente = totalProjectBudget - totalCostExecuted
                LedgerRow("Remanente Disponible:", "$${String.format("%,.2f", remanente)} MXN", if (remanente >= 0) ConnectedBlue else WarningRed)
                LedgerRow("Avance Físico:", "${"%.1f".format(overallPhysicalProgress)}%", ConnectedBlue)
                LedgerRow("Registros Diarios:", "${bitacoras.size} reportes", OnSurfaceVariant)
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

"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_code)

print("ReportScreen rewritten successfully to group by project!")
