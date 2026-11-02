(function () {
	'use strict';

	var SVG_NS = 'http://www.w3.org/2000/svg';

	/* The picture's own name, without the "p2709-" project-id prefix the files
	   carry on the server and without its extension. */
	function baseName( url ) {
		var name = url.split( '#' )[ 0 ].split( '?' )[ 0 ].split( '/' ).pop() || 'image';
		try { name = decodeURIComponent( name ); } catch ( e ) { /* keep the raw name */ }
		return name.replace( /^p\d+-/, '' ).replace( /\.[a-z0-9]+$/i, '' ) || 'image';
	}

	function save( href, filename ) {
		var a = document.createElement( 'a' );
		a.href = href;
		a.download = filename;
		/* The throwaway link is clicked from inside the viewer's toolbar when
		   there is one: a click on the page behind the viewer reads as "clicked
		   outside" to Elementor's lightbox, which closes it - and a download
		   should leave the viewer open. */
		var host = document.querySelector( '.elementor-lightbox .elementor-slideshow__header' ) || document.body;
		a.style.display = 'none';
		host.appendChild( a );
		a.click();
		host.removeChild( a );
	}

	/* The file as it is on the server - for animated GIFs (a PNG would keep
	   one frame) and as the fallback if the picture can't be converted. */
	function saveOriginal( url ) {
		save( url, baseName( url ) + ( url.split( '?' )[ 0 ].match( /\.[a-z0-9]+$/i ) || [ '' ] )[ 0 ] );
	}

	/* Fetch the picture, redraw it on a canvas, hand over the PNG. */
	window.portfolioDownloadPng = function ( url ) {
		// A GIF (a PNG would keep one frame) and a PNG original (already the
		// lossless file: nothing to convert) are handed over exactly as they are.
		if ( /\.(?:gif|png)(?:$|[?#])/i.test( url ) ) {
			saveOriginal( url );
			return;
		}
		fetch( url, { credentials: 'same-origin' } )
			.then( function ( r ) { if ( ! r.ok ) { throw new Error( 'fetch' ); } return r.blob(); } )
			.then( function ( blob ) { return createImageBitmap( blob ); } )
			.then( function ( bmp ) {
				var canvas = document.createElement( 'canvas' );
				canvas.width = bmp.width;
				canvas.height = bmp.height;
				canvas.getContext( '2d' ).drawImage( bmp, 0, 0 );
				return new Promise( function ( resolve ) { canvas.toBlob( resolve, 'image/png' ); } );
			} )
			.then( function ( png ) {
				if ( ! png ) { throw new Error( 'encode' ); }
				var href = URL.createObjectURL( png );
				save( href, baseName( url ) + '.png' );
				setTimeout( function () { URL.revokeObjectURL( href ); }, 4000 );
			} )
			.catch( function () { saveOriginal( url ); } );
	};

	/* ---- Elementor lightbox: add the Download button next to Zoom ---- */

	function addButton( header ) {
		if ( header.querySelector( '.pf-lb-download' ) ) { return; }
		var svg = document.createElementNS( SVG_NS, 'svg' );
		svg.setAttribute( 'class', 'e-font-icon-svg e-eicon-download-bold pf-lb-download' );
		svg.setAttribute( 'role', 'button' );
		svg.setAttribute( 'tabindex', '0' );
		svg.setAttribute( 'aria-label', 'Download as PNG' );
		/* Drawn inline rather than <use>d from Elementor's icon sprite: the
		   sprite only holds the icons a page has asked for so far, and nothing
		   asks for this one once the Share menu is hidden. */
		svg.setAttribute( 'viewBox', '0 0 24 24' );
		svg.setAttribute( 'fill', 'currentColor' );
		var path = document.createElementNS( SVG_NS, 'path' );
		path.setAttribute( 'd', 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z' );
		svg.appendChild( path );
		var title = document.createElementNS( SVG_NS, 'title' );
		title.textContent = 'Download as PNG';
		svg.appendChild( title );
		/* The header lays its icons out right-to-left, so putting the button
		   ahead of Zoom in the markup shows it after Zoom: magnifier, download,
		   then the close button at the far corner. */
		var anchor = header.querySelector( '.e-eicon-zoom-in-bold' );
		if ( anchor ) {
			header.insertBefore( svg, anchor );
		} else {
			header.appendChild( svg );
		}
	}

	function download( btn ) {
		var box = btn.closest( '.elementor-lightbox' );
		var img = box && box.querySelector( '.swiper-slide-active img.elementor-lightbox-image' );
		if ( img ) { window.portfolioDownloadPng( img.currentSrc || img.src ); }
	}

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest && e.target.closest( '.pf-lb-download' );
		if ( btn ) { e.preventDefault(); download( btn ); }
	} );
	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key !== 'Enter' && e.key !== ' ' ) { return; }
		var btn = e.target.closest && e.target.closest( '.pf-lb-download' );
		if ( btn ) { e.preventDefault(); download( btn ); }
	} );

	/* The lightbox is built when a picture is first clicked, so watch for it. */
	var queued = false;
	function scan() {
		queued = false;
		var headers = document.querySelectorAll( '.elementor-slideshow__header' );
		for ( var i = 0; i < headers.length; i++ ) { addButton( headers[ i ] ); }
	}
	new MutationObserver( function () {
		if ( ! queued ) { queued = true; requestAnimationFrame( scan ); }
	} ).observe( document.body, { childList: true, subtree: true } );
})();
