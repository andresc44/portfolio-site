<?php
/**
 * Keep WordPress's built-in sitemap (/wp-sitemap.xml) to pages worth indexing.
 *
 * The sitemap only exists while "Discourage search engines" is off. Left as it
 * comes it would list things a portfolio should not put in front of a search
 * engine:
 *   - the author archive (/author/admin/) - a page with no content of its own;
 *   - the category archives - every one of them redirects to the matching
 *     category page (Robotics, Programming...), which is listed already;
 *   - the five homepage "alias" posts (see top-projects-aliases.php), whose
 *     address is rewritten to the real project's, so each real project would
 *     appear twice.
 * The alias posts' own pages also ask not to be indexed, in case anyone ever
 * lands on one directly. Nothing visitors see is changed.
 */

add_filter( 'wp_sitemaps_add_provider', function ( $provider, $name ) {
	return 'users' === $name ? false : $provider;
}, 10, 2 );

add_filter( 'wp_sitemaps_taxonomies', function ( $taxonomies ) {
	unset( $taxonomies['category'] );
	return $taxonomies;
} );

add_filter( 'wp_sitemaps_posts_query_args', function ( $args, $post_type ) {
	if ( 'post' === $post_type && function_exists( 'portfolio_top_projects_aliases' ) ) {
		$args['post__not_in'] = array_merge( isset( $args['post__not_in'] ) ? (array) $args['post__not_in'] : array(), array_keys( portfolio_top_projects_aliases() ) );
	}
	return $args;
}, 10, 2 );

add_filter( 'wp_robots', function ( $robots ) {
	if ( is_singular( 'post' ) && function_exists( 'portfolio_top_projects_aliases' ) ) {
		$aliases = portfolio_top_projects_aliases();
		if ( isset( $aliases[ get_queried_object_id() ] ) ) {
			$robots['noindex'] = true;
			$robots['follow']  = true;
			unset( $robots['max-image-preview'] );
		}
	}
	return $robots;
} );
