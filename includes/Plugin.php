<?php
/**
 * Main plugin coordinator.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect;

use NiftyConnect\Admin\Assets;
use NiftyConnect\Admin\Menu;
use NiftyConnect\Admin\User_Profile;
use NiftyConnect\Events\WordPress_Events;
use NiftyConnect\Integrations\WooCommerce;
use NiftyConnect\Notifications\Notification_Manager;
use NiftyConnect\REST\Settings_Controller;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class.
 */
final class Plugin {
	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Notification manager.
	 *
	 * @var Notification_Manager|null
	 */
	private $notification_manager = null;

	/**
	 * Whether the plugin has booted.
	 *
	 * @var bool
	 */
	private $booted = false;

	/**
	 * Get singleton instance.
	 *
	 * @return Plugin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Boot plugin services.
	 *
	 * @return void
	 */
	public function boot() {
		if ( $this->booted ) {
			return;
		}

		$this->booted               = true;
		Installer::maybe_upgrade();
		$this->notification_manager = new Notification_Manager();

		( new Menu() )->hooks();
		( new Assets() )->hooks();
		( new User_Profile() )->hooks();
		( new Settings_Controller( $this->notification_manager ) )->hooks();
		( new WordPress_Events( $this->notification_manager ) )->hooks();
		( new WooCommerce( $this->notification_manager ) )->hooks();

		/**
		 * Fires after the plugin has registered its core services.
		 *
		 * Extensions can use this to attach integrations, providers, and schedulers
		 * without modifying core plugin code.
		 *
		 * @param Plugin               $plugin               Plugin instance.
		 * @param Notification_Manager $notification_manager Notification manager.
		 */
		do_action( 'niftyconnect_loaded', $this, $this->notification_manager );
	}

	/**
	 * Get notification manager.
	 *
	 * @return Notification_Manager|null
	 */
	public function notifications() {
		return $this->notification_manager;
	}
}
