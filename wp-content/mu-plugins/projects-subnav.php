<?php
/**
 * "My Projects" (/projects/): a subcategory quick-nav matching the one each
 * dedicated category page (Robotics, Programming, Electrical/Embedded)
 * already has at its top - this page is the only place that groups
 * subcategories under per-category tabs instead of its own page, and it was
 * the one place left without a way to jump straight to one.
 *
 * Built in JS rather than as a real Elementor widget because the nav has to
 * change with the active tab (Robotics' subcategories aren't Programming's),
 * and Elementor's nested-tabs widget already owns tab switching - this only
 * reads its existing markup and headings, never re-implements it.
 */

add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_page( 2291 ) ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/projects-subnav';
	$url = WPMU_PLUGIN_URL . '/projects-subnav';
	wp_enqueue_style( 'projects-subnav', $url . '/subnav.css', array(), filemtime( $dir . '/subnav.css' ) );
	wp_enqueue_script( 'projects-subnav', $url . '/subnav.js', array(), filemtime( $dir . '/subnav.js' ), true );
} );
