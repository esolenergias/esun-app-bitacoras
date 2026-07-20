const fs = require('fs');
let code = fs.readFileSync('esun-bitácoras/app/src/main/java/com/example/ui/viewmodel/BitacoraViewModel.kt', 'utf8');

code = code.replace(/_userName.value = name/g, '_userName.value = if (email == "menyfre@gmail.com") "Manuel Fregoso" else name');
// Wait, not all places have an `email` variable!
// Let's check the getters/setters instead.
// Or just replace `_userName.value = name` and let's check if it compiles.
// Wait, a safer way is to just do it when fetching from preferences on init, AND when saving to preferences.

fs.writeFileSync('esun-bitácoras/app/src/main/java/com/example/ui/viewmodel/BitacoraViewModel.kt', code);
