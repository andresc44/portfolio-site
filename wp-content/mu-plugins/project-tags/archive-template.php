<?php
/**
 * Tag archive: dark-themed grid of project preview cards, reusing each
 * project's post_excerpt (the same short preview text used everywhere else
 * on the site) plus its category/subcategory.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$term = get_queried_object();
get_header();
?>
<main class="project-archive">
	<a class="project-archive__back" href="<?php echo esc_url( home_url( '/skills-tools/' ) ); ?>">&larr; Back to Skills &amp; Tools</a>
	<div class="project-archive__header">
		<h1 class="project-archive__title"><?php echo esc_html( html_entity_decode( $term->name, ENT_QUOTES ) ); ?></h1>
		<p class="project-archive__count">
			<?php
			$count = (int) $term->count;
			echo esc_html( $count === 1 ? '1 project uses this' : "$count projects use this" );
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
		<p class="project-archive__empty">No projects tagged with this yet.</p>
	<?php endif; ?>
</main>
<?php
get_footer();
