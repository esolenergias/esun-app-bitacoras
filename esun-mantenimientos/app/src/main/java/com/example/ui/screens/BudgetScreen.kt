package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.database.BudgetItemEntity
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel
import kotlinx.coroutines.launch

@Composable
fun AjustesObraScreen(viewModel: BitacoraViewModel) {
    val syncStatus by viewModel.syncStatus.collectAsState()
    var showSupabaseDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBg)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // --- ERP & SUPABASE HEADER BANNER ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = PureWhite)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "CONCEPTOS Y MATRICES DE OBRA",
                        fontWeight = FontWeight.Black,
                        fontSize = 11.sp,
                        color = ConnectedBlue,
                        letterSpacing = 0.5.sp
                    )

                    if (syncStatus.isSupabaseConnected) {
                        Box(
                            modifier = Modifier
                                .background(SuccessGreenBg, RoundedCornerShape(100.dp))
                                .border(BorderStroke(1.dp, Color(0xFFD1FAE5)), RoundedCornerShape(100.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                "SUPABASE LINKED",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = SuccessGreen
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .background(LightGrayBg, RoundedCornerShape(100.dp))
                                .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(100.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                "SUPABASE OFFLINE",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = OnSurfaceVariant
                            )
                        }
                    }
                }
                Text(
                    text = "Configure las integraciones de su obra para obtener datos del ERP o de Supabase.",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = OnSurfaceVariant,
                    lineHeight = 15.sp,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        // --- ACTIONS ROW (ERP SYNC & SUPABASE CONNECT) ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { viewModel.triggerBudgetSync() },
                colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.CloudDownload, contentDescription = null, tint = PureWhite, modifier = Modifier.size(16.dp))
                    Text("SINCRONIZAR ERP", fontWeight = FontWeight.Black, color = PureWhite, fontSize = 11.sp)
                }
            }

            Button(
                onClick = { showSupabaseDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = SolarAmber),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.CloudSync, contentDescription = null, tint = SlateDeep, modifier = Modifier.size(16.dp))
                    Text("VINCULAR SUPABASE", fontWeight = FontWeight.Black, color = SlateDeep, fontSize = 11.sp)
                }
            }
        }
    }
    
    if (showSupabaseDialog) {
        SupabaseConfigDialog(
            viewModel = viewModel,
            onDismiss = { showSupabaseDialog = false }
        )
    }
}

@Composable
fun BudgetScreen(viewModel: BitacoraViewModel) {
    val budgetItems by viewModel.budgetItems.collectAsState()
    val syncStatus by viewModel.syncStatus.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    var selectedConceptForMatrix by remember { mutableStateOf<BudgetItemEntity?>(null) }
    var showSupabaseDialog by remember { mutableStateOf(false) }
    var showAddConceptDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBg)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {

        // --- SECTION HEADER TITLE ---
        Text(
            text = "PRESUPUESTO EJECUTABLE (${budgetItems.size} CONCEPTOS)",
            fontWeight = FontWeight.Black,
            fontSize = 12.sp,
            color = SlateDeep,
            letterSpacing = 0.5.sp
        )

        // --- CONCEPTS LAZY LIST ---
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(budgetItems) { item ->
                BudgetItemRow(
                    item = item,
                    onClick = {
                        selectedConceptForMatrix = item
                    },
                    onIncrement = {
                        val nextQty = (item.executedQuantity + 0.05 * item.quantity).coerceAtMost(item.quantity)
                        coroutineScope.launch {
                            viewModel.updateBudgetItem(item.copy(executedQuantity = nextQty))
                            viewModel.simulatePushNotification(
                                title = "Avance de Concepto Eléctrico",
                                body = "Se actualizó ${item.code} al ${String.format("%.0f", (nextQty / item.quantity) * 100)}% de ejecución.",
                                type = "ERP"
                            )
                        }
                    },
                    onDecrement = {
                        val prevQty = (item.executedQuantity - 0.05 * item.quantity).coerceAtLeast(0.0)
                        coroutineScope.launch {
                            viewModel.updateBudgetItem(item.copy(executedQuantity = prevQty))
                        }
                    }
                )
            }
            item {
                Button(
                    onClick = { showAddConceptDialog = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .padding(top = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = PureWhite)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Añadir Concepto", fontWeight = FontWeight.Bold, color = PureWhite)
                }
            }
        }
    }

    // --- DIALOG SHOW TRIGGERS ---
    selectedConceptForMatrix?.let { concept ->
        ConceptMatrixDialog(
            item = concept,
            viewModel = viewModel,
            onDismiss = { selectedConceptForMatrix = null }
        )
    }

    if (showSupabaseDialog) {
        SupabaseConfigDialog(
            viewModel = viewModel,
            onDismiss = { showSupabaseDialog = false }
        )
    }
    
    if (showAddConceptDialog) {
        AddConceptDialog(
            onDismiss = { showAddConceptDialog = false },
            onAdd = { newConcept ->
                coroutineScope.launch {
                    viewModel.updateBudgetItem(newConcept)
                    showAddConceptDialog = false
                }
            }
        )
    }
}

