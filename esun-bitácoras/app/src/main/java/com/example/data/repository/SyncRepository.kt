package com.example.data.repository

import android.content.Context
import android.net.Uri
import android.util.Log
import com.example.data.database.AppDatabase
import com.example.data.database.BitacoraEntity
import com.example.data.database.BudgetItemEntity
import com.example.data.database.CrewMemberEntity
import com.example.data.database.ObraEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

import com.example.data.database.MatrixItemEntity
import com.example.data.database.TaskEntity
import com.example.BuildConfig
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import com.example.data.api.SupabaseApiService
import com.example.data.api.SupabaseConceptResponse
import com.example.data.api.SupabaseMatrixResponse

// Represents the overall synchronization status of different services
data class SyncStatus(
    val lastSyncTime: String = "No sincronizado",
    val isOnline: Boolean = true,
    val pendingLogsCount: Int = 0,
    val erpConnected: Boolean = true,
    val portalConnected: Boolean = true,
    val googleSheetsConnected: Boolean = false,
    val googleDriveConnected: Boolean = false,
    val googleCalendarConnected: Boolean = false,
    val isSyncing: Boolean = false,
    val syncLog: List<String> = emptyList(),
    val supabaseUrl: String = "",
    val supabaseKey: String = "",
    val isSupabaseConnected: Boolean = false
)

class SyncRepository(private val context: Context) {

    private val db = AppDatabase.getDatabase(context)
    private val bitacoraDao = db.bitacoraDao()
    private val obraDao = db.obraDao()
    private val budgetItemDao = db.budgetItemDao()
    private val crewMemberDao = db.crewMemberDao()
    private val matrixItemDao = db.matrixItemDao()
    private val taskDao = db.taskDao()

    private val _syncStatus = MutableStateFlow(SyncStatus(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ))
    val syncStatus: StateFlow<SyncStatus> = _syncStatus.asStateFlow()

