package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.database.PolizaEntity
import com.example.data.database.VisitaMantenimientoEntity
import com.example.ui.screens.mantenimiento.HistorialMantenimientosView
import com.example.ui.screens.mantenimiento.PolizaVisitasView
import com.example.ui.screens.mantenimiento.PolizasListView
import com.example.ui.screens.mantenimiento.VisitaDetailView
import com.example.ui.viewmodel.BitacoraViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

private val DarkBg = Color(0xFF0F172A)
private val CardBg = Color(0xFF1E293B)
private val GoldAccent = Color(0xFFC49825)
private val TextCream = Color(0xFFF8FAFC)
private val TextMuted = Color(0xFF94A3B8)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MantenimientosScreen(
    viewModel: BitacoraViewModel,
    onNavigateBack: () -> Unit
) {
    val polizas by viewModel.polizas.collectAsState()
    val visitasCompletadas by viewModel.visitasCompletadas.collectAsState()
    val userRole by viewModel.userRole.collectAsState()

    var selectedPoliza by remember { mutableStateOf<PolizaEntity?>(null) }
    var selectedVisita by remember { mutableStateOf<VisitaMantenimientoEntity?>(null) }
    var activeTab by remember { mutableStateOf(0) } // 0: Mantenimientos, 1: Historial de Bitácoras

    val coroutineScope = rememberCoroutineScope()

    // Auto-sync when entering screen
    LaunchedEffect(Unit) {
        viewModel.syncMantenimientos()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        if (selectedVisita != null) "Mantenimiento Activo #${selectedVisita!!.numeroVisita}"
                        else if (selectedPoliza != null) selectedPoliza!!.nombreObra
                        else "Mantenimientos (APP)",
                        fontWeight = FontWeight.Bold,
                        color = TextCream,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (selectedVisita != null) {
                            selectedVisita = null
                        } else if (selectedPoliza != null) {
                            selectedPoliza = null
                        } else {
                            onNavigateBack()
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Regresar", tint = TextCream)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.syncMantenimientos() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sincronizar", tint = GoldAccent)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg)
            )
        },
        containerColor = DarkBg
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(DarkBg)
        ) {
            // Render sub-navigation tabs if not inside detail views
            if (selectedPoliza == null && selectedVisita == null) {
                TabRow(
                    selectedTabIndex = activeTab,
                    containerColor = DarkBg,
                    contentColor = GoldAccent
                ) {
                    Tab(
                        selected = activeTab == 0,
                        onClick = { activeTab = 0 },
                        text = {
                            Row {
                                Icon(Icons.Default.Build, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Mantenimientos", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        },
                        selectedContentColor = GoldAccent,
                        unselectedContentColor = TextMuted
                    )
                    Tab(
                        selected = activeTab == 1,
                        onClick = { activeTab = 1 },
                        text = {
                            Row {
                                Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Historial de Bitácoras", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        },
                        selectedContentColor = GoldAccent,
                        unselectedContentColor = TextMuted
                    )
                }
            }

            Box(modifier = Modifier.fillMaxSize().weight(1f)) {
                when {
                    selectedVisita != null -> {
                        VisitaDetailView(
                            visita = selectedVisita!!,
                            onSave = { updated ->
                                viewModel.updateVisitaLocal(updated)
                                selectedVisita = null
                            }
                        )
                    }
                    selectedPoliza != null -> {
                        PolizaVisitasView(
                            poliza = selectedPoliza!!,
                            viewModel = viewModel,
                            onSelectVisita = { selectedVisita = it }
                        )
                    }
                    activeTab == 1 -> {
                        HistorialMantenimientosView(
                            polizas = polizas,
                            visitasCompletadas = visitasCompletadas,
                            userRole = userRole,
                            onSelectVisita = { selectedVisita = it }
                        )
                    }
                    else -> {
                        PolizasListView(
                            polizas = polizas,
                            onSelectPoliza = { poliza ->
                                coroutineScope.launch {
                                    val visitas = viewModel.getVisitasForPoliza(poliza.id).first()
                                    val activeVisita = visitas
                                        .filter { v ->
                                            val st = v.estado.lowercase().trim()
                                            st != "completada" && !st.contains("no programad") && !st.contains("sin programar")
                                        }
                                        .minByOrNull { it.numeroVisita }

                                    if (activeVisita != null) {
                                        selectedVisita = activeVisita
                                    } else {
                                        selectedPoliza = poliza
                                    }
                                }
                            },
                            onSync = { viewModel.syncMantenimientos() }
                        )
                    }
                }
            }
        }
    }
}
