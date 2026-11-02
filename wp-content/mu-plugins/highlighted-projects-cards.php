<?php
/**
 * Adds a "Category · Subcategory" line to each Highlighted Projects card on
 * the homepage, matching the label already shown on search-result and
 * tag-archive cards (mu-plugins/project-tags.php, .project-archive__card-cat).
 *
 * The six Highlighted Projects posts are duplicates that exist only to
 * populate this grid (see mu-plugins/top-projects-aliases.php) and carry
 * just the "Top Projects" category themselves - the real category and
 * subcategory live on the post each one aliases to. Elementor's Posts
 * widget also has no parent/child-aware taxonomy display even when a post
 * does carry the real terms, so this is added as plain text after render
 * rather than through an Elementor setting: a tiny inline script matches
 * each card by its post-{ID} class and inserts the label looked up
 * server-side, right before the title.
 */

add_action( 'wp_footer', function () {
	if ( ! is_front_page() && ! is_page( 1236 ) ) {
		return;
	}

	$labels = array();
	foreach ( portfolio_top_projects_aliases() as $duplicate_id => $real_id ) {
		$pair = portfolio_get_post_category_pair( $real_id );
		if ( ! $pair['category'] ) {
			continue;
		}
		$label = html_entity_decode( $pair['category']->name, ENT_QUOTES );
		if ( $pair['subcategory'] ) {
			$label .= ' · ' . html_entity_decode( $pair['subcategory']->name, ENT_QUOTES );
		}
		$labels[ $duplicate_id ] = $label;
	}

	if ( empty( $labels ) ) {
		return;
	}
	?>
	<script>
	( function () {
		var labels = <?php echo wp_json_encode( $labels ); ?>;
		document.querySelectorAll( '.elementor-element-20aba35 .elementor-post' ).forEach( function ( card ) {
			var match = card.className.match( /\bpost-(\d+)\b/ );
			var id = match ? match[ 1 ] : null;
			if ( ! id || ! labels[ id ] ) {
				return;
			}
			var title = card.querySelector( '.elementor-post__title' );
			if ( ! title ) {
				return;
			}
			var span = document.createElement( 'span' );
			span.className = 'hp-card-cat';
			span.textContent = labels[ id ];
			title.parentNode.insertBefore( span, title );
		} );
	} )();
	</script>
	<?php
}, 20 );
