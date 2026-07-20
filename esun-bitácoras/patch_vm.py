import codecs

path = r"C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\viewmodel\BitacoraViewModel.kt"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
    
target = 'val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())'
replace = 'val dateStr = _customReportDate.value ?: SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date())\n            _customReportDate.value = null'

if target in content:
    content = content.replace(target, replace)
    hook = 'private val _userRole = MutableStateFlow'
    prop = '''private val _customReportDate = MutableStateFlow<String?>(null)
    val customReportDate = _customReportDate.asStateFlow()

    fun setCustomReportDate(dateStr: String?) {
        _customReportDate.value = dateStr
    }

    '''
    content = content.replace(hook, prop + hook)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('ViewModel Updated')
else:
    print('Target not found in ViewModel')
