<?php
/**
 * Custom lightweight media gallery for project detail pages.
 *
 * Desktop shows a hero tile + two stacked tiles (like a hotel-booking gallery
 * preview) with a "+N" badge opening a full lightbox; on narrow screens the
 * same markup becomes a native horizontally-swipeable strip via CSS alone
 * (no JS needed for that part). A small vanilla-JS lightbox handles the
 * "view everything" experience: swipe/arrow-key navigation and pinch/
 * double-tap zoom on images. No jQuery, no slider library.
 *
 * Media for each project is read from post meta `_project_gallery`, a JSON
 * array of {type:'image'|'youtube'|'hosted', ...}. See
 * wp-content/mu-plugins/../scratchpad migration script for how that meta
 * was populated from each post's original Elementor image/video widgets.
 *
 * Every item's `src` is stored as an absolute production URL, same as the
 * rest of this site's content. Elementor's own lightbox has the same shape
 * of problem and fixes it in lightbox-image-urls.php; this shortcode is a
 * separate, hand-written system that isn't touched by that filter, so it
 * needs its own copy of the same fix. It stayed invisible until now because
 * every existing project's images already exist on production - test
 * locally with a brand new upload and the lightbox 404s outright, since the
 * live site doesn't have the file yet.
 */
function portfolio_gallery_fix_host( $url ) {
	if ( ! is_string( $url ) || '' === $url || ! function_exists( 'portfolio_internal_hosts' ) ) {
		return $url;
	}
	$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
	if ( '' === $host || ! in_array( $host, portfolio_internal_hosts(), true ) ) {
		return $url;
	}
	$here = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	return $host === $here ? $url : str_replace( '//' . $host, '//' . $here, $url );
}

/**
 * Desktop layout of a gallery's first tiles, solved so every picture fills its
 * tile exactly (no bars of padding), with nothing cropped.
 *
 * r = height / width of each picture, g = the 8px gap, W = the gallery width.
 * Three pictures can be arranged in three ways, and for each there is exactly
 * one size at which every tile has its picture's own shape:
 *
 *   columns  hero left, the other two stacked on its right
 *              H = ( W - g + g / (r1 + r2) ) / ( 1 / r0 + 1 / (r1 + r2) )
 *   top      hero across the top, the other two side by side beneath it
 *              H = W r0 + g + ( W - g ) / ( 1 / r1 + 1 / r2 )
 *   row      all three side by side
 *              H = ( W - 2g ) / ( 1 / r0 + 1 / r1 + 1 / r2 )
 *
 * (two pictures: side by side, H = ( W - g ) / ( 1 / r0 + 1 / r1 )). The
 * arrangement whose height is nearest a comfortable 560px (and whose smallest
 * tile is not tiny) wins. If even that is taller than 720px the whole gallery
 * is scaled down in width and centred (never below 78% of the column); if it
 * can't be made to fit even so, 'exact' is false and the caller keeps the
 * nearest layout with some padding. Pictures may end up shown a little larger
 * than their natural size - project-gallery reports how much.
 *
 * Returns array( exact, layout, h, cols, rows, scale, min_w ) where scale is the
 * gallery's width as a fraction of the column (1 unless scaled down).
 */
