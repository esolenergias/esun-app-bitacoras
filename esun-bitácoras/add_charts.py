import codecs

path = r"C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt"

with codecs.open(path, "r", "utf-8") as f:
    content = f.read()

charts_component = """
@Composable
fun ProjectStatusCharts(
    totalBudget: Double,
    totalExecuted: Double,
    physicalProgress: Double
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        val finProgress = if (totalBudget > 0) (totalExecuted / totalBudget) else 0.0
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Avance Físico", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SlateDeep, modifier = Modifier.width(130.dp))
            LinearProgressIndicator(
                progress = { (physicalProgress / 100.0).toFloat().coerceIn(0f, 1f) },
                modifier = Modifier.weight(1f).height(10.dp).clip(RoundedCornerShape(100.dp)),
                color = SuccessGreen,
                trackColor = LightGrayBg
            )
            Text("${"%.1f".format(physicalProgress)}%", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SuccessGreen, modifier = Modifier.padding(start = 12.dp).width(50.dp))
        }
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Gasto Devengado", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SlateDeep, modifier = Modifier.width(130.dp))
            LinearProgressIndicator(
                progress = { finProgress.toFloat().coerceIn(0f, 1f) },
                modifier = Modifier.weight(1f).height(10.dp).clip(RoundedCornerShape(100.dp)),
                color = if (finProgress > 1.0) WarningRed else ConnectedBlue,
                trackColor = LightGrayBg
            )
            Text("${"%.1f".format(finProgress * 100)}%", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = if (finProgress > 1.0) WarningRed else ConnectedBlue, modifier = Modifier.padding(start = 12.dp).width(50.dp))
        }
    }
}
"""

content = content + "\n" + charts_component

target_general = """                LedgerRow("Total Registros Diarios:", "${bitacoras.size} reportes", OnSurfaceVariant)
            }
            
            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)"""

replace_general = """                LedgerRow("Total Registros Diarios:", "${bitacoras.size} reportes", OnSurfaceVariant)
            }
            
            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
            
            Text("Gráficas Generales", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
            ProjectStatusCharts(totalProjectBudget, totalCostExecuted, overallPhysicalProgress)
            
            HorizontalDivider(color = SubtleOutline, thickness = 1.dp)"""

content = content.replace(target_general, replace_general)

target_project = """                        LedgerRow("Avance Físico:", "${"%.1f".format(overallPhysicalProgress)}%", ConnectedBlue)
                    }
                    
                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)"""

replace_project = """                        LedgerRow("Avance Físico:", "${"%.1f".format(overallPhysicalProgress)}%", ConnectedBlue)
                    }
                    
                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                    
                    Text("Gráficas del Proyecto", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                    ProjectStatusCharts(totalProjectBudget, totalCostExecuted, overallPhysicalProgress)
                    
                    HorizontalDivider(color = SubtleOutline, thickness = 1.dp)"""

content = content.replace(target_project, replace_project)

with codecs.open(path, "w", "utf-8") as f:
    f.write(content)

print("Done")
