<?php
/**
 * page.php — Plantilla genérica de páginas (Aviso de Privacidad, Términos, etc.)
 */
get_header(); ?>

<main style="padding-top:7rem;min-height:60vh;" class="sect-bg1">
  <div class="container" style="padding-top:4rem;padding-bottom:4rem;max-width:800px;">
    <?php while ( have_posts() ) : the_post(); ?>
      <p class="section-label" style="margin-bottom:1rem;"><?php the_date('d \d\e F, Y'); ?></p>
      <h1 class="section-title" style="margin-bottom:2rem;"><?php the_title(); ?></h1>
      <div class="gold-line" style="margin-bottom:2.5rem;max-width:80px;"></div>
      <div class="page-content body-text" style="color:var(--txmuted);line-height:1.8;">
        <?php the_content(); ?>
      </div>
    <?php endwhile; ?>
  </div>
</main>

<style>
.page-content h2{font-family:'Cinzel',serif;font-size:1.25rem;color:var(--tx);margin:2rem 0 1rem;}
.page-content h3{font-family:'Cinzel',serif;font-size:1rem;color:var(--tx);margin:1.5rem 0 .75rem;}
.page-content p{margin-bottom:1rem;}
.page-content ul{list-style:disc;padding-left:1.5rem;margin-bottom:1rem;}
.page-content ul li{margin-bottom:.5rem;}
.page-content a{color:var(--gold-txt);text-decoration:underline;}
</style>

<?php get_footer(); ?>
