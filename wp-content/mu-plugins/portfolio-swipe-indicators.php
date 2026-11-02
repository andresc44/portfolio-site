<?php
/**
 * Horizontal scroll-progress bars under every swipeable mobile carousel.
 *
 * See wp-content/mu-plugins/swipe-indicators/indicators.js for the full
 * list of carousels and why a synthesized bar rather than a styled native
 * scrollbar; indicators.css for the bar's own styling.
 *
 * Loaded on every page (not just the home page) because the carousels this
 * covers span the home page, About Me, Skills & Tools and every individual
 * project post's media gallery.
 */

add_action( 'wp_enqueue_scripts', function () {
	$dir = WPMU_PLUGIN_DIR . '/swipe-indicators';
	$url = WPMU_PLUGIN_URL . '/swipe-indicators';
	wp_enqueue_style( 'portfolio-swipe-indicators', $url . '/indicators.css', array(), filemtime( $dir . '/indicators.css' ) );
	wp_enqueue_script( 'portfolio-swipe-indicators', $url . '/indicators.js', array(), filemtime( $dir . '/indicators.js' ), true );
}, 30 );
