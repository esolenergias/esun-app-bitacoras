# Fix: Unresolved reference 'Migration'

The compilation error `Unresolved reference 'Migration'` in `Database.kt` was caused by an incorrect import statement. The `Migration` class in the Room persistence library is located in the `androidx.room.migration` package, not directly in `androidx.room`.

## Changes Made

### [Database.kt](file:///C:/Users/mafre/Esolenergias/esun-bitácoras/app/src/main/java/com/example/data/database/Database.kt)

Updated the import for `Migration`:
```diff
-import androidx.room.Migration
+import androidx.room.migration.Migration
```

## Verification Results

### Automated Tests
- Ran `./gradlew :app:compileDebugKotlin` which now completes successfully.
