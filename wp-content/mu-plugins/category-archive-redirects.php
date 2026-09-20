<?php
/**
 * The "Category List" widget on project detail pages links to native
 * WordPress category archives (e.g. /category/robotics/computer-vision-perception/),
 * which are blank/unstyled. Redirect those archives to the matching curated
 * page section instead, so the breadcrumb-style links at the top of each
 * project page take visitors somewhere useful.
 */

add_action( 'template_redirect', function () {
	if ( ! is_category() ) {
		return;
	}

	$term = get_queried_object();
	if ( ! $term instanceof WP_Term ) {
		return;
	}

	$map = array(
		'robotics'                     => '/robotics/',
		'computer-vision-perception'   => '/robotics/#computervision',
		'drones-aerial-robotics'       => '/robotics/#drones',
		'localization'                 => '/robotics/#localization',
		'motion-planning'              => '/robotics/#motionplanning',
		'programming'                  => '/programming/',
		'data-science'                 => '/programming/#datascience',
		'machine-learning'             => '/programming/#machinelearning',
		'electrical-embedded'          => '/electrical-embedded/',
		'embedded-systems-prototyping' => '/electrical-embedded/#embeddedsystems',
		'hardware-power-systems'       => '/electrical-embedded/#hardwarepower',
		'mechanical'                   => '/mechanical/',
	);

	if ( isset( $map[ $term->slug ] ) ) {
		wp_safe_redirect( home_url( $map[ $term->slug ] ), 301 );
		exit;
	}
} );
