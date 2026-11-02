<?php
/**
 * Keep every internal URL on whatever host is actually serving the page.
 *
 * Elementor stores link targets as absolute URLs, so a button authored on
 * production renders as https://andrescerverarozo.au/projects/ even when
 * you're browsing the Local copy - click "About Me" while developing and
 * you get thrown onto the live site. The reverse happens after a migration
 * that misses a URL: production links pointing back at *.local, which
 * simply don't resolve for a visitor.
 *
 * The existing per-feature rewrites (lightbox-image-urls.php for lightbox
 * hrefs, embedded-image-src-urls.php for raw <img src> in widget content)
 * each solved one slice of this. This closes the rest - nav menus, buttons,
 * in-content links, form actions, canonical/og tags, inline JSON configs -
 * by rewriting the finished page instead of guessing which filter each
 * link happened to pass through.
 *
 * Only the host swaps; paths, queries and fragments are untouched. On the
 * host the content was authored for this is a no-op, so it costs nothing
 * in production and does the work on every other environment.
 */

add_action( 'template_redirect', function () {
	// Front-end page renders only. The editor and REST/AJAX responses are
	// left alone: Elementor's preview iframe and its saved data both expect
	// the absolute URLs they were stored with.
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || ( defined( 'DOING_CRON' ) && DOING_CRON ) ) {
		return;
	}
	if ( isset( $_GET['elementor-preview'] ) || isset( $_GET['preview'] ) ) {
		return;
	}
	if ( ! function_exists( 'portfolio_internal_hosts' ) ) {
		return;
	}

	$here = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	if ( '' === $here ) {
		return;
	}

	$others = array();
	foreach ( portfolio_internal_hosts() as $host ) {
		$host = strtolower( $host );
		if ( '' !== $host && $host !== $here ) {
			$others[] = $host;
		}
	}
	if ( ! $others ) {
		return;
	}

	ob_start( function ( $html ) use ( $others, $here ) {
		if ( ! is_string( $html ) || '' === $html ) {
			return $html;
		}
		foreach ( $others as $host ) {
			// plain markup: href="https://host/..." and protocol-relative //host/...
			$html = str_replace( '//' . $host, '//' . $here, $html );
			// inline JSON / data attributes escape their slashes
			$html = str_replace( '\\/\\/' . $host, '\\/\\/' . $here, $html );
		}
		return $html;
	} );
}, 1 );
