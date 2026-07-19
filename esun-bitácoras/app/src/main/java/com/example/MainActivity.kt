package com.example

import android.os.Bundle
import android.content.Context
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.example.data.repository.SyncRepository
import com.example.ui.screens.*
import com.example.ui.screens.ReportDetailScreen
import com.example.ui.theme.*
import com.example.ui.viewmodel.BitacoraViewModel
import com.example.ui.viewmodel.BitacoraViewModelFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val crashPrefs = getSharedPreferences("crash_reports", Context.MODE_PRIVATE)
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            val stackTraceString = android.util.Log.getStackTraceString(throwable)
            crashPrefs.edit().putString("last_crash", stackTraceString).commit()
            if (defaultHandler != null) {
                defaultHandler.uncaughtException(thread, throwable)
            } else {
                System.exit(1)
            }
        }

        val initialCrashLog = crashPrefs.getString("last_crash", null)
        if (initialCrashLog != null) {
            // Clear the persistent crash log immediately so that subsequent launches are clean.
            // If there's still a crash, it will trigger the exception handler and write it again.
            crashPrefs.edit().remove("last_crash").commit()
        }

        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {
                val context = LocalContext.current
                var crashLog by remember { mutableStateOf(initialCrashLog) }
                
                if (crashLog != null) {
                    CrashScreen(
                        crashLog = crashLog!!,
                        onReset = {
                            crashPrefs.edit().clear().commit()
                            context.getSharedPreferences("user_profile", Context.MODE_PRIVATE).edit().clear().commit()
                            try {
                                context.deleteDatabase("esol_bitacoras_db")
                            } catch (e: Exception) {
                                // ignore
                            }
                            crashLog = null
                            recreate()
                        }
                    )
                } else {
                    val repository = remember(context) { SyncRepository(context.applicationContext) }
                    val viewModelFactory = remember(repository, context) { BitacoraViewModelFactory(repository, context.applicationContext) }
                    val viewModel: BitacoraViewModel = viewModel(factory = viewModelFactory)
                    
                    MainAppContainer(viewModel)
                }
            }
        }
    }
}

@Composable
fun CrashScreen(crashLog: String, onReset: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A)) // SlateDeep
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(Color(0xFFFEF2F2), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = Color(0xFFEF4444),
                    modifier = Modifier.size(36.dp)
                )
            }
            
            Text(
                text = "¡ALGO SALIÓ MAL EN LA APP!",
                color = Color.White,
                fontWeight = FontWeight.Black,
                fontSize = 18.sp,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "La aplicación encontró un problema inesperado. A continuación se detallan los detalles técnicos para depuración:",
                color = Color(0xFF94A3B8),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
            
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                border = BorderStroke(1.dp, Color(0xFF334155))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    androidx.compose.foundation.text.selection.SelectionContainer {
                        Text(
                            text = crashLog,
                            color = Color(0xFFF1F5F9),
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                            fontSize = 10.sp
                        )
                    }
                }
            }
            
            Button(
                onClick = onReset,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = null)
                    Text(
                        text = "RESTABLECER DATOS Y REINICIAR",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}

@Composable
fun MainAppContainer(viewModel: BitacoraViewModel) {
    val navController = rememberNavController()
    val isLoggedIn by viewModel.isLoggedIn.collectAsState()

    if (!isLoggedIn) {
        AuthScreen(viewModel)
    } else {
        // Render Main App Structure
        AppScaffold(navController, viewModel)
    }
}

