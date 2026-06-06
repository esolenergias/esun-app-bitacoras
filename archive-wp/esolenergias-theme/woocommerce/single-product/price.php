<?php
/**
 * Single Product Price
 * Overrides WooCommerce template to inject B2B pricing table
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

global $product;

// Stability Check: Ensure product object is valid
if ( ! is_a( $product, 'WC_Product' ) ) {
    return;
}
?>
<p class="<?php echo esc_attr( apply_filters( 'woocommerce_product_price_class', 'price' ) ); ?>"><?php echo $product->get_price_html(); ?></p>

<?php
// Inject our custom B2B pricing table/nudge right below the main price
if ( function_exists( 'esol_format_volume_pricing' ) ) {
    echo esol_format_volume_pricing( $product->get_id() );
}
?>
