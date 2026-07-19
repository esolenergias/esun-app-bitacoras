package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel

@Composable
fun SettingsScreen(viewModel: BitacoraViewModel) {
    var selectedTabIndex by remember { mutableStateOf(0) }
    val userRole by viewModel.userRole.collectAsState()
    val tabs = if (userRole == "Trabajador") {
        listOf("Configuración")
    } else {
        listOf("Configuración", "Personal")
    }

    Column(modifier = Modifier.fillMaxSize().background(LightGrayBg)) {
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = PureWhite,
            contentColor = ConnectedBlue,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = ConnectedBlue
                )
            }
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    selectedContentColor = ConnectedBlue,
                    unselectedContentColor = OnSurfaceVariant
                )
            }
        }

        Box(modifier = Modifier.weight(1f)) {
            when (selectedTabIndex) {
                0 -> GeneralSettingsTab(viewModel = viewModel)
                1 -> CrewScreen(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun GeneralSettingsTab(viewModel: BitacoraViewModel) {
    val scrollState = rememberScrollState()
    val syncStatus by viewModel.syncStatus.collectAsState()
    val userName by viewModel.userName.collectAsState()
    val userEmail by viewModel.userEmail.collectAsState()
    val userRole by viewModel.userRole.collectAsState()
    val supervisorName by viewModel.supervisorName.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 24.dp)
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Ajustes",
            fontWeight = FontWeight.Black,
            fontSize = 28.sp,
            color = SlateDeep
        )

        // REGISTRO DE USUARIO (PERFIL)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = PureWhite)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "PERFIL DE USUARIO (SUPABASE AUTH)",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = OnSurfaceVariant,
                    letterSpacing = 1.sp
                )
                
                var isEditingProfile by remember { mutableStateOf(false) }
                var editName by remember { mutableStateOf(userName) }
                var editEmail by remember { mutableStateOf(userEmail) }

                LaunchedEffect(userName, userEmail) {
                    editName = userName
                    editEmail = userEmail
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .background(Color(0xFFE2E7FF), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = ConnectedBlue,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        if (isEditingProfile) {
                            OutlinedTextField(
                                value = editName,
                                onValueChange = { editName = it },
                                label = { Text("Nombre") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = ConnectedBlue,
                                    unfocusedBorderColor = SubtleOutline,
                                    focusedContainerColor = PureWhite,
                                    unfocusedContainerColor = LightGrayBg,
                                    focusedTextColor = SlateDeep,
                                    unfocusedTextColor = SlateDeep
                                )
                            )
                            OutlinedTextField(
                                value = editEmail,
                                onValueChange = { editEmail = it },
                                label = { Text("Correo Electrónico") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = ConnectedBlue,
                                    unfocusedBorderColor = SubtleOutline,
                                    focusedContainerColor = PureWhite,
                                    unfocusedContainerColor = LightGrayBg,
                                    focusedTextColor = SlateDeep,
                                    unfocusedTextColor = SlateDeep
                                )
                            )
                            Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.End) {
                                TextButton(onClick = { isEditingProfile = false }) {
                                    Text("Cancelar")
                                }
                                Button(onClick = {
                                    viewModel.updateUser(editName, editEmail)
                                    isEditingProfile = false
                                }) {
                                    Text("Guardar")
                                }
                            }
                        } else {
                            Text(
                                text = userName,
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp,
                                color = SlateDeep
                            )
                            Text(
                                text = userEmail,
                                fontWeight = FontWeight.Medium,
                                fontSize = 12.sp,
                                color = OnSurfaceVariant
                            )
                            Text(
                                text = "Editar perfil",
                                fontSize = 12.sp,
                                color = ConnectedBlue,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .padding(top = 4.dp)
                                    .clickable { isEditingProfile = true }
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            tint = ConnectedBlue,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Rol activo: $userRole",
                            fontWeight = FontWeight.Black,
                            fontSize = 13.sp,
                            color = ConnectedBlue
                        )
                    }

                    Button(
                        onClick = { viewModel.logout() },
                        colors = ButtonDefaults.buttonColors(containerColor = WarningRedBg),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Logout,
                            contentDescription = null,
                            tint = WarningRed,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Salir",
                            fontWeight = FontWeight.Bold,
                            color = WarningRed,
                            fontSize = 11.sp
                        )
                    }
                }

                HorizontalDivider(color = SubtleOutline.copy(alpha = 0.5f), thickness = 1.dp)

                OutlinedTextField(
                    value = supervisorName,
                    onValueChange = { viewModel.updateProfile(userName, it) },
                    label = { Text("Supervisor Asignado") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = userRole == "Trabajador",
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ConnectedBlue,
                        unfocusedBorderColor = SubtleOutline,
                        focusedContainerColor = PureWhite,
                        unfocusedContainerColor = LightGrayBg,
                        focusedLabelColor = ConnectedBlue,
                        unfocusedLabelColor = OnSurfaceVariant
                    ),
                    singleLine = true
                )
                if (userRole == "Trabajador") {
                    Text(
                        text = "El supervisor asignado se rellena automáticamente cuando el supervisor lo añade a su cuadrilla.",
                        fontSize = 11.sp,
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                    )
                }
            }
        }

        // Offline Mode Switch
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = SlateDeep)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .background(PureWhite.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.WifiOff,
                                contentDescription = null,
                                tint = SolarAmber,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "Modo Offline Forzado",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 14.sp,
                                color = PureWhite
                            )
                            Text(
                                text = "Ahorro de batería en sitio remoto",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }
                    // Toggle Switch for force offline
                    Switch(
                        checked = !syncStatus.isOnline,
                        onCheckedChange = { viewModel.toggleOnline() },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = PureWhite,
                            checkedTrackColor = ConnectedBlue,
                            uncheckedThumbColor = Color(0xFF94A3B8),
                            uncheckedTrackColor = PureWhite.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        }

        if (userRole != "Trabajador") {

        }

        // Real-time Console Log Terminal Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp)),
            colors = CardDefaults.cardColors(containerColor = SlateDeep)
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "CONSOLA DE SINCRONIZACIÓN EN TIEMPO REAL",
                    fontWeight = FontWeight.Bold,
                    fontSize = 9.sp,
                    color = Color(0xFF64748B),
                    letterSpacing = 0.5.sp
                )
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(96.dp)
                        .background(Color(0xFF0F172A)),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (syncStatus.syncLog.isEmpty()) {
                        Text(
                            text = "> Consola inactiva. Modifique el avance de obra o registre un reporte.",
                            color = SolarAmber,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(4.dp)
                        )
                    } else {
                        syncStatus.syncLog.takeLast(4).forEach { logText ->
                            Text(
                                text = logText,
                                color = if (logText.contains("Error")) Color(0xFFF87171) else SuccessGreen,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(100.dp))
    }
}

@Composable
fun IntegrationItemSettings(
    label: String,
    isConnected: Boolean,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onToggle: () -> Unit
) {
    val bgColor = if (isConnected) color.copy(alpha = 0.1f) else PureWhite
    val borderColor = if (isConnected) color else SubtleOutline
    val contentColor = if (isConnected) color else OnSurfaceVariant

    Column(
        modifier = modifier
            .background(bgColor, RoundedCornerShape(12.dp))
            .border(BorderStroke(1.dp, borderColor), RoundedCornerShape(12.dp))
            .clickable { onToggle() }
            .padding(vertical = 12.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(icon, contentDescription = null, tint = contentColor, modifier = Modifier.size(24.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = contentColor,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            maxLines = 1
        )
    }
}
