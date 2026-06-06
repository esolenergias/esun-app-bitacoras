# Add Cotizador Visibility Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 'cotizador' to the section visibility controls in `customizer-b2b.php`.

**Architecture:** Update the `$sections` array in `customizer-b2b.php` to include the 'cotizador' key. This will automatically register the setting and control via an existing loop.

**Tech Stack:** PHP, WordPress Customizer.

---

### Task 1: Update Visibility Sections Array

**Files:**
- Modify: `C:\Users\mafre\Esolenergias\esolenergias-theme\includes\customizer-b2b.php`

- [ ] **Step 1: Locate and update the `$sections` array**

Modify `C:\Users\mafre\Esolenergias\esolenergias-theme\includes\customizer-b2b.php` around line 174.

```php
// Context:
// $sections = [
//     'servicios'      => '🔧 Servicios (B2B + B2C)',
//     'anteproyecto'   => '🎨 Anteproyecto 3D',
//     'productos'      => '📦 Productos',
//     'marcas'         => '🏷️ Marcas Destacadas',
//     'por_que_esol'   => '⭐ Por qué eSol',
//     'contacto'       => '📞 Contacto',
// ];

// New code:
$sections = [
    'servicios'      => '🔧 Servicios (B2B + B2C)',
    'anteproyecto'   => '🎨 Anteproyecto 3D',
    'productos'      => '📦 Productos',
    'marcas'         => '🏷️ Marcas Destacadas',
    'por_que_esol'   => '⭐ Por qué eSol',
    'cotizador'      => '🧮 Cotizador Smart',
    'contacto'       => '📞 Contacto',
];
```

- [ ] **Step 2: Verify the change**

Check that the array now includes the new entry and the syntax is correct.

- [ ] **Step 3: Commit**

```bash
git add C:\Users\mafre\Esolenergias\esolenergias-theme\includes\customizer-b2b.php
git commit -m "feat: add cotizador visibility control"
```
