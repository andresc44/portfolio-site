/**
 * Hamburger dropdown: label of a parent item = "go there" once its submenu
 * is open, chevron = expand/collapse only (see ../mobile-menu-link.php for why).
 *
 * Two things make this less obvious than a click handler on the anchor:
 *
 * 1. Capture phase on document. SmartMenus binds its own handling on the
 *    menu <ul> and swallows or follows clicks on parent links itself, so a
 *    bubbling listener on the anchor would already be too late.
 *
 * 2. "Is it open?" is read when the finger goes DOWN, not when the click
 *    arrives. On touch devices the menu can toggle on pointer-up, before the
 *    click event fires, so by click time an open submenu may already read as
 *    closed and the second tap would be taken for a first one again. The
 *    state at press time is what the person actually saw when they tapped.
 */
(function () {
	'use strict';

	var SELECTOR = 'nav.elementor-nav-menu--dropdown a.has-submenu';
	var press = null; // { link, open, at } recorded at pointer-down

	function isOpen( link ) {
		if ( link.classList.contains( 'highlighted' ) || link.getAttribute( 'aria-expanded' ) === 'true' ) {
			return true;
		}
		var sub = link.nextElementSibling;
		return !! ( sub && sub.getAttribute( 'aria-expanded' ) === 'true' );
	}

	function menuLink( target ) {
		return target && target.closest ? target.closest( SELECTOR ) : null;
	}

	function onPress( e ) {
		var link = menuLink( e.target );
		press = link ? { link: link, open: isOpen( link ), at: Date.now() } : null;
	}

	// pointerdown is the first event of any press; mousedown only stands in
	// where pointer events don't exist (it also fires AFTER touch-end on
	// touch devices, which is exactly the late reading to avoid).
	if ( window.PointerEvent ) {
		document.addEventListener( 'pointerdown', onPress, true );
	} else {
		document.addEventListener( 'touchstart', onPress, true );
		document.addEventListener( 'mousedown', onPress, true );
	}

	document.addEventListener( 'click', function ( e ) {
		var link = menuLink( e.target );
		var seen = press;
		press = null;

		if ( ! link || ! link.href ) { return; }
		if ( e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ) { return; }

		// Keyboard activation has no press; read the live state instead.
		var wasOpen = ( seen && seen.link === link && Date.now() - seen.at < 1500 ) ? seen.open : isOpen( link );
		if ( ! wasOpen ) { return; } // first tap: SmartMenus opens the submenu

		if ( e.target.closest( '.sub-arrow' ) ) {
			// Collapse only. SmartMenus still runs and hides the submenu; this
			// just stops the same click from also following the link.
			e.preventDefault();
			return;
		}

		e.preventDefault();
		e.stopPropagation();
		window.location.href = link.href;
	}, true );
})();
