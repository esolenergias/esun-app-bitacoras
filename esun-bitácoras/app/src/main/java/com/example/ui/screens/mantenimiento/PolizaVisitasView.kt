package com.example.ui.screens.mantenimiento

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.database.PolizaEntity
import com.example.data.database.VisitaMantenimientoEntity
import com.example.ui.viewmodel.BitacoraViewModel

private val CardBg = Color(0xFF1E293B)
private val GoldAccent = Color(0xFFC49825)
private val TextCream = Color(0xFFF8FAFC)
private val TextMuted = Color(0xFF94A3B8)
private val SuccessGreen = Color(0xFF10B981)
private val ProgramadoGrey = Color(0xFF64748B)

@Composable
fun PolizaVisitasView(
    poliza: PolizaEntity,
    viewModel: BitacoraViewModel,
    onSelectVisita: (VisitaMantenimientoEntity) -> Unit
) {
    val rawVisitas by viewModel.getVisitasForPoliza(poliza.id).collectAsState(initial = emptyList())

    // En estatus "En Proceso", únicamente mostrar la visita activa de la fecha vigente
    // (Omitir las anteriores completadas que pertenecen a Historial y las posteriores del año)
    val visitasActivas = remember(rawVisitas) {
        val pendientes = rawVisitas.filter { v ->
            val st = v.estado.lowercase().trim()
            st != "completada" && !st.contains("no programad") && !st.contains("sin programar")
        }
        // Seleccionar la visita pendiente con número de visita más bajo (la fecha activa)
        val primeraActiva = pendientes.minByOrNull { it.numeroVisita }
        if (primeraActiva != null) listOf(primeraActiva) else emptyList()
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBg.copy(alpha = 0.6f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(poliza.nombreObra, color = TextCream, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("Folio: ${poliza.folio} • Cliente: ${poliza.clienteNombre}", color = TextMuted, fontSize = 12.sp)
                }
            }
        }

        if (visitasActivas.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "Todas las visitas programadas para este mantenimiento han sido completadas.",
                        color = TextMuted,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        } else {
            items(visitasActivas) { visita ->
                val st = visita.estado.lowercase()
                val isCompletada = st == "completada"
                val isProgramado = st.contains("programad") && !st.contains("no programad")
                val isEnProceso = st.contains("proceso") || st == "pendiente"

                val cardAlpha = if (isProgramado) 0.55f else 1.0f

                val estatusLabel = when {
                    isCompletada -> "COMPLETADA"
                    isProgramado -> "PROGRAMADO"
                    isEnProceso -> "EN PROCESO"
                    else -> visita.estado.uppercase()
                }

                val estatusColor = when {
                    isCompletada -> SuccessGreen
                    isProgramado -> ProgramadoGrey
                    isEnProceso -> GoldAccent
                    else -> GoldAccent
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .alpha(cardAlpha)
                        .clickable(enabled = !isProgramado) { onSelectVisita(visita) }
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Icon(
                                when {
                                    isCompletada -> Icons.Default.CheckCircle
                                    isProgramado -> Icons.Default.Lock
                                    else -> Icons.Default.DateRange
                                },
                                contentDescription = null,
                                tint = estatusColor,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Visita Activa #${visita.numeroVisita}", color = TextCream, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Fecha de Trabajo: ${visita.fechaProgramada}", color = TextMuted, fontSize = 12.sp)
                            }
                        }

                        Text(
                            estatusLabel,
                            color = estatusColor,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .background(
                                    estatusColor.copy(alpha = 0.15f),
                                    RoundedCornerShape(4.dp)
                                )
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}