function portfolio_gallery_candidates( array $r, $count, $w = 1140 ) {
	$g   = 8;
	$out = array();
	if ( $count >= 3 ) {
		$s12 = $r[1] + $r[2];
		// columns
		$h   = ( $w - $g + $g / $s12 ) / ( 1 / $r[0] + 1 / $s12 );
		$hw  = $h / $r[0];
		$sw  = $w - $g - $hw;
		$h1  = ( $h - $g ) * $r[1] / $s12;
		$out[] = array( 'layout' => 'columns', 'h' => $h, 'min_w' => min( $hw, $sw ), 'cols' => round( $hw, 1 ) . 'fr ' . round( $sw, 1 ) . 'fr', 'rows' => round( 1000 * $r[1] / $s12 ) . 'fr ' . round( 1000 * $r[2] / $s12 ) . 'fr' );
		// top
		$hb  = ( $w - $g ) / ( 1 / $r[1] + 1 / $r[2] );
		$h   = $w * $r[0] + $g + $hb;
		$out[] = array( 'layout' => 'top', 'h' => $h, 'min_w' => min( $hb / $r[1], $hb / $r[2] ), 'cols' => round( $hb / $r[1], 1 ) . 'fr ' . round( $hb / $r[2], 1 ) . 'fr', 'rows' => round( $w * $r[0], 1 ) . 'fr ' . round( $hb, 1 ) . 'fr' );
		// row
		$h   = ( $w - 2 * $g ) / ( 1 / $r[0] + 1 / $r[1] + 1 / $r[2] );
		$out[] = array( 'layout' => 'row', 'h' => $h, 'min_w' => min( $h / $r[0], $h / $r[1], $h / $r[2] ), 'cols' => round( $h / $r[0], 1 ) . 'fr ' . round( $h / $r[1], 1 ) . 'fr ' . round( $h / $r[2], 1 ) . 'fr', 'rows' => '' );
	} elseif ( 2 === $count ) {
		$h   = ( $w - $g ) / ( 1 / $r[0] + 1 / $r[1] );
		$out[] = array( 'layout' => 'row', 'h' => $h, 'min_w' => min( $h / $r[0], $h / $r[1] ), 'cols' => round( $h / $r[0], 1 ) . 'fr ' . round( $h / $r[1], 1 ) . 'fr', 'rows' => '' );
	}
	return $out;
}

/**
 * Minimum tile width, desktop (at the standard 1140px gallery width).
 *
 * Solving every tile to its picture's exact shape makes a tall picture a very
 * narrow column - 228px for the translation project's right-hand pair, in a
 * gallery 1140px wide - which is too small to read. portfolio_gallery_widen()
 * raises a tile narrower than this to it, and every picture is then shown with
 * a little cropped off (object-fit: cover, gallery.css [data-crop]) instead of
 * a bar of blurred padding. The crop is kept mild (PG_MAX_CROP, as a fraction
 * of a picture's width or height), and the viewer always shows the whole
 * picture. If it cannot be done within that, the gallery is left as it was.
 */
define( 'PG_MIN_COL', 300 );
define( 'PG_MAX_CROP', 0.2 );

function portfolio_gallery_crop( $f ) {
	return 1 - min( $f, 1 / $f );
}

/**
 * The same arrangement with its narrowest column widened towards PG_MIN_COL.
 * Tries PG_MIN_COL first, then smaller minimums, and takes the first for which
 * some gallery height keeps every picture's crop within PG_MAX_CROP; the height
 * is the one that crops the most-cropped picture the least. Returns null if the
 * columns are already wide enough or nothing fits.
 */
