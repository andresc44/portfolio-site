<?php
/**
 * Site backdrop: deep blue glows that drift as a page is scrolled.
 *
 * Every front-end page gets two tall fixed layers (body::before / body::after)
 * that slide past the screen at different speeds, so the glows and hues of
 * blue change smoothly from the top of a page to the bottom. It started on the
 * home page and was extended to every page; the home page keeps its own
 * starting position (its hero panel covers the first screen). See
 * site-backdrop/backdrop.css for the palette, the contrast budget it stays
 * inside and why only `transform` moves, and backdrop.js for the scroll
 * fallback in browsers without scroll-driven animations.
 */

add_action( 'wp_enqueue_scripts', function () {
	$dir = WPMU_PLUGIN_DIR . '/site-backdrop';
	$url = WPMU_PLUGIN_URL . '/site-backdrop';
	wp_enqueue_style( 'site-backdrop', $url . '/backdrop.css', array(), filemtime( $dir . '/backdrop.css' ) );
	wp_enqueue_script( 'site-backdrop', $url . '/backdrop.js', array(), filemtime( $dir . '/backdrop.js' ), true );
}, 30 );
