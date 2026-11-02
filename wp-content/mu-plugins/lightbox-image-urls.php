<?php
/**
 * Point Elementor lightboxes at this site's copy of the image.
 *
 * Elementor builds the "Media File" link from the stored image URL rather than
 * the attachment ID (see get_link_url() in includes/widgets/image.php), and the
 * stored URLs across this site hardcode https://andrescerverarozo.au/. The
 * <img> itself renders fine because that comes from the attachment ID, but the
 * lightbox link would fetch the full-size image from the live domain — so
 * locally you would be loading production images, or nothing at all if the
 * file is not there.
 *
 * This rewrites the host on lightbox links to whatever host is actually
 * serving the page, and only when the original host is one of this site's own.
 * Genuinely external lightbox links are left untouched, and it self-corrects
 * in both directions, so it keeps working after the site moves to production.
 */

add_filter(
	'elementor/widget/render_content',
	function ( $html ) {
		if ( ! is_string( $html ) || false === stripos( $html, 'data-elementor-open-lightbox' ) ) {
			return $html;
		}

		$here = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
		$ours = array( $here, 'andrescerverarozo.au', 'www.andrescerverarozo.au', 'andres-portfolio-local.local' );

		return preg_replace_callback(
			'~href=("|\')(https?://[^"\']+)\1~i',
			function ( $m ) use ( $here, $ours ) {
				$host = strtolower( (string) wp_parse_url( $m[2], PHP_URL_HOST ) );
				if ( '' === $host || $host === $here || ! in_array( $host, $ours, true ) ) {
					return $m[0];
				}
				return 'href=' . $m[1] . str_replace( '//' . $host, '//' . $here, $m[2] ) . $m[1];
			},
			$html
		);
	},
	5 // before the external-link filter, so rewritten URLs are judged as internal
);
