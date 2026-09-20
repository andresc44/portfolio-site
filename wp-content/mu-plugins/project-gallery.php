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
 */

add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_singular( 'post' ) ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/project-gallery';
	$url = WPMU_PLUGIN_URL . '/project-gallery';
	wp_enqueue_style( 'project-gallery', $url . '/gallery.css', array(), filemtime( $dir . '/gallery.css' ) );
	wp_enqueue_script( 'project-gallery', $url . '/gallery.js', array(), filemtime( $dir . '/gallery.js' ), true );
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

	ob_start();
	?>
	<div class="project-gallery <?php echo esc_attr( $count_class ); ?>">
		<?php foreach ( $items as $i => $item ) :
			$is_third_with_more = ( 2 === $i && $count > 3 );
			?>
			<button
				type="button"
				class="project-gallery__item"
				data-type="<?php echo esc_attr( $item['type'] ); ?>"
				data-src="<?php echo esc_url( $item['src'] ?? '' ); ?>"
				data-video-id="<?php echo esc_attr( $item['video_id'] ?? '' ); ?>"
				data-alt="<?php echo esc_attr( $item['alt'] ?? '' ); ?>"
			>
				<?php if ( 'image' === $item['type'] ) :
					if ( ! empty( $item['attachment_id'] ) ) {
						echo wp_get_attachment_image( $item['attachment_id'], 'large', false, array(
							'loading' => $i < 3 ? 'eager' : 'lazy',
							'alt'     => $item['alt'] ?? '',
						) );
					} else {
						?><img src="<?php echo esc_url( $item['src'] ); ?>" alt="<?php echo esc_attr( $item['alt'] ?? '' ); ?>" loading="<?php echo $i < 3 ? 'eager' : 'lazy'; ?>"><?php
					}
				elseif ( 'youtube' === $item['type'] ) : ?>
					<img src="https://img.youtube.com/vi/<?php echo esc_attr( $item['video_id'] ); ?>/hqdefault.jpg" alt="" loading="<?php echo $i < 3 ? 'eager' : 'lazy'; ?>">
					<span class="project-gallery__play"><?php echo $play_icon; ?></span>
				<?php elseif ( 'hosted' === $item['type'] ) : ?>
					<video preload="metadata" muted playsinline src="<?php echo esc_url( $item['src'] ); ?>#t=0.1"></video>
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
