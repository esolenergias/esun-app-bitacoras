import codecs

path = r"C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\NewBitacoraScreen.kt"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

imports = """import android.app.DatePickerDialog
import android.app.TimePickerDialog
import java.util.Calendar
import androidx.compose.ui.platform.LocalContext
"""
content = content.replace("import android.widget.Toast", "import android.widget.Toast\n" + imports)

hook_state = "val userName by viewModel.userName.collectAsState()"
replace_state = """val userName by viewModel.userName.collectAsState()
    val userRole by viewModel.userRole.collectAsState()
    val context = LocalContext.current
    var selectedCustomDate by remember { mutableStateOf<String?>(null) }"""
content = content.replace(hook_state, replace_state)

target_ui = """                        Column(modifier = Modifier.weight(1f)) {
                            Text("Quién Reporta", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                            Text(userName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                        }"""

replace_ui = """                        Column(modifier = Modifier.weight(1f)) {
                            Text("Quién Reporta", fontSize = 10.sp, color = OnSurfaceVariant, fontWeight = FontWeight.Bold)
                            Text(userName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                            if (userRole.equals("Master", ignoreCase = true)) {
                                Text(
                                    text = if (selectedCustomDate != null) "Fecha: $selectedCustomDate" else "Ajustar Fecha/Hora",
                                    fontSize = 11.sp,
                                    color = ConnectedBlue,
                                    modifier = Modifier
                                        .padding(top = 4.dp)
                                        .clickable {
                                            val c = Calendar.getInstance()
                                            DatePickerDialog(context, { _, y, m, d ->
                                                TimePickerDialog(context, { _, h, min ->
                                                    val formattedDate = String.format("%04d-%02d-%02d %02d:%02d", y, m + 1, d, h, min)
                                                    selectedCustomDate = formattedDate
                                                    viewModel.setCustomReportDate(formattedDate)
                                                }, c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE), true).show()
                                            }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show()
                                        }
                                )
                            }
                        }"""

content = content.replace(target_ui, replace_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("UI Patched")
