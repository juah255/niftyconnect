<?php
/**
 * Telegram chat ID helpers.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Support;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Shared Telegram chat ID utilities.
 */
final class Telegram_Chat {
	const USER_META_KEY = 'niftyconnect_telegram_chat_id';

	/**
	 * Sanitize a Telegram chat ID.
	 *
	 * @param string $chat_id Raw chat ID.
	 * @return string
	 */
	public static function sanitize( $chat_id ) {
		$chat_id = is_scalar( $chat_id ) ? (string) $chat_id : '';
		$chat_id = sanitize_text_field( $chat_id );
		$chat_id = ltrim( $chat_id, "# \t\n\r\0\x0B" );

		return preg_match( '/^-?\d+$/', $chat_id ) ? $chat_id : '';
	}

	/**
	 * Get a user's Telegram chat ID from user meta.
	 *
	 * @param int $user_id User ID.
	 * @return string
	 */
	public static function for_user( $user_id ) {
		return self::sanitize( get_user_meta( $user_id, self::USER_META_KEY, true ) );
	}
}
