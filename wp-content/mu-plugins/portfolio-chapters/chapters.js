/**
 * Chapter scrolling for the home page and the About Me page (see PAGES
 * below for each page's grouping; the home page is described first because
 * it is the one that needed the most explaining).
 *
 * The home page is 13 top-level Elementor sections of very uneven height - the
 * hero is most of a screen, the discipline tile strip is a fifth of one,
 * Highlighted Projects is one and a half. Scroll-snapping those directly
 * would snap to arbitrary places. Instead they are grouped into chapters,
 * each of which is given a full screen by chapters.css.
 *
 * Desktop groups Mechanical in with Programming/Electrical rather than
 * giving it a screen of its own: its card is roughly half the height of a
 * 2x2 card grid, and a full 100vh floor under that little content alone
 * was mostly blank space above and below it - more than any neighbouring
 * chapter. Grouped in with Programming/Electrical, the combined content is
 * already taller than one screen (chapters.css's min-height lets a chapter
 * grow past 100vh exactly like Highlighted Projects already does), so
 * there's no floor left to pad out - the chapter is just as tall as what's
 * actually in it.
 *
 * Mobile splits those same three back into their own chapters instead.
 * The combined chapter's min-height can grow past 100svh exactly like it
 * does on desktop, but at phone width that growth is much taller relative
 * to the screen - three subcategories stacked as one continuous scroll
 * reads as one long, undifferentiated chapter rather than three distinct
 * ones the way the rest of the page's chapters each read as a single idea.
 * Splitting them restores that one-idea-per-screen rhythm; the blank-space
 * problem the desktop grouping solves doesn't recur, because each split
 * chapter's own content (one subcategory's worth of cards) is already
 * close to a phone screen's height on its own.
 *
 * Grouping happens here in the DOM rather than by restructuring Elementor's
 * stored data for two reasons: the page stays exactly as authored in the
 * editor (no nested containers for the owner to navigate around), and if
 * this script ever fails the page is simply the un-chaptered page it is
 * today rather than a broken layout - chapters.css only ever styles .ch,
 * which nothing but this file creates.
 *
 * Everything here is transform/opacity and class toggling; the only scroll
 * listener is the fallback for browsers without scroll-driven CSS
 * animations, and even that is rAF-throttled.
 */
