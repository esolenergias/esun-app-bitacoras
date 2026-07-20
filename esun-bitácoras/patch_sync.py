import codecs

path = r"C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\data\repository\SyncRepository.kt"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target_1 = """    suspend fun updateBudgetItemProgress(id: Int, newExecutedQty: Double) {
        withContext(Dispatchers.IO) {
            // Fetch and update
            // (We could fetch the list and find the item)
        }
    }"""
replace_1 = """    suspend fun updateBudgetItemProgress(id: Int, newExecutedQty: Double) {
        withContext(Dispatchers.IO) {
            val items = budgetItemDao.getAllBudgetItemsSync()
            val item = items.find { it.id == id }
            if (item != null) {
                budgetItemDao.updateBudgetItem(item.copy(executedQuantity = newExecutedQty))
                
                // Supabase Upload
                if (_syncStatus.value.isOnline && item.supabaseId.isNotEmpty()) {
                    val url = _syncStatus.value.supabaseUrl
                    val key = _syncStatus.value.supabaseKey
                    if (url.isNotEmpty() && key.isNotEmpty()) {
                        try {
                            val cleanUrl = if (url.endsWith("/")) url else "$url/"
                            val retrofit = Retrofit.Builder()
                                .baseUrl(cleanUrl)
                                .addConverterFactory(MoshiConverterFactory.create(com.squareup.moshi.Moshi.Builder().add(com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory()).build()))
                                .build()
                            val service = retrofit.create(SupabaseApiService::class.java)
                            service.updateConceptoExecuted(
                                apiKey = key,
                                authorization = "Bearer $key",
                                idQuery = "eq.${item.supabaseId}",
                                updates = mapOf("executed_quantity" to newExecutedQty)
                            )
                            addLog("Supabase Sync: Avance de concepto subido correctamente.")
                        } catch (e: Exception) {
                            addLog("Error al subir avance de concepto: ${e.message}")
                        }
                    }
                }
            }
        }
    }"""

target_2 = """                    try {
                        val getResp = supabaseService.getObras(apiKey = supabaseKey, authorization = bearerToken)
                        if (getResp.isSuccessful) {
                            val remoteObras = getResp.body() ?: emptyList()
                            val remoteObraNames = remoteObras.map { it.nombre }.toSet()
                            var deletedCount = 0
                            for (obra in todasObras) {
                                if (!remoteObraNames.contains(obra.nombre)) {
                                    obraDao.deleteObra(obra)
                                    deletedCount++
                                }
                            }
                            if (deletedCount > 0) {
                                addLog("Se eliminaron $deletedCount proyectos locales que fueron borrados en la nube.")
                            }
                        }
                    } catch (e: Exception) {
                        addLog("Error al verificar obras eliminadas: ${e.message}")
                    }"""
replace_2 = """                    try {
                        val getResp = supabaseService.getObras(apiKey = supabaseKey, authorization = bearerToken)
                        if (getResp.isSuccessful) {
                            val remoteObras = getResp.body() ?: emptyList()
                            val remoteObraNames = remoteObras.map { it.nombre }.toSet()
                            val localObraNames = todasObras.map { it.nombre }.toSet()
                            
                            var deletedCount = 0
                            for (obra in todasObras) {
                                if (!remoteObraNames.contains(obra.nombre)) {
                                    obraDao.deleteObra(obra)
                                    deletedCount++
                                }
                            }
                            if (deletedCount > 0) addLog("Se eliminaron $deletedCount proyectos locales borrados en la nube.")

                            var addedCount = 0
                            for (rObra in remoteObras) {
                                if (!localObraNames.contains(rObra.nombre)) {
                                    obraDao.insertObra(ObraEntity(
                                        nombre = rObra.nombre,
                                        cliente = rObra.cliente,
                                        ubicacion = rObra.ubicacion,
                                        fechaInicio = rObra.fecha_inicio,
                                        fechaTermino = rObra.fecha_termino,
                                        residente = rObra.residente,
                                        descripcion = rObra.descripcion,
                                        montoContrato = rObra.monto_contrato,
                                        status = rObra.status
                                    ))
                                    addedCount++
                                }
                            }
                            if (addedCount > 0) addLog("Se descargaron $addedCount proyectos nuevos desde Supabase.")
                        }
                    } catch (e: Exception) {
                        addLog("Error al sincronizar obras con Supabase: ${e.message}")
                    }"""

target_3 = """                            BudgetItemEntity(
                                code = codeStr,
                                description = sc.description ?: "",
                                quantity = sc.quantity ?: 0.0,
                                unit = sc.unit ?: "",
                                unitPrice = sc.unit_price ?: 0.0,
                                executedQuantity = finalExecuted,
                                totalBudget = sc.total_budget ?: ((sc.quantity ?: 0.0) * (sc.unit_price ?: 0.0)),
                                obraId = obraName
                            )"""
replace_3 = """                            BudgetItemEntity(
                                code = codeStr,
                                description = sc.description ?: "",
                                quantity = sc.quantity ?: 0.0,
                                unit = sc.unit ?: "",
                                unitPrice = sc.unit_price ?: 0.0,
                                executedQuantity = finalExecuted,
                                totalBudget = sc.total_budget ?: ((sc.quantity ?: 0.0) * (sc.unit_price ?: 0.0)),
                                obraId = obraName,
                                supabaseId = sc.id ?: ""
                            )"""

if target_1 in content:
    content = content.replace(target_1, replace_1)
if target_2 in content:
    content = content.replace(target_2, replace_2)
if target_3 in content:
    content = content.replace(target_3, replace_3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SyncRepository patched")
