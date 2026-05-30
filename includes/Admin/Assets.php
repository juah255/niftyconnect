<?php
/**
 * Admin assets.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Admin;

use NiftyConnect\Support\Feature_Registry;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueues admin React assets.
 */
final class Assets {
	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ) );
	}

	/**
	 * Enqueue admin app assets.
	 *
	 * @param string $hook Current admin hook.
	 * @return void
	 */
	public function enqueue( $hook ) {
		if ( 'toplevel_page_' . Menu::SLUG !== $hook ) {
			return;
		}

		$asset_file = NIFTYCONNECT_DIR . 'build/admin.asset.php';
		$asset      = file_exists( $asset_file )
			? include $asset_file
			: array(
				'dependencies' => array( 'wp-element', 'wp-i18n', 'wp-api-fetch' ),
				'version'      => NIFTYCONNECT_VERSION,
			);
		$css_file   = NIFTYCONNECT_DIR . 'build/admin.css';
		$css_url    = file_exists( $css_file )
			? NIFTYCONNECT_URL . 'build/admin.css'
			: NIFTYCONNECT_URL . 'assets/css/admin.css';
		$css_ver    = file_exists( $css_file ) ? $asset['version'] : NIFTYCONNECT_VERSION;

		wp_enqueue_style(
			'niftyconnect-admin',
			$css_url,
			array(),
			$css_ver
		);

		wp_enqueue_script(
			'niftyconnect-admin',
			NIFTYCONNECT_URL . 'build/admin.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( 'niftyconnect-admin', 'niftyconnect', NIFTYCONNECT_DIR . 'languages' );

		wp_add_inline_script(
			'niftyconnect-admin',
			'window.NiftyConnect = ' . wp_json_encode(
				array(
					'restUrl'           => esc_url_raw( rest_url( 'niftyconnect/v1' ) ),
					'nonce'             => wp_create_nonce( 'wp_rest' ),
					'adminUrl'          => esc_url_raw( admin_url() ),
					'woocommerceActive' => Feature_Registry::is_woocommerce_active(),
				)
			) . ';',
			'before'
		);
	}
}
