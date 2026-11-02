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
 *
 * Lazy-loaded images (LiteSpeed's media-lazy: every image below the fold)
 * start out with a 1x1 transparent-GIF data: URI as both src and srcset,
 * swapped for the real ones only once the image actually scrolls into
 * view and loads - which, on a first DOMContentLoaded pass, is after this
 * script already ran for anything not yet on screen. Picking that
 * placeholder as the blur source isn't a wrong image, it's a permanent
 * one: this only ever runs once per frame, so a frame caught mid-lazy-load
 * never gets a second chance and is stuck on a transparent blur forever,
 * reading as a plain grey/dark panel exactly like the no-JS fallback.
 * Every image on a category or archive page below the first screen hits
 * this. Watching for the attribute swap (rather than polling or re-running
 * on a timer) means a frame whose image is still a placeholder when first
 * checked still gets painted correctly the moment it actually loads.
 */
(function () {
	'use strict';

	var SELECTORS = [
		'.project-gallery__item',      // project detail galleries (hero, stacked tiles, mobile carousel)
		'.project-archive__card-media', // tag archive + search result cards
		'.elementor-post__thumbnail'    // Elementor post previews (home, category, projects pages)
	];

	var MIN_BLUR_SOURCE_WIDTH = 300;

	/**
	 * An image whose shape is within this fraction of its frame's is shown
	 * with object-fit:cover instead of contain.
	 *
	 * Contain on a near-miss doesn't look like "a bit of padding", it looks
	 * like a defect: a 1000x667 photo (1.499) in a 3:2-ish card frame (1.515)
	 * leaves a ~3px sliver of the dark blurred fill down each side, which
	 * reads as a faint grey line along the card's left and right edges.
	 * Covering instead crops at most a few percent off one axis, which no one
	 * can see, and the image runs edge to edge. Anything further off than
	 * this keeps the full-image letterbox that media-fill.css exists for -
	 * 8% is well clear of every photo in the near-miss group (~1%) and well
	 * short of the next shape up (~18%), so nothing real gets cropped.
	 */
	var NEAR_RATIO = 0.08;

	function isRealUrl( url ) {
		return !! url && url.indexOf( 'data:' ) !== 0;
	}

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
			if ( best && isRealUrl( best.url ) ) return best.url;
		}
		var src = img.currentSrc || img.getAttribute( 'src' ) || '';
		return isRealUrl( src ) ? src : '';
	}

	function paint( frame, url ) {
		var bg = frame.querySelector( ':scope > .mf-bg' );
		if ( ! bg ) {
			bg = document.createElement( 'span' );
			bg.className = 'mf-bg';
			bg.setAttribute( 'aria-hidden', 'true' );
			frame.insertBefore( bg, frame.firstChild );
		}
		bg.style.backgroundImage = 'url("' + url.replace( /"/g, '\\"' ) + '")';
	}

	function apply( frame ) {
		if ( frame.dataset.mf ) return; // already painted with a real url
		var img = frame.querySelector( 'img' );
		if ( ! img ) return; // e.g. self-hosted <video> tiles — nothing to blur

		var url = pickBlurSource( img );
		if ( url ) {
			paint( frame, url );
			frame.dataset.mf = '1';
			return;
		}

		if ( frame.dataset.mfWatching ) return;
		frame.dataset.mfWatching = '1';
		var mo = new MutationObserver( function () {
			var found = pickBlurSource( img );
			if ( ! found ) return;
			paint( frame, found );
			frame.dataset.mf = '1';
			mo.disconnect();
		} );
		mo.observe( img, { attributes: true, attributeFilter: [ 'src', 'srcset' ] } );
	}

	/** Toggles .mf-cover on a frame depending on how close its image's shape is to its own. */
	function fit( frame ) {
		var img = frame.querySelector( 'img' );
		if ( ! img ) return;
		var w = img.naturalWidth, h = img.naturalHeight;
		// <5: the 1x1 placeholder a lazy-loaded image carries until it loads
		if ( ! w || ! h || w < 5 || h < 5 ) return;
		var box = frame.getBoundingClientRect();
		if ( ! box.width || ! box.height ) return; // not laid out (hidden slide, collapsed tab)
		var off = Math.abs( ( w / h ) / ( box.width / box.height ) - 1 );
		frame.classList.toggle( 'mf-cover', off <= NEAR_RATIO );
	}

	// Frames inside a tab or slide that isn't showing have no size to measure
	// when the page loads, and nothing fires when Elementor later reveals
	// them. Measuring each frame the moment it first scrolls/switches into
	// view covers that without polling.
	var visibility = 'IntersectionObserver' in window ? new IntersectionObserver( function ( entries ) {
		entries.forEach( function ( entry ) {
			if ( entry.isIntersecting ) { fit( entry.target ); }
		} );
	} ) : null;

	function bindFit( frame ) {
		if ( frame.dataset.mfFit ) return;
		var img = frame.querySelector( 'img' );
		if ( ! img ) return;
		frame.dataset.mfFit = '1';
		// Fires again when a lazy-loaded image swaps in its real file.
		img.addEventListener( 'load', function () { fit( frame ); } );
		if ( visibility ) { visibility.observe( frame ); }
		fit( frame );
	}

	function eachFrame( fn ) {
		SELECTORS.forEach( function ( sel ) {
			var nodes = document.querySelectorAll( sel );
			for ( var i = 0; i < nodes.length; i++ ) {
				fn( nodes[ i ] );
			}
		} );
	}

	function run() {
		eachFrame( function ( frame ) {
			apply( frame );
			bindFit( frame );
		} );
	}

	if ( document.readyState !== 'loading' ) {
		run();
	} else {
		document.addEventListener( 'DOMContentLoaded', run );
	}

	// A frame's shape can change with the viewport (carousel slides, grid
	// reflow), and hidden frames - the inactive tabs on My Projects - have no
	// size to measure until they're shown. Re-measure on resize, and when the
	// window finishes loading (tabs/lazy images settled by then).
	var resizeTimer;
	function refit() { eachFrame( function ( frame ) { bindFit( frame ); fit( frame ); } ); }
	window.addEventListener( 'resize', function () {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( refit, 150 );
	}, { passive: true } );
	window.addEventListener( 'load', refit );
})();

