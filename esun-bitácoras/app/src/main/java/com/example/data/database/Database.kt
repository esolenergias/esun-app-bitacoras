package com.example.data.database

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.migration.Migration
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.flow.Flow

// ==========================================
// ROOM ENTITIES
// ==========================================

@Entity(tableName = "bitacoras")
data class BitacoraEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val siteName: String,
    val date: String,
    val weather: String,
    val crewCount: Int,
    val description: String,
    val physicalProgress: Double,   // % de avance, e.g. 25.0
    val financialProgress: Double,  // Monto ejercido, e.g. 15000.0
    val budgetEstimate: Double,     // Presupuesto total, e.g. 50000.0
    val latitude: Double,
    val longitude: Double,
    val photoUri: String?,
    val isSynced: Boolean = false,
    // Campos añadidos en versión 10
    val safetyRemarks: String = "",
    val machinery: String = "",
    // Campos añadidos en versión 11
    val concepto_id: String? = null,
    val concepto_name: String? = null,
    // Campos añadidos en versión 12
    val supabaseId: String? = null,
    // Campos añadidos en versión 13
    val sync_status: String = "PENDING"
)

@Entity(tableName = "obras")
data class ObraEntity(
    @PrimaryKey val nombre: String,           // PK: nombre único de la obra
    val cliente: String = "",
    val ubicacion: String = "",
    val fechaInicio: String = "",
    val fechaTermino: String = "",
    val residente: String = "",
    val descripcion: String = "",
    val montoContrato: String = "",
    val status: String = "En proceso"
)

@Entity(tableName = "budget_items")
data class BudgetItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val code: String,
    val description: String,
    val quantity: Double,
    val unit: String,
    val unitPrice: Double,
    val executedQuantity: Double,
    val obraId: String = "",
    val totalBudget: Double,
    val supabaseId: String = "",
    val categoryName: String = ""
)

@Entity(tableName = "crew_members")
data class CrewMemberEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val role: String,
    val status: String // "Activo", "Descanso", "Fuera de Servicio"
)

@Entity(tableName = "matrix_items")
data class MatrixItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val conceptCode: String,
    val resourceDescription: String,
    val resourceType: String, // "Material", "Mano de Obra", "Herramienta/Equipo"
    val unit: String,
    val quantity: Double,
    val unitPrice: Double,
    val totalCost: Double,
    val obraId: String = ""
)

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val obraId: String,
    val time: String,
    val meridiem: String,
    val title: String,
    val desc: String,
    val isCompleted: Boolean,
    val isArchived: Boolean = false,
    val isImportant: Boolean = false
)

@Entity(tableName = "polizas_garantia")
data class PolizaEntity(
    @PrimaryKey val id: String,
    val folio: String,
    val clienteNombre: String,
    @androidx.room.ColumnInfo(defaultValue = "") val clienteDireccion: String = "",
    val nombreObra: String,
    val estado: String,
    val fechaInicio: String,
    val fechaFin: String,
    val periodicidad: String,
    @androidx.room.ColumnInfo(defaultValue = "Pendiente") val estadoMantenimiento: String = "Pendiente",
    val fechaProximoMantenimiento: String? = null
)

@Entity(tableName = "visitas_mantenimiento")
data class VisitaMantenimientoEntity(
    @PrimaryKey val id: String,
    val polizaId: String,
    val numeroVisita: Int,
    val fechaProgramada: String,
    @androidx.room.ColumnInfo(defaultValue = "Pendiente") val estado: String = "Pendiente",
    val fechaRealizada: String? = null,
    @androidx.room.ColumnInfo(defaultValue = "{}") val checklistDataJson: String = "{}",
    @androidx.room.ColumnInfo(defaultValue = "[]") val evidenciaFotosJson: String = "[]",
    @androidx.room.ColumnInfo(defaultValue = "") val notasVisita: String = "",
    val firmaBase64: String? = null,
    @androidx.room.ColumnInfo(defaultValue = "SYNCED") val syncStatus: String = "SYNCED"
)



// ==========================================
// ROOM DAOS
// ==========================================

@Dao
interface BitacoraDao {
    @Query("SELECT * FROM bitacoras ORDER BY date DESC, id DESC")
    fun getAllBitacoras(): Flow<List<BitacoraEntity>>

    @Query("SELECT * FROM bitacoras WHERE isSynced = 0 OR sync_status = 'PENDING'")
    suspend fun getUnsyncedBitacoras(): List<BitacoraEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBitacora(bitacora: BitacoraEntity): Long

    @Update
    suspend fun updateBitacora(bitacora: BitacoraEntity)

    @Delete
    suspend fun deleteBitacora(bitacora: BitacoraEntity)

    @Query("UPDATE bitacoras SET isSynced = 1, sync_status = 'SYNCED' WHERE id = :id")
    suspend fun markAsSynced(id: Int)

