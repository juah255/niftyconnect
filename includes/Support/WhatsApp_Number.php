<?php
/**
 * WhatsApp recipient phone helpers.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Support;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Normalizes WhatsApp recipient phone numbers.
 */
final class WhatsApp_Number {
	const USER_META_KEY = 'niftyconnect_whatsapp_phone';

	/**
	 * Normalize an international phone number to digits only.
	 *
	 * @param mixed $number Raw phone number.
	 * @return string
	 */
	public static function sanitize( $number ) {
		if ( ! is_scalar( $number ) ) {
			return '';
		}

		$number = preg_replace( '/\D+/', '', sanitize_text_field( (string) $number ) );

		if ( 0 === strpos( $number, '00' ) ) {
			$number = substr( $number, 2 );
		}

		$length = strlen( $number );

		if ( $length < 7 || $length > 15 || '0' === substr( $number, 0, 1 ) ) {
			return '';
		}

		return $number;
	}

	/**
	 * Get a user's saved WhatsApp phone number.
	 *
	 * @param int $user_id User ID.
	 * @return string
	 */
	public static function for_user( $user_id ) {
		return self::sanitize( get_user_meta( absint( $user_id ), self::USER_META_KEY, true ) );
	}
}
