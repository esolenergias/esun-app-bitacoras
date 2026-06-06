<?php
/**
 * WooCommerce Helpers for B2B/B2C Integration
 * eSol Energías — B2B Pricing & Product Management
 */
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Check if WooCommerce is active
 */
function esol_woo_active() {
    return class_exists( 'WooCommerce' );
}

/**
 * Get products from WooCommerce by category
 * @param string $cat_slug Product category slug
 * @param int $count How many products to retrieve
 * @param bool $featured Only featured products
 * @return array WooCommerce product objects
 */
function esol_get_woo_products( $cat_slug = '', $count = 6, $featured = false ) {
    if ( ! esol_woo_active() ) {
        return [];
    }

    $args = [
        'post_type'      => 'product',
        'posts_per_page' => $count,
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ];

    if ( ! empty( $cat_slug ) ) {
        $args['tax_query'] = [ [
            'taxonomy' => 'product_cat',
            'field'    => 'slug',
            'terms'    => $cat_slug,
        ] ];
    }

    if ( $featured ) {
        $args['meta_query'] = [ [
            'key'   => '_featured',
            'value' => 'yes',
        ] ];
    }

    $products = new WP_Query( $args );
    return $products->posts ?? [];
}

/**
 * Get readable category name
 * @param string $slug Category slug
 * @return string Category name or slug if not found
 */
function esol_woo_cat_label( $slug = '' ) {
    if ( empty( $slug ) ) return '';

    $term = get_term_by( 'slug', $slug, 'product_cat' );
    return $term ? $term->name : ucwords( str_replace( '-', ' ', $slug ) );
}

/**
 * Parse textarea category input (one per line) into array
 * @param string $raw Raw textarea input
 * @return array Array of category slugs
 */
function esol_parse_cat_slugs( $raw = '' ) {
    if ( empty( $raw ) ) return [];
    $lines = array_map( 'trim', explode( "\n", $raw ) );
    return array_filter( $lines );
}

/**
 * Get B2B volume pricing tiers
 * @return array Array of volume tiers with discount percentage
 * Example: [ [10, 5], [50, 12], [100, 20] ]  = 10 units = 5% off, etc.
 */
function esol_get_b2b_tiers() {
    static $tiers = null;
    if ( $tiers !== null ) return $tiers;

    $tiers_raw = get_theme_mod( 'esol_b2b_tiers', "10:5\n50:12\n100:20\n500:28" );
    $tiers = [];
    $lines = array_map( 'trim', explode( "\n", $tiers_raw ) );

    foreach ( $lines as $line ) {
        if ( empty( $line ) ) continue;
        $parts = explode( ':', $line );
        if ( count( $parts ) === 2 ) {
            $qty      = absint( $parts[0] );
            $discount = floatval( $parts[1] );
            if ( $qty > 0 && $discount >= 0 && $discount <= 100 ) {
                $tiers[] = [ 'qty' => $qty, 'discount' => $discount ];
            }
        }
    }

    // Ensure sorted by quantity ASC
    usort( $tiers, function($a, $b) { return $a['qty'] - $b['qty']; } );

    return $tiers;
}

/**
 * Calculate discount percentage based on quantity
 * @param int $qty Quantity ordered
 * @return float Discount percentage (0-100)
 */
function esol_get_discount( $qty = 1 ) {
    $qty = absint( $qty );
    if ( $qty < 1 ) $qty = 1;

    $tiers = esol_get_b2b_tiers();
    $discount = 0;

    // Find applicable tier (highest tier that qty qualifies for)
    foreach ( $tiers as $tier ) {
        if ( $qty >= $tier['qty'] ) {
            $discount = $tier['discount'];
        } else {
            break;
        }
    }

    return $discount;
}

/**
 * Calculate final price after B2B discount
 * @param float $price Original price
 * @param int $qty Quantity
 * @return float Final price with discount applied
 */
function esol_apply_b2b_discount( $price = 0, $qty = 1 ) {
    $discount = esol_get_discount( $qty );
    $discount_amount = ( $price * $discount ) / 100;
    return $price - $discount_amount;
}

/**
 * Format volume pricing display
 * @param int $product_id WooCommerce product ID
 * @return string HTML formatted pricing table or empty
 */
