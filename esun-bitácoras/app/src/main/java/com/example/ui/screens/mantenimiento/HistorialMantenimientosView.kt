package com.example.ui.screens.mantenimiento

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.database.PolizaEntity
import com.example.data.database.VisitaMantenimientoEntity
import java.text.SimpleDateFormat
import java.time.Instant
import java.util.*

private val DarkBg = Color(0xFF0F172A)
private val CardBg = Color(0xFF1E293B)
private val GoldAccent = Color(0xFFC49825)
private val TextCream = Color(0xFFF8FAFC)
private val TextMuted = Color(0xFF94A3B8)
private val EmeraldGreen = Color(0xFF10B981)

@Composable
fun HistorialMantenimientosView(
    polizas: List<PolizaEntity>,
    visitasCompletadas: List<VisitaMantenimientoEntity>,
    userRole: String = "Trabajador",
    onSelectVisita: (VisitaMantenimientoEntity) -> Unit
) {
    var searchTerm by remember { mutableStateOf("") }

    val isMasterOrAdmin = remember(userRole) {
        val r = userRole.lowercase().trim()
        r == "master" || r == "admin" || r == "administrador"
    }

    val polizaMap = remember(polizas) { polizas.associateBy { it.id } }

    val filtered = remember(visitasCompletadas, polizaMap, searchTerm, isMasterOrAdmin) {
        val q = searchTerm.lowercase().trim()
        val nowMillis = System.currentTimeMillis()
        val twentyFourHoursMillis = 24 * 60 * 60 * 1000L

        visitasCompletadas.filter { visita ->
            // Filtro de 24 horas para usuarios de rol Trabajador/Supervisor que no sean Master ni Admin
            if (!isMasterOrAdmin) {
                val isRecent = isWithin24Hours(visita.fechaRealizada, nowMillis, twentyFourHoursMillis)
                if (!isRecent) return@filter false
            }

            val poliza = polizaMap[visita.polizaId]
            val obra = poliza?.nombreObra?.lowercase() ?: ""
            val cliente = poliza?.clienteNombre?.lowercase() ?: ""
            val folio = poliza?.folio?.lowercase() ?: ""
            val num = visita.numeroVisita.toString()
            q.isEmpty() || obra.contains(q) || cliente.contains(q) || folio.contains(q) || num.contains(q)
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // Banner aclaratorio sobre restricción de 24 horas si no es Master/Admin
        if (!isMasterOrAdmin) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF334155).copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Icon(Icons.Default.Info, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Modo Campo: Se muestran las bitácoras emitidas en las últimas 24 horas.",
                    color = TextCream,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        // Buscador
        OutlinedTextField(
            value = searchTerm,
            onValueChange = { searchTerm = it },
            placeholder = { Text("Buscar en el historial (folio, cliente u obra)...", color = TextMuted, fontSize = 13.sp) },
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
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = TextMuted, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        if (!isMasterOrAdmin) "No hay bitácoras completadas en las últimas 24 horas."
                        else "No hay bitácoras de mantenimiento completadas aún.",
                        color = TextMuted,
                        fontSize = 14.sp
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filtered) { visita ->
                    val poliza = polizaMap[visita.polizaId]
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBg),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().clickable { onSelectVisita(visita) }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        poliza?.folio ?: "FOLIO",
                                        color = GoldAccent,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp,
                                        modifier = Modifier
                                            .background(GoldAccent.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Visita #${visita.numeroVisita}", color = TextCream, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    poliza?.nombreObra ?: "Obra de Mantenimiento",
                                    color = TextCream,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 15.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )

                                Spacer(modifier = Modifier.height(2.dp))

                                Text(
                                    "Cliente: ${poliza?.clienteNombre ?: "N/A"}",
                                    color = TextMuted,
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    "COMPLETADA",
                                    color = EmeraldGreen,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier
                                        .background(EmeraldGreen.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    visita.fechaRealizada ?: visita.fechaProgramada,
                                    color = TextMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun isWithin24Hours(fechaRealizadaStr: String?, nowMillis: Long, maxAgeMillis: Long): Boolean {
    if (fechaRealizadaStr.isNullOrBlank()) return true
    try {
        if (fechaRealizadaStr.length == 10 && fechaRealizadaStr.contains("-")) {
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val date = sdf.parse(fechaRealizadaStr)
            if (date != null) {
                val diff = nowMillis - date.time
                return diff in 0..(maxAgeMillis + 12 * 3600 * 1000L)
            }
        }
        val instant = Instant.parse(fechaRealizadaStr)
        val diff = nowMillis - instant.toEpochMilli()
        return diff in 0..maxAgeMillis
    } catch (e: Exception) {
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        return fechaRealizadaStr.startsWith(todayStr)
    }
}
