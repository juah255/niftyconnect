<?php
/**
 * Discord notification provider.
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
 * Sends messages through Discord incoming webhooks.
 */
final class Discord_Provider implements Provider_Interface {
	/**
	 * Provider key.
	 *
	 * @return string
	 */
	public function key() {
		return 'discord';
	}

	/**
	 * Provider label.
	 *
	 * @return string
	 */
	public function label() {
		return __( 'Discord', 'niftyconnect' );
	}

	/**
	 * Send notification.
	 *
	 * @param Notification $notification Notification.
	 * @return array|\WP_Error
	 */
	public function send( Notification $notification ) {
		$settings = Settings::get_all();
		$config   = isset( $settings['channels']['discord']['config'] ) && is_array( $settings['channels']['discord']['config'] )
			? $settings['channels']['discord']['config']
			: array();
		$context  = $notification->context();
		$webhook_url = defined( 'NIFTYCONNECT_DISCORD_WEBHOOK_URL' )
			? esc_url_raw( constant( 'NIFTYCONNECT_DISCORD_WEBHOOK_URL' ) )
			: ( isset( $config['webhook_url'] ) ? esc_url_raw( $config['webhook_url'] ) : '' );

		if ( '' === $webhook_url || ! $this->is_discord_webhook_url( $webhook_url ) ) {
			return new \WP_Error(
				'niftyconnect_discord_missing_config',
				__( 'Discord is missing a valid webhook URL.', 'niftyconnect' )
			);
		}

		$thread_id = ! empty( $context['discord_config_thread_id'] )
			? preg_replace( '/\D+/', '', (string) $context['discord_config_thread_id'] )
			: ( isset( $config['thread_id'] ) ? preg_replace( '/\D+/', '', (string) $config['thread_id'] ) : '' );
		$url       = add_query_arg( 'wait', 'true', $webhook_url );

		if ( '' !== $thread_id ) {
			$url = add_query_arg( 'thread_id', $thread_id, $url );
		}

		$payload = array(
			'content'          => $this->message_content( $notification ),
			'allowed_mentions' => array(
				'parse' => array(),
			),
		);

		if ( ! empty( $config['username'] ) ) {
			$payload['username'] = $this->limit_text( sanitize_text_field( $config['username'] ), 80 );
		}

		if ( ! empty( $config['avatar_url'] ) && wp_http_validate_url( $config['avatar_url'] ) ) {
			$payload['avatar_url'] = esc_url_raw( $config['avatar_url'] );
		}

		if ( ! empty( $config['suppress_embeds'] ) ) {
			$payload['flags'] = 4;
		}

		$response = wp_remote_post(
			$url,
			array(
				'timeout' => 15,
				'headers' => array(
					'Content-Type' => 'application/json',
				),
				'body'    => wp_json_encode( $payload ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code          = (int) wp_remote_retrieve_response_code( $response );
		$response_body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code < 200 || $code >= 300 ) {
			$message = sprintf(
				/* translators: %d: HTTP status code. */
				__( 'Discord returned HTTP %d.', 'niftyconnect' ),
				$code
			);

			if ( is_array( $response_body ) && ! empty( $response_body['message'] ) ) {
				$message = sprintf(
					/* translators: 1: HTTP status code, 2: Discord API error message. */
					__( 'Discord returned HTTP %1$d: %2$s', 'niftyconnect' ),
					$code,
					sanitize_text_field( $response_body['message'] )
				);
			}

			return new \WP_Error(
				'niftyconnect_discord_remote_error',
				$message
			);
		}

		$message_id = is_array( $response_body ) && ! empty( $response_body['id'] )
			? sanitize_text_field( $response_body['id'] )
			: '';

		return array(
			'message'    => __( 'Sent to Discord.', 'niftyconnect' ),
			'message_id' => $message_id,
		);
	}

	/**
	 * Build plain message content for Discord.
	 *
	 * @param Notification $notification Notification.
	 * @return string
	 */
	private function message_content( Notification $notification ) {
		$subject = trim( wp_strip_all_tags( $notification->subject() ) );
		$body    = trim( wp_strip_all_tags( $notification->body() ) );
		$message = trim( $subject . "\n\n" . $body );

		return $this->limit_text( $message, 2000 );
	}

	/**
	 * Check whether a URL looks like a Discord incoming webhook URL.
	 *
	 * @param string $url URL.
	 * @return bool
	 */
	private function is_discord_webhook_url( $url ) {
		if ( ! wp_http_validate_url( $url ) ) {
			return false;
		}

		$parts = wp_parse_url( $url );

		if ( empty( $parts['scheme'] ) || 'https' !== strtolower( $parts['scheme'] ) ) {
			return false;
		}

		$host = isset( $parts['host'] ) ? strtolower( $parts['host'] ) : '';

		if ( ! in_array( $host, array( 'discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com' ), true ) ) {
			return false;
		}

		$path = isset( $parts['path'] ) ? $parts['path'] : '';

		return 1 === preg_match( '#^/api/webhooks/\d+/[^/]+/?$#', $path );
	}

	/**
	 * Limit text to Discord field sizes.
	 *
	 * @param string $text  Text.
	 * @param int    $limit Maximum character count.
	 * @return string
	 */
	private function limit_text( $text, $limit ) {
		$text  = trim( (string) $text );
		$limit = max( 0, (int) $limit );

		if ( function_exists( 'mb_strlen' ) && function_exists( 'mb_substr' ) ) {
			if ( mb_strlen( $text ) <= $limit ) {
				return $text;
			}

			return rtrim( mb_substr( $text, 0, max( 0, $limit - 3 ) ) ) . '...';
		}

		if ( strlen( $text ) <= $limit ) {
			return $text;
		}

		return rtrim( substr( $text, 0, max( 0, $limit - 3 ) ) ) . '...';
	}
}