    @Query("SELECT * FROM bitacoras WHERE supabaseId = :supabaseId")
    suspend fun getBitacoraBySupabaseId(supabaseId: String): BitacoraEntity?

    @Query("UPDATE bitacoras SET supabaseId = :supabaseId, isSynced = 1, sync_status = 'SYNCED' WHERE id = :id")
    suspend fun markAsSyncedWithSupabaseId(id: Int, supabaseId: String)
    
    @Query("UPDATE bitacoras SET sync_status = 'ORPHANED' WHERE id = :id")
    suspend fun markAsOrphaned(id: Int)
}

@Dao
interface ObraDao {
    @Query("SELECT * FROM obras ORDER BY nombre ASC")
    fun getAllObras(): Flow<List<ObraEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertObra(obra: ObraEntity)

    @Delete
    suspend fun deleteObra(obra: ObraEntity)

    @Query("SELECT * FROM obras WHERE nombre = :nombre LIMIT 1")
    suspend fun getObraByName(nombre: String): ObraEntity?
}

@Dao
interface BudgetItemDao {
    @Query("SELECT COUNT(*) FROM budget_items")
    suspend fun getCount(): Int

    @Query("SELECT * FROM budget_items WHERE obraId = :obraId ORDER BY id ASC")
    fun getAllBudgetItems(obraId: String): Flow<List<BudgetItemEntity>>

    @Query("SELECT * FROM budget_items")
    suspend fun getAllBudgetItemsSync(): List<BudgetItemEntity>

    @Query("SELECT DISTINCT obraId FROM budget_items WHERE obraId != ''")
    fun getDistinctObrasFlow(): Flow<List<String>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBudgetItems(items: List<BudgetItemEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBudgetItem(item: BudgetItemEntity): Long

    @Update
    suspend fun updateBudgetItem(item: BudgetItemEntity)

    @Query("DELETE FROM budget_items")
    suspend fun deleteAllBudgetItems()
}

@Dao
interface CrewMemberDao {
    @Query("SELECT COUNT(*) FROM crew_members")
    suspend fun getCount(): Int

    @Query("SELECT * FROM crew_members ORDER BY name ASC")
    fun getAllCrewMembers(): Flow<List<CrewMemberEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCrewMember(member: CrewMemberEntity): Long

    @Update
    suspend fun updateCrewMember(member: CrewMemberEntity)

    @Delete
    suspend fun deleteCrewMember(member: CrewMemberEntity)

    @Query("DELETE FROM crew_members")
    suspend fun deleteAllCrew()
}

@Dao
interface MatrixItemDao {
    @Query("SELECT COUNT(*) FROM matrix_items")
    suspend fun getCount(): Int

    @Query("SELECT * FROM matrix_items WHERE conceptCode = :conceptCode AND obraId = :obraId ORDER BY id ASC")
    fun getMatrixForConcept(conceptCode: String, obraId: String): Flow<List<MatrixItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMatrixItems(items: List<MatrixItemEntity>)

    @Query("DELETE FROM matrix_items")
    suspend fun deleteAllMatrixItems()
}

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks WHERE obraId = :obraId ORDER BY id ASC")
    fun getTasksForObra(obraId: String): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks ORDER BY id ASC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)
}

@Dao
interface PolizaDao {
    @Query("SELECT * FROM polizas_garantia ORDER BY CASE WHEN fechaProximoMantenimiento IS NULL OR fechaProximoMantenimiento = '' THEN 1 ELSE 0 END, fechaProximoMantenimiento ASC, nombreObra ASC")
    fun getAllPolizas(): Flow<List<PolizaEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPolizas(polizas: List<PolizaEntity>)

    @Query("SELECT * FROM polizas_garantia WHERE id = :id LIMIT 1")
    suspend fun getPolizaById(id: String): PolizaEntity?
}

@Dao
interface VisitaMantenimientoDao {
    @Query("SELECT * FROM visitas_mantenimiento WHERE polizaId = :polizaId ORDER BY numeroVisita ASC")
    fun getVisitasForPoliza(polizaId: String): Flow<List<VisitaMantenimientoEntity>>

    @Query("SELECT * FROM visitas_mantenimiento WHERE LOWER(estado) = 'completada'")
    fun getVisitasCompletadas(): Flow<List<VisitaMantenimientoEntity>>

    @Query("SELECT * FROM visitas_mantenimiento WHERE syncStatus = 'PENDING'")
    suspend fun getPendingSyncVisitas(): List<VisitaMantenimientoEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVisitas(visitas: List<VisitaMantenimientoEntity>)

    @Update
    suspend fun updateVisita(visita: VisitaMantenimientoEntity)

    @Query("UPDATE visitas_mantenimiento SET syncStatus = 'SYNCED' WHERE id = :id")
    suspend fun markAsSynced(id: String)
}



// ==========================================
// MIGRACIONES FORMALES
// ==========================================

/** Migración 9 → 10:
 *  - Agrega columnas safetyRemarks y machinery a la tabla bitacoras.
 *  - Crea la tabla obras para persistir proyectos localmente.
 */
