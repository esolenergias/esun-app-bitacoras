# Fix: Compilation errors in MainActivity and BitacoraViewModel

I have fixed the compilation issues that were preventing the project from building.

## Changes Made

### UI Screens

#### [BitacoraScreen.kt](file:///C:/Users/mafre/Esolenergias/esun-bitácoras/app/src/main/java/com/example/ui/screens/BitacoraScreen.kt)
- Added the missing `onNavigateToReportDetail: (Int) -> Unit` parameter to the `BitacoraScreen` composable function signature. This was being passed from `MainActivity.kt` but wasn't defined in the function.

### ViewModel

#### [BitacoraViewModel.kt](file:///C:/Users/mafre/Esolenergias/esun-bitácoras/app/src/main/java/com/example/ui/viewmodel/BitacoraViewModel.kt)
- Removed the unused and broken `refreshSyncStatus()` function which was calling a non-existent method in `SyncRepository`.

## Verification Results

### Build Verification
- Ran `./gradlew :app:compileDebugKotlin`
- **Result**: `Build finished successfully.`

> [!NOTE]
> The project now compiles correctly and is ready for deployment or further development.