function esol_format_volume_pricing( $product_id = 0 ) {
    if ( ! $product_id || ! esol_woo_active() ) return '';

    $product = wc_get_product( $product_id );
    if ( ! $product ) return '';

    $base_price = $product->get_regular_price() ?: $product->get_price();
    if ( ! $base_price ) return '';

    $tiers = esol_get_b2b_tiers();
    if ( empty( $tiers ) ) return '';

    ob_start();
    
    if ( ! is_user_logged_in() || ! current_user_can( 'esol_partner' ) ) {
        ?>
        <div class="esol-b2b-nudge" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(196,152,37,0.3); border-radius: 8px; padding: 15px; margin-top: 20px; text-align: center; backdrop-filter: blur(10px);">
            <p style="margin: 0; font-size: 0.9rem; color: var(--tx);">
                <svg aria-hidden="true" width="18" height="18" fill="none" stroke="var(--gold)" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 5px; display: inline-block;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                <?php echo wp_kses( __( 'Inicia sesión como <strong>Partner</strong> para ver precios de mayoreo.', 'esolenergias' ), [ 'strong' => [] ] ); ?>
            </p>
            <a href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" class="btn-cotizar" style="padding: 8px 16px; font-size: 0.8rem; margin-top: 10px; display: inline-block;"><?php _e( 'Acceso Partner', 'esolenergias' ); ?></a>
        </div>
        <?php
        return ob_get_clean();
    }
    
    // Glassmorphism table for logged-in partners
    ?>
    <div class="esol-volume-pricing" style="background: rgba(20,20,16,0.6); border: 1px solid var(--bgborder); border-radius: 12px; padding: 16px; margin-top: 20px; backdrop-filter: blur(12px);">
        <p style="font-size: 0.85rem; margin-bottom: 12px; color: var(--gold-txt); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            <svg aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="vertical-align: sub; margin-right: 4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
            <?php _e( 'Precios Partner B2B', 'esolenergias' ); ?>
        </p>
        <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="border-bottom: 1px solid var(--bgborder); color: var(--txmuted);">
                    <th style="padding: 8px 0; font-weight: 500;"><?php _e( 'Volumen', 'esolenergias' ); ?></th>
                    <th style="padding: 8px 0; font-weight: 500; text-align: center;"><?php _e( 'Ahorro', 'esolenergias' ); ?></th>
                    <th style="padding: 8px 0; font-weight: 500; text-align: right;"><?php _e( 'Unitario', 'esolenergias' ); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php if ( isset( $tiers[0] ) && $tiers[0]['qty'] > 1 ) : ?>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color: var(--tx);">1 - <?php echo esc_html( $tiers[0]['qty'] - 1 ); ?> <?php _e( 'un.', 'esolenergias' ); ?></td>
                    <td style="padding: 8px 0; text-align: center; color: var(--txmuted);">-</td>
                    <td style="padding: 8px 0; text-align: right; color: var(--tx);"><?php echo wc_price( $base_price ); ?></td>
                </tr>
                <?php endif; ?>
                <?php foreach ( $tiers as $tier ): ?>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color: var(--tx);"><?php printf( esc_html__( 'Desde %s un.', 'esolenergias' ), esc_html( $tier['qty'] ) ); ?></td>
                    <td style="padding: 8px 0; text-align: center; color: var(--gold-l); font-weight: 600;">-<?php echo esc_html( $tier['discount'] ); ?>%</td>
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

/**
 * Check if a section should be visible
 * @param string $section Section key (servicios, anteproyecto, productos, etc)
 * @return bool Visibility status
 */
function esol_section_visible( $section = '' ) {
    if ( empty( $section ) ) return true;
    $visible = get_theme_mod( "esol_vis_section_{$section}", true );
    return (bool) $visible;
}

/**
 * Apply B2B discounts in the cart based on quantity
 */
add_action( 'woocommerce_before_calculate_totals', 'esol_apply_b2b_cart_discounts', 10, 1 );
function esol_apply_b2b_cart_discounts( $cart ) {
    if ( is_admin() && ! defined( 'DOING_AJAX' ) ) return;
    if ( ! is_user_logged_in() || ! current_user_can( 'esol_partner' ) ) return;

    if ( did_action( 'woocommerce_before_calculate_totals' ) >= 2 ) return;

    foreach ( $cart->get_cart() as $cart_item ) {
        $quantity = $cart_item['quantity'];
        $product  = $cart_item['data'];
        
        $regular_price = $product->get_regular_price() ?: $product->get_price();
        $current_price = $product->get_price();

        if ( $regular_price && $quantity > 0 ) {
            $discount_percentage = esol_get_discount( $quantity );
            if ( $discount_percentage > 0 ) {
                $b2b_price = $regular_price * ( 1 - ( $discount_percentage / 100 ) );
                // Only apply if B2B price is better than current (e.g. sale price)
                if ( $b2b_price < $current_price ) {
                    $product->set_price( $b2b_price );
                }
            }
        }
    }
}

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
                $html = '<span class="price-b2b-badge" style="display:block; font-size:0.75rem; color:var(--gold-txt); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">' . esc_html__( 'Precio Partner', 'esolenergias' ) . '</span>';
                $html .= '<del style="opacity:0.5; font-size:0.85em; margin-right:8px;">' . wc_price( $base_price ) . '</del>';
                $html .= '<ins style="text-decoration:none;">' . wc_price( $best_price ) . ' <small style="font-size:0.6em; opacity:0.7;">(+' . esc_html( $max_qty ) . ' ' . esc_html__( 'un.', 'esolenergias' ) . ')</small></ins>';
                return $html;
            }
        }
    }
    return $price_html;
}
