package com.example.ui.screens

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
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalContext
import android.widget.Toast
import androidx.compose.material.icons.automirrored.filled.*

import com.example.data.database.BudgetItemEntity
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import com.example.data.database.BitacoraEntity

import com.example.ui.theme.*
import com.example.data.database.TaskEntity
import com.example.ui.viewmodel.BitacoraViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ObraDashboardScreen(
    viewModel: BitacoraViewModel,
    projectName: String,
    onNavigateBack: () -> Unit,
    onNavigateToNewLog: () -> Unit,
    onNavigateToReportsList: () -> Unit,
    onNavigateToReportDetail: (Int) -> Unit
) {
    val bitacoras by viewModel.bitacorasList.collectAsState()
    val budgetItems by viewModel.budgetItems.collectAsState()
    val coroutineScope = rememberCoroutineScope()
    val userRole by viewModel.userRole.collectAsState()
    val canModifyBudget = userRole == "Master" || userRole == "Supervisor"
    val scrollState = rememberScrollState()
    val isAiModelLoaded by viewModel.isAiModelLoaded.collectAsState()
    val isAiProcessing by viewModel.isAiProcessing.collectAsState()
    
    val todayDateDbStr = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()) }
    
    val siteBitacoras = remember(bitacoras, projectName) {
        bitacoras.filter { it.siteName == projectName }
    }
    
    val todayBitacoras = remember(siteBitacoras, todayDateDbStr) {
        siteBitacoras.filter { it.date == todayDateDbStr }
    }

    // Stateful tasks list
    val tasksState by viewModel.tasks.collectAsState()

    val activeTasks = remember(tasksState) {
        tasksState.filter { it.obraId == projectName && !it.isArchived }
    }

    val pendingCount = remember(activeTasks) {
        activeTasks.count { !it.isCompleted }
    }

    // Dynamic metrics calculated from the live database
    val overallPhysicalProgress = if (budgetItems.isNotEmpty()) {
        val totalExecuted = budgetItems.sumOf { if (it.executedQuantity >= it.quantity) 1.0 else 0.0 }
        (totalExecuted / budgetItems.size) * 100.0
    } else {
        0.0
    }
    
    // Concepto Dialog State
    var showConceptoDialog by remember { mutableStateOf(false) }
    var editConcepto by remember { mutableStateOf<BudgetItemEntity?>(null) }
    var editConceptoDesc by remember { mutableStateOf("") }
    
    // Task Editor Dialog
    var showTaskDialog by remember { mutableStateOf(false) }
    var selectedTask by remember { mutableStateOf<TaskEntity?>(null) }
    
    // New Task State
    var editTitle by remember { mutableStateOf("") }
    var editDesc by remember { mutableStateOf("") }
    var editTime by remember { mutableStateOf("12:00") }
    var editMeridiem by remember { mutableStateOf("PM") }
    var editImportant by remember { mutableStateOf(false) }

    val context = LocalContext.current

    // New Dialog and Activity Results
    var showMaterialDialog by remember { mutableStateOf(false) }
    var materialName by remember { mutableStateOf("") }
    var materialQty by remember { mutableStateOf("") }
    var materialUnit by remember { mutableStateOf("Pzas") }
    var materialUrgency by remember { mutableStateOf("Media") }
    var materialLocation by remember { mutableStateOf("") }
    var materialNotes by remember { mutableStateOf("") }
    
    var isDatosObraExpanded by remember { mutableStateOf(false) }
    
    val projectDetails = remember(projectName) { viewModel.getProjectDetails(projectName) }
    var obraCliente by remember { mutableStateOf(projectDetails["cliente"] ?: "") }
    var obraUbicacion by remember { mutableStateOf(projectDetails["ubicacion"] ?: "") }
    var obraInicio by remember { mutableStateOf(projectDetails["inicio"] ?: "") }
    var obraTermino by remember { mutableStateOf(projectDetails["termino"] ?: "") }
    var obraResidente by remember { mutableStateOf(projectDetails["residente"] ?: "") }
    
    var isEditingDatosObra by remember { mutableStateOf(false) }
    
    // Save details whenever they exit edit mode
    LaunchedEffect(isEditingDatosObra) {
        if (!isEditingDatosObra) {
            viewModel.saveProjectDetails(projectName, obraCliente, obraUbicacion, obraInicio, obraTermino, obraResidente)
        }
    }
    LaunchedEffect(projectName) {
        viewModel.selectedObraId.value = projectName
    }
    val tabs = if (userRole == "Trabajador") {
        listOf("Resumen", "Datos de obra")
    } else {
        listOf("Resumen", "Costos", "Datos de obra")
    }


    var selectedTabIndex by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBg)
    ) {
        // --- 1. TOP BAR ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Regresar", tint = SlateDeep)
                }
                Text(
                    text = projectName,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = SlateDeep
                )
            }
        }
        
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = PureWhite,
            contentColor = ConnectedBlue,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = ConnectedBlue
                )
            }
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    selectedContentColor = ConnectedBlue,
                    unselectedContentColor = OnSurfaceVariant
                )
            }
        }
        HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

        Box(modifier = Modifier.weight(1f)) {
            when (tabs[selectedTabIndex]) {
                "Resumen" -> {
        // --- SCROLLABLE BOARD ---
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Welcome Section
            Text(
                text = remember { SimpleDateFormat("EEEE, dd 'DE' MMMM", Locale("es", "MX")).format(Date()).uppercase(Locale("es", "MX")) },
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp,
                color = OnSurfaceVariant,
                letterSpacing = 1.sp
            )

            // --- 2. AVANCE FISICO ---
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = PureWhite)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Avance Físico de Obra",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = OnSurfaceVariant
                        )
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .background(Color(0xFFEFF6FF), RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Architecture,
                                contentDescription = null,
                                tint = ConnectedBlue,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                    Column {
                        Row(
                            verticalAlignment = Alignment.Bottom,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = "${String.format("%.0f", overallPhysicalProgress)}%",
                                fontWeight = FontWeight.Black,
                                fontSize = 32.sp,
                                color = SlateDeep
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        LinearProgressIndicator(
                            progress = (overallPhysicalProgress / 100.0).toFloat(),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(100.dp)),
                            color = ConnectedBlue,
                            trackColor = LightGrayBg
                        )
                    }
                }
            }


            // --- 4. TAREAS ---
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Tareas",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp,
                        color = SlateDeep
                    )
                    Text(
                        text = if (pendingCount > 0) "$pendingCount PENDIENTES" else "AL DÍA",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        color = if (pendingCount > 0) WarningRed else SuccessGreen
                    )
                }

                if (activeTasks.isEmpty()) {
                    Text(
                        text = "No hay tareas pendientes en esta obra.",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                } else {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = PureWhite)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            activeTasks.forEachIndexed { index, task ->
                                ObraTaskItem(
                                    task = task,
                                    onClick = { 
                                        selectedTask = task
                                        editTitle = task.title
                                        editDesc = task.desc
                                        editTime = task.time
                                        editMeridiem = task.meridiem
                                        editImportant = task.isImportant
                                        showTaskDialog = true
                                    },
                                    onToggleStatus = { 
                                        viewModel.updateTask(task.copy(isCompleted = !task.isCompleted))
                                    }
                                )
                                if (index < activeTasks.size - 1) {
                                    Spacer(modifier = Modifier.height(16.dp))
                                }
                            }
                        }
                    }
                }

                Button(
                    onClick = { 
                        selectedTask = null
                        editTitle = ""
                        editDesc = ""
                        editTime = "08:00"
                        editMeridiem = "AM"
                        editImportant = false
                        showTaskDialog = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = PureWhite)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Nueva Tarea", fontWeight = FontWeight.Bold, color = PureWhite)
                }
            }
            
            // --- CONCEPTOS DEL PRESUPUESTO ---
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Resumen de Conceptos",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    color = SlateDeep
                )
                if (budgetItems.isEmpty()) {
                    Text(
                        text = "No hay conceptos vinculados a esta obra.",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                } else {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = PureWhite)
                    ) {
                        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                            budgetItems.forEachIndexed { index, item ->
                                val isCompleted = item.executedQuantity >= item.quantity
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            val newQty = if (isCompleted) 0.0 else item.quantity
                                            coroutineScope.launch {
                                                viewModel.updateBudgetItem(item.copy(executedQuantity = newQty))
                                            }
                                        }
                                        .padding(vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Checkbox(
                                        checked = isCompleted,
                                        onCheckedChange = { checked ->
                                            val newQty = if (checked) item.quantity else 0.0
                                            coroutineScope.launch {
                                                viewModel.updateBudgetItem(item.copy(executedQuantity = newQty))
                                            }
                                        },
                                        colors = CheckboxDefaults.colors(
                                            checkedColor = SuccessGreen,
                                            uncheckedColor = SubtleOutline
                                        )
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        val cleanText = if (item.code.length > 12 || item.code.contains("-")) item.description else "${item.code} - ${item.description}"
                                        Text(
                                            text = cleanText,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            color = if (isCompleted) OnSurfaceVariant else SlateDeep,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                                if (index < budgetItems.size - 1) {
                                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                                }
                            }
                        }
                    }
                }
            }
            
            // --- 6. REPORTES DIARIOS (HOY) ---
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Reportes Diarios (Hoy)",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp,
                        color = SlateDeep
                    )
                }

                if (todayBitacoras.isEmpty()) {
                    Text(
                        text = "No hay reportes generados hoy.",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                } else {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = PureWhite)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            todayBitacoras.forEachIndexed { index, bitacora ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { onNavigateToReportDetail(bitacora.id) }
                                        .padding(vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .background(LightGrayBg, RoundedCornerShape(8.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.AutoMirrored.Filled.Assignment, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(20.dp))
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = bitacora.weather + " • " + bitacora.crewCount + " pers.",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = OnSurfaceVariant
                                        )
                                        Text(
                                            text = bitacora.description,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = SlateDeep,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                                if (index < todayBitacoras.size - 1) {
                                    HorizontalDivider(color = SubtleOutline.copy(alpha = 0.5f), thickness = 1.dp)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(40.dp))
        }

                } // End of selectedTabIndex == 0
                "Costos" -> {
                    BudgetScreen(viewModel = viewModel)
                }
                "Datos de obra" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                            colors = CardDefaults.cardColors(containerColor = PureWhite)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "DATOS GENERALES DE LA OBRA",
                                        fontWeight = FontWeight.Black,
                                        fontSize = 13.sp,
                                        color = SlateDeep,
                                        letterSpacing = 0.5.sp
                                    )
                                    if (canModifyBudget) {
                                        IconButton(
                                            onClick = { isEditingDatosObra = !isEditingDatosObra },
                                            modifier = Modifier.size(32.dp).background(if (isEditingDatosObra) Color(0xFFEFF6FF) else Color.Transparent, RoundedCornerShape(8.dp))
                                        ) {
                                            Icon(
                                                imageVector = if (isEditingDatosObra) Icons.Default.Check else Icons.Default.Edit,
                                                contentDescription = "Editar",
                                                tint = ConnectedBlue,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }

                                if (!isEditingDatosObra) {
                                    ObraDetailRow(label = "Cliente", value = obraCliente)
                                    ObraDetailRow(label = "Ubicación", value = obraUbicacion)
                                    ObraDetailRow(label = "Inicio", value = obraInicio)
                                    ObraDetailRow(label = "Término Estimado", value = obraTermino)
                                    ObraDetailRow(label = "Residente Técnico", value = obraResidente)
                                } else {
                                    OutlinedTextField(
                                        value = obraCliente,
                                        onValueChange = { obraCliente = it },
                                        label = { Text("Cliente") },
                                        modifier = Modifier.fillMaxWidth(),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = ConnectedBlue,
                                            unfocusedBorderColor = SubtleOutline,
                                            focusedLabelColor = ConnectedBlue,
                                            focusedTextColor = Color.Black,
                                            unfocusedTextColor = Color.Black
                                        )
                                    )
                                    OutlinedTextField(
                                        value = obraUbicacion,
                                        onValueChange = { obraUbicacion = it },
                                        label = { Text("Ubicación") },
                                        modifier = Modifier.fillMaxWidth(),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = ConnectedBlue,
                                            unfocusedBorderColor = SubtleOutline,
                                            focusedLabelColor = ConnectedBlue,
                                            focusedTextColor = Color.Black,
                                            unfocusedTextColor = Color.Black
                                        )
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedTextField(
                                            value = obraInicio,
                                            onValueChange = { obraInicio = it },
                                            label = { Text("Inicio") },
                                            modifier = Modifier.weight(1f),
                                            singleLine = true,
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = ConnectedBlue,
                                                unfocusedBorderColor = SubtleOutline,
                                                focusedLabelColor = ConnectedBlue,
                                                focusedTextColor = Color.Black,
                                                unfocusedTextColor = Color.Black
                                            )
                                        )
                                        OutlinedTextField(
                                            value = obraTermino,
                                            onValueChange = { obraTermino = it },
                                            label = { Text("Término Estimado") },
                                            modifier = Modifier.weight(1f),
                                            singleLine = true,
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = ConnectedBlue,
                                                unfocusedBorderColor = SubtleOutline,
                                                focusedLabelColor = ConnectedBlue,
                                                focusedTextColor = Color.Black,
                                                unfocusedTextColor = Color.Black
                                            )
                                        )
                                    }
                                    OutlinedTextField(
                                        value = obraResidente,
                                        onValueChange = { obraResidente = it },
                                        label = { Text("Residente Técnico") },
                                        modifier = Modifier.fillMaxWidth(),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = ConnectedBlue,
                                            unfocusedBorderColor = SubtleOutline,
                                            focusedLabelColor = ConnectedBlue,
                                            focusedTextColor = Color.Black,
                                            unfocusedTextColor = Color.Black
                                        )
                                    )
                                }
                            }
                        }
                    }
                }
            } // End of when
        } // End of Box

        // --- BOTTOM ACTIONS ---
        Surface(
            color = PureWhite,
            shadowElevation = 8.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left: Material Faltante
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.wrapContentWidth()) {
                    FilledTonalIconButton(
                        onClick = { showMaterialDialog = true },
                        modifier = Modifier.size(56.dp),
                        colors = IconButtonDefaults.filledTonalIconButtonColors(
                            containerColor = WarningRedBg,
                            contentColor = WarningRed
                        )
                    ) {
                        Icon(Icons.Default.Inventory, contentDescription = "Material Faltante", modifier = Modifier.size(28.dp))
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Reporte de material",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = SlateDeep,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        maxLines = 2,
                        modifier = Modifier.widthIn(max = 85.dp)
                    )
                }
                
                // Center: Reporte Diario
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    FloatingActionButton(
                        onClick = onNavigateToNewLog,
                        modifier = Modifier.size(80.dp), // 30% larger approx
                        containerColor = ConnectedBlue, // Color de fondo
                        contentColor = PureWhite,
                        shape = androidx.compose.foundation.shape.CircleShape, // Circulo
                        elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 8.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Nuevo Reporte Diario", modifier = Modifier.size(40.dp)) // Signo de +
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Reporte Diario", fontSize = 11.sp, fontWeight = FontWeight.Black, color = ConnectedBlue)
                }
                
                // Right: Relación de reportes
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(72.dp)) {
                    FilledTonalIconButton(
                        onClick = onNavigateToReportsList,
                        modifier = Modifier.size(56.dp),
                        colors = IconButtonDefaults.filledTonalIconButtonColors(
                            containerColor = LightGrayBg,
                            contentColor = SlateDeep
                        )
                    ) {
                        Icon(Icons.Default.FormatListBulleted, contentDescription = "Relación de reportes", modifier = Modifier.size(28.dp))
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Reportes", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                }
            }
        }
    }
    
    // Concepto Editor Dialog
    if (showConceptoDialog) {
        AlertDialog(
            onDismissRequest = { showConceptoDialog = false },
            title = {
                Text(if (editConcepto == null) "Nuevo Concepto" else "Editar Concepto", fontWeight = FontWeight.Bold)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = editConceptoDesc,
                        onValueChange = { editConceptoDesc = it },
                        label = { Text("Descripción del concepto") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { 
                    if (editConcepto == null) {
                        val newItem = BudgetItemEntity(
                            code = "NUEVO-${System.currentTimeMillis().toString().takeLast(4)}",
                            description = editConceptoDesc,
                            quantity = 1.0,
                            unit = "Lote",
                            unitPrice = 0.0,
                            executedQuantity = 0.0,
                            totalBudget = 0.0
                        )
                        viewModel.addBudgetItem(newItem)
                    } else {
                        val updatedItem = editConcepto!!.copy(description = editConceptoDesc)
                        viewModel.updateBudgetItem(updatedItem)
                    }
                    showConceptoDialog = false 
                }) {
                    Text("Guardar", color = ConnectedBlue, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showConceptoDialog = false }) {
                    Text("Cancelar", color = OnSurfaceVariant)
                }
            }
        )
    }
    
    // Task Editor Dialog
    if (showTaskDialog) {
        AlertDialog(
            onDismissRequest = { showTaskDialog = false },
            title = {
                Text(if (selectedTask == null) "Nueva Tarea" else "Editar Tarea", fontWeight = FontWeight.Bold)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = editTitle,
                        onValueChange = { editTitle = it },
                        label = { Text("Título de la tarea") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editDesc,
                        onValueChange = { editDesc = it },
                        label = { Text("Descripción o ubicación") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = editTime,
                            onValueChange = { editTime = it },
                            label = { Text("Hora (ej. 08:00)") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = editMeridiem,
                            onValueChange = { editMeridiem = it.uppercase() },
                            label = { Text("AM/PM") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = editImportant,
                            onCheckedChange = { editImportant = it }
                        )
                        Text("Marcar como Importante", fontSize = 14.sp)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { 
                    if (selectedTask == null) {
                        val newTask = TaskEntity(
                            id = System.currentTimeMillis().toString(),
                            obraId = projectName,
                            time = editTime,
                            meridiem = "AM", // simplified for now
                            title = editTitle,
                            desc = editDesc,
                            isCompleted = false,
                            isImportant = editImportant
                        )
                        viewModel.addTask(newTask)
                    } else {
                        viewModel.updateTask(selectedTask!!.copy(title = editTitle, desc = editDesc, time = editTime, meridiem = editMeridiem, isImportant = editImportant))
                    }
                    showTaskDialog = false 
                }) {
                    Text("Guardar", color = ConnectedBlue, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                if (selectedTask != null) {
                    TextButton(onClick = { 
                        viewModel.deleteTask(selectedTask!!)
                        showTaskDialog = false 
                    }) {
                        Text("Eliminar", color = WarningRed)
                    }
                } else {
                    TextButton(onClick = { showTaskDialog = false }) {
                        Text("Cancelar", color = OnSurfaceVariant)
                    }
                }
            }
        )
    }

    if (showMaterialDialog) {
        AlertDialog(
            onDismissRequest = { showMaterialDialog = false },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(WarningRedBg, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Inventory,
                            contentDescription = null,
                            tint = WarningRed,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Text(
                        text = "Reportar Material",
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        color = SlateDeep
                    )
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // 1. Material Name
                    OutlinedTextField(
                        value = materialName,
                        onValueChange = { materialName = it },
                        label = { Text("¿Qué material hace falta?") },
                        placeholder = { Text("Ej. Cemento Tolteca, Varilla 1/2\"") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ConnectedBlue,
                            unfocusedBorderColor = SubtleOutline,
                            focusedLabelColor = ConnectedBlue
                        ),
                        singleLine = true
                    )

                    // 2. Quantity & Unit
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = materialQty,
                            onValueChange = { materialQty = it },
                            label = { Text("Cantidad") },
                            placeholder = { Text("Ej. 50") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ConnectedBlue,
                                unfocusedBorderColor = SubtleOutline,
                                focusedLabelColor = ConnectedBlue
                            ),
                            singleLine = true
                        )
                        
                        OutlinedTextField(
                            value = materialUnit,
                            onValueChange = { materialUnit = it },
                            label = { Text("Unidad") },
                            placeholder = { Text("Pzas / Tons") },
                            modifier = Modifier.weight(1f),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ConnectedBlue,
                                unfocusedBorderColor = SubtleOutline,
                                focusedLabelColor = ConnectedBlue
                            ),
                            singleLine = true
                        )
                    }

                    // 3. Quick Unit Selection Chips
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "UNIDAD SUGERIDA",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = OnSurfaceVariant,
                            letterSpacing = 0.5.sp
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            listOf("Pzas", "Sacos", "Kg", "M3", "Tons").forEach { unit ->
                                val isSelected = materialUnit == unit
                                val bgColor = if (isSelected) ConnectedBlue else LightGrayBg
                                val contentColor = if (isSelected) PureWhite else OnSurfaceVariant
                                val borderColor = if (isSelected) ConnectedBlue else SubtleOutline
                                
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(34.dp)
                                        .background(bgColor, RoundedCornerShape(8.dp))
                                        .border(BorderStroke(1.dp, borderColor), RoundedCornerShape(8.dp))
                                        .clickable { materialUnit = unit }
                                        .padding(horizontal = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = unit,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = contentColor
                                    )
                                }
                            }
                        }
                    }

                    // 4. Urgency
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "NIVEL DE URGENCIA",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = OnSurfaceVariant,
                            letterSpacing = 0.5.sp
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            listOf("Baja", "Media", "Alta").forEach { urgency ->
                                val isSelected = materialUrgency == urgency
                                val baseColor = when (urgency) {
                                    "Baja" -> SuccessGreen
                                    "Media" -> Color(0xFFF57C00) // Orange
                                    else -> WarningRed
                                }
                                val lightBgColor = when (urgency) {
                                    "Baja" -> SuccessGreenBg
                                    "Media" -> Color(0xFFFFF3E0) // Light Orange
                                    else -> WarningRedBg
                                }
                                val bgColor = if (isSelected) baseColor else lightBgColor
                                val contentColor = if (isSelected) PureWhite else baseColor
                                val borderColor = if (isSelected) baseColor else baseColor.copy(alpha = 0.3f)
                                
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(38.dp)
                                        .background(bgColor, RoundedCornerShape(10.dp))
                                        .border(BorderStroke(1.dp, borderColor), RoundedCornerShape(10.dp))
                                        .clickable { materialUrgency = urgency }
                                        .padding(horizontal = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.Center,
                                        modifier = Modifier.fillMaxSize()
                                    ) {
                                        if (isSelected) {
                                            Icon(
                                                imageVector = Icons.Default.Check,
                                                contentDescription = null,
                                                tint = PureWhite,
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                        }
                                        Text(
                                            text = urgency,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Black,
                                            color = contentColor
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // 5. Destination Location
                    OutlinedTextField(
                        value = materialLocation,
                        onValueChange = { materialLocation = it },
                        label = { Text("Área de destino / Frente") },
                        placeholder = { Text("Ej. Losa Nivel 2, Frente C") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ConnectedBlue,
                            unfocusedBorderColor = SubtleOutline,
                            focusedLabelColor = ConnectedBlue
                        ),
                        singleLine = true
                    )

                    // 6. Additional Notes
                    OutlinedTextField(
                        value = materialNotes,
                        onValueChange = { materialNotes = it },
                        label = { Text("Detalles u observaciones") },
                        placeholder = { Text("Especificaciones de marca, proveedor sugerido, etc.") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ConnectedBlue,
                            unfocusedBorderColor = SubtleOutline,
                            focusedLabelColor = ConnectedBlue
                        )
                    )

                    if (isAiModelLoaded) {
                        Button(
                            onClick = {
                                if (materialNotes.isNotEmpty() || materialName.isNotEmpty()) {
                                    val promptText = if (materialNotes.isNotEmpty()) materialNotes else "$materialQty $materialUnit de $materialName"
                                    viewModel.draftMaterialRequest(promptText) { drafted, err ->
                                        if (drafted?.isNotEmpty() == true) {
                                            materialNotes = drafted ?: ""
                                        }
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = SolarAmber),
                            enabled = !isAiProcessing && (materialNotes.isNotEmpty() || materialName.isNotEmpty())
                        ) {
                            if (isAiProcessing) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Redactando...", fontWeight = FontWeight.Bold, color = Color.White)
                            } else {
                                Icon(Icons.Default.AutoAwesome, contentDescription = "IA", tint = Color.White, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("✨ Redactar con IA", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (materialName.isBlank()) {
                            Toast.makeText(context, "Por favor indica el nombre del material.", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        
                        val msg = buildString {
                            append("¡Reporte Enviado!\n")
                            append("Material: $materialName ($materialQty $materialUnit)\n")
                            append("Urgencia: $materialUrgency")
                            if (materialLocation.isNotBlank()) {
                                append("\nDestino: $materialLocation")
                            }
                        }
                        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                        
                        // Clear state fields
                        materialName = ""
                        materialQty = ""
                        materialUnit = "Pzas"
                        materialUrgency = "Media"
                        materialLocation = ""
                        materialNotes = ""
                        
                        showMaterialDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Enviar Reporte", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showMaterialDialog = false
                    }
                ) {
                    Text("Cancelar", color = OnSurfaceVariant, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}

@Composable
fun ObraDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 12.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
        Text(text = value, fontSize = 13.sp, color = SlateDeep, fontWeight = FontWeight.Black)
    }
}

@Composable
fun ObraTaskItem(
    task: TaskEntity,
    onClick: () -> Unit,
    onToggleStatus: () -> Unit
) {
    val opacity = if (task.isCompleted) 0.5f else 1f
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(opacity)
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(40.dp)
        ) {
            Text(
                text = task.time,
                fontWeight = FontWeight.Black,
                fontSize = 12.sp,
                color = SlateDeep
            )
            Text(
                text = task.meridiem,
                fontWeight = FontWeight.Bold,
                fontSize = 9.sp,
                color = OnSurfaceVariant
            )
        }

        Box(
            modifier = Modifier
                .width(2.dp)
                .height(32.dp)
                .background(SubtleOutline, RoundedCornerShape(100.dp))
        )

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = task.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = SlateDeep,
                    maxLines = 1
                )
                if (task.isImportant) {
                    Icon(Icons.Default.Star, contentDescription = "Importante", tint = SolarAmber, modifier = Modifier.size(12.dp))
                }
            }
            Text(
                text = task.desc,
                fontWeight = FontWeight.Medium,
                fontSize = 11.sp,
                color = OnSurfaceVariant,
                maxLines = 1
            )
        }

        IconButton(onClick = onToggleStatus) {
            Icon(
                imageVector = if (task.isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (task.isCompleted) SuccessGreen else OnSurfaceVariant
            )
        }
    }
}
