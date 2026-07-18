package com.example.ui.screens


import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment

import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.CustomCredential
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch
import com.example.BuildConfig
import android.widget.Toast
import android.util.Log
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(viewModel: BitacoraViewModel) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var isLoginMode by remember { mutableStateOf(true) }

    // Form inputs
    var nameInput by remember { mutableStateOf("") }
    var emailInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf("Trabajador") } // "Master", "Supervisor", "Trabajador"
    var showPassword by remember { mutableStateOf(false) }

    // Dialog state for Google Sign In Setup
    var showGoogleDialog by remember { mutableStateOf(false) }
    var googleEmail by remember { mutableStateOf("") }
    var googleName by remember { mutableStateOf("") }
    var googleRole by remember { mutableStateOf("Trabajador") }

    // Loading indicator
    var isLoading by remember { mutableStateOf(false) }

    val gradientBackground = Brush.verticalGradient(
        colors = listOf(
            SlateBg,
            LightGrayBg
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(gradientBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(scrollState)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            // Logo Header
            Image(
                painter = painterResource(id = R.drawable.logo_esunbitacora),
                contentDescription = "Logo Esun Bitacora",
                modifier = Modifier.size(80.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Esun Bitacora",
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                color = SlateDeep,
                letterSpacing = 1.5.sp
            )

            Text(
                text = "Gestión de bitacoras de obra",
                fontSize = 12.sp,
                color = OnSurfaceVariant,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Form container
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(BorderStroke(1.dp, SubtleOutline), RoundedCornerShape(24.dp)),
                colors = CardDefaults.cardColors(containerColor = PureWhite)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = if (isLoginMode) "INICIAR SESIÓN" else "REGISTRARSE",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = SlateDeep,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Toggle Tabs
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                            .background(LightGrayBg, RoundedCornerShape(12.dp))
                            .padding(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .background(
                                    if (isLoginMode) PureWhite else Color.Transparent,
                                    RoundedCornerShape(8.dp)
                                )
                                .border(
                                    BorderStroke(1.dp, if (isLoginMode) SubtleOutline else Color.Transparent),
                                    RoundedCornerShape(8.dp)
                                )
                                .clickable { isLoginMode = true },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Entrar",
                                color = if (isLoginMode) ConnectedBlue else OnSurfaceVariant,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .background(
                                    if (!isLoginMode) PureWhite else Color.Transparent,
                                    RoundedCornerShape(8.dp)
                                )
                                .border(
                                    BorderStroke(1.dp, if (!isLoginMode) SubtleOutline else Color.Transparent),
                                    RoundedCornerShape(8.dp)
                                )
                                .clickable { isLoginMode = false },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Registrarse",
                                color = if (!isLoginMode) ConnectedBlue else OnSurfaceVariant,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Fields
                    if (!isLoginMode) {
                        OutlinedTextField(
                            value = nameInput,
                            onValueChange = { nameInput = it },
                            label = { Text("Nombre Completo") },
                            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = ConnectedBlue) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = lightTextFieldColors(),
                            singleLine = true
                        )
                    }

                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        label = { Text("Correo Electrónico") },
                        leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = ConnectedBlue) },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        colors = lightTextFieldColors(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = passwordInput,
                        onValueChange = { passwordInput = it },
                        label = { Text("Contraseña") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = ConnectedBlue) },
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = null,
                                    tint = OnSurfaceVariant
                                )
                            }
                        },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = lightTextFieldColors(),
                        singleLine = true
                    )

                    // Role selection (ONLY in Registration Mode)
                    if (!isLoginMode) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "SELECCIONE SU ROL",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = ConnectedBlue,
                                letterSpacing = 1.sp
                            )
                            
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                listOf("Master", "Supervisor", "Trabajador").forEach { role ->
                                    val isSel = selectedRole == role
                                    val chipColor = if (isSel) ConnectedBlue else LightGrayBg
                                    val textCol = if (isSel) PureWhite else OnSurfaceVariant
                                    val borderCol = if (isSel) ConnectedBlue else SubtleOutline

                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(40.dp)
                                            .background(chipColor, RoundedCornerShape(10.dp))
                                            .border(BorderStroke(1.dp, borderCol), RoundedCornerShape(10.dp))
                                            .clickable { selectedRole = role }
                                            .padding(horizontal = 4.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = role,
                                            fontWeight = FontWeight.Black,
                                            fontSize = 12.sp,
                                            color = textCol
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Submit Button
                    Button(
                        onClick = {
                            if (emailInput.isBlank() || passwordInput.isBlank() || (!isLoginMode && nameInput.isBlank())) {
                                Toast.makeText(context, "Por favor llena todos los campos.", Toast.LENGTH_SHORT).show()
                                return@Button
                            }

                            coroutineScope.launch {
                                isLoading = true
                                delay(800) // Aesthetic delay for sync feeling

                                if (isLoginMode) {
                                    viewModel.loginWithEmail(emailInput.trim(), passwordInput) { success, msg ->
                                        isLoading = false
                                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                    }
                                } else {
                                    viewModel.registerWithEmail(nameInput.trim(), emailInput.trim(), passwordInput, selectedRole) { success, msg ->
                                        isLoading = false
                                        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                    }
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ConnectedBlue),
                        shape = RoundedCornerShape(12.dp),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = PureWhite, modifier = Modifier.size(24.dp), strokeWidth = 2.5.dp)
                        } else {
                            Text(
                                text = if (isLoginMode) "INGRESAR" else "CREAR CUENTA",
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp,
                                color = PureWhite
                            )
                        }
                    }

                    // Google Login Option
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        HorizontalDivider(modifier = Modifier.weight(1f), color = SubtleOutline)
                        Text(
                            "O accede con",
                            fontSize = 11.sp,
                            color = OnSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 8.dp),
                            fontWeight = FontWeight.Medium
                        )
                        HorizontalDivider(modifier = Modifier.weight(1f), color = SubtleOutline)
                    }

                    Button(
                        onClick = { launchGoogleSignIn(context, coroutineScope, viewModel) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = LightGrayBg),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, SubtleOutline)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Simple colorful google G icon recreation using text or simple shapes
                            Box(
                                modifier = Modifier
                                    .size(18.dp)
                                    .background(PureWhite, RoundedCornerShape(4.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("G", fontWeight = FontWeight.Black, fontSize = 12.sp, color = ConnectedBlue)
                            }
                            Text("Iniciar con Google", fontWeight = FontWeight.Bold, color = SlateDeep, fontSize = 13.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            var showDiagnostics by remember { mutableStateOf(false) }

            OutlinedButton(
                onClick = { showDiagnostics = !showDiagnostics },
                modifier = Modifier.fillMaxWidth(0.9f),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = ConnectedBlue),
                border = BorderStroke(1.dp, ConnectedBlue.copy(alpha = 0.5f))
            ) {
                Icon(
                    imageVector = if (showDiagnostics) Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    modifier = Modifier.padding(end = 4.dp)
                )
                Text(
                    text = if (showDiagnostics) "Ocultar Diagnóstico Técnico" else "Ver Diagnóstico Técnico (SHA-1 / Package)",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            if (showDiagnostics) {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(BorderStroke(1.dp, SubtleOutline.copy(alpha = 0.8f)), RoundedCornerShape(12.dp)),
                    colors = CardDefaults.cardColors(containerColor = LightGrayBg.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "DIAGNÓSTICO DE CREDENCIALES (OAuth)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SlateDeep
                        )

                        HorizontalDivider(color = SubtleOutline.copy(alpha = 0.5f))

                        Text(
                            text = "Si obtienes DEVELOPER_ERROR, debes asegurarte de que exista una credencial de tipo 'Android' en tu consola de Google Cloud con estos datos EXACTOS:",
                            fontSize = 11.sp,
                            color = OnSurfaceVariant
                        )

                        // Package Name
                        Column {
                            Text("Nombre del Paquete (Package Name):", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                            Text(
                                text = context.packageName,
                                fontSize = 11.sp,
                                color = ConnectedBlue,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier
                                    .background(PureWhite, RoundedCornerShape(4.dp))
                                    .padding(6.dp)
                                    .fillMaxWidth()
                            )
                        }

                        // Calculated SHA-1
                        val calculatedSha1 = remember { getAppSignatureSHA1(context) }
                        Column {
                            Text("Firma SHA-1 de esta App instalada:", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                            Text(
                                text = calculatedSha1,
                                fontSize = 11.sp,
                                color = ConnectedBlue,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier
                                    .background(PureWhite, RoundedCornerShape(4.dp))
                                    .padding(6.dp)
                                    .fillMaxWidth()
                            )
                        }

                        // Web Client ID
                        Column {
                            Text("ID de Cliente Web (Web Client ID) configurado:", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = SlateDeep)
                            Text(
                                text = BuildConfig.GOOGLE_WEB_CLIENT_ID.ifBlank { "(No configurado)" },
                                fontSize = 10.sp,
                                color = Color.Gray,
                                modifier = Modifier
                                    .background(PureWhite, RoundedCornerShape(4.dp))
                                    .padding(6.dp)
                                    .fillMaxWidth()
                            )
                        }

                        Text(
                            text = "Nota: Al estar usando Supabase, NO necesitas configurar Firebase. Simplemente habilita el proveedor Google en tu panel de Supabase y copia allí el ID y Secreto de tu ID de Cliente Web.",
                            fontSize = 10.sp,
                            color = OnSurfaceVariant,
                            style = androidx.compose.ui.text.TextStyle(fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Help info
            Text(
                text = "Acceso seguro con cifrado Supabase TLS & políticas RLS (Row Level Security) aplicadas al instante por rol.",
                fontSize = 11.sp,
                color = OnSurfaceVariant.copy(alpha = 0.8f),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
@Composable
fun darkTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = ConnectedBlue,
    unfocusedBorderColor = Color(0xFF2D3C65),
    focusedLabelColor = ConnectedBlue,
    unfocusedLabelColor = OnSurfaceVariant,
    focusedTextColor = PureWhite,
    unfocusedTextColor = PureWhite,
    focusedContainerColor = Color(0xFF10162A),
    unfocusedContainerColor = Color(0xFF10162A)
)

@Composable
fun lightTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = ConnectedBlue,
    unfocusedBorderColor = SubtleOutline,
    focusedLabelColor = ConnectedBlue,
    unfocusedLabelColor = OnSurfaceVariant,
    focusedTextColor = Color.Black,
    unfocusedTextColor = Color.Black,
    focusedContainerColor = PureWhite,
    unfocusedContainerColor = LightGrayBg
)


fun launchGoogleSignIn(context: android.content.Context, coroutineScope: kotlinx.coroutines.CoroutineScope, viewModel: BitacoraViewModel) {
    val clientId = BuildConfig.GOOGLE_WEB_CLIENT_ID
    if (clientId.isBlank() || clientId.contains("mock-client-id")) {
        Toast.makeText(
            context,
            "Error: GOOGLE_WEB_CLIENT_ID no configurado en los Secrets de AI Studio.",
            Toast.LENGTH_LONG
        ).show()
        Log.e("AuthScreen", "Google Sign In failed: GOOGLE_WEB_CLIENT_ID is blank or mock.")
        return
    }

    val credentialManager = CredentialManager.create(context)
    val googleIdOption = GetGoogleIdOption.Builder()
        .setFilterByAuthorizedAccounts(false)
        .setServerClientId(clientId)
        .setAutoSelectEnabled(true)
        .build()

    val request = GetCredentialRequest.Builder()
        .addCredentialOption(googleIdOption)
        .build()

    coroutineScope.launch {
        try {
            val result = credentialManager.getCredential(context, request)
            val credential = result.credential
            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val email = googleIdTokenCredential.id
                val name = googleIdTokenCredential.displayName ?: "Usuario Google"
                
                // Login via Google
                viewModel.loginWithGoogle(email, name, "Supervisor") { success, msg ->
                    if (!success) {
                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("AuthScreen", "Google Sign In Error", e)
            val errMsg = e.message ?: ""
            if (errMsg.contains("DEVELOPER_ERROR") || errMsg.contains("16") || e is androidx.credentials.exceptions.GetCredentialException) {
                Toast.makeText(
                    context, 
                    "Error de configuración (DEVELOPER_ERROR): Asegúrate de registrar el SHA-1 (34:25:1B:1F:CB:71:94:AF:4F:B4:B8:25:F0:E3:0F:6F:69:53:18:CE) y el paquete (com.aistudio.esunbitacora.vypnzx) en tu consola de Google Cloud.", 
                    Toast.LENGTH_LONG
                ).show()
            } else {
                Toast.makeText(context, "Error al iniciar sesión: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }
    }
}

fun getAppSignatureSHA1(context: android.content.Context): String {
    try {
        val packageInfo = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            context.packageManager.getPackageInfo(
                context.packageName,
                android.content.pm.PackageManager.GET_SIGNING_CERTIFICATES
            )
        } else {
            @Suppress("DEPRECATION")
            context.packageManager.getPackageInfo(
                context.packageName,
                android.content.pm.PackageManager.GET_SIGNATURES
            )
        }
        
        val signatures = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            packageInfo.signingInfo?.apkContentsSigners
        } else {
            @Suppress("DEPRECATION")
            packageInfo.signatures
        }
        
        if (signatures != null && signatures.isNotEmpty()) {
            val md = java.security.MessageDigest.getInstance("SHA-1")
            val publicKey = md.digest(signatures[0].toByteArray())
            val hexString = StringBuilder()
            for (i in publicKey.indices) {
                val appendString = Integer.toHexString(0xFF and publicKey[i].toInt())
                if (appendString.length == 1) hexString.append("0")
                hexString.append(appendString.uppercase(java.util.Locale.US))
                if (i < publicKey.size - 1) hexString.append(":")
            }
            return hexString.toString()
        }
    } catch (e: Exception) {
        Log.e("Signature", "Error getting signature", e)
    }
    return "Error al obtener firma"
}
