<?php
/**
 * Open links that leave the portfolio in a new tab.
 *
 * Roughly 58 outbound links live across the project write-ups and the Skills
 * & Tools page (GitHub, Google Drive/Docs, LinkedIn, Onshape, and the
 * university/certification sites). Setting "open in new window" on each one by
 * hand in Elementor would mean editing about thirty posts and would silently
 * miss anything added later, so this rewrites them at render time instead.
 *
 * Content is left untouched in the database — this only filters output, so
 * deleting this file restores the previous behaviour exactly.
 *
 * Note both the live domain and the Local dev domain count as "internal".
 * A lot of the stored content hardcodes https://andrescerverarozo.au/, which
 * would otherwise be treated as outbound while developing locally.
 */

function portfolio_internal_hosts() {
	static $hosts = null;
	if ( null !== $hosts ) {
		return $hosts;
	}
	$hosts = array(
		strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) ),
		'andrescerverarozo.au',
		'www.andrescerverarozo.au',
		// The Local dev host must be listed explicitly: it only appears above while
		// browsing Local. A transfer carries the nav menu's stored links
		// (https://andres-portfolio-local.local/...) to the live site, and
		// internal-urls-current-host.php rewrites every host in this list to the
		// one actually serving the page - without this line the live menu kept
		// pointing visitors at a domain that only exists on this computer.
		'andres-portfolio-local.local',
	);
	return array_filter( array_unique( $hosts ) );
}

/**
 * Adds target/rel to anchors pointing off-site. Anchors that already declare a
 * target are left alone, so anything deliberately set in Elementor still wins.
 */
function portfolio_external_links_new_tab( $html ) {
	if ( ! is_string( $html ) || false === stripos( $html, '<a ' ) ) {
		return $html;
	}

	return preg_replace_callback(
		'~<a\s([^>]*)>~i',
		function ( $m ) {
			$attrs = $m[1];

			// Respect an explicit target that's already there.
			if ( preg_match( '~\btarget\s*=~i', $attrs ) ) {
				return $m[0];
			}
			if ( ! preg_match( '~\bhref\s*=\s*("|\')(.*?)\1~i', $attrs, $h ) ) {
				return $m[0];
			}

			$url = trim( html_entity_decode( $h[2], ENT_QUOTES ) );

			// Only http(s) can be "another page" — skip #anchors, mailto:, tel:,
			// javascript:, and protocol-relative/relative paths (all internal).
			if ( ! preg_match( '~^https?://~i', $url ) ) {
				return $m[0];
			}

			$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
			if ( '' === $host || in_array( $host, portfolio_internal_hosts(), true ) ) {
				return $m[0];
			}

			$add = ' target="_blank"';
			if ( ! preg_match( '~\brel\s*=~i', $attrs ) ) {
				$add .= ' rel="noopener noreferrer"';
			}

			return '<a ' . $attrs . $add . '>';
		},
		$html
	);
}

// Every Elementor widget's markup passes through here — buttons, headings,
// text editors, images, and the shortcode widgets this site uses for its
// custom sections.
add_filter( 'elementor/widget/render_content', 'portfolio_external_links_new_tab', 20 );

// Safety net for anything rendered outside Elementor.
add_filter( 'the_content', 'portfolio_external_links_new_tab', 20 );
