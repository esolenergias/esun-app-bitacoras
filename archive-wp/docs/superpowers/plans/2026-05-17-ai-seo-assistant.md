# AI Assistant for SEO & Content (Block 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Google Gemini AI to automate product SEO suggestions and generate blog content ideas within the WordPress admin.

**Architecture:** We will create a central `AI_Helper` class to communicate with Gemini 1.5 Flash. We'll hook into product saving to generate SEO metadata as post meta. A custom Meta Box in the product editor and a Dashboard Widget will provide the UI for the administrator.

**Tech Stack:** PHP (WP Remote API), JavaScript (Admin AJAX), Gemini 1.5 Flash API.

---

### Task 1: AI Configuration in Customizer

**Files:**
- Modify: `esolenergias-theme/includes/customizer-b2b.php`

- [ ] **Step 1: Add AI Configuration section**

Append this code to `esolenergias-theme/includes/customizer-b2b.php`.

```php
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
```

- [ ] **Step 2: Commit**

```bash
git add esolenergias-theme/includes/customizer-b2b.php
git commit -m "feat: add AI configuration to customizer"
```

---

### Task 2: Core Gemini API Integration

**Files:**
- Create: `esolenergias-theme/includes/class-esol-ai.php`
- Modify: `esolenergias-theme/functions.php`

- [ ] **Step 1: Implement the AI Helper Class**

Create `esolenergias-theme/includes/class-esol-ai.php` to handle API requests.

```php
<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Esol_AI {
    private static $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public static function call_gemini( $prompt ) {
        $api_key = get_theme_mod( 'esol_gemini_api_key' );
        if ( ! $api_key ) return new WP_Error( 'no_api_key', 'API Key missing' );

        $response = wp_remote_post( self::$endpoint . '?key=' . $api_key, [
            'headers' => [ 'Content-Type' => 'application/json' ],
            'body'    => json_encode([
                'contents' => [[ 'parts' => [[ 'text' => $prompt ]] ]]
            ]),
            'timeout' => 20
        ]);

        if ( is_wp_error( $response ) ) return $response;

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
        
        return $text;
    }
}
```

- [ ] **Step 2: Include the class in functions.php**

```php
require_once get_template_directory() . '/includes/class-esol-ai.php';
```

---

### Task 3: Product SEO Assistant (Meta Box & Logic)

**Files:**
- Modify: `esolenergias-theme/functions.php`
- Modify: `esolenergias-theme/includes/class-esol-ai.php`

- [ ] **Step 1: Hook into product save to generate suggestions**

Add to `functions.php`:

```php
add_action( 'woocommerce_process_product_meta', 'esol_generate_ai_seo_suggestions', 20, 1 );
function esol_generate_ai_seo_suggestions( $product_id ) {
    if ( ! get_theme_mod( 'esol_ai_seo_enabled', true ) ) return;
    
    $product = wc_get_product( $product_id );
    $name = $product->get_name();
    $desc = wp_strip_all_tags( $product->get_description() );
    
    $prompt = "Actúa como experto SEO en energía solar en México. Genera un título SEO (max 60 caracteres) y una meta descripción (max 160 caracteres) para el producto: '$name'. Contexto: $desc. Responde SOLO en formato JSON: {\"title\": \"...\", \"desc\": \"...\"}";
    
    $ai_response = Esol_AI::call_gemini( $prompt );
    if ( is_wp_error( $ai_response ) ) return;

    // Parse JSON
    preg_match('/\{.*\}/s', $ai_response, $matches);
    $data = json_decode( $matches[0], true );

    if ( $data ) {
        update_post_meta( $product_id, '_esol_ai_seo_title', sanitize_text_field( $data['title'] ) );
        update_post_meta( $product_id, '_esol_ai_seo_desc', sanitize_textarea_field( $data['desc'] ) );
    }
}
```

- [ ] **Step 2: Register the Meta Box in admin**

Add to `functions.php`:

```php
add_action( 'add_meta_boxes', function() {
    add_meta_box( 'esol_ai_seo', '🤖 Sugerencias SEO (IA)', 'esol_ai_seo_markup', 'product', 'side', 'high' );
});

function esol_ai_seo_markup( $post ) {
    $title = get_post_meta( $post->ID, '_esol_ai_seo_title', true );
    $desc  = get_post_meta( $post->ID, '_esol_ai_seo_desc', true );
    
    if ( ! $title ) {
        echo '<p>Guarda el producto para generar sugerencias.</p>';
        return;
    }
    ?>
    <div class="esol-ai-box">
        <p><strong>Título:</strong><br/><?php echo esc_html($title); ?></p>
        <p><strong>Descripción:</strong><br/><small><?php echo esc_html($desc); ?></small></p>
        <hr/>
        <p style="font-size: 10px; opacity: 0.6;">Sugerido por Gemini 1.5 Flash</p>
    </div>
    <?php
}
```

---

### Task 4: Content Ideas Dashboard Widget

**Files:**
- Modify: `esolenergias-theme/functions.php`

- [ ] **Step 1: Register Dashboard Widget**

```php
add_action( 'wp_dashboard_setup', function() {
    wp_add_dashboard_widget( 'esol_blog_ai', '📝 Generador de Ideas eSol', 'esol_dashboard_ai_markup' );
});

function esol_dashboard_ai_markup() {
    ?>
    <div id="esol-ai-widget">
        <p>Introduce un tema para recibir ideas de blog:</p>
        <input type="text" id="ai-topic" placeholder="Ej: Inversores vs Microinversores" style="width:100%; margin-bottom:10px;">
        <button type="button" id="generate-ai-btn" class="button button-primary">Generar Ideas</button>
        <div id="ai-results" style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;"></div>
    </div>
    <script>
    jQuery('#generate-ai-btn').on('click', function() {
        const topic = jQuery('#ai-topic').val();
        if(!topic) return;
        const btn = jQuery(this).attr('disabled', true).text('Pensando...');
        
        jQuery.post(ajaxurl, { action: 'esol_generate_ideas', topic: topic }, function(res) {
            jQuery('#ai-results').html(res);
            btn.attr('disabled', false).text('Generar Ideas');
        });
    });
    </script>
    <?php
}
```

- [ ] **Step 2: Implement AJAX Handler**

```php
add_action( 'wp_ajax_esol_generate_ideas', 'esol_ajax_generate_ideas' );
function esol_ajax_generate_ideas() {
    $topic = sanitize_text_field( $_POST['topic'] );
    $prompt = "Eres un estratega de contenido para una empresa solar en México. Genera 3 títulos de blog ganadores y un breve esquema para el tema: '$topic'. Responde en HTML simple (ul, li, strong).";
    
    $ai_response = Esol_AI::call_gemini( $prompt );
    if ( is_wp_error( $ai_response ) ) {
        echo 'Error: ' . $ai_response->get_error_message();
    } else {
        echo wp_kses_post( $ai_response );
    }
    wp_die();
}
```
