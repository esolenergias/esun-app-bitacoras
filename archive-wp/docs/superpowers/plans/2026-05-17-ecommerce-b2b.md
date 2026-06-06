# E-Commerce & B2B Partner Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement WooCommerce B2B volume pricing exclusively for logged-in users with the `esol_partner` role, updating product displays and cart totals dynamically.

**Architecture:** We will create a new WordPress user role (`esol_partner`). Then, we will use WooCommerce filters (`woocommerce_product_get_price`, `woocommerce_before_calculate_totals`) to modify prices based on the quantity and the customizer tiers only if the user has this role. We will also update the frontend templates to show a pricing table and conditional messaging.

**Tech Stack:** PHP, WordPress/WooCommerce Hooks, Vanilla CSS

---

### Task 1: Create the `esol_partner` Role

**Files:**
- Modify: `esolenergias-theme/functions.php`

- [ ] **Step 1: Add the role creation logic**

Append this code to `esolenergias-theme/functions.php` to register the new role.

```php

/* ══════════════════════════════════════════════
   6. B2B PARTNER ROLE
══════════════════════════════════════════════ */
add_action( 'init', 'esol_add_partner_role' );
function esol_add_partner_role() {
    if ( ! get_role( 'esol_partner' ) ) {
        // Clone customer role capabilities as a base
        $customer_role = get_role( 'customer' );
        $caps = $customer_role ? $customer_role->capabilities : [];
        add_role( 'esol_partner', 'eSol Partner', $caps );
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add esolenergias-theme/functions.php
git commit -m "feat: register esol_partner user role"
```

---

### Task 2: Implement B2B Cart Discount Logic

**Files:**
- Modify: `esolenergias-theme/includes/woo-helpers.php`

- [ ] **Step 1: Add the cart calculation hook**

Append this code to the end of `esolenergias-theme/includes/woo-helpers.php` to calculate and apply discounts in the cart.

```php

/**
 * Apply B2B discounts in the cart based on quantity
 */
add_action( 'woocommerce_before_calculate_totals', 'esol_apply_b2b_cart_discounts', 10, 1 );
function esol_apply_b2b_cart_discounts( $cart ) {
    if ( is_admin() && ! defined( 'DOING_AJAX' ) ) return;
    if ( ! is_user_logged_in() || ! current_user_can( 'esol_partner' ) ) return;

    // Avoid multiple calculations in a single load
    if ( did_action( 'woocommerce_before_calculate_totals' ) >= 2 ) return;

    foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
        $quantity = $cart_item['quantity'];
        $product = $cart_item['data'];
        
        // Get original price (ignoring previous discounts in this cycle)
        $original_price = $product->get_regular_price(); 
        if ( ! $original_price ) {
             $original_price = $product->get_price();
        }

        if ( $original_price && $quantity > 0 ) {
            $discount_percentage = esol_get_discount( $quantity );
            if ( $discount_percentage > 0 ) {
                $discount_amount = ( $original_price * $discount_percentage ) / 100;
                $new_price = $original_price - $discount_amount;
                $cart_item['data']->set_price( $new_price );
            }
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add esolenergias-theme/includes/woo-helpers.php
git commit -m "feat: apply B2B volume discounts in woocommerce cart for partners"
```

---

### Task 3: Update Volume Pricing Display Table

**Files:**
- Modify: `esolenergias-theme/includes/woo-helpers.php`

- [ ] **Step 1: Restrict table visibility and add styling**

Replace the existing `esol_format_volume_pricing` function in `esolenergias-theme/includes/woo-helpers.php` with this updated version that checks for the partner role and adds a glassmorphism style.

