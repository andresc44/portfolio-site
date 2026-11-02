/**
 * Scroll fallback for the site backdrop (backdrop.css).
 *
 * Browsers with scroll-driven animations (Chrome, Edge, Safari 26+) move the
 * backdrop entirely in CSS and this does nothing. Elsewhere (Firefox, for now)
 * the same motion is driven from here: the page's scroll position, 0 at the
 * top and 1 at the bottom, is written to --ch-sp on <html>, which the
 * @supports-not rules at the end of backdrop.css turn into the same transform.
 * rAF-throttled, passive, and only a custom property is written.
 */
( function () {
	'use strict';
	var root = document.documentElement;

	/* Travel scale for short pages: the strips move a fixed distance over the
	   whole scroll, so a page with little to scroll would sweep through it in a
	   few flicks. --bd-k shrinks that distance in proportion to the scroll range
	   (in screens): full travel from FULL screens of scroll, never under MIN. */
	var FULL = 5, MIN = 0.15, kTimer = 0;
	function setTravel() {
		var vh = window.innerHeight || 1;
		var screens = ( root.scrollHeight - vh ) / vh;
		var k = Math.max( MIN, Math.min( 1, screens / FULL ) );
		root.style.setProperty( '--bd-k', k.toFixed( 3 ) );
	}
	function queueTravel() {
		window.clearTimeout( kTimer );
		kTimer = window.setTimeout( setTravel, 120 );
	}
	setTravel();
	window.addEventListener( 'load', setTravel );
	window.addEventListener( 'resize', queueTravel, { passive: true } );
	if ( window.ResizeObserver ) { new ResizeObserver( queueTravel ).observe( document.body ); }

	if ( window.CSS && CSS.supports && CSS.supports( 'animation-timeline', 'scroll()' ) ) { return; }

	var ticking = false;

	function update() {
		var max = root.scrollHeight - window.innerHeight;
		var p = max > 0 ? ( window.pageYOffset / max ) : 0;
		root.style.setProperty( '--ch-sp', ( p < 0 ? 0 : p > 1 ? 1 : p ).toFixed( 4 ) );
		ticking = false;
	}
	function onScroll() {
		if ( ticking ) { return; }
		ticking = true;
		window.requestAnimationFrame( update );
	}

	window.addEventListener( 'scroll', onScroll, { passive: true } );
	window.addEventListener( 'resize', onScroll, { passive: true } );
	window.addEventListener( 'load', onScroll );
	update();
} )();
