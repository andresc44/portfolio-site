/**
 * Chapter-to-chapter slide: one swipe (touch) or one wheel/trackpad gesture glides to
 * the next chapter and stops exactly there. No overshoot, no bounce back.
 *
 * Why this exists: the chapters were held in place by the browser's own scroll-snap,
 * which works with the gesture's momentum. A flick keeps the page travelling after the
 * finger lifts (or while a trackpad's inertia plays out), so it ran past the chapter and
 * was then pulled back. Nothing on the site animates that - it is the browser.
 *
 * VERSION 2 - what changed and why. Version 1 let the browser scroll natively while the
 * finger was down and only replaced the release. On real phones that failed: the browser's
 * momentum was still running when the glide began, and the two fought (on iPhone a script's
 * scroll is ignored until momentum ends, then the page jumps), so after the first swipe the
 * page glitched, overscrolled and jumped. It also switched itself to an instant jump when the
 * system had "reduce motion" on - but this site deliberately ignores that setting for all of
 * its animations (see portfolio-reveal, hero) - so desktops with it on got no glide at all.
 *
 * Now (touch): the browser is told it may only pan sideways (chapters.css: touch-action on
 * html.ch-glide), so it never scrolls the page vertically or starts momentum. This script
 * follows the finger itself (page position = start position - finger travel, clamped to the
 * page, so no rubber-band either), and on release glides from where it is to the chosen
 * chapter. The glide is a cubic Hermite curve that starts at the finger's own release speed
 * (no jolt when the finger lifts) and ends at rest. It is monotonic: its position can never
 * pass the target, which is what "no overshoot" means here.
 *
 * Wheel / trackpad: native wheel scrolling is replaced on the chapter pages. The first
 * movement of a gesture starts one glide (ease-in-out, from rest) to the adjacent chapter;
 * the rest of the gesture - a trackpad's inertia tail, extra notches while gliding - is
 * swallowed until the wheel goes quiet. A clearly harder swipe during a tail is a new gesture.
 *
 * Scroll-snap is held off from the first touch until a moment after the page has come to
 * rest, then given back, so keyboard, anchors and the dot rail behave as before.
 *
 * Left to the browser on purpose:
 *   - horizontal swipes (card rows, gallery, tag rows) - touch-action still allows them;
 *   - a swipe that starts inside something that scrolls on its own (the Skills tag boxes),
 *     until that box is at its end in the swipe's direction, when the page takes over;
 *   - form fields, lightboxes, an open mobile menu (page scroll is locked), ctrl+wheel zoom,
 *     the scrollbar and the keyboard.
 *
 * Stops: the top of every chapter (.ch), the bottom-aligned position of a chapter taller than
 * the screen, and the very bottom (footer), measured at each gesture from LAYOUT (a chapter
 * waiting to be revealed is drawn 22px low; the browser's snap ignores that, so must this).
 */
