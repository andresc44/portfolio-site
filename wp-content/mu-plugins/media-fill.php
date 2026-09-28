<?php
/**
 * Blurred letterbox padding for off-ratio media, site-wide.
 *
 * See media-fill/media-fill.css for the reasoning: gallery images on this
 * site span 0.58–3.32 aspect ratio, so any fixed-shape frame using
 * object-fit:cover was discarding a large part of many images.
 */

add_action( 'wp_enqueue_scripts', function () {
	if ( is_admin() ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/media-fill';
	$url = WPMU_PLUGIN_URL . '/media-fill';
	wp_enqueue_style( 'media-fill', $url . '/media-fill.css', array(), filemtime( $dir . '/media-fill.css' ) );
	wp_enqueue_script( 'media-fill', $url . '/media-fill.js', array(), filemtime( $dir . '/media-fill.js' ), true );
}, 20 );