/**
 * Start loading pictures before they are needed - every picture on the site.
 *
 * LiteSpeed's lazy load swaps each picture in only when its own script sees
 * it scroll into view, and that script runs late - so even the cards on the
 * first screen sat as a grey box for a moment, and the ones in the next
 * chapter appeared only as you arrived. This does the swap itself:
 *   1. pictures within two and a half screens of the viewport straight away
 *      (the chapter you are on and the next two), re-checked as you scroll;
 *   2. everything else once the page has finished loading, a few at a time in
 *      page order (so the nearest chapters come first) while the browser is idle.
 * Same attributes LiteSpeed would set (src, srcset, sizes), plus loading=eager:
 * a picture still marked loading="lazy" is held back by the browser itself
 * until it is near the screen, which would undo all of this.
 */
( function () {
	'use strict';

	var SEL = 'img[data-src]';

	function load( img ) {
		if ( ! img.getAttribute( 'data-src' ) || img.getAttribute( 'data-pre' ) ) { return; }
		img.setAttribute( 'data-pre', '1' );
		img.loading = 'eager';
		var ss = img.getAttribute( 'data-srcset' ), sz = img.getAttribute( 'data-sizes' );
		if ( sz ) { img.setAttribute( 'sizes', sz ); }
		if ( ss ) { img.setAttribute( 'srcset', ss ); }
		img.setAttribute( 'src', img.getAttribute( 'data-src' ) );
	}

	function near( img ) {
		var r = img.getBoundingClientRect();
		return r.width > 0 && r.top < window.innerHeight * 2.5 && r.bottom > -window.innerHeight;
	}

	function pass() {
		var imgs = document.querySelectorAll( SEL );
		for ( var i = 0; i < imgs.length; i++ ) {
			if ( near( imgs[ i ] ) ) { load( imgs[ i ] ); }
		}
	}

	// the rest, six at a time in page order, whenever the browser is idle
	function drain() {
		var imgs = document.querySelectorAll( SEL + ':not([data-pre])' );
		if ( ! imgs.length ) { return; }
		for ( var i = 0; i < Math.min( 6, imgs.length ); i++ ) { load( imgs[ i ] ); }
		( window.requestIdleCallback || function ( f ) { return setTimeout( f, 250 ); } )( drain, { timeout: 800 } );
	}

	function start() {
		pass();
		window.addEventListener( 'load', function () { setTimeout( drain, 300 ); } );
		var t;
		window.addEventListener( 'scroll', function () { if ( ! t ) { t = setTimeout( function () { t = 0; pass(); }, 120 ); } }, { passive: true } );
		// lazy images that reach the DOM later (tabs, carousels)
		if ( window.MutationObserver ) {
			new MutationObserver( function () { clearTimeout( t ); t = setTimeout( function () { t = 0; pass(); }, 200 ); } ).observe( document.body, { childList: true, subtree: true } );
		}
	}

	if ( document.readyState !== 'loading' ) { start(); }
	else { document.addEventListener( 'DOMContentLoaded', start ); }
} )();

