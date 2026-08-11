package com.example.data.repository

import android.content.Context
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class AiManager private constructor(private val context: Context) {

    private var llmInference: LlmInference? = null
    var isModelLoaded = false
        private set

    suspend fun loadModel(modelFile: File) {
        withContext(Dispatchers.IO) {
            if (!modelFile.exists()) {
                throw Exception("El archivo del modelo no existe.")
            }
            try {
                val options = LlmInference.LlmInferenceOptions.builder()
                    .setModelPath(modelFile.absolutePath)
                    .setMaxTokens(1024)
                    .build()
                
                llmInference?.close() // Close previous if exists
                llmInference = LlmInference.createFromOptions(context, options)
                isModelLoaded = true
            } catch (e: Exception) {
                isModelLoaded = false
                throw Exception("Error al cargar el modelo Gemma: ${e.message}")
            }
        }
    }

    suspend fun generateProfessionalReport(rawText: String): String {
        return withContext(Dispatchers.IO) {
            val inference = llmInference ?: throw Exception("El modelo de IA no está cargado. Ve a Configuración para cargarlo.")
            
            // Gemma specific prompt formatting
            val prompt = """
                <start_of_turn>user
                Actúa como un Ingeniero Civil Residente de Obra. Reescribe el siguiente reporte de obra con un lenguaje altamente técnico, formal, en tercera persona, corrigiendo ortografía y gramática. Solo devuelve el texto corregido, sin saludos ni explicaciones.
                Texto original: $rawText<end_of_turn>
                <start_of_turn>model
            """.trimIndent()

            try {
                val response = inference.generateResponse(prompt)
                response.trim()
            } catch (e: Exception) {
                throw Exception("Error al generar la redacción: ${e.message}")
            }
        }
    }

    suspend fun extractProgress(rawText: String): Int? {
        return withContext(Dispatchers.IO) {
            val inference = llmInference ?: throw Exception("El modelo de IA no está cargado.")
            val prompt = """
                <start_of_turn>user
                Lee el siguiente reporte de avance de obra y estima el porcentaje de avance físico descrito, del 0 al 100.
                Solo devuelve un número entero, sin símbolos de porcentaje ni texto adicional. Si no puedes estimarlo, devuelve 0.
                Reporte: $rawText<end_of_turn>
                <start_of_turn>model
            """.trimIndent()
            try {
                val response = inference.generateResponse(prompt).trim()
                val match = Regex("\\d+").find(response)
                match?.value?.toIntOrNull()?.coerceIn(0, 100)
            } catch (e: Exception) { null }
        }
    }

    suspend fun draftMaterialRequest(rawText: String): String {
        return withContext(Dispatchers.IO) {
            val inference = llmInference ?: throw Exception("El modelo de IA no está cargado.")
            val prompt = """
                <start_of_turn>user
                Escribe un mensaje corto, formal y directo para enviar por WhatsApp al departamento de compras solicitando los siguientes materiales para la obra. No incluyas saludos largos ni firmas con placeholders.
                Materiales a solicitar: $rawText<end_of_turn>
                <start_of_turn>model
            """.trimIndent()
            try {
                inference.generateResponse(prompt).trim()
            } catch (e: Exception) { throw Exception("Error al generar: ${e.message}") }
        }
    }

    suspend fun extractMaterials(rawText: String): String {
        return withContext(Dispatchers.IO) {
            val inference = llmInference ?: throw Exception("El modelo de IA no está cargado.")
            val prompt = """
                <start_of_turn>user
                Extrae una lista estructurada y concisa de los materiales y herramientas que se mencionan en este reporte de obra. Si no hay ninguno, responde "Ninguno".
                Reporte: $rawText<end_of_turn>
                <start_of_turn>model
            """.trimIndent()
            try {
                inference.generateResponse(prompt).trim()
            } catch (e: Exception) { throw Exception("Error al extraer: ${e.message}") }
        }
    }

    companion object {
        @Volatile
        private var INSTANCE: AiManager? = null

        fun getInstance(context: Context): AiManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AiManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
