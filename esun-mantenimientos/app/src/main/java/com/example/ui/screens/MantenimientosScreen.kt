package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.example.data.database.PolizaEntity
import com.example.data.database.VisitaMantenimientoEntity
import com.example.ui.screens.mantenimiento.PolizaVisitasView
import com.example.ui.screens.mantenimiento.PolizasListView
import com.example.ui.screens.mantenimiento.VisitaDetailView
import com.example.ui.viewmodel.BitacoraViewModel

private val DarkBg = Color(0xFF0F172A)
private val GoldAccent = Color(0xFFC49825)
private val TextCream = Color(0xFFF8FAFC)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MantenimientosScreen(
    viewModel: BitacoraViewModel,
    onNavigateBack: () -> Unit
) {
    val polizas by viewModel.polizas.collectAsState()
    var selectedPoliza by remember { mutableStateOf<PolizaEntity?>(null) }
    var selectedVisita by remember { mutableStateOf<VisitaMantenimientoEntity?>(null) }

    LaunchedEffect(Unit) {
        viewModel.syncMantenimientos()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        if (selectedVisita != null) "Visita #${selectedVisita!!.numeroVisita}"
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
        Box(modifier = Modifier.padding(padding).fillMaxSize().background(DarkBg)) {
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
                else -> {
                    PolizasListView(
                        polizas = polizas,
                        onSelectPoliza = { selectedPoliza = it }
                    )
                }
            }
        }
    }
}
