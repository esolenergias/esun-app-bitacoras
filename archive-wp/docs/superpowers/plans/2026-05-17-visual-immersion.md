# Visual Immersion & Scroll Storytelling (Block 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform eSol Energías into an immersive experience using GSAP ScrollTrigger, featuring a multi-layered "Anteproyecto" reveal and smooth global transitions.

**Architecture:** We will enqueue GSAP and its ScrollTrigger plugin via WordPress. A dedicated `animation-engine.js` will handle the logic. Global animations will target specific classes like `.reveal-gsap`. The Anteproyecto section will be refactored to support pinning and layer stacking.

**Tech Stack:** JavaScript (GSAP 3.x, ScrollTrigger), PHP (WordPress Enqueue), CSS (Layering & Transitions)

---

### Task 1: Enqueue GSAP and Animation Controller

**Files:**
- Modify: `esolenergias-theme/functions.php`
- Create: `esolenergias-theme/assets/js/animation-engine.js`
- Modify: `esolenergias-theme/includes/customizer-b2b.php`

- [ ] **Step 1: Add Customizer toggle for animations**

Add this to the `esol_identity` section in `includes/customizer-b2b.php`.

```php
$c->add_setting( 'esol_enable_gsap', [ 'default' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ] );
$c->add_control( 'esol_enable_gsap', [
    'label' => '✨ Activar Animaciones Avanzadas (GSAP)',
    'section' => 'esol_identity',
    'type' => 'checkbox',
    'description' => 'Desactiva esto si el sitio se siente lento en dispositivos antiguos.'
] );
```

- [ ] **Step 2: Enqueue scripts in functions.php**

```php
add_action( 'wp_enqueue_scripts', function () {
    if ( ! get_theme_mod( 'esol_enable_gsap', true ) ) return;

    // Enqueue GSAP from CDN for performance
    wp_enqueue_script( 'gsap-core', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', [], '3.12.5', true );
    wp_enqueue_script( 'gsap-scroll-trigger', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', ['gsap-core'], '3.12.5', true );
    
    // Enqueue our controller
    wp_enqueue_script( 'esol-animation-engine', get_template_directory_uri() . '/assets/js/animation-engine.js', ['gsap-scroll-trigger'], '1.0.0', true );
}, 20 );
```

- [ ] **Step 3: Create initial controller file**

```javascript
// assets/js/animation-engine.js
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        
        gsap.registerPlugin(ScrollTrigger);
        console.log('eSol Animation Engine Initialized');
        
        // Initialize sub-modules
        initGlobalTransitions();
    });

    function initGlobalTransitions() {
        // To be implemented in Task 2
    }
})();
```

---

### Task 2: Implement Global "Fade & Scale" Transitions

**Files:**
- Modify: `esolenergias-theme/assets/js/animation-engine.js`
- Modify: `esolenergias-theme/assets/css/esol.css`

- [ ] **Step 1: Add helper classes in CSS**

```css
/* Base state for GSAP targets to avoid flash of unstyled content */
.gsap-reveal {
    opacity: 0;
    will-change: transform, opacity;
}
```

- [ ] **Step 2: Implement transition logic in animation-engine.js**

```javascript
function initGlobalTransitions() {
    // Reveal headers and cards
    const targets = document.querySelectorAll('.section-header, .service-card, .product-card, .diff-item, .contact-item');
    
    targets.forEach(el => {
        el.classList.add('gsap-reveal');
        
        gsap.fromTo(el, 
            { opacity: 0, y: 30, scale: 0.95 },
            { 
                opacity: 1, 
                y: 0, 
                scale: 1, 
                duration: 0.8, 
                ease: "power2.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            }
        );
    });
}
```

---

### Task 3: Refactor Anteproyecto Section for Storytelling

**Files:**
- Modify: `esolenergias-theme/front-page.php`
- Modify: `esolenergias-theme/assets/css/esol.css`

- [ ] **Step 1: Create the layered structure in PHP**

Replace the existing image area in the `#anteproyecto` section with a container of stacked layers.

```php
<div class="ante-story-container reveal-left">
    <div class="ante-layers">
        <img src="<?php echo $ante_img; ?>" class="ante-layer layer-base" alt="Dron Original">
        <div class="ante-layer layer-mesh"></div>
        <div class="ante-layer layer-panels"></div>
        <div class="ante-layer layer-data">
            <div class="tech-tag tag-1">550W Panels</div>
            <div class="tech-tag tag-2">Optimal ROI</div>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Add Layer Styles in CSS**

```css
.ante-story-container { position: relative; width: 100%; height: 450px; overflow: hidden; border-radius: 12px; }
.ante-layers { position: relative; width: 100%; height: 100%; }
.ante-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.layer-mesh { background: url('path/to/mesh-pattern.svg'); opacity: 0; mix-blend-mode: screen; }
.layer-panels { background: url('path/to/panels-overlay.png'); opacity: 0; transform: translateY(-20px); }
.layer-data { opacity: 0; display: flex; align-items: center; justify-content: center; }
```

---

### Task 4: Implement the "Exploded View" Animation

**Files:**
- Modify: `esolenergias-theme/assets/js/animation-engine.js`

- [ ] **Step 1: Implement ScrollTrigger Timeline**

```javascript
function initAnteproyectoStory() {
    const section = document.querySelector('#anteproyecto');
    if (!section) return;

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=150%", // Keep pinned for 1.5 screen heights
            pin: true,
            scrub: 1,
            markers: false
        }
    });

    tl.to('.layer-mesh', { opacity: 0.6, duration: 1 })
      .to('.layer-panels', { opacity: 1, y: 0, duration: 1 }, "+=0.5")
      .to('.layer-data', { opacity: 1, scale: 1.1, duration: 1 }, "+=0.5");
}
```

- [ ] **Step 2: Initialize in DOMContentLoaded**

Add `initAnteproyectoStory();` to the event listener in Task 1.

---

### Task 5: Performance & Cleanup

**Files:**
- Modify: `esolenergias-theme/assets/js/esol.js`

- [ ] **Step 1: Disable old IntersectionObserver**

The old `IntersectionObserver` in `esol.js` for `.reveal` might conflict with GSAP. Modify `esol.js` to only run if GSAP is disabled.

```javascript
// Inside esol.js
if (!document.documentElement.hasAttribute('data-gsap-enabled')) {
    // Run old intersection observer reveal logic
}
```

- [ ] **Step 2: Add data attribute in header.php**

```php
<html <?php language_attributes(); ?> data-gsap-enabled="<?php echo get_theme_mod('esol_enable_gsap', true) ? 'true' : 'false'; ?>">
```
