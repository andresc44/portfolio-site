<?php
/**
 * Home page hero: [portfolio_hero]
 *
 * A circuit-board themed hero rendered with zero JavaScript, so it costs
 * nothing on the main thread:
 *  - the PCB traces are one static SVG (rasterised once, never repainted)
 *  - the travelling "signal" pulses use SVG <animateMotion> along those same
 *    paths, so the path data isn't duplicated
 *  - every other moving part animates only transform/opacity, which the
 *    compositor handles off the main thread
 *  - the role rotator is a pure CSS keyframe loop
 *  - deliberately always animates, prefers-reduced-motion included - the
 *    site owner's explicit choice; see hero.css for the fuller note
 *
 * The headline stats are read from the database so they can't drift out of
 * date, and cached in a transient so the homepage doesn't pay for the query.
 */

add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_front_page() ) {
		return;
	}
	$dir = WPMU_PLUGIN_DIR . '/portfolio-hero';
	$url = WPMU_PLUGIN_URL . '/portfolio-hero';
	wp_enqueue_style( 'portfolio-hero', $url . '/hero.css', array(), filemtime( $dir . '/hero.css' ) );
} );

/**
 * Real numbers, straight from the taxonomy counts. Each project carries
 * exactly one top-level category, so those counts sum to the project total.
 */
function portfolio_hero_stats() {
	$cached = get_transient( 'portfolio_hero_stats' );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	$domains  = array( 9, 14, 17, 20 ); // Robotics, Programming, Electrical/Embedded, Mechanical
	$projects = 0;
	foreach ( $domains as $term_id ) {
		$term = get_term( $term_id, 'category' );
		if ( $term && ! is_wp_error( $term ) ) {
			$projects += (int) $term->count;
		}
	}

	$skills = wp_count_terms( array( 'taxonomy' => 'post_tag', 'hide_empty' => true ) );
	$skills = is_wp_error( $skills ) ? 0 : (int) $skills;

	$stats = array(
		'projects'    => $projects,
		'disciplines' => count( $domains ),
		'skills'      => $skills,
	);
	set_transient( 'portfolio_hero_stats', $stats, 6 * HOUR_IN_SECONDS );
	return $stats;
}

