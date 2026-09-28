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

add_filter( 'post_link', function ( $permalink, $post ) {
	$aliases = array(
		3057 => 2275, // Robust Visual Navigation Using Semantic Segmentation and Sensor Fusion
		3061 => 2231, // Sim to Real Drone Racing with RRT* Planning
		3065 => 2886, // Geospatial Signal Strength Analysis Using BigQuery
		3069 => 2838, // Real-Time Trail Segmentation Model for An Autonomous Robot
		3073 => 2322, // Battery Characterization and PCB Assembly for High-Voltage Electric Vehicle
	);

	if ( ! isset( $aliases[ $post->ID ] ) ) {
		return $permalink;
	}

	// get_permalink() on the target re-enters this filter, but the target's own
	// ID isn't in the map, so it returns untouched — no recursion.
	$target = get_permalink( $aliases[ $post->ID ] );

	return $target ? $target : $permalink;
}, 10, 2 );
