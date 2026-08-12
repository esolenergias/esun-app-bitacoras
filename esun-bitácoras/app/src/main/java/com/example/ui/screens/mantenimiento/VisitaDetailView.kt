package com.example.ui.screens.mantenimiento

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.database.VisitaMantenimientoEntity
import org.json.JSONArray
import org.json.JSONObject

private val DarkBg = Color(0xFF0F172A)
private val CardBg = Color(0xFF1E293B)
private val GoldAccent = Color(0xFFC49825)
private val TextCream = Color(0xFFF8FAFC)
private val TextMuted = Color(0xFF94A3B8)
private val EmeraldGreen = Color(0xFF10B981)
private val ProgramadoGrey = Color(0xFF64748B)

data class ChecklistCategory(
    val title: String,
    val items: List<ChecklistItem>
)

data class ChecklistItem(
    val id: String,
    val label: String
)

private val defaultChecklistCategories = listOf(
    ChecklistCategory(
        title = "Unidad Evaporadora (Interior)",
        items = listOf(
            ChecklistItem("evap_desarmado", "Desarmado de cubiertas externas para lavado profundo."),
            ChecklistItem("evap_desincrustante", "Aplicación de desincrustante químico biodegradable."),
            ChecklistItem("evap_lavado_alta_presion", "Limpieza a alta presión de turbina y filtros."),
            ChecklistItem("evap_charola_drenajes", "Lavado de charola de condensados y desobstrucción de drenajes."),
            ChecklistItem("evap_tabletas_cloro", "Colocación de tabletas de cloro de disolución lenta.")
        )
    ),
    ChecklistCategory(
        title = "Unidad Condensadora (Exterior)",
        items = listOf(
            ChecklistItem("cond_hidrolavado", "Retiro de suciedad ambiental mediante hidrolavado a presión."),
            ChecklistItem("cond_peinado_aletas", "Peinado manual de aletas de aluminio dañadas."),
            ChecklistItem("cond_soportes", "Revisión de soportes metálicos y anclajes antivibración."),
            ChecklistItem("cond_inspeccion_acustica", "Inspección acústica y de vibración del compresor.")
        )
    ),
    ChecklistCategory(
        title = "Diagnóstico Eléctrico y Operativo",
        items = listOf(
            ChecklistItem("elec_medicion_voltaje", "Medición de voltaje de línea y consumo de corriente."),
            ChecklistItem("elec_capacitores", "Verificación de estado de capacitores de marcha y contactores."),
            ChecklistItem("elec_ajuste_mecanico", "Ajuste mecánico y reapriete de terminales eléctricas."),
            ChecklistItem("elec_presiones_gas", "Monitoreo de presiones de gas refrigerante.")
        )
    ),
    ChecklistCategory(
        title = "Reporte Digital y Gestión de Activos",
        items = listOf(
            ChecklistItem("rep_identificacion", "Identificación única de cada equipo en base de datos."),
            ChecklistItem("rep_fotografico", "Registro fotográfico (antes y después del servicio)."),
            ChecklistItem("rep_acceso_nube", "Acceso inmediato a la nube de reportes para conformidad.")
        )
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VisitaDetailView(
    visita: VisitaMantenimientoEntity,
    onSave: (VisitaMantenimientoEntity) -> Unit
) {
    val st = visita.estado.lowercase()
    val isProgramado = st.contains("programad") && !st.contains("no programad")
    val isEditable = !isProgramado

    var notas by remember { mutableStateOf(visita.notasVisita) }

    // Parse initial checklist
    val checklistMap = remember {
        mutableStateMapOf<String, Boolean>().apply {
            try {
                val json = JSONObject(visita.checklistDataJson)
                json.keys().forEach { key ->
                    put(key, json.optBoolean(key, false))
                }
            } catch (e: Exception) {
                // empty map if invalid
            }
        }
    }

    // Parse initial photos
    val fotosList = remember {
        mutableStateListOf<String>().apply {
            try {
                val array = JSONArray(visita.evidenciaFotosJson)
                for (i in 0 until array.length()) {
                    add(array.getString(i))
                }
            } catch (e: Exception) {
                // empty if invalid
            }
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (isEditable) {
            uris.forEach { uri ->
                fotosList.add(uri.toString())
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(16.dp)
    ) {
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Info Card
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .alpha(if (isProgramado) 0.65f else 1.0f)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "VISITA #${visita.numeroVisita}",
                                color = GoldAccent,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                modifier = Modifier
                                    .background(GoldAccent.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            )

                            val estatusLabel = when {
                                st == "completada" -> "COMPLETADA"
                                isProgramado -> "PROGRAMADO"
                                else -> "EN PROCESO"
                            }

                            val estatusColor = when {
                                st == "completada" -> EmeraldGreen
                                isProgramado -> ProgramadoGrey
                                else -> GoldAccent
                            }

                            Text(
                                estatusLabel,
                                color = estatusColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .background(estatusColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Fecha Programada: ${visita.fechaProgramada}", color = TextCream, fontSize = 13.sp)

                        if (isProgramado) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(ProgramadoGrey.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                    .padding(10.dp)
                            ) {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = ProgramadoGrey, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Estatus Programado: Se puede visualizar pero no se puede ejecutar ni editar.",
                                    color = TextCream,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }

            // Checklist Operativo
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .alpha(if (isProgramado) 0.65f else 1.0f)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = if (isProgramado) ProgramadoGrey else GoldAccent)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Checklist Operativo de Mantenimiento", color = TextCream, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        defaultChecklistCategories.forEach { category ->
                            Text(
                                category.title.uppercase(),
                                color = if (isProgramado) ProgramadoGrey else GoldAccent,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                            )

                            category.items.forEach { item ->
                                val isChecked = checklistMap[item.id] ?: false
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable(enabled = isEditable) { checklistMap[item.id] = !isChecked }
                                        .padding(vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Checkbox(
                                        checked = isChecked,
                                        enabled = isEditable,
                                        onCheckedChange = { if (isEditable) checklistMap[item.id] = it },
                                        colors = CheckboxDefaults.colors(
                                            checkedColor = GoldAccent,
                                            uncheckedColor = TextMuted,
                                            checkmarkColor = DarkBg,
                                            disabledCheckedColor = ProgramadoGrey,
                                            disabledUncheckedColor = ProgramadoGrey.copy(alpha = 0.5f)
                                        )
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(item.label, color = if (isChecked) TextCream else TextMuted, fontSize = 12.sp)
                                }
                            }
                            HorizontalDivider(color = Color(0xFF334155), thickness = 0.5.dp, modifier = Modifier.padding(vertical = 4.dp))
                        }
                    }
                }
            }

            // Observaciones del Técnico
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .alpha(if (isProgramado) 0.65f else 1.0f)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Observaciones / Trabajos Realizados", color = TextCream, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = notas,
                            enabled = isEditable,
                            readOnly = !isEditable,
                            onValueChange = { if (isEditable) notas = it },
                            modifier = Modifier.fillMaxWidth().height(140.dp),
                            placeholder = { Text(if (isEditable) "Describe los trabajos ejecutados..." else "Solo lectura en estatus Programado.", color = TextMuted, fontSize = 12.sp) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = DarkBg,
                                unfocusedContainerColor = DarkBg,
                                disabledContainerColor = DarkBg.copy(alpha = 0.5f),
                                focusedTextColor = TextCream,
                                unfocusedTextColor = TextCream,
                                disabledTextColor = TextMuted,
                                focusedBorderColor = GoldAccent,
                                unfocusedBorderColor = Color(0xFF334155),
                                disabledBorderColor = Color(0xFF334155).copy(alpha = 0.5f)
                            )
                        )
                    }
                }
            }

            // Evidencia Fotográfica
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .alpha(if (isProgramado) 0.65f else 1.0f)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Evidencia Fotográfica (${fotosList.size})", color = TextCream, fontSize = 14.sp, fontWeight = FontWeight.Bold)

                            if (isEditable) {
                                Button(
                                    onClick = { galleryLauncher.launch("image/*") },
                                    colors = ButtonDefaults.buttonColors(containerColor = GoldAccent.copy(alpha = 0.2f)),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Default.AddAPhoto, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Adjuntar Fotos", color = GoldAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        if (fotosList.isEmpty()) {
                            Text("No se han adjuntado fotografías de evidencia.", color = TextMuted, fontSize = 12.sp)
                        } else {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(fotosList) { fotoUrl ->
                                    Box(
                                        modifier = Modifier
                                            .size(90.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(DarkBg)
                                    ) {
                                        AsyncImage(
                                            model = fotoUrl,
                                            contentDescription = "Evidencia foto",
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )

                                        if (isEditable) {
                                            IconButton(
                                                onClick = { fotosList.remove(fotoUrl) },
                                                modifier = Modifier
                                                    .size(24.dp)
                                                    .align(Alignment.TopEnd)
                                                    .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                                            ) {
                                                Icon(Icons.Default.Close, contentDescription = "Eliminar", tint = Color.White, modifier = Modifier.size(14.dp))
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

        Spacer(modifier = Modifier.height(16.dp))

        // Save Button / Read Only Banner
        if (isEditable) {
            Button(
                onClick = {
                    val jsonChecklist = JSONObject()
                    checklistMap.forEach { (k, v) -> jsonChecklist.put(k, v) }

                    val arrayFotos = JSONArray()
                    fotosList.forEach { arrayFotos.put(it) }

                    val updated = visita.copy(
                        notasVisita = notas,
                        checklistDataJson = jsonChecklist.toString(),
                        evidenciaFotosJson = arrayFotos.toString(),
                        estado = "completada",
                        syncStatus = "PENDING"
                    )
                    onSave(updated)
                },
                colors = ButtonDefaults.buttonColors(containerColor = GoldAccent),
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Check, contentDescription = null, tint = DarkBg)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Guardar y Completar Visita", color = DarkBg, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        } else {
            Button(
                onClick = {},
                enabled = false,
                colors = ButtonDefaults.buttonColors(disabledContainerColor = ProgramadoGrey.copy(alpha = 0.3f)),
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Lock, contentDescription = null, tint = TextMuted)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Visita Programada (No Ejecutable)", color = TextMuted, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }
    }
}
