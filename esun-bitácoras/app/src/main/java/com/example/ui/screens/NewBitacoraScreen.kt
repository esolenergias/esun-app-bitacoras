package com.example.ui.screens

import android.content.ContentValues
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import java.util.Calendar
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.focus.onFocusChanged

import androidx.activity.compose.rememberLauncherForActivityResult
import android.content.Intent
import android.speech.RecognizerIntent
import android.app.Activity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.ui.text.style.TextAlign
import com.example.ui.theme.SolarAmber

import coil.compose.AsyncImage
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun NewBitacoraScreen(
    viewModel: BitacoraViewModel,
    projectName: String,
    onNavigateToDashboard: () -> Unit
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()
    
    // Core states from ViewModel
    val userName by viewModel.userName.collectAsState()
    val userRole by viewModel.userRole.collectAsState()
    var selectedCustomDate by remember { mutableStateOf<String?>(null) }
    val supervisorName by viewModel.supervisorName.collectAsState()
    val weather by viewModel.weather.collectAsState()
    val capturedPhotoUris by viewModel.capturedPhotoUris.collectAsState()
    val budgetItems by viewModel.budgetItems.collectAsState()
    val selectedConceptoName by viewModel.conceptoName.collectAsState()
    val isAiModelLoaded by viewModel.isAiModelLoaded.collectAsState()
    val isAiProcessing by viewModel.isAiProcessing.collectAsState()
    
    // Auto-bind site/project name
    LaunchedEffect(projectName) {
        viewModel.setSiteName(projectName)
    }
    
    // Dynamic formatted date
    val currentDateStr = remember { SimpleDateFormat("dd MMMM, yyyy", Locale("es", "MX")).format(Date()) }
    
    // Section expansions
    var expPersonnel by remember { mutableStateOf(true) }
    var expMachinery by remember { mutableStateOf(false) }
    var expActivities by remember { mutableStateOf(true) }
    var expIncidents by remember { mutableStateOf(false) }
    var expConceptos by remember { mutableStateOf(false) }
    
    // State variables for the advanced form
    var internalCrew by remember { mutableStateOf("12") }
    var subCrew by remember { mutableStateOf("8") }
    var machineryUsed by remember { mutableStateOf("Excavadora Cat 320, Grúa Telescópica") }
    var activitiesText by remember { mutableStateOf("Instalación de estructuras metálicas en zona norte y canalización subterránea.") }
    var progressVal by remember { mutableStateOf(45f) }
    var safetyRemarks by remember { mutableStateOf("Charcos por lluvia previa, se acordonó el área.") }
    var toolsMaterials by remember { mutableStateOf("") }
    
    // Launchers for Camera and Gallery
    // Permiso de cámara
    val cameraPermission = rememberPermissionState(android.Manifest.permission.CAMERA)

    // URI mutable para la foto que se tomará con TakePicture
    var photoUri by remember { mutableStateOf<Uri?>(null) }

    // Crea un URI en MediaStore para guardar la foto con alta calidad
    fun createPhotoUri(): Uri? {
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, "Bitacora_${timestamp}.jpg")
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ESunBitacora")
        }
        return context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
    }

    // Launcher de galería
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            uris.forEach { uri ->
                viewModel.addCapturedPhotoUri(uri.toString())
            }
            Toast.makeText(context, "${uris.size} imágenes adjuntadas", Toast.LENGTH_SHORT).show()
        }
    }

    // Launcher de cámara con TakePicture — guarda la foto en MediaStore con calidad original
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && photoUri != null) {
            viewModel.addCapturedPhotoUri(photoUri.toString())
            Toast.makeText(context, "¡Foto capturada y guardada!", Toast.LENGTH_SHORT).show()
        } else if (!success) {
            Toast.makeText(context, "Captura cancelada", Toast.LENGTH_SHORT).show()
        }
    }
    
    val recordAudioPermission = rememberPermissionState(android.Manifest.permission.RECORD_AUDIO)

    val speechRecognizerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val matches = data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            if (!matches.isNullOrEmpty()) {
                val spokenText = matches[0]
                activitiesText = if (activitiesText.isEmpty()) spokenText else "$activitiesText $spokenText"
            }
        }
    }
    
    // Save button states
    var isSaving by remember { mutableStateOf(false) }
    var saveButtonText by remember { mutableStateOf("FIRMAR Y GUARDAR REPORTE") }
    
    Column(modifier = Modifier.fillMaxSize().background(SlateBg)) {
        // Sticky Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onNavigateToDashboard) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Regresar", tint = SlateDeep)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text("Seguimiento de Obra", fontWeight = FontWeight.Black, fontSize = 18.sp, color = SlateDeep)
                    Text(currentDateStr, fontSize = 12.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                }
            }
        }
        
        HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

        // Main Form Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            // --- 1. INFORMACIÓN AUTOMÁTICA Y CLIMA ---
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = PureWhite)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "INFORMACIÓN AUTOMÁTICA",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = ConnectedBlue,
                            letterSpacing = 1.sp
                        )
                        Box(
                            modifier = Modifier
                                .background(SuccessGreenBg, RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "SINCRO",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = SuccessGreen
                            )
                        }
                    }

                    Column {
                        Text("Proyecto / Frente de Obra", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                        Text(projectName, fontSize = 16.sp, fontWeight = FontWeight.Black, color = SlateDeep)
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Quién Reporta", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                            Text(userName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                            if (userRole.equals("Master", ignoreCase = true)) {
                                Text(
                                    text = if (selectedCustomDate != null) "Fecha: $selectedCustomDate" else "Ajustar Fecha/Hora",
                                    fontSize = 11.sp,
                                    color = ConnectedBlue,
                                    modifier = Modifier
                                        .padding(top = 4.dp)
                                        .clickable {
                                            val c = Calendar.getInstance()
                                            DatePickerDialog(context, { _, y, m, d ->
                                                TimePickerDialog(context, { _, h, min ->
                                                    val formattedDate = String.format("%04d-%02d-%02d %02d:%02d", y, m + 1, d, h, min)
                                                    selectedCustomDate = formattedDate
                                                    viewModel.setCustomReportDate(formattedDate)
                                                }, c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE), true).show()
                                            }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show()
                                        }
                                )
                            }
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Supervisor a Cargo", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                            Text(supervisorName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                        }
                    }

                    HorizontalDivider(color = SubtleOutline.copy(alpha = 0.5f), thickness = 1.dp)

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Clima de Hoy", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            WeatherChip(icon = Icons.Default.WbSunny, label = "Soleado", selected = weather == "Soleado") { viewModel.setWeather("Soleado") }
                            WeatherChip(icon = Icons.Default.Cloud, label = "Nublado", selected = weather == "Nublado") { viewModel.setWeather("Nublado") }
                            WeatherChip(icon = Icons.Default.WaterDrop, label = "Lluvia", selected = weather == "Lluvia") { viewModel.setWeather("Lluvia") }
                        }
                    }
                }
            }
            
            // --- 2. PERSONAL EN OBRA ---
            ExpandableFormSection(
                title = "Personal en Obra",
                icon = Icons.Default.People,
                isExpanded = expPersonnel,
                onToggle = { expPersonnel = !expPersonnel }
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = internalCrew,
                        onValueChange = { internalCrew = it },
                        label = { Text("Plantilla Interna") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = outlinedTextFieldColors()
                    )
                    OutlinedTextField(
                        value = subCrew,
                        onValueChange = { subCrew = it },
                        label = { Text("Contratistas") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = outlinedTextFieldColors()
                    )
                }
            }

            // --- 3. MAQUINARIA Y EQUIPOS ---
            ExpandableFormSection(
                title = "Maquinaria y Equipos",
                icon = Icons.Default.PrecisionManufacturing,
                isExpanded = expMachinery,
                onToggle = { expMachinery = !expMachinery }
            ) {
                OutlinedTextField(
                    value = machineryUsed,
                    onValueChange = { machineryUsed = it },
                    label = { Text("Equipo Mayor Utilizado") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    colors = outlinedTextFieldColors()
                )
            }

            // --- CONCEPTOS ---
            ExpandableFormSection(
                title = "Concepto Vinculado",
                icon = Icons.Default.List,
                isExpanded = expConceptos,
                onToggle = { expConceptos = !expConceptos }
            ) {
                var isDropdownExpanded by remember { mutableStateOf(false) }
                
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = selectedConceptoName ?: "",
                        onValueChange = { 
                            viewModel.setConcepto(null, it)
                            isDropdownExpanded = true 
                        },
                        label = { Text("Concepto Asociado (Escribe o Selecciona)") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .onFocusChanged { if (it.isFocused) isDropdownExpanded = true },
                        trailingIcon = {
                            IconButton(onClick = { isDropdownExpanded = !isDropdownExpanded }) {
                                Icon(Icons.Default.ArrowDropDown, contentDescription = "Seleccionar")
                            }
                        },
                        colors = outlinedTextFieldColors()
                    )
                    
                    DropdownMenu(
                        expanded = isDropdownExpanded,
                        onDismissRequest = { isDropdownExpanded = false },
                        modifier = Modifier.fillMaxWidth(0.9f)
                    ) {
                        budgetItems.forEach { item ->
                            DropdownMenuItem(
                                text = { Text(item.description, maxLines = 2, overflow = TextOverflow.Ellipsis) },
                                onClick = {
                                    viewModel.setConcepto(item.id.toString(), item.description)
                                    isDropdownExpanded = false
                                }
                            )
                        }
                        Divider(color = SubtleOutline)
                        DropdownMenuItem(
                            text = { Text("+ Nuevo Concepto", fontWeight = FontWeight.Bold, color = ConnectedBlue) },
                            onClick = {
                                viewModel.setConcepto(null, "")
                                isDropdownExpanded = false
                            }
                        )
                    }
                }
            }

            // --- 4. ACTIVIDADES Y AVANCE ---
            ExpandableFormSection(
                title = "Actividades y Avance Físico",
                icon = Icons.Default.Engineering,
                isExpanded = expActivities,
                onToggle = { expActivities = !expActivities }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    OutlinedTextField(
                        value = activitiesText,
                        onValueChange = { activitiesText = it },
                        label = { Text("Descripción de trabajos ejecutados") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        colors = outlinedTextFieldColors(),
                        trailingIcon = {
                            IconButton(onClick = {
                                if (recordAudioPermission.status.isGranted) {
                                    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                                        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-MX")
                                        putExtra(RecognizerIntent.EXTRA_PROMPT, "Habla para dictar")
                                    }
                                    speechRecognizerLauncher.launch(intent)
                                } else {
                                    recordAudioPermission.launchPermissionRequest()
                                }
                            }) {
                                Icon(Icons.Default.Mic, contentDescription = "Dictar", tint = ConnectedBlue)
                            }
                        }
                    )
                    
                    if (isAiModelLoaded) {
                        Button(
                            onClick = { 
                                if (activitiesText.isNotEmpty()) {
                                    viewModel.improveTextWithAi(activitiesText) { improved, err ->
                                        if (improved != null) {
                                            activitiesText = improved
                                        }
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = SolarAmber),
                            enabled = !isAiProcessing && activitiesText.isNotEmpty()
                        ) {
                            if (isAiProcessing) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Mejorando redacción con Gemma...", fontWeight = FontWeight.Bold, color = Color.White)
                            } else {
                                Icon(Icons.Default.AutoAwesome, contentDescription = "IA", tint = Color.White, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("✨ Redactar con IA", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    } else {
                        Text("Ve a Configuración para cargar Gemma y usar IA Local.", fontSize = 11.sp, color = Color.Gray, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.End)
                    }
                    Column {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Avance Diario Estimado", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = SlateDeep)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (isAiModelLoaded) {
                                    IconButton(
                                        onClick = {
                                            if (activitiesText.isNotEmpty()) {
                                                viewModel.extractProgress(activitiesText) { p, err ->
                                                    if (p != null && p in 0..100) {
                                                        progressVal = p.toFloat()
                                                    } else {
                                                        Toast.makeText(context, "No se pudo extraer el avance", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            }
                                        },
                                        enabled = !isAiProcessing
                                    ) {
                                        Icon(Icons.Default.AutoAwesome, contentDescription = "Extraer Avance", tint = SolarAmber)
                                    }
                                }
                                Text("${progressVal.toInt()}%", fontWeight = FontWeight.Black, fontSize = 13.sp, color = ConnectedBlue)
                            }
                        }
                        Slider(
                            value = progressVal,
                            onValueChange = { progressVal = it },
                            valueRange = 0f..100f,
                            colors = SliderDefaults.colors(thumbColor = ConnectedBlue, activeTrackColor = ConnectedBlue)
                        )
                    }
                    OutlinedTextField(
                        value = toolsMaterials,
                        onValueChange = { toolsMaterials = it },
                        label = { Text("Materiales y Herramientas Usados") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        colors = outlinedTextFieldColors()
                    )
                    
                    if (isAiModelLoaded) {
                        Button(
                            onClick = { 
                                if (activitiesText.isNotEmpty()) {
                                    viewModel.extractMaterials(activitiesText) { extracted, err ->
                                        if (extracted?.isNotEmpty() == true) {
                                            toolsMaterials = extracted ?: ""
                                        }
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = SolarAmber),
                            enabled = !isAiProcessing && activitiesText.isNotEmpty()
                        ) {
                            if (isAiProcessing) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Extrayendo...", fontWeight = FontWeight.Bold, color = Color.White)
                            } else {
                                Icon(Icons.Default.AutoAwesome, contentDescription = "IA", tint = Color.White, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("✨ Extraer Materiales", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }
            }

            // --- 5. INCIDENTES Y SEGURIDAD ---
            ExpandableFormSection(
                title = "Incidentes y Seguridad",
                icon = Icons.Default.Warning,
                isExpanded = expIncidents,
                onToggle = { expIncidents = !expIncidents }
            ) {
                OutlinedTextField(
                    value = safetyRemarks,
                    onValueChange = { safetyRemarks = it },
                    label = { Text("Observaciones / Riesgos / Accidentes") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    colors = outlinedTextFieldColors()
                )
            }

            // --- 6. EVIDENCIA FOTOGRÁFICA (CAMARA Y GALERIA) ---
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = PureWhite)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "EVIDENCIA FOTOGRÁFICA",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = OnSurfaceVariant,
                        letterSpacing = 1.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Botón 1: Camara
                        Button(
                            onClick = {
                                if (cameraPermission.status.isGranted) {
                                    val uri = createPhotoUri()
                                    if (uri != null) {
                                        photoUri = uri
                                        cameraLauncher.launch(uri)
                                    } else {
                                        Toast.makeText(context, "Error al crear archivo de imagen", Toast.LENGTH_SHORT).show()
                                    }
                                } else {
                                    cameraPermission.launchPermissionRequest()
                                }
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = ConnectedBlue,
                                contentColor = PureWhite
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.PhotoCamera, contentDescription = "Abrir Cámara", modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Cámara", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        // Button 2: Galería
                        Button(
                            onClick = { galleryLauncher.launch("image/*") },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = LightGrayBg,
                                contentColor = SlateDeep
                            ),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, SubtleOutline)
                        ) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = "Abrir Galería", modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Galería", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }

                    // Previsualizar las imágenes capturadas
                    if (capturedPhotoUris.isNotEmpty()) {
                        androidx.compose.foundation.lazy.LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            items(capturedPhotoUris.size) { index ->
                                val uri = capturedPhotoUris[index]
                                Box(
                                    modifier = Modifier
                                        .size(140.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp))
                                ) {
                                    AsyncImage(
                                        model = uri,
                                        contentDescription = "Evidencia fotográfica",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )

                                    // Clean Remove Button
                                    IconButton(
                                        onClick = { viewModel.removeCapturedPhotoUri(uri) },
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .padding(4.dp)
                                            .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(20.dp))
                                            .size(28.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Close,
                                            contentDescription = "Quitar foto",
                                            tint = PureWhite,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        // Empty photo state
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(100.dp)
                                .background(LightGrayBg, RoundedCornerShape(12.dp))
                                .border(BorderStroke(1.dp, SubtleOutline.copy(alpha = 0.5f)), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.AddAPhoto, contentDescription = null, tint = OnSurfaceVariant.copy(alpha = 0.7f))
                                Text(
                                    text = "Ninguna evidencia adjuntada aún.",
                                    fontSize = 12.sp,
                                    color = OnSurfaceVariant,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Save Button
            Button(
                onClick = {
                    coroutineScope.launch {
                        isSaving = true
                        saveButtonText = "GUARDANDO..."
                        delay(800)

                        // Pasar todos los campos al ViewModel
                        viewModel.setSiteName(projectName)
                        viewModel.setDescription(activitiesText)
                        val totalCrew = (internalCrew.toIntOrNull() ?: 0) + (subCrew.toIntOrNull() ?: 0)
                        viewModel.setCrewCount(totalCrew)
                        viewModel.setPhysicalProgress(progressVal.toDouble())
                        // El progreso financiero se deja como porcentaje (se calcula desde budget_items)
                        viewModel.setFinancialProgress(progressVal.toDouble())
                        // Pasar los nuevos campos
                        viewModel.setSafetyRemarks(safetyRemarks)
                        viewModel.setMachinery(machineryUsed)

                        viewModel.submitDailyLog {
                            coroutineScope.launch {
                                isSaving = false
                                saveButtonText = "¡LISTO!"
                                delay(500)
                                onNavigateToDashboard()
                            }
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                enabled = !isSaving
            ) {
                if (isSaving) {
                    CircularProgressIndicator(color = PureWhite, modifier = Modifier.size(24.dp), strokeWidth = 3.dp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(saveButtonText, fontWeight = FontWeight.Black, fontSize = 16.sp, color = PureWhite)
                } else {
                    Icon(Icons.Default.Draw, contentDescription = null, tint = PureWhite)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(saveButtonText, fontWeight = FontWeight.Black, fontSize = 16.sp, color = PureWhite)
                }
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun ExpandableFormSection(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = PureWhite)
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onToggle() }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(icon, contentDescription = null, tint = ConnectedBlue)
                    Text(title, fontWeight = FontWeight.Black, fontSize = 15.sp, color = SlateDeep)
                }
                Icon(
                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = OnSurfaceVariant
                )
            }
            
            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically(animationSpec = tween(300)),
                exit = shrinkVertically(animationSpec = tween(300))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .padding(bottom = 8.dp)
                ) {
                    content()
                }
            }
        }
    }
}

@Composable
fun RowScope.WeatherChip(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, selected: Boolean, onClick: () -> Unit) {
    val bgColor = if (selected) ConnectedBlue else LightGrayBg
    val contentColor = if (selected) PureWhite else OnSurfaceVariant
    val borderColor = if (selected) ConnectedBlue else SubtleOutline

    Row(
        modifier = Modifier
            .weight(1f)
            .height(48.dp)
            .background(bgColor, RoundedCornerShape(8.dp))
            .border(BorderStroke(1.dp, borderColor), RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Icon(icon, contentDescription = null, tint = contentColor, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(6.dp))
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = contentColor)
    }
}

@Composable
fun outlinedTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = ConnectedBlue,
    unfocusedBorderColor = SubtleOutline,
    focusedContainerColor = PureWhite,
    unfocusedContainerColor = LightGrayBg,
    focusedLabelColor = ConnectedBlue,
    unfocusedLabelColor = OnSurfaceVariant,
    focusedTextColor = Color.Black,
    unfocusedTextColor = Color.Black
)
