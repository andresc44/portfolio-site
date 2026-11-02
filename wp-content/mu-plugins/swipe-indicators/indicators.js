/**
 * Horizontal scroll-progress bars under every swipeable mobile carousel.
 *
 * Every carousel on the site hides its native scrollbar deliberately (the
 * "next card peeking" at the edge is what signals it's swipeable, not a
 * scrollbar) - this adds a visible, custom one back for anyone who wants an
 * explicit position indicator, without reversing that choice.
 *
 * A synthesized bar rather than un-hiding and styling the native one: iOS
 * Safari's overlay scrollbar - the one every iPhone visitor actually has -
 * isn't stylable via ::-webkit-scrollbar at all, and only ever flashes
 * briefly during an active scroll. A bar built from a plain div, sized and
 * positioned from scrollLeft/scrollWidth/clientWidth, looks and behaves the
 * same on every browser and stays visible at rest, which is the whole
 * point of adding one.
 *
 * SELECTORS is a hand-picked list rather than a "find anything scrollable"
 * scan, matched one-to-one against every scroll-snap carousel in
 * custom-fixes.css, project-gallery/gallery.css and this page's own
 * duplicate-carousel elements (see the comments on each selector) - keeping
 * it an explicit, auditable list rather than implicit "whatever happens to
 * overflow" avoids ever decorating some unrelated scrollable element (a
 * wide table, a code block) that was never meant to be a carousel.
 */
(function () {
	'use strict';

	var SELECTORS = [
		'.elementor-1236 .elementor-element-20aba35 .elementor-posts-container', // Home: Highlighted Projects
		'.elementor-1236 .elementor-element-b49e282',                           // Home: Fields of Interest - Robotics
		'.elementor-1236 .elementor-element-a4a66e7',                           // Home: Fields of Interest - Programming
		'.elementor-1236 .elementor-element-ee67158',                           // Home: Fields of Interest - Electrical/Embedded
		'.elementor-1236 .elementor-element-c96428e',                           // Home: Fields of Interest - Mechanical
		'.elementor-1236 .elementor-element-9a6929a > .e-con-inner',            // Home: discipline tiles under About Me
		'.elementor-2064 .elementor-element-3d1b82f > .e-con-inner',           // Skills & Tools: Certifications & Education
		'.elementor-element-leadcaro1',                                         // About Me: lead photos (duplicate carousel)
		'.elementor-element-bpcaro1',                                           // About Me: Backpacking (duplicate carousel)
		'.elementor-element-hbcaro1',                                           // About Me: Hobbies (duplicate carousel)
		'.project-gallery',                                                     // every project post's media gallery
		'.elementor-2597 .elementor-element-b5bdf5a .elementor-posts-container', // Robotics page: Computer Vision & Perception
		'.elementor-2597 .elementor-element-b05d267 .elementor-posts-container', // Robotics page: Drones & Aerial Robotics
		'.elementor-2597 .elementor-element-a7168a1 .elementor-posts-container', // Robotics page: Localization
		'.elementor-2597 .elementor-element-c6c7fd0 .elementor-posts-container', // Robotics page: Motion Planning
		'.elementor-2602 .elementor-element-b50018f .elementor-posts-container', // Programming page: Machine Learning
		'.elementor-2602 .elementor-element-925fa85 .elementor-posts-container', // Programming page: Data Science
		'.elementor-2607 .elementor-element-3564487 .elementor-posts-container', // Electrical/Embedded page: Embedded Systems & Prototyping
		'.elementor-2607 .elementor-element-da9b74d .elementor-posts-container', // Electrical/Embedded page: Hardware & Power Systems
		'.elementor-2615 .elementor-element-ea08e57 .elementor-posts-container'  // Mechanical page
	].join( ', ' );

	var bars = []; // { el, track, thumb }

	function ready( fn ) {
		if ( document.readyState !== 'loading' ) { fn(); }
		else { document.addEventListener( 'DOMContentLoaded', fn ); }
	}

	/** True only while the element is genuinely a horizontally-scrolling, overflowing track right now. */
	function isActive( el ) {
		var cs = getComputedStyle( el );
		if ( cs.overflowX !== 'auto' && cs.overflowX !== 'scroll' ) { return false; }
		return el.scrollWidth > el.clientWidth + 2;
	}

	function buildBar( el ) {
		var track = document.createElement( 'div' );
		track.className = 'swbar';
		track.setAttribute( 'aria-hidden', 'true' );
		var thumb = document.createElement( 'div' );
		thumb.className = 'swbar__thumb';
		track.appendChild( thumb );
		el.insertAdjacentElement( 'afterend', track );

		var entry = { el: el, track: track, thumb: thumb };

		var ticking = false;
		entry.update = function () {
			var max = el.scrollWidth - el.clientWidth;
			var pct = max > 0 ? el.scrollLeft / max : 0;
			var trackW = track.clientWidth;
			var thumbFrac = trackW > 0 ? Math.min( 1, el.clientWidth / el.scrollWidth ) : 0;
			var thumbW = thumbFrac * trackW;
			thumb.style.width = thumbW + 'px';
			thumb.style.transform = 'translateX(' + ( pct * ( trackW - thumbW ) ) + 'px)';
		};
		el.addEventListener( 'scroll', function () {
			if ( ticking ) { return; }
			ticking = true;
			window.requestAnimationFrame( function () { entry.update(); ticking = false; } );
		}, { passive: true } );

		entry.update();
		return entry;
	}

	/** Adds a bar to every currently-overflowing target that doesn't have one yet, and
	 *  hides/shows existing bars as their own carousel becomes active or not - several of
	 *  these only overflow below 768px, so resizing across that boundary has to be able to
	 *  go either way without leaving a stray bar under a carousel that no longer scrolls. */
	function sync() {
		var seen = new WeakSet();
		bars.forEach( function ( b ) { seen.add( b.el ); } );

		document.querySelectorAll( SELECTORS ).forEach( function ( el ) {
			if ( seen.has( el ) ) { return; }
			if ( ! isActive( el ) ) { return; }
			bars.push( buildBar( el ) );
		} );

		bars.forEach( function ( b ) {
			var active = isActive( b.el );
			b.track.classList.toggle( 'swbar--hidden', ! active );
			if ( active ) { b.update(); }
		} );
	}

	ready( function () {
		// Images loading late (lazy-loaded thumbnails, project galleries) change
		// scrollWidth after first paint, so this waits for the load event rather
		// than running immediately on DOMContentLoaded.
		if ( document.readyState === 'complete' ) { sync(); }
		else { window.addEventListener( 'load', sync ); }

		var rt;
		window.addEventListener( 'resize', function () {
			clearTimeout( rt );
			rt = setTimeout( sync, 150 );
		}, { passive: true } );
		window.addEventListener( 'orientationchange', function () {
			setTimeout( sync, 200 );
		} );
	} );
})();
