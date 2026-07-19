package com.example.ui.screens

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.ui.viewmodel.BitacoraViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportDetailScreen(
    logId: Int,
    viewModel: BitacoraViewModel,
    onBack: () -> Unit
) {
    val bitacora = viewModel.getBitacoraById(logId)
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Detalle de Reporte", color = Color(0xFFE2E2D5), fontWeight = FontWeight.Black) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = Color(0xFFD4AF37))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1E1E1E)
                )
            )
        },
        containerColor = Color(0xFF121212)
    ) { padding ->
        if (bitacora == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Reporte no encontrado", color = Color.White)
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Info
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = bitacora.siteName, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Fecha: ${bitacora.date}", color = Color.Gray, fontSize = 14.sp)
                    Text(text = "Clima: ${bitacora.weather}", color = Color.Gray, fontSize = 14.sp)
                    Text(text = "Cuadrilla: ${bitacora.crewCount} Personas", color = Color.Gray, fontSize = 14.sp)
                }
            }

            // Description
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Descripción de Actividades", color = Color(0xFFD4AF37), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = bitacora.description, color = Color.White, fontSize = 16.sp)
                }
            }

            // Concepto (if exists)
            if (!bitacora.concepto_name.isNullOrEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E2A3A)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Concepto Vinculado", color = Color(0xFF64B5F6), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = bitacora.concepto_name, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }

            // Progress
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Avance Físico", color = Color(0xFF64B5F6), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(text = "${bitacora.physicalProgress}%", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    }
                }
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Devengado", color = Color(0xFF81C784), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(text = "$${bitacora.financialProgress}", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    }
                }
            }

            // Image
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Evidencia Fotográfica", color = Color(0xFFD4AF37), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))
                    if (bitacora.photoUri != null) {
                        val driveRegex = "[?&]id=([^&]+)".toRegex()
                        val match = driveRegex.find(bitacora.photoUri)
                        val thumbUrl = if (match != null) {
                            "https://drive.google.com/thumbnail?id=${match.groupValues[1]}&sz=w1000"
                        } else {
                            bitacora.photoUri
                        }

                        AsyncImage(
                            model = thumbUrl,
                            contentDescription = "Evidencia fotográfica",
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(300.dp)
                                .clip(RoundedCornerShape(12.dp)),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .background(Color(0xFF2A2A2A), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.Image, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(48.dp))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Sin imagen adjunta", color = Color.Gray)
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
