<?php
/**
 * Telegram notification provider.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications\Providers;

use NiftyConnect\Notifications\Notification;
use NiftyConnect\Support\Settings;
use NiftyConnect\Support\Telegram_Chat;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sends Telegram bot messages.
 */
final class Telegram_Provider implements Provider_Interface {
	/**
	 * Provider key.
	 *
	 * @return string
	 */
	public function key() {
		return 'telegram';
	}

	/**
	 * Provider label.
	 *
	 * @return string
	 */
	public function label() {
		return __( 'Telegram', 'niftyconnect' );
	}

	/**
	 * Send notification.
	 *
	 * @param Notification $notification Notification.
	 * @return true|\WP_Error
	 */
	public function send( Notification $notification ) {
		$settings = Settings::get_all();
		$config   = isset( $settings['channels']['telegram']['config'] ) && is_array( $settings['channels']['telegram']['config'] ) ? $settings['channels']['telegram']['config'] : array();
		$context  = $notification->context();
		$chat_ids = isset( $context['telegram_chat_ids'] ) && is_array( $context['telegram_chat_ids'] )
			? array_values( array_filter( array_map( array( Telegram_Chat::class, 'sanitize' ), $context['telegram_chat_ids'] ) ) )
			: array();
		$has_chat_id_override = array_key_exists( 'telegram_config_chat_id', $context );

		if ( empty( $config['bot_token'] ) ) {
			return new \WP_Error(
				'niftyconnect_telegram_missing_config',
				__( 'Telegram is missing a bot token.', 'niftyconnect' )
			);
		}

		if ( empty( $chat_ids ) ) {
			$chat_id = $has_chat_id_override
				? Telegram_Chat::sanitize( $context['telegram_config_chat_id'] )
				: ( isset( $config['chat_id'] ) ? Telegram_Chat::sanitize( $config['chat_id'] ) : '' );

			if ( '' === $chat_id ) {
				return new \WP_Error(
					'niftyconnect_telegram_missing_config',
					__( 'Telegram is missing a chat ID.', 'niftyconnect' )
				);
			}

			$chat_ids = array( $chat_id );
		}

		foreach ( $chat_ids as $chat_id ) {
			$result = $this->send_to_chat( $config['bot_token'], $chat_id, $notification );

			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		return true;
	}

	/**
	 * Send a Telegram message to one chat.
	 *
	 * @param string       $bot_token    Bot token.
	 * @param string       $chat_id      Telegram chat ID.
	 * @param Notification $notification Notification payload.
	 * @return true|\WP_Error
	 */
	private function send_to_chat( $bot_token, $chat_id, Notification $notification ) {
		$settings = Settings::get_all();
		$config   = isset( $settings['channels']['telegram']['config'] ) && is_array( $settings['channels']['telegram']['config'] ) ? $settings['channels']['telegram']['config'] : array();
		$text     = trim( wp_strip_all_tags( $notification->subject() ) . "\n\n" . wp_strip_all_tags( $notification->body() ) );

		if ( isset( $config['parse_mode'] ) && 'HTML' === $config['parse_mode'] ) {
			$text = trim(
				wp_kses(
					$notification->subject() . "\n\n" . $notification->body(),
					array(
						'a'          => array( 'href' => array() ),
						'b'          => array(),
						'blockquote' => array(),
						'code'       => array(),
						'em'         => array(),
						'i'          => array(),
						'pre'        => array(),
						's'          => array(),
						'spoiler'    => array(),
						'strong'     => array(),
						'u'          => array(),
					)
				)
			);
		}

		$body = array(
			'chat_id' => $chat_id,
			'text'    => $text,
		);

		if ( ! empty( $config['parse_mode'] ) ) {
			$body['parse_mode'] = $config['parse_mode'];
		}

		if ( ! empty( $config['disable_web_page_preview'] ) ) {
			$body['disable_web_page_preview'] = true;
		}

		$response = wp_remote_post(
			'https://api.telegram.org/bot' . rawurlencode( $bot_token ) . '/sendMessage',
			array(
				'timeout' => 15,
				'body'    => $body,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );

		if ( $code < 200 || $code >= 300 ) {
			$message = sprintf(
				/* translators: %d: HTTP status code. */
				__( 'Telegram returned HTTP %d.', 'niftyconnect' ),
				$code
			);
			$body    = json_decode( wp_remote_retrieve_body( $response ), true );

			if ( is_array( $body ) && ! empty( $body['description'] ) ) {
				$description = sanitize_text_field( $body['description'] );
				$message     = sprintf(
					/* translators: 1: HTTP status code, 2: Telegram API error description. */
					__( 'Telegram returned HTTP %1$d: %2$s', 'niftyconnect' ),
					$code,
					$description
				);

				if ( false !== stripos( $description, "can't send messages to the bot" ) ) {
					$message = __(
						'Telegram cannot send messages to the bot itself. Use the recipient chat ID from message.chat.id after sending /start to the bot, not the bot ID.',
						'niftyconnect'
					);
				}
			}

			return new \WP_Error(
				'niftyconnect_telegram_remote_error',
				$message
			);
		}

		return true;
	}
}
