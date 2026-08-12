package com.example.ui.screens.mantenimiento

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.database.VisitaMantenimientoEntity

private val DarkBg = Color(0xFF0F172A)
private val CardBg = Color(0xFF1E293B)
private val GoldAccent = Color(0xFFC49825)
private val TextCream = Color(0xFFF8FAFC)
private val TextMuted = Color(0xFF94A3B8)

@Composable
fun VisitaDetailView(
    visita: VisitaMantenimientoEntity,
    onSave: (VisitaMantenimientoEntity) -> Unit
) {
    var notas by remember { mutableStateOf(visita.notasVisita) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = CardBg),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().weight(1f)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Detalles de la Visita #${visita.numeroVisita}", color = GoldAccent, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(modifier = Modifier.height(12.dp))

                Text("Notas / Observaciones del Técnico", color = TextCream, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = notas,
                    onValueChange = { notas = it },
                    modifier = Modifier.fillMaxWidth().height(120.dp),
                    placeholder = { Text("Escribe los detalles o trabajos realizados...", color = TextMuted) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = DarkBg,
                        unfocusedContainerColor = DarkBg,
                        focusedTextColor = TextCream,
                        unfocusedTextColor = TextCream,
                        focusedBorderColor = GoldAccent,
                        unfocusedBorderColor = TextMuted
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = {
                val updated = visita.copy(
                    notasVisita = notas,
                    estado = "completada",
                    syncStatus = "PENDING"
                )
                onSave(updated)
            },
            colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(10.dp)
        ) {
            Icon(Icons.Default.Check, contentDescription = null, tint = DarkBg)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Guardar y Completar Visita", color = DarkBg, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }
    }
}
