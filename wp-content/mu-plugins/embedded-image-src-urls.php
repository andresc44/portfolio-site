<?php
/**
 * Rewrite the host on <img src="..."> tags embedded as raw HTML inside
 * widget content (button labels, text editors), the same way
 * lightbox-image-urls.php already does for href="..." links.
 *
 * The Skills & Tools page builds each skill "pill" as a button widget whose
 * text setting is literal HTML: `<img src="https://.../sql.png" width="15">
 * SQL`. That icon is never resolved through wp_get_attachment_image() - it's
 * just a string Elementor prints as-is - so neither this site's own-domain
 * detection in the href rewriter, nor WordPress's normal attachment URL
 * resolution, ever touches it. Confirmed via direct inspection of widget
 * 799650d's settings: the <img src> is baked into a live page's
 * _elementor_data as a hardcoded absolute URL, on this domain, not
 * generated per-request - so it silently 404s (or points at the wrong
 * environment) wherever that URL and the current host disagree, exactly
 * like the href case this mirrors.
 *
 * Scoped to src="..." specifically so this can't interact with the
 * separate href rewriting in lightbox-image-urls.php, which already runs
 * at priority 5.
 */

add_filter(
	'elementor/widget/render_content',
	function ( $html ) {
		if ( ! is_string( $html ) || false === stripos( $html, '<img' ) || ! function_exists( 'portfolio_internal_hosts' ) ) {
			return $html;
		}

		$here = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
		$ours = portfolio_internal_hosts();

		return preg_replace_callback(
			'~(<img[^>]*\bsrc=)("|\')(https?://[^"\']+)\2~i',
			function ( $m ) use ( $here, $ours ) {
				$host = strtolower( (string) wp_parse_url( $m[3], PHP_URL_HOST ) );
				if ( '' === $host || $host === $here || ! in_array( $host, $ours, true ) ) {
					return $m[0];
				}
				return $m[1] . $m[2] . str_replace( '//' . $host, '//' . $here, $m[3] ) . $m[2];
			},
			$html
		);
	},
	6 // after lightbox-image-urls.php (5), before external-links-new-tab.php (20)
);
