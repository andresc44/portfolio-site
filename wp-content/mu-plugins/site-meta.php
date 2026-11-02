<?php
/**
 * Link-preview text and the Skills & Education address.
 *
 * 1. When the site's address is pasted into Teams, Slack, LinkedIn, iMessage,
 *    WhatsApp and the like, those apps read the page's Open Graph / Twitter
 *    tags (and fall back to the meta description). The site had none, so they
 *    showed nothing useful. Every page now says the same thing underneath its
 *    own title.
 *
 * 2. The Skills & Education page used to live at /skills-tools/ (and
 *    /skills-education/ was discussed before it was renamed). It is now
 *    /skills-education/; anything still pointing at the old address - a saved
 *    link, a shared URL, an old menu in a cached page - is sent there with a
 *    permanent redirect.
 */

const SITE_META_DESCRIPTION = 'Engineering Portfolio for Andrés Cervera Rozo';

// The picture beside the text in a link preview: a 1200x630 screenshot of the
// home page's opening screen (the circuit board, name and tagline) - the exact
// size and shape these previews use. It is a still image, so if the hero's
// design changes it has to be retaken (see the note in the project memory).
const SITE_META_IMAGE = '/uploads/2026/10/og-home-hero.jpg';

add_action( 'template_redirect', function () {
	$path = isset( $_SERVER['REQUEST_URI'] ) ? wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH ) : '';
	$home = wp_parse_url( home_url( '/' ), PHP_URL_PATH );
	$rel  = trim( substr( (string) $path, strlen( (string) $home ) ), '/' );
	if ( 'skills-tools' === $rel ) {
		$query = isset( $_SERVER['QUERY_STRING'] ) && $_SERVER['QUERY_STRING'] ? '?' . wp_unslash( $_SERVER['QUERY_STRING'] ) : '';
		wp_safe_redirect( home_url( '/skills-education/' ) . $query, 301 );
		exit;
	}
}, 1 );

// Early in <head>, so a crawler that stops reading after a few KB still gets them.
add_action( 'wp_head', function () {
	$desc  = SITE_META_DESCRIPTION;
	$title = wp_get_document_title();
	$url   = is_singular() ? get_permalink() : home_url( '/' );
	if ( is_front_page() ) { $url = home_url( '/' ); }
	echo "\n<meta name=\"description\" content=\"" . esc_attr( $desc ) . "\" />\n";
	echo '<meta property="og:type" content="website" />' . "\n";
	echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '" />' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $title ) . '" />' . "\n";
	echo '<meta property="og:description" content="' . esc_attr( $desc ) . '" />' . "\n";
	echo '<meta property="og:url" content="' . esc_url( $url ) . '" />' . "\n";
	$img = content_url( SITE_META_IMAGE );
	echo '<meta property="og:image" content="' . esc_url( $img ) . '" />' . "\n";
	echo '<meta property="og:image:width" content="1200" />' . "\n";
	echo '<meta property="og:image:height" content="630" />' . "\n";
	echo '<meta property="og:image:alt" content="Andrés Cervera Rozo - Engineering Portfolio" />' . "\n";
	echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
	echo '<meta name="twitter:image" content="' . esc_url( $img ) . '" />' . "\n";
	echo '<meta name="twitter:title" content="' . esc_attr( $title ) . '" />' . "\n";
	echo '<meta name="twitter:description" content="' . esc_attr( $desc ) . '" />' . "\n";
}, 1 );
