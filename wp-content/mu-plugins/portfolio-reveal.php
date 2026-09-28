<?php
/**
 * Scroll-triggered fade/slide reveal for the homepage. See
 * wp-content/mu-plugins/portfolio-reveal/reveal.js for the selection logic
 * and wp-content/mu-plugins/portfolio-reveal/reveal.css for why this can
 * never clip content or leave it stuck invisible.
 */

add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_front_page() ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/portfolio-reveal';
	$url = WPMU_PLUGIN_URL . '/portfolio-reveal';
	wp_enqueue_style( 'portfolio-reveal', $url . '/reveal.css', array(), filemtime( $dir . '/reveal.css' ) );
	wp_enqueue_script( 'portfolio-reveal', $url . '/reveal.js', array(), filemtime( $dir . '/reveal.js' ), true );
} );