/**
 * Keep a lifted card hovered while the pointer is on its bottom edge.
 *
 * The card's hover lift (custom-fixes.css) moves it up 5px, so a pointer
 * resting on its bottom edge ends up just below it, the hover drops, the card
 * settles back under the pointer, the hover returns - and so on, flickering. A
 * card that clips its contents cannot grow a hit area below itself in CSS, so
 * this holds the lifted state (.hover-hold) for as long as the pointer is
 * within 10px below the card's lifted bottom edge and between its sides.
 */
( function () {
	'use strict';

	var SEL = '.elementor-post, a.e-con, .project-gallery__item';
	var held = null, ticking = false, seen = false, px = 0, py = 0;

	function update() {
		ticking = false;
		var el = document.elementFromPoint( px, py );
		var card = el && el.closest ? el.closest( SEL ) : null;
		if ( card ) {
			if ( held && held !== card ) { held.classList.remove( 'hover-hold' ); }
			held = card;
			card.classList.add( 'hover-hold' );
			return;
		}
		if ( held ) {
			var r = held.getBoundingClientRect();
			if ( px >= r.left && px <= r.right && py >= r.bottom && py <= r.bottom + 10 ) { return; }
			held.classList.remove( 'hover-hold' );
			held = null;
		}
	}

	/* The hold is only re-checked when the pointer moves, so a card could keep
	   it after the page changed under a still pointer: the gallery lightbox
	   opening over it, closing again (button, Esc, browser back), a restore
	   from the back/forward cache, or a scroll. Re-check on those too, once
	   the lightbox has had time to show or hide, and drop any stray holds. */
	function recheck() {
		if ( ticking ) { return; }
		ticking = true;
		requestAnimationFrame( function () {
			if ( seen ) { update(); } else { ticking = false; held = null; }
			var stray = document.querySelectorAll( '.hover-hold' );
			for ( var i = 0; i < stray.length; i++ ) {
				if ( stray[ i ] !== held ) { stray[ i ].classList.remove( 'hover-hold' ); }
			}
		} );
	}
	function recheckLater() { setTimeout( recheck, 60 ); setTimeout( recheck, 400 ); }
	document.addEventListener( 'click', recheckLater, true );
	document.addEventListener( 'keydown', recheckLater, true );
	window.addEventListener( 'popstate', recheckLater );
	window.addEventListener( 'pageshow', recheckLater );
	window.addEventListener( 'scroll', recheck, { passive: true } );
	document.addEventListener( 'visibilitychange', recheck );

	window.addEventListener( 'pointermove', function ( e ) {
		if ( e.pointerType === 'touch' ) { return; }
		px = e.clientX; py = e.clientY; seen = true;
		if ( ! ticking ) { ticking = true; requestAnimationFrame( update ); }
	}, { passive: true } );
	document.addEventListener( 'pointerleave', function () { if ( held ) { held.classList.remove( 'hover-hold' ); held = null; } } );
} )();
