const fs = require('fs');
let code = fs.readFileSync('esun-bitácoras/app/src/main/java/com/example/ui/screens/ReportScreen.kt', 'utf8');

// 1. Map Menyfre
const nameRegex = /val residenteReal = projectDetails\["residente"\] \?\: userName/;
const nameReplacement = `var residenteReal = projectDetails["residente"] ?: userName
                            var safeUserName = userName
                            if (safeUserName.contains("Menyfre", ignoreCase = true) || safeUserName.contains("Meny", ignoreCase = true)) {
                                safeUserName = "Manuel Fregoso"
                            }
                            if (residenteReal.contains("Menyfre", ignoreCase = true) || residenteReal.contains("Meny", ignoreCase = true)) {
                                residenteReal = "Manuel Fregoso"
                            }`;
code = code.replace(nameRegex, nameReplacement);

const generateRegex = /generatePdfReport\(\s*context = context,\s*fileName = fileName,\s*projectName = activeProjectName,\s*reporterName = userName,\s*bitacoras = bitacoras,/;
const generateReplacement = `generatePdfReport(
                                    context = context,
                                    fileName = fileName,
                                    projectName = activeProjectName,
                                    reporterName = safeUserName,
                                    bitacoras = bitacoras,`;
code = code.replace(generateRegex, generateReplacement);

// 2. Fix logo ratio
const logoRegex = /val logoRect = android\.graphics\.RectF\(margin, margin, margin \+ 120f, margin \+ 40f\)/;
const logoReplacement = `val targetHeight = 40f
            val aspectRatio = logoBitmap.width.toFloat() / logoBitmap.height.toFloat()
            val targetWidth = targetHeight * aspectRatio
            val logoRect = android.graphics.RectF(margin, margin, margin + targetWidth, margin + targetHeight)`;
code = code.replace(logoRegex, logoReplacement);

fs.writeFileSync('esun-bitácoras/app/src/main/java/com/example/ui/screens/ReportScreen.kt', code);
console.log('Fixed ReportScreen');
