<!DOCTYPE html>
<html <?php language_attributes(); ?> data-theme="<?php echo isset($_COOKIE['esol-theme']) ? sanitize_text_field($_COOKIE['esol-theme']) : 'light'; ?>" data-gsap-enabled="<?php echo get_theme_mod('esol_enable_gsap', true) ? 'true' : 'false'; ?>">
<head>
  <meta charset="<?php bloginfo('charset'); ?>" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<!-- ══ WHATSAPP FLOAT ══ -->
<a href="<?php echo esol_whatsapp_url(); ?>" target="_blank" rel="noopener" class="wa-btn" aria-label="WhatsApp">
  <svg style="color:#fff;width:28px;height:28px;" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>

<!-- ══ NAVBAR ══ -->
<nav id="navbar" aria-label="Navegación principal">
  <div class="nav-container">

    <!-- Logo -->
    <a href="<?php echo esc_url(home_url('/')); ?>" class="nav-logo" aria-label="<?php bloginfo('name'); ?> — Inicio">
      <?php esol_render_logo(); ?>
    </a>

    <!-- Desktop Links -->
    <div class="nav-links" role="navigation">
      <?php for ($i = 1; $i <= 4; $i++):
        $link_text = get_theme_mod("esol_nav_link{$i}", ['Servicios','Anteproyecto','Productos','Marcas'][$i-1]);
        $link_anc  = get_theme_mod("esol_nav_anc{$i}",  ['servicios','anteproyecto','productos','marcas'][$i-1]);
        if ($link_text):
      ?>
      <a href="#<?php echo esc_attr($link_anc); ?>" class="nav-link"><?php echo esc_html($link_text); ?></a>
      <?php endif; endfor; ?>
    </div>

    <!-- Actions -->
    <div class="nav-actions">
      <button id="themeToggle" aria-label="Cambiar entre modo oscuro y claro" onclick="(function(){var h=document.documentElement,t=h.getAttribute('data-theme')==='light'?'dark':'light';h.setAttribute('data-theme',t);try{localStorage.setItem('esol-theme',JSON.stringify({theme:t,expiryTime:Date.now()+86400000}));}catch(e){}document.cookie='esol-theme='+t+';max-age=86400;path=/;SameSite=Lax';window.dispatchEvent(new CustomEvent('themechange',{detail:{theme:t}}));})()">
        <svg id="icon-moon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
        <svg id="icon-sun" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
      </button>
      <a href="#contacto" class="btn-cotizar"><?php echo esol_get('esol_nav_cta', 'Cotizar'); ?></a>
      <button id="menuBtn" class="nav-hamburger" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobileMenu">
        <svg id="menuIcon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile Menu -->
  <div id="mobileMenu" role="navigation" aria-label="Menú móvil" hidden>
    <?php for ($i = 1; $i <= 4; $i++):
      $link_text = get_theme_mod("esol_nav_link{$i}", ['Servicios','Anteproyecto','Productos','Marcas'][$i-1]);
      $link_anc  = get_theme_mod("esol_nav_anc{$i}",  ['servicios','anteproyecto','productos','marcas'][$i-1]);
      if ($link_text):
    ?>
    <a href="#<?php echo esc_attr($link_anc); ?>" class="nav-link" onclick="closeMobile()"><?php echo esc_html($link_text); ?></a>
    <?php endif; endfor; ?>
    <a href="#contacto" class="btn-cotizar mobile" onclick="closeMobile()"><?php echo esol_get('esol_nav_cta', 'Cotizar'); ?> Ahora</a>
  </div>
</nav>

<!-- ══ REACT HEADER ISLAND ══ -->
<div id="esol-header-root"></div>
<script>
window.esolHeroData = {
  badge:    "<?php echo esc_js( get_theme_mod('esol_hero_label', 'Ingeniería Solar Profesional') ); ?>",
  h1a:      "<?php echo esc_js( get_theme_mod('esol_hero_h1a',   'Proyectos Solares') ); ?>",
  h1b:      "<?php echo esc_js( get_theme_mod('esol_hero_h1b',   'de Precisión') ); ?>",
  subline:  "<?php echo esc_js( get_theme_mod('esol_hero_subline','eSol Energías') ); ?>",
  desc:     "<?php echo esc_js( get_theme_mod('esol_hero_desc',  'Anteproyectos con fotomontaje 3D para instaladores que buscan cerrar más ventas, y distribución de componentes fotovoltaicos de primer nivel para todo México.') ); ?>",
  cta1:     "<?php echo esc_js( get_theme_mod('esol_hero_cta1',     'Anteproyecto 3D') ); ?>",
  cta1Anc:  "<?php echo esc_js( get_theme_mod('esol_hero_cta1_anc', 'anteproyecto') ); ?>",
  cta2:     "<?php echo esc_js( get_theme_mod('esol_hero_cta2',     'Ver Catálogo') ); ?>",
  cta2Anc:  "<?php echo esc_js( get_theme_mod('esol_hero_cta2_anc', 'productos') ); ?>",
  stat1Num: "<?php echo esc_js( get_theme_mod('esol_stat1_num', '150+') ); ?>",
  stat1Lbl: "<?php echo esc_js( get_theme_mod('esol_stat1_lbl', 'Proyectos') ); ?>",
  stat2Num: "<?php echo esc_js( get_theme_mod('esol_stat2_num', '15+') ); ?>",
  stat2Lbl: "<?php echo esc_js( get_theme_mod('esol_stat2_lbl', 'Marcas') ); ?>",
  stat3Num: "<?php echo esc_js( get_theme_mod('esol_stat3_num', '5 MW') ); ?>",
  stat3Lbl: "<?php echo esc_js( get_theme_mod('esol_stat3_lbl', 'Instalados') ); ?>",
  heroImg:  "<?php echo esc_js( esol_img('esol_hero_img', '') ); ?>"
};
window.esolCalcData = {
  dacThreshold: <?php echo (int) get_theme_mod('esol_calc_dac_threshold', 3000); ?>,
  kwhRegular:   <?php echo (float) get_theme_mod('esol_calc_kwh_regular', 1.5); ?>,
  kwhDac:       <?php echo (float) get_theme_mod('esol_calc_kwh_dac', 6.5); ?>,
  panelW:       <?php echo (int) get_theme_mod('esol_calc_panel_w', 550); ?>,
  installationCostPerW: 1.2,
  sunHours: 5.2
};
</script>
<script src="<?php echo esc_url(get_template_directory_uri()); ?>/assets/js/dist/esol-header.bundle.js?v=<?php echo filemtime(get_template_directory().'/assets/js/dist/esol-header.bundle.js'); ?>" defer></script>