@Composable
fun BudgetItemRow(
    item: BudgetItemEntity,
    onClick: () -> Unit,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit
) {
    val executionPercentage = (item.executedQuantity / item.quantity) * 100.0
    val costSpent = item.executedQuantity * item.unitPrice
    val totalCost = item.quantity * item.unitPrice

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = PureWhite)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            // Header item info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (!(item.code.length > 12 || item.code.contains("-"))) {
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFEFF6FF), RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = item.code,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = ConnectedBlue
                        )
                    }
                } else {
                    Spacer(modifier = Modifier.width(1.dp))
                }

                Text(
                    text = "$${String.format("%,.2f", item.unitPrice)} MXN / ${item.unit}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = SlateDeep
                )
            }

            Text(
                text = item.description,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = SlateDeep,
                lineHeight = 16.sp
            )

            // Progress labels
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Progreso: ${String.format("%.1f", item.executedQuantity)} / ${String.format("%.1f", item.quantity)} ${item.unit}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = OnSurfaceVariant
                )
                Text(
                    text = "${String.format("%.0f", executionPercentage)}%",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = if (executionPercentage >= 100.0) SuccessGreen else ConnectedBlue
                )
            }

            // Custom styled progress bar
            val progressVal = if (item.quantity > 0.0) (item.executedQuantity / item.quantity).toFloat() else 0f
            LinearProgressIndicator(
                progress = progressVal,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(100.dp)),
                color = if (executionPercentage >= 100.0) SuccessGreen else ConnectedBlue,
                trackColor = LightGrayBg
            )

            // Spent cost and Matrix action trigger
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = "Gasto: $${String.format("%,.0f", costSpent)} / $${String.format("%,.0f", totalCost)} MXN",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        color = SlateDeep
                    )
                    Text(
                        text = "Ver análisis unitario (matriz) ➔",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        color = ConnectedBlue
                    )
                }

                // Custom control stepper buttons
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onDecrement,
                        modifier = Modifier
                            .size(36.dp)
                            .background(LightGrayBg, RoundedCornerShape(8.dp))
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(8.dp))
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Menos", tint = SlateDeep, modifier = Modifier.size(16.dp))
                    }

                    IconButton(
                        onClick = onIncrement,
                        modifier = Modifier
                            .size(36.dp)
                            .background(SolarAmber, RoundedCornerShape(8.dp))
                            .border(BorderStroke(1.dp, SolarAmber), RoundedCornerShape(8.dp))
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Más", tint = SlateDeep, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun ConceptMatrixDialog(
    item: BudgetItemEntity,
    viewModel: BitacoraViewModel,
    onDismiss: () -> Unit
) {
    val matrixItemsFlow = remember(item.code) { viewModel.getMatrixForConcept(item.code, item.obraId) }
    val matrixItems by matrixItemsFlow.collectAsState(initial = emptyList())

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("CERRAR", fontWeight = FontWeight.Black, color = ConnectedBlue)
            }
        },
        title = {
            Column {
                Text(
                    text = "ANÁLISIS DE PRECIO UNITARIO (MATRIZ)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp,
                    color = ConnectedBlue,
                    letterSpacing = 1.sp
                )
                val displayTitle = if (item.code.length > 12 || item.code.contains("-")) item.description else "${item.code}: ${item.description}"
                Text(
                    text = displayTitle,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = SlateDeep,
                    lineHeight = 18.sp
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 350.dp)
            ) {
                if (matrixItems.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No hay matriz de insumos registrada para este concepto.\nConéctese con Supabase para sincronizar matrices.",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = OnSurfaceVariant,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(matrixItems) { resource ->
                            val cardBg = when (resource.resourceType) {
                                "Material" -> Color(0xFFEFF6FF)
                                "Mano de Obra" -> Color(0xFFF0FDF4)
                                "Herramienta/Equipo" -> Color(0xFFFFFBEB)
                                else -> LightGrayBg
                            }
                            val outlineColor = when (resource.resourceType) {
                                "Material" -> Color(0xFFBFDBFE)
                                "Mano de Obra" -> Color(0xFFBBF7D0)
                                "Herramienta/Equipo" -> Color(0xFFFDE68A)
                                else -> SubtleOutline
                            }
                            val chipBg = when (resource.resourceType) {
                                "Material" -> Color(0xFFDBEAFE)
                                "Mano de Obra" -> Color(0xFFDCFCE7)
                                "Herramienta/Equipo" -> Color(0xFFFEF3C7)
                                else -> PureWhite
                            }
                            val chipText = when (resource.resourceType) {
                                "Material" -> Color(0xFF1E40AF)
                                "Mano de Obra" -> Color(0xFF166534)
                                "Herramienta/Equipo" -> Color(0xFF92400E)
                                else -> OnSurfaceVariant
                            }

                            Card(
                                colors = CardDefaults.cardColors(containerColor = cardBg),
                                border = BorderStroke(1.dp, outlineColor),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = resource.resourceDescription,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp,
                                            color = SlateDeep,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Box(
                                            modifier = Modifier
                                                .background(chipBg, RoundedCornerShape(4.dp))
                                                .border(BorderStroke(1.dp, outlineColor), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = resource.resourceType,
                                                fontWeight = FontWeight.Black,
                                                fontSize = 8.sp,
                                                color = chipText
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Cant: ${resource.quantity} ${resource.unit} @ $${resource.unitPrice}",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = OnSurfaceVariant
                                        )
                                        Text(
                                            text = "Subtotal: $${String.format("%.2f", resource.totalCost)} MXN",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Black,
                                            color = ConnectedBlue
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Costo Unitario Consolidado:",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = SlateDeep
                    )
                    Text(
                        text = "$${String.format("%.2f", item.unitPrice)} MXN",
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        color = SuccessGreen
                    )
                }
            }
        },
        shape = RoundedCornerShape(16.dp),
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
        containerColor = PureWhite
    )
}

