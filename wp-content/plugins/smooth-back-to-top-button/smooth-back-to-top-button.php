<?php
/*
Plugin Name: Smooth Back To Top Button
Plugin URI: https://wordpress.org/plugins/smooth-back-to-top-button/
Description: The best WordPress smooth back to top button plugin with scroll progress indicator.
Author: Tanvirul Haque
Author URI: https://wpxpress.net/
Version: 1.3.2
Requires PHP: 7.4
Requires at least: 4.8
Tested up to: 7.1
Text Domain: smooth-back-to-top-button
Domain Path: /languages
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.txt
*/

// Don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main class
 * @since 1.0.0
 */
if ( ! class_exists( 'Smooth_Back_To_Top_Button' ) ) {
	class Smooth_Back_To_Top_Button {

		/**
		 * Version
		 *
		 * @since 1.0.0
		 * @var  string
		 */
		public $version = '1.3.2';

		/**
		 * The single instance of the class.
		 */
		protected static $instance = null;


		/**
		 * Constructor for the class
		 *
		 * Sets up all the appropriate hooks and actions
		 *
		 * @return void
		 * @since 1.0.0
		 *
		 */
		public function __construct() {
			// Define constants
			$this->define_constants();

			// Include required files
			$this->includes();

			// Initialize the action hooks
			$this->init_hooks();
		}


		/**
		 * Initializes the class
		 *
		 * Checks for an existing instance
		 * and if it doesn't find one, creates it.
		 *
		 * @return object Class instance
		 * @since 1.0.0
		 *
		 */
		public static function instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}


		/**
		 * Define constants
		 *
		 * @return void
		 * @since 1.0.0
		 *
		 */
		private function define_constants() {
			define( 'SBTTB_VERSION', $this->version );
			define( 'SBTTB_FILE', __FILE__ );
			define( 'SBTTB_DIR_PATH', plugin_dir_path( SBTTB_FILE ) );
			define( 'SBTTB_DIR_URI', plugin_dir_url( SBTTB_FILE ) );
			define( 'SBTTB_ADMIN', SBTTB_DIR_PATH . 'admin' );
			define( 'SBTTB_ASSETS', SBTTB_DIR_URI . 'assets' );
		}


		/**
		 * Include required files
		 *
		 * @return void
		 * @since 1.0.0
		 *
		 */
		private function includes() {
			if ( is_admin() ) {
				require_once SBTTB_ADMIN . '/class-sbttb_settings_api.php';
				require_once SBTTB_ADMIN . '/class-sbttb_settings.php';
				require_once SBTTB_ADMIN . '/class-sbttb_plugin_feed.php';
			}
		}


		/**
		 * Init Hooks
		 *
		 * @return void
		 * @since 1.0.0
		 *
		 */
		private function init_hooks() {
			add_action( 'init', array( $this, 'localization_setup' ) );
			add_action( 'wp_head', array( $this, 'internal_styles' ) );
			add_action( 'wp_footer', array( $this, 'add_markup' ) );
			add_action( 'wp_footer', array( $this, 'internal_scripts' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
            add_filter( 'plugin_row_meta', array( $this, 'plugin_row_meta' ), 10, 2 );
			add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( $this, 'plugin_settings_links' ) );

			$is_admin_enable = self::get_settings( 'is_admin_enable', 'off' );

			if ( 'on' == $is_admin_enable ) {
				add_action( 'admin_head', array( $this, 'internal_styles' ) );
				add_action( 'admin_footer', array( $this, 'add_markup' ) );
				add_action( 'admin_footer', array( $this, 'internal_scripts' ) );
			}
        }


		/**
		 * Initialize plugin for localization
		 *
		 * @return void
		 * @since 1.0.0
		 *
		 */
		public function localization_setup() {
			load_plugin_textdomain( 'smooth-back-to-top-button', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
		}


		/**
         * Add plugin row meta link
         */
        public function plugin_row_meta( $links, $file ) {
            if ( plugin_basename( SBTTB_FILE ) !== $file ) {
                return $links;
            }

            $report_url = 'https://wpxpress.net/submit-ticket/';
            $documentation_url = 'https://wpxpress.net/docs/';

            $row_meta['docs']    = sprintf( '<a target="_blank" href="%1$s" title="%2$s">%2$s</a>', esc_url( $documentation_url ), esc_html__( 'Docs', 'smooth-back-to-top-button' ) );
            $row_meta['support'] = sprintf( '<a target="_blank" href="%1$s">%2$s</a>', esc_url( $report_url ), esc_html__( 'Help &amp; Support', 'smooth-back-to-top-button' ) );

            return array_merge( $links, $row_meta );
        }


		/**
		 * Plugin action links
		 *
		 * @param array $links
		 *
		 * @return array
		 */
		public function plugin_settings_links( $links ) {
			$links[] = '<a href="' . admin_url( 'options-general.php?page=' ) . 'smooth-back-to-top">' . __( 'Settings', 'smooth-back-to-top-button' ) . '</a>';

			return $links;
		}


		public function enqueue_scripts() {
			$is_enable_btn = self::get_settings( 'is_enable_btn', 'on' );

			if ( $is_enable_btn != 'on' ) {
				return;
			}

			wp_register_style( 'sbttb-fonts', SBTTB_ASSETS . '/css/sbttb-fonts.css', array(), SBTTB_VERSION );
			wp_register_style( 'sbttb-style', SBTTB_ASSETS . '/css/smooth-back-to-top-button.css', array(), SBTTB_VERSION );
			wp_register_script( 'sbttb-script', SBTTB_ASSETS . '/js/smooth-back-to-top-button.js', array(), SBTTB_VERSION, true );

			wp_enqueue_style( 'sbttb-fonts' );
			wp_enqueue_style( 'sbttb-style' );
			wp_enqueue_script( 'sbttb-script' );
		}


		public function admin_enqueue_scripts() {
			$is_admin_enable = self::get_settings( 'is_admin_enable', 'off' );

            if ( 'on' == $is_admin_enable ) {
	            wp_register_style( 'sbttb-style', SBTTB_ASSETS . '/css/smooth-back-to-top-button.css', array(), SBTTB_VERSION );
	            wp_register_script( 'sbttb-script', SBTTB_ASSETS . '/js/smooth-back-to-top-button.js', array(), SBTTB_VERSION, true );

	            wp_enqueue_style( 'sbttb-style' );
	            wp_enqueue_script( 'sbttb-script' );
            }

			wp_register_style( 'sbttb-fonts', SBTTB_ASSETS . '/css/sbttb-fonts.css', array(), SBTTB_VERSION );
			wp_enqueue_style( 'sbttb-fonts' );
		}


		/**
		 * Get Settings Function
		 *
		 * @param $key
		 * @param mixed $default
		 * @param string $section
		 *
		 * @return mixed
		 */
		public static function get_settings( $key, $default = false, $section = 'sbttb_settings' ) {
			$settings = get_option( $section, [] );

			return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
		}


		/**
		 * Add Internal Style
		 */
		public function internal_styles() {
			$is_enable_btn = self::get_settings( 'is_enable_btn', 'on' );

			if ( $is_enable_btn != 'on' ) {
				return;
			}

			$icon_type			= self::get_settings( 'icon_type', 'arrow-up-light' );
			$margin_vertical	= absint( self::get_settings( 'button_margin_vertical', '50' ) );
			$margin_horizontal  = absint( self::get_settings( 'button_margin_horizontal', '50' ) );
			$button_size		= absint( self::get_settings( 'button_size', '46' ) );
			$border_size		= absint( self::get_settings( 'border_size', '2' ) );
			$icon_size			= absint( self::get_settings( 'icon_size', '24' ) );
			$progress_size		= absint( self::get_settings( 'progress_size', '4' ) );
			$button_color		= esc_attr( self::get_settings( 'button_color', '#000000' ) );
			$border_color		= esc_attr( self::get_settings( 'border_color', '#cccccc' ) );
			$icon_color			= esc_attr( self::get_settings( 'icon_color', '#1f2029' ) );
			$progress_color		= esc_attr( self::get_settings( 'progress_color', '#1f2029' ) );
			$hover_color		= esc_attr( self::get_settings( 'hover_color', '#1f2029' ) );
			$is_hide_mobile		= self::get_settings( 'hide_on_mobile', 'off' );
			$is_hide_tablet		= self::get_settings( 'hide_on_tablet', 'off' );
			$is_hide_desktop	= self::get_settings( 'hide_on_desktop', 'off' );
			$button_shape		= self::get_settings( 'button_shape', 'circle' );
			$custom_css			= wp_filter_nohtml_kses( self::get_settings( 'sbttb_custom_css', '' ) );

			switch ( $button_shape ) {
				case 'square':
					$border_radius = '0';
					break;
				case 'rounded-square':
					$border_radius = '8px';
					break;
				default:
					$border_radius = $button_size . 'px';
					break;
			}

			switch ( $icon_type ) {
				case 'arrow-up-bold' :
					$icon = '\e911';
					break;
				case 'angle-double-up-black' :
					$icon = '\e908';
					break;
				case 'angle-up' :
					$icon = '\e90c';
					break;
				case 'angle-double-up' :
					$icon = '\e90a';
					break;
				case 'finger-up' :
					$icon = '\e904';
					break;
				case 'finger-up-o' :
					$icon = '\e905';
					break;
				default:
					$icon = '\e900';
			}
			?>

            <style type="text/css">
                .smooth-back-to-top-button {
                    bottom: <?php echo $margin_vertical; ?>px;
                    height: <?php echo $button_size; ?>px;
                    width: <?php echo $button_size; ?>px;
                    border-radius: <?php echo $border_radius; ?>;
                    background-color: <?php echo $button_color; ?>;
                    box-shadow: inset 0 0 0 <?php echo $border_size; ?>px <?php echo $border_color; ?>;
                }

                .smooth-back-to-top-button.btn-left-side {
                    left: <?php echo $margin_horizontal; ?>px;
                }

                .smooth-back-to-top-button.btn-right-side {
                    right: <?php echo $margin_horizontal; ?>px;
                }

				.smooth-back-to-top-button.btn-center {
					inset-inline: 0;
					margin-inline: auto;
				}

                .smooth-back-to-top-button::after {
                    height: 100%;
                    color: <?php echo $icon_color; ?>;
                    font-size: <?php echo $icon_size; ?>px;
                    content: '<?php echo $icon; ?>';
                    line-height: normal;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .smooth-back-to-top-button:hover::after {
                    color: <?php echo $hover_color; ?>;
                }

                .smooth-back-to-top-button svg.progress-circle path,
                .smooth-back-to-top-button svg.progress-circle rect {
                    stroke: <?php echo $progress_color; ?>;
                    stroke-width: <?php echo $progress_size; ?>px;
                    z-index: 5;
                }

                <?php echo $custom_css ? $custom_css : ''; ?>

                <?php if ( $is_hide_tablet == 'on' ) { ?>
                @media only screen and (min-width: 768px) and (max-width: 991px) {
                    .smooth-back-to-top-button {
                        display: none;
                    }
                }
                <?php } ?>

                <?php if ( $is_hide_mobile == 'on' ) { ?>
                @media only screen and (max-width: 767px) {
                    .smooth-back-to-top-button {
                        display: none;
                    }
                }
                <?php } ?>

                <?php if ( $is_hide_desktop == 'on' ) { ?>
                @media only screen and (min-width: 992px) {
                    .smooth-back-to-top-button {
                        display: none;
                    }
                }
                <?php } ?>

            </style>

			<?php
		}


		/**
		 * Add Internal JavaScript
		 */
		public function internal_scripts() {
			$is_enable_btn = self::get_settings( 'is_enable_btn', 'on' );

			if ( $is_enable_btn != 'on' ) {
				return;
			}

			$button_offset   = absint( self::get_settings( 'button_offset', '50' ) );
			$scroll_duration = absint( self::get_settings( 'scroll_duration', '500' ) );
			?>

            <script type="text/javascript" data-no-optimize="1">
                (function () {
                    var offset = <?php echo $button_offset; ?>;
                    var duration = <?php echo $scroll_duration; ?>;

                    function initButton() {
                        var buttonWrap = document.querySelector('.smooth-back-to-top-button');
                        if (!buttonWrap) return;

                        window.addEventListener('scroll', function () {
                            if (window.scrollY > offset) {
                                buttonWrap.classList.add('active-progress');
                            } else {
                                buttonWrap.classList.remove('active-progress');
                            }
                        });

                        buttonWrap.addEventListener('click', function (e) {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });

                        buttonWrap.addEventListener('keydown', function (e) {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });
                    }

                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', initButton);
                    } else {
                        initButton();
                    }
                })();
            </script>

			<?php
		}


		/**
		 * Add Markup
		 */
		public function add_markup() {
			$is_enable_btn = self::get_settings( 'is_enable_btn', 'on' );

			if ( $is_enable_btn != 'on' ) {
				return;
			}

			$size               = absint( self::get_settings( 'progress_size', '2' ) );
			$view_box           = '-' . $size / 2 . ' -' . $size / 2 . ' ' . ( 100 + $size ) . ' ' . ( 100 + $size );
			$button_position    = self::get_settings( 'button_position', 'right-side' );
			$is_enable_progress = self::get_settings( 'is_enable_progress', 'on' );
			//$position_class     = ( $button_position == 'left-side' ) ? 'btn-left-side' : 'btn-right-side';
			?>

            <div class="smooth-back-to-top-button <?php echo 'btn-' . $button_position; ?>" role="button" tabindex="0" aria-label="<?php esc_attr_e( 'Back to top', 'smooth-back-to-top-button' ); ?>">
				<?php if ( $is_enable_progress == 'on' ) { 
					$button_shape = self::get_settings( 'button_shape', 'circle' );
					?>
                    <svg class="progress-circle" width="100%" height="100%" viewBox="<?php echo $view_box; ?>" aria-hidden="true">
						<?php if ( 'circle' !== $button_shape ) : ?>
							<rect x="1" y="1" width="98" height="98" rx="<?php echo 'rounded-square' === $button_shape ? '15' : '0'; ?>" fill="none" />
						<?php else : ?>
							<path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"/>
						<?php endif; ?>
                    </svg>
				<?php } ?>
            </div>

			<?php
		}

	}
}


/**
 * Initialize the plugin
 *
 * @return object
 */
function smooth_back_to_top_button() {
	return Smooth_Back_To_Top_Button::instance();
}

// Activation redirect
register_activation_hook( __FILE__, function () {
	set_transient( 'sbttb_activation_redirect', true, 30 );
} );

// Kick Off
smooth_back_to_top_button();
