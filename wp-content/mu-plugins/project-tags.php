<?php
/**
 * Cross-project tag browsing.
 *
 * - [project_tags id="123"] renders a project's tags as clickable pills.
 *   Clicking a pill opens a small popup (built in tags.js) listing every
 *   OTHER project that shares that tag, each with its category/subcategory,
 *   fetched on demand from a small REST endpoint (kept out of the page's
 *   initial payload for speed).
 * - Tag archive pages (yoursite.com/tag/slug/) get a custom, site-styled
 *   template showing preview cards for every project with that tag, reusing
 *   the same post_excerpt-driven preview pattern as the rest of the site.
 */

define( 'PORTFOLIO_TOP_LEVEL_CATEGORY_IDS', array( 9, 14, 17, 20 ) ); // Robotics, Programming, Electrical/Embedded, Mechanical

/**
 * For a given post, returns ['category' => WP_Term|null, 'subcategory' => WP_Term|null].
 */
function portfolio_get_post_category_pair( $post_id ) {
	$terms = get_the_category( $post_id );
	$category    = null;
	$subcategory = null;
	foreach ( $terms as $term ) {
		if ( 21 === $term->term_id ) { // "Top Projects" — not a real category, skip.
			continue;
		}
		if ( 0 === $term->parent ) {
			$category = $term;
		} else {
			$subcategory = $term;
		}
	}
	return array( 'category' => $category, 'subcategory' => $subcategory );
}

add_action( 'pre_get_posts', function ( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}
	if ( $query->is_tag() ) {
		$query->set( 'posts_per_page', -1 );
	}
	if ( $query->is_search() ) {
		// Only the 32 real project write-ups are "relevant" here — not
		// generic pages, and not the 5 duplicate posts that exist solely to
		// power the homepage's "Highlighted Projects" section.
		$query->set( 'post_type', 'post' );
		$query->set( 'posts_per_page', -1 );
		$query->set( 'tax_query', array(
			array( 'taxonomy' => 'category', 'field' => 'term_id', 'terms' => 21, 'operator' => 'NOT IN' ),
		) );
	}
} );

add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_singular( 'post' ) && ! is_tag() && ! is_search() ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/project-tags';
	$url = WPMU_PLUGIN_URL . '/project-tags';
	wp_enqueue_style( 'project-tags', $url . '/tags.css', array(), filemtime( $dir . '/tags.css' ) );
	if ( is_singular( 'post' ) ) {
		wp_enqueue_script( 'project-tags', $url . '/tags.js', array(), filemtime( $dir . '/tags.js' ), true );
		wp_localize_script( 'project-tags', 'ProjectTags', array(
			'restUrl' => esc_url_raw( rest_url( 'portfolio/v1/tag-projects' ) ),
			'postId'  => get_the_ID(),
		) );
	}
} );

add_shortcode( 'project_tags', function ( $atts ) {
	$atts    = shortcode_atts( array( 'id' => 0 ), $atts );
	$post_id = (int) $atts['id'] ?: get_the_ID();
	$tags    = get_the_tags( $post_id );
	if ( empty( $tags ) ) {
		return '';
	}

	ob_start();
	?>
	<div class="project-tags">
		<?php foreach ( $tags as $tag ) : ?>
			<button type="button" class="project-tags__pill" data-tag-slug="<?php echo esc_attr( $tag->slug ); ?>" data-tag-name="<?php echo esc_attr( html_entity_decode( $tag->name, ENT_QUOTES ) ); ?>">
				<?php echo esc_html( html_entity_decode( $tag->name, ENT_QUOTES ) ); ?>
			</button>
		<?php endforeach; ?>
	</div>
	<?php
	return ob_get_clean();
} );

/**
 * REST endpoint: every OTHER published project sharing a tag, with its
 * category/subcategory, for the popup on project detail pages.
 */
add_action( 'rest_api_init', function () {
	register_rest_route( 'portfolio/v1', '/tag-projects/(?P<slug>[a-z0-9-]+)', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'args'                => array(
			'exclude' => array( 'type' => 'integer', 'default' => 0 ),
		),
		'callback'            => function ( WP_REST_Request $req ) {
			$term = get_term_by( 'slug', $req['slug'], 'post_tag' );
			if ( ! $term ) {
				return new WP_REST_Response( array( 'message' => 'Unknown tag' ), 404 );
			}

			$posts = get_posts( array(
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'tax_query'      => array( array( 'taxonomy' => 'post_tag', 'field' => 'term_id', 'terms' => $term->term_id ) ),
				'exclude'        => array_filter( array( (int) $req['exclude'] ) ),
				'orderby'        => 'title',
				'order'          => 'ASC',
			) );

			$items = array_map( function ( $p ) {
				$pair = portfolio_get_post_category_pair( $p->ID );
				return array(
					'title'       => html_entity_decode( get_the_title( $p ), ENT_QUOTES ),
					'url'         => get_permalink( $p ),
					'category'    => $pair['category'] ? html_entity_decode( $pair['category']->name, ENT_QUOTES ) : '',
					'subcategory' => $pair['subcategory'] ? html_entity_decode( $pair['subcategory']->name, ENT_QUOTES ) : '',
				);
			}, $posts );

			return new WP_REST_Response( array(
				'tag'     => html_entity_decode( $term->name, ENT_QUOTES ),
				'total'   => count( $items ),
				'projects' => $items,
			), 200 );
		},
	) );
} );

/**
 * Site-styled archives: preview cards for a tag's projects, or for a search.
 */
add_filter( 'template_include', function ( $template ) {
	if ( is_tag() ) {
		return WPMU_PLUGIN_DIR . '/project-tags/archive-template.php';
	}
	if ( is_search() ) {
		return WPMU_PLUGIN_DIR . '/project-tags/search-template.php';
	}
	return $template;
} );