add_shortcode( 'portfolio_hero', function () {
	$stats = portfolio_hero_stats();

	// PCB traces. Orthogonal runs with 45-degree elbows, the way real board
	// routing looks. Kept out of the middle so the headline stays readable.
	$traces = array(
		'l1' => 'M-20 130 H110 L170 190 H310 L350 230 H460',
		'l2' => 'M-20 316 H86 L146 256 H296 L336 296 H424',
		'l3' => 'M-20 520 H150 L210 580 H326',
		'l4' => 'M-20 706 H76 L136 646 H250 L290 686 H396',
		'l5' => 'M118 920 V806 L178 746 V646 H296',
		'l6' => 'M316 920 V842 H430 L470 802 H556',
		'l7' => 'M56 -20 V76 L116 136 V232 H226',
		'l8' => 'M246 -20 V56 H376 L416 96 V188',
		'r1' => 'M1460 158 H1322 L1262 218 H1122 L1082 178 H992',
		'r2' => 'M1460 362 H1300 L1250 312 H1118',
		'r3' => 'M1460 556 H1358 L1298 616 H1168 L1128 576 H1042',
		'r4' => 'M1460 742 H1282 L1232 692 H1112',
		'r5' => 'M1330 920 V818 L1270 758 V658 H1150',
		'r6' => 'M1184 -20 V68 L1134 118 V210 H1024',
		'r7' => 'M1376 -20 V58 H1460',
		'r8' => 'M1460 458 H1402 V398 H1292 L1252 438 H1182',
		'c1' => 'M520 920 V860 H700 L740 820 H864',
		'c2' => 'M980 920 V872 H862',
		// Long buses that carry most of the travelling pulses.
		'b1' => 'M-20 246 H404 L464 186 H962 L1022 246 H1460',
		'b2' => 'M-20 648 H372 L432 708 H996 L1056 648 H1460',
		'b3' => 'M-20 430 H250 L310 370 H520',
		'b4' => 'M1460 430 H1190 L1130 370 H920',
	);

	$vias = array(
		array( 460, 230 ), array( 424, 296 ), array( 326, 580 ), array( 396, 686 ),
		array( 296, 646 ), array( 556, 802 ), array( 226, 232 ), array( 416, 188 ),
		array( 992, 178 ), array( 1118, 312 ), array( 1042, 576 ), array( 1112, 692 ),
		array( 1150, 658 ), array( 1024, 210 ), array( 1182, 438 ), array( 864, 820 ),
		array( 520, 186 ), array( 962, 186 ), array( 250, 430 ), array( 920, 370 ),
	);

	// Negative begins start each pulse part-way through, so the board already
	// looks "powered up" on the first frame instead of filling in gradually.
	// These live in their own SVG (see below) so their motion never
	// invalidates the static board underneath.
	$sparks = array(
		array( 'b1', '6.5s',  '-0.4s', 'a' ),
		array( 'b1', '6.5s',  '-3.6s', 'b' ),
		array( 'b2', '7.5s',  '-1.2s', 'c' ),
		array( 'b2', '7.5s',  '-4.9s', 'a' ),
		array( 'b3', '4.5s',  '-2.6s', 'a' ),
		array( 'b4', '5s',    '-0.9s', 'b' ),
		array( 'l1', '5s',    '-3.3s', 'a' ),
		array( 'r3', '6s',    '-1.8s', 'b' ),
	);

	$resume_url  = 'https://drive.google.com/file/d/1Sc4fiM9ZWy-ZD_INnmEIoBPNm7oMSDSU/view';
	$roles       = array( 'Robotics Engineer', 'Data Scientist', 'Software Developer', 'Backpacker', 'Canadian', 'Colombian' );

	ob_start();
	?>
	<section class="hx">
		<div class="hx__layer hx__board" aria-hidden="true">
			<svg class="hx__pcb" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" focusable="false">
				<defs>
					<?php foreach ( $traces as $id => $d ) : ?>
						<path id="hx-<?php echo esc_attr( $id ); ?>" d="<?php echo esc_attr( $d ); ?>"/>
					<?php endforeach; ?>
					<radialGradient id="hxSparkA"><stop offset="0%" stop-color="#34D399" stop-opacity=".95"/><stop offset="100%" stop-color="#34D399" stop-opacity="0"/></radialGradient>
					<radialGradient id="hxSparkB"><stop offset="0%" stop-color="#5B7FFF" stop-opacity=".95"/><stop offset="100%" stop-color="#5B7FFF" stop-opacity="0"/></radialGradient>
					<radialGradient id="hxSparkC"><stop offset="0%" stop-color="#4CC6F5" stop-opacity=".95"/><stop offset="100%" stop-color="#4CC6F5" stop-opacity="0"/></radialGradient>
				</defs>

				<!-- Wide soft stroke under a thin bright stroke fakes a glow
				     without an SVG filter, which would cost far more. -->
				<g class="hx__halo" fill="none" stroke="#34D399" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
					<?php foreach ( $traces as $id => $d ) : ?>
						<use href="#hx-<?php echo esc_attr( $id ); ?>" xlink:href="#hx-<?php echo esc_attr( $id ); ?>"/>
					<?php endforeach; ?>
				</g>
				<g class="hx__wire" fill="none" stroke="#7fd8c0" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
					<?php foreach ( $traces as $id => $d ) : ?>
						<use href="#hx-<?php echo esc_attr( $id ); ?>" xlink:href="#hx-<?php echo esc_attr( $id ); ?>"/>
					<?php endforeach; ?>
				</g>

				<g class="hx__vias">
					<?php foreach ( $vias as $v ) : ?>
						<circle class="hx__via" cx="<?php echo (int) $v[0]; ?>" cy="<?php echo (int) $v[1]; ?>" r="4.4"/>
					<?php endforeach; ?>
				</g>
			</svg>
		</div>

		<!-- Moving parts only. Keeping them in a separate, near-empty SVG means
		     a pulse repaint never re-rasterises the 22 stroked traces above. -->
		<div class="hx__layer hx__sparklayer" aria-hidden="true">
			<svg class="hx__pcb" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" focusable="false">
				<defs>
					<?php
					$spark_paths = array_unique( wp_list_pluck( $sparks, 0 ) );
					foreach ( $spark_paths as $pid ) :
						?>
						<path id="hxm-<?php echo esc_attr( $pid ); ?>" d="<?php echo esc_attr( $traces[ $pid ] ); ?>"/>
					<?php endforeach; ?>
					<radialGradient id="hxSparkA"><stop offset="0%" stop-color="#34D399" stop-opacity=".95"/><stop offset="100%" stop-color="#34D399" stop-opacity="0"/></radialGradient>
					<radialGradient id="hxSparkB"><stop offset="0%" stop-color="#5B7FFF" stop-opacity=".95"/><stop offset="100%" stop-color="#5B7FFF" stop-opacity="0"/></radialGradient>
					<radialGradient id="hxSparkC"><stop offset="0%" stop-color="#4CC6F5" stop-opacity=".95"/><stop offset="100%" stop-color="#4CC6F5" stop-opacity="0"/></radialGradient>
				</defs>
				<g class="hx__sparks">
					<?php foreach ( $sparks as $s ) :
						list( $path, $dur, $begin, $tone ) = $s; ?>
						<g class="hx__spark">
							<circle r="14" fill="url(#hxSpark<?php echo strtoupper( esc_attr( $tone ) ); ?>)"/>
							<circle r="3.2" fill="#ffffff"/>
							<animateMotion dur="<?php echo esc_attr( $dur ); ?>" begin="<?php echo esc_attr( $begin ); ?>" repeatCount="indefinite" calcMode="linear">
								<mpath href="#hxm-<?php echo esc_attr( $path ); ?>" xlink:href="#hxm-<?php echo esc_attr( $path ); ?>"/>
							</animateMotion>
						</g>
					<?php endforeach; ?>
				</g>
			</svg>
		</div>

		<div class="hx__layer hx__grid" aria-hidden="true"></div>
		<div class="hx__layer hx__aurora" aria-hidden="true"></div>
		<div class="hx__layer hx__spot" aria-hidden="true"></div>
		<div class="hx__frame" aria-hidden="true"></div>

		<div class="hx__inner">
			<p class="hx__eyebrow hx__fx" style="--s:0">Hi, I&rsquo;m</p>

			<h1 class="hx__name hx__fx" style="--s:1">Andrés Cervera Rozo</h1>

			<p class="hx__roles hx__fx" style="--s:2">
				<span class="hx__bracket">[</span><span class="hx__rotator"><span class="hx__roll">
					<?php foreach ( $roles as $role ) : ?>
						<span><?php echo esc_html( $role ); ?></span>
					<?php endforeach; ?>
					<span><?php echo esc_html( $roles[0] ); ?></span>
				</span></span><span class="hx__bracket">]</span>
			</p>

			<p class="hx__tagline hx__fx" style="--s:3">Designing autonomous systems where intelligent software meets real&#8209;world hardware.</p>

			<div class="hx__actions hx__fx" style="--s:4">
				<a class="hx__btn hx__btn--primary" href="<?php echo esc_url( $resume_url ); ?>" target="_blank" rel="noopener">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
					Download Resume
				</a>
				<a class="hx__btn hx__btn--ghost" href="#contact">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/></svg>
					Contact Me
				</a>
			</div>

			<ul class="hx__stats hx__fx" style="--s:5">
				<li><b><?php echo (int) $stats['projects']; ?></b><span>Projects</span></li>
				<li><b><?php echo (int) $stats['disciplines']; ?></b><span>Disciplines</span></li>
				<li><b><?php echo (int) $stats['skills']; ?></b><span>Tools &amp; Skills</span></li>
			</ul>
		</div>

		<a class="hx__scroll" href="#about-me" aria-label="Scroll to About Me">
			<span class="hx__mouse"><i></i></span>
		</a>
	</section>
	<?php
	return ob_get_clean();
} );
