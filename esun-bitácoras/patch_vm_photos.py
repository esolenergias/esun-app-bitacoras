import codecs

path = r"C:\Users\mafre\Esolenergias\esun-bitácoras\app\src\main\java\com\example\ui\viewmodel\BitacoraViewModel.kt"
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

target1 = '''    private val _capturedPhotoUri = MutableStateFlow<String?>(null)
    val capturedPhotoUri = _capturedPhotoUri.asStateFlow()'''
replace1 = '''    private val _capturedPhotoUris = MutableStateFlow<List<String>>(emptyList())
    val capturedPhotoUris = _capturedPhotoUris.asStateFlow()'''

target2 = '''fun setCapturedPhotoUri(uri: String?) { _capturedPhotoUri.value = uri }'''
replace2 = '''fun addCapturedPhotoUri(uri: String) { _capturedPhotoUris.value = _capturedPhotoUris.value + uri }
    fun removeCapturedPhotoUri(uri: String) { _capturedPhotoUris.value = _capturedPhotoUris.value - uri }
    fun clearCapturedPhotoUris() { _capturedPhotoUris.value = emptyList() }'''

target3 = '''photoUri = _capturedPhotoUri.value,'''
replace3 = '''photoUri = _capturedPhotoUris.value.joinToString(","),'''

target4 = '''_capturedPhotoUri.value = null'''
replace4 = '''_capturedPhotoUris.value = emptyList()'''

content = content.replace(target1, replace1).replace(target2, replace2).replace(target3, replace3).replace(target4, replace4)

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(content)
print('BitacoraViewModel patched')
