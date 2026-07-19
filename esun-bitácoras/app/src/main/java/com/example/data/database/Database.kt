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
    val concepto_name: String? = null
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
    val totalBudget: Double
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



// ==========================================
// ROOM DAOS
// ==========================================

@Dao
interface BitacoraDao {
    @Query("SELECT * FROM bitacoras ORDER BY date DESC, id DESC")
    fun getAllBitacoras(): Flow<List<BitacoraEntity>>

    @Query("SELECT * FROM bitacoras WHERE isSynced = 0")
    suspend fun getUnsyncedBitacoras(): List<BitacoraEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBitacora(bitacora: BitacoraEntity): Long

    @Update
    suspend fun updateBitacora(bitacora: BitacoraEntity)

    @Delete
    suspend fun deleteBitacora(bitacora: BitacoraEntity)

    @Query("UPDATE bitacoras SET isSynced = 1 WHERE id = :id")
    suspend fun markAsSynced(id: Int)
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
        TaskEntity::class
    ],
    version = 11,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun bitacoraDao(): BitacoraDao
    abstract fun obraDao(): ObraDao
    abstract fun budgetItemDao(): BudgetItemDao
    abstract fun crewMemberDao(): CrewMemberDao
    abstract fun matrixItemDao(): MatrixItemDao
    abstract fun taskDao(): TaskDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "esol_bitacoras_db"
                )
                .fallbackToDestructiveMigration()
                .addMigrations(MIGRATION_9_10, MIGRATION_10_11)
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
