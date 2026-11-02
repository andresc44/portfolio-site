<?php
/**
 * Tell the browser how wide fixed-size pictures really are.
 *
 * Elementor pictures come in several sizes (a `srcset`) and the browser picks
 * one using the `sizes` attribute, which WordPress fills in from the chosen
 * file's own width - "(max-width: 768px) 100vw, 768px" for the 768px size: "as
 * wide as the screen on a phone, 768px otherwise". The project cards and the
 * About Me thumbnails are nowhere near that wide, so on any screen with a pixel
 * density above 1 the browser asked for a far bigger file than it displayed and
 * took the original (about 3x the pixels needed; the About Me page pulled
 * 4.5MB of pictures on a 2x laptop against 1.5MB on a 1x screen).
 *
 * This states the real widths, measured at 9-17 viewport widths from 320 to
 * 1920px, and rounded UP, so a picture is never given less than it needs: the
 * browser still chooses the smallest file that is big enough for the width
 * stated here. Limited to the widgets named below while they render; no other
 * image is touched. If a layout is ever made wider than these figures, widen
 * them here.
 *
 * 1. Project cards (every "Posts" widget: home, My Projects, category pages):
 *      phones <=767px      cards are 74-78% of the screen     -> 80vw
 *      tablets 768-1099    at most 423px (home), 378 elsewhere -> 430px
 *      desktops >=1100     at most 378px                       -> 380px
 *
 * 2. About Me thumbnails, by Elementor widget ID. The desktop and phone layouts
 *    are separate widgets (the other set is hidden), so each has its own figure:
 *      desktop collages    169-267px wide (Scuba/Fitness 184-282)   -> 340px (see below)
 *      phone Backpacking   80% of the screen, 424px at most         -> 81vw, 430px from 528px up
 *      phone Hobbies       75-78% of the screen, 499px at most      -> 79vw, 500px from 640px up
 *    The two large photos (Iceland, graduation portrait) are deliberately left
 *    alone: they are single hero images, the Iceland one fills its column.
 */

const PORTFOLIO_CARD_SIZES = '(max-width: 767px) 80vw, (max-width: 1099px) 430px, 380px';

function portfolio_tile_sizes() {
	// Real width 169-282px. 340px is deliberately a little over: it is bigger than the
	// 300px thumbnail, so a 1x screen keeps using the 768px file exactly as before (the
	// 300px one was visibly softer next to it), while 2x screens take 768px instead of
	// the original.
	$desktop   = '340px';
	$backpack  = '(max-width: 527px) 81vw, 430px';
	$hobbies   = '(max-width: 639px) 79vw, 500px';
	return array(
		// Desktop collages.
		'682fe08' => $desktop, '5b96fbf' => $desktop, 'e867d63' => $desktop, '0509df0' => $desktop, '21ba4aa' => $desktop,
		'7894a6d' => $desktop, '3de0004' => $desktop,
		// Phone swipe rows.
		'bpcaroi1' => $backpack, 'bpcaroi2' => $backpack, 'bpcaroi3' => $backpack, 'bpcaroi4' => $backpack, 'bpcaroi5' => $backpack,
		'hbcaroi1' => $hobbies, 'hbcaroi2' => $hobbies,
	);
}

add_action( 'elementor/widget/before_render_content', function ( $widget ) {
	if ( ! is_object( $widget ) ) {
		return;
	}
	$name = $widget->get_name();
	if ( 'posts' === $name ) {
		$GLOBALS['portfolio_image_sizes'] = PORTFOLIO_CARD_SIZES;
	} elseif ( 'image' === $name && is_page( 'about-me' ) ) {
		$tiles = portfolio_tile_sizes();
		if ( isset( $tiles[ $widget->get_id() ] ) ) {
			$GLOBALS['portfolio_image_sizes'] = $tiles[ $widget->get_id() ];
		}
	}
} );

add_filter( 'elementor/widget/render_content', function ( $content ) {
	unset( $GLOBALS['portfolio_image_sizes'] );
	return $content;
} );

add_filter( 'wp_calculate_image_sizes', function ( $sizes ) {
	return empty( $GLOBALS['portfolio_image_sizes'] ) ? $sizes : $GLOBALS['portfolio_image_sizes'];
} );
