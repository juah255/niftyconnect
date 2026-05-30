<?php
/**
 * Admin menu registration.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers admin menu pages.
 */
final class Menu {
	const SLUG = 'niftyconnect';

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
	}

	/**
	 * Register the admin menu.
	 *
	 * @return void
	 */
	public function register_menu() {
		add_menu_page(
			__( 'niftyConnect', 'niftyconnect' ),
			__( 'niftyConnect', 'niftyconnect' ),
			'manage_options',
			self::SLUG,
			array( $this, 'render' ),
			'dashicons-bell',
			58
		);
	}

	/**
	 * Render admin app mount point.
	 *
	 * @return void
	 */
	public function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'niftyconnect' ) );
		}

		echo '<div class="wrap niftyconnect-wrap">';
		echo '<div id="niftyconnect-admin"></div>';
		echo '</div>';
	}
}
