<?php
/**
 * Enqueue custom-fixes.css from a place a theme update can't wipe out.
 *
 * This used to be a hand-added call inside
 * wp-content/themes/hello-elementor/functions.php. A hello-elementor theme
 * update (3.4.9 -> 3.5.1) overwrote that file and silently dropped the
 * enqueue with it - the stylesheet was still sitting on disk, untouched,
 * but nothing on the page ever linked to it again. ~22 fixes (image
 * rounding/outlines, About Me photo sizing, Backpacking collage uniformity,
 * the footer gradient-text clip fix, the back-to-top button palette, etc.)
 * silently stopped applying production-side until this was traced down.
 *
 * mu-plugins load on every request and are never touched by a theme or
 * plugin update, so this is the one place this can live and actually
 * survive the next hello-elementor upgrade. Do not move this back into the
 * theme.
 */

add_action( 'wp_enqueue_scripts', function () {
	$path = WP_CONTENT_DIR . '/custom-fixes.css';
	if ( ! file_exists( $path ) ) {
		return;
	}
	wp_enqueue_style(
		'hello-elementor-custom-fixes',
		content_url( 'custom-fixes.css' ),
		array(),
		(string) filemtime( $path ) // cache-busts itself on every edit, independent of the theme's own version number
	);
}, 20 ); // after the theme's own styles, so these rules can override them
