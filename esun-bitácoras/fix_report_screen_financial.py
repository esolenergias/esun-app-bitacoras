import sys
import re

file_path = r'app/src/main/java/com/example/ui/screens/ReportScreen.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for includeFinancialData
state_regex = re.compile(r'    var isGeneratingPdf by remember \{ mutableStateOf\(false\) \}')
new_state = '''    var isGeneratingPdf by remember { mutableStateOf(false) }
    var includeFinancialData by remember { mutableStateOf(true) }'''
content = state_regex.sub(new_state, content)

# 2. Add Switch before Generate PDF button
button_regex = re.compile(r'                // Premium Generate PDF Button\n                Button\(')
new_button = '''                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Incluir reporte financiero", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = SlateDeep)
                        Text(text = "Ocultar si es solo avance de obra", fontSize = 11.sp, color = OnSurfaceVariant)
                    }
                    androidx.compose.material3.Switch(
                        checked = includeFinancialData,
                        onCheckedChange = { includeFinancialData = it },
                        colors = androidx.compose.material3.SwitchDefaults.colors(
                            checkedThumbColor = PureWhite,
                            checkedTrackColor = ConnectedBlue
                        )
                    )
                }
                
                // Premium Generate PDF Button
                Button('''
content = button_regex.sub(new_button, content)

# 3. Pass includeFinancialData to generatePdfReport call
old_pdf_call = '''                            val file = withContext(Dispatchers.IO) {
                                generatePdfReport(context, fileName, activeProjectName, userName, supervisorName, bitacoras, budgetItems, totalProjectBudget, totalCostExecuted, overallPhysicalProgress)
                            }'''
new_pdf_call = '''                            val file = withContext(Dispatchers.IO) {
                                generatePdfReport(context, fileName, activeProjectName, userName, supervisorName, bitacoras, budgetItems, totalProjectBudget, totalCostExecuted, overallPhysicalProgress, includeFinancialData)
                            }'''
content = content.replace(old_pdf_call, new_pdf_call)

# 4. Update generatePdfReport definition and implementation
def_regex = re.compile(r'    physicalProgress: Double\n\): java\.io\.File\? \{')
new_def = '''    physicalProgress: Double,
    includeFinancialData: Boolean
): java.io.File? {'''
content = def_regex.sub(new_def, content)

# 5. Update generatePdfReport to respect includeFinancialData
old_metrics = '''        val wCard = (pageWidth - margin * 2 - 30f) / 4
        val metrics = listOf("AVANCE" to "${"%.1f".format(physicalProgress)}%", "PRESUPUESTO" to "\\$${String.format("%,.0f", totalBudget)}", "GASTO" to "\\$${String.format("%,.0f", totalExecuted)}", "REMANENTE" to "\\$${String.format("%,.0f", totalBudget - totalExecuted)}")
        metrics.forEachIndexed { i, m ->
            val cx = margin + i * (wCard + 10f)
            canvas.drawRoundRect(android.graphics.RectF(cx, y, cx + wCard, y + 40f), 4f, 4f, paintCard)
            canvas.drawText(m.first, cx + 10f, y + 15f, paintLabel)
            canvas.drawText(m.second, cx + 10f, y + 30f, paintValue)
        }'''
new_metrics = '''        val metrics = if (includeFinancialData) {
            listOf("AVANCE" to "${"%.1f".format(physicalProgress)}%", "PRESUPUESTO" to "\\$${String.format("%,.0f", totalBudget)}", "GASTO" to "\\$${String.format("%,.0f", totalExecuted)}", "REMANENTE" to "\\$${String.format("%,.0f", totalBudget - totalExecuted)}")
        } else {
            listOf("AVANCE" to "${"%.1f".format(physicalProgress)}%")
        }
        val wCard = (pageWidth - margin * 2 - ((metrics.size - 1) * 10f)) / metrics.size
        
        metrics.forEachIndexed { i, m ->
            val cx = margin + i * (wCard + 10f)
            canvas.drawRoundRect(android.graphics.RectF(cx, y, cx + wCard, y + 40f), 4f, 4f, paintCard)
            canvas.drawText(m.first, cx + 10f, y + 15f, paintLabel)
            canvas.drawText(m.second, cx + 10f, y + 30f, paintValue)
        }'''
content = content.replace(old_metrics, new_metrics)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