(function () {
	'use strict';

	// Same breakpoint custom-fixes.css and every other mobile-only rule on
	// this site uses. Read once at load, because the grouping below is DOM
	// surgery that can only be done once - so when the window is later
	// resized across the breakpoint (a desktop window dragged narrow, the
	// phone/desktop toggle in a browser's developer tools, a phone turned
	// to landscape) the page is reloaded to be grouped for its new size. It
	// used to keep whichever grouping it started with, which left a "phone"
	// showing the desktop's chapters (the Skills categories split three and
	// three into a chapter that does not exist on a phone).
	var isMobile = window.innerWidth < 768;

	// The project listing pages (Robotics etc., My Projects) are chaptered at
	// EVERY width - the grouping is the same on a phone and a desktop, only the
	// layout of the cards differs, and that is pure CSS - so they never need
	// the reload.
	function layoutKey() {
		if ( document.body.classList.contains( 'ch-page-cat' ) || document.body.classList.contains( 'ch-page-projects' ) ) {
			return 'any';
		}
		return window.innerWidth < 768 ? 'phone' : 'wide';
	}
	var startKey = null;
	var reloadTimer;
	window.addEventListener( 'resize', function () {
		if ( startKey === null ) { return; }
		clearTimeout( reloadTimer );
		reloadTimer = setTimeout( function () {
			if ( layoutKey() !== startKey ) { window.location.reload(); }
		}, 250 );
	}, { passive: true } );

	/**
	 * Section ids are stable Elementor element ids, taken from the page's
	 * stored data. An id that no longer exists is skipped, and a chapter
	 * with no surviving sections is dropped, so editing the page can never
	 * leave an empty screen behind.
	 *
	 * Desktop's 'programming' entry references two top-level sections
	 * wholesale. Mobile's 'programming' and 'electrical' entries instead
	 * reference dddc274 and 8bd69ab - sub-containers one level inside the
	 * shared top-level section (0c16ab7), each already its own heading plus
	 * card row. The lookup below falls back to a nested search for ids that
	 * aren't direct children of the page wrapper, which is what makes
	 * pulling them out individually possible without touching Elementor's
	 * stored data.
	 */
	/**
	 * Which page this is. portfolio-chapters.php puts ch-page-home or
	 * ch-page-about on <body>; anything unrecognised falls back to the home
	 * page's map, which is what this script did before it knew about more
	 * than one page.
	 */
	var PAGE = document.body.classList.contains( 'ch-page-about' ) ? 'about' :
		document.body.classList.contains( 'ch-page-skills' ) ? 'skills' :
		document.body.classList.contains( 'ch-page-cat' ) ? 'cat' :
		document.body.classList.contains( 'ch-page-projects' ) ? 'projects' : 'home';

	// Robotics, Programming, Electrical/Embedded and Mechanical (cat) and
	// My Projects (projects): one chapter per emphasis, built from the page's
	// flat run of widgets rather than from top-level sections.
	var PROJECT_PAGE = PAGE === 'cat' || PAGE === 'projects';

	/**
	 * Per-page grouping. `drop` lists sections that are hidden outright
	 * while chaptering is on: spacer and divider sections that only existed
	 * to separate one long scroll into parts, which the chapters do on their
	 * own - left in place, each would sit as a stray strip between two
	 * full-screen chapters.
	 *
	 * Home: a different list on phones and on larger screens (below).
	 * About Me: the same three chapters everywhere - the intro, Backpacking
	 * Adventures, and Hobbies. (Backpacking's second row of collage tiles,
	 * ddced6c, is desktop-only content that Elementor already hides on phones;
	 * it belongs to the same chapter as the heading above it.)
	 */
	var ABOUT = [
		{ key: 'about-me',    label: 'About Me',    hint: 'Scroll For Backpacking Adventures', sections: [ '9fded26' ] },
		{ key: 'backpacking', label: 'Backpacking', hint: 'Scroll For Hobbies', sections: [ '12825eb', 'ddced6c' ] },
		{ key: 'hobbies',     label: 'Hobbies',     sections: [ 'da0ce86' ] }
	];

	/**
	 * Skills & Tools. The six skill categories are authored as three
	 * sections of two (Languages + Frameworks, Robotics & AI + Simulation/CAD,
	 * Hardware + Operating Systems), and the page then has Certifications &
	 * Education after them.
	 *
	 * Phones: two chapters - the skills (title, intro, and the category
	 * chips), then Certifications & Education. The sections have to stay
	 * together and un-moved: the mobile filter (skills-filter.js) shows ONE
	 * category at a time and reveals it in whichever of those sections owns
	 * it.
	 *
	 * Tablet and desktop: three chapters. The six categories are split three
	 * and three - Languages, Frameworks and Robotics & AI under the page
	 * title, then Simulation/CAD, Hardware and Operating Systems - which
	 * cuts through the middle of the second authored section, so those two
	 * categories are referenced by their own ids and pulled apart (the same
	 * nested lookup the home page uses to split its Programming / Electrical
	 * pair). The now-empty section is removed by the cleanup below. The
	 * filter's chips are hidden at these widths, so nothing depends on the
	 * categories sharing a section there.
	 */
	var SKILLS = [
		{ key: 'skills',    label: 'Skills',    hint: 'Scroll For Education', sections: [ '13f6ccb', 'e726ace', '9260a85', '9580c61' ] },
		{ key: 'education', label: 'Education', sections: [ '543847f', '3d1b82f', '0e445d5' ] }
	];
	var SKILLS_WIDE = [
		{ key: 'skills',    label: 'Languages, Frameworks & Robotics', hint: 'Scroll For More Skills', sections: [ '13f6ccb', 'e726ace', '0b96bbd' ] },
		{ key: 'tools',     label: 'Simulation, Hardware & Cloud',     hint: 'Scroll For Education', sections: [ 'a85d83e', '9580c61' ] },
		{ key: 'education', label: 'Education',                        sections: [ '543847f', '3d1b82f', '0e445d5' ] }
	];

	var PAGES = {
		home: {
			mobile: [
				{ key: 'hero',       label: 'Home',       sections: [ 'c1be1d6' ] },
				{ key: 'about',      label: 'About',      hint: 'Scroll For Featured Projects', sections: [ '644c097c', '745a720', '9a6929a', '5d291ff' ] },
				{ key: 'projects',   label: 'Projects',   hint: 'Scroll For Fields of Interest', sections: [ '31c239a' ] },
				{ key: 'robotics',   label: 'Robotics',   hint: 'Scroll For More Fields of Interest', hintM: 'Scroll For Programming Fields', sections: [ '2e67814' ] },
				{ key: 'programming', label: 'Programming',          hint: 'Scroll For Electrical/Embedded Fields', sections: [ 'dddc274' ] },
				{ key: 'electrical',  label: 'Electrical / Embedded', hint: 'Scroll For Mechanical Fields', sections: [ '8bd69ab' ] },
				{ key: 'mechanical',  label: 'Mechanical',            hint: 'Scroll For Skills', sections: [ '5d9d235' ] },
				{ key: 'skills',     label: 'Skills',     hint: 'Scroll To Get In Touch', sections: [ '5e9fe74', '636519e', 'e045ccb' ] },
				{ key: 'contact',    label: 'Contact',    sections: [ 'e1c0517' ] }
			],
			desktop: [
				{ key: 'hero',       label: 'Home',       sections: [ 'c1be1d6' ] },
				{ key: 'about',      label: 'About',      hint: 'Scroll For Featured Projects', sections: [ '644c097c', '745a720', '9a6929a', '5d291ff' ] },
				{ key: 'projects',   label: 'Projects',   hint: 'Scroll For Fields of Interest', sections: [ '31c239a' ] },
				{ key: 'robotics',   label: 'Robotics',   hint: 'Scroll For More Fields of Interest', sections: [ '2e67814' ] },
				{ key: 'programming', label: 'Programming, Electrical/Embedded & Mechanical', hint: 'Scroll For Skills', sections: [ '0c16ab7', '5d9d235' ] },
				{ key: 'skills',     label: 'Skills',     hint: 'Scroll To Get In Touch', sections: [ '5e9fe74', '636519e', 'e045ccb' ] },
				{ key: 'contact',    label: 'Contact',    sections: [ 'e1c0517' ] }
			],
			drop: []
		},
		about: {
			mobile: ABOUT,
			desktop: ABOUT,
			drop: [ '459d5dfc', '4fe8982', '03ff127' ]
		},
		skills: {
			mobile: SKILLS,
			desktop: SKILLS_WIDE,
			drop: [ '459d5dfc' ] // an empty zero-height container at the top of the page
		},
		// Project listings: no section ids - the chapters are cut from the
		// page's single run of widgets (buildProjectChapters below).
		cat:      { mobile: [], desktop: [], drop: [ '459d5dfc' ] },
		projects: { mobile: [], desktop: [], drop: [ '459d5dfc' ] }
	};

	var CONFIG = PAGES[ PAGE ];
	var MAP = isMobile ? CONFIG.mobile : CONFIG.desktop;

	function ready( fn ) {
		if ( document.readyState !== 'loading' ) { fn(); }
		else { document.addEventListener( 'DOMContentLoaded', fn ); }
	}

	/** First and last chapter of a set carry the header / footer offsets (chapters.css). */
	function flagEnds( list ) {
		list.forEach( function ( c ) { c.el.classList.remove( 'ch--first', 'ch--last' ); } );
		if ( ! list.length ) { return; }
		list[ 0 ].el.classList.add( 'ch--first' );
		list[ list.length - 1 ].el.classList.add( 'ch--last' );
	}

	/* ---------------------------------------------------------------------
	   Project listings: one chapter per emphasis.

	   Robotics, Programming, Electrical/Embedded and Mechanical are one flat
	   run of widgets - a title, a row of jump chips, then for every emphasis
	   a divider, a heading, a divider and a Posts widget of cards. There are
	   no sections to group, so the run is cut at each emphasis heading (the
	   divider just before a heading goes with it) and every cut is wrapped in
	   a .ch. The first chapter also takes the title and the chips, so it
	   opens the page the way the other chaptered pages open.

	   My Projects (/projects/) is the same run once per tab, inside Elementor's
	   nested-tabs panels, and its title, tab row and chips have to be in the
	   first chapter of whichever tab is showing: they are moved into the
	   active panel's first chapter (still inside the tabs widget, so
	   Elementor's tab handling keeps finding them) and moved again when the
	   tab changes.

	   The containers around the chapters are flattened with display: contents
	   (class ch-flat, chapters.css) - their padding and gaps would otherwise
	   put the first snap point below the top of the page. */
	function isWidget( el, kind ) { return el.classList.contains( 'elementor-widget-' + kind ); }

	function slugOf( s ) {
		return String( s ).toLowerCase().replace( /[^a-z0-9]+/g, '-' ).replace( /^-+|-+$/g, '' ) || 'projects';
	}

	function elementChildren( host ) {
		return Array.prototype.filter.call( host.children, function ( el ) { return el.hasAttribute( 'data-element_type' ); } );
	}

	/** Cuts a run of sibling elements at each heading; the divider before a heading joins it. */
	function cutGroups( items ) {
		var pre = [], groups = [], cur = pre;
		items.forEach( function ( el ) {
			if ( isWidget( el, 'heading' ) ) {
				var carry = [];
				var last = cur[ cur.length - 1 ];
				if ( last && isWidget( last, 'divider' ) ) { carry.push( cur.pop() ); }
				cur = carry.concat( [ el ] );
				groups.push( cur );
			} else {
				cur.push( el );
			}
		} );
		return { pre: pre, groups: groups };
	}

	function makeChapter( els, label ) {
		var ch = document.createElement( 'section' );
		ch.className = 'ch';
		ch.setAttribute( 'data-ch', slugOf( label ) );
		ch.setAttribute( 'aria-label', label );
		els[ 0 ].parentNode.insertBefore( ch, els[ 0 ] );
		els.forEach( function ( el ) { ch.appendChild( el ); } );
		var cards = ch.querySelectorAll( '.elementor-post' ).length;
		var cols = Math.max( 1, Math.min( cards, 5 ) );
		ch.setAttribute( 'data-cols', cols );
		ch.style.setProperty( '--cp-cols', cols );
		return { el: ch, def: { key: slugOf( label ), label: label } };
	}

	function headingText( els ) {
		for ( var i = 0; i < els.length; i++ ) {
			if ( isWidget( els[ i ], 'heading' ) ) { return els[ i ].textContent.trim(); }
		}
		return '';
	}

	/** Chapters for one run of widgets; `intro` (title, chips) goes into the first. */
	function chaptersFor( host, intro, fallbackLabel ) {
		var cut = cutGroups( elementChildren( host ).filter( function ( el ) { return intro.indexOf( el ) === -1; } ) );
		var list = [];
		if ( ! cut.groups.length ) {
			list.push( makeChapter( intro.concat( cut.pre ), fallbackLabel ) );
		} else {
			cut.groups.forEach( function ( g, i ) {
				list.push( makeChapter( i === 0 ? intro.concat( cut.pre, g ) : g, headingText( g ) || fallbackLabel ) );
			} );
		}
		flagEnds( list );
		// "Scroll For Drones & Aerial Robotics": the next emphasis' title, on every
		// emphasis but the last (whose next stop is the footer).
		list.forEach( function ( c, i ) {
			c.def.hint = i < list.length - 1 ? 'Scroll For ' + list[ i + 1 ].def.label : '';
		} );
		return list;
	}

	function flatten( from, wrapper ) {
		for ( var n = from; n && n !== wrapper; n = n.parentNode ) {
			// tab panels hide themselves when inactive: handled per tab below
			if ( n.getAttribute && n.getAttribute( 'role' ) === 'tabpanel' ) { continue; }
			n.classList.add( 'ch-flat' );
		}
	}

	function buildProjectChapters( wrapper ) {
		/* Elementor blanks every background image (the gradient headings and the
		   active tab) inside a top-level container from the fourth on until its own
		   observer marks it .e-lazyloaded - and a container whose children have been
		   flattened into chapters is never reported, so on these pages the title and
		   the selected tab came out invisible. Nothing here has a lazy background
		   (the site clears them), so they are marked loaded straight away. */
		Array.prototype.forEach.call( wrapper.querySelectorAll( '.e-con.e-parent' ), function ( c ) { c.classList.add( 'e-lazyloaded' ); } );
		var title = wrapper.querySelector( '.elementor-widget-heading' );
		if ( ! title ) { return null; }
		var tabsWidget = wrapper.querySelector( '.elementor-widget-n-tabs' );

		if ( ! tabsWidget ) {
			// A category page: title and chips are the first widgets of the run.
			var host = title.parentNode;
			var chips = elementChildren( host ).filter( function ( el ) { return isWidget( el, 'icon-list' ); } );
			var list = chaptersFor( host, [ title ].concat( chips ), title.textContent.trim() );
			flatten( host, wrapper );
			return { chapters: list, tabs: null };
		}

		// My Projects: one run per tab panel.
		var titles = Array.prototype.slice.call( tabsWidget.querySelectorAll( '.e-n-tab-title' ) );
		var headingRow = tabsWidget.querySelector( '.e-n-tabs-heading' );
		if ( ! titles.length || ! headingRow ) { return null; }

		var panelOf = function ( tab ) { return document.getElementById( tab.getAttribute( 'aria-controls' ) ); };
		var perPanel = titles.map( function ( tab ) {
			var panel = panelOf( tab );
			var h = panel && panel.querySelector( '.elementor-widget-heading' );
			if ( ! h ) { return null; }
			// The run's container, taken BEFORE the chapters are made: the
			// heading's parent is the first chapter once it has been moved in.
			var runHost = h.parentNode;
			var list = chaptersFor( runHost, [], tab.textContent.trim() );
			flatten( runHost, wrapper );
			return { panel: panel, chapters: list };
		} );
		if ( perPanel.some( function ( p ) { return ! p; } ) ) { return null; }

		var api = { onChange: null };
		var current = -1;

		function activeIndex() {
			for ( var i = 0; i < titles.length; i++ ) {
				if ( titles[ i ].getAttribute( 'aria-selected' ) === 'true' ) { return i; }
			}
			return 0;
		}

		function introEls() {
			return [ title, headingRow, document.querySelector( '.pp-subnav' ) ].filter( Boolean );
		}

		// Title, tab row and chips go to the top of the showing tab's first chapter.
		function placeIntro( idx ) {
			var first = perPanel[ idx ].chapters[ 0 ].el;
			introEls().reverse().forEach( function ( el ) {
				el.classList.remove( 'ch-intro-wait' );
				first.insertBefore( el, first.firstChild );
			} );
		}

		function show( idx ) {
			current = idx;
			perPanel.forEach( function ( p, i ) { p.panel.classList.toggle( 'ch-flat', i === idx ); } );
			placeIntro( idx );
		}

		/* Elementor's tabs script finds the tab buttons by looking for ones
		   that sit directly inside the tabs widget, once, when it starts - so
		   the tab row must not be moved before it has started (it would find
		   no buttons and the tabs would never switch). After that it works
		   from the buttons it already found, which move with the row. The
		   widget marks itself .e-activated when it is ready. Until then the
		   title, tab row and chips are parked out of sight, so the page does
		   not show them in the wrong place and then jump. */
		current = activeIndex();
		perPanel.forEach( function ( p, i ) { p.panel.classList.toggle( 'ch-flat', i === current ); } );
		introEls().forEach( function ( el ) { el.classList.add( 'ch-intro-wait' ); } );

		var stage = tabsWidget.querySelector( '.e-n-tabs' );
		var settled = false;
		function settle() {
			if ( settled ) { return; }
			settled = true;
			show( activeIndex() );
			if ( api.onChange ) { api.onChange( perPanel[ current ].chapters ); }
		}
		if ( stage && ! stage.classList.contains( 'e-activated' ) ) {
			var waitMo = new MutationObserver( function () {
				if ( stage.classList.contains( 'e-activated' ) ) { waitMo.disconnect(); settle(); }
			} );
			waitMo.observe( stage, { attributes: true, attributeFilter: [ 'class' ] } );
			// If Elementor never gets going the tabs are dead anyway; at least show the page.
			setTimeout( function () { waitMo.disconnect(); settle(); }, 6000 );
		} else {
			settle();
		}

		var mo = new MutationObserver( function ( mutations ) {
			if ( ! settled ) { return; }
			if ( ! mutations.some( function ( m ) { return m.attributeName === 'aria-selected'; } ) ) { return; }
			var idx = activeIndex();
			if ( idx === current ) { return; }
			show( idx );
			if ( api.onChange ) { api.onChange( perPanel[ idx ].chapters ); }
		} );
		titles.forEach( function ( t ) { mo.observe( t, { attributes: true } ); } );

		return { chapters: perPanel[ current ].chapters, tabs: api };
	}

	ready( function () {
		startKey = layoutKey();

		var wrapper = document.querySelector( '.elementor[data-elementor-type="wp-page"]' );
		if ( ! wrapper ) { return; }

		// Read here, before the page is changed: reading the scroll offset
		// makes the browser bring style and layout up to date, and doing
		// that after snapping is switched on but before the first chapter
		// is marked active would compute the "offset 22px, transparent"
		// style first and then animate away from it (see where this is used).
		var openedNearTop = window.pageYOffset < window.innerHeight / 2;

		/* ---------- reserve each lazy image's real shape ----------
		   Images below the fold (and the off-screen cards of a swipe row)
		   start life as a 1x1 transparent placeholder. WordPress gives every
		   <img> width/height attributes, which browsers turn into
		   "aspect-ratio: auto W / H" - but "auto" means "use the image's own
		   shape if it has one", and a loaded 1x1 gif has one: a square. So
		   until its real photo arrives, a 574x320 card photo sits in a
		   square box as wide as the card (295px tall instead of 164), and
		   every card in its row is stretched to match - the Robotics row
		   was 130px too tall, the Education cards 70px, until you swiped to
		   them, and then the row shrank under your thumb.

		   While an image is still a placeholder it is given its true shape
		   from those same attributes, explicitly (no "auto"); the moment the
		   real image has loaded this is removed and the page's own CSS
		   decides again, exactly as before. */
		Array.prototype.forEach.call( wrapper.querySelectorAll( 'img[width][height]' ), function ( img ) {
			if ( ( img.getAttribute( 'src' ) || '' ).indexOf( 'data:' ) !== 0 ) { return; }
			var iw = parseFloat( img.getAttribute( 'width' ) ), ih = parseFloat( img.getAttribute( 'height' ) );
			if ( ! iw || ! ih ) { return; }
			img.style.aspectRatio = iw + ' / ' + ih;
			img.addEventListener( 'load', function onLoad() {
				if ( ( img.getAttribute( 'src' ) || '' ).indexOf( 'data:' ) === 0 ) { return; } // still the placeholder
				img.style.removeProperty( 'aspect-ratio' );
				img.removeEventListener( 'load', onLoad );
			} );
		} );

		/* ---------- group the sections into chapters ---------- */

		// Spacer / divider sections that chaptering makes redundant (see
		// PAGES above): hidden by class, not removed, so the page's own
		// stored content is untouched and un-chaptering restores it.
		CONFIG.drop.forEach( function ( id ) {
			var el = wrapper.querySelector( ':scope > [data-id="' + id + '"]' );
			if ( el ) { el.classList.add( 'ch-drop' ); }
		} );

		var chapters = [];
		var projectTabs = null; // My Projects only: { onChange: fn( chapterList ) }
		if ( PROJECT_PAGE ) {
			var built = buildProjectChapters( wrapper );
			if ( ! built ) { return; }
			chapters = built.chapters;
			projectTabs = built.tabs;
		}
		( PROJECT_PAGE ? [] : MAP ).forEach( function ( def ) {
			var els = [];
			def.sections.forEach( function ( id ) {
				// Direct top-level section first (the common case); falls
				// back to a nested search for ids split out of a shared
				// parent (mobile's Programming/Electrical, see MAP above).
				var el = wrapper.querySelector( ':scope > [data-id="' + id + '"]' ) ||
					wrapper.querySelector( '[data-id="' + id + '"]' );
				if ( el ) { els.push( el ); }
			} );
			if ( ! els.length ) { return; }

			// Insertion point: always a direct child of wrapper, even when
			// els[0] itself is nested deeper (mobile's dddc274/8bd69ab,
			// split out of their shared parent section) - found by walking
			// up from els[0] until its own parent is wrapper. Using
			// els[0].parentNode directly would insert the new chapter at
			// whatever nesting depth els[0] happened to start at, leaving
			// it trapped inside the section it was just pulled out of
			// instead of landing as a proper top-level chapter alongside
			// the others.
			var topLevelRef = els[ 0 ];
			while ( topLevelRef.parentNode !== wrapper ) {
				topLevelRef = topLevelRef.parentNode;
			}

			var ch = document.createElement( 'section' );
			ch.className = 'ch';
			ch.setAttribute( 'data-ch', def.key );
			ch.setAttribute( 'aria-label', def.label );
			wrapper.insertBefore( ch, topLevelRef );
			els.forEach( function ( el ) { ch.appendChild( el ); } );

			chapters.push( { el: ch, def: def } );
		} );

		// A top-level section that had every one of its own children
		// individually claimed above (0c16ab7, once dddc274 and 8bd69ab are
		// both pulled out on mobile) is left behind at its original spot in
		// the page rather than being moved itself - not literally childless
		// (Elementor wraps its contents in its own .e-con-inner, which is
		// still there even once everything inside it is gone), so checking
		// for an actual Elementor element rather than zero children is what
		// catches it. Removed so it doesn't sit there as a blank gap.
		//
		// Array.prototype.slice first: wrapper.children is a live
		// HTMLCollection, and removing an element from it mid-iteration
		// shifts every later index down by one, which skips whatever next
		// element just slid into the index forEach already consumed.
		// Snapshotting it as a plain array up front sidesteps that.
		if ( ! PROJECT_PAGE ) {
			Array.prototype.slice.call( wrapper.children ).forEach( function ( el ) {
				if ( el.classList.contains( 'ch' ) ) { return; }
				if ( ! el.querySelector( '[data-element_type]' ) ) { el.remove(); }
			} );
		}

		// A project listing can be a single chapter (Mechanical has one
		// list and no emphases) - still laid out as a chapter, just with
		// nothing to step between.
		if ( chapters.length < ( PROJECT_PAGE ? 1 : 2 ) ) { return; }

		// Project listings flag first/last per tab panel when they are built.
		if ( ! PROJECT_PAGE ) { flagEnds( chapters ); }

		/* ---------- snap geometry ----------
		   The first chapter has to share its screen with the site header and
		   the last with the footer, otherwise the header would be scrolled
		   off by the very first snap and the footer would sit past the final
		   snap position where mandatory snapping cannot reach it. Both are
		   measured rather than hard-coded because the admin bar adds 32px for
		   logged-in users and the header is a different height on phones. */
		var root = document.documentElement;

		function measure() {
			// Clamped at zero because on phones the header deliberately
			// overlaps the content that follows it (the hero carries its own
			// padding to clear it), which puts the wrapper's top above the
			// document origin - a negative offset here would make the first
			// chapter taller than the screen rather than shorter.
			var top = Math.round( wrapper.getBoundingClientRect().top + window.pageYOffset );
			if ( top < 0 ) { top = 0; }
			var footer = document.querySelector( '.elementor-location-footer' );
			var bot = footer ? Math.round( footer.getBoundingClientRect().height ) : 0;
			root.style.setProperty( '--ch-top', top + 'px' );
			root.style.setProperty( '--ch-bot', bot + 'px' );
		}
		measure();

		var rt;
		window.addEventListener( 'resize', function () {
			clearTimeout( rt );
			rt = setTimeout( measure, 150 );
		}, { passive: true } );

		/* The header and footer keep changing height after this first
		   measurement: the header's title and menu are laid out with a
		   fallback font and re-wrap once the web font arrives (at tablet
		   widths that is 94px -> 148px), and late-loading CSS does the same.
		   Measured once at DOMContentLoaded, --ch-top could be left stale for
		   the whole visit - the hero chapter then came out the wrong height
		   and its snap position landed that far down the page, parking the
		   top of the page with the header partly scrolled off (observed: 54px
		   at 820px wide, on some loads and not others). So it is measured
		   again whenever either of them changes size, and when fonts and the
		   page finish loading. measure() only writes two custom properties
		   and nothing it changes can resize the header or footer, so these
		   cannot feed back into each other. */
		var mf;
		function remeasure() {
			window.cancelAnimationFrame( mf );
			mf = window.requestAnimationFrame( measure );
		}
		window.addEventListener( 'load', remeasure );
		if ( document.fonts && document.fonts.ready ) { document.fonts.ready.then( remeasure ); }
		if ( window.ResizeObserver ) {
			var ro = new ResizeObserver( remeasure );
			var siteHeader = document.querySelector( '.elementor-location-header' );
			var siteFooter = document.querySelector( '.elementor-location-footer' );
			if ( siteHeader ) { ro.observe( siteHeader ); }
			if ( siteFooter ) { ro.observe( siteFooter ); }
		}

		/* Snapping is switched on only once the chapters exist, so a browser
		   that never ran this file never gets a snap container either. */
		root.classList.add( 'ch-on' );

		/* ---------- chapter rail ----------
		   Built by mount() below, so it can be rebuilt: My Projects swaps
		   its set of chapters when the visitor changes tab. */

		var nav = null;
		var io = null;

		/* ---------- active chapter ----------
		   Keyed off whichever chapter covers the middle of the viewport, so
		   the rail changes exactly when the chapter you are reading changes,
		   rather than when its top edge happens to cross a threshold. */
		function activate( i ) {
			// Immediate neighbours get .ch-near - chapters.css spends
			// opacity/transform transitions only on the active chapter
			// plus these, which is every chapter that can possibly be visible
			// at once during a one-screen-at-a-time snap scroll, and
			// skips it on the (usually five) chapters nowhere near the
			// viewport.
			chapters.forEach( function ( x, j ) {
				var active = j === i;
				var near = Math.abs( j - i ) === 1;
				x.el.classList.toggle( 'ch-active', active );
				x.el.classList.toggle( 'ch-near', near );
				// Which way each inactive chapter rises/falls from, kept
				// in sync with whichever chapter the scroll just made
				// active: chapters below it can only have been reached by
				// scrolling down, so they settle by rising up from below;
				// chapters above it can only have been reached by
				// scrolling up, so they settle by falling from above.
				// Recomputed against the new active index every time it
				// changes, so this always matches the scroll that just
				// happened rather than tracking raw scroll velocity.
				x.el.classList.toggle( 'ch-from-below', j > i );
				x.el.classList.toggle( 'ch-from-above', j < i );
				x.dot.classList.toggle( 'is-active', active );
				if ( active ) { x.dot.setAttribute( 'aria-current', 'true' ); }
				else { x.dot.removeAttribute( 'aria-current' ); }
			} );
			activeIndex = i;
			updateHint( i );
		}

		/* ---------- "Scroll for more ..." cue ----------
		   One small pill at the bottom centre of the screen, worded for what
		   comes next ("Scroll for more projects", "Scroll for education"...);
		   the wording is each chapter's `hint`. There is none on the last
		   chapter - its next stop is the footer - and none on the hero, which
		   has its own mouse cue. It is a fixed overlay, not part of any
		   chapter, so it takes no room from the layouts that were fitted to
		   the screen; and so it never covers anything, it is shown only when
		   the chapter's content ends clear of its spot (a chapter that runs
		   on past the bottom of the screen, or fills it, simply has no cue -
		   there is plainly more to scroll to). It appears a moment after the
		   chapter has crossfaded in, and fades when the chapter changes. */
		var hintEl = null;
		var hintTimer = null;
		var activeIndex = 0;

		/** True when nothing in the chapter is under the cue's actual footprint (the pill's own rectangle, with a little air). */
		function hintClear( ch ) {
			if ( window.innerHeight <= 480 ) { return false; } // the rail goes at this height too
			var p = hintEl.getBoundingClientRect();
			// Only things people read or press block it: text, buttons, inputs,
			// and inline links. A photo, a card's box or a block-level link that
			// is a whole card can sit under the translucent pill - it is a glass
			// pill, and reads over the corner of a picture.
			var nodes = ch.querySelectorAll( 'h1,h2,h3,h4,h5,h6,p,a,li,button,input,textarea,.elementor-button' );
			for ( var k = 0; k < nodes.length; k++ ) {
				if ( nodes[ k ].tagName === 'A' && getComputedStyle( nodes[ k ] ).display.indexOf( 'inline' ) !== 0 ) { continue; }
				var r = nodes[ k ].getBoundingClientRect();
				if ( r.width < 2 || r.height < 2 ) { continue; }
				if ( r.left < p.right + 10 && r.right > p.left - 10 && r.top < p.bottom + 4 && r.bottom > p.top - 3 ) { return false; }
			}
			return true;
		}

		function updateHint( i ) {
			clearTimeout( hintTimer );
			if ( ! hintEl ) {
				hintEl = document.createElement( 'div' );
				hintEl.className = 'ch-hint';
				hintEl.setAttribute( 'aria-hidden', 'true' );
				hintEl.innerHTML = '<span class="ch-hint__text"></span><svg viewBox="0 0 16 16" width="13" height="13" focusable="false"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
				document.body.appendChild( hintEl );
			}
			hintEl.classList.remove( 'is-on' );
			var c = chapters[ i ];
			if ( ! c || ! c.def.hint || i >= chapters.length - 1 ) { return; }
			hintTimer = setTimeout( function () {
				if ( i !== activeIndex ) { return; }
				hintEl.querySelector( '.ch-hint__text' ).textContent = ( window.innerWidth < 768 && c.def.hintM ) ? c.def.hintM : c.def.hint; // laid out (invisible) so it can be measured
				if ( hintClear( c.el ) ) { hintEl.classList.add( 'is-on' ); }
			}, 750 );
		}
		var hintResize;
		window.addEventListener( 'resize', function () {
			clearTimeout( hintResize );
			hintResize = setTimeout( function () { updateHint( activeIndex ); }, 400 );
		}, { passive: true } );

		function onIntersect( entries ) {
			entries.forEach( function ( entry ) {
				var i = chapters.findIndex( function ( x ) { return x.el === entry.target; } );
				if ( i === -1 || ! entry.isIntersecting ) { return; }
				activate( i );
			} );
		}

		/** Puts `list` on the rail and under the observer, replacing whatever was there. */
		function mount( list ) {
			if ( io ) { io.disconnect(); }
			if ( nav ) { nav.remove(); nav = null; }
			chapters = list;

			nav = document.createElement( 'nav' );
			nav.className = 'chnav';
			nav.setAttribute( 'aria-label', 'Page sections' );
			chapters.forEach( function ( c, i ) {
				var btn = document.createElement( 'button' );
				btn.type = 'button';
				btn.className = 'chnav__dot';
				btn.setAttribute( 'data-i', i );
				btn.setAttribute( 'aria-label', c.def.label );
				btn.innerHTML = '<span class="chnav__label">' + c.def.label + '</span>';
				btn.addEventListener( 'click', function () {
					c.el.scrollIntoView( { behavior: 'smooth', block: 'start' } );
				} );
				nav.appendChild( btn );
				c.dot = btn;
			} );
			// One chapter has nothing to step between.
			if ( chapters.length > 1 ) { document.body.appendChild( nav ); }

			io = new IntersectionObserver( onIntersect, { rootMargin: '-50% 0px -50% 0px', threshold: 0 } );
			chapters.forEach( function ( c ) { io.observe( c.el ); } );
		}

		mount( chapters );

		/* ---------- project listings: fit each chapter to its screen ----------
		   One emphasis is one chapter, and the owner wants no chapter that
		   takes two stops. What gives is the cards' images: each chapter's
		   --cp-img (the image height, used by chapters.css) is the largest
		   that leaves everything else in the chapter on one screen, between a
		   floor and the card's natural 3:2 shape. Text, headings and spacing
		   are measured, not guessed, so a longer description or a different
		   screen is handled the same way. */
		var CP_IMG_MIN = 56;
		var CP_MARGIN = 0; // air is the chapter's own padding now (chapters.css), including the room the scroll cue needs

		function fitProject( list ) {
			var top = parseFloat( root.style.getPropertyValue( '--ch-top' ) ) || 0;
			list.forEach( function ( c ) {
				var ch = c.el;
				var frame = ch.querySelector( '.elementor-post__thumbnail' );
				if ( ! frame ) { return; }
				var w = frame.getBoundingClientRect().width;
				if ( ! w ) { return; }
				var max = Math.round( w / 1.5 );
				// Five cards on desktop are two rows (3 + 2, chapters.css) and
				// deliberately more than a screen: the pictures keep their 3:2.
				if ( ch.getAttribute( 'data-cols' ) === '5' && window.innerWidth >= 1100 ) {
					ch.style.setProperty( '--cp-img', max + 'px' );
					return;
				}
				var avail = window.innerHeight - ( ch.classList.contains( 'ch--first' ) ? top : 0 ) - CP_MARGIN;
				ch.style.minHeight = '0px';
				ch.style.setProperty( '--cp-img', max + 'px' );
				var natural = ch.getBoundingClientRect().height;
				ch.style.removeProperty( 'min-height' );
				var img = Math.max( CP_IMG_MIN, Math.min( max, max - ( natural - avail ) ) );
				ch.style.setProperty( '--cp-img', Math.floor( img ) + 'px' );
			} );
			// media-fill chooses cover/contain from each frame's shape: tell
			// it the shapes changed (the flag keeps this script's own resize
			// listener below from answering the event it just sent).
			firing = true;
			window.dispatchEvent( new Event( 'resize' ) );
			firing = false;
		}

		var firing = false;
		if ( PROJECT_PAGE ) {
			var fitTimer;
			var refit = function () { fitProject( chapters ); };
			var refitSoon = function () { clearTimeout( fitTimer ); fitTimer = setTimeout( refit, 120 ); };
			refit();
			window.addEventListener( 'load', refitSoon );
			window.addEventListener( 'resize', function () {
				if ( firing ) { return; }
				clearTimeout( fitTimer );
				fitTimer = setTimeout( refit, 250 );
			}, { passive: true } );
			if ( document.fonts && document.fonts.ready ) { document.fonts.ready.then( refitSoon ); }
			// The cards' pictures are sized by refit() from the measured text, which
			// is only right once the fonts and the page have loaded; before that they
			// were visibly resized (everything below jumping). The card rows stay
			// hidden until that first accurate fit (chapters.css; a CSS failsafe
			// shows them after 3.5s regardless), then fade in.
			var fitted = false;
			var markFitted = function () {
				if ( fitted ) { return; }
				fitted = true;
				refit();
				root.classList.add( 'ch-fitted' );
			};
			Promise.all( [
				new Promise( function ( ok ) { if ( document.readyState === 'complete' ) { ok(); } else { window.addEventListener( 'load', ok ); } } ),
				( document.fonts && document.fonts.ready ) ? document.fonts.ready : Promise.resolve()
			] ).then( function () { setTimeout( markFitted, 60 ); } );
			if ( window.ResizeObserver ) {
				var hdr = document.querySelector( '.elementor-location-header' );
				if ( hdr ) { new ResizeObserver( refitSoon ).observe( hdr ); }
			}
			if ( projectTabs ) {
				projectTabs.onChange = function ( list ) {
					mount( list );
					refit();
					// The title, tab row and chips were just moved into the new tab's
						// first chapter and the page re-laid out. With snapping on, the
						// browser then settles on whichever chapter edge is nearest the old
						// scroll position - for Robotics that was its second chapter
						// (Drones), so clicking the tab dropped the visitor a screen down.
						// The tab row lives at the top of the first chapter, so that is
						// where they should be left.
						var topOfTabs = function () {
							list[ 0 ].el.scrollIntoView( { behavior: 'instant', block: 'start' } );
						};
						topOfTabs();
						requestAnimationFrame( function () { requestAnimationFrame( topOfTabs ); } );
						setTimeout( topOfTabs, 350 );
						activate( 0 );
				};
			}
		}

		/* The first chapter is active from the very first frame when the
		   page opens at the top (the usual case), instead of waiting for the
		   observer above to report in.

		   Until a chapter is marked active it sits offset 22px down and
		   transparent, waiting to rise into place - and the observer's first
		   report only arrives after the page has finished loading, seconds
		   later on a slow connection. In that gap the page's first snap
		   point was 22px down: the snapper took the page there (the header
		   arrived with its top 22px cut off; the home page showed it for a
		   moment before correcting itself, and a first chapter taller than
		   the screen, like Skills & Education's, simply stayed there,
		   because a position inside a tall snap area is valid wherever it
		   lands), and until then the visitor saw an empty page.

		   Marking it here, in the same task that switched snapping on, means
		   the chapter's first computed style is already the settled one - no
		   offset, no fade to wait for. Skipped for a page opened part-way
		   down (an anchor link, a restored scroll position): there the
		   observer is the one that knows which chapter is in view, and its
		   fade is the right thing to see. */
		if ( openedNearTop ) { activate( 0 ); }

		/* (The scroll-driven background used to have its fallback here; it is
		   now site-wide, so it lives with the backdrop: site-backdrop/backdrop.js.) */
	} );
})();
