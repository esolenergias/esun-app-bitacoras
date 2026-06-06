<?php
/**
 * Customizer Controls for B2B Pricing & Section Visibility
 * Added to esol_customizer_register function
 */
if ( ! defined( 'ABSPATH' ) ) exit;

// This file is meant to be included in functions.php within esol_customizer_register()
// $c is the WP_Customize_Manager object passed as parameter to esol_customizer_register()

// ══════════════════════════════════════════
// PANEL: E-COMMERCE & B2B
// ══════════════════════════════════════════
$c->add_panel( 'esol_ecommerce', [
    'title'       => '💳 E-Commerce & B2B',
    'description' => 'WooCommerce integration, B2B pricing, payment gateways',
    'priority'    => 25,
] );

// ══════════════════════════════════════════
// SECCIÓN: PRODUCTOS WOOCOMMERCE
// ══════════════════════════════════════════
$c->add_section( 'esol_products', [
    'title'       => '📦 Productos (WooCommerce)',
    'panel'       => 'esol_ecommerce',
    'priority'    => 10,
    'description' => 'Configure the products section on the homepage',
] );

// Source: WooCommerce or Manual
$c->add_setting( 'esol_prod_source', [
    'default'           => 'woo',
    'sanitize_callback' => 'sanitize_key',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_prod_source', [
    'label'       => '📊 Fuente de productos',
    'section'     => 'esol_products',
    'type'        => 'select',
    'priority'    => 10,
    'choices'     => [
        'woo'    => 'WooCommerce (dinámico)',
        'manual' => 'Manual (estático)',
    ],
] );

// WooCommerce: Category filter
$c->add_setting( 'esol_prod_woo_cats', [
    'default'           => "paneles\ninversores\nbaterias",
    'sanitize_callback' => 'sanitize_textarea_field',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_prod_woo_cats', [
    'label'       => '🏷️ Categorías (una por línea)',
    'description' => 'Slugs de categorías WooCommerce. Ej: paneles, inversores, baterias',
    'section'     => 'esol_products',
    'type'        => 'textarea',
    'priority'    => 20,
] );

// WooCommerce: Products per tab
$c->add_setting( 'esol_prod_woo_count', [
    'default'           => 6,
    'sanitize_callback' => 'absint',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_prod_woo_count', [
    'label'       => '📈 Productos por pestaña',
    'section'     => 'esol_products',
    'type'        => 'number',
    'priority'    => 30,
    'input_attrs' => [ 'min' => 1, 'max' => 12, 'step' => 1 ],
] );

// WooCommerce: Only featured
$c->add_setting( 'esol_prod_woo_featured', [
    'default'           => false,
    'sanitize_callback' => 'rest_sanitize_boolean',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_prod_woo_featured', [
    'label'       => '⭐ Solo productos destacados',
    'section'     => 'esol_products',
    'type'        => 'checkbox',
    'priority'    => 40,
] );

// Show/Hide price
$c->add_setting( 'esol_prod_show_price', [
    'default'           => true,
    'sanitize_callback' => 'rest_sanitize_boolean',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_prod_show_price', [
    'label'       => '💰 Mostrar precios',
    'section'     => 'esol_products',
    'type'        => 'checkbox',
    'priority'    => 50,
] );

// Button text
$c->add_setting( 'esol_prod_btn_txt', [
    'default'           => 'Ver Detalles',
    'sanitize_callback' => 'sanitize_text_field',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_prod_btn_txt', [
    'label'       => '🔗 Texto del botón',
    'section'     => 'esol_products',
    'type'        => 'text',
    'priority'    => 60,
] );

// ══════════════════════════════════════════
// SECCIÓN: B2B PRICING
// ══════════════════════════════════════════
$c->add_section( 'esol_b2b_pricing', [
    'title'       => '💹 Precios B2B por Volumen',
    'panel'       => 'esol_ecommerce',
    'priority'    => 20,
    'description' => 'Define volumen de compra y descuentos automáticos',
] );

// B2B Pricing Tiers
$c->add_setting( 'esol_b2b_tiers', [
    'default'           => '10:5
50:12
100:20
500:28',
    'sanitize_callback' => 'sanitize_textarea_field',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_b2b_tiers', [
    'label'       => '📊 Tiers de volumen',
    'description' => 'Formato: cantidad:descuento (%)
Ejemplo: 10:5 = 10 unidades obtienen 5% descuento
Nota: Deja al menos un tier
Una línea por tier',
    'section'     => 'esol_b2b_pricing',
    'type'        => 'textarea',
    'priority'    => 10,
] );

// ══════════════════════════════════════════
// SECCIÓN: VISIBILIDAD DE SECCIONES
// ══════════════════════════════════════════
$c->add_section( 'esol_section_visibility', [
    'title'       => '👁️ Visibilidad de Secciones',
    'panel'       => 'esol_panel',
    'priority'    => 105,
    'description' => 'Muestra u oculta módulos de la página principal',
] );

$sections = [
    'servicios'      => '🔧 Servicios (B2B + B2C)',
    'anteproyecto'   => '🎨 Anteproyecto 3D',
    'productos'      => '📦 Productos',
    'marcas'         => '🏷️ Marcas Destacadas',
    'por_que_esol'   => '⭐ Por qué eSol',
    'cotizador'      => '🧮 Cotizador Smart',
    'contacto'       => '📞 Contacto',
];

