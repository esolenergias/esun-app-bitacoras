package com.example.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.database.BitacoraEntity
import com.example.ui.theme.*
import com.example.data.database.TaskEntity
import com.example.ui.viewmodel.BitacoraViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: BitacoraViewModel,
    onNavigateToNewLog: (String) -> Unit,
    onNavigateToNewObra: () -> Unit,
    onNavigateToObraDashboard: (String) -> Unit
) {
    val bitacoras by viewModel.bitacorasList.collectAsState()
    val syncStatus by viewModel.syncStatus.collectAsState()
    val budgetItems by viewModel.budgetItems.collectAsState()
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    // Fecha dinámica del sistema en español
    val currentDateStr = remember {
        SimpleDateFormat("EEEE, dd 'DE' MMMM", Locale("es", "MX")).format(Date()).uppercase(Locale("es", "MX"))
    }

    // Selected Bitacora site index
    var selectedSiteIndex by remember { mutableStateOf(0) }

    // Dynamic list of locations based on current database bitacoras
    val locations = remember(bitacoras) {
        if (bitacoras.isEmpty()) {
            listOf(
                LocationInfo(
                    id = -1,
                    siteName = "Planta Solar Esol Hermosillo",
                    latitude = 29.0892,
                    longitude = -110.9613,
                    weather = "Soleado • 32°C",
                    date = "Hoy"
                )
            )
        } else {
            bitacoras.map { b ->
                LocationInfo(
                    id = b.id,
                    siteName = b.siteName,
                    latitude = b.latitude,
                    longitude = b.longitude,
                    weather = b.weather,
                    date = b.date
                )
            }
        }
    }

    // Ensure selectedSiteIndex is in bounds
    val activeIndex = if (selectedSiteIndex >= locations.size) 0 else selectedSiteIndex
    val selectedLocation = locations.getOrNull(activeIndex) ?: locations.first()

    // Stateful tasks list
    val tasksState by viewModel.allTasks.collectAsState()

    // Automatically seed generic tasks if a new site is selected and has no tasks
    

    val activeTasks = remember(tasksState) {
        tasksState.filter { it.isImportant && !it.isArchived }
    }
    val pendingCount = remember(activeTasks) {
        activeTasks.count { !it.isCompleted }
    }

    // Dynamic metrics calculated from the live database
    val overallPhysicalProgress = if (budgetItems.isNotEmpty()) {
        budgetItems.sumOf { 
            if (it.quantity > 0.0) (it.executedQuantity / it.quantity) * 100.0 else 0.0 
        } / budgetItems.size
    } else {
        65.0
    }

    val totalBudget = budgetItems.sumOf { it.quantity * it.unitPrice }
    val totalCostExecuted = budgetItems.sumOf { it.executedQuantity * it.unitPrice }
    val overallFinancialProgressPercent = if (totalBudget > 0.0) {
        (totalCostExecuted / totalBudget) * 100.0
    } else {
        64.0
    }

    // Static alpha for online status dot to prevent continuous 60fps recompositions in preview
    val pulseAlpha = 0.8f

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBg)
    ) {
        // --- 1. STICKY PREMIUM TOP BAR ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .padding(horizontal = 20.dp, vertical = 16.dp)
                .border(BorderStroke(0.dp, Color.Transparent)), // No border, pure shadow/divider below
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = com.example.R.drawable.logo_esunbitacora),
                        contentDescription = "ESun Logo",
                        modifier = Modifier.fillMaxSize()
                    )
                }
                Column {
                    Text(
                        text = "ESun Bitacora",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = SlateDeep
                    )
                }
            }

            // Status indicator capsule
            Row(
                modifier = Modifier
                    .background(
                        color = if (syncStatus.isOnline) SuccessGreenBg else WarningRedBg,
                        shape = RoundedCornerShape(100.dp)
                    )
                    .border(
                        BorderStroke(1.dp, if (syncStatus.isOnline) Color(0xFFD1FAE5) else Color(0xFFFEE2E2)),
                        RoundedCornerShape(100.dp)
                    )
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(RoundedCornerShape(100))
                        .background(
                            (if (syncStatus.isOnline) SuccessGreen else WarningRed).copy(
                                alpha = pulseAlpha
                            )
                        )
                )
                Text(
                    text = if (syncStatus.isOnline) "ONLINE" else "LOCAL",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    color = if (syncStatus.isOnline) Color(0xFF047857) else Color(0xFFB91C1C)
                )
            }
        }

        HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

        // --- SCROLLABLE BENTO BOARD ---
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Welcome Section
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = currentDateStr,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = OnSurfaceVariant,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Estado General",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 28.sp,
                    color = SlateDeep
                )
            }

            // --- ACCIONES RÁPIDAS (QUICK ACTIONS) ---
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "ACCIONES RÁPIDAS",
                    fontWeight = FontWeight.Black,
                    fontSize = 12.sp,
                    color = SlateDeep,
                    letterSpacing = 0.5.sp
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Action 1: New Log for Active Obra
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .height(100.dp)
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp))
                            .clickable { onNavigateToNewLog(selectedLocation.siteName) },
                        colors = CardDefaults.cardColors(containerColor = PureWhite)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.SpaceBetween,
                            horizontalAlignment = Alignment.Start
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color(0xFFEFF6FF), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Add,
                                    contentDescription = null,
                                    tint = ConnectedBlue,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "Nuevo Registro",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 12.sp,
                                    color = SlateDeep
                                )
                                Text(
                                    text = "Escribir bitácora diaria",
                                    fontSize = 9.sp,
                                    color = OnSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    // Action 2: New Obra
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .height(100.dp)
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp))
                            .clickable { onNavigateToNewObra() },
                        colors = CardDefaults.cardColors(containerColor = PureWhite)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.SpaceBetween,
                            horizontalAlignment = Alignment.Start
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color(0xFFFEF3C7), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Business,
                                    contentDescription = null,
                                    tint = SolarAmber,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "Nueva Obra",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 12.sp,
                                    color = SlateDeep
                                )
                                Text(
                                    text = "Registrar nuevo proyecto",
                                    fontSize = 9.sp,
                                    color = OnSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    // Action 3: Go to Obra Control Dashboard
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .height(100.dp)
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp))
                            .clickable { onNavigateToObraDashboard(selectedLocation.siteName) },
                        colors = CardDefaults.cardColors(containerColor = PureWhite)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.SpaceBetween,
                            horizontalAlignment = Alignment.Start
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color(0xFFEFF6FF), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.BarChart,
                                    contentDescription = null,
                                    tint = ConnectedBlue,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "Control de Obra",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 12.sp,
                                    color = SlateDeep
                                )
                                Text(
                                    text = "Ver métricas y análisis",
                                    fontSize = 9.sp,
                                    color = OnSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }

            // --- LISTADO DE BITÁCORAS DE OBRA ACTUALES ---
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "BITÁCORAS DE OBRA RECIENTES",
                        fontWeight = FontWeight.Black,
                        fontSize = 12.sp,
                        color = SlateDeep,
                        letterSpacing = 0.5.sp
                    )
                    
                    // Total count badge
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFEFF6FF), RoundedCornerShape(100.dp))
                            .border(BorderStroke(1.dp, Color(0xFFDBEAFE)), RoundedCornerShape(100.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "${bitacoras.size} REGISTROS",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = ConnectedBlue
                        )
                    }
                }

                if (bitacoras.isEmpty()) {
                    // Empty state card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = PureWhite)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.EventNote,
                                contentDescription = null,
                                tint = OnSurfaceVariant,
                                modifier = Modifier.size(48.dp)
                            )
                            Text(
                                text = "Sin bitácoras registradas",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = SlateDeep
                            )
                            Text(
                                text = "Escribe tu primer reporte diario para comenzar a registrar el avance de la obra civil y eléctrica.",
                                fontSize = 11.sp,
                                color = OnSurfaceVariant,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                        }
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        bitacoras.take(5).forEach { log ->
                            BeautifulBitacoraCard(
                                log = log,
                                onCardClick = { onNavigateToObraDashboard(log.siteName) }
                            )
                        }
                    }
                }
            }

            // --- 2. BENTO PROGRESS CARDS (PHYSICAL ONLY) ---
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
                            text = "Avance Físico",
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
                            Text(
                                text = "+2% hoy",
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                color = SuccessGreen,
                                modifier = Modifier.padding(bottom = 6.dp)
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

                    Text(
                        text = "Fase de instalación de paneles fotovoltaicos en curso.",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = OnSurfaceVariant,
                        lineHeight = 14.sp
                    )
                }
            }

            // --- 3. WEATHER WIDGET & CRITICAL TASKS TIMELINE ---
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Weather Card (Dark Theme) - Shorter height
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(BorderStroke(1.dp, Color(0xFF334155)), RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = DarkSlateAccent)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.WbSunny,
                                contentDescription = "Soleado",
                                tint = SolarAmber,
                                modifier = Modifier.size(36.dp)
                            )
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text(
                                        text = "32°C",
                                        fontWeight = FontWeight.Black,
                                        fontSize = 20.sp,
                                        color = PureWhite
                                    )
                                    Text(
                                        text = "• Despejado",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp,
                                        color = Color(0xFFCBD5E1)
                                    )
                                }
                                Text(
                                    text = "CLIMA EN OBRA",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 9.sp,
                                    color = Color(0xFF94A3B8),
                                    letterSpacing = 0.5.sp
                                )
                            }
                        }

                        // Short details side-by-side
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = "VIENTO", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                                Text(text = "12 km/h", fontSize = 11.sp, fontWeight = FontWeight.Black, color = PureWhite)
                            }
                            Box(modifier = Modifier.height(18.dp).width(1.dp).background(Color(0xFF334155)))
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = "HUMEDAD", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                                Text(text = "15%", fontSize = 11.sp, fontWeight = FontWeight.Black, color = PureWhite)
                            }
                            Box(modifier = Modifier.height(18.dp).width(1.dp).background(Color(0xFF334155)))
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = "RADIACIÓN", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                                Text(text = "Alta (9)", fontSize = 11.sp, fontWeight = FontWeight.Black, color = SolarAmber)
                            }
                        }
                    }
                }
            }

            // --- 4. UBICACIÓN Y CONTROL DE OBRA CARD ---
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(24.dp)),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = LightGrayBg)
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Header & Selector
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "UBICACIÓN Y CONTROL DE OBRA",
                                fontWeight = FontWeight.Black,
                                fontSize = 11.sp,
                                color = OnSurfaceVariant,
                                letterSpacing = 0.5.sp
                            )
                            Box(
                                modifier = Modifier
                                    .background(SuccessGreenBg, RoundedCornerShape(100.dp))
                                    .border(BorderStroke(1.dp, Color(0xFFD1FAE5)), RoundedCornerShape(100.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "FRENTE ACTIVO",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Black,
                                    color = SuccessGreen
                                )
                            }
                        }

                        if (locations.size > 1) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Filtrar por obra:",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = OnSurfaceVariant
                                )
                                androidx.compose.foundation.lazy.LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    items(locations.size) { index ->
                                        val loc = locations[index]
                                        val isSelected = index == activeIndex
                                        Box(
                                            modifier = Modifier
                                                .background(
                                                    if (isSelected) ConnectedBlue else PureWhite,
                                                    RoundedCornerShape(8.dp)
                                                )
                                                .border(
                                                    BorderStroke(1.dp, if (isSelected) ConnectedBlue else SubtleOutline),
                                                    RoundedCornerShape(8.dp)
                                                )
                                                .clickable { selectedSiteIndex = index }
                                                .padding(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Text(
                                                text = loc.siteName.split(" ").takeLast(2).joinToString(" ").ifEmpty { loc.siteName },
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = if (isSelected) PureWhite else SlateDeep
                                            )
    

                                }
                            }
                        }
                    }

                    // Ubicación de obra (Always top)
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(PureWhite, RoundedCornerShape(16.dp))
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp))
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .background(Color(0xFFEFF6FF), RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = ConnectedBlue,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = selectedLocation.siteName,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 14.sp,
                                    color = SlateDeep
                                )
                                Text(
                                    text = "Coordenadas: ${String.format("%.4f", selectedLocation.latitude)}° N, ${String.format("%.4f", selectedLocation.longitude)}° W",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = OnSurfaceVariant
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.WbSunny,
                                    contentDescription = null,
                                    tint = SolarAmber,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = "Clima: ${selectedLocation.weather}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = OnSurfaceVariant
                                )
                            }

                            Text(
                                text = "REGISTRO: ${selectedLocation.date.uppercase()}",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = EsolOrange
                            )
                        }
                    }

                    // Separator line
                    HorizontalDivider(color = SubtleOutline.copy(alpha = 0.5f), thickness = 1.dp)

                    // Tareas importantes section (Always below location)
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Tareas Importantes",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 15.sp,
                                color = SlateDeep
                            )
                            Box(
                                modifier = Modifier
                                    .background(
                                        if (pendingCount > 0) WarningRedBg else SuccessGreenBg,
                                        RoundedCornerShape(100.dp)
                                    )
                                    .border(
                                        BorderStroke(
                                            1.dp,
                                            if (pendingCount > 0) Color(0xFFFEE2E2) else Color(0xFFD1FAE5)
                                        ),
                                        RoundedCornerShape(100.dp)
                                    )
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(RoundedCornerShape(100))
                                            .background(if (pendingCount > 0) WarningRed else SuccessGreen)
                                    )
                                    Text(
                                        text = if (pendingCount > 0) "$pendingCount PENDIENTES" else "AL DÍA",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Black,
                                        color = if (pendingCount > 0) WarningRed else SuccessGreen
                                    )
                                }
                            }
                        }

                        if (activeTasks.isEmpty()) {
                            Text(
                                text = "No hay tareas pendientes en esta ubicación hoy.",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                color = OnSurfaceVariant,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                activeTasks.forEach { task ->
                                    TaskTimelineItem(
                                        time = task.time,
                                        meridiem = task.meridiem,
                                        title = task.title,
                                        desc = "${task.desc} • ${task.obraId}",
                                        status = if (task.isCompleted) TaskStatus.COMPLETED else TaskStatus.PENDING,
                                        onToggle = {
                                            viewModel.updateTask(task.copy(isCompleted = !task.isCompleted))
                                        }

    
                                    )
                                }
                            }
                        }

                        // Concluir jornada button to archive completed tasks
                        if (activeTasks.any { it.isCompleted }) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Button(
                                onClick = {
                                    tasksState.filter { it.obraId == selectedLocation.siteName && it.isCompleted }.forEach { t ->
                                        viewModel.updateTask(t.copy(isArchived = true))
                                    }


                                    viewModel.simulatePushNotification(
                                        title = "Jornada Cerrada",
                                        body = "Las tareas completadas de ${selectedLocation.siteName} han sido archivadas al fin del día.",
                                        type = "SYNC"
                                    )
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = SlateDeep),
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(vertical = 12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = PureWhite,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "CONCLUIR JORNADA (DESAPARECER COMPLETADAS)",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        color = PureWhite
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // --- 5. CONTROL DE SINCRONIZACIÓN BENTO ---
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "CONTROL DE SINCRONIZACIÓN",
                    fontWeight = FontWeight.Black,
                    fontSize = 12.sp,
                    color = SlateDeep,
                    letterSpacing = 0.5.sp
                )

                // Server Status Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = PureWhite)
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column {
                                Text(
                                    text = "Servidor Esolenergias",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 16.sp,
                                    color = SlateDeep
                                )
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(Icons.Default.Link, contentDescription = null, tint = OnSurfaceVariant, modifier = Modifier.size(12.dp))
                                    Text(
                                        text = "mx-north-01.esolenergias.com",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = OnSurfaceVariant
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .background(Color(0xFFE0F2FE), RoundedCornerShape(100.dp))
                                    .border(BorderStroke(1.dp, Color(0xFFBAE6FD)), RoundedCornerShape(100.dp))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "CONECTADO",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color(0xFF0369A1)
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(text = "Latencia", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                                Text(text = "42 ms", fontSize = 18.sp, fontWeight = FontWeight.Black, color = SuccessGreen)
                            }
                            Box(modifier = Modifier.height(24.dp).width(1.dp).background(SubtleOutline))
                            Column {
                                Text(text = "Global", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                                Text(text = "60 %", fontSize = 18.sp, fontWeight = FontWeight.Black, color = ConnectedBlue)
                            }
                        }

                        // Actions: Sync Now button & Setting
                        var syncBtnText by remember { mutableStateOf("SINCRONIZAR AHORA") }
                        var isAnimatingSync by remember { mutableStateOf(false) }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    isAnimatingSync = true
                                    syncBtnText = "SINCRONIZANDO..."
                                    viewModel.triggerManualSync()
                                    coroutineScope.launch {
                                        delay(2500)
                                        isAnimatingSync = false
                                        syncBtnText = "COMPLETADO ✅"
                                        delay(2000)
                                        syncBtnText = "SINCRONIZAR AHORA"

                                    }
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (syncStatus.isSyncing || isAnimatingSync) ConnectedBlue.copy(alpha = 0.8f) else ConnectedBlue
                                ),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Sync,
                                        contentDescription = null,
                                        tint = PureWhite,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = syncBtnText,
                                        fontWeight = FontWeight.Black,
                                        color = PureWhite,
                                        fontSize = 12.sp
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(LightGrayBg, RoundedCornerShape(12.dp))
                                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp))
                                    .clickable { }
                                    .padding(12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.SettingsInputComponent, contentDescription = null, tint = OnSurfaceVariant)
                            }
                        }
                    }
                }

        }
    }
}

}

}
}
@Composable
fun BeautifulBitacoraCard(log: BitacoraEntity, onCardClick: () -> Unit = {}) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp))
            .clickable { onCardClick() },
        colors = CardDefaults.cardColors(containerColor = PureWhite)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Photo or placeholder
            if (log.photoUri != null) {
                AsyncImage(
                    model = log.photoUri,
                    contentDescription = null,
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(10.dp)),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .background(LightGrayBg, RoundedCornerShape(10.dp))
                        .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.PhotoLibrary, contentDescription = null, tint = OnSurfaceVariant)
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = log.date,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = ConnectedBlue
                    )

                    // Sync Status Badge
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier
                            .background(if (log.isSynced) SuccessGreenBg else WarningRedBg, RoundedCornerShape(100.dp))
                            .border(BorderStroke(1.dp, if (log.isSynced) Color(0xFFD1FAE5) else Color(0xFFFEE2E2)), RoundedCornerShape(100.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Icon(
                            imageVector = if (log.isSynced) Icons.Default.CloudDone else Icons.Default.Save,
                            contentDescription = null,
                            tint = if (log.isSynced) SuccessGreen else WarningRed,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = if (log.isSynced) "Sincro" else "Local",
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            color = if (log.isSynced) Color(0xFF047857) else Color(0xFFB91C1C)
                        )
                    }
                }

                Text(
                    text = log.siteName,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = SlateDeep,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Text(
                    text = log.description,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = OnSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Físico: ${log.physicalProgress}%",
                        fontWeight = FontWeight.ExtraBold,
                        color = SlateDeep,
                        fontSize = 11.sp
                    )
                    Text(
                        text = "Gasto: $${String.format("%,.0f", log.financialProgress)}",
                        fontWeight = FontWeight.ExtraBold,
                        color = SlateDeep,
                        fontSize = 11.sp
                    )
                    Text(
                        text = log.weather.split(" ").firstOrNull() ?: "☀️",
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

data class LocationInfo(
    val id: Int,
    val siteName: String,
    val latitude: Double,
    val longitude: Double,
    val weather: String,
    val date: String
)
enum class TaskStatus { PENDING, COMPLETED }

@Composable
fun TaskTimelineItem(
    time: String,
    meridiem: String,
    title: String,
    desc: String,
    status: TaskStatus,
    onToggle: () -> Unit = {}
) {
    val opacity = if (status == TaskStatus.COMPLETED) 0.5f else 1f
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(opacity)
            .clickable { onToggle() }
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            horizontalAlignment = Alignment.End,
            modifier = Modifier.width(45.dp)
        ) {
            Text(
                text = time,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = SlateDeep
            )
            Text(
                text = meridiem,
                fontWeight = FontWeight.Medium,
                fontSize = 10.sp,
                color = Color(0xFF94A3B8),
                letterSpacing = 0.5.sp
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = if (status == TaskStatus.COMPLETED) OnSurfaceVariant else SlateDeep,
                style = if (status == TaskStatus.COMPLETED) androidx.compose.ui.text.TextStyle(
                    textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough
                ) else androidx.compose.ui.text.TextStyle.Default
            )
            Text(
                text = desc,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = OnSurfaceVariant
            )
        }
        Box(
            modifier = Modifier
                .size(24.dp)
                .background(
                    if (status == TaskStatus.COMPLETED) SuccessGreenBg else LightGrayBg,
                    RoundedCornerShape(100.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (status == TaskStatus.COMPLETED) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (status == TaskStatus.COMPLETED) SuccessGreen else OnSurfaceVariant,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}
