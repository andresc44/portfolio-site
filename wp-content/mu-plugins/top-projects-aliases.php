<?php
/**
 * The five posts in the "Top Projects" category exist only to fill the
 * homepage's Highlighted Projects grid — each one duplicates a real write-up
 * that already lives under the Projects tab. Their titles, excerpts and
 * featured images are kept identical to the originals as plain post data,
 * so the only thing left that gave them away was the link.
 *
 * Point their permalinks at the originals, so a homepage card is simply
 * another route into the real project page rather than a second, thinner
 * copy of it. The duplicates keep their own page content; it just stops
 * being linked to.
 */

/**
 * duplicate post ID => real post ID. Shared with
 * mu-plugins/highlighted-projects-cards.php, which needs the same mapping
 * to show each homepage card's real category/subcategory (the duplicates
 * themselves only carry the "Top Projects" category).
 */
function portfolio_top_projects_aliases() {
	return array(
		3057 => 2275, // Robust Visual Navigation Using Semantic Segmentation and Sensor Fusion
		3061 => 2231, // Sim to Real Drone Racing with RRT* Planning
		3065 => 2886, // Geospatial Signal Strength Analysis Using BigQuery
		3069 => 2838, // Real-Time Trail Segmentation Model for An Autonomous Robot
		3606 => 3601, // Finnbot: AI-Powered Stock Advisor with Daily Digests and Sell Alerts
		3524 => 2752, // Embedded Omni Directional Maze Navigating Robot with 360 LiDAR
	);
}

add_filter( 'post_link', function ( $permalink, $post ) {
	$aliases = portfolio_top_projects_aliases();

	if ( ! isset( $aliases[ $post->ID ] ) ) {
		return $permalink;
	}

	// get_permalink() on the target re-enters this filter, but the target's own
	// ID isn't in the map, so it returns untouched — no recursion.
	$target = get_permalink( $aliases[ $post->ID ] );

	return $target ? $target : $permalink;
}, 10, 2 );
