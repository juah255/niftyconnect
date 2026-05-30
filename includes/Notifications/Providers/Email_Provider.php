<?php
/**
 * Email notification provider.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications\Providers;

use NiftyConnect\Notifications\Notification;
use NiftyConnect\Support\Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sends notifications with wp_mail().
 */
final class Email_Provider implements Provider_Interface {
	/**
	 * Provider key.
	 *
	 * @return string
	 */
	public function key() {
		return 'email';
	}

	/**
	 * Provider label.
	 *
	 * @return string
	 */
	public function label() {
		return __( 'Email', 'niftyconnect' );
	}

	/**
	 * Send email notification.
	 *
	 * @param Notification $notification Notification object.
	 * @return true|\WP_Error
	 */
	public function send( Notification $notification ) {
		$settings   = Settings::get_all();
		$from_name  = isset( $settings['general']['from_name'] ) ? $settings['general']['from_name'] : get_bloginfo( 'name' );
		$from_email = isset( $settings['general']['from_email'] ) ? $settings['general']['from_email'] : get_option( 'admin_email' );
		$headers    = array( 'Content-Type: text/html; charset=UTF-8' );

		if ( is_email( $from_email ) ) {
			$headers[] = sprintf(
				'From: %1$s <%2$s>',
				sanitize_text_field( $from_name ),
				sanitize_email( $from_email )
			);
		}

		$body = wpautop( wp_kses_post( $notification->body() ) );
		$sent = wp_mail(
			$notification->recipients(),
			wp_strip_all_tags( $notification->subject() ),
			$body,
			$headers
		);

		if ( ! $sent ) {
			return new \WP_Error(
				'niftyconnect_email_failed',
				__( 'WordPress could not send the email notification.', 'niftyconnect' )
			);
		}

		return true;
	}
}
