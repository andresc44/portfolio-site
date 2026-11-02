<?php
/**
 * Keep a post's saved revisions to a sensible number.
 *
 * Every save of an Elementor page stores a full copy of its layout as a revision;
 * with no limit the database had grown to 1,155 revisions (about 30 MB) across
 * 78 posts, all of it loaded into every backup and every transfer. Visitors never
 * see revisions, so this changes nothing on the site; the editor still has the
 * ten most recent versions of each page to roll back to.
 */
add_filter( 'wp_revisions_to_keep', function () {
	return 10;
} );
