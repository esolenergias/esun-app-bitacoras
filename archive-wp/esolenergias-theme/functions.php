<?php
/**
 * eSol Energías — functions.php v2.1
 * Customizer completo: logo, favicon, hero, servicios, productos, marcas, contacto, B2B pricing
 */
if ( ! defined( 'ABSPATH' ) ) exit;

/* ══════════════════════════════════════════
   0. INCLUDE HELPERS
══════════════════════════════════════════ */
require_once get_template_directory() . '/includes/woo-helpers.php';
require_once get_template_directory() . '/includes/class-esol-ai.php';

/* ══════════════════════════════════════════════
   1. SOPORTE DE TEMA
══════════════════════════════════════════════ */
add_action( 'after_setup_theme', function () {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'custom-logo', [
        'height'      => 80,
        'width'       => 200,
        'flex-height' => true,
        'flex-width'  => true,
    ] );
    add_theme_support( 'site-icon' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'gallery', 'caption', 'script', 'style' ] );
    add_theme_support( 'customize-selective-refresh-widgets' );
    load_theme_textdomain( 'esolenergias', get_template_directory() . '/languages' );
} );

/* ══════════════════════════════════════════════
   2. ENCOLAR CSS / JS
══════════════════════════════════════════════ */
add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style( 'esol-fonts',
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Josefin+Sans:ital,wght@0,100;0,300;0,400;0,500;0,600;0,700;1,300&display=swap',
        [], null );
    wp_enqueue_style( 'esol-main',
        get_template_directory_uri() . '/assets/css/esol.css',
        ['esol-fonts'], '2.0.1' );

    // ── CSS dinámico: tamaño + filtro del logo ────────────
    $logo_h      = max( 20, min( absint( get_theme_mod('esol_logo_height', 44) ), 150 ) );
    $logo_h_foot = max( 16, min( round( $logo_h * 0.82 ), 120 ) );  // footer = 82% del navbar, auto
    $filter_light = get_theme_mod( 'esol_logo_filter_light', 'none' );

    // Sanitizar filtro (whitelist)
    $allowed_filters = [
        'none'                        => 'none',
        'invert'                      => 'invert(1)',
        'black'                       => 'brightness(0)',
        'white'                       => 'brightness(0) invert(1)',
        'invert_gold'                 => 'invert(1) sepia(1) saturate(2) hue-rotate(5deg)',
    ];
    $css_filter = $allowed_filters[ $filter_light ] ?? 'none';

    wp_add_inline_style( 'esol-main', "
        /* Navbar */
        .logo-img                        { max-height:{$logo_h}px !important; }
        .nav-logo svg:first-child        { width:{$logo_h}px !important; height:{$logo_h}px !important; }
        /* Footer: mismo logo, tamaño proporcional */
        .logo-img.logo-footer            { max-height:{$logo_h_foot}px !important; }
        .footer-logo-wrap svg:first-child{ width:{$logo_h_foot}px !important; height:{$logo_h_foot}px !important; }
        /* Filtro de color en modo claro */
        html[data-theme='light'] .site-logo-dark  { filter:{$css_filter}; }
        html[data-theme='light'] .footer-logo-wrap .site-logo-dark { filter:{$css_filter}; }
    " );

    wp_enqueue_script( 'esol-main',
        get_template_directory_uri() . '/assets/js/esol.js',
        [], '2.0.1', true );
    wp_localize_script( 'esol-main', 'esolData', [
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'esol_contact_nonce' ),
    ] );

    // ── Theme Manager: Dark/Light mode sync ────────────────
    wp_enqueue_script( 'esol-theme-manager',
        get_template_directory_uri() . '/assets/js/theme-manager.js',
        [], filemtime( get_template_directory() . '/assets/js/theme-manager.js' ), true );
} );

