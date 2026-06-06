<?php
/**
 * index.php — Fallback requerido por WordPress.
 * La portada usa front-page.php. Este archivo no se usa normalmente.
 */
get_header(); ?>
<main style="padding-top:7rem;min-height:60vh;" class="sect-bg1">
  <div class="container" style="padding-top:4rem;padding-bottom:4rem;">
    <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
      <h2 class="section-title"><?php the_title(); ?></h2>
      <div class="body-text" style="margin-top:1rem;"><?php the_excerpt(); ?></div>
    <?php endwhile; else: ?>
      <p class="body-text">No hay contenido disponible.</p>
    <?php endif; ?>
  </div>
</main>
<?php get_footer(); ?>
