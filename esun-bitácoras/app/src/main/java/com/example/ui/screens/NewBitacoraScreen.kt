package com.example.ui.screens

import android.content.ContentValues
import android.content.Context
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
import android.speech.SpeechRecognizer
import android.speech.RecognitionListener
import android.os.Bundle
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
import com.example.ui.components.SignaturePadView
import com.example.utils.PdfReportGenerator
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
    val selectedConceptoId by viewModel.conceptoId.collectAsState()
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
    var expSignature by remember { mutableStateOf(false) }
    
    // State variables for the form: Inician en 0 y vacíos por defecto
    var internalCrew by remember { mutableStateOf("0") }
    var subCrew by remember { mutableStateOf("0") }
    var machineryUsed by remember { mutableStateOf("") }
    var activitiesText by remember { mutableStateOf("") }
    var progressVal by remember { mutableStateOf(0f) }
    var safetyRemarks by remember { mutableStateOf("") }
    var toolsMaterials by remember { mutableStateOf("") }
    var signatureBase64 by remember { mutableStateOf("") }
    
    // Permiso de cámara y lanzador
    val cameraPermission = rememberPermissionState(android.Manifest.permission.CAMERA)
    var photoUri by remember { mutableStateOf<Uri?>(null) }

    fun createPhotoUri(): Uri? {
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, "Bitacora_${timestamp}.jpg")
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ESunBitacora")
        }
        return context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
    }

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

    // =========================================================================
    // DICTADO CONTINUO POR VOZ EN VENTANA EMERGENTE (No se apaga con pausas)
    // =========================================================================
    var isDictatingContinuous by remember { mutableStateOf(false) }
    var showDictationDialog by remember { mutableStateOf(false) }
    var liveDictatedText by remember { mutableStateOf("") }
    var speechRmsLevel by remember { mutableStateOf(0f) }

    val speechRecognizerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val matches = data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            if (!matches.isNullOrEmpty()) {
                val spokenText = matches[0]
                liveDictatedText = if (liveDictatedText.isEmpty()) spokenText else "$liveDictatedText $spokenText"
                activitiesText = if (activitiesText.isEmpty()) spokenText else "$activitiesText $spokenText"
                Toast.makeText(context, "¡Dictado capturado!", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val speechRecognizer = remember {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            try { SpeechRecognizer.createSpeechRecognizer(context) } catch (e: Exception) { null }
        } else {
            null
        }
    }

    val speechIntent = remember {
        Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-MX")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "es-MX")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 30000L)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 30000L)
        }
    }

    DisposableEffect(speechRecognizer) {
        val listener = object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {
                speechRmsLevel = rmsdB
            }
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {
                if (isDictatingContinuous) {
                    try { speechRecognizer?.startListening(speechIntent) } catch (e: Exception) {}
                }
            }
            override fun onError(error: Int) {
                android.util.Log.d("SpeechRec", "onError code: $error")
                // Reiniciar escucha continua automáticamente ante cualquier código de timeout o corte por silencio
                if (isDictatingContinuous) {
                    try {
                        speechRecognizer?.cancel()
                        speechRecognizer?.startListening(speechIntent)
                    } catch (e: Exception) {}
                }
            }
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    val text = matches[0]
                    if (text.isNotEmpty()) {
                        liveDictatedText = if (liveDictatedText.isEmpty()) text else "$liveDictatedText $text"
                    }
                }
                if (isDictatingContinuous) {
                    try { speechRecognizer?.startListening(speechIntent) } catch (e: Exception) {}
                }
            }
            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    val pText = matches[0]
                    if (pText.isNotEmpty() && !liveDictatedText.contains(pText)) {
                        liveDictatedText = if (liveDictatedText.isEmpty()) pText else "$liveDictatedText $pText"
                    }
                }
            }
            override fun onEvent(eventType: Int, params: Bundle?) {}
        }

        speechRecognizer?.setRecognitionListener(listener)

        onDispose {
            try { speechRecognizer?.destroy() } catch (e: Exception) {}
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
                        Column {
                            Text("Residente / Autor", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                            Text(userName, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                        }
                        Column {
                            Text("Supervisor", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                            Text(supervisorName, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                        }
                    }

                    // Selector opcional de fecha de reporte
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Fecha de Registro", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                            Text(selectedCustomDate ?: currentDateStr, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = SlateDeep)
                        }

                        Button(
                            onClick = {
                                val cal = Calendar.getInstance()
                                DatePickerDialog(
                                    context,
                                    { _, year, month, dayOfMonth ->
                                        val calSel = Calendar.getInstance()
                                        calSel.set(year, month, dayOfMonth)
                                        TimePickerDialog(
                                            context,
                                            { _, hourOfDay, minute ->
                                                calSel.set(Calendar.HOUR_OF_DAY, hourOfDay)
                                                calSel.set(Calendar.MINUTE, minute)
                                                val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
                                                val formatted = sdf.format(calSel.time)
                                                selectedCustomDate = formatted
                                                viewModel.setCustomReportDate(formatted)
                                            },
                                            cal.get(Calendar.HOUR_OF_DAY),
                                            cal.get(Calendar.MINUTE),
                                            true
                                        ).show()
                                    },
                                    cal.get(Calendar.YEAR),
                                    cal.get(Calendar.MONTH),
                                    cal.get(Calendar.DAY_OF_MONTH)
                                ).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = LightGrayBg, contentColor = ConnectedBlue),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.DateRange, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Cambiar Fecha", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

                    // Clima selector ordenado en rejilla de igual tamaño
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "CONDICIÓN DEL CLIMA", 
                            fontSize = 11.sp, 
                            fontWeight = FontWeight.ExtraBold, 
                            color = ConnectedBlue,
                            letterSpacing = 1.sp
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf(
                                "Despejado" to Icons.Default.WbSunny, 
                                "Nublado" to Icons.Default.Cloud, 
                                "Lluvia" to Icons.Default.Thunderstorm
                            ).forEach { (wName, icon) ->
                                val isSel = weather == wName
                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(42.dp)
                                        .clickable { viewModel.setWeather(wName) },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (isSel) ConnectedBlue else LightGrayBg,
                                    border = BorderStroke(1.dp, if (isSel) ConnectedBlue else SubtleOutline)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxSize(),
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = icon, 
                                            contentDescription = null, 
                                            tint = if (isSel) PureWhite else SlateDeep, 
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = wName, 
                                            fontSize = 12.sp, 
                                            fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium, 
                                            color = if (isSel) PureWhite else SlateDeep
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // --- 2. PERSONAL EN OBRA ---
            ExpandableFormSection(
                title = "Personal en Obra",
                icon = Icons.Default.Group,
                isExpanded = expPersonnel,
                onToggle = { expPersonnel = !expPersonnel }
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = internalCrew,
                        onValueChange = { internalCrew = it },
                        label = { Text("Plantilla Interna") },
                        modifier = Modifier
                            .weight(1f)
                            .onFocusChanged { focusState ->
                                if (focusState.isFocused && (internalCrew == "0" || internalCrew == "11" || internalCrew == "12")) {
                                    internalCrew = ""
                                }
                            },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = outlinedTextFieldColors()
                    )

                    OutlinedTextField(
                        value = subCrew,
                        onValueChange = { subCrew = it },
                        label = { Text("Contratistas") },
                        modifier = Modifier
                            .weight(1f)
                            .onFocusChanged { focusState ->
                                if (focusState.isFocused && (subCrew == "0" || subCrew == "8")) {
                                    subCrew = ""
                                }
                            },
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
                    placeholder = { Text("Ej: Excavadora, Grúa, Generadores...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { focusState ->
                            if (focusState.isFocused && machineryUsed.startsWith("Excavadora Cat 320")) {
                                machineryUsed = ""
                            }
                        },
                    minLines = 2,
                    colors = outlinedTextFieldColors()
                )
            }

            // --- CONCEPTOS VINCULADOS ---
            var showConceptBottomSheet by remember { mutableStateOf(false) }
            var conceptSearchQuery by remember { mutableStateOf("") }

            ExpandableFormSection(
                title = "Concepto Vinculado de Obra",
                icon = Icons.Default.ListAlt,
                isExpanded = expConceptos,
                onToggle = { expConceptos = !expConceptos }
            ) {
                val selectedItem = budgetItems.firstOrNull { it.description == selectedConceptoName }
                
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { showConceptBottomSheet = true },
                    colors = CardDefaults.cardColors(
                        containerColor = if (selectedConceptoName.isNullOrEmpty()) LightGrayBg else ConnectedBlue.copy(alpha = 0.05f)
                    ),
                    border = BorderStroke(1.dp, if (selectedConceptoName.isNullOrEmpty()) SubtleOutline else ConnectedBlue)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .background(if (selectedConceptoName.isNullOrEmpty()) Color.Gray.copy(alpha = 0.15f) else ConnectedBlue, RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Category,
                                    contentDescription = null,
                                    tint = if (selectedConceptoName.isNullOrEmpty()) SlateDeep else PureWhite,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                if (selectedItem != null && selectedItem.code.isNotEmpty()) {
                                    Text(
                                        text = "CÓDIGO: ${selectedItem.code}",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        color = ConnectedBlue
                                    )
                                }
                                Text(
                                    text = (selectedConceptoName ?: "").ifEmpty { "Seleccionar o Vincular Concepto..." },
                                    fontSize = 13.sp,
                                    fontWeight = if (selectedConceptoName.isNullOrEmpty()) FontWeight.Medium else FontWeight.Bold,
                                    color = if (selectedConceptoName.isNullOrEmpty()) OnSurfaceVariant else SlateDeep,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                        
                        Button(
                            onClick = { showConceptBottomSheet = true },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = ConnectedBlue,
                                contentColor = PureWhite
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = if (selectedConceptoName.isNullOrEmpty()) "Explorar" else "Cambiar",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // MODAL BOTTOM SHEET ELEGANTE PARA CONCEPTOS
            if (showConceptBottomSheet) {
                ModalBottomSheet(
                    onDismissRequest = { 
                        showConceptBottomSheet = false 
                        conceptSearchQuery = ""
                    },
                    containerColor = PureWhite,
                    shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                    dragHandle = {
                        Box(
                            modifier = Modifier
                                .padding(vertical = 10.dp)
                                .width(40.dp)
                                .height(4.dp)
                                .background(SubtleOutline, RoundedCornerShape(2.dp))
                        )
                    }
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight(0.85f)
                            .padding(horizontal = 20.dp, vertical = 10.dp)
                    ) {
                        // Header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Conceptos de Obra",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Black,
                                    color = SlateDeep
                                )
                                Text(
                                    text = "Selecciona la partida o trabajo a ejecutar",
                                    fontSize = 12.sp,
                                    color = OnSurfaceVariant,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            IconButton(onClick = { 
                                showConceptBottomSheet = false 
                                conceptSearchQuery = ""
                            }) {
                                Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = SlateDeep)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Search Bar
                        OutlinedTextField(
                            value = conceptSearchQuery,
                            onValueChange = { conceptSearchQuery = it },
                            placeholder = { Text("Buscar por código, descripción o categoría...") },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = ConnectedBlue) },
                            trailingIcon = {
                                if (conceptSearchQuery.isNotEmpty()) {
                                    IconButton(onClick = { conceptSearchQuery = "" }) {
                                        Icon(Icons.Default.Clear, contentDescription = "Limpiar")
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = outlinedTextFieldColors(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        val filteredItems = remember(budgetItems, conceptSearchQuery) {
                            if (conceptSearchQuery.isBlank()) {
                                budgetItems
                            } else {
                                budgetItems.filter { item ->
                                    item.description.contains(conceptSearchQuery, ignoreCase = true) ||
                                    item.code.contains(conceptSearchQuery, ignoreCase = true) ||
                                    item.categoryName.contains(conceptSearchQuery, ignoreCase = true)
                                }
                            }
                        }

                        if (filteredItems.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.FolderOpen, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color.Gray)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("No se encontraron conceptos coincidentes", fontSize = 13.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Button(
                                        onClick = {
                                            viewModel.setConcepto(null, conceptSearchQuery)
                                            showConceptBottomSheet = false
                                            conceptSearchQuery = ""
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue)
                                    ) {
                                        Text("+ Usar \"$conceptSearchQuery\" como concepto manual", fontSize = 12.sp)
                                    }
                                }
                            }
                        } else {
                            androidx.compose.foundation.lazy.LazyColumn(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(filteredItems.size) { index ->
                                    val item = filteredItems[index]
                                    val isSelected = selectedConceptoName == item.description

                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                viewModel.setConcepto(item.id.toString(), item.description)
                                                showConceptBottomSheet = false
                                                conceptSearchQuery = ""
                                            },
                                        colors = CardDefaults.cardColors(
                                            containerColor = if (isSelected) ConnectedBlue.copy(alpha = 0.08f) else PureWhite
                                        ),
                                        shape = RoundedCornerShape(12.dp),
                                        border = BorderStroke(1.dp, if (isSelected) ConnectedBlue else SubtleOutline)
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            RadioButton(
                                                selected = isSelected,
                                                onClick = {
                                                    viewModel.setConcepto(item.id.toString(), item.description)
                                                    showConceptBottomSheet = false
                                                    conceptSearchQuery = ""
                                                },
                                                colors = RadioButtonDefaults.colors(selectedColor = ConnectedBlue)
                                            )
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    if (item.code.isNotEmpty()) {
                                                        Box(
                                                            modifier = Modifier
                                                                .background(ConnectedBlue.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                                        ) {
                                                            Text(
                                                                text = item.code,
                                                                fontSize = 10.sp,
                                                                fontWeight = FontWeight.Black,
                                                                color = ConnectedBlue
                                                            )
                                                        }
                                                    }
                                                    if (item.categoryName.isNotEmpty()) {
                                                        Text(
                                                            text = item.categoryName,
                                                            fontSize = 10.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = OnSurfaceVariant
                                                        )
                                                    }
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = item.description,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = SlateDeep
                                                )
                                                if (item.unit.isNotEmpty() || item.quantity > 0) {
                                                    Spacer(modifier = Modifier.height(2.dp))
                                                    Text(
                                                        text = "Unidad: ${item.unit} | Cantidad Programada: ${item.quantity}",
                                                        fontSize = 11.sp,
                                                        color = OnSurfaceVariant
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = {
                                viewModel.setConcepto(null, "")
                                showConceptBottomSheet = false
                                conceptSearchQuery = ""
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = LightGrayBg, contentColor = SlateDeep),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, SubtleOutline)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("+ Ingresar Concepto Libre / No Catalogado", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }

            // --- 4. ACTIVIDADES Y AVANCE ---
            val isTramite = selectedConceptoName?.contains("tramit", ignoreCase = true) == true
            ExpandableFormSection(
                title = if (isTramite) "Actividades y Avance Administrativo" else "Actividades y Avance Físico",
                icon = Icons.Default.Engineering,
                isExpanded = expActivities,
                onToggle = { expActivities = !expActivities }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Texto de Actividades con Botón de Dictado Continuo (No se apaga con pausas de silencio)
                    OutlinedTextField(
                        value = activitiesText,
                        onValueChange = { activitiesText = it },
                        label = { Text("Descripción de trabajos ejecutados") },
                        placeholder = { Text("Describe las actividades y avances ejecutados hoy...") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .onFocusChanged { focusState ->
                                if (focusState.isFocused && activitiesText.startsWith("Instalación de estructuras")) {
                                    activitiesText = ""
                                }
                            },
                        minLines = 3,
                        colors = outlinedTextFieldColors(),
                        trailingIcon = {
                            IconButton(onClick = {
                                if (recordAudioPermission.status.isGranted) {
                                    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
                                    val network = cm.activeNetwork
                                    val capabilities = cm.getNetworkCapabilities(network)
                                    val isOffline = network == null || capabilities == null || !capabilities.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET)

                                    val speechIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                                        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-MX")
                                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "es-MX")
                                        putExtra(RecognizerIntent.EXTRA_PROMPT, "Habla tu dictado. Puedes pausar.")
                                        if (isOffline) {
                                            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                                        }
                                        // Increase silence length to allow thinking pauses
                                        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 60000L)
                                        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 60000L)
                                        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 60000L)
                                    }

                                    try {
                                        speechRecognizerLauncher.launch(speechIntent)
                                    } catch (e: Exception) {
                                        if (isOffline) {
                                            Toast.makeText(context, "Para usar voz sin internet, descarga el paquete 'Español (México)' en los ajustes de Google.", Toast.LENGTH_LONG).show()
                                        } else {
                                            Toast.makeText(context, "Servicio de voz no disponible en este dispositivo", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                } else {
                                    recordAudioPermission.launchPermissionRequest()
                                }
                            }) {
                                Icon(
                                    imageVector = Icons.Default.Mic,
                                    contentDescription = "Dictar por voz",
                                    tint = ConnectedBlue
                                )
                            }
                        }
                    )

                    // VENTANA EMERGENTE DE DICTADO POR VOZ (Solo se cierra cuando el usuario da clic en Finalizar)
                    if (showDictationDialog) {
                        AlertDialog(
                            onDismissRequest = {
                                isDictatingContinuous = false
                                try { speechRecognizer?.stopListening() } catch (e: Exception) {}
                                showDictationDialog = false
                            },
                            title = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.Red, strokeWidth = 2.dp)
                                    Text("Dictado por Voz Activo 🎙️", fontWeight = FontWeight.Black, fontSize = 16.sp, color = SlateDeep)
                                }
                            },
                            text = {
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text(
                                        text = "Habla con libertad. Puedes pausar para pensar el tiempo que requieras sin que se cancele.",
                                        fontSize = 12.sp,
                                        color = OnSurfaceVariant
                                    )
                                    
                                    // Visualizador de audio / nivel de micrófono
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(8.dp)
                                            .background(LightGrayBg, RoundedCornerShape(4.dp))
                                            .padding(horizontal = 2.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxHeight()
                                                .fillMaxWidth((speechRmsLevel.coerceIn(0f, 10f) / 10f).coerceAtLeast(0.05f))
                                                .background(if (speechRmsLevel > 2f) ConnectedBlue else Color.Gray, RoundedCornerShape(4.dp))
                                        )
                                    }

                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .heightIn(min = 110.dp, max = 200.dp),
                                        colors = CardDefaults.cardColors(containerColor = LightGrayBg),
                                        border = BorderStroke(1.dp, ConnectedBlue.copy(alpha = 0.3f))
                                    ) {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(14.dp)
                                                .verticalScroll(rememberScrollState())
                                        ) {
                                            Text(
                                                text = liveDictatedText.ifEmpty { "🔴 Escuchando... Comienza a hablar tu dictado." },
                                                fontSize = 13.sp,
                                                fontWeight = if (liveDictatedText.isEmpty()) FontWeight.Normal else FontWeight.Medium,
                                                color = if (liveDictatedText.isEmpty()) Color.Gray else SlateDeep
                                            )
                                        }
                                    }

                                    // Botón secundario para usar la pantalla oficial de Google si el dispositivo lo requiere
                                    OutlinedButton(
                                        onClick = {
                                            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                                                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                                                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-MX")
                                                putExtra(RecognizerIntent.EXTRA_PROMPT, "Habla tu dictado...")
                                            }
                                            speechRecognizerLauncher.launch(intent)
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(10.dp),
                                        border = BorderStroke(1.dp, SolarAmber),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = SolarAmber)
                                    ) {
                                        Icon(Icons.Default.Mic, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("🎙️ Abrir Ventana Directa de Google", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            },
                            confirmButton = {
                                Button(
                                    onClick = {
                                        isDictatingContinuous = false
                                        try { speechRecognizer?.stopListening() } catch (e: Exception) {}
                                        if (liveDictatedText.isNotEmpty()) {
                                            activitiesText = if (activitiesText.isEmpty()) liveDictatedText else "$activitiesText $liveDictatedText"
                                            Toast.makeText(context, "¡Dictado aplicado correctamente!", Toast.LENGTH_SHORT).show()
                                        }
                                        showDictationDialog = false
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue, contentColor = PureWhite),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("FINALIZAR Y APLICAR DICTADO 🛑", fontWeight = FontWeight.Black, fontSize = 12.sp)
                                }
                            },
                            dismissButton = {
                                TextButton(
                                    onClick = {
                                        isDictatingContinuous = false
                                        try { speechRecognizer?.stopListening() } catch (e: Exception) {}
                                        showDictationDialog = false
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Cancelar Dictado", color = Color.Gray, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            },
                            containerColor = PureWhite,
                            shape = RoundedCornerShape(20.dp)
                        )
                    }
                    
                    // Botón de Redacción y Formateo con IA Local (Gemma / Local STT Engine)
                    Button(
                        onClick = { 
                            if (activitiesText.isNotEmpty()) {
                                viewModel.improveTextWithAi(activitiesText) { improved, err ->
                                    if (improved != null) {
                                        activitiesText = improved
                                    }
                                }
                            } else {
                                Toast.makeText(context, "Escribe o dicta algo primero", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = if (activitiesText.isNotEmpty()) SolarAmber else Color.Gray),
                        enabled = !isAiProcessing
                    ) {
                        if (isAiProcessing) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Redactando con IA...", fontWeight = FontWeight.Bold, color = Color.White)
                        } else {
                            Icon(Icons.Default.AutoAwesome, contentDescription = "IA Local", tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("✨ Mejorar Redacción con IA", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                    
                    Column {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Avance Diario Estimado", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = SlateDeep)
                            Row(verticalAlignment = Alignment.CenterVertically) {
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
                        placeholder = { Text("Ej: Páneles 550W, Cable solar 10 AWG, Inversor...") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        colors = outlinedTextFieldColors()
                    )
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
                    placeholder = { Text("Observaciones de seguridad en campo...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { focusState ->
                            if (focusState.isFocused && safetyRemarks.startsWith("Charcos por lluvia")) {
                                safetyRemarks = ""
                            }
                        },
                    minLines = 2,
                    colors = outlinedTextFieldColors()
                )
            }

            // --- 6. EVIDENCIA FOTOGRÁFICA ---
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
                    }
                }
            }

            // --- 7. FIRMA DIGITAL DE CONFORMIDAD ---
            ExpandableFormSection(
                title = "Firma Digital de Conformidad",
                icon = Icons.Default.Draw,
                isExpanded = expSignature,
                onToggle = { expSignature = !expSignature }
            ) {
                SignaturePadView(
                    onSignatureCaptured = { base64 -> signatureBase64 = base64 },
                    onClear = { signatureBase64 = "" }
                )
            }

            // --- 8. BOTÓN FINAL: GUARDAR Y GENERAR PDF ---
            val totalCrew = (internalCrew.toIntOrNull() ?: 0) + (subCrew.toIntOrNull() ?: 0)
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Botón Generar PDF Offline
                OutlinedButton(
                    onClick = {
                        val tempLog = com.example.data.database.BitacoraEntity(
                            siteName = projectName,
                            date = selectedCustomDate ?: currentDateStr,
                            weather = weather,
                            crewCount = totalCrew,
                            description = activitiesText.ifEmpty { "Sin descripción" },
                            physicalProgress = progressVal.toDouble(),
                            financialProgress = 0.0,
                            budgetEstimate = 0.0,
                            latitude = 0.0,
                            longitude = 0.0,
                            photoUri = capturedPhotoUris.joinToString(","),
                            safetyRemarks = safetyRemarks,
                            machinery = machineryUsed,
                            concepto_name = selectedConceptoName
                        )
                        val pdfFile = PdfReportGenerator.generateBitacoraPdf(context, tempLog)
                        if (pdfFile != null) {
                            Toast.makeText(context, "📄 PDF Generado: ${pdfFile.name}", Toast.LENGTH_LONG).show()
                        } else {
                            Toast.makeText(context, "Error al generar PDF", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, ConnectedBlue)
                ) {
                    Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = ConnectedBlue)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Generar PDF", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = ConnectedBlue)
                }

                // Botón Guardar
                Button(
                    onClick = {
                        if (isSaving) return@Button
                        isSaving = true
                        saveButtonText = "GUARDANDO EN BASE DE DATOS..."

                        viewModel.setCrewCount(totalCrew)
                        viewModel.setDescription(activitiesText.ifEmpty { "Sin descripción de actividades." })
                        viewModel.setPhysicalProgress(progressVal.toDouble())
                        viewModel.setSafetyRemarks(safetyRemarks)
                        viewModel.setMachinery(machineryUsed)

                        coroutineScope.launch {
                            delay(600)
                            viewModel.submitDailyLog {
                                Toast.makeText(context, "¡Reporte guardado exitosamente!", Toast.LENGTH_LONG).show()
                                onNavigateToDashboard()
                            }
                        }
                    },
                    modifier = Modifier
                        .weight(1.5f)
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ConnectedBlue,
                        contentColor = PureWhite
                    ),
                    shape = RoundedCornerShape(16.dp),
                    enabled = !isSaving
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = PureWhite, strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(10.dp))
                    } else {
                        Icon(Icons.Default.CheckCircle, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                    }
                    Text(saveButtonText, fontWeight = FontWeight.Black, fontSize = 12.sp)
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
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(icon, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(title, fontWeight = FontWeight.Black, fontSize = 14.sp, color = SlateDeep)
                }
                Icon(
                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = "Expandir/Colapsar",
                    tint = OnSurfaceVariant
                )
            }

            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically(animationSpec = tween(300)),
                exit = shrinkVertically(animationSpec = tween(300))
            ) {
                Column(
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp)
                ) {
                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp, modifier = Modifier.padding(bottom = 12.dp))
                    content()
                }
            }
        }
    }
}

@Composable
fun outlinedTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = ConnectedBlue,
    unfocusedBorderColor = SubtleOutline,
    focusedLabelColor = ConnectedBlue,
    unfocusedLabelColor = OnSurfaceVariant,
    focusedTextColor = SlateDeep,
    unfocusedTextColor = SlateDeep
)
