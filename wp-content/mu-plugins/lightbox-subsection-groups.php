<?php
/**
 * Group each subsection's media into its own lightbox carousel.
 *
 * Elementor only emits data-elementor-lightbox-slideshow for gallery widgets -
 * the single image widget calls add_lightbox_data_attributes() without a group
 * id (see includes/widgets/image.php), so every image opens on its own with no
 * way to move to the next one. Adding the attribute is enough for images: the
 * click is handled by frontend.min.js's shared, document-level lightbox
 * listener (getDefaultSettings().selectors.links = "a, [data-elementor-lightbox]"),
 * which reads it and calls openSlideshow().
 *
 * Videos need one extra step. Elementor's Video widget wraps its trigger in a
 * <div data-elementor-lightbox='{"type":"video",...}'> and binds its OWN
 * dedicated click handler to that JSON attribute, which opens a standalone
 * video dialog directly - it never reaches the shared listener above, so
 * merely tagging the div with the slideshow group has no effect (confirmed:
 * clicking it opened the single-video dialog with no slide counter, groups or
 * not). openSlideshow() itself, though, explicitly supports a video slide via
 * a `slide.video` field sourced from `data-elementor-lightbox-video` on an
 * <a> tag - visible in isLightboxLink()'s own exception for it. That is the
 * supported way to put a video inside an image slideshow, so each of the
 * three video triggers here is rewritten from that Video-widget div into a
 * plain <a> using it, which removes the Video widget's own JSON attribute
 * entirely and lets the shared listener + openSlideshow() own the click.
 */

add_filter(
	'elementor/widget/render_content',
	function ( $html, $widget ) {
		static $groups = array(
			// About Me
			'8fda37e' => 'about-me',     // graduation
			'682fe08' => 'backpacking',  // Europe
			'5b96fbf' => 'backpacking',  // Australia
			'e867d63' => 'backpacking',  // Canada
			'0509df0' => 'backpacking',  // SE Asia
			'21ba4aa' => 'backpacking',  // Colombia
			'7894a6d' => 'hobbies',      // scuba
			'3de0004' => 'hobbies',      // fitness
			'0318ed4' => 'hobbies',      // video
			'ab37020' => 'hobbies',      // video
			'55c3726' => 'hobbies',      // video
			// Skills & Tools
			'3cf4898' => 'education-uoft', // section banner (U of T building) - its own 1-image carousel
			'eaimg001' => 'education',     // Engineers Australia
			'cb57174' => 'education',      // MEng
			'1913896' => 'education',      // BASc
			'3722560' => 'education',      // CSWP
			'036e089' => 'education',      // George Brown
		);

		$id = method_exists( $widget, 'get_id' ) ? $widget->get_id() : '';
		if ( ! isset( $groups[ $id ] ) || ! is_string( $html ) ) {
			return $html;
		}
		$group = $groups[ $id ];

		if ( 'video' === ( method_exists( $widget, 'get_name' ) ? $widget->get_name() : '' ) ) {
			return portfolio_lightbox_video_to_anchor( $html, $group, $id );
		}

		if ( false === stripos( $html, 'data-elementor-open-lightbox' ) ) {
			return $html;
		}

		// Cards whose small thumbnail should expand to a different, full image
		// (widget id => attachment id). The card keeps showing its own picture;
		// only what the lightbox opens changes - both the link and the
		// data-e-action-hash Elementor builds the slide from.
		static $expand = array(
			'1913896' => 3649, // BASc card -> the diploma
			'cb57174' => 3650, // MEng card -> the diploma
		);
		if ( isset( $expand[ $id ] ) ) {
			$big_id  = $expand[ $id ];
			$big_url = wp_get_attachment_url( $big_id );
			if ( $big_url ) {
				$hash = rawurlencode( '#elementor-action:action=lightbox&settings=' . base64_encode( wp_json_encode( array( 'id' => $big_id, 'url' => $big_url ) ) ) );
				$html = preg_replace( '~(<a[^>]*\bhref=")[^"]*(")~i', '${1}' . esc_url( $big_url ) . '${2}', $html, 1 );
				$html = preg_replace( '~(\bdata-e-action-hash=")[^"]*(")~i', '${1}' . $hash . '${2}', $html, 1 );
			}
		}

		return preg_replace_callback(
			'~<a([^>]*\bdata-elementor-open-lightbox\b[^>]*)>~i',
			function ( $m ) use ( $group ) {
				if ( false !== stripos( $m[1], 'data-elementor-lightbox-slideshow' ) ) {
					return $m[0];
				}
				return '<a' . $m[1] . ' data-elementor-lightbox-slideshow="' . esc_attr( $group ) . '">';
			},
			$html
		);
	},
	10,
	2
);

