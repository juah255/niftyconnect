<?php
/**
 * Notification provider contract.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications\Providers;

use NiftyConnect\Notifications\Notification;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Provider contract for all notification channels.
 */
interface Provider_Interface {
	/**
	 * Provider key matching a channel key.
	 *
	 * @return string
	 */
	public function key();

	/**
	 * Human-readable provider label.
	 *
	 * @return string
	 */
	public function label();

	/**
	 * Send a notification.
	 *
	 * @param Notification $notification Notification object.
	 * @return true|\WP_Error
	 */
	public function send( Notification $notification );
}
