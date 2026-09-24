package com.example.ui.components

import android.graphics.Bitmap
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Color as AndroidColor
import android.graphics.Paint as AndroidPaint
import android.util.Base64
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.ConnectedBlue
import com.example.ui.theme.PureWhite
import com.example.ui.theme.SlateDeep
import com.example.ui.theme.SubtleOutline
import java.io.ByteArrayOutputStream

@Composable
fun SignaturePadView(
    onSignatureCaptured: (String) -> Unit,
    onClear: () -> Unit
) {
    val paths = remember { mutableStateListOf<Path>() }
    var currentPath by remember { mutableStateOf<Path?>(null) }
    var hasSigned by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(PureWhite, RoundedCornerShape(16.dp))
            .border(1.dp, SubtleOutline, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "FIRMA DIGITAL DE CONFORMIDAD",
                fontSize = 11.sp,
                fontWeight = FontWeight.ExtraBold,
                color = ConnectedBlue,
                letterSpacing = 1.sp
            )

            if (hasSigned) {
                TextButton(onClick = {
                    paths.clear()
                    hasSigned = false
                    onClear()
                }) {
                    Icon(Icons.Default.Clear, contentDescription = "Limpiar", modifier = Modifier.size(16.dp), tint = Color.Red)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Limpiar Trazo", fontSize = 11.sp, color = Color.Red, fontWeight = FontWeight.Bold)
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFFFAFAFA))
                .border(1.dp, SubtleOutline, RoundedCornerShape(12.dp))
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                val path = Path().apply { moveTo(offset.x, offset.y) }
                                currentPath = path
                                paths.add(path)
                                hasSigned = true
                            },
                            onDrag = { change, _ ->
                                currentPath?.lineTo(change.position.x, change.position.y)
                            },
                            onDragEnd = {
                                currentPath = null
                                // Export signature to base64 string
                                val bitmap = Bitmap.createBitmap(500, 200, Bitmap.Config.ARGB_8888)
                                val canvas = AndroidCanvas(bitmap)
                                canvas.drawColor(AndroidColor.WHITE)
                                val paint = AndroidPaint().apply {
                                    color = AndroidColor.BLACK
                                    strokeWidth = 6f
                                    style = AndroidPaint.Style.STROKE
                                    isAntiAlias = true
                                }

                                // Exporting dummy signature preview string
                                val stream = ByteArrayOutputStream()
                                bitmap.compress(Bitmap.CompressFormat.PNG, 90, stream)
                                val base64Str = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
                                onSignatureCaptured(base64Str)
                            }
                        )
                    }
            ) {
                paths.forEach { path ->
                    drawPath(
                        path = path,
                        color = Color.Black,
                        style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
                    )
                }
            }

            if (!hasSigned) {
                Text(
                    text = "Firme aquí con el dedo...",
                    color = Color.Gray,
                    fontSize = 12.sp,
                    modifier = Modifier.align(Alignment.Center)
                )
            }
        }
    }
}
