/**
 * Fit a chapter to its screen when it is only a little too tall.
 *
 * A chapter is one screen (chapters.css gives it min-height: 100svh) and grows
 * past that only when its content needs more room. Most of the time that is by
 * design (Feature Projects is several stops tall). But on some screens a
 * chapter that is meant to be one screen comes out a few dozen pixels over -
 * Programming / Electrical / Mechanical on a 1366x768 laptop is 808px, About Me
 * on a 320x568 phone 607px - so its last line sits under the screen's edge
 * and the snap area is larger than the screen. The per-width rules in
 * chapters.css tighten these one measurement at a time; this catches the rest
 * on any screen without a new rule for each.
 *
 * Only a small overshoot is corrected (MAX_OVER), and never below MIN_SCALE:
 * past that the text would stop being comfortable to read, so the chapter is
 * left to be taller than the screen, as it is today. The content is scaled with
 * CSS zoom (so layout shrinks with it, unlike a transform); a browser without
 * zoom ignores it and the page is as it was.
 */
( function () {
	'use strict';
	if ( ! document.body.classList.contains( 'ch-page-home' ) ) { return; }

	var MAX_OVER = 1.14;
	var MIN_SCALE = 0.88;
	var timer = 0;

	function reset( ch ) {
		for ( var i = 0; i < ch.children.length; i++ ) { ch.children[ i ].style.zoom = ''; }
		ch.removeAttribute( 'data-fit' );
	}

	function fit() {
		var chapters = document.querySelectorAll( '.ch-on .ch' );
		var i;
		for ( i = 0; i < chapters.length; i++ ) {
			var ch = chapters[ i ];
			// Feature Projects is several stops tall on purpose on wide screens (on a
			// phone it is a single swipe row, one screen), and the hero sizes itself.
			if ( ( ch.getAttribute( 'data-ch' ) === 'projects' && window.innerWidth >= 768 ) || ch.classList.contains( 'ch--first' ) ) { continue; }
			reset( ch );
			var target = parseFloat( getComputedStyle( ch ).minHeight );
			var natural = ch.offsetHeight;
			if ( ! target || natural <= target + 1 || natural > target * MAX_OVER ) { continue; }
			var z = 1, n;
			for ( n = 0; n < 4; n++ ) {
				z = Math.max( MIN_SCALE, z * ( target / ch.offsetHeight ) );
				for ( var k = 0; k < ch.children.length; k++ ) { ch.children[ k ].style.zoom = z.toFixed( 4 ); }
				if ( ch.offsetHeight <= target + 1 || z <= MIN_SCALE ) { break; }
			}
			ch.setAttribute( 'data-fit', z.toFixed( 3 ) );
		}
	}

	function queue() {
		clearTimeout( timer );
		timer = setTimeout( fit, 150 );
	}

	window.addEventListener( 'resize', queue, { passive: true } );
	window.addEventListener( 'orientationchange', queue );
	window.addEventListener( 'load', queue );
	if ( document.fonts && document.fonts.ready ) { document.fonts.ready.then( queue ); }
	queue();
} )();