/**
 * Replace the Video widget's <div class="elementor-custom-embed-image-overlay"
 * data-elementor-lightbox='{...}' ...> trigger with a plain <a> carrying
 * data-elementor-lightbox-video (the embed URL, taken from that same JSON so
 * it's byte-identical to what Elementor would have used) plus the slideshow
 * group. Inner content (poster <img>, play-button markup) is kept as-is.
 */
function portfolio_lightbox_video_to_anchor( $html, $group, $widget_id = '' ) {
	// An image slide takes its caption from the attachment (post_title and
	// post_content, per the kit defaults). A video slide has no attachment of
	// its own - the overlay is only a poster frame - so its caption is written
	// onto the anchor here, in the same two data attributes openSlideshow()
	// already reads for images.
	static $captions = array(
		'0318ed4' => array( 'GoPro Adventures', 'Skydiving in Dubai, bungee jumping in Colombia, scuba diving in Indonesia, rafting in Norway, quadding in Bali & Dubai, canyoneering in the Philippines, whale watching in Iceland, and paragliding in Colombia.' ),
		'ab37020' => array( 'In the Gym', 'New best of 140kg for 5 reps.' ),
		'55c3726' => array( 'Salsa Dancing', '' ),
	);
	$start = stripos( $html, 'elementor-custom-embed-image-overlay' );
	if ( false === $start ) {
		return $html;
	}
	$tag_start = strrpos( substr( $html, 0, $start ), '<div' );
	if ( false === $tag_start ) {
		return $html;
	}
	$tag_end = strpos( $html, '>', $start );
	if ( false === $tag_end ) {
		return $html;
	}
	$open_tag = substr( $html, $tag_start, $tag_end - $tag_start + 1 );

	if ( ! preg_match( '~data-elementor-lightbox="([^"]*)"~', $open_tag, $lb ) ) {
		return $html;
	}
	$json = json_decode( html_entity_decode( $lb[1], ENT_QUOTES ), true );
	$video_url = is_array( $json ) ? ( $json['url'] ?? '' ) : '';
	if ( '' === $video_url ) {
		return $html;
	}

	// Depth-count from the opening <div to find its true matching close: the
	// play-button markup inside nests its own <div>, so the first plain
	// </div> encountered belongs to that, not to this wrapper.
	$depth = 0;
	$pos   = $tag_start;
	$len   = strlen( $html );
	$close_start = null;
	$close_end   = null;
	while ( $pos < $len ) {
		$next_open  = stripos( $html, '<div', $pos );
		$next_close = stripos( $html, '</div>', $pos );
		if ( false === $next_close ) {
			break;
		}
		if ( false !== $next_open && $next_open < $next_close ) {
			$depth++;
			$pos = $next_open + 4;
			continue;
		}
		$depth--;
		if ( 0 === $depth ) {
			$close_start = $next_close;
			$close_end   = $next_close + 6;
			break;
		}
		$pos = $next_close + 6;
	}
	if ( null === $close_start ) {
		return $html;
	}

	$poster_href = '';
	if ( preg_match( '~<img[^>]*\bsrc="([^"]*)"~', substr( $html, $tag_end, $close_start - $tag_end ), $img ) ) {
		$poster_href = $img[1];
	}

	$caption = isset( $captions[ $widget_id ] ) ? $captions[ $widget_id ] : null;

	$new_open = '<a href="' . esc_url( $poster_href ) . '" data-elementor-open-lightbox="yes"'
		. ' data-elementor-lightbox-video="' . esc_attr( $video_url ) . '"'
		. ' data-elementor-lightbox-slideshow="' . esc_attr( $group ) . '"'
		. ( $caption
			? ' data-elementor-lightbox-title="' . esc_attr( $caption[0] ) . '"'
				. ' data-elementor-lightbox-description="' . esc_attr( $caption[1] ) . '"'
			: '' )
		. '>';

	return substr( $html, 0, $tag_start )
		. $new_open
		. substr( $html, $tag_end + 1, $close_start - $tag_end - 1 )
		. '</a>'
		. substr( $html, $close_end );
}

