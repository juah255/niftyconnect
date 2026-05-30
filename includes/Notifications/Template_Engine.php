<?php
/**
 * Template renderer.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renders simple {{variable}} templates.
 */
final class Template_Engine {
	/**
	 * Render a template using context values.
	 *
	 * @param string $template Template string.
	 * @param array  $context  Event context.
	 * @return string
	 */
	public function render( $template, array $context ) {
		$context = $this->with_globals( $context );
		$tokens  = array();

		foreach ( $this->flatten( $context ) as $key => $value ) {
			if ( is_scalar( $value ) || null === $value ) {
				$tokens[ '{{' . $key . '}}' ] = (string) $value;
			}
		}

		/**
		 * Filters template tokens before rendering.
		 *
		 * @param array  $tokens   Token map.
		 * @param array  $context  Context.
		 * @param string $template Template.
		 */
		$tokens = apply_filters( 'niftyconnect_template_tokens', $tokens, $context, $template );

		return strtr( $template, $tokens );
	}

	/**
	 * Add global variables available in every template.
	 *
	 * @param array $context Context.
	 * @return array
	 */
	private function with_globals( array $context ) {
		return array_merge(
			array(
				'site_name'    => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
				'site_url'     => home_url( '/' ),
				'admin_email'  => get_option( 'admin_email' ),
				'current_date' => wp_date( get_option( 'date_format' ) ),
				'current_time' => wp_date( get_option( 'time_format' ) ),
			),
			$context
		);
	}

	/**
	 * Flatten nested context arrays with dot notation.
	 *
	 * @param array  $context Context.
	 * @param string $prefix  Prefix.
	 * @return array
	 */
	private function flatten( array $context, $prefix = '' ) {
		$flat = array();

		foreach ( $context as $key => $value ) {
			$key_path = '' === $prefix ? $key : $prefix . '.' . $key;

			if ( is_array( $value ) ) {
				$flat = array_merge( $flat, $this->flatten( $value, $key_path ) );
				continue;
			}

			$flat[ $key_path ] = $value;
		}

		return $flat;
	}
}