@Composable
fun AppScaffold(navController: NavHostController, viewModel: BitacoraViewModel) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: "dashboard"
    val baseRoute = currentRoute.substringBefore("/")
    val showBottomBar = baseRoute in listOf("dashboard", "bitacora", "reports", "settings")

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            if (showBottomBar) {
                Column {
                HorizontalDivider(color = SubtleOutline, thickness = 1.dp)
                NavigationBar(
                    modifier = Modifier.height(80.dp),
                    containerColor = PureWhite,
                    tonalElevation = 8.dp
                ) {
                    // Tab 1: Dashboard
                    NavigationBarItem(
                        selected = currentRoute == "dashboard",
                        onClick = { navController.navigate("dashboard") { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard", modifier = Modifier.size(26.dp)) },
                        label = { Text("Inicio", fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ConnectedBlue,
                            selectedTextColor = ConnectedBlue,
                            unselectedIconColor = OnSurfaceVariant,
                            unselectedTextColor = OnSurfaceVariant,
                            indicatorColor = Color(0xFFE2E7FF)
                        )
                    )

                    // Tab 2: Daily Log (Bitácora)
                    NavigationBarItem(
                        selected = currentRoute == "bitacora",
                        onClick = { navController.navigate("bitacora") { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.EventNote, contentDescription = "Bitácora", modifier = Modifier.size(26.dp)) },
                        label = { Text("Bitácora", fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ConnectedBlue,
                            selectedTextColor = ConnectedBlue,
                            unselectedIconColor = OnSurfaceVariant,
                            unselectedTextColor = OnSurfaceVariant,
                            indicatorColor = Color(0xFFE2E7FF)
                        )
                    )

                    val userRole by viewModel.userRole.collectAsState()

                    // Tab 5: Reports
                    if (userRole != "Trabajador") {
                        NavigationBarItem(
                            selected = currentRoute == "reports",
                            onClick = { navController.navigate("reports") { launchSingleTop = true } },
                            icon = { Icon(Icons.Default.PictureAsPdf, contentDescription = "Reportes", modifier = Modifier.size(26.dp)) },
                            label = { Text("Reportes", fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = ConnectedBlue,
                                selectedTextColor = ConnectedBlue,
                                unselectedIconColor = OnSurfaceVariant,
                                unselectedTextColor = OnSurfaceVariant,
                                indicatorColor = Color(0xFFE2E7FF)
                            )
                        )
                    }
                    // Tab 6: Settings
                    NavigationBarItem(
                        selected = currentRoute == "settings",
                        onClick = { navController.navigate("settings") { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Ajustes", modifier = Modifier.size(26.dp)) },
                        label = { Text("Ajustes", fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ConnectedBlue,
                            selectedTextColor = ConnectedBlue,
                            unselectedIconColor = OnSurfaceVariant,
                            unselectedTextColor = OnSurfaceVariant,
                            indicatorColor = Color(0xFFE2E7FF)
                        )
                    )
                }
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            NavHost(navController = navController, startDestination = "dashboard") {
                composable("dashboard") {
                    DashboardScreen(
                        viewModel = viewModel,
                        onNavigateToNewLog = { projectName ->
                            navController.navigate("new_bitacora/$projectName")
                        },
                        onNavigateToNewObra = {
                            navController.navigate("new_obra")
                        },
                        onNavigateToObraDashboard = { projectName ->
                            navController.navigate("obra_dashboard/$projectName")
                        },
                        onNavigateToReportDetail = { logId ->
                            navController.navigate("report_detail/$logId")
                        }
                    )
                }
                composable("bitacora") {
                    BitacoraScreen(
                        viewModel = viewModel, 
                        onNavigateToNewObra = {
                            navController.navigate("new_obra")
                        },
                        onNavigateToObraDashboard = { projectName ->
                            navController.navigate("obra_dashboard/$projectName")
                        },
                        onNavigateToReportDetail = { logId ->
                            navController.navigate("report_detail/$logId")
                        }
                    )
                }
                composable(
                    route = "obra_dashboard/{projectName}",
                    arguments = listOf(navArgument("projectName") { type = NavType.StringType })
                ) { backStackEntry ->
                    val projectName = backStackEntry.arguments?.getString("projectName") ?: ""
                    ObraDashboardScreen(
                        viewModel = viewModel,
                        projectName = projectName,
                        onNavigateBack = { navController.popBackStack() },
                        onNavigateToNewLog = { navController.navigate("new_bitacora/$projectName") },
                        onNavigateToReportsList = { navController.navigate("reports_list/$projectName") },
                        onNavigateToReportDetail = { logId -> navController.navigate("report_detail/$logId") }
                    )
                }
                composable(
                    route = "reports_list/{projectName}",
                    arguments = listOf(navArgument("projectName") { type = NavType.StringType })
                ) { backStackEntry ->
                    val projectName = backStackEntry.arguments?.getString("projectName") ?: ""
                    ReportsListScreen(
                        viewModel = viewModel,
                        projectName = projectName,
                        onNavigateBack = { navController.popBackStack() },
                        onNavigateToReportDetail = { logId ->
                            navController.navigate("report_detail/$logId")
                        }
                    )
                }
                composable(
                    route = "report_detail/{logId}",
                    arguments = listOf(navArgument("logId") { type = NavType.IntType })
                ) { backStackEntry ->
                    val logId = backStackEntry.arguments?.getInt("logId") ?: 0
                    ReportDetailScreen(
                        logId = logId,
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() }
                    )
                }
                composable("new_obra") {
                    NewObraScreen(viewModel = viewModel, onNavigateBack = {
                        navController.popBackStack()
                    })
                }
                composable(
                    route = "new_bitacora/{projectName}",
                    arguments = listOf(navArgument("projectName") { type = NavType.StringType })
                ) { backStackEntry ->
                    val projectName = backStackEntry.arguments?.getString("projectName") ?: ""
                    NewBitacoraScreen(
                        viewModel = viewModel,
                        projectName = projectName,
                        onNavigateToDashboard = {
                            navController.popBackStack()
                        }
                    )
                }
                composable("budget") {
                    BudgetScreen(viewModel = viewModel)
                }
                composable("crew") {
                    CrewScreen(viewModel = viewModel)
                }
                composable("reports") {
                    ReportScreen(viewModel = viewModel)
                }
                composable("settings") {
                    SettingsScreen(viewModel = viewModel)
                }
            }
        }
    }
}
