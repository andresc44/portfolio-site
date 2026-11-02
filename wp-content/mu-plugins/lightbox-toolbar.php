<?php
/**
 * One toolbar for every picture viewer on the site: zoom, download, close.
 *
 * Elementor's own lightbox (About Me, Skills & Education, the home page) ships
 * a Share menu (Facebook / X / Pinterest, with "Download image" buried inside
 * it) and a Fullscreen toggle next to the zoom button. Those are hidden, and a
 * Download button is put in their place that saves the picture as a PNG. The
 * project pages' own gallery viewer (project-gallery) uses the same PNG saver,
 * so a download behaves the same wherever it is clicked.
 *
 * Loaded on every front-end page: the Elementor viewer is on most of them,
 * and project-gallery depends on this script for the saver.
 */

add_action( 'wp_enqueue_scripts', function () {
	$dir = WPMU_PLUGIN_DIR . '/lightbox-toolbar';
	$url = WPMU_PLUGIN_URL . '/lightbox-toolbar';
	wp_enqueue_style( 'portfolio-lightbox-toolbar', $url . '/toolbar.css', array(), filemtime( $dir . '/toolbar.css' ) );
	wp_enqueue_script( 'portfolio-lightbox-toolbar', $url . '/toolbar.js', array(), filemtime( $dir . '/toolbar.js' ), true );
}, 30 );
