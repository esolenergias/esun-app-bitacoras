package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.database.CrewMemberEntity
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel
import com.example.ui.viewmodel.PushNotification
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrewScreen(viewModel: BitacoraViewModel) {
    val crewList by viewModel.crewMembers.collectAsState()
    val notifications by viewModel.pushNotifications.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    var newMemberName by remember { mutableStateOf("") }
    var newMemberRole by remember { mutableStateOf("Instalador Solar") }

    val roleOptions = listOf(
        "Instalador Solar",
        "Oficial Electricista",
        "Cabo de Campo",
        "Ing. Residente",
        "Ayudante General"
    )
    var showRoleDropdown by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBg)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // --- 1. REGISTER ENTRY FOR NEW WORKER ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = PureWhite)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "REGISTRAR ENTRADA DE TRABAJADOR",
                    fontWeight = FontWeight.Black,
                    fontSize = 11.sp,
                    color = ConnectedBlue,
                    letterSpacing = 0.5.sp
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = newMemberName,
                        onValueChange = { newMemberName = it },
                        placeholder = { Text("Nombre Completo", color = OnSurfaceVariant, fontSize = 13.sp) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ConnectedBlue,
                            unfocusedBorderColor = SubtleOutline,
                            focusedTextColor = Color.Black,
                            unfocusedTextColor = Color.Black,
                            focusedContainerColor = SlateBg,
                            unfocusedContainerColor = SlateBg
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1.3f),
                        textStyle = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    )

                    // Role Selection Trigger
                    Box(
                        modifier = Modifier
                            .weight(1.1f)
                            .height(50.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(SlateBg)
                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(8.dp))
                            .clickable { showRoleDropdown = true }
                            .padding(horizontal = 10.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = newMemberRole,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = SlateDeep
                            )
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = OnSurfaceVariant)
                        }

                        DropdownMenu(
                            expanded = showRoleDropdown,
                            onDismissRequest = { showRoleDropdown = false },
                            modifier = Modifier.background(PureWhite)
                        ) {
                            roleOptions.forEach { role ->
                                DropdownMenuItem(
                                    text = { Text(role, fontWeight = FontWeight.Bold, color = SlateDeep, fontSize = 12.sp) },
                                    onClick = {
                                        newMemberRole = role
                                        showRoleDropdown = false
                                    }
                                )
                            }
                        }
                    }

                    // Add icon button
                    IconButton(
                        onClick = {
                            if (newMemberName.isNotBlank()) {
                                viewModel.addNewCrewMember(newMemberName, newMemberRole)
                                newMemberName = ""
                            }
                        },
                        modifier = Modifier
                            .size(50.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(SolarAmber)
                            .border(BorderStroke(1.dp, SolarAmber), RoundedCornerShape(8.dp))
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Añadir", tint = SlateDeep)
                    }
                }
            }
        }

        // --- 2. LIVE TELEMETRY LOG (PUSH NOTIFICATION QUEUE) ---
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Default.NotificationsActive, contentDescription = null, tint = Color(0xFFEA580C), modifier = Modifier.size(18.dp))
                Text(
                    text = "SEGUIMIENTO EN VIVO DE CUADRILLAS (TELEMETRÍA PUSH)",
                    fontWeight = FontWeight.Black,
                    fontSize = 11.sp,
                    color = SlateDeep,
                    letterSpacing = 0.5.sp
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp)
                    .background(Color(0xFF0F172A), RoundedCornerShape(12.dp))
                    .padding(10.dp)
            ) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(notifications.asReversed()) { notif ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Text(
                                text = "[${notif.timeLabel}]",
                                color = SolarAmber,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "• ${notif.title}: ${notif.body}",
                                color = if (notif.title.contains("Salida") || notif.title.contains("Error")) WarningRed else SuccessGreen,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // --- 3. ACTIVE SQUAD LIST ROSTER ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.People, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(20.dp))
                Text(
                    text = "CUADRILLA ACTIVA EN CAMPO",
                    fontWeight = FontWeight.Black,
                    fontSize = 12.sp,
                    color = SlateDeep,
                    letterSpacing = 0.5.sp
                )
            }
            Box(
                modifier = Modifier
                    .background(SuccessGreenBg, RoundedCornerShape(100.dp))
                    .border(BorderStroke(1.dp, Color(0xFFD1FAE5)), RoundedCornerShape(100.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "${crewList.size} ACTIVOS",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    color = SuccessGreen
                )
            }
        }

        if (crewList.isEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = PureWhite)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "No hay trabajadores registrados en la cuadrilla hoy.",
                        fontWeight = FontWeight.Bold,
                        color = OnSurfaceVariant,
                        fontSize = 13.sp
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(crewList) { member ->
                    CrewMemberRow(
                        member = member,
                        onDelete = {
                            viewModel.removeCrewMember(member)
                            viewModel.simulatePushNotification(
                                title = "Salida de Trabajador",
                                body = "${member.name} (${member.role}) retirado del frente de obra.",
                                type = "CREW"
                            )
                        },
                        onToggleStatus = {
                            val nextStatus = if (member.status == "Activo") "Descanso ☕" else "Activo"
                            coroutineScope.launch {
                                viewModel.updateCrewMember(member.copy(status = nextStatus))
                                viewModel.simulatePushNotification(
                                    title = "Cambio de Estado",
                                    body = "${member.name} cambió su estado a: $nextStatus.",
                                    type = "CREW"
                                )
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun CrewMemberRow(
    member: CrewMemberEntity,
    onDelete: () -> Unit,
    onToggleStatus: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = PureWhite)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = member.name,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = SlateDeep
                )
                Text(
                    text = member.role,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = OnSurfaceVariant
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Status Toggle Badge
                val isActive = member.status == "Activo"
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isActive) SuccessGreenBg else LightGrayBg)
                        .border(
                            BorderStroke(
                                1.dp,
                                if (isActive) Color(0xFFD1FAE5) else SubtleOutline
                            ),
                            RoundedCornerShape(8.dp)
                        )
                        .clickable { onToggleStatus() }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = member.status,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = if (isActive) Color(0xFF047857) else OnSurfaceVariant
                    )
                }

                // Delete crew worker icon button
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier
                        .size(36.dp)
                        .background(LightGrayBg, RoundedCornerShape(8.dp))
                        .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(8.dp))
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Retirar", tint = WarningRed, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}