@Composable
fun SupabaseConfigDialog(
    viewModel: BitacoraViewModel,
    onDismiss: () -> Unit
) {
    val syncStatus by viewModel.syncStatus.collectAsState()

    var urlInput by remember { mutableStateOf(syncStatus.supabaseUrl.ifEmpty { "https://" }) }
    var keyInput by remember { mutableStateOf(syncStatus.supabaseKey) }
    var isTesting by remember { mutableStateOf(false) }
    var syncResultMsg by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    isTesting = true
                    syncResultMsg = null
                    viewModel.triggerSupabaseSync(urlInput.trim(), keyInput.trim()) { success ->
                        isTesting = false
                        syncResultMsg = if (success) "¡Sincronizado con éxito! ✅" else "Error al conectar con Supabase. Revise credenciales. ❌"
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue),
                shape = RoundedCornerShape(8.dp),
                enabled = !isTesting && urlInput.length > 10 && keyInput.isNotEmpty()
            ) {
                if (isTesting || syncStatus.isSyncing) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = PureWhite, strokeWidth = 2.dp)
                } else {
                    Text("CONECTAR", fontWeight = FontWeight.Black, color = PureWhite, fontSize = 12.sp)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("CERRAR", fontWeight = FontWeight.Black, color = OnSurfaceVariant)
            }
        },
        title = {
            Text("CONECTAR COTIZADOR SUPABASE", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = SlateDeep)
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Ingrese las credenciales de su proyecto de Supabase para descargar su lista de conceptos y matrices analizadas en tiempo real.",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = OnSurfaceVariant,
                    lineHeight = 15.sp
                )

                OutlinedTextField(
                    value = urlInput,
                    onValueChange = { urlInput = it },
                    label = { Text("Supabase Project URL") },
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ConnectedBlue,
                        unfocusedBorderColor = SubtleOutline,
                        focusedLabelColor = ConnectedBlue,
                        focusedContainerColor = LightGrayBg,
                        unfocusedContainerColor = LightGrayBg
                    ),
                    shape = RoundedCornerShape(8.dp)
                )

                OutlinedTextField(
                    value = keyInput,
                    onValueChange = { keyInput = it },
                    label = { Text("Supabase Anon Key / API Key") },
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ConnectedBlue,
                        unfocusedBorderColor = SubtleOutline,
                        focusedLabelColor = ConnectedBlue,
                        focusedContainerColor = LightGrayBg,
                        unfocusedContainerColor = LightGrayBg
                    ),
                    shape = RoundedCornerShape(8.dp)
                )

                if (syncResultMsg != null) {
                    Text(
                        text = syncResultMsg!!,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = if (syncResultMsg!!.contains("éxito")) SuccessGreen else EsolOrange,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))
                HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

                Text(
                    text = "CONSOLA DE COMUNICACIÓN SUPABASE:",
                    fontWeight = FontWeight.Black,
                    fontSize = 10.sp,
                    color = SlateDeep,
                    letterSpacing = 0.5.sp
                )

                // Consola terminal box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(96.dp)
                        .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                        .padding(8.dp)
                ) {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        if (syncStatus.syncLog.none { it.contains("Supabase") }) {
                            item {
                                Text(
                                    text = "> Consola de Supabase lista. Presione conectar para inicializar handshake.",
                                    color = SolarAmber,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        } else {
                            items(syncStatus.syncLog.filter { it.contains("Supabase") || it.contains("supabase") }) { log ->
                                Text(
                                    text = log,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (log.contains("ERROR") || log.contains("Error")) WarningRed else SuccessGreen,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }
        },
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
        containerColor = PureWhite
    )
}

@Composable
fun AddConceptDialog(
    onDismiss: () -> Unit,
    onAdd: (BudgetItemEntity) -> Unit
) {
    var conceptCode by remember { mutableStateOf("") }
    var conceptDesc by remember { mutableStateOf("") }
    var conceptUnit by remember { mutableStateOf("") }
    var conceptQty by remember { mutableStateOf("") }
    var conceptPrice by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    val newConcept = BudgetItemEntity(
                        id = 0,
                        code = conceptCode.ifEmpty { "N/A" },
                        description = conceptDesc.ifEmpty { "Nuevo Concepto" },
                        unit = conceptUnit.ifEmpty { "Unidad" },
                        quantity = conceptQty.toDoubleOrNull() ?: 1.0,
                        executedQuantity = 0.0,
                        unitPrice = conceptPrice.toDoubleOrNull() ?: 0.0,
                        totalBudget = (conceptQty.toDoubleOrNull() ?: 1.0) * (conceptPrice.toDoubleOrNull() ?: 0.0)
                    )
                    onAdd(newConcept)
                },
                colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("AÑADIR", fontWeight = FontWeight.Black, color = PureWhite, fontSize = 12.sp)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("CANCELAR", fontWeight = FontWeight.Black, color = OnSurfaceVariant)
            }
        },
        title = {
            Text("AÑADIR CONCEPTO", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = SlateDeep)
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = conceptCode,
                    onValueChange = { conceptCode = it },
                    label = { Text("Código") },
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ConnectedBlue,
                        unfocusedBorderColor = SubtleOutline,
                        focusedLabelColor = ConnectedBlue,
                        focusedTextColor = Color.Black,
                        unfocusedTextColor = Color.Black
                    ),
                    singleLine = true,
                    shape = RoundedCornerShape(8.dp)
                )
                OutlinedTextField(
                    value = conceptDesc,
                    onValueChange = { conceptDesc = it },
                    label = { Text("Descripción") },
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ConnectedBlue,
                        unfocusedBorderColor = SubtleOutline,
                        focusedLabelColor = ConnectedBlue,
                        focusedTextColor = Color.Black,
                        unfocusedTextColor = Color.Black
                    ),
                    shape = RoundedCornerShape(8.dp)
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = conceptUnit,
                        onValueChange = { conceptUnit = it },
                        label = { Text("Unidad") },
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold),
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ConnectedBlue,
                            unfocusedBorderColor = SubtleOutline,
                            focusedLabelColor = ConnectedBlue,
                            focusedTextColor = Color.Black,
                            unfocusedTextColor = Color.Black
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(8.dp)
                    )
                    OutlinedTextField(
                        value = conceptQty,
                        onValueChange = { conceptQty = it },
                        label = { Text("Cantidad") },
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold),
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ConnectedBlue,
                            unfocusedBorderColor = SubtleOutline,
                            focusedLabelColor = ConnectedBlue,
                            focusedTextColor = Color.Black,
                            unfocusedTextColor = Color.Black
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(8.dp)
                    )
                }
                OutlinedTextField(
                    value = conceptPrice,
                    onValueChange = { conceptPrice = it },
                    label = { Text("Precio Unitario") },
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ConnectedBlue,
                        unfocusedBorderColor = SubtleOutline,
                        focusedLabelColor = ConnectedBlue,
                        focusedTextColor = Color.Black,
                        unfocusedTextColor = Color.Black
                    ),
                    singleLine = true,
                    shape = RoundedCornerShape(8.dp)
                )
            }
        },
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
        containerColor = PureWhite
    )
}
