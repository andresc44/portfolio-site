/**
 * Homepage scroll reveal. Progressive enhancement only: nothing is ever
 * hidden by CSS default, so a JS error or an old browser just means a
 * static (but fully visible) page, never stuck-invisible content.
 *
 * Strategy:
 *  - Walk the page's top-level Elementor sections (skipping the hero,
 *    which has its own entrance animation already).
 *  - Inside each section, find genuine repeating groups (Elementor "grid"
 *    containers, or any container with 2+ container children — icon rows,
 *    two-column layouts, card grids) and reveal each child individually
 *    with a short stagger.
 *  - Sections with no such group reveal as a single block.
 *  - One IntersectionObserver for everything (cheap — no scroll listeners).
 *  - transform/opacity only, so it's compositor-driven and doesn't touch
 *    layout — this is the same discipline the hero animation needed to
 *    hit 60fps.
 */
(function () {
	'use strict';

	if ( ! ( 'IntersectionObserver' in window ) ) {
		return;
	}
	// Deliberately does NOT check prefers-reduced-motion - site owner's
	// explicit choice to always animate. See the matching note in hero.css.

	function ready( fn ) {
		if ( document.readyState !== 'loading' ) fn();
		else document.addEventListener( 'DOMContentLoaded', fn );
	}

	function isContainerEl( el ) {
		return el.classList.contains( 'e-con' ) ||
			el.classList.contains( 'e-grid' ) ||
			// Posts widgets render their cards as <article class="elementor-post">
			// rather than as containers, so without this the whole Highlighted
			// Projects grid reveals as one block instead of card by card.
			el.classList.contains( 'elementor-post' );
	}

	function collectTargets( wrapper ) {
		// The project listings (Robotics etc., My Projects) are chaptered by
		// moving their widgets into new wrappers rather than from sections, so
		// there is nothing section-shaped to group: the cards of every posts
		// widget reveal one after another, exactly like the home page's cards
		// (the chapter itself fades in on its own, chapters.css). Cards in the
		// tabs that are not showing are watched too and reveal when their tab
		// is opened.
		if ( document.body.classList.contains( 'ch-page-cat' ) || document.body.classList.contains( 'ch-page-projects' ) ) {
			var cards = [];
			Array.prototype.forEach.call( wrapper.querySelectorAll( '.elementor-posts-container' ), function ( box ) {
				var n = 0;
				Array.prototype.forEach.call( box.children, function ( card ) {
					if ( card.classList.contains( 'elementor-post' ) ) { cards.push( { el: card, delay: Math.min( n, 5 ) } ); n++; }
				} );
			} );
			return cards;
		}

		// Top-level sections are direct children of the page wrapper, except
		// on the home page where portfolio-chapters has grouped them one
		// level deeper inside .ch elements. Matching both keeps this
		// independent of whether chaptering ran, and of which of the two
		// scripts happened to run first.
		var topSections = Array.prototype.filter.call(
			wrapper.querySelectorAll( ':scope > .e-parent, :scope > .ch > .e-parent' ),
			function ( el ) {
				return ! el.querySelector( '.hx' ) && ! el.classList.contains( 'hx' );
			}
		);

		var targets = []; // { el, delay }
		var claimed = [];
		var MAX_STAGGER = 5; // caps the tail on large groups — nobody should wait a full second for the last card

		function findGroups( root ) {
			var groups = [];
			// .e-con-inner is Elementor's own width-constraining wrapper for
			// "boxed" sections — it holds the real content but isn't itself
			// class="e-con", so it has to be searched explicitly or sibling
			// groups directly under a boxed section (e.g. an image column
			// next to a text column) would never be found as parents.
			var all = root.querySelectorAll( '.e-con, .e-grid, .e-con-inner, .elementor-posts-container' );
			for ( var i = 0; i < all.length; i++ ) {
				var el = all[ i ];
				if ( claimed.indexOf( el ) !== -1 ) continue;
				var kids = Array.prototype.filter.call( el.children, isContainerEl );
				if ( kids.length >= 2 ) {
					groups.push( { parent: el, kids: kids } );
				}
			}
			return groups;
		}

		topSections.forEach( function ( section ) {
			// Sections often nest groups inside groups (e.g. a wrapper
			// holding two grids, each of which holds the real cards).
			// Processing deepest-first lets the actual cards claim
			// themselves before an outer wrapper can grab its two grids
			// as if THEY were the cards.
			var groups = findGroups( section ).reverse();
			var used = false;
			groups.forEach( function ( g ) {
				if ( claimed.indexOf( g.parent ) !== -1 ) return;
				// A group nested inside another group's own children is
				// already covered by its parent's reveal — skip it.
				var nested = g.kids.some( function ( k ) { return claimed.indexOf( k ) !== -1; } );
				if ( nested ) return;

				g.kids.forEach( function ( kid, i ) {
					targets.push( { el: kid, delay: Math.min( i, MAX_STAGGER ) } );
					claimed.push( kid );
				} );
				claimed.push( g.parent );
				used = true;
			} );

			if ( ! used ) {
				targets.push( { el: section, delay: 0 } );
			}
		} );

		return targets;
	}

	ready( function () {
		// Specifically the page content, not the site header/footer templates
		// (which also render as their own `.elementor[data-elementor-type]`
		// wrappers and would otherwise be matched first).
		var wrapper = document.querySelector( '.elementor[data-elementor-type="wp-page"], .elementor[data-elementor-type="wp-post"]' );
		if ( ! wrapper ) return;

		var targets = collectTargets( wrapper );
		if ( ! targets.length ) return;

		targets.forEach( function ( t ) {
			t.el.classList.add( 'pr' );
			t.el.style.setProperty( '--pr-d', t.delay );
		} );

		// Belt-and-suspenders: if anything is somehow never revealed (a bug
		// here, a browser quirk), nobody should be left staring at
		// permanently-invisible content. This is a no-op for anything
		// already revealed, so it's free to let it always run.
		setTimeout( function () {
			targets.forEach( function ( t ) { t.el.classList.add( 'pr-in', 'pr-done' ); } );
		}, 4000 );

		var io = new IntersectionObserver( function ( entries, obs ) {
			entries.forEach( function ( entry ) {
				if ( ! entry.isIntersecting ) return;
				var el = entry.target;
				el.classList.add( 'pr-in' );
				el.addEventListener( 'transitionend', function handler( e ) {
					if ( e.target !== el ) return;
					el.classList.add( 'pr-done' ); // drops will-change once settled
					el.removeEventListener( 'transitionend', handler );
				} );
				obs.unobserve( el );
			} );
		}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' } );

		targets.forEach( function ( t ) { io.observe( t.el ); } );
	} );
})();
