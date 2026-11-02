<?php
/**
 * Skills & Tools page, mobile only: replaces the ~41-pill wall (every
 * category's skills stacked one under another, about 5 screens of
 * scrolling) with a tap-to-filter chip bar - category names above, the
 * matching skills below, one category showing at a time. See
 * skills-filter/skills-filter.js for the DOM work and skills-filter.css for
 * the chip bar + flattened pill grid. Desktop is untouched.
 */

add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_page( 2064 ) ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/skills-filter';
	$url = WPMU_PLUGIN_URL . '/skills-filter';
	wp_enqueue_style( 'skills-filter', $url . '/skills-filter.css', array(), filemtime( $dir . '/skills-filter.css' ) );
	wp_enqueue_script( 'skills-filter', $url . '/skills-filter.js', array(), filemtime( $dir . '/skills-filter.js' ), true );
} );
