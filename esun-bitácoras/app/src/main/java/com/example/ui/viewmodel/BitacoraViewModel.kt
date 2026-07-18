package com.example.ui.viewmodel

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.net.Uri
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.database.BitacoraEntity
import com.example.data.database.BudgetItemEntity
import com.example.data.database.CrewMemberEntity
import com.example.data.database.MatrixItemEntity
import com.example.data.database.ObraEntity
import com.example.data.database.TaskEntity
import com.example.data.repository.SyncRepository
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class BitacoraViewModel(private val repository: SyncRepository, private val context: Context) : ViewModel() {

    // --- User Profile State (SharedPreferences) ---
    private val prefs = context.getSharedPreferences("user_profile", Context.MODE_PRIVATE)
    private val _isLoggedIn = MutableStateFlow(prefs.getBoolean("is_logged_in", false))
    val isLoggedIn = _isLoggedIn.asStateFlow()

    private val _userEmail = MutableStateFlow(prefs.getString("user_email", "") ?: "")
    val userEmail = _userEmail.asStateFlow()

    private val _userName = MutableStateFlow(prefs.getString("user_name", "") ?: "")
    val userName = _userName.asStateFlow()

    private val _userRole = MutableStateFlow(prefs.getString("user_role", "Trabajador") ?: "Trabajador")
    val userRole = _userRole.asStateFlow() // "Master", "Supervisor", "Trabajador"

    private val _supervisorName = MutableStateFlow(prefs.getString("supervisor_name", "") ?: "")
    val supervisorName = _supervisorName.asStateFlow()

    private val _projectsList = MutableStateFlow<List<Pair<String, String>>>(emptyList())
    val projectsList = _projectsList.asStateFlow()

    init {
        // Observa obras desde Room y presupuestos desde budget_items
        viewModelScope.launch {
            repository.getDistinctObrasFlow().collect { budgetObras ->
                // Combinar obras de Room con las que vienen de budget_items
                val roomObras = repository.getAllObras().stateIn(
                    viewModelScope,
                    SharingStarted.WhileSubscribed(5000),
                    emptyList()
                ).value.map { it.nombre to it.status }

                val budgetObrasList = budgetObras.map { it to "En proceso" }
                val merged = (roomObras + budgetObrasList).distinctBy { it.first }
                _projectsList.value = merged
            }
        }
        // También escuchar cambios en la tabla obras directamente
        viewModelScope.launch {
            repository.getAllObras().collect { obras ->
                val budgetObraNames = _projectsList.value.map { it.first }.toSet()
                val roomObrasList = obras.map { it.nombre to it.status }
                val currentBudgetObras = _projectsList.value.filter { it.first in budgetObraNames && obras.none { o -> o.nombre == it.first } }
                val merged = (roomObrasList + currentBudgetObras).distinctBy { it.first }
                _projectsList.value = merged
            }
        }
    }

    fun updateProfile(user: String, supervisor: String) {
        _userName.value = user
        _supervisorName.value = supervisor
        prefs.edit().putString("user_name", user).putString("supervisor_name", supervisor).apply()
    }

    fun saveProjectDetails(projectName: String, cliente: String, ubicacion: String, inicio: String, termino: String, residente: String, montoContrato: String = "", descripcion: String = "") {
        // Agregar a lista en memoria si no existe
        val current = _projectsList.value.toMutableList()
        if (current.none { it.first == projectName }) {
            current.add(0, projectName to "Recién Creada")
            _projectsList.value = current
        }

        // Persistir en Room
        viewModelScope.launch {
            repository.saveObra(
                ObraEntity(
                    nombre = projectName,
                    cliente = cliente,
                    ubicacion = ubicacion,
                    fechaInicio = inicio,
                    fechaTermino = termino,
                    residente = residente,
                    descripcion = descripcion,
                    montoContrato = montoContrato,
                    status = "En proceso"
                )
            )
        }

        // Persistir detalles en SharedPreferences también (retrocompatibilidad)
        prefs.edit()
            .putString("proj_${projectName}_cliente", cliente)
            .putString("proj_${projectName}_ubicacion", ubicacion)
            .putString("proj_${projectName}_inicio", inicio)
            .putString("proj_${projectName}_termino", termino)
            .putString("proj_${projectName}_residente", residente)
            .putString("proj_${projectName}_monto", montoContrato)
            .putString("proj_${projectName}_descripcion", descripcion)
            .apply()
    }

    fun getProjectDetails(projectName: String): Map<String, String> {
        return mapOf(
            "cliente" to (prefs.getString("proj_${projectName}_cliente", "Gobierno del Estado") ?: "Gobierno del Estado"),
            "ubicacion" to (prefs.getString("proj_${projectName}_ubicacion", "Hermosillo, Sonora") ?: "Hermosillo, Sonora"),
            "inicio" to (prefs.getString("proj_${projectName}_inicio", "15/01/2026") ?: "15/01/2026"),
            "termino" to (prefs.getString("proj_${projectName}_termino", "30/11/2026") ?: "30/11/2026"),
            "residente" to (prefs.getString("proj_${projectName}_residente", "Ing. Roberto Martínez") ?: "Ing. Roberto Martínez"),
            "monto" to (prefs.getString("proj_${projectName}_monto", "") ?: ""),
            "descripcion" to (prefs.getString("proj_${projectName}_descripcion", "") ?: "")
        )
    }

    // --- Authentication Actions ---
    fun loginWithEmail(email: String, password: String, onResult: (Boolean, String) -> Unit) {
        val hashedPassword = hashPassword(password)
        val registered = prefs.getStringSet("registered_users", emptySet()) ?: emptySet()
        val userStr = registered.find { it.startsWith("$email:") }
        if (userStr != null) {
            val parts = userStr.split(":")
            if (parts.size >= 4 && parts[1] == hashedPassword) {
                val name = parts[2]
                val role = parts[3]
                
                // Store session
                prefs.edit()
                    .putBoolean("is_logged_in", true)
                    .putString("user_email", email)
                    .putString("user_name", name)
                    .putString("user_role", role)
                    .apply()

                _isLoggedIn.value = true
                _userEmail.value = email
                _userName.value = name
                _userRole.value = role

                repository.addLog("Supabase Auth: Sesión iniciada con éxito para $email ($role)")
                onResult(true, "¡Bienvenido, $name!")
            } else {
                onResult(false, "Contraseña incorrecta.")
            }
        } else {
            onResult(false, "El usuario no está registrado.")
        }
    }

    fun registerWithEmail(name: String, email: String, password: String, role: String, onResult: (Boolean, String) -> Unit) {
        val hashedPassword = hashPassword(password)
        val registered = prefs.getStringSet("registered_users", emptySet())?.toMutableSet() ?: mutableSetOf()
        if (registered.any { it.startsWith("$email:") }) {
            onResult(false, "El correo electrónico ya está registrado.")
            return
        }

        val newUserStr = "$email:$hashedPassword:$name:$role"
        registered.add(newUserStr)
        prefs.edit().putStringSet("registered_users", registered).apply()

        // Sync with Supabase Auth Simulator logs
        repository.addLog("Supabase Auth: Registrando nuevo usuario en Supabase -> $email con rol: $role")
        repository.addLog("Supabase Auth: Vinculando políticas RLS para tabla 'bitacoras' y 'tasks'...")
        repository.addLog("Supabase Auth: ✅ Usuario creado exitosamente en Supabase. Credenciales vinculadas.")

        // Automatically log in
        prefs.edit()
            .putBoolean("is_logged_in", true)
            .putString("user_email", email)
            .putString("user_name", name)
            .putString("user_role", role)
            .apply()

        _isLoggedIn.value = true
        _userEmail.value = email
        _userName.value = name
        _userRole.value = role

        onResult(true, "¡Registro y login exitoso como $role!")
    }

    fun loginWithGoogle(email: String, name: String, role: String, onResult: (Boolean, String) -> Unit) {
        val registered = prefs.getStringSet("registered_users", emptySet())?.toMutableSet() ?: mutableSetOf()
        var finalRole = role
        // If user not already registered, register them automatically
        val existingUser = registered.find { it.startsWith("$email:") }
        if (existingUser == null) {
            val newUserStr = "$email:google_oauth_bypass:$name:$role"
            registered.add(newUserStr)
            prefs.edit().putStringSet("registered_users", registered).apply()
            repository.addLog("Supabase Auth (Google): Registrando nuevo usuario Oauth -> $email ($role)")
        } else {
            val parts = existingUser.split(":")
            if (parts.size >= 4) {
                finalRole = parts[3]
            }
            repository.addLog("Supabase Auth (Google): Sesión iniciada via Google Oauth para $email ($finalRole)")
        }

        prefs.edit()
            .putBoolean("is_logged_in", true)
            .putString("user_email", email)
            .putString("user_name", name)
            .putString("user_role", finalRole)
            .apply()

        _isLoggedIn.value = true
        _userEmail.value = email
        _userName.value = name
        _userRole.value = finalRole  // Fix: usar finalRole (el rol persistido) en vez del parámetro

        onResult(true, "¡Bienvenido, $name (Google)!")
    }

    fun logout() {
        prefs.edit()
            .putBoolean("is_logged_in", false)
            .putString("user_email", "")
            .putString("user_name", "")
            .putString("user_role", "Trabajador")
            .apply()

        _isLoggedIn.value = false
        _userEmail.value = ""
        _userName.value = ""
        _userRole.value = "Trabajador"
        repository.addLog("Supabase Auth: Sesión cerrada.")
    }

    // Streams from database
    val bitacorasList: StateFlow<List<BitacoraEntity>> = repository.getAllBitacoras()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val selectedObraId = MutableStateFlow<String>("")

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

    
    
    val allTasks: StateFlow<List<TaskEntity>> = repository.getAllTasks()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val tasks: StateFlow<List<TaskEntity>> = selectedObraId.flatMapLatest { id -> repository.getTasksForObra(id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun addTask(task: TaskEntity) {
        viewModelScope.launch { repository.addTask(task) }
    }

    fun updateTask(task: TaskEntity) {
        viewModelScope.launch { repository.updateTask(task) }
    }

    fun deleteTask(task: TaskEntity) {
        viewModelScope.launch { repository.deleteTask(task) }
    }

    val budgetItems: StateFlow<List<BudgetItemEntity>> = selectedObraId.flatMapLatest { id -> repository.getBudgetForObra(id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val crewMembers: StateFlow<List<CrewMemberEntity>> = repository.getAllCrew()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Stream from SyncRepository
    val syncStatus = repository.syncStatus

    // --- Geolocation State ---
    private val _currentLocation = MutableStateFlow<Location?>(null)
    val currentLocation: StateFlow<Location?> = _currentLocation.asStateFlow()

    private val _isAcquiringLocation = MutableStateFlow(false)
    val isAcquiringLocation: StateFlow<Boolean> = _isAcquiringLocation.asStateFlow()

    // --- Form States (New Daily Log) ---
    private val _siteName = MutableStateFlow("Planta Solar Esol Hermosillo")
    val siteName = _siteName.asStateFlow()

    private val _weather = MutableStateFlow("Soleado")
    val weather = _weather.asStateFlow()

    private val _crewCount = MutableStateFlow(12)
    val crewCount = _crewCount.asStateFlow()

    private val _description = MutableStateFlow("")
    val description = _description.asStateFlow()

    private val _physicalProgress = MutableStateFlow(0.0)
    val physicalProgress = _physicalProgress.asStateFlow()

    private val _financialProgress = MutableStateFlow(0.0)
    val financialProgress = _financialProgress.asStateFlow()

    private val _budgetEstimate = MutableStateFlow(0.0)
    val budgetEstimate = _budgetEstimate.asStateFlow()

    private val _capturedPhotoUri = MutableStateFlow<String?>(null)
    val capturedPhotoUri = _capturedPhotoUri.asStateFlow()

    private val _safetyRemarks = MutableStateFlow("")
    val safetyRemarks = _safetyRemarks.asStateFlow()

    private val _machinery = MutableStateFlow("")
    val machinery = _machinery.asStateFlow()

    // Real-time Push Notification Simulation Queue
    private val _pushNotifications = MutableStateFlow<List<PushNotification>>(emptyList())
    val pushNotifications: StateFlow<List<PushNotification>> = _pushNotifications.asStateFlow()

    init {
        // Mock a couple of real-time push notifications regarding crews to show active telemetry
        simulatePushNotification(
            title = "Inicio de Labores",
            body = "Cuadrilla Esol Electricistas reportó entrada en Planta Solar Hermosillo.",
            type = "CREW"
        )
    }

    // --- Form setters ---
    fun setSiteName(value: String) { _siteName.value = value }
    fun setWeather(value: String) { _weather.value = value }
    fun setCrewCount(value: Int) { _crewCount.value = value }
    fun setDescription(value: String) { _description.value = value }
    fun setPhysicalProgress(value: Double) { _physicalProgress.value = value }
    fun setFinancialProgress(value: Double) { _financialProgress.value = value }
    fun setBudgetEstimate(value: Double) { _budgetEstimate.value = value }
    fun setCapturedPhotoUri(uri: String?) { _capturedPhotoUri.value = uri }
    fun setSafetyRemarks(value: String) { _safetyRemarks.value = value }
    fun setMachinery(value: String) { _machinery.value = value }

    // --- Location Capturing ---
    @SuppressLint("MissingPermission")
    fun captureLocation() {
        viewModelScope.launch {
            _isAcquiringLocation.value = true
            try {
                val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(context)
                fusedLocationProvider.getCurrentLocation(
                    Priority.PRIORITY_HIGH_ACCURACY,
                    null
                ).addOnSuccessListener { location: Location? ->
                    _currentLocation.value = location
                    _isAcquiringLocation.value = false
                    if (location != null) {
                        Log.d("BitacoraViewModel", "Coordenadas obtenidas: ${location.latitude}, ${location.longitude}")
                    }
                }.addOnFailureListener {
                    _isAcquiringLocation.value = false
                }
            } catch (e: Exception) {
                _isAcquiringLocation.value = false
                Log.e("BitacoraViewModel", "Error al obtener GPS", e)
            }
        }
    }

    // --- Save Report Action ---
    fun submitDailyLog(onSuccess: () -> Unit) {
        viewModelScope.launch {
            val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val lat = _currentLocation.value?.latitude ?: 29.0892 // Fallback coordinates Hermosillo
            val lng = _currentLocation.value?.longitude ?: -110.9613

            val newLog = BitacoraEntity(
                siteName = _siteName.value,
                date = dateStr,
                weather = _weather.value,
                crewCount = _crewCount.value,
                description = _description.value.ifEmpty { "Reporte diario de avance de obra." },
                physicalProgress = _physicalProgress.value,
                financialProgress = _financialProgress.value,
                budgetEstimate = _budgetEstimate.value,
                latitude = lat,
                longitude = lng,
                photoUri = _capturedPhotoUri.value,
                safetyRemarks = _safetyRemarks.value,
                machinery = _machinery.value,
                isSynced = false // Force offline capture first!
            )

            repository.saveBitacora(newLog)

            // Trigger a push notification regarding the submission
            simulatePushNotification(
                title = "Reporte de Obra Registrado",
                body = "Bitácora guardada localmente para ${_siteName.value}. Lista para sincronización.",
                type = "SYNC"
            )

            // Reset form fields
            _description.value = ""
            _capturedPhotoUri.value = null
            _safetyRemarks.value = ""
            _machinery.value = ""
            _physicalProgress.value = 0.0

            onSuccess()
        }
    }

    // --- Database Operations for Crew ---
    fun addNewCrewMember(name: String, role: String) {
        viewModelScope.launch {
            val member = CrewMemberEntity(name = name, role = role, status = "Activo")
            repository.saveCrewMember(member)
            simulatePushNotification(
                title = "Nueva Incorporación",
                body = "$name ($role) ha sido añadido a la cuadrilla de campo.",
                type = "CREW"
            )
        }
    }

    fun removeCrewMember(member: CrewMemberEntity) {
        viewModelScope.launch {
            repository.deleteCrewMember(member)
        }
    }

    fun addBudgetItem(item: BudgetItemEntity) {
        viewModelScope.launch {
            repository.addBudgetItem(item)
        }
    }

    fun updateBudgetItem(item: BudgetItemEntity) {
        viewModelScope.launch {
            repository.updateBudgetItem(item)
        }
    }

    fun updateBitacora(bitacora: BitacoraEntity) {
        viewModelScope.launch {
            repository.updateBitacora(bitacora)
            repository.addLog("Supabase Sync: Reporte diario de ${bitacora.siteName} (${bitacora.date}) editado por supervisor/master en base de datos local y sincronizado con Supabase.")
        }
    }

    fun deleteBitacora(bitacora: BitacoraEntity) {
        viewModelScope.launch {
            repository.deleteBitacora(bitacora)
            repository.addLog("Supabase Sync: Reporte de ${bitacora.siteName} del ${bitacora.date} ELIMINADO por supervisor/master con RLS activado.")
        }
    }

    fun updateCrewMember(member: CrewMemberEntity) {
        viewModelScope.launch {
            repository.saveCrewMember(member)
        }
    }

    // --- Repository Triggers ---
    fun triggerManualSync() {
        viewModelScope.launch {
            val result = repository.syncPendingBitacoras()
            if (result) {
                simulatePushNotification(
                    title = "Sincronización Exitosa",
                    body = "Bitácoras pendientes cargadas a Google Drive, Sheets y ERP de EsolEnergias.",
                    type = "SYNC"
                )
            }
        }
    }

    fun triggerBudgetSync() {
        viewModelScope.launch {
            val result = repository.syncErpBudget()
            if (result) {
                simulatePushNotification(
                    title = "Presupuestos Sincronizados",
                    body = "El catálogo de conceptos e importes ha sido actualizado desde el ERP central.",
                    type = "ERP"
                )
            }
        }
    }

    fun getMatrixForConcept(conceptCode: String, obraId: String): Flow<List<MatrixItemEntity>> {
        return repository.getMatrixForConcept(conceptCode, obraId)
    }

    fun triggerSupabaseSync(url: String, key: String, onFinished: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            val result = repository.syncSupabaseData(url, key)
            if (result) {
                simulatePushNotification(
                    title = "Sincronización Supabase",
                    body = "Conceptos y matrices actualizados con éxito desde el cotizador de Supabase.",
                    type = "SYNC"
                )
            }
            onFinished(result)
        }
    }

    fun triggerProductionBudgetSync() {
        viewModelScope.launch {
            val url = syncStatus.value.supabaseUrl
            val key = syncStatus.value.supabaseKey
            
            if (url.isEmpty() || key.isEmpty() || !url.startsWith("http")) {
                simulatePushNotification(
                    title = "Error de Sincronización",
                    body = "URL o API Key de Supabase no configurados.",
                    type = "SYNC"
                )
                return@launch
            }
            
            val budgets = repository.syncProductionBudgetsSupabase(url, key)
            if (budgets != null && budgets.isNotEmpty()) {
                simulatePushNotification(
                    title = "Sincronización Supabase",
                    body = "Se sincronizaron ${budgets.size} presupuestos en producción.",
                    type = "SYNC"
                )
            } else {
                simulatePushNotification(
                    title = "Sincronización Supabase",
                    body = "No se encontraron presupuestos en producción o hubo un error.",
                    type = "SYNC"
                )
            }
        }
    }

    fun toggleOnline() {
        repository.toggleOnlineStatus()
    }

    fun toggleGoogleSheets() {
        repository.toggleGoogleSheetsConnection()
    }

    fun toggleGoogleDrive() {
        repository.toggleGoogleDriveConnection()
    }

    fun toggleGoogleCalendar() {
        repository.toggleGoogleCalendarConnection()
    }

    // --- Telemetry Push Notification Simulator ---
    fun simulatePushNotification(title: String, body: String, type: String) {
        val dateStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        val newNotification = PushNotification(
            id = System.currentTimeMillis().toString(),
            title = title,
            body = body,
            type = type,
            timeLabel = dateStr
        )
        val list = _pushNotifications.value.toMutableList()
        list.add(0, newNotification)
        _pushNotifications.value = list.take(15)
    }

    // --- Security Helpers ---
    /** Genera un hash SHA-256 hexadecimal del password para no almacenarlo en texto plano. */
    private fun hashPassword(password: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(password.toByteArray(Charsets.UTF_8))
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
}


data class PushNotification(
    val id: String,
    val title: String,
    val body: String,
    val type: String, // "CREW", "SYNC", "ERP", "ALERTA"
    val timeLabel: String
)

// Factory
class BitacoraViewModelFactory(
    private val repository: SyncRepository,
    private val context: Context
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(BitacoraViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return BitacoraViewModel(repository, context) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
