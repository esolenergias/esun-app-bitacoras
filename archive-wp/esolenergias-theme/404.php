<?php get_header(); ?>
<main style="min-height:80vh;display:flex;align-items:center;" class="sect-bg1">
  <div class="container" style="text-align:center;padding-top:8rem;padding-bottom:8rem;">
    <div class="diff-num" style="font-size:5rem;opacity:.2;margin-bottom:1rem;">404</div>
    <h1 class="section-title" style="margin-bottom:1rem;">Página no encontrada</h1>
    <div class="gold-line" style="max-width:60px;margin:0 auto 2rem;"></div>
    <p class="body-text" style="margin-bottom:2.5rem;max-width:400px;margin-left:auto;margin-right:auto;">
      La página que buscas no existe. ¿Te ayudamos con tu proyecto solar?
    </p>
    <a href="<?php echo esc_url( home_url('/') ); ?>" class="btn-gold">Volver al inicio</a>
  </div>
</main>
<?php get_footer(); ?>