val MIGRATION_9_10 = object : Migration(9, 10) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // 1. Nuevos campos en bitacoras
        db.execSQL("ALTER TABLE bitacoras ADD COLUMN safetyRemarks TEXT NOT NULL DEFAULT ''")
        db.execSQL("ALTER TABLE bitacoras ADD COLUMN machinery TEXT NOT NULL DEFAULT ''")

        // 2. Nueva tabla obras
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS `obras` (
                `nombre` TEXT NOT NULL,
                `cliente` TEXT NOT NULL DEFAULT '',
                `ubicacion` TEXT NOT NULL DEFAULT '',
                `fechaInicio` TEXT NOT NULL DEFAULT '',
                `fechaTermino` TEXT NOT NULL DEFAULT '',
                `residente` TEXT NOT NULL DEFAULT '',
                `descripcion` TEXT NOT NULL DEFAULT '',
                `montoContrato` TEXT NOT NULL DEFAULT '',
                `status` TEXT NOT NULL DEFAULT 'En proceso',
                PRIMARY KEY(`nombre`)
            )
        """.trimIndent())
    }
}



val MIGRATION_10_11 = object : Migration(10, 11) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE bitacoras ADD COLUMN concepto_id TEXT DEFAULT NULL")
        db.execSQL("ALTER TABLE bitacoras ADD COLUMN concepto_name TEXT DEFAULT NULL")
    }
}

val MIGRATION_11_12 = object : Migration(11, 12) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE bitacoras ADD COLUMN supabaseId TEXT DEFAULT NULL")
    }
}

// ==========================================
// DATABASE CONTAINER
// ==========================================

@Database(
    entities = [
        BitacoraEntity::class,
        ObraEntity::class,
        BudgetItemEntity::class,
        CrewMemberEntity::class,
        MatrixItemEntity::class,
        TaskEntity::class,
        PolizaEntity::class,
        VisitaMantenimientoEntity::class
    ],
    version = 16,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun bitacoraDao(): BitacoraDao
    abstract fun obraDao(): ObraDao
    abstract fun budgetItemDao(): BudgetItemDao
    abstract fun crewMemberDao(): CrewMemberDao
    abstract fun matrixItemDao(): MatrixItemDao
    abstract fun taskDao(): TaskDao
    abstract fun polizaDao(): PolizaDao
    abstract fun visitaMantenimientoDao(): VisitaMantenimientoDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        val MIGRATION_12_13 = object : Migration(12, 13) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE bitacoras ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'PENDING'")
                db.execSQL("UPDATE bitacoras SET sync_status = 'SYNCED' WHERE isSynced = 1")
            }
        }
        
        val MIGRATION_13_14 = object : Migration(13, 14) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE budget_items ADD COLUMN categoryName TEXT NOT NULL DEFAULT ''")
            }
        }

        val MIGRATION_14_15 = object : Migration(14, 15) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `polizas_garantia` (
                        `id` TEXT NOT NULL,
                        `folio` TEXT NOT NULL,
                        `clienteNombre` TEXT NOT NULL,
                        `nombreObra` TEXT NOT NULL,
                        `estado` TEXT NOT NULL,
                        `fechaInicio` TEXT NOT NULL,
                        `fechaFin` TEXT NOT NULL,
                        `periodicidad` TEXT NOT NULL,
                        `estadoMantenimiento` TEXT NOT NULL DEFAULT 'Pendiente',
                        `fechaProximoMantenimiento` TEXT,
                        PRIMARY KEY(`id`)
                    )
                """.trimIndent())

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `visitas_mantenimiento` (
                        `id` TEXT NOT NULL,
                        `polizaId` TEXT NOT NULL,
                        `numeroVisita` INTEGER NOT NULL,
                        `fechaProgramada` TEXT NOT NULL,
                        `estado` TEXT NOT NULL DEFAULT 'Pendiente',
                        `fechaRealizada` TEXT,
                        `checklistDataJson` TEXT NOT NULL DEFAULT '{}',
                        `evidenciaFotosJson` TEXT NOT NULL DEFAULT '[]',
                        `notasVisita` TEXT NOT NULL DEFAULT '',
                        `firmaBase64` TEXT,
                        `syncStatus` TEXT NOT NULL DEFAULT 'SYNCED',
                        PRIMARY KEY(`id`)
                    )
                """.trimIndent())
            }
        }

        val MIGRATION_15_16 = object : Migration(15, 16) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL("ALTER TABLE polizas_garantia ADD COLUMN clienteDireccion TEXT NOT NULL DEFAULT ''")
            }
        }

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "esol_bitacoras_db"
                )
                .addMigrations(MIGRATION_9_10, MIGRATION_10_11, MIGRATION_11_12, MIGRATION_12_13, MIGRATION_13_14, MIGRATION_14_15, MIGRATION_15_16)
                .fallbackToDestructiveMigrationOnDowngrade()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
