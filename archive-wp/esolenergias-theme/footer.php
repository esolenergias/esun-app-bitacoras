<?php
$phone   = esol_get( 'esol_phone',         '+52 (00) 0000-0000' );
$email   = esol_get( 'esol_email_display', 'ventas@esolenergias.com' );
$address = esol_get( 'esol_address',       'Guadalajara, Jalisco, México' );
$fb      = esol_url( 'esol_facebook',      '#' );
$ig      = esol_url( 'esol_instagram',     '#' );
$wa      = esol_whatsapp_url();
?>
<!-- ══ FOOTER ══ -->
<footer>
  <div class="container">
    <div class="footer-grid">

      <!-- Marca -->
      <div class="footer-brand">
        <div class="footer-logo-wrap">
          <a href="<?php echo esc_url( home_url('/') ); ?>" class="nav-logo" aria-label="<?php bloginfo('name'); ?>">
            <?php esol_render_logo('footer'); ?>
          </a>
        </div>
        <p class="footer-tagline">Ingeniería solar avanzada y distribución de componentes fotovoltaicos en México.</p>
        <div class="footer-social">
          <a href="<?php echo $fb; ?>" aria-label="Facebook" class="social-btn" target="_blank" rel="noopener">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="<?php echo $ig; ?>" aria-label="Instagram" class="social-btn" target="_blank" rel="noopener">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
        </div>
      </div>

      <!-- Servicios -->
      <div class="footer-col">
        <h5 class="footer-col-title">Servicios</h5>
        <ul>
          <li><a href="#anteproyecto">Anteproyecto 3D</a></li>
          <li><a href="#servicios">Ingeniería Solar</a></li>
          <li><a href="#contacto">Consultoría</a></li>
        </ul>
      </div>

      <!-- Productos -->
      <div class="footer-col">
        <h5 class="footer-col-title">Productos</h5>
        <ul>
          <li><a href="#productos">Paneles Solares</a></li>
          <li><a href="#productos">Inversores</a></li>
          <li><a href="#productos">Microinversores</a></li>
          <li><a href="#productos">Estructura Aluminio</a></li>
          <li><a href="#productos">Cable Solar</a></li>
          <li><a href="#productos">Baterías</a></li>
        </ul>
      </div>

      <!-- Contacto -->
      <div class="footer-col">
        <h5 class="footer-col-title">Contacto</h5>
        <ul class="footer-contact-list">
          <li>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <a href="<?php echo $wa; ?>"><?php echo $phone; ?></a>
          </li>
          <li>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <a href="mailto:<?php echo $email; ?>"><?php echo $email; ?></a>
          </li>
          <li>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span><?php echo $address; ?></span>
          </li>
        </ul>
      </div>

    </div><!-- /footer-grid -->

    <div class="gold-line" style="margin:2rem 0 1.5rem;"></div>
    <div class="footer-bottom">
      <p>&copy; <?php echo date('Y'); ?> eSol Energías — Todos los derechos reservados</p>
      <div class="footer-legal">
        <a href="<?php echo esc_url( get_privacy_policy_url() ); ?>">Aviso de Privacidad</a>
        <a href="#">Términos de Uso</a>
      </div>
    </div>

  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