/* ── GSAP & ANIMATION ENGINE ──────────────────────────────── */
add_action( 'wp_enqueue_scripts', function () {
    if ( ! get_theme_mod( 'esol_enable_gsap', true ) ) return;

    wp_enqueue_script( 'gsap-core', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', [], '3.12.5', true );
    wp_enqueue_script( 'gsap-scroll-trigger', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', ['gsap-core'], '3.12.5', true );
    wp_enqueue_script( 'esol-animation-engine', get_template_directory_uri() . '/assets/js/animation-engine.js', ['gsap-scroll-trigger'], '1.0.0', true );
}, 20 );

// ── Preview en vivo (postMessage) ─────────────────────────────────
add_action( 'customize_preview_init', function () {
    wp_add_inline_script( 'customize-preview', "
    (function(){
        /* Tamaño del logo — cambio en tiempo real */
        wp.customize('esol_logo_height', function(v){
            v.bind(function(h){
                h = Math.max(20, Math.min(parseInt(h)||44, 150));
                var hf = Math.round(h * 0.82);
                /* Navbar */
                document.querySelectorAll('.logo-img').forEach(function(el){
                    el.style.maxHeight = h + 'px';
                });
                document.querySelectorAll('.nav-logo svg:first-child').forEach(function(el){
                    el.style.width = h + 'px'; el.style.height = h + 'px';
                });
                /* Footer: proporcional */
                document.querySelectorAll('.logo-img.logo-footer').forEach(function(el){
                    el.style.maxHeight = hf + 'px';
                });
                document.querySelectorAll('.footer-logo-wrap svg:first-child').forEach(function(el){
                    el.style.width = hf + 'px'; el.style.height = hf + 'px';
                });
            });
        });

        /* Filtro de color — cambio en tiempo real */
        var filterMap = {
            'none'        : 'none',
            'invert'      : 'invert(1)',
            'black'       : 'brightness(0)',
            'white'       : 'brightness(0) invert(1)',
            'invert_gold' : 'invert(1) sepia(1) saturate(2) hue-rotate(5deg)',
        };
        wp.customize('esol_logo_filter_light', function(v){
            v.bind(function(val){
                var f = filterMap[val] || 'none';
                var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
                if (!isDark) {
                    document.querySelectorAll('.site-logo-dark').forEach(function(el){
                        el.style.filter = f;
                    });
                }
            });
        });
    })();
    " );
} );

// Limpiar head de WordPress (quitar bloatware)
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'wp_shortlink_wp_head' );
remove_action( 'wp_head', 'adjacent_posts_rel_link_wp_head' );
add_action( 'wp_enqueue_scripts', function () {
    wp_dequeue_style( 'wp-block-library' );
    wp_dequeue_style( 'wp-block-library-theme' );
    wp_dequeue_style( 'classic-theme-styles' );
    wp_dequeue_style( 'global-styles' );
}, 100 );

/* ══════════════════════════════════════════════
   3. HELPERS
══════════════════════════════════════════════ */
function esol_get( $key, $fallback = '' )   { return esc_html( get_theme_mod( $key, $fallback ) ); }
function esol_url( $key, $fallback = '#' )  { return esc_url( get_theme_mod( $key, $fallback ) ); }
function esol_raw( $key, $fallback = '' )   { return wp_kses_post( get_theme_mod( $key, $fallback ) ); }
function esol_img( $key, $fallback = '' )   { return esc_url( get_theme_mod( $key, $fallback ) ); }

function esol_whatsapp_url( $text = '' ) {
    $num = get_theme_mod( 'esol_whatsapp', '5200000000000' );
    $msg = urlencode( $text ?: 'Hola eSol, quiero información' );
    return 'https://wa.me/' . preg_replace( '/\D/', '', $num ) . '?text=' . $msg;
}

/* ── WooCommerce Helpers ─────────────────────────────────────── */
// Note: WooCommerce helper functions are loaded from includes/woo-helpers.php (line 11)

/**
 * Renderiza el logo del navbar (y del footer, que usa el mismo archivo).
 * @param string $context  'nav' | 'footer'
 */
function esol_render_logo( $context = 'nav' ) {
    $logo_dark  = get_theme_mod( 'esol_logo_dark',  '' );
    $logo_light = get_theme_mod( 'esol_logo_light', '' );
    $alt        = esc_attr( get_bloginfo('name') );
    $is_footer  = ( $context === 'footer' );

    // Clases base según contexto
    $base_cls = $is_footer ? 'logo-img logo-footer' : 'logo-img';

    if ( $logo_dark || $logo_light ) {
        $out = '';

        // ── Versión MODO OSCURO ──────────────────────────────────────
        // Usa logo_dark si existe; si no, usa logo_light (fallback).
        $src_dark = $logo_dark ?: $logo_light;
        $out .= '<img src="' . esc_url($src_dark) . '" alt="' . $alt . '" '
              . 'class="' . $base_cls . ' site-logo-dark" '
              . 'loading="eager" decoding="async" />';

        // ── Versión MODO CLARO ───────────────────────────────────────
        // Si el usuario subió logo_light úsalo; si no, usa logo_dark
        // (el filtro CSS se encargará de adaptar el color automáticamente).
        $src_light = $logo_light ?: $logo_dark;
        $out .= '<img src="' . esc_url($src_light) . '" alt="' . $alt . '" '
              . 'class="' . $base_cls . ' site-logo-light" '
              . 'loading="eager" decoding="async" />';

        echo $out;
    } else {
        // Default: icono SVG + texto
        ?>
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="10" stroke="#C49825" stroke-width="1.5" fill="none"/>
            <circle cx="20" cy="20" r="4" fill="#C49825"/>
            <line x1="20" y1="4"  x2="20" y2="8"  stroke="#C49825" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="20" y1="32" x2="20" y2="36" stroke="#C49825" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="4"  y1="20" x2="8"  y2="20" stroke="#C49825" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="32" y1="20" x2="36" y2="20" stroke="#C49825" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="8.69"  y1="8.69"  x2="11.51" y2="11.51" stroke="#C49825" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="28.49" y1="28.49" x2="31.31" y2="31.31" stroke="#C49825" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="31.31" y1="8.69"  x2="28.49" y2="11.51" stroke="#C49825" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="11.51" y1="28.49" x2="8.69"  y2="31.31" stroke="#C49825" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <div>
            <span class="logo-name"><?php echo esc_html( get_theme_mod('esol_logo_text', 'E S O L') ); ?></span>
            <span class="logo-sub"><?php echo esc_html( get_theme_mod('esol_logo_sub', 'ENERGÍAS') ); ?></span>
        </div>
        <?php
    }
}

/* ══════════════════════════════════════════════
   4. AJAX — FORMULARIO DE CONTACTO
══════════════════════════════════════════════ */
add_action( 'wp_ajax_nopriv_esol_contact', 'esol_handle_contact' );
add_action( 'wp_ajax_esol_contact',        'esol_handle_contact' );

function esol_handle_contact() {
    if ( ! check_ajax_referer( 'esol_contact_nonce', 'nonce', false ) ) {
        wp_send_json_error( ['message' => 'Solicitud no válida.'] );
    }
    $nombre  = sanitize_text_field( $_POST['nombre']  ?? '' );
    $empresa = sanitize_text_field( $_POST['empresa'] ?? '' );
    $email   = sanitize_email(      $_POST['email']   ?? '' );
    $interes = sanitize_text_field( $_POST['interes'] ?? '' );
    $mensaje = sanitize_textarea_field( $_POST['mensaje'] ?? '' );

    if ( empty($nombre) || ! is_email($email) || empty($interes) ) {
        wp_send_json_error( ['message' => 'Por favor completa todos los campos requeridos.'] );
    }

    $to      = get_theme_mod( 'esol_email', get_option('admin_email') );
    $subject = "Nuevo contacto eSol: {$interes} — {$nombre}";
    $body    = "Nombre:  {$nombre}\nEmpresa: {$empresa}\nEmail:   {$email}\nInterés: {$interes}\n\nMensaje:\n{$mensaje}\n\n---\nEnviado desde esolenergias.com";
    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'From: eSol Energias <noreply@esolenergias.com>',
        "Reply-To: {$nombre} <{$email}>",
    ];

    $sent = wp_mail( $to, $subject, $body, $headers );
    if ( $sent ) {
        wp_send_json_success( ['message' => 'Mensaje enviado. Te contactaremos pronto.'] );
    } else {
        wp_send_json_error( ['message' => 'Error al enviar. Por favor escríbenos por WhatsApp.'] );
    }
}

/* ══════════════════════════════════════════════
   5. CUSTOMIZER COMPLETO
══════════════════════════════════════════════ */
add_action( 'customize_register', 'esol_customizer_register' );

function esol_customizer_register( $c ) {

    // ── Helper interno ─────────────────────────
    $txt = function( $id, $label, $section, $default = '', $priority = 10 ) use ( $c ) {
        $c->add_setting( $id, ['default' => $default, 'sanitize_callback' => 'sanitize_text_field', 'transport' => 'refresh'] );
        $c->add_control( $id, ['label' => $label, 'section' => $section, 'type' => 'text', 'priority' => $priority] );
    };
    $area = function( $id, $label, $section, $default = '', $priority = 10 ) use ( $c ) {
        $c->add_setting( $id, ['default' => $default, 'sanitize_callback' => 'sanitize_textarea_field', 'transport' => 'refresh'] );
        $c->add_control( $id, ['label' => $label, 'section' => $section, 'type' => 'textarea', 'priority' => $priority] );
    };
    $img = function( $id, $label, $section, $priority = 10 ) use ( $c ) {
        $c->add_setting( $id, ['default' => '', 'sanitize_callback' => 'esc_url_raw', 'transport' => 'refresh'] );
        $c->add_control( new WP_Customize_Image_Control( $c, $id, [
            'label' => $label, 'section' => $section, 'priority' => $priority,
        ] ) );
    };
    $url = function( $id, $label, $section, $default = '', $priority = 10 ) use ( $c ) {
        $c->add_setting( $id, ['default' => $default, 'sanitize_callback' => 'esc_url_raw', 'transport' => 'refresh'] );
        $c->add_control( $id, ['label' => $label, 'section' => $section, 'type' => 'url', 'priority' => $priority] );
    };
    $sep = function( $id, $label, $section, $priority = 10 ) use ( $c ) {
        $c->add_setting( $id, ['sanitize_callback' => '__return_false'] );
        $c->add_control( new WP_Customize_Control( $c, $id, [
            'label' => '── ' . $label . ' ──', 'section' => $section,
            'type' => 'hidden', 'priority' => $priority,
            'description' => '',
        ] ) );
    };

    // ══════════════════════════════════════════
    // PANEL PRINCIPAL
    // ══════════════════════════════════════════
    $c->add_panel( 'esol_panel', [
        'title'       => '⚡ eSol — Landing Page',
        'description' => 'Edita todo el contenido de la página principal.',
        'priority'    => 20,
    ] );

    // ══════════════════════════════════════════
    // SECCIÓN: IDENTIDAD VISUAL
    // ══════════════════════════════════════════
    $c->add_section( 'esol_identity', [
        'title'  => '🎨 Identidad Visual',
        'panel'  => 'esol_panel',
        'priority' => 10,
        'description' => 'Logo SVG para modo oscuro y claro. Si no subes logo, se usa el ícono solar por defecto.',
    ] );

    // ── Logos ─────────────────────────────────────────────────────────
    $img( 'esol_logo_dark',  '🌙 Logo MODO OSCURO  (logo claro/blanco/dorado sobre fondo oscuro)', 'esol_identity', 10 );
    $img( 'esol_logo_light', '☀️ Logo MODO CLARO   (logo oscuro sobre fondo claro) — opcional: si no subes uno se aplica el filtro de abajo', 'esol_identity', 20 );

    // ── Filtro de color automático en modo claro ──────────────────────
    // Solo se aplica cuando NO se sube un logo_light separado.
    $c->add_setting( 'esol_logo_filter_light', [
        'default'           => 'none',
        'sanitize_callback' => 'sanitize_key',
        'transport'         => 'postMessage',
    ] );
    $c->add_control( 'esol_logo_filter_light', [
        'label'       => '🎨 Adaptar color del logo en MODO CLARO',
        'description' => 'Se aplica cuando no subes un logo claro por separado.',
        'section'     => 'esol_identity',
        'type'        => 'select',
        'priority'    => 25,
        'choices'     => [
            'none'        => 'Sin filtro — usar logo tal cual',
            'invert'      => 'Invertir colores  (blanco → negro)',
            'black'       => 'Silueta negra     (cualquier color → negro)',
            'white'       => 'Silueta blanca     (cualquier color → blanco)',
            'invert_gold' => 'Invertir + tono dorado',
        ],
    ] );

    // ── Texto si no hay logo ────────────────────────────────────────
    $txt( 'esol_logo_text', 'Texto del logo (si no subes imagen)', 'esol_identity', 'E S O L',  30 );
    $txt( 'esol_logo_sub',  'Subtexto del logo',                   'esol_identity', 'ENERGÍAS', 35 );

    // ── Escala del logo ───────────────────────────────────────────────
    $c->add_setting( 'esol_logo_height', [
        'default'           => 44,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ] );
    $c->add_control( 'esol_logo_height', [
        'label'       => '📏 Tamaño del logo — navbar (px)',
        'description' => 'El footer usa automáticamente el 82 % de este valor. Rango: 20 – 150 px.',
        'section'     => 'esol_identity',
        'type'        => 'number',
        'priority'    => 40,
        'input_attrs' => [ 'min' => 20, 'max' => 150, 'step' => 1 ],
    ] );

    $img( 'esol_favicon', '🔖 Favicon — también disponible en: Identidad del sitio › Icono del sitio', 'esol_identity', 50 );

    // ══════════════════════════════════════════
    // SECCIÓN: NAVBAR
    // ══════════════════════════════════════════
    $c->add_section( 'esol_navbar', [
        'title' => '🧭 Navegación',
        'panel' => 'esol_panel',
        'priority' => 20,
    ] );
    $txt( 'esol_nav_link1', 'Link 1 — texto', 'esol_navbar', 'Servicios',    10 );
    $txt( 'esol_nav_anc1',  'Link 1 — ancla (#)', 'esol_navbar', 'servicios', 11 );
    $txt( 'esol_nav_link2', 'Link 2 — texto', 'esol_navbar', 'Anteproyecto', 20 );
    $txt( 'esol_nav_anc2',  'Link 2 — ancla (#)', 'esol_navbar', 'anteproyecto', 21 );
    $txt( 'esol_nav_link3', 'Link 3 — texto', 'esol_navbar', 'Productos',    30 );
    $txt( 'esol_nav_anc3',  'Link 3 — ancla (#)', 'esol_navbar', 'productos', 31 );
    $txt( 'esol_nav_link4', 'Link 4 — texto', 'esol_navbar', 'Marcas',       40 );
    $txt( 'esol_nav_anc4',  'Link 4 — ancla (#)', 'esol_navbar', 'marcas',   41 );
    $txt( 'esol_nav_cta',   'Botón CTA texto', 'esol_navbar', 'Cotizar',     50 );

    // ══════════════════════════════════════════
    // SECCIÓN: HERO
    // ══════════════════════════════════════════
    $c->add_section( 'esol_hero', [
        'title'    => '🏠 Hero (Portada)',
        'panel'    => 'esol_panel',
        'priority' => 30,
    ] );
    $txt ( 'esol_hero_label',  'Etiqueta sobre el título', 'esol_hero', '— Ingeniería Solar Profesional —', 10 );
    $txt ( 'esol_hero_h1a',    'Título línea 1', 'esol_hero', 'Proyectos Solares', 20 );
    $txt ( 'esol_hero_h1b',    'Título línea 2 (dorado)', 'esol_hero', 'de Precisión', 30 );
    $area( 'esol_hero_desc',   'Descripción (párrafo)', 'esol_hero',
        'Anteproyectos con fotomontaje 3D para instaladores que buscan cerrar más ventas, y distribución de componentes fotovoltaicos de primer nivel para todo México.', 40 );
    $txt ( 'esol_hero_cta1',   'CTA 1 — texto (botón dorado)', 'esol_hero', 'Anteproyecto 3D', 50 );
    $txt ( 'esol_hero_cta1_anc','CTA 1 — ancla (#)', 'esol_hero', 'anteproyecto', 51 );
    $txt ( 'esol_hero_cta2',   'CTA 2 — texto (botón outlined)', 'esol_hero', 'Ver Catálogo', 60 );
    $txt ( 'esol_hero_cta2_anc','CTA 2 — ancla (#)', 'esol_hero', 'productos', 61 );
    $img ( 'esol_hero_img',    '🖼️ Imagen del hero (derecha)', 'esol_hero', 70 );
    $txt ( 'esol_hero_img_lbl','Etiqueta sobre la imagen', 'esol_hero', 'Proyección Solar', 75 );
    // Stats
    $txt ( 'esol_stat1_num',   'Estadística 1 — número', 'esol_hero', '+500', 80 );
    $txt ( 'esol_stat1_lbl',   'Estadística 1 — etiqueta', 'esol_hero', 'Proyectos', 81 );
    $txt ( 'esol_stat2_num',   'Estadística 2 — número', 'esol_hero', '15+', 82 );
    $txt ( 'esol_stat2_lbl',   'Estadística 2 — etiqueta', 'esol_hero', 'Marcas', 83 );
    $txt ( 'esol_stat3_num',   'Estadística 3 — número', 'esol_hero', '5 MW', 84 );
    $txt ( 'esol_stat3_lbl',   'Estadística 3 — etiqueta', 'esol_hero', 'Instalados', 85 );

    // ══════════════════════════════════════════
    // SECCIÓN: SERVICIOS
    // ══════════════════════════════════════════
    $c->add_section( 'esol_servicios', [
        'title'    => '🔧 Sección Servicios',
        'panel'    => 'esol_panel',
        'priority' => 40,
    ] );
    $txt ( 'esol_serv_label',  'Etiqueta de sección', 'esol_servicios', 'Nuestros Servicios', 10 );
    $txt ( 'esol_serv_h2a',    'Título línea 1', 'esol_servicios', 'Dos soluciones,', 20 );
    $txt ( 'esol_serv_h2b',    'Título línea 2 (dorado)', 'esol_servicios', 'un solo aliado', 30 );
    $area( 'esol_serv_desc',   'Descripción de sección', 'esol_servicios', 'Servimos tanto al instalador que quiere cerrar ventas como al profesional que necesita los mejores componentes.', 40 );
    // B2B
    $txt ( 'esol_b2b_label',   'B2B — etiqueta (ej: 01 — Para Instaladores)', 'esol_servicios', '01 — Para Instaladores', 50 );
    $txt ( 'esol_b2b_title',   'B2B — título', 'esol_servicios', 'Anteproyecto Solar con Fotomontaje 3D', 60 );
    $area( 'esol_b2b_desc',    'B2B — descripción', 'esol_servicios', 'Transformamos una fotografía aérea con dron en un modelo 3D fotorrealista del sistema solar instalado sobre la propiedad. La herramienta definitiva para presentar y cerrar proyectos.', 70 );
    for ( $i = 1; $i <= 4; $i++ ) {
        $defaults = ['Vuelo con dron + fotomontaje arquitectónico 3D','Memoria técnica y selección de equipo','Entrega en 48–72 horas hábiles','Exclusivo para empresas instaladoras'];
        $txt( "esol_b2b_li{$i}", "B2B — punto {$i}", 'esol_servicios', $defaults[$i-1], 70+$i );
    }
    // B2C
    $txt ( 'esol_b2c_label',   'B2C — etiqueta (ej: 02 — Distribución)', 'esol_servicios', '02 — Distribución', 80 );
    $txt ( 'esol_b2c_title',   'B2C — título', 'esol_servicios', 'Venta de Componentes Fotovoltaicos', 90 );
    $area( 'esol_b2c_desc',    'B2C — descripción', 'esol_servicios', 'Distribuimos todos los componentes necesarios para una instalación solar completa. Paneles, inversores, estructura de aluminio, cable y accesorios de las marcas más reconocidas del mercado.', 100 );
    for ( $i = 1; $i <= 4; $i++ ) {
        $defaults = ['Paneles, inversores y microinversores','Estructura aluminio K2, Aluminext y más','Cable solar, protecciones y baterías','Envíos a toda la República Mexicana'];
        $txt( "esol_b2c_li{$i}", "B2C — punto {$i}", 'esol_servicios', $defaults[$i-1], 100+$i );
    }

    // ══════════════════════════════════════════
    // SECCIÓN: ANTEPROYECTO
    // ══════════════════════════════════════════
    $c->add_section( 'esol_ante', [
        'title'    => '📐 Sección Anteproyecto',
        'panel'    => 'esol_panel',
        'priority' => 50,
    ] );
    $txt ( 'esol_ante_label',  'Etiqueta de sección', 'esol_ante', 'Cierre de Venta Solar', 10 );
    $txt ( 'esol_ante_h2a',    'Título línea 1', 'esol_ante', 'El cliente ve su casa', 20 );
    $txt ( 'esol_ante_h2b',    'Título línea 2 (dorado)', 'esol_ante', 'con los paneles instalados', 30 );
    $area( 'esol_ante_desc',   'Descripción', 'esol_ante', 'Usamos fotografía aérea con dron y modelado 3D para crear una proyección fotorrealista del sistema solar sobre la propiedad real del cliente. El resultado es una presentación que elimina dudas y acelera la decisión de compra.', 40 );
    $img ( 'esol_ante_img',    '🖼️ Imagen (izquierda)', 'esol_ante', 50 );
    $txt ( 'esol_ante_img_lbl','Etiqueta sobre la imagen', 'esol_ante', 'Para Instaladores', 55 );
    // Pasos
    for ( $i = 1; $i <= 3; $i++ ) {
        $dt = [['Vuelo con Dron','Fotografía aérea de alta resolución del sitio de instalación'],['Modelo 3D + Fotomontaje','Paneles solares renderizados fotorrealistamente sobre la propiedad'],['Entrega 48–72 hrs','Portafolio completo listo para presentar y cerrar la venta']];
        $txt( "esol_ante_step{$i}_t", "Paso {$i} — título",       'esol_ante', $dt[$i-1][0], 60+($i*2)   );
        $txt( "esol_ante_step{$i}_d", "Paso {$i} — descripción",  'esol_ante', $dt[$i-1][1], 60+($i*2)+1 );
    }
    $txt ( 'esol_ante_cta',    'Texto del CTA (botón dorado)', 'esol_ante', 'Solicitar Muestra Gratuita', 80 );

    // ══════════════════════════════════════════
    // SECCIÓN: PRODUCTOS
    // ══════════════════════════════════════════
    $c->add_section( 'esol_productos', [
        'title'       => '📦 Sección Productos',
        'panel'       => 'esol_panel',
        'priority'    => 60,
        'description' => 'Configura los grupos de productos que aparecen en el landing. En modo WooCommerce las pestañas se generan automáticamente desde tu tienda.',
    ] );
    $txt ( 'esol_prod_label', 'Etiqueta de sección', 'esol_productos', 'Catálogo', 10 );
    $txt ( 'esol_prod_h2a',  'Título línea 1', 'esol_productos', 'Componentes Solares', 20 );
    $txt ( 'esol_prod_h2b',  'Título línea 2 (dorado)', 'esol_productos', 'de Primera Línea', 30 );

    // ── Fuente: WooCommerce o Manual ────────────────────────────
    $c->add_setting( 'esol_prod_source', [
        'default'           => 'woo',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'refresh',
    ] );
    $c->add_control( 'esol_prod_source', [
        'label'       => '📡 Fuente de productos',
        'description' => 'WooCommerce: tarjetas reales desde la tienda con pestañas por grupo. Manual: usa los campos de imagen/marca/nombre de abajo.',
        'section'     => 'esol_productos',
        'type'        => 'select',
        'choices'     => [
            'woo'    => 'WooCommerce (automático)',
            'manual' => 'Manual (campos del Customizer)',
        ],
        'priority' => 31,
    ] );

    // ── Grupos / Categorías WooCommerce ─────────────────────────
    $c->add_setting( 'esol_prod_woo_cats', [
        'default'           => "paneles-solares\ninversores\nmicroinversores\nestructuras\ncable-solar\nbaterias",
        'sanitize_callback' => 'sanitize_textarea_field',
        'transport'         => 'refresh',
    ] );
    $c->add_control( 'esol_prod_woo_cats', [
        'label'       => '📂 Grupos / Categorías (un slug por línea)',
        'description' => 'Cada línea genera una pestaña. El slug debe coincidir con el de WooCommerce (Productos → Categorías). Puedes reordenar, agregar o quitar líneas cuando el mercado lo pida. Las líneas que empiezan con # se ignoran.',
        'section'     => 'esol_productos',
        'type'        => 'textarea',
        'priority'    => 32,
    ] );

    // ── Productos por pestaña ───────────────────────────────────
    $c->add_setting( 'esol_prod_woo_count', [
        'default'           => 4,
        'sanitize_callback' => 'absint',
        'transport'         => 'refresh',
    ] );
    $c->add_control( 'esol_prod_woo_count', [
        'label'       => '🔢 Productos por pestaña (1–12)',
        'section'     => 'esol_productos',
        'type'        => 'number',
        'input_attrs' => [ 'min' => 1, 'max' => 12, 'step' => 1 ],
        'priority'    => 33,
    ] );

    // ── Solo productos marcados como Destacado ──────────────────
    $c->add_setting( 'esol_prod_woo_featured', [
        'default'           => '0',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'refresh',
    ] );
    $c->add_control( 'esol_prod_woo_featured', [
        'label'       => '⭐ Solo productos "Destacados" de WooCommerce',
        'description' => 'Activa la estrella en cada producto desde WooCommerce → Editar producto.',
        'section'     => 'esol_productos',
        'type'        => 'checkbox',
        'priority'    => 34,
    ] );

    // ── Mostrar precio ──────────────────────────────────────────
    $c->add_setting( 'esol_prod_show_price', [
        'default'           => '1',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'refresh',
    ] );
    $c->add_control( 'esol_prod_show_price', [
        'label'   => '💰 Mostrar precio en la tarjeta',
        'section' => 'esol_productos',
        'type'    => 'checkbox',
        'priority' => 35,
    ] );

    // ── Texto del botón de la tarjeta ───────────────────────────
    $c->add_setting( 'esol_prod_btn_txt', [
        'default'           => 'Ver Producto',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'refresh',
    ] );
    $c->add_control( 'esol_prod_btn_txt', [
        'label'   => '🔗 Texto del tooltip del botón de producto',
        'section' => 'esol_productos',
        'type'    => 'text',
        'priority' => 36,
    ] );

    // ── Separador visual ────────────────────────────────────────
    // (Los controles de Categorías manuales siguen en prioridades 40+)

    // Categorías manuales (8) — solo aplican en modo Manual
    $cat_defaults = [
        ['Paneles Solares','Mono y policristalinos'],
        ['Inversores','String y trifásicos'],
        ['Microinversores','Panel a panel'],
        ['Estructura Al.','K2 · Aluminext'],
        ['Cable Solar','4mm y 6mm doble aislamiento'],
        ['Protecciones','Fusibles, breakers, DPS'],
        ['Baterías','Litio · Pylontech'],
        ['Accesorios','Conectores y herramientas'],
    ];
    for ( $i = 1; $i <= 8; $i++ ) {
        $txt( "esol_cat{$i}_name", "Categoría {$i} — nombre",     'esol_productos', $cat_defaults[$i-1][0], 40+($i*2)   );
        $txt( "esol_cat{$i}_sub",  "Categoría {$i} — descripción",'esol_productos', $cat_defaults[$i-1][1], 40+($i*2)+1 );
    }

    // Productos destacados (hasta 8)
    $prod_defaults = [
        ['https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=400&q=80&auto=format&fit=crop', 'JA Solar · Znshine',     'Panel Solar Monocristalino 550W Half Cell'],
        ['https://images.unsplash.com/photo-1620714223084-8fcacc2523cf?w=400&q=80&auto=format&fit=crop', 'Solis · Sungrow · Deye', 'Inversor String 5kW Monofásico con WiFi'],
        ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80&auto=format&fit=crop', 'Hoymiles',               'Microinversor HM-600 600W'],
        ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format&fit=crop',    'K2 Systems · Aluminext', 'Estructura Aluminio Techo Inclinado / Plano'],
        ['','',''],['','',''],['','',''],['','',''],
    ];
    $c->add_setting( 'esol_prod_count', ['default' => 4, 'sanitize_callback' => 'absint'] );
    $c->add_control( 'esol_prod_count', [
        'label'   => '¿Cuántos productos mostrar? (1–8)',
        'section' => 'esol_productos',
        'type'    => 'number',
        'input_attrs' => ['min' => 1, 'max' => 8],
        'priority' => 60,
    ] );
    for ( $i = 1; $i <= 8; $i++ ) {
        $p = $prod_defaults[$i-1];
        $img( "esol_prod{$i}_img",   "Producto {$i} — imagen",  'esol_productos', 70+($i*4)   );
        $txt( "esol_prod{$i}_brand", "Producto {$i} — marca",   'esol_productos', $p[1],       70+($i*4)+1 );
        $txt( "esol_prod{$i}_name",  "Producto {$i} — nombre",  'esol_productos', $p[2],       70+($i*4)+2 );
        // Pre-load default image URL
        if ( $p[0] && ! get_theme_mod("esol_prod{$i}_img") ) {
            // Note: default se configura en add_setting
        }
        // Registrar imagen con default URL
        $c->get_setting("esol_prod{$i}_img") && $c->get_setting("esol_prod{$i}_img")->default = $p[0];
    }

    // ══════════════════════════════════════════
    // SECCIÓN: MARCAS
    // ══════════════════════════════════════════
    $c->add_section( 'esol_marcas', [
        'title'    => '🏷️ Sección Marcas',
        'panel'    => 'esol_panel',
        'priority' => 70,
        'description' => 'Una marca por línea.',
    ] );
    $txt ( 'esol_marcas_label', 'Etiqueta de sección', 'esol_marcas', 'Marcas que Distribuimos', 10 );
    $area( 'esol_marcas_list',  'Marcas (una por línea)', 'esol_marcas',
        "JA SOLAR\nSOLIS\nSUNGROW\nHOYMILES\nK2 SYSTEMS\nALUMINEXT\nFRONIUS\nDEYE\nPYLONTECH\nSMA\nZNSHINE\nGROWATT", 20 );

    // ══════════════════════════════════════════
    // SECCIÓN: POR QUÉ ESOL
    // ══════════════════════════════════════════
    $c->add_section( 'esol_why', [
        'title'    => '✅ Sección Por qué eSol',
        'panel'    => 'esol_panel',
        'priority' => 80,
    ] );
    $txt( 'esol_why_label', 'Etiqueta', 'esol_why', 'Diferenciadores', 10 );
    $txt( 'esol_why_h2',    'Título', 'esol_why', 'Por qué elegir', 20 );
    $txt( 'esol_why_h2g',   'Título parte dorada', 'esol_why', 'eSol', 30 );
    $diffs = [
        ['Ingeniería Única',      'Fotomontaje 3D con dron — una presentación que ningún otro instalador puede ofrecer para cerrar ventas.'],
        ['Distribución Directa',  'Compras directas a fabricantes autorizados. Los mejores precios con garantía oficial de fábrica.'],
        ['Stock Permanente',      'Más de 200 SKUs en inventario con envíos express a toda la República Mexicana.'],
        ['Soporte Técnico',       'Ingenieros solares disponibles para asesoría en dimensionamiento, selección de equipo y resolución técnica.'],
        ['Garantía Oficial',      'Distribuidores autorizados. Todos los productos incluyen garantía de fábrica sin excepción.'],
        ['Red de Proyectos',      'Conectamos instaladores con clientes reales. Ser proveedor de eSol significa acceso a nuevas oportunidades.'],
    ];
    for ( $i = 1; $i <= 6; $i++ ) {
        $txt( "esol_why{$i}_t", "Diferenciador {$i} — título",      'esol_why', $diffs[$i-1][0], 40+($i*2)   );
        $area("esol_why{$i}_d", "Diferenciador {$i} — descripción", 'esol_why', $diffs[$i-1][1], 40+($i*2)+1 );
    }

    // ══════════════════════════════════════════
    // SECCIÓN: CONTACTO
    // ══════════════════════════════════════════
    $c->add_section( 'esol_contact_section', [
        'title'    => '📞 Contacto',
        'panel'    => 'esol_panel',
        'priority' => 90,
    ] );
    $txt ( 'esol_cont_label', 'Etiqueta de sección', 'esol_contact_section', 'Contacto',        10 );
    $txt ( 'esol_cont_h2a',  'Título línea 1', 'esol_contact_section', 'Iniciemos tu',           20 );
    $txt ( 'esol_cont_h2b',  'Título línea 2 (dorado)', 'esol_contact_section', 'proyecto solar',30 );
    $area( 'esol_cont_desc', 'Descripción', 'esol_contact_section',
        'Cotiza un anteproyecto, solicita precios de componentes o resuelve cualquier duda técnica. Respondemos en menos de 24 horas.', 40 );
    $txt ( 'esol_phone',     'Teléfono (visible)', 'esol_contact_section', '+52 (00) 0000-0000',  50 );
    $txt ( 'esol_whatsapp',  'WhatsApp (solo dígitos, ej: 5213312345678)', 'esol_contact_section','5200000000000', 60 );
    $txt ( 'esol_email_display','Email de contacto (visible)', 'esol_contact_section', 'ventas@esolenergias.com', 70 );
    $txt ( 'esol_email',     'Email recepción de formulario', 'esol_contact_section', 'ventas@esolenergias.com', 80 );
    $txt ( 'esol_address',   'Ubicación', 'esol_contact_section', 'Guadalajara, Jalisco, México', 90 );

    // ══════════════════════════════════════════
    // SECCIÓN: REDES SOCIALES
    // ══════════════════════════════════════════
    $c->add_section( 'esol_social', [
        'title'    => '📱 Redes Sociales',
        'panel'    => 'esol_panel',
        'priority' => 95,
    ] );
    $url( 'esol_facebook',  'URL Facebook',  'esol_social', '#', 10 );
    $url( 'esol_instagram', 'URL Instagram', 'esol_social', '#', 20 );
    $url( 'esol_tiktok',    'URL TikTok (opcional)', 'esol_social', '', 30 );
    $url( 'esol_youtube',   'URL YouTube (opcional)', 'esol_social', '', 40 );
    $url( 'esol_linkedin',  'URL LinkedIn (opcional)', 'esol_social', '', 50 );

    // ══════════════════════════════════════════
    // SECCIÓN: FOOTER
    // ══════════════════════════════════════════
    $c->add_section( 'esol_footer_section', [
        'title'    => '📋 Footer',
        'panel'    => 'esol_panel',
        'priority' => 100,
    ] );
    $txt ( 'esol_footer_tagline', 'Tagline del footer', 'esol_footer_section', 'Ingeniería solar avanzada y distribución de componentes fotovoltaicos en México.', 10 );
    $area( 'esol_footer_col1_extra', 'Texto extra columna 1 (opcional)', 'esol_footer_section', '', 20 );

    // ══════════════════════════════════════════
    // B2B PRICING & SECTION VISIBILITY
    // ══════════════════════════════════════════
    include get_template_directory() . '/includes/customizer-b2b.php';
}

/* ══════════════════════════════════════════════
   6. B2B PARTNER ROLE
══════════════════════════════════════════════ */
add_action( 'after_switch_theme', 'esol_register_partner_role' );
function esol_register_partner_role() {
    $customer_role = get_role( 'customer' );
    if ( $customer_role && ! get_role( 'esol_partner' ) ) {
        add_role( 'esol_partner', 'eSol Partner', $customer_role->capabilities );
    }
}

/* ══════════════════════════════════════════════
   7. PRODUCT SEO ASSISTANT (AI)
══════════════════════════════════════════════ */

/**
 * AI SEO Meta Box in Product Editor
 */
add_action( 'add_meta_boxes', function() {
    add_meta_box( 'esol_ai_seo', '🤖 Sugerencias SEO (IA)', 'esol_ai_seo_markup', 'product', 'side', 'high' );
});

function esol_ai_seo_markup( $post ) {
    $title = get_post_meta( $post->ID, '_esol_ai_seo_title', true );
    $desc  = get_post_meta( $post->ID, '_esol_ai_seo_desc', true );
    $nonce = wp_create_nonce('esol_ai_seo_nonce');
    ?>
    <div id="esol-ai-seo-container">
        <div id="esol-ai-results" style="<?php echo $title ? '' : 'display:none;'; ?>">
            <p><strong>Título sugerido:</strong></p>
            <div id="ai-seo-title" style="background: #f6f7f7; border: 1px solid #dcdcde; padding: 8px; border-radius: 4px; font-size: 12px; margin-bottom: 12px;">
                <?php echo esc_html($title); ?>
            </div>
            <p><strong>Descripción sugerida:</strong></p>
            <div id="ai-seo-desc" style="background: #f6f7f7; border: 1px solid #dcdcde; padding: 8px; border-radius: 4px; font-size: 11px; margin-bottom: 12px;">
                <?php echo esc_html($desc); ?>
            </div>
        </div>
        <button type="button" id="esol-gen-seo-btn" class="button button-secondary" style="width:100%;">
            🤖 <?php echo $title ? 'Regenerar con IA' : 'Generar con IA'; ?>
        </button>
    </div>
    <script>
    jQuery('#esol-gen-seo-btn').on('click', function() {
        const btn = jQuery(this).attr('disabled', true).text('Generando...');
        jQuery.post(ajaxurl, { 
            action: 'esol_generate_seo', 
            product_id: <?php echo $post->ID; ?>,
            _ajax_nonce: '<?php echo $nonce; ?>'
        }, function(res) {
            if(res.success) {
                jQuery('#ai-seo-title').text(res.data.title);
                jQuery('#ai-seo-desc').text(res.data.desc);
                jQuery('#esol-ai-results').slideDown();
                btn.text('Regenerar con IA');
            } else {
                alert('Error: ' + res.data.message);
            }
            btn.attr('disabled', false);
        });
    });
    </script>
    <?php
}

add_action( 'wp_ajax_esol_generate_seo', 'esol_ajax_generate_seo' );
function esol_ajax_generate_seo() {
    check_ajax_referer('esol_ai_seo_nonce');
    if ( ! current_user_can( 'edit_products' ) ) wp_send_json_error( [ 'message' => 'Unauthorized' ] );

    $product_id = absint( $_POST['product_id'] );
    if ( ! $product_id ) wp_send_json_error( [ 'message' => 'Invalid ID' ] );

    $product = wc_get_product( $product_id );
    $name = $product->get_name();
    $desc = wp_strip_all_tags( $product->get_description() );

    $prompt = "Eres un experto en SEO para el sector solar en México. Genera un título SEO llamativo (max 60 caracteres) y una meta descripción profesional (max 160 caracteres) para este producto: '$name'. Contexto: $desc. Responde ÚNICAMENTE en formato JSON: {\"title\": \"...\", \"desc\": \"...\"}";
    
    $ai_response = Esol_AI::call_gemini( $prompt );
    if ( is_wp_error( $ai_response ) ) wp_send_json_error( [ 'message' => $ai_response->get_error_message() ] );

    preg_match('/\{.*\}/s', $ai_response, $matches);
    $data = json_decode( $matches[0], true );

    if ( $data && isset($data['title'], $data['desc']) ) {
        update_post_meta( $product_id, '_esol_ai_seo_title', sanitize_text_field( $data['title'] ) );
        update_post_meta( $product_id, '_esol_ai_seo_desc', sanitize_textarea_field( $data['desc'] ) );
        wp_send_json_success( $data );
    }
    
    wp_send_json_error( [ 'message' => 'Failed to parse AI response' ] );
}

/* ══════════════════════════════════════════════
   8. CONTENT IDEAS DASHBOARD WIDGET (AI)
══════════════════════════════════════════════ */

/**
 * Register AI Dashboard Widget
 */
add_action( 'wp_dashboard_setup', function() {
    wp_add_dashboard_widget( 'esol_blog_ai', '📝 Generador de Ideas eSol', 'esol_dashboard_ai_markup' );
});

function esol_dashboard_ai_markup() {
    $nonce = wp_create_nonce('esol_ai_ideas_nonce');
    ?>
    <div id="esol-ai-widget">
        <p>Escribe un tema general para recibir ideas de contenido:</p>
        <div style="display:flex; gap:8px; margin-bottom:15px;">
            <input type="text" id="ai-topic" placeholder="Ej: Energía solar para hoteles" style="flex:1;">
            <button type="button" id="generate-ai-btn" class="button button-primary">Inspirarme</button>
        </div>
        <div id="ai-results" style="background:#f0f0f1; padding:12px; border-radius:4px; min-height:50px; border:1px solid #dcdcde;">
            <span style="color:#646970; font-style:italic;">Las ideas aparecerán aquí...</span>
        </div>
    </div>
    <script>
    jQuery('#generate-ai-btn').on('click', function() {
        const topic = jQuery('#ai-topic').val();
        if(!topic) return;
        const btn = jQuery(this).attr('disabled', true).text('Pensando...');
        const results = jQuery('#ai-results').css('opacity', 0.5);
        
        jQuery.post(ajaxurl, { 
            action: 'esol_generate_ideas', 
            topic: topic,
            _ajax_nonce: '<?php echo $nonce; ?>'
        }, function(res) {
            results.html(res).css('opacity', 1);
        })
        .fail(function() {
            results.html('<p style="color:#d63638;">Error de conexión.</p>').css('opacity', 1);
        })
        .always(function() {
            btn.attr('disabled', false).text('Inspirarme');
        });
    });
    </script>
    <?php
}

/**
 * AJAX Handler for Blog Ideas
 */
add_action( 'wp_ajax_esol_generate_ideas', 'esol_ajax_generate_ideas' );
function esol_ajax_generate_ideas() {
    check_ajax_referer('esol_ai_ideas_nonce');
    if ( ! current_user_can( 'edit_posts' ) ) wp_die('Unauthorized');

    $topic = sanitize_text_field( $_POST['topic'] );
    if ( empty($topic) ) wp_die('Por favor introduce un tema.');

    $prompt = "Eres un estratega de marketing experto en energía solar en México. Genera 3 ideas de artículos de blog para el tema: '$topic'. Para cada idea incluye un título llamativo y 3 puntos clave a tratar. Responde en HTML estructurado (h4, ul, li).";
    
    $ai_response = Esol_AI::call_gemini( $prompt );
    if ( is_wp_error( $ai_response ) ) {
        echo '<p style="color:#d63638;">Error: ' . $ai_response->get_error_message() . '</p>';
    } else {
        echo wp_kses_post( $ai_response );
    }
    wp_die();
}

