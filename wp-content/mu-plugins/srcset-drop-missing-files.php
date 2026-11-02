<?php
/**
 * Plugin Name: Portfolio - Drop srcset candidates with no file on disk
 * Description: Keeps responsive image markup from advertising intermediate sizes that were never written to disk.
 *
 * Attachment metadata can declare intermediate sizes that do not exist as
 * files - 54 of them were found across this library, every one flagged
 * 'virtual', and they 404'd on both Local and production. WordPress still
 * lists them in srcset, so a device that picks one (a phone at DPR 2 reaching
 * for the 768w candidate, say) renders a broken image. The certification
 * cards on the Skills & Tools page failed exactly this way on mobile.
 *
 * The existing files have since been generated, so this is a guard rather
 * than the fix: if a future upload fails to produce its derivatives, images
 * quietly fall back to a size that exists instead of breaking.
 *
 * @package Portfolio
 */

defined( 'ABSPATH' ) || exit;

/**
 * file_exists() memoised for the duration of the request, since one page can
 * ask about the same candidate many times over.
 *
 * @param string $path Absolute path to check.
 * @return bool
 */
function portfolio_srcset_file_exists( $path ) {
	static $seen = array();
	if ( ! isset( $seen[ $path ] ) ) {
		$seen[ $path ] = file_exists( $path );
	}
	return $seen[ $path ];
}

add_filter(
	'wp_calculate_image_srcset',
	/**
	 * @param array $sources    Candidates keyed by width.
	 * @param array $size_array Requested size.
	 * @param string $image_src Source URL.
	 * @param array $image_meta Attachment metadata.
	 * @return array
	 */
	function ( $sources, $size_array, $image_src, $image_meta ) {
		if ( empty( $sources ) || ! is_array( $sources ) ) {
			return $sources;
		}

		$uploads = wp_get_upload_dir();
		if ( ! empty( $uploads['error'] ) || empty( $uploads['basedir'] ) ) {
			return $sources;
		}

		$subdir = empty( $image_meta['file'] ) ? '' : dirname( $image_meta['file'] );
		$base   = trailingslashit( $uploads['basedir'] );
		if ( '' !== $subdir && '.' !== $subdir ) {
			$base .= trailingslashit( $subdir );
		}

		$kept = array();
		foreach ( $sources as $width => $source ) {
			$file = wp_basename( (string) wp_parse_url( $source['url'], PHP_URL_PATH ) );
			if ( '' !== $file && portfolio_srcset_file_exists( $base . $file ) ) {
				$kept[ $width ] = $source;
			}
		}

		// A single remaining candidate is the same as the src, so drop the
		// attribute entirely rather than emitting a pointless one.
		return count( $kept ) > 1 ? $kept : array();
	},
	10,
	4
);
