package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.database.BitacoraEntity
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import android.net.Uri
import android.content.Intent
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Close

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsListScreen(
    viewModel: BitacoraViewModel,
    projectName: String,
    onNavigateBack: () -> Unit,
    onNavigateToReportDetail: (Int) -> Unit
) {
    val context = LocalContext.current
    val userRole by viewModel.userRole.collectAsState()
    val bitacoras by viewModel.bitacorasList.collectAsState()
    
    val siteBitacoras = remember(bitacoras, projectName) {
        bitacoras.filter { it.siteName == projectName }.sortedByDescending { it.id }
    }
    
    val groupedBitacoras = remember(siteBitacoras) {
        siteBitacoras.groupBy { it.date }
    }

    // Edit state
    var bitacoraToEdit by remember { mutableStateOf<BitacoraEntity?>(null) }
    var showEditDialog by remember { mutableStateOf(false) }
    var editWeather by remember { mutableStateOf("") }
    var editCrewCount by remember { mutableStateOf("") }
    var editDescription by remember { mutableStateOf("") }
    var editPhysicalProgress by remember { mutableStateOf("") }
    var editFinancialProgress by remember { mutableStateOf("") }
    var editPhotoUri by remember { mutableStateOf<String?>(null) }
    
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } catch (e: Exception) {
                // Ignore if it doesn't support persistable permissions
            }
            editPhotoUri = uri.toString()
            Toast.makeText(context, "Imagen actualizada", Toast.LENGTH_SHORT).show()
        }
    }

    // Delete state
    var bitacoraToDelete by remember { mutableStateOf<BitacoraEntity?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }

    val canModify = userRole == "Master" || userRole == "Supervisor"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBg)
    ) {
        // TOP BAR
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onNavigateBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Regresar", tint = SlateDeep)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Relación de Reportes",
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    color = SlateDeep
                )
                Text(
                    text = projectName,
                    fontWeight = FontWeight.Medium,
                    fontSize = 12.sp,
                    color = OnSurfaceVariant
                )
            }

            // Role Badge in Header
            Box(
                modifier = Modifier
                    .background(
                        if (canModify) Color(0xFFE2E7FF) else LightGrayBg,
                        RoundedCornerShape(8.dp)
                    )
                    .border(
                        BorderStroke(1.dp, if (canModify) ConnectedBlue else SubtleOutline),
                        RoundedCornerShape(8.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = if (canModify) Icons.Default.Security else Icons.Default.Lock,
                        contentDescription = null,
                        tint = if (canModify) ConnectedBlue else OnSurfaceVariant,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = userRole,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        color = if (canModify) ConnectedBlue else OnSurfaceVariant
                    )
                }
            }
        }
        HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (groupedBitacoras.isEmpty()) {
                item {
                    Text(
                        text = "No hay reportes registrados para esta obra.",
                        fontSize = 14.sp,
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(top = 20.dp)
                    )
                }
            } else {
                groupedBitacoras.forEach { (date, reportsForDate) ->
                    item {
                        Text(
                            text = date.uppercase(),
                            fontWeight = FontWeight.Black,
                            fontSize = 11.sp,
                            color = OnSurfaceVariant,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(bottom = 4.dp, top = 8.dp)
                        )
                    }
                    items(reportsForDate) { bitacora ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 8.dp)
                                .clickable { onNavigateToReportDetail(bitacora.id) }
                                .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp)),
                            colors = CardDefaults.cardColors(containerColor = PureWhite)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .background(LightGrayBg, RoundedCornerShape(8.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.Assignment, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(20.dp))
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "${bitacora.weather} • ${bitacora.crewCount} personal",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = OnSurfaceVariant
                                        )
                                        Text(
                                            text = bitacora.description,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = SlateDeep
                                        )
                                    }

                                    // Edit / Delete icons ONLY for Supervisors & Master
                                    if (canModify) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            IconButton(
                                                onClick = {
                                                    bitacoraToEdit = bitacora
                                                    editWeather = bitacora.weather
                                                    editCrewCount = bitacora.crewCount.toString()
                                                    editDescription = bitacora.description
                                                    editPhysicalProgress = bitacora.physicalProgress.toString()
                                                    editFinancialProgress = bitacora.financialProgress.toString()
                                                    editPhotoUri = bitacora.photoUri
                                                    showEditDialog = true
                                                },
                                                modifier = Modifier.size(28.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Edit,
                                                    contentDescription = "Editar",
                                                    tint = ConnectedBlue,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }
                                            IconButton(
                                                onClick = {
                                                    bitacoraToDelete = bitacora
                                                    showDeleteDialog = true
                                                },
                                                modifier = Modifier.size(28.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Delete,
                                                    contentDescription = "Eliminar",
                                                    tint = WarningRed,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                                
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Avance Físico", fontSize = 9.sp, color = OnSurfaceVariant)
                                        Text("${bitacora.physicalProgress}%", fontSize = 12.sp, fontWeight = FontWeight.Black, color = SuccessGreen)
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Presupuesto Ejecutado", fontSize = 9.sp, color = OnSurfaceVariant)
                                        Text("$${bitacora.financialProgress}", fontSize = 12.sp, fontWeight = FontWeight.Black, color = SlateDeep)
                                    }
                                }

                                // If user is Trabajador, show simple lock badge
                                if (!canModify) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
                                    ) {
                                        Icon(Icons.Default.Lock, contentDescription = null, tint = OnSurfaceVariant.copy(alpha = 0.6f), modifier = Modifier.size(10.dp))
                                        Text("Reporte de lectura. Solo el Supervisor o Master pueden modificarlo.", fontSize = 9.sp, color = OnSurfaceVariant.copy(alpha = 0.7f), fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // --- DELETE CONFIRMATION DIALOG ---
    if (showDeleteDialog && bitacoraToDelete != null) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(WarningRedBg, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, tint = WarningRed, modifier = Modifier.size(20.dp))
                    }
                    Text("Eliminar Reporte", fontWeight = FontWeight.Black, fontSize = 18.sp, color = SlateDeep)
                }
            },
            text = {
                Text(
                    text = "¿Está seguro de que desea eliminar permanentemente este reporte diario de obra de la base de datos de Supabase? Esta acción no se puede deshacer.",
                    fontSize = 14.sp,
                    color = OnSurfaceVariant
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        bitacoraToDelete?.let {
                            viewModel.deleteBitacora(it)
                            Toast.makeText(context, "Reporte eliminado con éxito de Supabase.", Toast.LENGTH_SHORT).show()
                        }
                        showDeleteDialog = false
                        bitacoraToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = WarningRed),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Eliminar", fontWeight = FontWeight.Bold, color = PureWhite)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancelar", color = OnSurfaceVariant, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }

    // --- EDIT REPORT DIALOG ---
    if (showEditDialog && bitacoraToEdit != null) {
        AlertDialog(
            onDismissRequest = { showEditDialog = false },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(Color(0xFFE2E7FF), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(20.dp))
                    }
                    Text("Editar Reporte", fontWeight = FontWeight.Black, fontSize = 18.sp, color = SlateDeep)
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = editWeather,
                        onValueChange = { editWeather = it },
                        label = { Text("Clima") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ConnectedBlue, unfocusedBorderColor = SubtleOutline),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = editCrewCount,
                        onValueChange = { editCrewCount = it },
                        label = { Text("Personal en obra") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ConnectedBlue, unfocusedBorderColor = SubtleOutline),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = editPhysicalProgress,
                        onValueChange = { editPhysicalProgress = it },
                        label = { Text("% Avance Físico") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ConnectedBlue, unfocusedBorderColor = SubtleOutline),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = editFinancialProgress,
                        onValueChange = { editFinancialProgress = it },
                        label = { Text("Presupuesto Ejecutado ($)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ConnectedBlue, unfocusedBorderColor = SubtleOutline),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = editDescription,
                        onValueChange = { editDescription = it },
                        label = { Text("Descripción del reporte") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ConnectedBlue, unfocusedBorderColor = SubtleOutline)
                    )

                    Text("Evidencia Fotográfica", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = SlateDeep)
                    if (editPhotoUri != null) {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp).clip(RoundedCornerShape(12.dp))) {
                            AsyncImage(
                                model = editPhotoUri,
                                contentDescription = "Evidencia fotográfica",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                            Row(modifier = Modifier.align(Alignment.TopEnd).padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                IconButton(
                                    onClick = { galleryLauncher.launch(arrayOf("image/*")) },
                                    modifier = Modifier.background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(20.dp)).size(36.dp)
                                ) {
                                    Icon(Icons.Default.Edit, contentDescription = "Cambiar", tint = PureWhite, modifier = Modifier.size(18.dp))
                                }
                                IconButton(
                                    onClick = { editPhotoUri = null },
                                    modifier = Modifier.background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(20.dp)).size(36.dp)
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = "Quitar", tint = PureWhite, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    } else {
                        Button(
                            onClick = { galleryLauncher.launch(arrayOf("image/*")) },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = LightGrayBg, contentColor = SlateDeep)
                        ) {
                            Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Agregar Imagen", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val original = bitacoraToEdit
                        if (original != null) {
                            val updated = original.copy(
                                weather = editWeather,
                                crewCount = editCrewCount.toIntOrNull() ?: original.crewCount,
                                description = editDescription,
                                physicalProgress = editPhysicalProgress.toDoubleOrNull() ?: original.physicalProgress,
                                financialProgress = editFinancialProgress.toDoubleOrNull() ?: original.financialProgress,
                                photoUri = editPhotoUri,
                                isSynced = false
                            )
                            viewModel.updateBitacora(updated)
                            Toast.makeText(context, "Reporte editado y programado para sincronización.", Toast.LENGTH_SHORT).show()
                        }
                        showEditDialog = false
                        bitacoraToEdit = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Guardar Cambios", fontWeight = FontWeight.Bold, color = PureWhite)
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditDialog = false }) {
                    Text("Cancelar", color = OnSurfaceVariant, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}
