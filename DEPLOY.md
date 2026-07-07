# ESOL Energías — Guía de Deploy a Hostinger

## Configuración FTP

| Campo | Valor |
|---|---|
| **Host** | `ftp://esolenergias.com` |
| **Usuario** | `u821937813.esolenergias.com` |
| **Contraseña** | `h+[g5P./*yW5Prd` |
| **Web Root** | `/` (raíz FTP) |

> ⚠️ **IMPORTANTE:** El directorio `/public_html/` existe en el FTP pero **NO es el web root**.
> El dominio `esolenergias.com` sirve desde la **raíz `/` del FTP**.
> Siempre subir archivos a `/`, nunca a `/public_html/`.

---

## Estructura del servidor (web root `/`)

```
/ (FTP root = web root)
├── index.html          ← Punto de entrada React SPA
├── .htaccess           ← Routing SPA para Apache
├── assets/
│   ├── index-HASH.js   ← Bundle JS (hash cambia con cada build)
│   ├── index-HASH.css  ← Bundle CSS (hash cambia con cada build)
│   └── logos/
├── esol-cfe-manager/   ← App separada CFE Manager
├── Paneles intro/      ← Imágenes webp animación
├── Favicon.png
├── Fotografia.webp
├── Fotomontaje.webp
├── Fotomontaje.webp
├── icons.svg
├── Ingenieria.webp
├── Logo_esol_b.png
├── Logo_esol_w.png
└── default.php         ← Hostinger default (no tocar)
```

---

## Scripts de deploy

### Deploy parcial (cambios en código — uso normal)
```powershell
powershell -ExecutionPolicy Bypass -File ftp_deploy.ps1
```
- Hace build automático
- Sube solo `index.html`, JS bundle y CSS
- Elimina automáticamente assets obsoletos con hashes viejos

### Deploy completo (primera vez o cambios en imágenes/estáticos)
```powershell
powershell -ExecutionPolicy Bypass -File ftp_deploy.ps1 -Full
```

---

## Flujo de trabajo recomendado

1. Hacer cambios en el código
2. Probar localmente con `npm run dev`
3. Ejecutar `powershell -ExecutionPolicy Bypass -File ftp_deploy.ps1`
4. Verificar en `https://esolenergias.com`
