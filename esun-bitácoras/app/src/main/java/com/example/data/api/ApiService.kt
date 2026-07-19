package com.example.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

// ==========================================
// API DATA MODELS
// ==========================================

data class ErpBudgetResponse(
    val id: String,
    val itemCode: String,
    val description: String,
    val quantity: Double? = 0.0,
    val unit: String? = null,
    val unitPrice: Double,
    val executedQuantity: Double,
    val totalBudget: Double
)

data class SyncLogRequest(
    val siteName: String,
    val date: String,
    val weather: String,
    val crewCount: Int,
    val description: String,
    val physicalProgress: Double,
    val financialProgress: Double,
    val budgetEstimate: Double,
    val latitude: Double,
    val longitude: Double,
    val photoBase64: String?,
    val timestamp: Long
)

data class SyncResponse(
    val success: Boolean,
    val message: String,
    val syncId: String?,
    val timestamp: Long
)

data class PortalStatusResponse(
    val activeProject: String,
    val connected: Boolean,
    val userRole: String
)

// ==========================================
// RETROFIT API INTERFACES
// ==========================================

interface ErpApiService {
    @GET("api/v1/erp/budget")
    suspend fun getBudgetItems(
        @Query("project_id") projectId: String,
        @Query("api_key") apiKey: String
    ): Response<List<ErpBudgetResponse>>

    @POST("api/v1/erp/log")
    suspend fun uploadDailyLog(
        @Body request: SyncLogRequest
    ): Response<SyncResponse>
}

interface EsolPortalService {
    @GET("api/v1/portal/status")
    suspend fun getPortalStatus(
        @Query("token") sessionToken: String
    ): Response<PortalStatusResponse>

    @POST("api/v1/portal/bitacora")
    suspend fun syncBitacoraWithPortal(
        @Body request: SyncLogRequest
    ): Response<SyncResponse>
}

// ==========================================
// SUPABASE REST API INTEGRATION
// ==========================================

data class SupabaseConceptResponse(
    val presupuesto_id: String? = null,
    val code: String? = null,
    val id: String? = null,
    val description: String? = null,
    val quantity: Double? = 0.0,
    val unit: String? = null,
    val unit_price: Double? = 0.0,
    val executed_quantity: Double? = 0.0,
    val total_budget: Double? = 0.0
)

data class SupabaseMatrixResponse(
    val presupuesto_id: String? = null,
    val concept_code: String? = null,
    val resource_description: String? = null,
    val resource_type: String? = null, // "Material", "Mano de Obra", "Herramienta/Equipo"
    val unit: String? = null,
    val quantity: Double? = 0.0,
    val unit_price: Double? = 0.0,
    val total_cost: Double? = 0.0
)

data class SupabasePresupuestoResponse(
    val id: String?,
    val obra_name: String?,
    val cliente: String?,
    val ubicacion: String?,
    val inicio: String?,
    val termino: String?,
    val residente: String?,
    val status: String?,
    val produccion: Boolean? = null
)

data class SupabaseBitacoraUploadRequest(
    val site_name: String,
    val date: String,
    val weather: String,
    val crew_count: Int,
    val description: String,
    val physical_progress: Double,
    val financial_progress: Double,
    val budget_estimate: Double,
    val latitude: Double,
    val longitude: Double,
    val photo_uri: String?,
    val concepto_id: String? = null,
    val concepto: String? = null,
    val timestamp: Long
)

data class SupabaseObraRequest(
    val nombre: String,
    val cliente: String,
    val ubicacion: String,
    val fecha_inicio: String,
    val fecha_termino: String,
    val residente: String,
    val descripcion: String,
    val monto_contrato: String,
    val status: String
)

interface SupabaseApiService {
    @GET("rest/v1/obras_app")
    suspend fun getObras(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String,
        @Query("select") select: String = "*"
    ): Response<List<SupabaseObraRequest>>

    @POST("rest/v1/obras_app")
    suspend fun upsertObra(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String,
        @Header("Prefer") prefer: String = "resolution=merge-duplicates",
        @Body request: SupabaseObraRequest
    ): Response<Unit>

    @POST("rest/v1/registros_app")
    suspend fun uploadBitacora(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String,
        @Body request: SupabaseBitacoraUploadRequest
    ): Response<Unit>

    @GET("rest/v1/conceptos_bitacora")
    suspend fun getConceptos(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String,
        @Query("select") select: String = "*"
    ): Response<List<SupabaseConceptResponse>>

    @GET("rest/v1/matrices")
    suspend fun getMatrices(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String,
        @Query("select") select: String = "*"
    ): Response<List<SupabaseMatrixResponse>>

    @GET("rest/v1/presupuestos_bitacora")
    suspend fun getPresupuestos(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String,
        @Query("produccion") produccion: String = "eq.true",
        @Query("select") select: String = "*"
    ): Response<List<SupabasePresupuestoResponse>>
}
