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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.EventNote
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.data.database.TaskEntity
import com.example.ui.viewmodel.BitacoraViewModel

@Composable
fun BitacoraScreen(
    viewModel: BitacoraViewModel,
    onNavigateToNewObra: () -> Unit,
    onNavigateToObraDashboard: (String) -> Unit,
    onNavigateToReportDetail: (Int) -> Unit
) {
    var activeTab by remember { mutableStateOf(0) } // 0: Obras / Proyectos, 1: Reportes
    val scrollState = rememberScrollState()
    val userRole by viewModel.userRole.collectAsState()
    val mockObras by viewModel.projectsList.collectAsState()
    val tasks by viewModel.allTasks.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightGrayBg)
    ) {
        // Pestañas superiores: Obras / Proyectos vs Reportes
        TabRow(
            selectedTabIndex = activeTab,
            containerColor = PureWhite,
            contentColor = ConnectedBlue,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[activeTab]),
                    color = ConnectedBlue
                )
            }
        ) {
            Tab(
                selected = activeTab == 0,
                onClick = { activeTab = 0 },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Business, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Obras / Proyectos", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                },
                selectedContentColor = ConnectedBlue,
                unselectedContentColor = OnSurfaceVariant
            )

            Tab(
                selected = activeTab == 1,
                onClick = { activeTab = 1 },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.PictureAsPdf, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Reportes", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                },
                selectedContentColor = ConnectedBlue,
                unselectedContentColor = OnSurfaceVariant
            )
        }

        Box(modifier = Modifier.fillMaxSize().weight(1f)) {
            if (activeTab == 0) {
                Scaffold(
                    containerColor = LightGrayBg,
                    floatingActionButton = {
                        if (userRole == "Master" || userRole == "Supervisor") {
                            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                ExtendedFloatingActionButton(
                                    onClick = onNavigateToNewObra,
                                    containerColor = ConnectedBlue,
                                    contentColor = PureWhite,
                                    icon = { Icon(Icons.Default.Add, contentDescription = null) },
                                    text = { Text("Nueva Obra", fontWeight = FontWeight.Black) },
                                    shape = RoundedCornerShape(16.dp)
                                )
                                ExtendedFloatingActionButton(
                                    onClick = { viewModel.triggerProductionBudgetSync() },
                                    containerColor = ConnectedBlue,
                                    contentColor = PureWhite,
                                    icon = { Icon(Icons.Default.CloudSync, contentDescription = null) },
                                    text = { Text("Sincronizar", fontWeight = FontWeight.Black) },
                                    shape = RoundedCornerShape(16.dp)
                                )
                            }
                        } else if (userRole != "Trabajador") {
                            ExtendedFloatingActionButton(
                                onClick = onNavigateToNewObra,
                                containerColor = ConnectedBlue,
                                contentColor = PureWhite,
                                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                                text = { Text("Nueva Obra", fontWeight = FontWeight.Black) },
                                shape = RoundedCornerShape(16.dp)
                            )
                        }
                    },
                    floatingActionButtonPosition = FabPosition.Center
                ) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(LightGrayBg)
                            .padding(innerPadding)
                            .verticalScroll(scrollState)
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(24.dp)
                    ) {
                        Text(
                            text = "Obras / Proyectos",
                            fontWeight = FontWeight.Black,
                            fontSize = 28.sp,
                            color = SlateDeep
                        )

                        // Obras Activas
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(
                                text = "OBRAS ACTIVAS (${mockObras.size})",
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp,
                                color = SlateDeep
                            )

                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                mockObras.forEach { obra ->
                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp))
                                            .clickable { onNavigateToObraDashboard(obra.first) },
                                        colors = CardDefaults.cardColors(containerColor = PureWhite)
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(16.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(48.dp)
                                                        .background(LightGrayBg, RoundedCornerShape(12.dp)),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Icon(Icons.Default.Business, contentDescription = null, tint = ConnectedBlue)
                                                }
                                                Column {
                                                    Text(
                                                        text = obra.first,
                                                        fontWeight = FontWeight.Black,
                                                        fontSize = 15.sp,
                                                        color = SlateDeep
                                                    )
                                                    Text(
                                                        text = "Estado: ${obra.second}",
                                                        fontWeight = FontWeight.Medium,
                                                        fontSize = 12.sp,
                                                        color = OnSurfaceVariant
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Tareas
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(
                                text = "TAREAS A REALIZAR O REVISAR",
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp,
                                color = SlateDeep
                            )

                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(16.dp)),
                                colors = CardDefaults.cardColors(containerColor = PureWhite)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    tasks.forEachIndexed { index, task ->
                                        TaskTimelineItem(
                                            time = task.time,
                                            meridiem = task.meridiem,
                                            title = task.title,
                                            desc = task.desc,
                                            status = if (task.isCompleted) TaskStatus.COMPLETED else TaskStatus.PENDING,
                                            onToggle = { viewModel.updateTask(task.copy(isCompleted = !task.isCompleted)) }
                                        )
                                        if (index < tasks.size - 1) {
                                            Spacer(modifier = Modifier.height(16.dp))
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(80.dp))
                    }
                }
            } else {
                ReportScreen(viewModel = viewModel)
            }
        }
    }
}