foreach ( $sections as $key => $label ) {
    $c->add_setting( "esol_vis_section_{$key}", [
        'default'           => true,
        'sanitize_callback' => 'rest_sanitize_boolean',
        'transport'         => 'refresh',
    ] );
    $c->add_control( "esol_vis_section_{$key}", [
        'label'       => $label,
        'section'     => 'esol_section_visibility',
        'type'        => 'checkbox',
        'priority'    => 10,
    ] );
}

// ══════════════════════════════════════════
// SECCIÓN: MERCADO PAGO
// ══════════════════════════════════════════
$c->add_section( 'esol_payment', [
    'title'       => '💳 Métodos de Pago',
    'panel'       => 'esol_ecommerce',
    'priority'    => 30,
    'description' => 'Configuración de Mercado Pago y otras pasarelas',
] );

// Mercado Pago Access Token
$c->add_setting( 'esol_mp_access_token', [
    'default'           => '',
    'sanitize_callback' => 'sanitize_text_field',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_mp_access_token', [
    'label'       => '🔑 Mercado Pago — Access Token',
    'description' => 'Token de acceso desde https://www.mercadopago.com.mx/account/security',
    'section'     => 'esol_payment',
    'type'        => 'password',
    'priority'    => 10,
] );

// Mercado Pago Public Key
$c->add_setting( 'esol_mp_public_key', [
    'default'           => '',
    'sanitize_callback' => 'sanitize_text_field',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_mp_public_key', [
    'label'       => '🔓 Mercado Pago — Public Key',
    'description' => 'Clave pública para el formulario de pago',
    'section'     => 'esol_payment',
    'type'        => 'text',
    'priority'    => 20,
] );

// Enable Mercado Pago
$c->add_setting( 'esol_mp_enabled', [
    'default'           => true,
    'sanitize_callback' => 'rest_sanitize_boolean',
    'transport'         => 'refresh',
] );
$c->add_control( 'esol_mp_enabled', [
    'label'       => '✅ Activar Mercado Pago como pasarela',
    'section'     => 'esol_payment',
    'type'        => 'checkbox',
    'priority'    => 30,
] );

// ══════════════════════════════════════════
// SECCIÓN: COTIZADOR SMART
// ══════════════════════════════════════════
$c->add_section( 'esol_calculator', [
    'title'       => '🧮 Cotizador Smart',
    'panel'       => 'esol_ecommerce',
    'priority'    => 40,
    'description' => 'Configura los valores base para los cálculos del cotizador solar.',
] );

// DAC Threshold
$c->add_setting( 'esol_calc_dac_threshold', [ 'default' => 3000, 'sanitize_callback' => 'absint' ] );
$c->add_control( 'esol_calc_dac_threshold', [
    'label' => 'Límite Tarifa DAC ($ MXN)',
    'section' => 'esol_calculator',
    'type' => 'number',
    'description' => 'Gasto mensual a partir del cual se considera Tarifa de Alto Consumo.'
] );

// Price per kWh (Regular)
$c->add_setting( 'esol_calc_kwh_regular', [ 'default' => 1.5, 'sanitize_callback' => 'floatval' ] );
$c->add_control( 'esol_calc_kwh_regular', [
    'label' => 'Precio kWh Promedio (Regular)',
    'section' => 'esol_calculator',
    'type' => 'number',
    'input_attrs' => [ 'step' => 0.1 ]
] );

// Price per kWh (DAC)
$c->add_setting( 'esol_calc_kwh_dac', [ 'default' => 6.5, 'sanitize_callback' => 'floatval' ] );
$c->add_control( 'esol_calc_kwh_dac', [
    'label' => 'Precio kWh (Tarifa DAC)',
    'section' => 'esol_calculator',
    'type' => 'number',
    'input_attrs' => [ 'step' => 0.1 ]
] );

// Standard Panel Wattage
$c->add_setting( 'esol_calc_panel_w', [ 'default' => 550, 'sanitize_callback' => 'absint' ] );
$c->add_control( 'esol_calc_panel_w', [
'label' => 'Potencia por Panel (Watts)',
'section' => 'esol_calculator',
'type' => 'number'
] );

// ══════════════════════════════════════════
// ANIMACIONES GSAP
// ══════════════════════════════════════════
$c->add_setting( 'esol_enable_gsap', [ 'default' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ] );
$c->add_control( 'esol_enable_gsap', [
'label' => '✨ Activar Animaciones Avanzadas (GSAP)',
'section' => 'esol_identity',
'type' => 'checkbox',
'description' => 'Desactiva esto si el sitio se siente lento en dispositivos antiguos.'
] );

// ══════════════════════════════════════════
// SECCIÓN: CONFIGURACIÓN IA
// ══════════════════════════════════════════
$c->add_section( 'esol_ai_config', [
    'title'       => '🤖 Configuración IA',
    'panel'       => 'esol_ecommerce',
    'priority'    => 50,
] );

$c->add_setting( 'esol_gemini_api_key', [ 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ] );
$c->add_control( 'esol_gemini_api_key', [
    'label' => 'Gemini API Key',
    'section' => 'esol_ai_config',
    'type' => 'password',
    'description' => 'Obtenla en Google AI Studio.'
] );

$c->add_setting( 'esol_ai_seo_enabled', [ 'default' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ] );
$c->add_control( 'esol_ai_seo_enabled', [
    'label' => 'Activar Asistente SEO',
    'section' => 'esol_ai_config',
    'type' => 'checkbox'
] );

