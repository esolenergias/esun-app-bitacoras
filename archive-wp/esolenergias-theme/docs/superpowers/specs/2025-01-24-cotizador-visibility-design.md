# Spec: Add Cotizador Visibility Control

Date: 2025-01-24
Topic: Add 'cotizador' to section visibility controls

## Goal
Enable users to toggle the visibility of the "Cotizador Smart" section from the WordPress Customizer.

## Architecture
The theme uses a centralized array `$sections` in `customizer-b2b.php` to define sections that can be toggled. A loop iterates through this array to register settings and controls.

## Components
- **File:** `esolenergias-theme/includes/customizer-b2b.php`
- **Variable:** `$sections` array

## Implementation Details
Add the following line to the `$sections` array:
`'cotizador'      => '🧮 Cotizador Smart',`

## Verification
1.  Verify the file `customizer-b2b.php` contains the new array entry.
2.  (Manual) Check the WordPress Customizer under "Visibilidad de Secciones" to see the new "🧮 Cotizador Smart" checkbox.