```php
/**
 * Format volume pricing display
 * @param int $product_id WooCommerce product ID
 * @return string HTML formatted pricing table or empty
 */
function esol_format_volume_pricing( $product_id = 0 ) {
    if ( ! $product_id || ! esol_woo_active() ) return '';

    $product = wc_get_product( $product_id );
    if ( ! $product ) return '';

    $base_price = $product->get_regular_price() ? $product->get_regular_price() : $product->get_price();
    if ( ! $base_price ) return '';

    $tiers = esol_get_b2b_tiers();
    if ( empty( $tiers ) ) return '';

    ob_start();
    
    if ( ! is_user_logged_in() || ! current_user_can( 'esol_partner' ) ) {
        ?>
        <div class="esol-b2b-nudge" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(196,152,37,0.3); border-radius: 8px; padding: 15px; margin-top: 20px; text-align: center; backdrop-filter: blur(10px);">
            <p style="margin: 0; font-size: 0.9rem; color: var(--tx);">
                <svg width="18" height="18" fill="none" stroke="var(--gold)" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 5px; display: inline-block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                Inicia sesión como <strong>Partner</strong> para ver precios de mayoreo.
            </p>
            <a href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" class="btn-cotizar" style="padding: 8px 16px; font-size: 0.8rem; margin-top: 10px; display: inline-block;">Acceso Partner</a>
        </div>
        <?php
        return ob_get_clean();
    }
    
    // Glassmorphism table for logged-in partners
    ?>
    <div class="esol-volume-pricing" style="background: rgba(20,20,16,0.6); border: 1px solid var(--bgborder); border-radius: 12px; padding: 16px; margin-top: 20px; backdrop-filter: blur(12px);">
        <p style="font-size: 0.85rem; margin-bottom: 12px; color: var(--gold-txt); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="vertical-align: sub; margin-right: 4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
            Precios Partner B2B
        </p>
        <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="border-bottom: 1px solid var(--bgborder); color: var(--txmuted);">
                    <th style="padding: 8px 0; font-weight: 500;">Volumen</th>
                    <th style="padding: 8px 0; font-weight: 500; text-align: center;">Ahorro</th>
                    <th style="padding: 8px 0; font-weight: 500; text-align: right;">Unitario</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color: var(--tx);">1 - <?php echo (isset($tiers[0]) ? $tiers[0]['qty'] - 1 : '∞'); ?> un.</td>
                    <td style="padding: 8px 0; text-align: center; color: var(--txmuted);">-</td>
                    <td style="padding: 8px 0; text-align: right; color: var(--tx);"><?php echo wc_price( $base_price ); ?></td>
                </tr>
                <?php foreach ( $tiers as $tier ): ?>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color: var(--tx);">Desde <?php echo $tier['qty']; ?> un.</td>
                    <td style="padding: 8px 0; text-align: center; color: var(--gold-light); font-weight: 600;">-<?php echo $tier['discount']; ?>%</td>
                    <td style="padding: 8px 0; text-align: right; color: var(--tx); font-weight: 500;">
                        <?php echo wc_price( esol_apply_b2b_discount( $base_price, $tier['qty'] ) ); ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
    return ob_get_clean();
}
```

- [ ] **Step 2: Commit**

```bash
git add esolenergias-theme/includes/woo-helpers.php
git commit -m "feat: restrict B2B pricing table to partners and update UI"
```

---

### Task 4: Display Pricing Table on Single Product Page

**Files:**
- Create: `esolenergias-theme/woocommerce/single-product/price.php`

- [ ] **Step 1: Create WooCommerce template override**

Create the file `esolenergias-theme/woocommerce/single-product/price.php` to inject our custom pricing table under the standard price.

```php
<?php
/**
 * Single Product Price
 * Overrides WooCommerce template to inject B2B pricing table
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

global $product;
?>
<p class="<?php echo esc_attr( apply_filters( 'woocommerce_product_price_class', 'price' ) ); ?>"><?php echo $product->get_price_html(); ?></p>

<?php
// Inject our custom B2B pricing table/nudge right below the main price
if ( function_exists( 'esol_format_volume_pricing' ) ) {
    echo esol_format_volume_pricing( $product->get_id() );
}
?>
```

- [ ] **Step 2: Commit**

```bash
git add esolenergias-theme/woocommerce/single-product/price.php
git commit -m "feat: override single product price template to inject B2B table"
```

---

### Task 5: Dynamic Catalog Prices

**Files:**
- Modify: `esolenergias-theme/includes/woo-helpers.php`

- [ ] **Step 1: Filter price HTML for catalog view**

We want the product cards in the catalog (and homepage) to hint at the wholesale price if the user is a partner. Add this hook to `esolenergias-theme/includes/woo-helpers.php`.

```php
/**
 * Modify price HTML for Partners in catalog to show "Desde: $X"
 */
add_filter( 'woocommerce_get_price_html', 'esol_partner_price_html', 10, 2 );
function esol_partner_price_html( $price_html, $product ) {
    if ( is_admin() ) return $price_html;
    if ( ! is_user_logged_in() || ! current_user_can( 'esol_partner' ) ) return $price_html;
    
    if ( $product->is_type( 'simple' ) ) {
        $base_price = $product->get_regular_price() ? $product->get_regular_price() : $product->get_price();
        $tiers = esol_get_b2b_tiers();
        
        if ( ! empty( $tiers ) && $base_price ) {
            // Find maximum discount
            $max_discount = 0;
            $max_qty = 1;
            foreach ( $tiers as $tier ) {
                if ( $tier['discount'] > $max_discount ) {
                    $max_discount = $tier['discount'];
                    $max_qty = $tier['qty'];
                }
            }
            
            if ( $max_discount > 0 ) {
                $best_price = esol_apply_b2b_discount( $base_price, $max_qty );
                $html = '<span class="price-b2b-badge" style="display:block; font-size:0.75rem; color:var(--gold-txt); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Precio Partner</span>';
                $html .= '<del style="opacity:0.5; font-size:0.85em; margin-right:8px;">' . wc_price( $base_price ) . '</del>';
                $html .= '<ins style="text-decoration:none;">' . wc_price( $best_price ) . ' <small style="font-size:0.6em; opacity:0.7;">(+'.$max_qty.' un.)</small></ins>';
                return $html;
            }
        }
    }
    return $price_html;
}
```

- [ ] **Step 2: Commit**

```bash
git add esolenergias-theme/includes/woo-helpers.php
git commit -m "feat: show lowest tier price in catalog for logged-in partners"
```
