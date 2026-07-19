# Fix compilation error: No parameter with name 'onNavigateToReportDetail' found

The project fails to build because `MainActivity.kt` passes a parameter `onNavigateToReportDetail` to the `BitacoraScreen` composable, but this parameter is missing from the function definition in `BitacoraScreen.kt`.

## Proposed Changes

### UI Components

#### [MODIFY] [BitacoraScreen.kt](file:///C:/Users/mafre/Esolenergias/esun-bitácoras/app/src/main/java/com/example/ui/screens/BitacoraScreen.kt)
- Add `onNavigateToReportDetail: (Int) -> Unit` to the `BitacoraScreen` function signature.
- (Optional) Use this parameter if there's any UI element that should navigate to report details. Based on current code, it seems it might be intended for future use or was recently removed from the UI but left in the call site.

## Verification Plan

### Automated Tests
- Run `./gradlew :app:compileDebugKotlin` to ensure the project builds successfully.

### Manual Verification
- Verify that the app starts and the "Bitácora" screen works as expected.
