package com.example.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.viewmodel.BitacoraViewModel

// Colors
private val SlateDeep = Color(0xFF0F172A)
private val LightGrayBg = Color(0xFFF8FAFC)
private val SuccessGreen = Color(0xFF10B981)
private val ConnectedBlue = Color(0xFF3B82F6)
private val PureWhite = Color(0xFFFFFFFF)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ControlObrasScreen(viewModel: BitacoraViewModel, onNavigateBack: () -> Unit) {
    val bitacoras by viewModel.bitacorasList.collectAsState()
    val scrollState = rememberScrollState()

    // Group by siteName and get the latest
    val groupedObras = bitacoras.groupBy { it.siteName }.mapValues { entry ->
        entry.value.maxByOrNull { it.id } // Assume highest ID is latest for progress
    }.filterValues { it != null }.mapValues { it.value!! }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Control de Obras", fontWeight = FontWeight.Bold, color = SlateDeep) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Regresar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = LightGrayBg)
            )
        },
        containerColor = LightGrayBg
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (groupedObras.isEmpty()) {
                Text(
                    text = "No hay obras activas.",
                    fontSize = 16.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 20.dp)
                )
            } else {
                groupedObras.values.forEach { bitacora ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = PureWhite),
                        shape = RoundedCornerShape(16.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = bitacora.siteName,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                color = SlateDeep
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Última actividad: ${bitacora.date}",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = bitacora.description,
                                fontSize = 14.sp,
                                color = SlateDeep,
                                maxLines = 3,
                                overflow = TextOverflow.Ellipsis
                            )

                            Spacer(modifier = Modifier.height(16.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Físico
                                ProgressRing(
                                    progress = (bitacora.physicalProgress / 100).toFloat(),
                                    color = SuccessGreen,
                                    label = "Físico",
                                    valueText = "${bitacora.physicalProgress}%"
                                )
                                // Devengado (Financiero)
                                val budgetEstimate = bitacora.budgetEstimate.takeIf { it > 0 } ?: 1.0
                                val finProgress = (bitacora.financialProgress / budgetEstimate).coerceIn(0.0, 1.0).toFloat()
                                ProgressRing(
                                    progress = finProgress,
                                    color = ConnectedBlue,
                                    label = "Financiero",
                                    valueText = "$${bitacora.financialProgress}"
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ProgressRing(progress: Float, color: Color, label: String, valueText: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(80.dp)) {
            Canvas(modifier = Modifier.size(70.dp)) {
                drawArc(
                    color = color.copy(alpha = 0.2f),
                    startAngle = 0f,
                    sweepAngle = 360f,
                    useCenter = false,
                    style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                )
                drawArc(
                    color = color,
                    startAngle = -90f,
                    sweepAngle = progress * 360f,
                    useCenter = false,
                    style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                )
            }
            Text(
                text = valueText,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = SlateDeep
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.Gray
        )
    }
}
