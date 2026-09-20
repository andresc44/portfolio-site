<?php
/**
 * The site's mobile header bar (Elementor header template, element 28df713)
 * has a -75px bottom margin on mobile that pulls page content up underneath
 * its own solid, z-index:99 background. On the homepage this is absorbed by
 * generous hero padding, but on project detail pages it hides the "Category
 * List" breadcrumb widget (jkit_category_list) that sits right below the
 * header, since that widget has almost no top padding of its own.
 *
 * Rather than changing the shared header template (which could affect the
 * intended overlap look on other pages), restore 75px of clearance just for
 * this widget on single project posts, where it's needed.
 */

add_action( 'wp_head', function () {
	if ( ! is_singular( 'post' ) ) {
		return;
	}
	?>
	<style id="project-breadcrumb-mobile-fix">
		@media (max-width: 767px) {
			body.single-post .elementor-widget-jkit_category_list {
				margin-top: 75px !important;
			}
		}
	</style>
	<?php
} );
