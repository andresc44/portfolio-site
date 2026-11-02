/**
 * Skills & Tools, mobile: a tap-to-filter chip bar instead of a single
 * ~41-pill wall of buttons. Builds a row of category chips above the
 * existing category blocks, then shows only the selected one at a time -
 * the blocks and their pills are Elementor's own markup, untouched; this
 * only toggles which ones are visible, so every link/image/count stays
 * exactly as authored.
 */
(function () {
	'use strict';

	var CATEGORY_IDS = [
		'e1115f5', // Languages & Programming
		'7b6cb9e', // Frameworks & Libraries
		'0b96bbd', // Robotics & AI Techniques
		'a85d83e', // Simulation, Design & CAD Tools
		'27199d5', // Hardware & Embedded Systems
		'a41d736'  // Operating Systems & Cloud Platforms
	];

	function init() {
		var categories = CATEGORY_IDS
			.map(function (id) {
				var el = document.querySelector('.elementor-element-' + id);
				if (!el) { return null; }
				var heading = el.querySelector('.elementor-heading-title');
				return heading ? { id: id, el: el, label: heading.textContent.trim() } : null;
			})
			.filter(Boolean);

		if (categories.length < 2) { return; } // nothing to filter

		var bar = document.createElement('div');
		bar.className = 'sf-bar';

		categories.forEach(function (cat, i) {
			cat.el.classList.add('sf-category');

			var chip = document.createElement('button');
			chip.type = 'button';
			chip.className = 'sf-chip';
			chip.textContent = cat.label;
			chip.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
			chip.addEventListener('click', function () {
				if (chip.classList.contains('sf-chip--active')) { return; }
				categories.forEach(function (other, j) {
					var isMatch = j === i;
					other.el.classList.toggle('sf-category--hidden', !isMatch);
				});
				bar.querySelectorAll('.sf-chip').forEach(function (c) {
					c.classList.remove('sf-chip--active');
					c.setAttribute('aria-pressed', 'false');
				});
				chip.classList.add('sf-chip--active');
				chip.setAttribute('aria-pressed', 'true');
			});

			if (i === 0) { chip.classList.add('sf-chip--active'); }
			bar.appendChild(chip);

			if (i > 0) { cat.el.classList.add('sf-category--hidden'); }
		});

		categories[0].el.parentNode.insertBefore(bar, categories[0].el);

		/* Phone layout: one steady panel, then a last resort.

		   1. Every category's box is given the height of the TALLEST category,
		      so choosing a chip only changes what is inside the box - the title,
		      the chips and the box itself stay exactly where they are, which is
		      what lets chapters.css centre the whole group on the screen and
		      space it out (it used to be stuck to the top, because a box that
		      changed height on every tap would have moved everything else).
		   2. If that does not fit the screen (a very short phone), the equal
		      heights are dropped and the selected box is instead given the room
		      that is left and scrolls inside the chapter, rather than the
		      chapter running on into a second stop (chapters.css sizes things so
		      that every category fits one screen from about 640px tall up).
		   40px: the page-dots pill along the bottom edge. */
		var phone = window.matchMedia ? window.matchMedia( '(max-width: 767px)' ) : { matches: false };
		function visibleBox() {
			var box = null;
			categories.forEach( function ( c ) { if ( ! c.el.classList.contains( 'sf-category--hidden' ) ) { box = c.el; } } );
			return box;
		}
		function layout() {
			categories.forEach( function ( c ) {
				c.el.style.marginBottom = '';
				c.el.style.maxHeight = '';
				c.el.style.overflowY = '';
			} );
			if ( ! phone.matches ) { return; }

			// 1. the tallest category's natural height (each shown in turn, synchronously: nothing is painted in between)
			var was = categories.map( function ( c ) { return c.el.classList.contains( 'sf-category--hidden' ); } );
			var tallest = 0, heights = [];
			categories.forEach( function ( c, i ) {
				categories.forEach( function ( o, j ) { o.el.classList.toggle( 'sf-category--hidden', j !== i ); } );
				heights[ i ] = c.el.getBoundingClientRect().height; tallest = Math.max( tallest, heights[ i ] );
			} );
			categories.forEach( function ( o, j ) { o.el.classList.toggle( 'sf-category--hidden', was[ j ] ); } );
			if ( ! tallest ) { return; }
			/* the box hugs its own tags; the difference to the tallest category is left BELOW it */ categories.forEach( function ( c, i ) { c.el.style.marginBottom = Math.ceil( tallest - heights[ i ] ) + 'px'; } );

			// 2. does the equal-height box still fit above the dots pill?
			var box = visibleBox();
			if ( ! box ) { return; }
			var r = box.getBoundingClientRect();
			if ( r.bottom + window.pageYOffset + parseFloat( box.style.marginBottom || 0 ) <= window.innerHeight - 40 ) { return; }
			categories.forEach( function ( c ) { c.el.style.marginBottom = ''; } );
			var top = box.getBoundingClientRect().top + window.pageYOffset;
			var room = window.innerHeight - 40 - top;
			if ( room > 120 && box.scrollHeight > room + 1 ) {
				box.style.maxHeight = Math.floor( room ) + 'px';
				box.style.overflowY = 'auto'; // default overscroll: at its end a further swipe moves on to the next chapter
			}
		}
		var fitTimer;
		function fitSoon() { clearTimeout( fitTimer ); fitTimer = setTimeout( layout, 60 ); }
		bar.addEventListener( 'click', fitSoon ); // (only matters in the scroll fallback, where the limit moves to the new box)
		window.addEventListener( 'resize', fitSoon, { passive: true } );
		window.addEventListener( 'load', fitSoon );
		if ( document.fonts && document.fonts.ready ) { document.fonts.ready.then( fitSoon ); }
		fitSoon();
	}

	if (document.readyState !== 'loading') { init(); }
	else { document.addEventListener('DOMContentLoaded', init); }
})();
