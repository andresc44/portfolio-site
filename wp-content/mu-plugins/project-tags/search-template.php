<?php
/**
 * Search results: same site-styled preview cards as the tag archive pages,
 * restricted to real project write-ups only (see the is_search() branch of
 * pre_get_posts in project-tags.php — no generic pages, no homepage-only
 * duplicate posts).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$search_query = get_search_query();
get_header();
?>
<main class="project-archive">
	<div class="project-archive__header">
		<h1 class="project-archive__title">Search results</h1>
		<p class="project-archive__count">
			<?php
			if ( have_posts() ) {
				$count = $wp_query->found_posts;
				echo esc_html( ( $count === 1 ? '1 project' : "$count projects" ) . ' matching &#8220;' . $search_query . '&#8221;' );
			} else {
				echo 'No projects matching &#8220;' . esc_html( $search_query ) . '&#8221;';
			}
			?>
		</p>
	</div>

	<?php if ( have_posts() ) : ?>
		<div class="project-archive__list">
			<?php while ( have_posts() ) : the_post();
				$pair = portfolio_get_post_category_pair( get_the_ID() );
				?>
				<a class="project-archive__card" href="<?php the_permalink(); ?>">
					<div class="project-archive__card-media">
						<?php echo get_the_post_thumbnail( get_the_ID(), 'medium_large', array( 'loading' => 'lazy' ) ); ?>
					</div>
					<div class="project-archive__card-body">
						<?php if ( $pair['category'] ) : ?>
							<span class="project-archive__card-cat">
								<?php
								echo esc_html( html_entity_decode( $pair['category']->name, ENT_QUOTES ) );
								if ( $pair['subcategory'] ) {
									echo ' &middot; ' . esc_html( html_entity_decode( $pair['subcategory']->name, ENT_QUOTES ) );
								}
								?>
							</span>
						<?php endif; ?>
						<h2 class="project-archive__card-title"><?php the_title(); ?></h2>
						<p class="project-archive__card-excerpt"><?php echo esc_html( get_the_excerpt() ); ?></p>
					</div>
				</a>
			<?php endwhile; ?>
		</div>
	<?php else : ?>
		<p class="project-archive__empty">Try a different search &mdash; e.g. a language, tool, or robotics topic like &#8220;SLAM&#8221; or &#8220;PyTorch&#8221;.</p>
	<?php endif; ?>
</main>
<?php
get_footer();
