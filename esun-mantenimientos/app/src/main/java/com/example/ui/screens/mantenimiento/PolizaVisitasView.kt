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
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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

@Composable
fun PolizaVisitasView(
    poliza: PolizaEntity,
    viewModel: BitacoraViewModel,
    onSelectVisita: (VisitaMantenimientoEntity) -> Unit
) {
    val visitas by viewModel.getVisitasForPoliza(poliza.id).collectAsState(initial = emptyList())

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

        items(visitas) { visita ->
            val isCompletada = visita.estado.lowercase() == "completada"

            Card(
                colors = CardDefaults.cardColors(containerColor = CardBg),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().clickable { onSelectVisita(visita) }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                        Icon(
                            if (isCompletada) Icons.Default.CheckCircle else Icons.Default.DateRange,
                            contentDescription = null,
                            tint = if (isCompletada) SuccessGreen else GoldAccent,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Visita #${visita.numeroVisita}", color = TextCream, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Programada: ${visita.fechaProgramada}", color = TextMuted, fontSize = 12.sp)
                        }
                    }

                    Text(
                        if (isCompletada) "Completada" else "Pendiente",
                        color = if (isCompletada) SuccessGreen else GoldAccent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .background(
                                (if (isCompletada) SuccessGreen else GoldAccent).copy(alpha = 0.15f),
                                RoundedCornerShape(4.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}
