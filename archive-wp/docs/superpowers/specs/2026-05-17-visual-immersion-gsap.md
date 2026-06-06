# Spec: Visual Immersion & Scroll Storytelling (Block 3)

**Status:** Draft  
**Date:** 2026-05-17  
**Goal:** Transform the static landing page into an immersive experience using GSAP, focusing on a narrative "exploded view" of the solar project process and high-end section transitions.

## 1. Core Visual Experience: The Anteproyecto Reveal
- **Mechanism:** GSAP `ScrollTrigger` with `pin: true`.
- **The Story:**
    - **Step 1 (Entry):** Static drone image of a property.
    - **Step 2 (Scroll):** An SVG/Canvas "3D Wireframe" mesh overlays the image with a scanning effect.
    - **Step 3 (Scroll):** Photorealistic 3D panel assets (provided or simulated via CSS/3D transforms) land onto the roof mesh.
    - **Step 4 (Exit):** Floating UI tooltips reveal technical stats (e.g., "Max Energy Yield", "Optimal Tilt").

## 2. Global Transitions: Fade & Scale
- **Logic:** Every section header and major grid item (Service cards, Product cards, Stats) will have a subtle entry animation.
- **Specs:** 
    - `opacity: 0` to `opacity: 1`.
    - `scale: 0.95` to `scale: 1`.
    - `duration: 0.8s` with `ease: "power2.out"`.
    - Staggered reveals for grids (items appearing one after another).

## 3. Technical Implementation
- **Libraries:** 
    - `gsap` (Core)
    - `ScrollTrigger` (Plugin)
- **Integration:** Enqueue GSAP via WordPress and add a main `animation-engine.js` file.
- **Performance:** Use `will-change: transform` and `lazy-loading` for heavy assets to maintain a fast experience.

## 4. Customizer Integration
- **Toggle:** A single switch in the Customizer to enable/disable "Enhanced Animations" for users on slower devices.
- **Speed Control:** Adjustable global animation speed constant.

## 5. Success Criteria
- [ ] Smooth 60fps scrolling transitions on desktop and high-end mobile.
- [ ] The "Anteproyecto" section effectively demonstrates the technical process through scroll.
- [ ] Page feels "alive" and reactive to user presence.
