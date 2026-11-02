<?php
/**
 * [current_year] - the footer's "© <year> Andrés Cervera Rozo" text was a
 * hard-coded year inside the Elementor footer template, so it quietly went
 * stale every January. The shortcode lets the footer text stay as ordinary
 * Elementor text-editor content (still editable in the builder) while the
 * year itself never needs a manual update again.
 */
add_shortcode( 'current_year', function () {
	return esc_html( wp_date( 'Y' ) );
} );