( function () {
	'use strict';

	var root = document.documentElement;
	var hasTouch = ( 'ontouchstart' in window ) || ( navigator.maxTouchPoints > 0 );
	// Deliberately NOT reading prefers-reduced-motion: the owner's rule for this site is that its
	// animations always play (see portfolio-reveal / hero), and honouring it here made the slide an
	// instant jump on every computer that has "reduce motion" switched on.

	var MOVE_MIN = 36;      // px of finger travel that counts as "go to the next chapter"
	var FLICK_MIN = 0.3;    // px/ms of finger speed that counts as a flick, however short
	var AXIS_SLOP = 6;      // px before a touch's direction is decided
	var WHEEL_QUIET = 160;  // ms without wheel events = the gesture (and its inertia) is over
	var SETTLE_MS = 450;    // after arriving, how long before scroll-snap is handed back

	var anim = null;        // running glide: { raf }
	var settle = 0;         // timer that hands scroll-snap back to the browser
	var g = null;           // touch gesture in progress

	function clamp( v, lo, hi ) { return Math.min( hi, Math.max( lo, v ) ); }

	function holdSnap() {
		clearTimeout( settle );
		root.style.setProperty( 'scroll-snap-type', 'none' );
		root.style.setProperty( 'scroll-behavior', 'auto' );
	}
	function restoreSnap() {
		clearTimeout( settle );
		root.style.removeProperty( 'scroll-snap-type' );
		root.style.removeProperty( 'scroll-behavior' );
	}
	function restoreSoon() {
		clearTimeout( settle );
		settle = setTimeout( restoreSnap, SETTLE_MS );
	}
	/** Stop any glide where it is. Snap stays off; whoever stops it decides when to give it back. */
	function cancelGlide() {
		clearTimeout( settle );
		if ( anim ) { cancelAnimationFrame( anim.raf ); anim = null; }
	}

	function maxScroll() { return Math.max( 0, root.scrollHeight - window.innerHeight ); }

	/**
	 * Exact distance of `el` from the top of the document, from LAYOUT only: its box minus its own
	 * transform. Kept fractional - the snap target is, and arriving a pixel off makes it nudge the
	 * page when it switches back on.
	 */
	function docTop( el ) {
		var ty = 0, tf = getComputedStyle( el ).transform;
		if ( tf && tf !== 'none' ) { try { ty = new DOMMatrixReadOnly( tf ).m42; } catch ( e ) { ty = 0; } }
		return el.getBoundingClientRect().top + window.pageYOffset - ty;
	}

	/**
	 * How far down the chapter its actual content reaches (widgets, images, video), measured from
	 * the chapter's own top - i.e. its height minus any trailing padding/empty space. Both rects
	 * carry the same reveal transform, so it cancels out.
	 */
	function contentHeight( el ) {
		var top = el.getBoundingClientRect().top, bottom = top;
		var items = el.querySelectorAll( '.elementor-widget, img, video, iframe' );
		for ( var i = 0; i < items.length; i++ ) {
			var r = items[ i ].getBoundingClientRect();
			if ( r.height > 0 && r.bottom > bottom ) { bottom = r.bottom; }
		}
		return bottom - top;
	}

	/** Every position the page is allowed to rest at, ascending. */
	function stops() {
		var vh = window.innerHeight, max = maxScroll(), out = [ 0, max ];
		var chapters = document.querySelectorAll( '.ch' );
		for ( var i = 0; i < chapters.length; i++ ) {
			var el = chapters[ i ];
			var h = el.offsetHeight;
			if ( h < 1 || el.classList.contains( 'ch-drop' ) ) { continue; }
			var margin = parseFloat( getComputedStyle( el ).scrollMarginTop ) || 0;
			var top = docTop( el );
			out.push( top - margin );
			// A second, bottom-aligned stop only when real content runs past the screen. A chapter
			// that is taller than the screen only by its own bottom padding already shows everything
			// at its first stop, and the extra stop was a "scroll a few px, then scroll again" step.
			var tall = h > vh + 4 && contentHeight( el ) > vh + 4;
			if ( tall ) { out.push( top + h - vh ); }
			// A chapter with a second, bottom-aligned stop gets a snap point at its foot too (chapters.css
			// .ch-tall::after). Without it the browser's own mandatory snapping does not recognise that stop
			// where it only allows a tall box's edges (Safari): the glide arrived, then the page was pulled to
			// the next chapter's edge - a jump after every swipe through such a chapter.
			if ( el.classList.contains( 'ch-tall' ) !== tall ) { el.classList.toggle( 'ch-tall', tall ); }
		}
		out = out.map( function ( v ) { return clamp( v, 0, max ); } ).sort( function ( a, b ) { return a - b; } );
		// Stops closer than 48px are one stop (the first chapter's top sits ~34px under the page top on
		// phones: a first swipe that moved the page 34px read as a nudge, not a chapter change).
		var kept = [];
		for ( var k = 0; k < out.length; k++ ) { if ( ! kept.length || out[ k ] - kept[ kept.length - 1 ] > 48 || k === out.length - 1 && out[ k ] - kept[ kept.length - 1 ] > 6 ) { kept.push( out[ k ] ); } }
		return kept;
	}

	function nearest( list, y ) {
		var best = 0;
		for ( var i = 1; i < list.length; i++ ) {
			if ( Math.abs( list[ i ] - y ) < Math.abs( list[ best ] - y ) ) { best = i; }
		}
		return best;
	}

	/** The nearest ancestor that scrolls vertically on its own and has somewhere to go, or null. */
	function innerScroller( el ) {
		for ( ; el && el !== document.body && el !== root; el = el.parentElement ) {
			var oy = getComputedStyle( el ).overflowY;
			if ( ( oy === 'auto' || oy === 'scroll' ) && el.scrollHeight > el.clientHeight + 2 ) { return el; }
		}
		return null;
	}

	/** True when the page must be left entirely to the browser for a gesture that starts on `target`. */
	function pageLocked( target, touch ) {
		if ( ! root.classList.contains( 'ch-on' ) ) { return true; }
		if ( ! target || ! target.closest ) { return true; }
		if ( target.closest( '.pg-lightbox, .elementor-lightbox, .dialog-widget' ) ) { return true; }
		var field = target.closest( 'input, textarea, select, [contenteditable="true"]' );
		// A form field keeps its own gestures only while it is being edited. A finger that merely lands on one
		// (the contact form fills most of a phone's last screen) must still scroll the page: with the page's
		// vertical panning handled here, a locked swipe on a field did nothing at all - the page looked stuck.
		if ( field && ( ! touch || field === document.activeElement || field.contains( document.activeElement ) ) ) { return true; }
		// An open mobile menu or lightbox locks page scroll.
		return getComputedStyle( root ).overflowY === 'hidden' || getComputedStyle( document.body ).overflowY === 'hidden';
	}

	/**
	 * Glide the page from `from` to `to`.
	 * v0: speed (px/ms, toward the target) the page already has when the glide starts - the finger's
	 *     release speed - so there is no jolt. 0 from rest.
	 * Curve: cubic Hermite, start slope v0*dur, end slope 0. With the start slope capped at 3x the
	 * average slope it is monotonic, so it can never pass `to`.
	 */
	function glide( from, to, v0, wheel ) {
		var dist = to - from, ad = Math.abs( dist );
		cancelGlide();
		holdSnap();
		if ( ad < 1 ) { restoreSoon(); return; }
		var dur = wheel ? clamp( 420 + ad * 0.45, 520, 950 ) : clamp( 340 + ad * 0.32, 380, 720 );
		var m0 = clamp( ( v0 || 0 ) * dur, 0, 3 * ad );
		var sgn = dist < 0 ? -1 : 1;
		var t0 = performance.now();
		anim = { raf: 0 };
		function step( now ) {
			var p = clamp( ( now - t0 ) / dur, 0, 1 ); // rAF's timestamp can precede performance.now(): never negative
			var h = ( p * p * p - 2 * p * p + p ) * m0 + ( -2 * p * p * p + 3 * p * p ) * ad;
			window.scrollTo( 0, p < 1 ? from + sgn * h : to );
			if ( p < 1 ) { anim.raf = requestAnimationFrame( step ); }
			else { anim = null; restoreSoon(); }
		}
		anim.raf = requestAnimationFrame( step );
	}

	/* ---------------- touch ---------------- */
	var touchOK = false;
	if ( hasTouch && window.CSS && CSS.supports && CSS.supports( 'touch-action', 'pan-x pinch-zoom' ) && window.matchMedia( '(pointer: coarse)' ).matches ) {
		// chapters.css: html.ch-on.ch-glide { touch-action: pan-x pinch-zoom } - the browser may no longer scroll
		// the page vertically itself, so it starts no momentum for this script to fight.
		root.classList.add( 'ch-glide' );
		touchOK = true;
	}

	/**
	 * Lock the sideways-only scrollers (the card rows, the gallery strip, the tag rows) to sideways panning too.
	 * Browsers do not carry the page's touch-action through a scroll container: a finger that lands on one of
	 * these rows still scrolled the PAGE natively (with its momentum) and fought this script - measured: 185px
	 * of native scroll when the swipe started on a row, 0 elsewhere. A row is any element that scrolls on its own
	 * (overflow auto/scroll) but has nothing to scroll vertically; a box that really scrolls vertically (the
	 * Skills tag boxes, an open menu) is left alone. chapters.css gives the marked rows touch-action: pan-x.
	 */
	function lockRows() {
		var all = document.body ? document.body.getElementsByTagName( '*' ) : [], mark = [], unmark = [], i, el, cs, ox, oy, scrolls, vertical;
		for ( i = 0; i < all.length; i++ ) {
			el = all[ i ]; cs = getComputedStyle( el ); ox = cs.overflowX; oy = cs.overflowY;
			scrolls = ox === 'auto' || ox === 'scroll' || oy === 'auto' || oy === 'scroll';
			if ( ! scrolls || cs.display === 'none' || ! el.getClientRects().length ) { if ( el.classList.contains( 'ch-xrow' ) && ! scrolls ) { unmark.push( el ); } continue; }
			vertical = ( oy === 'auto' || oy === 'scroll' ) && el.scrollHeight > el.clientHeight + 2;
			if ( vertical ) { if ( el.classList.contains( 'ch-xrow' ) ) { unmark.push( el ); } } else if ( ! el.classList.contains( 'ch-xrow' ) ) { mark.push( el ); }
		}
		for ( i = 0; i < mark.length; i++ ) { mark[ i ].classList.add( 'ch-xrow' ); }
		for ( i = 0; i < unmark.length; i++ ) { unmark[ i ].classList.remove( 'ch-xrow' ); }
	}
	var lockTimer;
	function lockRowsSoon( ms ) { clearTimeout( lockTimer ); lockTimer = setTimeout( lockRows, ms || 250 ); }
	if ( touchOK ) {
		lockRows();
		window.addEventListener( 'load', function () { lockRowsSoon( 100 ); setTimeout( lockRows, 1500 ); } );
		window.addEventListener( 'resize', function () { lockRowsSoon( 300 ); }, { passive: true } );
		window.addEventListener( 'orientationchange', function () { lockRowsSoon( 300 ); } );
		window.addEventListener( 'pageshow', function () { lockRowsSoon( 100 ); } );
		if ( window.MutationObserver ) {
			// Rows appear/disappear as tabs and menus change; re-check shortly after anything is
			// added or its class/style changes.
			//
			// chapters.js toggles ch-active/ch-near/ch-from-below/ch-from-above on every .ch on
			// every scroll (that is how it tracks which chapter is current) - those are class
			// mutations too, so without this filter a scroll session re-ran the full-DOM
			// getElementsByTagName('*') + getComputedStyle scan below on a 250ms trailing edge for
			// as long as chapters kept changing, which on a slower phone is exactly the kind of
			// main-thread work that reads as the page "glitching" mid-scroll. None of those classes
			// ever change what scrolls sideways, so a batch containing only them is skipped; any
			// other class/style/hidden change, or a real childList change, still triggers it.
			new MutationObserver( function ( mutations ) {
				for ( var i = 0; i < mutations.length; i++ ) {
					var m = mutations[ i ];
					if ( m.type === 'attributes' && m.attributeName === 'class' && m.target.classList && m.target.classList.contains( 'ch' ) ) {
						continue;
					}
					lockRowsSoon( 250 );
					return;
				}
			} ).observe( document.body, { childList: true, subtree: true, attributes: true, attributeFilter: [ 'class', 'style', 'hidden' ] } );
		}
	}

	if ( touchOK ) {
		window.addEventListener( 'touchstart', function ( ev ) {
			cancelGlide();
			g = null;
			if ( ev.touches.length !== 1 || pageLocked( ev.target, true ) ) { restoreSnap(); return; }
			var t = ev.touches[ 0 ];
			var inner = innerScroller( ev.target );
			holdSnap(); // from the first touch: the page is moved by script only, snap must not pull on it
			g = {
				x0: t.clientX, y0: t.clientY, s0: window.pageYOffset, lastSet: window.pageYOffset, axis: '', drive: false,
				inner: inner, innerTop: inner ? inner.scrollTop <= 0 : false, innerBottom: inner ? inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 1 : false,
				samples: [ { y: t.clientY, t: ev.timeStamp } ], last: t.clientY
			};
		}, { passive: true } );

		window.addEventListener( 'touchmove', function ( ev ) {
			if ( ! g ) { return; }
			if ( ev.touches.length !== 1 ) { g = null; restoreSnap(); return; }
			var t = ev.touches[ 0 ];
			if ( ! g.axis ) {
				var dx = Math.abs( t.clientX - g.x0 ), dy0 = Math.abs( t.clientY - g.y0 );
				if ( dx > AXIS_SLOP || dy0 > AXIS_SLOP ) {
					g.axis = dy0 > dx * 1.2 ? 'y' : 'x';
					if ( g.axis === 'y' ) {
						// Inside a box that scrolls itself the browser keeps the gesture - until the box is at its end
						// in this direction, when the page takes over (finger up scrolls a box down).
						var up = t.clientY < g.y0;
						g.drive = ! g.inner || ( up ? g.innerBottom : g.innerTop );
						if ( ! g.drive ) { g = null; restoreSnap(); return; }
					}
				}
			}
			g.last = t.clientY;
			g.samples.push( { y: t.clientY, t: ev.timeStamp } );
			while ( g.samples.length > 2 && ev.timeStamp - g.samples[ 0 ].t > 120 ) { g.samples.shift(); }
			if ( g.axis === 'y' && g.drive ) {
				// Something else moved the page (a browser that ignored touch-action): hand the gesture back.
				if ( Math.abs( window.pageYOffset - g.lastSet ) > 4 ) { g = null; restoreSnap(); return; }
				// The page follows the finger, but never past the neighbouring stops: a gesture that moved
				// further than the next stop was away (the last chapter to the footer is only ~275px on a
				// phone) dragged the page beyond it, and on release it glided back - a visible bounce.
				if ( ! g.bounds ) {
					var sl = stops(), fi = nearest( sl, g.s0 );
					// 10px short of the neighbouring stop, so the release always has a little way to glide: a page
					// already exactly on the target made the glide a no-op, and the browser's own snapping then
					// pulled it to a different position (the last chapter's lower stop is not one of its snap points).
					var lo = sl[ Math.max( 0, fi - 1 ) ], hi = sl[ Math.min( sl.length - 1, fi + 1 ) ];
					g.bounds = [ lo < g.s0 ? Math.min( lo + 10, g.s0 ) : g.s0, hi > g.s0 ? Math.max( hi - 10, g.s0 ) : g.s0 ];
				}
				g.lastSet = clamp( g.s0 - ( t.clientY - g.y0 ), g.bounds[ 0 ], g.bounds[ 1 ] );
				window.scrollTo( 0, g.lastSet );
			}
		}, { passive: true } );

		window.addEventListener( 'touchend', function ( ev ) {
			var gesture = g; g = null;
			if ( ev.touches && ev.touches.length ) { return; }
			if ( ! gesture || gesture.axis !== 'y' || ! gesture.drive ) { restoreSnap(); return; }
			var list = stops();
			if ( list.length < 2 ) { restoreSnap(); return; }
			var cur = window.pageYOffset;
			var from = nearest( list, gesture.s0 );
			var dy = gesture.last - gesture.y0;               // finger up = negative = page moves forward
			var s = gesture.samples, first = s[ 0 ], last = s[ s.length - 1 ];
			var v = last.t > first.t ? ( last.y - first.y ) / ( last.t - first.t ) : 0; // finger px/ms
			var dir = 0;
			if ( Math.abs( dy ) >= MOVE_MIN || Math.abs( v ) >= FLICK_MIN ) { dir = ( Math.abs( v ) >= FLICK_MIN ? v : dy ) < 0 ? 1 : -1; }
			var to = list[ clamp( from + dir, 0, list.length - 1 ) ];
			// The page moves opposite to the finger; keep only the part of that speed that heads for the target.
			var pageV = -v * ( to >= cur ? 1 : -1 );
			glide( cur, to, Math.max( 0, pageV ), false );
		}, { passive: true } );
		window.addEventListener( 'touchcancel', function () { g = null; restoreSnap(); }, { passive: true } );
	}

	/* ---------------- wheel / trackpad ---------------- */
	var lastWheel = 0, lastMag = 0, wheelAcc = 0, wheelFired = false;
	window.addEventListener( 'wheel', function ( ev ) {
		if ( ev.ctrlKey || ev.defaultPrevented ) { return; }               // pinch-zoom, or someone else's
		var dy = ev.deltaY, dx = ev.deltaX;
		if ( Math.abs( dy ) <= Math.abs( dx ) ) { return; }                 // horizontal: leave to the browser
		var inner = innerScroller( ev.target );
		if ( pageLocked( ev.target ) || ( inner && ! ( dy > 0 ? inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 1 : inner.scrollTop <= 0 ) ) ) { cancelGlide(); restoreSnap(); return; }
		ev.preventDefault();                                                // the glide replaces native wheel scrolling
		var mag = Math.abs( dy ) * ( ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 400 : 1 );
		var quiet = ev.timeStamp - lastWheel, prev = lastMag;
		lastWheel = ev.timeStamp; lastMag = mag;
		if ( quiet > WHEEL_QUIET ) { wheelAcc = 0; wheelFired = false; prev = 0; } // a new gesture
		if ( anim ) { return; }                                             // gliding: swallow the rest of this gesture
		if ( wheelFired ) {
			if ( ! ( mag > prev * 1.7 && mag > 30 ) ) { return; }          // still the inertia tail
			wheelAcc = 0; wheelFired = false;                              // a clearly harder swipe: a new gesture
		}
		wheelAcc += dy;
		if ( Math.abs( wheelAcc ) < 6 && mag < 30 ) { return; }             // wait until the movement means something
		wheelFired = true;
		var list = stops(), cur = window.pageYOffset, to = null, i;
		if ( wheelAcc > 0 ) { for ( i = 0; i < list.length; i++ ) { if ( list[ i ] > cur + 3 ) { to = list[ i ]; break; } } }
		else { for ( i = list.length - 1; i >= 0; i-- ) { if ( list[ i ] < cur - 3 ) { to = list[ i ]; break; } } }
		if ( to !== null ) { glide( cur, to, 0, true ); }
	}, { passive: false } );

	// The keyboard takes over from a glide in progress.
	window.addEventListener( 'keydown', function () { if ( anim ) { cancelGlide(); restoreSnap(); } }, { passive: true } );

	// Keep the tall-chapter snap points (see stops()) current without waiting for a gesture: after the page and
	// fonts have loaded, and when the window changes size.
	( function () {
		var t;
		function refresh() { clearTimeout( t ); t = setTimeout( function () { if ( root.classList.contains( 'ch-on' ) ) { stops(); } }, 200 ); }
		window.addEventListener( 'load', function () { refresh(); setTimeout( refresh, 1500 ); } );
		window.addEventListener( 'resize', refresh, { passive: true } );
		window.addEventListener( 'orientationchange', refresh );
		if ( document.fonts && document.fonts.ready ) { document.fonts.ready.then( refresh ); }
	} )();
} )();
