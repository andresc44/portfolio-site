<?php
/**
 * Plugin Feed Class
 *
 * Fetches and suggests related plugins in the "Featured" tab of the plugin installer.
 *
 * @package Smooth_Back_To_Top_Button
 * @since 1.3.1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'SBTTB_Plugin_Feed' ) ) {
	class SBTTB_Plugin_Feed {

		/**
		 * Suggested plugin slugs
		 *
		 * @var array
		 */
		private $plugin_slugs = array();

		/**
		 * Constructor
		 */
		public function __construct() {
			if ( ! is_admin() || ! class_exists( 'WooCommerce' ) ) {
				return;
			}

			// Define default suggested plugins
			$this->plugin_slugs = apply_filters( 'sbttb_suggested_plugins', array(
				'quick-buy-now-button-for-woocommerce',
				'disable-variable-product-price-range-show-only-lowest-price-in-variable-products',
				'advanced-google-recaptcha-for-woocommerce',
			) );

			add_action( 'init', array( $this, 'init' ) );
		}

		/**
		 * Initialize hooks
		 */
		public function init() {
			add_action( 'admin_init', array( $this, 'admin_init' ) );
		}

		/**
		 * Admin initialize hooks
		 */
		public function admin_init() {
			if ( ! current_user_can( 'install_plugins' ) ) {
				return;
			}

			add_filter( 'install_plugins_table_api_args_featured', array( $this, 'featured_plugins_tab' ) );
		}


		/**
		 * Add plugins to the featured plugins tab
		 *
		 * @param array $args API args.
		 * @return array
		 */
		public function featured_plugins_tab( $args ) {
			add_filter( 'plugins_api_result', array( $this, 'plugins_api_result' ), 10, 3 );
			return $args;
		}

		/**
		 * Modify the plugins API result to include our suggestions
		 *
		 * @param object $res    Response object.
		 * @param string $action Action type.
		 * @param object $args   Arguments.
		 * @return object
		 */
		public function plugins_api_result( $res, $action, $args ) {
			// Remove the filter to avoid infinite loops or multiple executions
			remove_filter( 'plugins_api_result', array( $this, 'plugins_api_result' ), 10 );

			if ( ! isset( $res->plugins ) || ! is_array( $res->plugins ) ) {
				$res->plugins = array();
			}

			foreach ( $this->plugin_slugs as $slug ) {
				// Skip if the plugin is already active
				if ( $this->is_plugin_active( $slug ) ) {
					continue;
				}

				// Check if already in the list to avoid duplicates
				if ( $this->is_slug_in_result( $slug, $res->plugins ) ) {
					continue;
				}

				$plugin_info = $this->get_plugin_info( $slug );

				if ( $plugin_info && ! is_wp_error( $plugin_info ) ) {
					// Add to the top of the list
					array_unshift( $res->plugins, $plugin_info );
				}
			}

			return $res;
		}

		/**
		 * Check if a plugin is active by its slug
		 *
		 * @param string $slug Plugin slug.
		 * @return bool
		 */
		private function is_plugin_active( $slug ) {
			if ( ! function_exists( 'is_plugin_active' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}

			// We only have the slug, so we need to find the main file path
			$plugins = get_plugins();
			foreach ( $plugins as $path => $data ) {
				if ( dirname( $path ) === $slug || ( strpos( $path, '/' ) === false && $path === $slug . '.php' ) ) {
					return is_plugin_active( $path );
				}
			}

			return false;
		}

		/**
		 * Check if a slug is already in the API result
		 *
		 * @param string $slug    Plugin slug.
		 * @param array  $plugins List of plugins.
		 * @return bool
		 */
		private function is_slug_in_result( $slug, $plugins ) {
			foreach ( $plugins as $plugin ) {
				if ( is_object( $plugin ) && isset( $plugin->slug ) && $plugin->slug === $slug ) {
					return true;
				}
				if ( is_array( $plugin ) && isset( $plugin['slug'] ) && $plugin['slug'] === $slug ) {
					return true;
				}
			}
			return false;
		}

		/**
		 * Get plugin information from WP.org API with caching
		 *
		 * @param string $slug Plugin slug.
		 * @return object|bool
		 */
		private function get_plugin_info( $slug ) {
			$transient_key = 'sbttb_info_' . substr( $slug, 0, 40 ); // Limit length for safety
			$plugin_info   = get_transient( $transient_key );

			if ( false === $plugin_info ) {
				require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

				$plugin_info = plugins_api( 'plugin_information', array(
					'slug'   => $slug,
					'is_ssl' => is_ssl(),
					'fields' => array(
						'banners'           => true,
						'reviews'           => true,
						'downloaded'        => true,
						'active_installs'   => true,
						'icons'             => true,
						'short_description' => true,
					),
				) );

				if ( ! is_wp_error( $plugin_info ) ) {
					set_transient( $transient_key, $plugin_info, DAY_IN_SECONDS * 7 );
				}
			}

			return $plugin_info;
		}
	}

	new SBTTB_Plugin_Feed();
}
