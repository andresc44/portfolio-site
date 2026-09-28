/**
 * Paints a blurred copy of each image behind itself, to fill the space left
 * over when the image's aspect ratio doesn't match its frame.
 *
 * Deliberately picks the SMALLEST reasonable size from the image's srcset
 * as the blur source: blurring a 300px-wide copy and scaling it up looks
 * identical once it's behind a 26px blur, but costs a fraction of the
 * rasterisation of blurring a 1000px+ original.
 *
 * Purely additive — media-fill.css already guarantees nothing is cropped
 * on its own, so if this never runs, images just letterbox on a dark panel.
 */
(function () {
	'use strict';

	var SELECTORS = [
		'.project-gallery__item',      // project detail galleries (hero, stacked tiles, mobile carousel)
		'.project-archive__card-media', // tag archive + search result cards
		'.elementor-post__thumbnail'    // Elementor post previews (home, category, projects pages)
	];

	var MIN_BLUR_SOURCE_WIDTH = 300;

	function pickBlurSource( img ) {
		var srcset = img.getAttribute( 'srcset' );
		if ( srcset ) {
			var best = null;
			srcset.split( ',' ).forEach( function ( candidate ) {
				var m = candidate.trim().match( /^(\S+)\s+(\d+)w$/ );
				if ( ! m ) return;
				var w = parseInt( m[ 2 ], 10 );
				if ( w >= MIN_BLUR_SOURCE_WIDTH && ( ! best || w < best.w ) ) {
					best = { url: m[ 1 ], w: w };
				}
			} );
			if ( best ) return best.url;
		}
		return img.currentSrc || img.getAttribute( 'src' ) || '';
	}

	function apply( frame ) {
		if ( frame.dataset.mf ) return;
		var img = frame.querySelector( 'img' );
		if ( ! img ) return; // e.g. self-hosted <video> tiles — nothing to blur
		var url = pickBlurSource( img );
		if ( ! url ) return;

		frame.dataset.mf = '1';
		var bg = document.createElement( 'span' );
		bg.className = 'mf-bg';
		bg.setAttribute( 'aria-hidden', 'true' );
		bg.style.backgroundImage = 'url("' + url.replace( /"/g, '\\"' ) + '")';
		frame.insertBefore( bg, frame.firstChild );
	}

	function run() {
		SELECTORS.forEach( function ( sel ) {
			var nodes = document.querySelectorAll( sel );
			for ( var i = 0; i < nodes.length; i++ ) {
				apply( nodes[ i ] );
			}
		} );
	}

	if ( document.readyState !== 'loading' ) {
		run();
	} else {
		document.addEventListener( 'DOMContentLoaded', run );
	}
})();
