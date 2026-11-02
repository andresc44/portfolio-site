<?php
/**
 * Cap the contact form's Message field at 2000 characters.
 *
 * Setting `maxlength` on the field in Elementor's own data did nothing -
 * this version of the form widget doesn't read that key for textareas
 * (verified: the rendered <textarea> came back with no maxlength at all),
 * so the limit is applied here instead.
 *
 * Two halves, because the attribute alone is not a limit:
 *  - the maxlength attribute stops typing/pasting past 2000 in the browser,
 *    which is the part a real person actually experiences;
 *  - the validation hook rejects anything longer server-side, which is what
 *    holds when the attribute is edited away or the POST is replayed
 *    directly. A bot doing the latter is the only way to hit it.
 */

define( 'PORTFOLIO_MESSAGE_MAX', 2000 );

// --- browser-side: add the attribute to the rendered textarea ---
add_filter( 'elementor/widget/render_content', function ( $html, $widget = null ) {
	if ( ! is_string( $html ) || false === stripos( $html, '<textarea' ) ) {
		return $html;
	}
	return preg_replace_callback(
		'~<textarea\b(?![^>]*\bmaxlength=)([^>]*)>~i',
		function ( $m ) {
			return '<textarea maxlength="' . PORTFOLIO_MESSAGE_MAX . '"' . $m[1] . '>';
		},
		$html
	);
}, 7, 2 ); // after the image/src rewrites (6), before the external-link pass (20)

// --- server-side: reject an over-long message even if the attribute is gone ---
add_action( 'elementor_pro/forms/validation', function ( $record, $ajax_handler ) {
	foreach ( $record->get_field( array( 'type' => 'textarea' ) ) as $id => $field ) {
		if ( mb_strlen( (string) $field['value'] ) > PORTFOLIO_MESSAGE_MAX ) {
			$ajax_handler->add_error(
				$id,
				sprintf( 'Please keep your message under %d characters.', PORTFOLIO_MESSAGE_MAX )
			);
		}
	}
}, 10, 2 );
