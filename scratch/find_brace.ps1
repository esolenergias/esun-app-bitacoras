 = Get-Content C:\Users\mafre\Esolenergias\src\components\BitacorasApp.tsx
 = 0
 = False
for ( = 0;  -lt .Count; ++) {
     = []
    if ( -match "export default function BitacorasApp") {  = True }
    if () {
         += (.ToCharArray() | Where-Object {  -eq '{' }).Count
         -= (.ToCharArray() | Where-Object {  -eq '}' }).Count
        if ( -eq 0 -and .Contains("}")) {
            "Closed at line " + ( + 1)
            break
        }
    }
}