function portfolio_gallery_widen( array $r, $count, array $cand, $w = 1140, $keep0 = false ) {
	$g = 8;
	// $keep0: the first tile is a portrait YouTube video whose thumbnail is cropped to
	// its sharp middle (the sides are YouTube's blurred fill); widening would crop it
	// further and show that fill, so its tile keeps its own shape and the others give.
	$hero_crop = $keep0 ? 0.01 : 0.04;
	if ( 'columns' === $cand['layout'] && $count >= 3 ) {
		$s12   = $r[1] + $r[2];
		$cur   = $w - $g - $cand['h'] / $r[0]; // the right column's width as it is now
		for ( $sw = PG_MIN_COL; $sw > $cur + 4; $sw -= 10 ) {
			$hw   = $w - $g - $sw;
			$best = null;
			// The hero is the picture with the most in it (a chart's axes, a
			// diagram's labels): it is kept to within 4% of its own shape, and
			// the little tiles take the crop.
			for ( $h = 380; $h <= 720; $h += 2 ) {
				if ( portfolio_gallery_crop( $hw / $h * $r[0] ) > $hero_crop ) { continue; }
				$mc = portfolio_gallery_crop( ( $h - $g ) / ( $sw * $s12 ) );
				if ( ! $best || $mc < $best['crop'] ) {
					$best = array( 'h' => $h, 'crop' => $mc );
				}
			}
			if ( ! $best ) { continue; }
			if ( $best['crop'] <= PG_MAX_CROP ) {
				return array(
					'layout' => 'columns', 'h' => $best['h'], 'min_w' => $sw, 'crop' => $best['crop'],
					'cols' => round( $hw, 1 ) . 'fr ' . round( $sw, 1 ) . 'fr',
					'rows' => round( 1000 * $r[1] / $s12 ) . 'fr ' . round( 1000 * $r[2] / $s12 ) . 'fr',
				);
			}
		}
		return null;
	}
	if ( 'row' === $cand['layout'] ) {
		$n     = count( $r ) > $count ? $count : count( $r );
		$avail = $w - ( $n - 1 ) * $g;
		$cur   = $cand['min_w'];
		for ( $min = PG_MIN_COL; $min > $cur + 4; $min -= 10 ) {
			$best = null;
			for ( $h = 300; $h <= 720; $h += 4 ) {
				$ws = array(); $fixed = 0; $free = 0;
				for ( $i = 0; $i < $n; $i++ ) {
					$nat = $h / $r[ $i ];
					if ( $nat < $min && ! ( $keep0 && 0 === $i ) ) { $ws[ $i ] = $min; $fixed += $min; } else { $ws[ $i ] = $nat; $free += $nat; }
				}
				if ( 0 === $fixed || $free <= 0 || $avail - $fixed <= 0 ) { continue; }
				$k = ( $avail - $fixed ) / $free;
				$mc = 0;
				for ( $i = 0; $i < $n; $i++ ) {
					if ( $ws[ $i ] !== $min ) { $ws[ $i ] *= $k; }
					$mc = max( $mc, portfolio_gallery_crop( $ws[ $i ] / $h * $r[ $i ] ) );
				}
				if ( $keep0 && portfolio_gallery_crop( $ws[0] / $h * $r[0] ) > $hero_crop ) { continue; }
				if ( ! $best || $mc < $best['crop'] ) {
					$best = array( 'h' => $h, 'crop' => $mc, 'ws' => $ws );
				}
			}
			if ( $best && $best['crop'] <= PG_MAX_CROP ) {
				return array(
					'layout' => 'row', 'h' => $best['h'], 'min_w' => $min, 'crop' => $best['crop'], 'rows' => '',
					'cols' => implode( ' ', array_map( function ( $x ) { return round( $x, 1 ) . 'fr'; }, $best['ws'] ) ),
				);
			}
		}
	}
	return null;
}

function portfolio_gallery_layout( array $r, $count, $w = 1140, $keep0 = false ) {
	$cands = portfolio_gallery_candidates( $r, $count, $w );
	if ( ! $cands ) {
		return array( 'use' => false, 'exact' => false, 'h' => $w * $r[0], 'cols' => '', 'rows' => '', 'layout' => 'columns', 'scale' => 1, 'min_w' => $w );
	}
	$best  = null;
	$bests = 1e9;
	foreach ( $cands as $c ) {
		$h = $c['h'];
		$scale = 1.0;
		if ( $h > 720 ) { $scale = max( 0.78, 720 / $h ); }
		$hs = $h * $scale; $mw = $c['min_w'] * $scale;
		$score = abs( $hs - 560 );
		if ( $hs > 722 ) { $score += 1000 + ( $hs - 720 ); }      // still too tall even scaled
		if ( $hs < 240 ) { $score += 500; }                          // a strip
		if ( $mw < 200 ) { $score += 800 + ( 200 - $mw ); }          // a sliver of a tile
		if ( $score < $bests ) { $bests = $score; $best = $c + array( 'scale' => $scale, 'score' => $score, 'hs' => $hs ); }
	}
	$best['exact'] = $best['score'] < 800;
	$best['use']     = $best['exact'];
	$best['cropped'] = false;
	// a tile narrower than PG_MIN_COL: widen it, cropping the pictures a little
	if ( $best['use'] && $best['scale'] > 0.999 && $best['min_w'] < PG_MIN_COL ) {
		$adj = portfolio_gallery_widen( $r, $count, $best, $w, $keep0 );
		if ( $adj ) {
			$best            = $adj + $best;
			$best['hs']      = $adj['h'];
			$best['cropped'] = true;
		}
	}
	$best['h'] = $best['hs'];
	return $best;
}

