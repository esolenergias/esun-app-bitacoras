<?php
/**
 * front-page.php — Landing page completamente dinámica v2.0
 * Todo el contenido es editable desde Apariencia → Personalizar → ⚡ eSol
 */
get_header();

// ── Datos de contacto ───────────────────────
$phone   = esol_get( 'esol_phone',         '+52 (00) 0000-0000' );
$email   = esol_get( 'esol_email_display', 'ventas@esolenergias.com' );
$address = esol_get( 'esol_address',       'Guadalajara, Jalisco, México' );
$wa      = esol_whatsapp_url( 'Hola eSol, quiero información' );
$wa_ante = esol_whatsapp_url( esol_get('esol_ante_cta', 'Solicitar Muestra Gratuita') );

// ── Hero ─────────────────────────────────────
$hero_img     = esol_img( 'esol_hero_img', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=85&auto=format&fit=crop' );
$hero_img_lbl = esol_get( 'esol_hero_img_lbl', 'Proyección Solar' );

// ── Anteproyecto ─────────────────────────────
$ante_img = esol_img( 'esol_ante_img', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=700&q=85&auto=format&fit=crop' );
?>

<!-- Hero rendered by React component (#esol-header-root in header.php) -->


<!-- ══════════════════════════════════════════
     SERVICIOS
══════════════════════════════════════════ -->
<?php if ( esol_section_visible('servicios') ) : ?>
<section id="servicios" class="section sect-bg2" aria-label="Servicios">
  <div class="container">

    <div class="section-header reveal">
      <div>
        <p class="section-label"><?php echo esol_get('esol_serv_label','Nuestros Servicios'); ?></p>
        <h2 class="section-title">
          <?php echo esol_get('esol_serv_h2a','Dos soluciones,'); ?><br/>
          <span class="text-gold-gradient"><?php echo esol_get('esol_serv_h2b','un solo aliado'); ?></span>
        </h2>
      </div>
      <p class="section-intro"><?php echo esol_get('esol_serv_desc','Servimos tanto al instalador que quiere cerrar ventas como al profesional que necesita los mejores componentes.'); ?></p>
    </div>

    <div class="gold-line reveal" aria-hidden="true" style="margin-bottom:3rem;"></div>

    <div class="services-grid">

      <!-- B2B -->
      <div class="service-card card-hover sect-bg2">
        <p class="section-label"><?php echo esol_get('esol_b2b_label','01 — Para Instaladores'); ?></p>
        <h3><?php echo nl2br(esol_get('esol_b2b_title','Anteproyecto Solar con Fotomontaje 3D')); ?></h3>
        <p><?php echo esol_get('esol_b2b_desc','Transformamos una fotografía aérea con dron en un modelo 3D fotorrealista del sistema solar instalado sobre la propiedad.'); ?></p>
        <ul class="service-list">
          <?php for ($i=1;$i<=4;$i++): $li = get_theme_mod("esol_b2b_li{$i}",""); if($li): ?>
          <li><?php echo esc_html($li); ?></li>
          <?php endif; endfor; ?>
        </ul>
        <a href="#anteproyecto" class="link-arrow">
          Solicitar Anteproyecto
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>

      <!-- B2C -->
      <div class="service-card service-card--alt card-hover sect-bg3">
        <p class="section-label"><?php echo esol_get('esol_b2c_label','02 — Distribución'); ?></p>
        <h3><?php echo nl2br(esol_get('esol_b2c_title','Venta de Componentes Fotovoltaicos')); ?></h3>
        <p><?php echo esol_get('esol_b2c_desc','Distribuimos todos los componentes necesarios para una instalación solar completa.'); ?></p>
        <ul class="service-list">
          <?php for ($i=1;$i<=4;$i++): $li = get_theme_mod("esol_b2c_li{$i}",""); if($li): ?>
          <li><?php echo esc_html($li); ?></li>
          <?php endif; endfor; ?>
        </ul>
        <a href="#productos" class="link-arrow">
          Ver Catálogo
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>

    </div>
  </div>
</section>
<?php endif; ?>


<!-- ══════════════════════════════════════════
     ANTEPROYECTO
══════════════════════════════════════════ -->
<?php if ( esol_section_visible('anteproyecto') ) : ?>
<section id="anteproyecto" class="section sect-bg1 topo-bg" aria-label="Anteproyecto Solar 3D">
  <div class="container">
    <div class="two-col-grid">

      <!-- Imagen -->
      <div class="ante-story-container reveal-left">
        <div class="ante-layers">
          <img src="<?php echo $ante_img; ?>" class="ante-layer layer-base" alt="Dron Original" width="700" height="450" loading="lazy">
          <div class="ante-layer layer-mesh" aria-hidden="true" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'none\'/%3E%3Cpath d=\'M0 0l100 100M100 0L0 100M0 50h100M50 0v100\' stroke=\'rgba(196,152,37,0.2)\' stroke-width=\'0.5\'/%3E%3C/svg%3E');"></div>
          <div class="ante-layer layer-panels" aria-hidden="true" style="background-image: radial-gradient(circle at 30% 40%, rgba(196,152,37,0.4) 0%, transparent 60%);">
            <!-- Simulación de paneles con CSS/Gradients para esta fase -->
            <div class="css-panel-mock"></div>
          </div>
          <div class="ante-layer layer-data" aria-hidden="true">
            <div class="tech-tag tag-1">
              <span class="tag-label">Precisión 3D</span>
              <span class="tag-value">99.8%</span>
            </div>
            <div class="tech-tag tag-2">
              <span class="tag-label">Paneles 550W</span>
              <span class="tag-value">Cierre de Venta</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div>
        <p class="section-label reveal"><?php echo esol_get('esol_ante_label','Cierre de Venta Solar'); ?></p>
        <h2 class="section-title reveal" style="transition-delay:.1s">
          <?php echo esol_get('esol_ante_h2a','El cliente ve su casa'); ?><br/>
          <span class="text-gold-gradient"><?php echo esol_get('esol_ante_h2b','con los paneles instalados'); ?></span>
        </h2>
        <div class="gold-line reveal" style="max-width:60px;margin-bottom:2rem;transition-delay:.15s;" aria-hidden="true"></div>
        <p class="body-text reveal" style="transition-delay:.2s;margin-bottom:2.5rem;">
          <?php echo esol_get('esol_ante_desc','Usamos fotografía aérea con dron y modelado 3D para crear una proyección fotorrealista del sistema solar sobre la propiedad real del cliente.'); ?>
        </p>

        <ol class="steps reveal" style="transition-delay:.25s;">
          <?php for ($i=1;$i<=3;$i++):
            $t = get_theme_mod("esol_ante_step{$i}_t","");
            $d = get_theme_mod("esol_ante_step{$i}_d","");
            if (!$t) continue;
          ?>
          <li class="step">
            <div class="step-num" aria-hidden="true"><span>0<?php echo $i; ?></span></div>
            <div>
              <strong><?php echo esc_html($t); ?></strong>
              <p><?php echo esc_html($d); ?></p>
            </div>
          </li>
          <?php endfor; ?>
        </ol>

        <a href="<?php echo esc_url($wa_ante); ?>" target="_blank" rel="noopener"
           class="btn-gold reveal" style="transition-delay:.3s;display:inline-flex;align-items:center;gap:.75rem;">
          <?php echo esol_get('esol_ante_cta','Solicitar Muestra Gratuita'); ?>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>

    </div>
  </div>
</section>
<?php endif; ?>


<!-- ══════════════════════════════════════════
     COTIZADOR SMART
══════════════════════════════════════════ -->
<?php if ( esol_section_visible('cotizador') ) : ?>
<section id="cotizador" class="section sect-bg3 topo-bg" aria-label="Cotizador Solar">
  <div class="container">
    <div id="esol-calculator-root"></div>
  </div>
</section>
<?php endif; ?>


<!-- ══════════════════════════════════════════
     PRODUCTOS
══════════════════════════════════════════ -->
<?php if ( esol_section_visible('productos') ) : ?>
<section id="productos" class="section sect-bg2" aria-label="Productos">
  <div class="container">

    <div class="reveal" style="margin-bottom:3rem;">
      <p class="section-label"><?php echo esol_get('esol_prod_label','Catálogo'); ?></p>
      <div class="section-header">
        <h2 class="section-title">
          <?php echo esol_get('esol_prod_h2a','Componentes Solares'); ?><br/>
          <span class="text-gold-gradient"><?php echo esol_get('esol_prod_h2b','de Primera Línea'); ?></span>
        </h2>
        <a href="#contacto" class="link-arrow">
          Solicitar lista de precios
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>
    </div>

    <div class="gold-line reveal" aria-hidden="true" style="margin-bottom:3rem;"></div>

    <?php
    $prod_source   = get_theme_mod( 'esol_prod_source', 'woo' );
    $woo_available = esol_woo_active();
    $use_woo       = ( $prod_source === 'woo' && $woo_available );
    ?>

    <?php if ( $use_woo ) : /* ══════ MODO WOOCOMMERCE ══════ */ ?>

    <?php
    $raw_cats     = get_theme_mod( 'esol_prod_woo_cats', "paneles-solares\ninversores\nmicroinversores\nestructuras\ncable-solar\nbaterias" );
    $cat_slugs    = esol_parse_cat_slugs( $raw_cats );
    $woo_count    = max( 1, (int) get_theme_mod( 'esol_prod_woo_count', 4 ) );
    $show_price   = (bool) get_theme_mod( 'esol_prod_show_price', '1' );
    $feat_only    = (bool) get_theme_mod( 'esol_prod_woo_featured', '0' );
    $btn_txt      = esc_html( get_theme_mod( 'esol_prod_btn_txt', 'Ver Producto' ) );
    ?>

    <!-- Pestañas de grupos / categorías -->
    <div class="prod-tabs reveal" role="tablist" aria-label="Grupos de productos">
      <?php foreach ( $cat_slugs as $idx => $slug ) :
        $label  = esol_woo_cat_label( $slug );
        $panel  = 'esol-tab-' . sanitize_html_class( $slug );
        $active = ( $idx === 0 );
      ?>
      <button
        class="prod-tab-btn<?php echo $active ? ' active' : ''; ?>"
        role="tab"
        aria-selected="<?php echo $active ? 'true' : 'false'; ?>"
        aria-controls="<?php echo esc_attr( $panel ); ?>"
        data-target="<?php echo esc_attr( $panel ); ?>"
        onclick="esolTab(this)"
      ><?php echo $label; ?></button>
      <?php endforeach; ?>
    </div>

    <!-- Paneles de productos por grupo -->
    <?php foreach ( $cat_slugs as $idx => $slug ) :
      $panel    = 'esol-tab-' . sanitize_html_class( $slug );
      $active   = ( $idx === 0 );
      $products = esol_get_woo_products( $slug, $woo_count, $feat_only );
    ?>
    <div
      id="<?php echo esc_attr( $panel ); ?>"
      class="prod-tab-panel<?php echo $active ? ' active' : ''; ?>"
      role="tabpanel"
      aria-label="<?php echo esc_attr( esol_woo_cat_label( $slug ) ); ?>"
    >
      <?php if ( empty( $products ) ) : ?>
      <div class="prod-empty">
        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <p>Aún no hay productos publicados en <strong><?php echo esol_woo_cat_label( $slug ); ?></strong>.</p>
        <?php if ( current_user_can('manage_options') ) : ?>
        <a href="<?php echo esc_url( admin_url('post-new.php?post_type=product') ); ?>" class="btn-cotizar" style="margin-top:1rem;display:inline-flex;">
          + Agregar producto en WooCommerce
        </a>
        <?php endif; ?>
      </div>

      <?php else : ?>
      <div class="products-grid" style="--grid-cols:<?php echo min( count( $products ), 4 ); ?>;">
        <?php foreach ( $products as $prod ) :
          $product_obj = wc_get_product( $prod->ID );
          if ( ! $product_obj ) continue;
          $img_url  = get_the_post_thumbnail_url( $prod->ID, 'woocommerce_single' )
                   ?: get_the_post_thumbnail_url( $prod->ID, 'medium' )
                   ?: '';
          $name     = get_the_title( $prod->ID );
          $link     = get_permalink( $prod->ID );
          $sku      = $product_obj->get_sku();
          // Marca: primero atributo "pa_marca", si no existe la primera categoría
          $marca    = '';
          $attr     = $product_obj->get_attribute( 'pa_marca' );
          if ( $attr ) {
              $marca = $attr;
          } else {
              $terms = get_the_terms( $prod->ID, 'product_cat' );
              if ( $terms && ! is_wp_error( $terms ) ) {
                  $marca = $terms[0]->name;
              }
          }
        ?>
        <div class="product-card sect-bg2">
          <?php if ( $img_url ) : ?>
          <div class="product-img-wrap">
            <img src="<?php echo esc_url( $img_url ); ?>"
                 alt="<?php echo esc_attr( $name ); ?>"
                 class="product-img" width="400" height="208" loading="lazy" />
          </div>
          <?php else : ?>
          <div class="product-img-placeholder">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <?php endif; ?>
          <div class="product-info">
            <?php if ( $marca ) : ?>
            <p class="product-brand"><?php echo esc_html( $marca ); ?></p>
            <?php endif; ?>
            <h4 class="product-name"><?php echo esc_html( $name ); ?></h4>
            <?php if ( $sku ) : ?>
            <p class="product-sku">SKU <?php echo esc_html( $sku ); ?></p>
            <?php endif; ?>
            <div class="product-footer">
              <?php if ( $show_price && $product_obj->get_price() !== '' ) : ?>
              <span class="wc-price"><?php echo $product_obj->get_price_html(); ?></span>
              <?php else : ?>
              <span>Consultar precio</span>
              <?php endif; ?>
              <a href="<?php echo esc_url( $link ); ?>"
                 class="product-arrow"
                 title="<?php echo esc_attr( $btn_txt ); ?>"
                 aria-label="<?php echo esc_attr( $btn_txt . ': ' . $name ); ?>">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <?php endforeach; ?>
      </div><!-- /products-grid -->
      <?php endif; ?>
    </div><!-- /prod-tab-panel -->
    <?php endforeach; ?>

    <script>
    function esolTab(btn) {
      var target = btn.getAttribute('data-target');
      var tabs   = document.querySelectorAll('.prod-tab-btn');
      var panels = document.querySelectorAll('.prod-tab-panel');
      tabs.forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      var panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    }
    </script>

    <?php else : /* ══════ MODO MANUAL ══════ */ ?>

    <!-- Categorías con íconos (modo manual) -->
    <?php
    $icons = [
      'M3 4h18M3 8h18M3 12h18M3 16h10',
      'M13 10V3L4 14h7v7l9-11h-7z',
      'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
      'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
      'M20 3H4v10c0 3.866 3.582 7 8 7s8-3.134 8-7V3z',
      'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      'M5 13l4 4L19 7',
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    ];
    $cat_defaults = [
      ['Paneles Solares','Mono y policristalinos'],['Inversores','String y trifásicos'],
      ['Microinversores','Panel a panel'],['Estructura Al.','K2 · Aluminext'],
      ['Cable Solar','4mm y 6mm'],['Protecciones','Fusibles, breakers, DPS'],
      ['Baterías','Litio · Pylontech'],['Accesorios','Conectores y herramientas'],
    ];
    ?>
    <div class="cat-grid reveal" role="list">
      <?php for ($i=1;$i<=8;$i++):
        $name = get_theme_mod("esol_cat{$i}_name", $cat_defaults[$i-1][0]);
        $sub  = get_theme_mod("esol_cat{$i}_sub",  $cat_defaults[$i-1][1]);
        if (!$name) continue;
      ?>
      <div class="cat-item sect-bg2" role="listitem">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="cat-icon">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="<?php echo esc_attr($icons[$i-1]); ?>"/>
        </svg>
        <div>
          <strong><?php echo esc_html($name); ?></strong>
          <span><?php echo esc_html($sub); ?></span>
        </div>
      </div>
      <?php endfor; ?>
    </div>

    <!-- Productos destacados (manual) -->
    <p class="section-label reveal" style="margin:3rem 0 1.5rem;">Productos Destacados</p>

    <?php
    $prod_count = (int) get_theme_mod('esol_prod_count', 4);
    $prod_img_defaults = [
      'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620714223084-8fcacc2523cf?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format&fit=crop',
    ];
    $prod_brand_defaults = ['JA Solar · Znshine','Solis · Sungrow · Deye','Hoymiles','K2 Systems · Aluminext','','','',''];
    $prod_name_defaults  = ['Panel Solar Monocristalino 550W Half Cell','Inversor String 5kW Monofásico con WiFi','Microinversor HM-600 600W','Estructura Aluminio Techo Inclinado / Plano','','','',''];
    ?>
    <div class="products-grid reveal" style="--grid-cols:<?php echo min($prod_count,4); ?>;">
      <?php for ($i=1;$i<=$prod_count&&$i<=8;$i++):
        $img_s = get_theme_mod("esol_prod{$i}_img", $prod_img_defaults[$i-1]   ?? '');
        $brand = get_theme_mod("esol_prod{$i}_brand", $prod_brand_defaults[$i-1] ?? '');
        $name  = get_theme_mod("esol_prod{$i}_name",  $prod_name_defaults[$i-1]  ?? '');
        if (!$img_s && !$name) continue;
      ?>
      <div class="product-card sect-bg2">
        <?php if ($img_s): ?>
        <div class="product-img-wrap">
          <img src="<?php echo esc_url($img_s); ?>"
               alt="<?php echo esc_attr($name); ?>"
               class="product-img" width="400" height="208" loading="lazy" />
        </div>
        <?php endif; ?>
        <div class="product-info">
          <?php if ($brand): ?><p class="product-brand"><?php echo esc_html($brand); ?></p><?php endif; ?>
          <h4 class="product-name"><?php echo nl2br(esc_html($name)); ?></h4>
          <div class="product-footer">
            <span>Consultar precio</span>
            <a href="#contacto" aria-label="Consultar precio de <?php echo esc_attr($name); ?>" class="product-arrow">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </a>
          </div>
        </div>
      </div>
      <?php endfor; ?>
    </div>

    <?php endif; /* fin if use_woo */ ?>

  </div>
</section>
<?php endif; ?>


<!-- ══════════════════════════════════════════
     MARCAS
══════════════════════════════════════════ -->
<?php if ( esol_section_visible('marcas') ) : ?>
<section id="marcas" class="section sect-bg1 marcas-section" aria-label="Marcas">
  <div class="container">
    <p class="section-label reveal" style="text-align:center;"><?php echo esol_get('esol_marcas_label','Marcas que Distribuimos'); ?></p>
    <?php
    $brands_raw = get_theme_mod('esol_marcas_list', "JA SOLAR\nSOLIS\nSUNGROW\nHOYMILES\nK2 SYSTEMS\nALUMINEXT\nFRONIUS\nDEYE\nPYLONTECH\nSMA\nZNSHINE\nGROWATT");
    $brands = array_filter( array_map('trim', explode("\n", $brands_raw)) );
    ?>
    <div class="brands-grid reveal" role="list">
      <?php foreach ($brands as $b): ?>
      <div class="brand-item sect-bg1" role="listitem">
        <span><?php echo esc_html($b); ?></span>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php endif; ?>


<!-- ══════════════════════════════════════════
     POR QUÉ ESOL
══════════════════════════════════════════ -->
<?php if ( esol_section_visible('por_que_esol') ) : ?>
<section class="section sect-bg3 topo-bg" aria-label="Por qué eSol">
  <div class="container">
    <div class="reveal" style="margin-bottom:2rem;">
      <p class="section-label"><?php echo esol_get('esol_why_label','Diferenciadores'); ?></p>
      <h2 class="section-title">
        <?php echo esol_get('esol_why_h2','Por qué elegir'); ?>
        <span class="text-gold-gradient"><?php echo esol_get('esol_why_h2g','eSol'); ?></span>
      </h2>
    </div>
    <div class="gold-line reveal" aria-hidden="true" style="margin-bottom:3rem;"></div>
    <div class="diffs-grid reveal">
      <?php for ($i=1;$i<=6;$i++):
        $t = get_theme_mod("esol_why{$i}_t","");
        $d = get_theme_mod("esol_why{$i}_d","");
        if (!$t) continue;
      ?>
      <div class="diff-item">
        <div class="diff-num" aria-hidden="true">0<?php echo $i; ?></div>
        <strong><?php echo esc_html($t); ?></strong>
        <p><?php echo esc_html($d); ?></p>
      </div>
      <?php endfor; ?>
    </div>
  </div>
</section>
<?php endif; ?>


<!-- ══════════════════════════════════════════
     CONTACTO
══════════════════════════════════════════ -->
<section id="contacto" class="section sect-bg2" aria-label="Contacto">
  <div class="container">
    <div class="two-col-grid">

      <!-- Info -->
      <div>
        <p class="section-label reveal"><?php echo esol_get('esol_cont_label','Contacto'); ?></p>
        <h2 class="section-title reveal" style="transition-delay:.1s;">
          <?php echo esol_get('esol_cont_h2a','Iniciemos tu'); ?><br/>
          <span class="text-gold-gradient"><?php echo esol_get('esol_cont_h2b','proyecto solar'); ?></span>
        </h2>
        <div class="gold-line reveal" style="max-width:60px;margin-bottom:2.5rem;transition-delay:.15s;" aria-hidden="true"></div>
        <p class="body-text reveal" style="transition-delay:.2s;max-width:360px;margin-bottom:3rem;">
          <?php echo esol_get('esol_cont_desc','Cotiza un anteproyecto, solicita precios de componentes o resuelve cualquier duda técnica. Respondemos en menos de 24 horas.'); ?>
        </p>

        <div class="contact-list reveal" style="transition-delay:.25s;">
          <div class="contact-item">
            <div class="contact-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <div>
              <span class="contact-label">WhatsApp / Teléfono</span>
              <a href="<?php echo esc_url($wa); ?>" class="contact-value"><?php echo $phone; ?></a>
            </div>
          </div>
          <div class="contact-item">
            <div class="contact-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <span class="contact-label">Correo</span>
              <a href="mailto:<?php echo $email; ?>" class="contact-value"><?php echo $email; ?></a>
            </div>
          </div>
          <div class="contact-item">
            <div class="contact-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <span class="contact-label">Ubicación</span>
              <span class="contact-value"><?php echo $address; ?></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <div class="reveal" style="transition-delay:.2s;">
        <div class="form-card">
          <h3>Enviar Mensaje</h3>
          <form id="esolForm" novalidate>
            <div class="form-row">
              <div class="form-field">
                <label for="nombre">Nombre <span style="color:var(--gold-txt);">*</span></label>
                <input type="text" id="nombre" name="nombre" required placeholder="Tu nombre" autocomplete="name" />
              </div>
              <div class="form-field">
                <label for="empresa">Empresa</label>
                <input type="text" id="empresa" name="empresa" placeholder="Tu empresa" autocomplete="organization" />
              </div>
            </div>
            <div class="form-field">
              <label for="email">Email <span style="color:var(--gold-txt);">*</span></label>
              <input type="email" id="email" name="email" required placeholder="correo@empresa.com" autocomplete="email" />
            </div>
            <div class="form-field">
              <label for="interes">Interés <span style="color:var(--gold-txt);">*</span></label>
              <select id="interes" name="interes" required>
                <option value="" disabled selected>Selecciona una opción</option>
                <option value="anteproyecto">Anteproyecto Solar 3D</option>
                <option value="paneles">Paneles Solares</option>
                <option value="inversores">Inversores / Microinversores</option>
                <option value="estructura">Estructura de Aluminio</option>
                <option value="cable">Cable Solar y Accesorios</option>
                <option value="baterias">Baterías</option>
                <option value="kit">Kit Solar Completo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-field">
              <label for="mensaje">Mensaje</label>
              <textarea id="mensaje" name="mensaje" rows="4" placeholder="Cuéntanos sobre tu proyecto..."></textarea>
            </div>
            <button type="submit" id="formSubmit" class="btn-gold btn-full">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Enviar Mensaje
            </button>
            <p id="formMsg" role="alert" aria-live="polite" style="display:none;text-align:center;margin-top:1rem;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;"></p>
          </form>
        </div>
      </div>

    </div>
  </div>
</section>

<?php get_footer(); ?>
