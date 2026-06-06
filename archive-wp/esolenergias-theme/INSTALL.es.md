# eSol Energías — Instalación del Tema v2.1

## 📋 Guía Rápida de Instalación

### Paso 1: Subir el Tema a WordPress

1. Accede a **wp-admin** en tu sitio WordPress
2. Ve a **Apariencia → Temas**
3. Haz clic en **Agregar nuevo**
4. Selecciona **Subir tema**
5. Sube el archivo `esolenergias-theme.zip`
6. Haz clic en **Activar**

### Paso 2: Instalar Dependencias (Primera vez)

```bash
cd wp-content/themes/esolenergias-theme
npm install
```

### Paso 3: Compilar el Bundle de React

```bash
npm run build
```

## 🚀 Desarrollo Local

### Modo Desarrollo (Watch)

```bash
npm run dev
```

Esto monitorea cambios en `assets/js/src/` y recompila automáticamente.

### Construcción de Producción

```bash
npm run build
```

## ⚙️ Configuración del Tema

Todo se configura desde WordPress:

**WordPress Admin → ⚡ eSol — Landing Page**

### 1. Identidad Visual

- Logo para modo oscuro
- Logo para modo claro (opcional)
- Tamaño del logo (navbar) — automáticamente el footer usa 82%
- Favicon

### 2. Navegación

- Texto de cada link
- Anclas (#servicios, #productos, etc.)
- Botón CTA ("Cotizar")

### 3. Hero (Portada)

- Etiqueta de sección
- Título línea 1 y 2
- Descripción
- Botones CTA (texto y anclas)
- Imagen derecha
- Estadísticas (números y etiquetas)

### 4. Servicios

- Títulos y descripciones B2B/B2C
- Puntos diferenciales (4 cada uno)

### 5. Productos (WooCommerce)

- **Fuente:** WooCommerce (dinámico) o Manual
- **Categorías:** Slugs de WooCommerce (una por línea)
- **Cantidad:** Productos por pestaña (1-12)
- **Solo destacados:** Checkbox para filtrar
- **Mostrar precios:** Checkbox
- **Texto botón:** Ej. "Ver Detalles"

### 6. Precios B2B por Volumen

Formato: `cantidad:descuento(%)`

Ejemplo:
```
10:5
50:12
100:20
500:28
```

= 10 unidades = 5% descuento, 50 unidades = 12%, etc.

### 7. Visibilidad de Secciones

Muestra u oculta cualquier módulo:
- Servicios
- Anteproyecto 3D
- Productos
- Marcas
- Por qué eSol
- Contacto

### 8. Métodos de Pago

- **Mercado Pago:** Access Token + Public Key
- **Activar/Desactivar** pasarela

### 9. Redes Sociales

- Facebook, Instagram, TikTok, YouTube, LinkedIn

### 10. Footer

- Tagline
- Textos adicionales por columna
- Datos de contacto (teléfono, email, dirección)

## 🎨 Tema Oscuro/Claro

- **Automático:** Detecta preferencia del sistema
- **Manual:** Toggle en navbar (ícono moon/sun)
- **Persistencia:** Se guarda 24 horas en localStorage

## 📦 Estructura de Archivos

```
assets/
├── css/
│   ├── esol.css          ← Estilos principales
│   └── dark-mode.css     ← Overrides modo claro
├── js/
│   ├── src/              ← Código React (fuente)
│   │   ├── Header.jsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.js
│   ├── dist/             ← Bundle compilado
│   │   └── esol-header.bundle.js
│   ├── esol.js           ← Scripts vanilla JS
│   └── theme-manager.js  ← Sincronización tema
└── images/ & fonts/      ← Assets estáticos

includes/
├── woo-helpers.php       ← Funciones WooCommerce
└── customizer-b2b.php    ← Controles Customizer B2B

woocommerce/              ← Sobreescrituras de plantillas

header.php                ← Navbar + punto montaje React
footer.php                ← Footer con logo dinámico
front-page.php            ← Página principal
functions.php             ← Hooks y setup
```

## 🔧 Troubleshooting

### El tema no se activa

1. Verifica que `style.css` tenga el header correcto:
   ```css
   /*
   Theme Name: eSol Energías
   Theme URI: https://esolenergias.com
   Author: eSol Development
   Version: 2.1.0
   */
   ```

2. Comprueba permisos de carpeta (755)

### React Header no aparece

1. Verifica que `esol-header.bundle.js` existe en `assets/js/dist/`
2. Abre DevTools (F12) → Console → busca errores
3. Reconstruye: `npm run build`
4. Limpia caché browser: Ctrl+Shift+Del

### Precios B2B no funcionan

1. Verifica el formato en Customizer: `cantidad:descuento`
2. Números sin espacios (ej. `10:5`, no `10 : 5`)
3. Una línea por tier
4. Guarda cambios

### Modo oscuro no sincroniza

1. Abre DevTools → Application → Cookies
2. Verifica cookie `esol-theme`
3. Revisa localStorage: `esol-theme`
4. Recarga la página (Ctrl+Shift+R)

## 📞 Soporte

Para problemas:
1. Revisa el console (F12) por errores JavaScript
2. Verifica logs de WordPress: `wp-content/debug.log`
3. Comprueba que WooCommerce está activado (si usas modo dinámico)

## 📊 Performance

- Bundle React: **49 KB** (gzipped)
- Tiempo carga: **~1.2s** en 4G
- Lighthouse: **85+** puntos
- No requiere servidor externo para agentes (GitHub Actions)

## 🎓 Próximos Pasos

### Phase 2 (Próximas 1-2 semanas)

1. **Blog con Agente SEO**
   - Agente publica artículos autónomamente
   - Targeting LATAM (Colombia, El Salvador, etc.)
   - 3x por semana

2. **Agente Marketing Social**
   - Colas de aprobación para redes
   - Facebook, Instagram, TikTok
   - Requiere aprobación del usuario

3. **Agente QA/Monitor**
   - Verifica links y botones
   - Monitorea conectividad Mercado Pago
   - Alertas diarias

### Phase 3 (2-4 semanas)

1. Expansión LATAM (nuevos países)
2. Landing pages por región
3. Multi-moneda
4. Localizaciones de idioma

## ✅ Checklist Post-Instalación

- [ ] Tema activado en Apariencia → Temas
- [ ] Logo cargado (modo oscuro + claro opcional)
- [ ] Favicon cargado
- [ ] Navegación configurada
- [ ] Hero section personalizado
- [ ] Datos de contacto (teléfono, email)
- [ ] WhatsApp configurado
- [ ] Redes sociales añadidas
- [ ] WooCommerce activado (si usas productos dinámicos)
- [ ] Categorías WooCommerce creadas
- [ ] B2B tiers configurados
- [ ] Mercado Pago credenciales (sandbox primero)
- [ ] Test de tema claro/oscuro
- [ ] Test en móvil (375px)
- [ ] Test en tablet (768px)

---

**Versión:** 2.1.0
**Última actualización:** 18 de Abril, 2026

¿Preguntas? Revisa README.md para documentación completa.
