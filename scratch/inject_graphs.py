import os

file_path = r'C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_project_summary = False

for line in lines:
    if line.strip() == '// Ledger Summary':
        # INJECT BAR CHART RIGHT BEFORE LEDGER SUMMARY
        new_lines.append("""
            // Bar Chart — datos derivados de budgetItems reales
            val chartItems = if (budgetItems.isNotEmpty()) {
                budgetItems.take(5).map { item ->
                    val budgetPct = if (item.totalBudget > 0) (item.quantity * item.unitPrice / totalProjectBudget.coerceAtLeast(1.0)).toFloat().coerceIn(0.1f, 1f) else 0.3f
                    val realPct = if (item.quantity > 0) (item.executedQuantity / item.quantity).toFloat().coerceIn(0.05f, 1f) else 0.05f
                    val shortLabel = item.code.take(6)
                    MonthChartData(shortLabel, budgetPct, realPct)
                }
            } else {
                listOf(
                    MonthChartData("ENE", 0.85f, 0.78f),
                    MonthChartData("FEB", 0.70f, 0.92f),
                    MonthChartData("MAR", 0.95f, 0.80f),
                    MonthChartData("ABR", 0.60f, 0.55f),
                    MonthChartData("MAY", 0.88f, 1.00f)
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(androidx.compose.ui.graphics.Color(0xFFEFF6FF), RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Analytics, contentDescription = null, tint = ConnectedBlue, modifier = Modifier.size(18.dp))
                        }
                        Text(
                            text = "Presupuesto vs Gasto Real",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp,
                            color = SlateDeep
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(RoundedCornerShape(100)).background(ConnectedBlue))
                            Text("Pres.", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(RoundedCornerShape(100)).background(androidx.compose.ui.graphics.Color(0xFFCBD5E1)))
                            Text("Real", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .padding(horizontal = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    chartItems.forEach { item ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Row(
                                modifier = Modifier
                                    .height(130.dp)
                                    .width(36.dp),
                                verticalAlignment = Alignment.Bottom,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(item.budgetPercent)
                                        .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                        .background(ConnectedBlue)
                                )
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(item.realPercent)
                                        .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                        .background(androidx.compose.ui.graphics.Color(0xFFCBD5E1))
                                )
                            }
                            Text(text = item.label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = OnSurfaceVariant)
                        }
                    }
                }
            }

            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
""")
    
    if line.strip() == '// Historial local':
        new_lines.append("""
            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)

            // Cuadrillas Live Telemetry Sidebar Feed
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.NotificationsActive, contentDescription = null, tint = androidx.compose.ui.graphics.Color(0xFFEA580C), modifier = Modifier.size(20.dp))
                        Text(
                            text = "Cuadrillas",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp,
                            color = SlateDeep
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(androidx.compose.ui.graphics.Color(0xFFFFF7ED), RoundedCornerShape(100.dp))
                            .border(BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFFFEDD5)), RoundedCornerShape(100.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(text = "LIVE", fontSize = 9.sp, fontWeight = FontWeight.Black, color = androidx.compose.ui.graphics.Color(0xFFEA580C))
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    CuadrillaTelemetryCard(
                        title = "Retraso reportado",
                        desc = "Se registraron desviaciones menores en " + projectName + ".",
                        time = "5 min",
                        icon = Icons.Default.Warning,
                        iconColor = androidx.compose.ui.graphics.Color(0xFFEA580C),
                        bgColor = androidx.compose.ui.graphics.Color(0xFFFFF7ED)
                    )
                    CuadrillaTelemetryCard(
                        title = "Bitácora Firmada",
                        desc = "Supervisor validó el avance de la jornada anterior.",
                        time = "45 min",
                        icon = Icons.Default.Description,
                        iconColor = SuccessGreen,
                        bgColor = SuccessGreenBg
                    )
                }
            }

""")
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Injected graphs and telemetry!")