add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_singular( 'post' ) ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/project-gallery';
	$url = WPMU_PLUGIN_URL . '/project-gallery';
	wp_enqueue_style( 'project-gallery', $url . '/gallery.css', array(), filemtime( $dir . '/gallery.css' ) );
	wp_enqueue_script( 'project-gallery', $url . '/gallery.js', array( 'portfolio-lightbox-toolbar' ), filemtime( $dir . '/gallery.js' ), true );
} );

add_shortcode( 'project_gallery', function ( $atts ) {
	$atts    = shortcode_atts( array( 'id' => 0 ), $atts );
	$post_id = (int) $atts['id'] ?: get_the_ID();
	$items   = json_decode( get_post_meta( $post_id, '_project_gallery', true ), true );
	if ( empty( $items ) || ! is_array( $items ) ) {
		return '';
	}

	$count       = count( $items );
	$count_class = $count >= 3 ? 'pg-count-3plus' : 'pg-count-' . $count;

	$play_icon = '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="11" fill="rgba(20,26,36,.55)"/><path d="M10 8l6 4-6 4V8z"/></svg>';
	$more_icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';

	/* Reserve the gallery's height before its pictures arrive.

	   The gallery used to be 18px tall until its first image loaded and then
	   jumped to its final size (200-1350px, depending on the project), shoving
	   the whole page below it down - a layout shift of 0.5 on a desktop and
	   0.3 on a phone, the worst on the site. The final size is fixed by the
	   pictures' shapes, which are known here: the hero tile is as tall as its
	   image's shape allows at its width, and on a phone the strip is as tall
	   as its tallest picture. So the shapes are handed to the CSS (gallery.css
	   uses them as aspect-ratio, which content can still outgrow), and the
	   space is there from the first paint. YouTube thumbnails are 4:3;
	   uploaded images use the attachment's own size; anything else (a hosted
	   video) is simply not reserved for. */
	$shape = function ( $item ) {
		if ( 'youtube' === ( $item['type'] ?? '' ) ) {
			return array( 4, 3 );
		}
		if ( 'image' === ( $item['type'] ?? '' ) && ! empty( $item['attachment_id'] ) ) {
			$src = wp_get_attachment_image_src( (int) $item['attachment_id'], 'large' );
			if ( $src && $src[1] && $src[2] ) {
				return array( (int) $src[1], (int) $src[2] );
			}
		}
		// a picture with no attachment (an animated GIF cover): its size is recorded on the item
		if ( 'image' === ( $item['type'] ?? '' ) && ! empty( $item['w'] ) && ! empty( $item['h'] ) ) {
			return array( (int) $item['w'], (int) $item['h'] );
		}
		return null;
	};
	$first = array_map( $shape, array_slice( $items, 0, 3 ) ); // shapes of the first three tiles (null = unknown)
	$style       = '';
	$layout_attr = '';
	if ( $first[0] ) {
		// Phone: only the first tile follows its picture's shape (the rest are a fixed 4:3),
		// so the strip is that tall. Width : height of the hero picture.
		$style .= '--pg-hero-ar:' . round( $first[0][0] / $first[0][1], 4 ) . ';';
	}
	// Desktop shapes: the same, plus hosted videos, whose size is recorded on the
	// item (w / h). Kept apart from $first so a phone's strip is unchanged.
	$first_d = array_map( function ( $item ) use ( $shape ) {
		// a hosted video's size, or a YouTube video's real shape (a portrait phone
		// clip or a wide side-by-side), recorded on the item as w / h
		if ( in_array( $item['type'] ?? '', array( 'hosted', 'youtube' ), true ) && ! empty( $item['w'] ) && ! empty( $item['h'] ) ) {
			return array( (int) $item['w'], (int) $item['h'] );
		}
		// the thumbnail shown is maxresdefault, which is 16:9 (the phone strip keeps 4:3)
		if ( 'youtube' === ( $item['type'] ?? '' ) ) {
			return array( 16, 9 );
		}
		return $shape( $item );
	}, array_slice( $items, 0, 3 ) );
	if ( ! in_array( null, $first_d, true ) ) {
		$first = $first_d;
		// Desktop: the hero spans two rows beside two stacked tiles. The two rows are
		// equal (1fr 1fr), so with W = a tile's width = (width - 8px gap) / 3:
		//   height = the taller of: the hero, 2 * W * r1; the stack, 2 * W * max( r2, r3 ) + 8px gap
		//   (r = a picture's height : width)
		// (two tiles: one row, max( 2 * W * r1, W * r2 ); one tile: the width * r1).
		// Worked out at the standard 1140px gallery width (exact there; within 1% at
		// other widths, where only the 8px gap does not scale) and written as the
		// gallery's own width : height.
		$w   = 1140;
		$r   = array_map( function ( $sh ) { return $sh[1] / $sh[0]; }, $first );
		$keep0 = 'youtube' === ( $items[0]['type'] ?? '' ) && ! empty( $items[0]['w'] ) && $r[0] > 1.2; // a portrait YouTube video leads
			$lay = portfolio_gallery_layout( $r, $count, $w, $keep0 );
		// post 2274 (YOLO) has its own arrangement in custom-fixes.css
		if ( 2274 === $post_id ) { $lay['use'] = false; $lay['scale'] = 1; }
		if ( $lay['use'] ) {
			if ( in_array( $lay['layout'], array( 'row', 'top' ), true ) ) {
				$layout_attr = ' data-layout="' . $lay['layout'] . '"';
			}
			// widened to the minimum column width: the pictures fill their tiles (gallery.css)
			if ( ! empty( $lay['cropped'] ) ) {
				$layout_attr .= ' data-crop="1"';
			}
			$style .= '--pg-cols:' . $lay['cols'] . ';';
			if ( $lay['rows'] ) {
				$style .= '--pg-rows:' . $lay['rows'] . ';';
			}
			if ( $lay['scale'] < 0.999 ) {
				$style .= '--pg-w:' . round( $lay['scale'], 4 ) . ';';
			}
			$style .= '--pg-ar:' . round( $w * $lay['scale'] / $lay['h'], 4 ) . ';';
		} else {
			$tw = ( $w - 8 ) / 3;
			$dh = $count >= 3 ? max( 2 * $tw * $r[0], 2 * $tw * max( $r[1], $r[2] ) + 8 ) : ( 2 === $count ? $tw * max( 2 * $r[0], $r[1] ) : $w * $r[0] );
			$style .= '--pg-ar:' . round( $w / $dh, 4 ) . ';';
		}
	}

	ob_start();
	?>
	<div class="project-gallery <?php echo esc_attr( $count_class ); ?>"<?php echo $layout_attr; ?><?php echo $style ? ' style="' . esc_attr( $style ) . '"' : ''; ?>>
		<?php foreach ( $items as $i => $item ) :
			$is_third_with_more = ( 2 === $i && $count > 3 );
			// A poster is a full URL (hosted videos) or a path under uploads/ (a frame
			// taken from a YouTube video's original file, shown instead of YouTube's
			// own thumbnail: full resolution, exactly the video's shape, no bars)
			$poster_url = (string) ( $item['poster'] ?? '' );
			if ( '' !== $poster_url && 0 !== strpos( $poster_url, 'http' ) ) {
				$poster_url = wp_upload_dir()['baseurl'] . '/' . ltrim( $poster_url, '/' );
			}
			$poster_url = portfolio_gallery_fix_host( $poster_url );
			?>
			<button
				type="button"
				class="project-gallery__item"
				data-type="<?php echo esc_attr( $item['type'] ); ?>"
				data-src="<?php echo esc_url( portfolio_gallery_fix_host( $item['src'] ?? '' ) ); ?>"
				data-video-id="<?php echo esc_attr( $item['video_id'] ?? '' ); ?>"
				data-alt="<?php echo esc_attr( $item['alt'] ?? '' ); ?>"
				data-caption="<?php echo esc_attr( $item['caption'] ?? '' ); ?>"
				data-poster="<?php echo esc_url( $poster_url ); ?>"
				<?php
				// YouTube thumbnails are 16:9 with the video boxed inside; when the video's
				// real shape is known its tile has that shape, and the thumbnail is cropped
				// to it (gallery.css) rather than shown whole with its black bars
				if ( 'youtube' === $item['type'] && ! empty( $item['w'] ) ) {
					echo ' data-fit="video"';
				}
				// Three quality tiers for a picture: the tile (a sized-down copy picked
				// by the browser), the viewer (data-hq: the picture at its full
				// resolution as a WebP) and the download (data-original: the file as it
				// was made, saved as a PNG by lightbox-toolbar.js).
				// A YouTube video can carry its original file (item 'original', under
				// uploads/originals) so the viewer offers it as a download.
				if ( 'youtube' === $item['type'] && ! empty( $item['original'] ) ) {
					echo ' data-original="' . esc_url( portfolio_gallery_fix_host( wp_upload_dir()['baseurl'] . '/' . $item['original'] ) ) . '"';
				}
				if ( 'image' === $item['type'] ) {
					$ub = wp_upload_dir()['baseurl'] . '/';
					foreach ( array( 'hq', 'original' ) as $tier ) {
						if ( ! empty( $item[ $tier ] ) ) {
							// ?v= = the file's mtime, so a replaced viewer/download file is
							// never served from the browser's cache under its old name
							$tier_file = wp_upload_dir()['basedir'] . '/' . $item[ $tier ];
							$tier_ver  = file_exists( $tier_file ) ? '?v=' . filemtime( $tier_file ) : '';
							echo ' data-' . $tier . '="' . esc_url( portfolio_gallery_fix_host( $ub . $item[ $tier ] ) . $tier_ver ) . '"';
						}
					}
				}
				?>
			>
				<?php if ( 'image' === $item['type'] ) :
					if ( ! empty( $item['attachment_id'] ) ) {
						echo wp_get_attachment_image( $item['attachment_id'], 'large', false, array(
							'loading' => $i < 3 ? 'eager' : 'lazy',
							'alt'     => $item['alt'] ?? '',
							// the tile is at most ~760px wide on a desktop, so the browser
							// picks a copy to suit (1536px only for a hi-dpi hero)
							'sizes'   => 0 === $i ? '(min-width: 768px) 760px, 88vw' : '(min-width: 768px) 520px, 88vw',
						) );
					} else {
						?><img src="<?php echo esc_url( portfolio_gallery_fix_host( $item['src'] ) ); ?>" alt="<?php echo esc_attr( $item['alt'] ?? '' ); ?>" loading="<?php echo $i < 3 ? 'eager' : 'lazy'; ?>"><?php
					}
				elseif ( 'youtube' === $item['type'] ) :
					// maxresdefault is sharper than hqdefault, but isn't generated for
					// every video; fall back to the guaranteed hqdefault if it 404s.
					// The 404 is YouTube's grey placeholder picture, which the browser
					// shows rather than erroring, so a video known to lack one is
					// marked on its item (thumb: hqdefault) and goes straight there.
					$thumb = ( 'hqdefault' === ( $item['thumb'] ?? '' ) ) ? 'hqdefault' : 'maxresdefault';
					?>
					<?php if ( '' !== $poster_url ) : ?>
						<img src="<?php echo esc_url( $poster_url ); ?>" alt="" loading="<?php echo $i < 3 ? 'eager' : 'lazy'; ?>">
					<?php else : ?>
						<img src="https://img.youtube.com/vi/<?php echo esc_attr( $item['video_id'] ); ?>/<?php echo $thumb; ?>.jpg" alt="" loading="<?php echo $i < 3 ? 'eager' : 'lazy'; ?>" onerror="this.onerror=null;this.src='https://img.youtube.com/vi/<?php echo esc_attr( $item['video_id'] ); ?>/hqdefault.jpg';">
					<?php endif; ?>
					<span class="project-gallery__play"><?php echo $play_icon; ?></span>
				<?php elseif ( 'hosted' === $item['type'] ) : ?>
					<video preload="metadata" muted playsinline poster="<?php echo esc_url( portfolio_gallery_fix_host( $item['poster'] ?? '' ) ); ?>" src="<?php echo esc_url( portfolio_gallery_fix_host( $item['src'] ) ); ?>#t=0.1"></video>
					<span class="project-gallery__play"><?php echo $play_icon; ?></span>
				<?php endif; ?>

				<?php if ( $is_third_with_more ) : ?>
					<span class="project-gallery__more"><?php echo $more_icon; ?> +<?php echo (int) ( $count - 3 ); ?></span>
				<?php endif; ?>
				<span class="project-gallery__counter"></span>
			</button>
		<?php endforeach; ?>
	</div>
	<?php
	return ob_get_clean();
} );
