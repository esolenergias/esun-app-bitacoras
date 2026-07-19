import sys

file_path = r'C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\screens\ReportScreen.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = 'data class MonthChartData'

if target in content:
    index = content.find(target)
    content = content[:index] + """data class MonthChartData(val label: String, val budgetPercent: Float, val realPercent: Float)

@Composable
fun LedgerRow(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(text = label, fontWeight = FontWeight.Bold, color = OnSurfaceVariant, fontSize = 13.sp)
        Text(text = value, fontWeight = FontWeight.Black, color = color, fontSize = 14.sp)
    }
}

@Composable
fun CuadrillaTelemetryCard(title: String, desc: String, time: String, icon: androidx.compose.ui.graphics.vector.ImageVector, iconColor: androidx.compose.ui.graphics.Color, bgColor: androidx.compose.ui.graphics.Color) {
    Row(modifier = Modifier.fillMaxWidth().background(PureWhite, RoundedCornerShape(12.dp)).border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp)).padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
        Box(modifier = Modifier.size(36.dp).background(bgColor, RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
            Icon(imageVector = icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(18.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SlateDeep, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = time, fontWeight = FontWeight.Bold, fontSize = 9.sp, color = OnSurfaceVariant)
            }
            Text(text = desc, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = OnSurfaceVariant, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
        }
    }
}

@Composable
fun ReportHistoryItem(
    id: String,
    type: String,
    date: String,
    author: String,
    status: String,
    onDelete: (() -> Unit)? = null,
    onDownload: () -> Unit,
    onShare: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(PureWhite, RoundedCornerShape(12.dp))
            .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(text = id, fontWeight = FontWeight.Black, color = OnSurfaceVariant, fontSize = 11.sp)
                Text(text = type, fontWeight = FontWeight.ExtraBold, color = SlateDeep, fontSize = 13.sp)
            }
            Text(text = "Fecha: $date  •  Por: $author", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = OnSurfaceVariant)
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .background(
                        if (status == "DISPONIBLE") SuccessGreenBg else LightGrayBg,
                        RoundedCornerShape(100.dp)
                    )
                    .border(
                        BorderStroke(1.dp, if (status == "DISPONIBLE") androidx.compose.ui.graphics.Color(0xFFD1FAE5) else SubtleOutline),
                        RoundedCornerShape(100.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = status,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Black,
                    color = if (status == "DISPONIBLE") androidx.compose.ui.graphics.Color(0xFF047857) else OnSurfaceVariant
                )
            }

            IconButton(
                onClick = onDownload,
                modifier = Modifier
                    .size(36.dp)
                    .background(LightGrayBg, RoundedCornerShape(100.dp))
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(100.dp))
            ) {
                Icon(
                    imageVector = Icons.Default.Visibility,
                    contentDescription = "Ver PDF",
                    tint = ConnectedBlue,
                    modifier = Modifier.size(16.dp)
                )
            }
            IconButton(
                onClick = onShare,
                modifier = Modifier
                    .size(36.dp)
                    .background(SuccessGreenBg, RoundedCornerShape(100.dp))
                    .border(BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFD1FAE5)), RoundedCornerShape(100.dp))
            ) {
                Icon(
                    imageVector = Icons.Default.CloudUpload,
                    contentDescription = "Backup en Drive",
                    tint = androidx.compose.ui.graphics.Color(0xFF047857),
                    modifier = Modifier.size(16.dp)
                )
            }
            if (onDelete != null) {
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier
                        .size(36.dp)
                        .background(androidx.compose.ui.graphics.Color(0xFFFEE2E2), RoundedCornerShape(100.dp))
                        .border(BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFFECACA)), RoundedCornerShape(100.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Eliminar Reporte",
                        tint = androidx.compose.ui.graphics.Color(0xFFDC2626),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
