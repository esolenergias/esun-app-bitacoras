package com.example.ui.screens.mantenimiento

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.database.PolizaEntity

private val CardBg = Color(0xFF1E293B)
private val GoldAccent = Color(0xFFC49825)
private val TextCream = Color(0xFFF8FAFC)
private val TextMuted = Color(0xFF94A3B8)
private val EmeraldGreen = Color(0xFF10B981)
private val ProgramadoGrey = Color(0xFF64748B)

@Composable
fun PolizasListView(
    polizas: List<PolizaEntity>,
    onSelectPoliza: (PolizaEntity) -> Unit,
    onSync: () -> Unit = {}
) {
    var searchTerm by remember { mutableStateOf("") }

    // Excluir estrictamente "No programada" / "No programado" y permitir únicamente "Programado", "En Proceso", etc.
    val validPolizas = remember(polizas) {
        polizas.filter { p ->
            val st = p.estadoMantenimiento.lowercase().trim()
            if (st.contains("no programad") || st.contains("sin programar")) {
                false
            } else {
                st.contains("programad") || st.contains("proceso") || st.contains("pendient") || st.contains("activ") || st.contains("completad")
            }
        }
    }

    // Ordenar por fecha de mantenimiento más próxima
    val sortedPolizas = remember(validPolizas) {
        validPolizas.sortedWith(
            compareBy<PolizaEntity> {
                val f = it.fechaProximoMantenimiento ?: it.fechaInicio
                if (f.isBlank()) "9999-99-99" else f
            }.thenBy { it.nombreObra }
        )
    }

    val filtered = remember(sortedPolizas, searchTerm) {
        val q = searchTerm.lowercase().trim()
        sortedPolizas.filter { poliza ->
            q.isEmpty() ||
            poliza.nombreObra.lowercase().contains(q) ||
            poliza.clienteNombre.lowercase().contains(q) ||
            poliza.clienteDireccion.lowercase().contains(q) ||
            poliza.folio.lowercase().contains(q)
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // Buscador
        OutlinedTextField(
            value = searchTerm,
            onValueChange = { searchTerm = it },
            placeholder = { Text("Buscar por folio, cliente, obra o dirección...", color = TextMuted, fontSize = 13.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = CardBg,
                unfocusedContainerColor = CardBg,
                focusedTextColor = TextCream,
                unfocusedTextColor = TextCream,
                focusedBorderColor = GoldAccent,
                unfocusedBorderColor = Color(0xFF334155)
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (filtered.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().weight(1f), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Build, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("No hay mantenimientos activos o programados.", color = TextCream, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Presiona el botón para sincronizar desde el servidor web.", color = TextMuted, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onSync,
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, tint = Color(0xFF0F172A))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Sincronizar Mantenimientos", color = Color(0xFF0F172A), fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filtered) { poliza ->
                    val st = poliza.estadoMantenimiento.lowercase()
                    val isProgramado = st.contains("programad") && !st.contains("no programad")
                    val isEnProceso = st.contains("proceso") || st.contains("pendient")

                    val cardAlpha = if (isProgramado) 0.55f else 1.0f

                    val estatusLabel = when {
                        isProgramado -> "PROGRAMADO"
                        isEnProceso -> "EN PROCESO"
                        st.contains("completad") -> "COMPLETADO"
                        else -> poliza.estadoMantenimiento.uppercase()
                    }

                    val estatusColor = when {
                        isProgramado -> ProgramadoGrey
                        isEnProceso -> GoldAccent
                        st.contains("completad") -> EmeraldGreen
                        else -> GoldAccent
                    }

                    val fechaDisplay = poliza.fechaProximoMantenimiento?.takeIf { it.isNotBlank() } ?: poliza.fechaInicio

                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBg),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .alpha(cardAlpha)
                            .clickable(enabled = !isProgramado) { onSelectPoliza(poliza) }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            // Fila Superior: Folio & Estatus Badge
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    poliza.folio,
                                    color = GoldAccent,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier
                                        .background(GoldAccent.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                )

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (isProgramado) {
                                        Icon(Icons.Default.Lock, contentDescription = null, tint = ProgramadoGrey, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                    }
                                    Text(
                                        "ESTATUS: $estatusLabel",
                                        color = estatusColor,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier
                                            .background(estatusColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Nombre Obra
                            Text(
                                poliza.nombreObra,
                                color = TextCream,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )

                            Spacer(modifier = Modifier.height(6.dp))

                            // Cliente
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Person, contentDescription = null, tint = TextMuted, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(poliza.clienteNombre, color = TextMuted, fontSize = 13.sp)
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            // Fecha
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CalendarToday, contentDescription = null, tint = if (isProgramado) TextMuted else GoldAccent, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Fecha: $fechaDisplay", color = TextCream, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }

                            if (poliza.clienteDireccion.isNotBlank()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                // Dirección
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = if (isProgramado) TextMuted else GoldAccent, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        "Dirección: ${poliza.clienteDireccion}",
                                        color = TextMuted,
                                        fontSize = 12.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            if (isProgramado) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "🔒 Mantenimiento Programado (Solo lectura sin acceso)",
                                    color = ProgramadoGrey,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
