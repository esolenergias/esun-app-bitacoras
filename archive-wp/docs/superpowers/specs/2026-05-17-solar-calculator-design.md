# Spec: Smart Solar Calculator Dashboard (Block 2)

**Status:** Draft  
**Date:** 2026-05-17  
**Goal:** Build a high-precision, interactive React dashboard for solar estimation with automatic CFE tariff logic and dynamic ROI visualization.

## 1. Functional Overview
- **Type:** React Island (mounted on a specific WP page or section).
- **Inputs (Reactive Sliders/Toggles):**
    - Monthly Electricity Bill ($ MXN).
    - Available Roof Space (m²).
    - Location (State/City for Solar Radiation constants).
- **Core Logic:**
    - **Tariff Detection:** Automatically switches to DAC (High Consumption) logic if monthly bill > $3,000 MXN (configurable).
    - **System Sizing:** Recommends kWp and number of panels based on inputs.
    - **ROI Engine:** Calculates payback period (years) and 25-year cumulative savings.

## 2. Visual Components
- **Dashboard Layout:** A clean, single-screen interface using the theme's glassmorphism style.
- **ROI Chart:** A dynamic line/bar chart showing the "Break-even point" where savings exceed investment.
- **Stats Bar:** Real-time updates for:
    - Estimated Panels needed.
    - CO2 offset (trees planted equivalent).
    - Monthly saving percentage.

## 3. WordPress Integration
- **Mount Point:** A new custom block or shortcode usable in `front-page.php` or a dedicated `/cotizador` page.
- **Configuration:** Base kWh rates, panel wattage (e.g., 550W), and installation cost per Watt will be editable via the WordPress Customizer to keep the tool "smart" and up-to-date.
- **Lead Capture:** Integrates with the existing AJAX contact form (Task 4 from Block 1 logic) to send the technical summary to eSol sales.

## 4. Technical Stack
- **Frontend:** React 18, GSAP (for chart/value transitions), Recharts or Chart.js (for the ROI graph).
- **Backend:** WordPress REST API (optional for lead saving) or direct AJAX.
- **Styles:** Vanilla CSS with theme tokens (`--gold`, `--bg3`, etc.).

## 5. Success Criteria
- [ ] User can move a slider and see the ROI graph update instantly.
- [ ] Logic correctly identifies DAC tariff vs. Regular Domestic.
- [ ] Responsive design works on mobile devices.
- [ ] Lead capture sends a formatted summary of the calculation.
