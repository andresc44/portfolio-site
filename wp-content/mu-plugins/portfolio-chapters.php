<?php
/**
 * Full-screen chapter scrolling: the home page, About Me, and Skills &
 * Education.
 *
 * Groups a page's top-level Elementor sections into full-screen chapters
 * that vertical scroll-snap steps through, adds a chapter rail for jumping
 * between them, and marks the active chapter so entrance animations can key
 * off it.
 *
 * See wp-content/mu-plugins/portfolio-chapters/chapters.js for each page's
 * grouping map and why the wrapping is done in the DOM rather than in
 * Elementor's stored data, and chapters.css for the snap geometry.
 *
 * The page's key is put on <body> as ch-page-home / ch-page-about /
 * ch-page-skills, which is how chapters.js (and any page-specific CSS) tells
 * the pages apart - no IDs hard-coded in the script, and no inline script to
 * be reordered by an optimiser.
 */

/**
 * Which chaptered page this request is, or '' for every other page.
 */
function portfolio_chapters_page_key() {
	if ( is_front_page() ) {
		return 'home';
	}
	if ( is_page( array( 1759, 'about-me' ) ) ) {
		return 'about';
	}
	// By ID first, so a future change to the page's address (it has been
	// /skills-tools/, and /skills-education/ has been discussed) can't
	// silently turn this off.
	if ( is_page( array( 2064, 'skills-tools', 'skills-education' ) ) ) {
		return 'skills';
	}
	// The four project category pages (Robotics 2597, Programming 2602,
	// Electrical/Embedded 2607, Mechanical 2615) and My Projects (2291, the
	// same listings inside tabs): one chapter per emphasis, on desktop.
	if ( is_page( array( 2597, 2602, 2607, 2615 ) ) ) {
		return 'cat';
	}
	if ( is_page( 2291 ) ) {
		return 'projects';
	}
	return '';
}

add_filter( 'body_class', function ( $classes ) {
	$key = portfolio_chapters_page_key();
	if ( $key ) {
		$classes[] = 'ch-page-' . $key;
	}
	return $classes;
} );

add_action( 'wp_enqueue_scripts', function () {
	if ( ! portfolio_chapters_page_key() ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/portfolio-chapters';
	$url = WPMU_PLUGIN_URL . '/portfolio-chapters';
	wp_enqueue_style( 'portfolio-chapters', $url . '/chapters.css', array(), filemtime( $dir . '/chapters.css' ) );
	wp_enqueue_script( 'portfolio-chapters', $url . '/chapters.js', array(), filemtime( $dir . '/chapters.js' ), true );
	// Touch screens: one swipe glides to exactly one chapter, no overshoot (see glide.js).
	wp_enqueue_script( 'portfolio-chapters-glide', $url . '/glide.js', array( 'portfolio-chapters' ), filemtime( $dir . '/glide.js' ), true );
	// Chapters a little taller than their screen are scaled down to fit (see fit.js).
	wp_enqueue_script( 'portfolio-chapters-fit', $url . '/fit.js', array( 'portfolio-chapters' ), filemtime( $dir . '/fit.js' ), true );
}, 25 );
