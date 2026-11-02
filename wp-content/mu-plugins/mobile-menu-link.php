<?php
/**
 * Hamburger menu: a second tap on "Projects" opens the My Projects page.
 *
 * "Projects" is a parent item in the mobile dropdown, and the first tap on
 * it expands its Robotics / Programming / Electrical-Embedded / Mechanical
 * submenu - which is right, that's how people reach those. But the item is
 * also a real link to /projects/, and the menu's own script (SmartMenus,
 * bundled with Elementor's nav-menu widget) treats every later tap as
 * "collapse again", so there was no way to get to the My Projects page from
 * the phone menu at all.
 *
 * This only changes what a tap on the label does once the submenu is already
 * open. The chevron beside it still collapses the submenu, so the item has
 * both jobs: label = go there, chevron = expand/collapse.
 *
 * Done as a plain script rather than inside the Elementor menu widget so it
 * survives Elementor/theme updates and the next full transfer.
 */

add_action( 'wp_enqueue_scripts', function () {
	if ( is_admin() ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/mobile-menu-link';
	$url = WPMU_PLUGIN_URL . '/mobile-menu-link';
	wp_enqueue_script( 'mobile-menu-link', $url . '/mobile-menu-link.js', array(), filemtime( $dir . '/mobile-menu-link.js' ), true );
}, 20 );
