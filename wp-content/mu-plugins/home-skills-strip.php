<?php
/**
 * Make each logo in the home page's skills strip clickable, without
 * replacing the artwork.
 *
 * The strip is one flattened JPEG (uploads/2025/12/skilla.jpg) holding all
 * nine logos. An earlier attempt swapped it for the nine individual PNGs
 * used on the Skills & Tools page, but those are authored for a 15px pill
 * and look soft blown up to strip size, and the hand-made spacing of the
 * original reads better than a CSS grid of them. So the image stays as it
 * is and nine transparent hotspots are laid over it instead.
 *
 * The positions below were measured off the artwork rather than eyeballed:
 * the backdrop colour was sampled from the border, every pixel far enough
 * from it marked as "logo", and the resulting mask split into rows and then
 * columns on its gaps. They're percentages, so they hold at any rendered
 * size. Gazebo's mark and its wordmark come back as two separate columns
 * and are deliberately merged into one hotspot.
 *
 * The grey rectangle the strip used to sit in was this JPEG's own backdrop,
 * still painted the old card colour (#162232) after the card moved to
 * #0C1729. That's repainted in the file itself, not hidden with CSS.
 */

function portfolio_home_skills_hotspots() {
	// slug => [ left%, top%, width%, height%, label ]
	return array(
		array( 'python',   1.0,  0,  11.5, 44, 'Python' ),
		array( 'c',       19.0,  0,  10.8, 44, 'C++' ),
		array( 'sql',     36.0,  0,  19.4, 44, 'SQL' ),
		array( 'ros-ros2',61.6,  0,  20.5, 44, 'ROS / ROS2' ),
		array( 'pytorch', 89.8,  0,  10.2, 44, 'PyTorch' ),
		array( 'opencv',   0.0, 50,  14.0, 50, 'OpenCV' ),
		array( 'cad',     19.1, 50,  10.6, 50, 'CAD' ),
		array( 'ansys',   36.0, 50,  23.8, 50, 'Ansys' ),
		array( 'gazebo',  65.0, 50,  33.2, 50, 'Gazebo' ),
	);
}

add_filter( 'elementor/widget/render_content', function ( $html ) {
	if ( ! is_string( $html ) || false === stripos( $html, 'skilla' ) ) {
		return $html;
	}

	$hits = '';
	foreach ( portfolio_home_skills_hotspots() as $h ) {
		list( $slug, $left, $top, $width, $height, $label ) = $h;
		$hits .= sprintf(
			'<a class="skill-hit" style="left:%s%%;top:%s%%;width:%s%%;height:%s%%" href="%s" title="%s" aria-label="%s projects"></a>',
			$left, $top, $width, $height,
			esc_url( home_url( '/tag/' . $slug . '/' ) ),
			esc_attr( $label ),
			esc_attr( $label )
		);
	}

	// wrap the existing <img> so the hotspots can be positioned against it
	return preg_replace(
		'~(<img[^>]*skilla[^>]*>)~i',
		'<span class="skill-map">$1' . $hits . '</span>',
		$html,
		1
	);
}, 8 );
