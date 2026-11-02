/**
 * Builds the "jump to subcategory" chips for the active tab on /projects/,
 * places them directly under the tab row, and keeps them in sync when the
 * visitor switches tabs. Reads the existing heading widgets Elementor already
 * renders inside each tab panel - nothing here duplicates or re-authors
 * content, it only indexes what's there.
 *
 * Placement matters as much as content: the four tabs are the page's main
 * categories and the chips are the active category's own subcategories, so
 * the chips sit immediately under the tab row (inside the tabs widget, between
 * the tab list and the panels), with a caption naming the active category.
 * They used to sit above the tabs, which made the subcategories read as the
 * top level and the categories as an afterthought.
 */
(function () {
	'use strict';

	function ready( fn ) {
		if ( document.readyState !== 'loading' ) { fn(); }
		else { document.addEventListener( 'DOMContentLoaded', fn ); }
	}

	ready( function () {
		var tabsWidget = document.querySelector( '.elementor-widget-n-tabs' );
		if ( ! tabsWidget ) { return; }

		var titles = tabsWidget.querySelectorAll( '.e-n-tab-title' );
		if ( ! titles.length ) { return; }

		var nav = document.createElement( 'nav' );
		nav.className = 'pp-subnav';
		nav.setAttribute( 'aria-label', 'Project emphases' );

		var label = document.createElement( 'p' );
		label.className = 'pp-subnav__label';
		var row = document.createElement( 'div' );
		row.className = 'pp-subnav__row';
		nav.appendChild( label );
		nav.appendChild( row );

		var heading = tabsWidget.querySelector( '.e-n-tabs-heading' );
		if ( heading ) {
			heading.insertAdjacentElement( 'afterend', nav );
		} else {
			tabsWidget.parentNode.insertBefore( nav, tabsWidget );
		}

		/**
		 * Subcategory headings are heading widgets that are direct siblings
		 * of the posts widgets inside a tab panel (divider / heading /
		 * divider / posts, repeated) - querying by that class inside the
		 * panel is enough, since nothing else inside a panel is a heading
		 * widget.
		 */
		function buildFor( panel, categoryName ) {
			row.innerHTML = '';
			var count = 0;
			if ( panel ) {
				var headings = panel.querySelectorAll( ':scope .elementor-widget-heading .elementor-heading-title' );
				headings.forEach( function ( h ) {
					var text = h.textContent.trim();
					if ( ! text ) { return; }
					var pill = document.createElement( 'button' );
					pill.type = 'button';
					pill.className = 'pp-subnav__pill';
					pill.textContent = text;
					pill.addEventListener( 'click', function () {
						// With chapters on (desktop) the emphasis is a whole
						// screen: go to its chapter, not to the heading inside it.
						( h.closest( '.ch' ) || h ).scrollIntoView( { behavior: 'smooth', block: 'start' } );
					} );
					row.appendChild( pill );
					count++;
				} );
			}
			// Worded "emphases" on the page, not "subcategories" - the owner's
			// term for what these are (the areas each category concentrates on).
			label.textContent = categoryName ? categoryName + ' emphases' : 'Emphases';
			// Fewer than two sections means nothing to jump between. Mechanical
			// is one flat list under a single heading, so it would get one
			// chip that scrolls to the section already in front of you; the
			// row and its caption go away instead of sitting over nothing.
			nav.hidden = count < 2;
		}

		function activeTitle() {
			return tabsWidget.querySelector( '.e-n-tab-title[aria-selected="true"]' );
		}

		function sync() {
			var active = activeTitle();
			var panel = null;
			var name = '';
			if ( active ) {
				var id = active.getAttribute( 'aria-controls' );
				panel = id ? document.getElementById( id ) : null;
				name = active.textContent.trim();
			}
			buildFor( panel, name );
		}

		sync();

		// Elementor's own click handling does the actual tab switch; this
		// only watches aria-selected so the nav stays correct regardless of
		// how/when that happens, rather than racing its click handler.
		var mo = new MutationObserver( function ( mutations ) {
			var changed = mutations.some( function ( m ) { return m.attributeName === 'aria-selected'; } );
			if ( changed ) { sync(); }
		} );
		titles.forEach( function ( t ) { mo.observe( t, { attributes: true } ); } );
	} );
})();
