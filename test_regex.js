const text = "del 19 FEB 26 al 17 ABR 26 1752 S8M7O00 —— SASTO0O 1.400";
const normalizedText = text.replace(/\s+/g, ' ');
const pdbtTableRegex = /(?:de[lI1!]\s*)?(\d{1,2})\s*([A-Z]{3})\s*(\d{2})\s*(?:a[lI1!]\s*|a\s+)(\d{1,2})\s*([A-Z]{3})\s*(\d{2})\s*(\d{1,6})/gi;

let pMatch;
while ((pMatch = pdbtTableRegex.exec(normalizedText)) !== null) {
  console.log("MATCH:", pMatch[5], pMatch[6], pMatch[7]);
}
