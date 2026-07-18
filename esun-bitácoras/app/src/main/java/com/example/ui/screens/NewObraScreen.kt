package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewObraScreen(
    viewModel: BitacoraViewModel,
    onNavigateBack: () -> Unit
) {
    val scrollState = rememberScrollState()
    
    var nombreObra by remember { mutableStateOf("") }
    var cliente by remember { mutableStateOf("") }
    var ubicacion by remember { mutableStateOf("") }
    var fechaInicio by remember { mutableStateOf("") }
    var fechaTermino by remember { mutableStateOf("") }
    var montoContrato by remember { mutableStateOf("") }
    var residente by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().background(SlateBg)) {
        // Sticky Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onNavigateBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Regresar", tint = SlateDeep)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Nueva Obra / Proyecto", fontWeight = FontWeight.Black, fontSize = 18.sp, color = SlateDeep)
        }
        
        HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = nombreObra,
                onValueChange = { nombreObra = it },
                label = { Text("Nombre de la Obra") },
                modifier = Modifier.fillMaxWidth(),
                colors = outlinedTextFieldColors()
            )
            OutlinedTextField(
                value = cliente,
                onValueChange = { cliente = it },
                label = { Text("Cliente / Contratante") },
                modifier = Modifier.fillMaxWidth(),
                colors = outlinedTextFieldColors()
            )
            OutlinedTextField(
                value = ubicacion,
                onValueChange = { ubicacion = it },
                label = { Text("Ubicación / Dirección") },
                modifier = Modifier.fillMaxWidth(),
                colors = outlinedTextFieldColors()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = fechaInicio,
                    onValueChange = { fechaInicio = it },
                    label = { Text("Fecha de Inicio") },
                    modifier = Modifier.weight(1f),
                    colors = outlinedTextFieldColors()
                )
                OutlinedTextField(
                    value = fechaTermino,
                    onValueChange = { fechaTermino = it },
                    label = { Text("Fecha Estimada de Término") },
                    modifier = Modifier.weight(1f),
                    colors = outlinedTextFieldColors()
                )
            }
            OutlinedTextField(
                value = montoContrato,
                onValueChange = { montoContrato = it },
                label = { Text("Monto del Contrato / Presupuesto") },
                modifier = Modifier.fillMaxWidth(),
                colors = outlinedTextFieldColors()
            )
            OutlinedTextField(
                value = residente,
                onValueChange = { residente = it },
                label = { Text("Residente de Obra / Responsable") },
                modifier = Modifier.fillMaxWidth(),
                colors = outlinedTextFieldColors()
            )
            OutlinedTextField(
                value = descripcion,
                onValueChange = { descripcion = it },
                label = { Text("Descripción General") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                colors = outlinedTextFieldColors()
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Button(
                onClick = {
                    if (nombreObra.isNotBlank()) {
                        viewModel.saveProjectDetails(
                            projectName = nombreObra,
                            cliente = cliente,
                            ubicacion = ubicacion,
                            inicio = fechaInicio,
                            termino = fechaTermino,
                            residente = residente,
                            montoContrato = montoContrato,
                            descripcion = descripcion
                        )
                    }
                    onNavigateBack()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue)
            ) {
                Icon(Icons.Default.Save, contentDescription = null, tint = PureWhite)
                Spacer(modifier = Modifier.width(12.dp))
                Text("CREAR PROYECTO", fontWeight = FontWeight.Black, fontSize = 16.sp, color = PureWhite)
            }
            
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}
