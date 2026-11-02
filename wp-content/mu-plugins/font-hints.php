<?php
/**
 * Start the site's text font downloading earlier - only where it pays off.
 *
 * Every page is set in Inter, which Elementor loads from fonts.gstatic.com. A
 * browser only learns about those files after it has fetched and parsed the
 * stylesheet, and only then opens a connection to Google's font host, so text
 * first paints in a fallback font and jumps when Inter arrives
 * (font-display: swap).
 *
 * 1. Every page: connect to the font host straight away. Free - it did not
 *    change when anything first paints in testing - and it shortens the wait.
 *
 * 2. About Me page, desktop widths only: also fetch Inter Regular alongside the
 *    stylesheet. That page's opening chapter centres its text vertically, so
 *    when Inter replaced the fallback font the paragraphs re-wrapped and the
 *    whole block jumped (layout shift 0.25, the same on every load). With the
 *    font already on its way the shift is gone (0.00-0.01).
 *
 *    Why not preload on every page? Measured, with the page's HTML served from
 *    a cache: a preloaded font holds the first paint back a little while the
 *    browser waits for it - 50 to 200 ms later on every page tried, desktop and
 *    phone - and no other page has a shift to fix. Phones have no shift on the
 *    About page either, hence the media condition. Only the regular weight is
 *    needed; adding the other two changed nothing but the cost.
 *
 * The file name carries Google's version (v20). If Google republishes the family
 * under a new version the preload simply stops matching what the stylesheet
 * asks for: the page still works, it just goes back to shifting until the URL
 * is refreshed from the @font-face rules in wp-content/litespeed/css/*.css.
 */

const PORTFOLIO_FONT_HOST = 'https://fonts.gstatic.com';

// Inter, latin subset, 400 (regular).
const PORTFOLIO_PRELOAD_FONT = '/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf';

// Priority 1: before any stylesheet link, so the requests are the first things the browser sees.
add_action( 'wp_head', function () {
	echo '<link rel="preconnect" href="' . esc_url( PORTFOLIO_FONT_HOST ) . '" crossorigin />' . "\n";
	if ( is_page( 'about-me' ) ) {
		echo '<link rel="preload" href="' . esc_url( PORTFOLIO_FONT_HOST . PORTFOLIO_PRELOAD_FONT ) . '" as="font" type="font/ttf" crossorigin media="(min-width: 768px)" />' . "\n";
	}
}, 1 );
