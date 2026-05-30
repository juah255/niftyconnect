<?php
/**
 * Array helpers.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Support;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Array utility methods.
 */
final class Arr {
	/**
	 * Recursively merge user values into defaults.
	 *
	 * @param array $defaults Default values.
	 * @param array $values   User values.
	 * @return array
	 */
	public static function merge_defaults( array $defaults, array $values ) {
		foreach ( $defaults as $key => $default_value ) {
			if ( array_key_exists( $key, $values ) && is_array( $default_value ) && is_array( $values[ $key ] ) ) {
				if ( self::is_list_array( $default_value ) ) {
					$defaults[ $key ] = $values[ $key ];
					continue;
				}

				$defaults[ $key ] = self::merge_defaults( $default_value, $values[ $key ] );
				continue;
			}

			if ( array_key_exists( $key, $values ) ) {
				$defaults[ $key ] = $values[ $key ];
			}
		}

		foreach ( $values as $key => $value ) {
			if ( ! array_key_exists( $key, $defaults ) ) {
				$defaults[ $key ] = $value;
			}
		}

		return $defaults;
	}

	/**
	 * Check whether an array is a numeric list.
	 *
	 * @param array $value Array value.
	 * @return bool
	 */
	private static function is_list_array( array $value ) {
		if ( array() === $value ) {
			return true;
		}

		return array_keys( $value ) === range( 0, count( $value ) - 1 );
	}
}
