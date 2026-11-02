<?php
/**
 * Scroll-triggered fade/slide reveal for the chaptered pages (the home page
 * and About Me). See wp-content/mu-plugins/portfolio-reveal/reveal.js for the
 * selection logic and wp-content/mu-plugins/portfolio-reveal/reveal.css for
 * why this can never clip content or leave it stuck invisible.
 *
 * Runs wherever portfolio-chapters.php does, so the two always go together:
 * the reveal is the inner half of the page's motion (cards and columns
 * settling in), the chapter fade is the outer half.
 */

add_action( 'wp_enqueue_scripts', function () {
	// portfolio-chapters.php is loaded first (mu-plugins load alphabetically).
	if ( ! function_exists( 'portfolio_chapters_page_key' ) || ! portfolio_chapters_page_key() ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/portfolio-reveal';
	$url = WPMU_PLUGIN_URL . '/portfolio-reveal';
	wp_enqueue_style( 'portfolio-reveal', $url . '/reveal.css', array(), filemtime( $dir . '/reveal.css' ) );
	wp_enqueue_script( 'portfolio-reveal', $url . '/reveal.js', array(), filemtime( $dir . '/reveal.js' ), true );
} );