/**
 * Make the lightbox footer show a caption on video slides too.
 *
 * Elementor's slide builder writes a slide's caption onto the <img> it creates
 * (data-title / data-description on .elementor-lightbox-image), and
 * updateFooterText() reads it back from exactly that element. Video slides go
 * down a different branch that builds a play button instead of an image, so
 * they have nowhere to carry a caption and the footer renders blank however
 * the source anchor is marked up - confirmed by reading lightbox.bundle.js.
 *
 * So the caption is copied off the anchor onto a hidden stand-in carrying that
 * same class, which Elementor's own footer code then finds. Nothing here
 * overwrites a caption Elementor resolved itself: the footer is only filled
 * when it is empty and the active slide is one of these video slides. If a
 * future Elementor changes these internals this simply stops applying, leaving
 * the blank footer that is there today.
 */
add_action(
	'wp_enqueue_scripts',
	function () {
		wp_register_script( 'portfolio-lightbox-video-captions', '', array(), null, true );
		wp_enqueue_script( 'portfolio-lightbox-video-captions' );
		wp_add_inline_script(
			'portfolio-lightbox-video-captions',
			<<<'JS'
( function () {
	'use strict';

	function captionFor( videoUrl ) {
		var anchors = document.querySelectorAll( 'a[data-elementor-lightbox-video]' );
		for ( var i = 0; i < anchors.length; i++ ) {
			if ( anchors[ i ].getAttribute( 'data-elementor-lightbox-video' ) === videoUrl ) {
				return {
					title: anchors[ i ].getAttribute( 'data-elementor-lightbox-title' ) || '',
					description: anchors[ i ].getAttribute( 'data-elementor-lightbox-description' ) || ''
				};
			}
		}
		return null;
	}

	function decorate( lightbox ) {
		var slides = lightbox.querySelectorAll( '.swiper-slide[data-elementor-slideshow-video]' );
		for ( var i = 0; i < slides.length; i++ ) {
			if ( slides[ i ].querySelector( '.elementor-lightbox-image' ) ) {
				continue;
			}
			var caption = captionFor( slides[ i ].getAttribute( 'data-elementor-slideshow-video' ) );
			if ( ! caption || ( ! caption.title && ! caption.description ) ) {
				continue;
			}
			var carrier = document.createElement( 'span' );
			carrier.className = 'elementor-lightbox-image';
			carrier.style.display = 'none';
			carrier.setAttribute( 'data-title', caption.title );
			carrier.setAttribute( 'data-description', caption.description );
			slides[ i ].appendChild( carrier );
		}
	}

	// Elementor blanks the footer for a video slide, and its own call may land
	// after the slides are decorated, so fill it in - but only when empty, so an
	// image slide's real caption is never touched.
	function fillFooter( lightbox ) {
		var active = lightbox.querySelector( '.swiper-slide-active[data-elementor-slideshow-video]' );
		if ( ! active ) {
			return;
		}
		var carrier = active.querySelector( '.elementor-lightbox-image' );
		if ( ! carrier ) {
			return;
		}
		var title = lightbox.querySelector( '.elementor-slideshow__title' );
		var description = lightbox.querySelector( '.elementor-slideshow__description' );
		if ( title && ! title.textContent ) {
			title.textContent = carrier.getAttribute( 'data-title' ) || '';
		}
		if ( description && ! description.textContent ) {
			description.textContent = carrier.getAttribute( 'data-description' ) || '';
		}
	}

	new MutationObserver( function () {
		var lightbox = document.querySelector( '.elementor-lightbox' );
		if ( ! lightbox ) {
			return;
		}
		decorate( lightbox );
		fillFooter( lightbox );
	} ).observe( document.body, { childList: true, subtree: true } );
}() );
JS
		);
	},
	20
);
