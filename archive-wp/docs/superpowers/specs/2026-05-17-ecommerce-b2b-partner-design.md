# Spec: E-Commerce & B2B Partner Engine (Block 1)

**Status:** Draft  
**Date:** 2026-05-17  
**Goal:** Implement a robust WooCommerce integration with exclusive B2B volume pricing for logged-in "Partners".

## 1. User Architecture
- **New Role:** `esol_partner` (Installers/Distributors).
- **Registration:** Standard WordPress login/registration, with a manual approval workflow or a simple "Request Partner Access" form (TBD in Block 2).
- **Persistence:** Discounts only apply if `is_user_logged_in()` AND user has the `esol_partner` role.

## 2. Dynamic Pricing Logic
- **Base Pricing:** Public users see the standard MSRP.
- **Volume Tiers:** Read from WordPress Customizer (`esol_b2b_tiers`).
- **Hook Integration:**
    - `woocommerce_product_get_price`: Filter price display based on volume tiers for Partners.
    - `woocommerce_before_calculate_totals`: Apply bulk discounts in the cart dynamically.
- **Data Source:** Existing `includes/woo-helpers.php` will be expanded.

## 3. UI/UX Elements
- **Price Labels:** 
    - Public: "MSRP: $XXX.XX"
    - Partner: "Your Price: $XXX.XX" (with "Save XX%" badge).
- **B2B Table:** A clean, glassmorphism-styled table on the Single Product Page showing the tiers (e.g., 10+ units, 50+ units).
- **Call-to-Action:** Non-logged-in users see a "Log in to see Partner pricing" nudge.

## 4. Payment & Checkout
- **Mercado Pago:** Integration using the official WooCommerce plugin or custom API implementation based on Customizer credentials.
- **Taxes:** Handle Mexican VAT (16%) correctly.

## 5. Technical Stack
- **PHP:** WordPress Hooks (Filters/Actions).
- **CSS:** Custom styles in `esol.css` using theme variables.
- **WooCommerce:** Core templates and overrides.

## 6. Success Criteria
- [ ] A user with the `esol_partner` role sees lower prices when adding bulk quantities to the cart.
- [ ] A guest user sees only the standard price.
- [ ] The checkout process reflects the final discounted price.
- [ ] Customizer settings correctly drive the tier logic.