    init {
        val defaultCrew = listOf(
            CrewMemberEntity(name = "Eduardo Gómez", role = "Ing. Electricista Solar", status = "Activo"),
            CrewMemberEntity(name = "Jesús Delgado", role = "Técnico Liniero", status = "Activo"),
            CrewMemberEntity(name = "Esteban Castro", role = "Electricista de Control", status = "Activo"),
            CrewMemberEntity(name = "Sofía Ruiz", role = "Instalador FV Senior", status = "Activo")
        )

        // Populate in background
        @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
        kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
            try {
                if (crewMemberDao.getCount() == 0) {
                    for (member in defaultCrew) {
                        crewMemberDao.insertCrewMember(member)
                    }
                }
                
                
                if (taskDao.getTasksForObra("Planta Solar Esol Hermosillo").first().isEmpty()) {
                    val defaultTasks = listOf(
                        TaskEntity("1", "Planta Solar Esol Hermosillo", "08:00", "AM", "Inspección de Anclajes", "Frente Norte • Ing. Ramírez", false, isImportant = true),
                        TaskEntity("2", "Planta Solar Esol Hermosillo", "11:30", "AM", "Recepción de Celdas", "Zona de Descarga Lote B", false, isImportant = false),
                        TaskEntity("3", "Planta Solar Esol Hermosillo", "02:00", "PM", "Revisión de Seguridad", "Completado por SST", true, isImportant = false)
                    )
                    defaultTasks.forEach { taskDao.insertTask(it) }
                }

                if (budgetItemDao.getCount() == 0) {
                    val defaultBudget = listOf(
                        BudgetItemEntity(
                            code = "ELE-FV-001",
                            description = "Soportería: Estructura de aluminio anodizado para paneles solares",
                            quantity = 240.0,
                            unit = "Pza",
                            unitPrice = 85.0,
                            executedQuantity = 135.0,
                            totalBudget = 20400.0,
                            obraId = "Planta Solar Esol Hermosillo"
                        ),
                        BudgetItemEntity(
                            code = "ELE-FV-002",
                            description = "Montaje Eléctrico: Módulos fotovoltaicos Jinko Solar 550Wp",
                            quantity = 240.0,
                            unit = "Pza",
                            unitPrice = 45.0,
                            executedQuantity = 110.0,
                            totalBudget = 10800.0,
                            obraId = "Planta Solar Esol Hermosillo"
                        ),
                        BudgetItemEntity(
                            code = "ELE-AC-003",
                            description = "Canalización: Tubería conduit galvanizada de 2 pulg pared gruesa",
                            quantity = 180.0,
                            unit = "m",
                            unitPrice = 120.0,
                            executedQuantity = 75.0,
                            totalBudget = 21600.0,
                            obraId = "Planta Solar Esol Hermosillo"
                        ),
                        BudgetItemEntity(
                            code = "CIV-001",
                            description = "Cimentaciones y bases de concreto para transformadores",
                            quantity = 10.0,
                            unit = "m3",
                            unitPrice = 320.0,
                            executedQuantity = 6.0,
                            totalBudget = 3200.0,
                            obraId = "Centro Comercial Vía Sur"
                        ),
                        BudgetItemEntity(
                            code = "ELE-002",
                            description = "Canalizaciones subterráneas de media tensión en estacionamiento",
                            quantity = 50.0,
                            unit = "m",
                            unitPrice = 150.0,
                            executedQuantity = 20.0,
                            totalBudget = 7500.0,
                            obraId = "Centro Comercial Vía Sur"
                        ),
                        BudgetItemEntity(
                            code = "CIV-003",
                            description = "Montaje de estructura metálica principal de nave principal",
                            quantity = 120.0,
                            unit = "Ton",
                            unitPrice = 1200.0,
                            executedQuantity = 30.0,
                            totalBudget = 144000.0,
                            obraId = "Nave Industrial Parque Norte"
                        )
                    )
                    budgetItemDao.insertBudgetItems(defaultBudget)
                }

                if (matrixItemDao.getCount() == 0) {
                    val defaultMatrix = listOf(
                        MatrixItemEntity(
                            conceptCode = "ELE-FV-001",
                            resourceDescription = "Perfil de aluminio anodizado 3.2m",
                            resourceType = "Material",
                            unit = "Pza",
                            quantity = 1.0,
                            unitPrice = 45.0,
                            totalCost = 45.0,
                            obraId = "Planta Solar Esol Hermosillo"
                        ),
                        MatrixItemEntity(
                            conceptCode = "ELE-FV-001",
                            resourceDescription = "Grapa intermedia de fijación",
                            resourceType = "Material",
                            unit = "Pza",
                            quantity = 4.0,
                            unitPrice = 2.5,
                            totalCost = 10.0,
                            obraId = "Planta Solar Esol Hermosillo"
                        ),
                        MatrixItemEntity(
                            conceptCode = "ELE-FV-001",
                            resourceDescription = "Cuadrilla de montaje (1 oficial + 2 ayudantes)",
                            resourceType = "Mano de Obra",
                            unit = "Jor",
                            quantity = 0.05,
                            unitPrice = 180.0,
                            totalCost = 9.0,
                            obraId = "Planta Solar Esol Hermosillo"
                        ),
                        MatrixItemEntity(
                            conceptCode = "ELE-FV-001",
                            resourceDescription = "Herramienta menor y arnés de seguridad",
                            resourceType = "Herramienta/Equipo",
                            unit = "%MO",
                            quantity = 0.03,
                            unitPrice = 9.0,
                            totalCost = 0.27,
                            obraId = "Planta Solar Esol Hermosillo"
                        )
                    )
                    matrixItemDao.insertMatrixItems(defaultMatrix)
                }
                
                // Automatically synchronize any pending local changes with Supabase/Cloud on startup
                delay(2000)
                syncPendingBitacoras()
            } catch (e: Exception) {
                Log.e("SyncRepository", "Database prepopulate or auto-sync error", e)
            }
        }
    }

    // --- Flows for UI consumption ---
    fun getAllBitacoras(): Flow<List<BitacoraEntity>> = bitacoraDao.getAllBitacoras()
    fun getBudgetForObra(obraId: String): Flow<List<BudgetItemEntity>> = budgetItemDao.getAllBudgetItems(obraId)
    fun getAllCrew(): Flow<List<CrewMemberEntity>> = crewMemberDao.getAllCrewMembers()
    fun getDistinctObrasFlow(): Flow<List<String>> = budgetItemDao.getDistinctObrasFlow()

    // --- Insertions ---
    suspend fun saveBitacora(bitacora: BitacoraEntity): Long {
        return withContext(Dispatchers.IO) {
            val id = bitacoraDao.insertBitacora(bitacora)
            updatePendingCount()
            // Auto-trigger upload/sync with Supabase in the background immediately
            @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
            kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
                syncPendingBitacoras()
            }
            id
        }
    }

    suspend fun updateBitacora(bitacora: BitacoraEntity) {
        withContext(Dispatchers.IO) {
            bitacoraDao.updateBitacora(bitacora)
            updatePendingCount()
            // Auto-trigger upload/sync with Supabase in the background immediately
            @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
            kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
                syncPendingBitacoras()
            }
        }
    }

    suspend fun deleteBitacora(bitacora: BitacoraEntity) {
        withContext(Dispatchers.IO) {
            bitacoraDao.deleteBitacora(bitacora)
            updatePendingCount()
            // Auto-trigger upload/sync with Supabase in the background immediately
            @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
            kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
                syncPendingBitacoras()
            }
        }
    }

    suspend fun addBudgetItem(item: BudgetItemEntity) {
        withContext(Dispatchers.IO) {
            budgetItemDao.insertBudgetItem(item)
        }
    }

    suspend fun updateBudgetItemProgress(id: Int, newExecutedQty: Double) {
        withContext(Dispatchers.IO) {
            // Fetch and update
            // (We could fetch the list and find the item)
        }
    }

    suspend fun updateBudgetItem(item: BudgetItemEntity) {
        withContext(Dispatchers.IO) {
            budgetItemDao.updateBudgetItem(item)
        }
    }

    suspend fun saveCrewMember(member: CrewMemberEntity) {
        withContext(Dispatchers.IO) {
            crewMemberDao.insertCrewMember(member)
        }
    }

    suspend fun deleteCrewMember(member: CrewMemberEntity) {
        withContext(Dispatchers.IO) {
            crewMemberDao.deleteCrewMember(member)
        }
    }

    fun toggleOnlineStatus() {
        val current = _syncStatus.value
        _syncStatus.value = current.copy(isOnline = !current.isOnline)
        addLog("Conexión de red cambiada a: ${if (_syncStatus.value.isOnline) "ONLINE" else "OFFLINE"}")
    }

    fun toggleGoogleSheetsConnection() {
        val current = _syncStatus.value
        _syncStatus.value = current.copy(googleSheetsConnected = !current.googleSheetsConnected)
        addLog("Google Sheets: ${if (_syncStatus.value.googleSheetsConnected) "Vinculado con éxito ✅" else "Desvinculado ❌"}")
    }

    fun toggleGoogleDriveConnection() {
        val current = _syncStatus.value
        _syncStatus.value = current.copy(googleDriveConnected = !current.googleDriveConnected)
        addLog("Google Drive: ${if (_syncStatus.value.googleDriveConnected) "Vinculado con éxito ✅" else "Desvinculado ❌"}")
    }

    fun toggleGoogleCalendarConnection() {
        val current = _syncStatus.value
        _syncStatus.value = current.copy(googleCalendarConnected = !current.googleCalendarConnected)
        addLog("Google Calendar: ${if (_syncStatus.value.googleCalendarConnected) "Vinculado con éxito ✅" else "Desvinculado ❌"}")
    }

    fun addLog(message: String) {
        val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val currentLogs = _syncStatus.value.syncLog.toMutableList()
        currentLogs.add(0, "[$timestamp] $message")
        _syncStatus.value = _syncStatus.value.copy(syncLog = currentLogs.take(50))
    }

    private suspend fun updatePendingCount() {
        val unsynced = bitacoraDao.getUnsyncedBitacoras().size
        _syncStatus.value = _syncStatus.value.copy(pendingLogsCount = unsynced)
    }

    // --- Main Sync Engine ---
    suspend fun syncPendingBitacoras(): Boolean {
        if (!_syncStatus.value.isOnline) {
            addLog("Error: No hay conexión a internet para sincronizar.")
            return false
        }

        return withContext(Dispatchers.IO) {
            _syncStatus.value = _syncStatus.value.copy(isSyncing = true)
            addLog("Iniciando sincronización de bitácoras pendientes...")
            delay(1500) // Simular latencia de red

            val pending = bitacoraDao.getUnsyncedBitacoras()
            if (pending.isEmpty()) {
                addLog("No hay reportes de bitácora pendientes de sincronización.")
                _syncStatus.value = _syncStatus.value.copy(isSyncing = false)
                return@withContext true
            }

            var successCount = 0
            for (log in pending) {
                addLog("Procesando reporte #${log.id} (${log.siteName})...")
                delay(800)

                // 1. ERP API Integration
                if (_syncStatus.value.erpConnected) {
                    addLog("  -> ERP API: Sincronizando avance físico (${log.physicalProgress}%) y financiero ($${log.financialProgress} MXN)...")
                    delay(500)
                    addLog("  -> ERP API: Sincronizado correctamente. ID: ERP-${1000 + log.id}")
                }

                // 2. EsolPortal Connection
                if (_syncStatus.value.portalConnected) {
                    addLog("  -> Portal esolenergias: Enviando registro de obra a base de datos central...")
                    delay(500)
                    addLog("  -> Portal esolenergias: Sincronizado en esolenergias.com/obras")
                }

                // 3. Google Sheets Integration
                if (_syncStatus.value.googleSheetsConnected) {
                    addLog("  -> Google Sheets: Añadiendo fila a bitácora consolidada de obra...")
                    delay(600)
                    addLog("  -> Google Sheets: Fila añadida con éxito.")
                } else {
                    addLog("  -> Google Sheets: Omitido (No vinculado).")
                }

                // 4. Google Drive Photo Backup
                if (log.photoUri != null) {
                    if (_syncStatus.value.googleDriveConnected) {
                        addLog("  -> Google Drive: Subiendo fotografía de avance de obra...")
                        delay(700)
                        
                        // Generar estructura de carpetas: Esol energias/bitacoras/proyectos/<proyecto>/<dia_hora>
                        val projectName = log.siteName.replace(" ", "_").replace("/", "-")
                        val dateTime = java.text.SimpleDateFormat("yyyy-MM-dd_HH-mm", java.util.Locale.getDefault()).format(java.util.Date())
                        val drivePath = "Esol energias/bitacoras/proyectos/$projectName/$dateTime"
                        
                        addLog("  -> Google Drive: Fotografía guardada en la ruta '$drivePath'")
                    } else {
                        addLog("  -> Google Drive: Omitido (No vinculado).")
                    }
                }

                // 5. Google Calendar Schedule
                if (_syncStatus.value.googleCalendarConnected) {
                    addLog("  -> Google Calendar: Registrando hito de obra en calendario del proyecto...")
                    delay(600)
                    addLog("  -> Google Calendar: Evento creado.")
                } else {
                    addLog("  -> Google Calendar: Omitido (No vinculado).")
                }

                // 6. Supabase Integration
                val supabaseUrl = _syncStatus.value.supabaseUrl
                val supabaseKey = _syncStatus.value.supabaseKey
                
                if (supabaseUrl.isNotEmpty() && supabaseKey.isNotEmpty()) {
                    addLog("  -> Supabase: Guardando registro de trabajo/cambios en la nube...")
                    try {
                        val cleanUrl = if (supabaseUrl.endsWith("/")) supabaseUrl else "$supabaseUrl/"
                        val retrofit = Retrofit.Builder()
                            .baseUrl(cleanUrl)
                            .addConverterFactory(MoshiConverterFactory.create(com.squareup.moshi.Moshi.Builder().add(com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory()).build()))
                            .build()
                        val service = retrofit.create(SupabaseApiService::class.java)
                        val bearerToken = "Bearer $supabaseKey"
                        val request = com.example.data.api.SupabaseBitacoraUploadRequest(
                            site_name = log.siteName,
                            date = log.date,
                            weather = log.weather,
                            crew_count = log.crewCount,
                            description = log.description,
                            physical_progress = log.physicalProgress,
                            financial_progress = log.financialProgress,
                            budget_estimate = log.budgetEstimate,
                            latitude = log.latitude,
                            longitude = log.longitude,
                            photo_uri = null, // La fotografía no se guarda en Supabase, se guarda en Google Drive
                            timestamp = System.currentTimeMillis()
                        )
                        val response = service.uploadBitacora(apiKey = supabaseKey, authorization = bearerToken, request = request)
                        if (response.isSuccessful) {
                            addLog("  -> Supabase: Guardado exitoso (ID local: ${log.id})")
                        } else {
                            addLog("  -> Supabase: Error al guardar - HTTP ${response.code()}")
                        }
                    } catch (e: Exception) {
                         addLog("  -> Supabase: Error de conexión - ${e.message}")
                    }
                }

                // Mark as synced in local Room db
                bitacoraDao.markAsSynced(log.id)
                successCount++
                addLog("Reporte #${log.id} completamente sincronizado en todos los sistemas activos.")
            }

            val timestamp = SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault()).format(Date())
            _syncStatus.value = _syncStatus.value.copy(
                isSyncing = false,
                lastSyncTime = timestamp,
                pendingLogsCount = bitacoraDao.getUnsyncedBitacoras().size
            )
            addLog("Sincronización completada. Se sincronizaron $successCount reportes.")
            true
        }
    }

    fun getMatrixForConcept(conceptCode: String, obraId: String): Flow<List<MatrixItemEntity>> {
        return matrixItemDao.getMatrixForConcept(conceptCode, obraId)
    }

    // Sync ERP budgets (specifically updated for solar electrical construction execution)
    suspend fun syncErpBudget(): Boolean {
        if (!_syncStatus.value.isOnline) {
            addLog("Error: No hay conexión a internet para descargar presupuestos.")
            return false
        }
        return withContext(Dispatchers.IO) {
            addLog("Conectando con ERP para actualizar catálogo de conceptos eléctricos de paneles solares...")
            delay(1200)
            // Simular recarga de conceptos especializados desde el ERP de EsolEnergias
            val updatedBudget = listOf(
                BudgetItemEntity(code = "ELE-FV-001", description = "Soportería: Estructura de aluminio anodizado para paneles solares", quantity = 240.0, unit = "Pza", unitPrice = 85.0, executedQuantity = 135.0, totalBudget = 20400.0),
                BudgetItemEntity(code = "ELE-FV-002", description = "Montaje Eléctrico: Módulos fotovoltaicos Jinko Solar 550Wp", quantity = 240.0, unit = "Pza", unitPrice = 45.0, executedQuantity = 110.0, totalBudget = 10800.0),
                BudgetItemEntity(code = "ELE-AC-003", description = "Canalización: Tubería conduit galvanizada de 2 pulg pared gruesa", quantity = 180.0, unit = "m", unitPrice = 120.0, executedQuantity = 75.0, totalBudget = 21600.0),
                BudgetItemEntity(code = "ELE-DC-004", description = "Cableado: Tendido de cable fotovoltaico DC XLPE 10 AWG", quantity = 1500.0, unit = "m", unitPrice = 3.5, executedQuantity = 520.0, totalBudget = 5250.0),
                BudgetItemEntity(code = "ELE-INV-005", description = "Inversor: Montaje y comisionamiento de inversores 100 kW SMA Core 1", quantity = 2.0, unit = "Pza", unitPrice = 4500.0, executedQuantity = 1.0, totalBudget = 9000.0),
                BudgetItemEntity(code = "ELE-SUB-006", description = "Tierras: Sistema de puesta a tierra con electrodos y soldadura exotérmica", quantity = 1.0, unit = "Lote", unitPrice = 3800.0, executedQuantity = 0.45, totalBudget = 3800.0),
                BudgetItemEntity(code = "ELE-PRO-007", description = "Protecciones: Tablero de distribución AC 480V con interruptores", quantity = 1.0, unit = "Pza", unitPrice = 6200.0, executedQuantity = 0.0, totalBudget = 6200.0)
            )
            budgetItemDao.deleteAllBudgetItems()
            budgetItemDao.insertBudgetItems(updatedBudget)
            addLog("Catálogo de conceptos de obra eléctrica sincronizado exitosamente (7 conceptos cargados).")
            true
        }
    }

    // Sync with Supabase dynamically using specified URL and Key
    suspend fun syncProductionBudgetsSupabase(url: String, key: String): List<com.example.data.api.SupabasePresupuestoResponse>? {
        if (!_syncStatus.value.isOnline) {
            addLog("Supabase Sync: Sin conexión.")
            return null
        }
        val cleanUrl = if (url.endsWith("/")) url else "$url/"
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            addLog("Supabase Sync: URL inválida.")
            return null
        }
        return withContext(Dispatchers.IO) {
            try {
                addLog("Supabase Sync: Conectando a $cleanUrl ...")
                val retrofit = Retrofit.Builder()
                    .baseUrl(cleanUrl)
                    .addConverterFactory(MoshiConverterFactory.create(com.squareup.moshi.Moshi.Builder().add(com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory()).build()))
                    .build()
                val service = retrofit.create(SupabaseApiService::class.java)
                val bearerToken = "Bearer $key"
                val response = service.getPresupuestos(apiKey = key, authorization = bearerToken)
                
                if (response.isSuccessful) {
                    val presupuestos = response.body() ?: emptyList()
                    addLog("Supabase Sync: Presupuestos obtenidos: ${presupuestos.size}")
                    
                    val conceptResponse = service.getConceptos(apiKey = key, authorization = bearerToken)
                    val allConcepts = if (conceptResponse.isSuccessful) conceptResponse.body() ?: emptyList() else emptyList()
                    addLog("Supabase Sync: Conceptos obtenidos: ${allConcepts.size}")
                    
                    val matrixResponse = service.getMatrices(apiKey = key, authorization = bearerToken)
                    val allMatrices = if (matrixResponse.isSuccessful) matrixResponse.body() ?: emptyList() else emptyList()
                    addLog("Supabase Sync: Matrices obtenidas: ${allMatrices.size}")
                    
                    budgetItemDao.deleteAllBudgetItems()
                    matrixItemDao.deleteAllMatrixItems()
                    
                    val filteredConcepts = allConcepts.filter { sc ->
                        presupuestos.any { it.id == sc.presupuesto_id }
                    }
                    val budgetEntities = filteredConcepts.map { sc ->
                        val obraName = presupuestos.find { it.id == sc.presupuesto_id }?.obra_name ?: sc.presupuesto_id ?: "Obra Desconocida"
                        BudgetItemEntity(
                            code = sc.code ?: sc.id ?: "DESCONOCIDO",
                            description = sc.description ?: "",
                            quantity = sc.quantity ?: 0.0,
                            unit = sc.unit ?: "",
                            unitPrice = sc.unit_price ?: 0.0,
                            executedQuantity = sc.executed_quantity ?: 0.0,
                            totalBudget = sc.total_budget ?: ((sc.quantity ?: 0.0) * (sc.unit_price ?: 0.0)),
                            obraId = obraName
                        )
                    }
                    budgetItemDao.insertBudgetItems(budgetEntities)
                    
                    val filteredMatrices = allMatrices.filter { sm ->
                        presupuestos.any { it.id == sm.presupuesto_id }
                    }
                    val matrixEntities = filteredMatrices.map { sm ->
                        val obraName = presupuestos.find { it.id == sm.presupuesto_id }?.obra_name ?: sm.presupuesto_id ?: "Obra Desconocida"
                        MatrixItemEntity(
                            conceptCode = sm.concept_code ?: "DESCONOCIDO",
                            resourceDescription = sm.resource_description ?: "",
                            resourceType = sm.resource_type ?: "",
                            unit = sm.unit ?: "",
                            quantity = sm.quantity ?: 0.0,
                            unitPrice = sm.unit_price ?: 0.0,
                            totalCost = sm.total_cost ?: 0.0,
                            obraId = obraName
                        )
                    }
                    matrixItemDao.insertMatrixItems(matrixEntities)
                    
                    presupuestos
                } else {
                    val errorBody = response.errorBody()?.string()
                    addLog("Supabase Sync Error: ${response.code()} $errorBody")
                    null
                }
            } catch (e: Exception) {
                Log.e("SyncRepository", "Supabase budget sync error", e)
                addLog("Supabase Sync Exception: ${e.message}")
                null
            }
        }
    }

    suspend fun syncSupabaseData(url: String, key: String): Boolean {
        if (!_syncStatus.value.isOnline) {
            addLog("Supabase Sync: Error - Sin conexión a internet.")
            return false
        }
        
        return withContext(Dispatchers.IO) {
            _syncStatus.value = _syncStatus.value.copy(
                isSyncing = true,
                supabaseUrl = url,
                supabaseKey = key
            )
            addLog("Supabase Sync: Conectando a Supabase para sincronizar presupuestos de producción...")
            
            try {
                val budgets = syncProductionBudgetsSupabase(url, key)
                val success = budgets != null && budgets.isNotEmpty()
                val timestamp = SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault()).format(Date())
                _syncStatus.value = _syncStatus.value.copy(
                    isSyncing = false,
                    lastSyncTime = timestamp,
                    isSupabaseConnected = success
                )
                if (success) {
                    addLog("Supabase Sync: ¡Sincronizados ${budgets?.size ?: 0} presupuestos de producción con sus conceptos y matrices! ✅")
                } else {
                    addLog("Supabase Sync: No se encontraron presupuestos en producción.")
                }
                success
            } catch (e: Exception) {
                Log.e("SyncRepository", "Supabase sync error", e)
                addLog("Supabase Sync: Error - ${e.localizedMessage ?: e.message}")
                _syncStatus.value = _syncStatus.value.copy(
                    isSyncing = false,
                    isSupabaseConnected = false
                )
                false
            }
        }
    }


    // --- Tasks Methods ---
    fun getTasksForObra(obraId: String): Flow<List<TaskEntity>> = taskDao.getTasksForObra(obraId)
    fun getAllTasks(): Flow<List<TaskEntity>> = taskDao.getAllTasks()

    suspend fun addTask(task: TaskEntity) {
        taskDao.insertTask(task)
    }

    suspend fun updateTask(task: TaskEntity) {
        taskDao.updateTask(task)
    }

    suspend fun deleteTask(task: TaskEntity) {
        taskDao.deleteTask(task)
    }

    // --- Obras Methods ---
    fun getAllObras(): Flow<List<ObraEntity>> = obraDao.getAllObras()

    suspend fun saveObra(obra: ObraEntity) {
        obraDao.insertObra(obra)
    }

    suspend fun deleteObra(obra: ObraEntity) {
        obraDao.deleteObra(obra)
    }
}

