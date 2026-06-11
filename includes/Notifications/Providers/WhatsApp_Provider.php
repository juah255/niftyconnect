<?php
/**
 * WhatsApp notification provider.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications\Providers;

use NiftyConnect\Notifications\Notification;
use NiftyConnect\Support\Settings;
use NiftyConnect\Support\WhatsApp_Number;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sends messages through the WhatsApp Cloud API.
 */
final class WhatsApp_Provider implements Provider_Interface {
	/**
	 * Provider key.
	 *
	 * @return string
	 */
	public function key() {
		return 'whatsapp';
	}

	/**
	 * Provider label.
	 *
	 * @return string
	 */
	public function label() {
		return __( 'WhatsApp', 'niftyconnect' );
	}

	/**
	 * Send notification.
	 *
	 * @param Notification $notification Notification.
	 * @return array|\WP_Error
	 */
	public function send( Notification $notification ) {
		$settings = Settings::get_all();
		$config   = isset( $settings['channels']['whatsapp']['config'] ) && is_array( $settings['channels']['whatsapp']['config'] )
			? $settings['channels']['whatsapp']['config']
			: array();
		$config   = $this->event_config( $notification->event_key(), $settings, $config );
		$context  = $notification->context();
		$token    = defined( 'NIFTYCONNECT_WHATSAPP_ACCESS_TOKEN' )
			? sanitize_text_field( constant( 'NIFTYCONNECT_WHATSAPP_ACCESS_TOKEN' ) )
			: ( isset( $config['access_token'] ) ? sanitize_text_field( $config['access_token'] ) : '' );
		$phone_number_id = isset( $config['phone_number_id'] )
			? preg_replace( '/\D+/', '', (string) $config['phone_number_id'] )
			: '';
		$recipients = isset( $context['whatsapp_recipient_phones'] ) && is_array( $context['whatsapp_recipient_phones'] )
			? array_values( array_filter( array_map( array( WhatsApp_Number::class, 'sanitize' ), $context['whatsapp_recipient_phones'] ) ) )
			: array();
		$has_recipient_override = ! empty( $context['whatsapp_config_recipient'] );

		if ( '' === $token ) {
			return new \WP_Error(
				'niftyconnect_whatsapp_missing_config',
				__( 'WhatsApp is missing an access token.', 'niftyconnect' )
			);
		}

		if ( '' === $phone_number_id ) {
			return new \WP_Error(
				'niftyconnect_whatsapp_missing_config',
				__( 'WhatsApp is missing a phone number ID.', 'niftyconnect' )
			);
		}

		if ( empty( $recipients ) ) {
			$recipient = $has_recipient_override
				? WhatsApp_Number::sanitize( $context['whatsapp_config_recipient'] )
				: ( isset( $config['recipient_phone'] ) ? WhatsApp_Number::sanitize( $config['recipient_phone'] ) : '' );

			if ( '' === $recipient ) {
				return new \WP_Error(
					'niftyconnect_whatsapp_missing_config',
					__( 'WhatsApp is missing a valid recipient phone number with country code.', 'niftyconnect' )
				);
			}

			$recipients = array( $recipient );
		}

		$payload = $this->message_payload( $notification, $config );

		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		$message_ids = array();
		$statuses    = array();

		foreach ( array_unique( $recipients ) as $recipient ) {
			$payload['to'] = $recipient;
			$result        = $this->send_to_recipient( $token, $phone_number_id, $config, $payload );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$message_ids[] = $result['message_id'];

			if ( '' !== $result['status'] ) {
				$statuses[] = $result['status'];
			}
		}

		$message_count = count( $message_ids );

		return array(
			'message'     => sprintf(
				/* translators: %d: number of messages accepted by WhatsApp. */
				_n(
					'Accepted by WhatsApp (%d message ID). Delivery is not yet confirmed.',
					'Accepted by WhatsApp (%d message IDs). Delivery is not yet confirmed.',
					$message_count,
					'niftyconnect'
				),
				$message_count
			),
			'message_ids' => $message_ids,
			'api_status'  => 1 === count( array_unique( $statuses ) ) ? reset( $statuses ) : '',
		);
	}

	/**
	 * Apply an event-specific approved template when one is configured.
	 *
	 * @param string $event_key Event key.
	 * @param array  $settings  Plugin settings.
	 * @param array  $config    Global WhatsApp configuration.
	 * @return array
	 */
	private function event_config( $event_key, array $settings, array $config ) {
		$event_key = sanitize_key( $event_key );
		$template  = isset( $settings['whatsapp_templates'][ $event_key ] ) && is_array( $settings['whatsapp_templates'][ $event_key ] )
			? $settings['whatsapp_templates'][ $event_key ]
			: array();
		$name      = isset( $template['name'] ) ? sanitize_key( $template['name'] ) : '';

		if ( '' === $name ) {
			return $config;
		}

		$config['message_type']        = 'template';
		$config['template_name']       = $name;
		$config['template_language']   = isset( $template['language'] ) && '' !== $template['language']
			? sanitize_text_field( $template['language'] )
			: 'en_US';
		$config['template_parameters'] = isset( $template['parameters'] )
			? sanitize_key( $template['parameters'] )
			: 'subject_body';

		return $config;
	}

	/**
	 * Build the Cloud API message payload.
	 *
	 * @param Notification $notification Notification.
	 * @param array        $config       Channel configuration.
	 * @return array|\WP_Error
	 */
	private function message_payload( Notification $notification, array $config ) {
		$message_type = isset( $config['message_type'] ) ? sanitize_key( $config['message_type'] ) : 'template';
		$subject      = trim( wp_strip_all_tags( $notification->subject() ) );
		$body         = trim( wp_strip_all_tags( $notification->body() ) );
		$message      = trim( $subject . "\n\n" . $body );
		$payload      = array(
			'messaging_product' => 'whatsapp',
			'recipient_type'    => 'individual',
		);

		if ( 'text' === $message_type ) {
			$payload['type'] = 'text';
			$payload['text'] = array(
				'preview_url' => ! empty( $config['preview_url'] ),
				'body'        => $this->limit_text( $message, 4096 ),
			);

			return $payload;
		}

		$template_name = isset( $config['template_name'] ) ? sanitize_key( $config['template_name'] ) : '';

		if ( '' === $template_name ) {
			return new \WP_Error(
				'niftyconnect_whatsapp_missing_config',
				__( 'WhatsApp template mode requires an approved template name.', 'niftyconnect' )
			);
		}

		$parameter_mode = isset( $config['template_parameters'] ) ? sanitize_key( $config['template_parameters'] ) : 'subject_body';
		$template       = array(
			'name'     => $template_name,
			'language' => array(
				'code' => isset( $config['template_language'] ) && '' !== $config['template_language']
					? sanitize_text_field( $config['template_language'] )
					: 'en_US',
			),
		);

		if ( 'message' === $parameter_mode ) {
			$template['components'] = array(
				array(
					'type'       => 'body',
					'parameters' => array(
						array(
							'type' => 'text',
							'text' => $this->limit_text( $message, 1024 ),
						),
					),
				),
			);
		} elseif ( 'subject_body' === $parameter_mode ) {
			$template['components'] = array(
				array(
					'type'       => 'body',
					'parameters' => array(
						array(
							'type' => 'text',
							'text' => $this->limit_text( $subject, 256 ),
						),
						array(
							'type' => 'text',
							'text' => $this->limit_text( $body, 768 ),
						),
					),
				),
			);
		}

		$payload['type']     = 'template';
		$payload['template'] = $template;

		return $payload;
	}

	/**
	 * Send one Cloud API request.
	 *
	 * @param string $token           Access token.
	 * @param string $phone_number_id WhatsApp business phone number ID.
	 * @param array  $config          Channel configuration.
	 * @param array  $payload         Message payload.
	 * @return array|\WP_Error
	 */
	private function send_to_recipient( $token, $phone_number_id, array $config, array $payload ) {
		$api_version = isset( $config['api_version'] ) && preg_match( '/^v\d+\.\d+$/', $config['api_version'] )
			? $config['api_version']
			: 'v23.0';
		$url         = sprintf(
			'https://graph.facebook.com/%1$s/%2$s/messages',
			rawurlencode( $api_version ),
			rawurlencode( $phone_number_id )
		);
		$url         = apply_filters( 'niftyconnect_whatsapp_api_url', $url, $phone_number_id, $api_version );
		$response    = wp_remote_post(
			$url,
			array(
				'timeout' => 20,
				'headers' => array(
					'Authorization' => 'Bearer ' . $token,
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode( $payload ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );

		$response_body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code < 200 || $code >= 300 ) {
			$details       = '';

			if ( is_array( $response_body ) && isset( $response_body['error'] ) && is_array( $response_body['error'] ) ) {
				$error   = $response_body['error'];
				$details = isset( $error['error_data']['details'] )
					? sanitize_text_field( $error['error_data']['details'] )
					: ( isset( $error['message'] ) ? sanitize_text_field( $error['message'] ) : '' );
			}

			$message = $details
				? sprintf(
					/* translators: 1: HTTP status code, 2: WhatsApp API error details. */
					__( 'WhatsApp returned HTTP %1$d: %2$s', 'niftyconnect' ),
					$code,
					$details
				)
				: sprintf(
					/* translators: %d: HTTP status code. */
					__( 'WhatsApp returned HTTP %d.', 'niftyconnect' ),
					$code
				);

			return new \WP_Error( 'niftyconnect_whatsapp_remote_error', $message );
		}

		if (
			! is_array( $response_body )
			|| empty( $response_body['messages'][0]['id'] )
		) {
			return new \WP_Error(
				'niftyconnect_whatsapp_invalid_response',
				__( 'WhatsApp accepted the request but did not return a message ID.', 'niftyconnect' )
			);
		}

		$message = $response_body['messages'][0];
		$status  = isset( $message['message_status'] ) ? sanitize_key( $message['message_status'] ) : 'accepted';

		if ( 'failed' === $status ) {
			return new \WP_Error(
				'niftyconnect_whatsapp_message_failed',
				__( 'WhatsApp returned a failed message status.', 'niftyconnect' )
			);
		}

		return array(
			'message_id' => sanitize_text_field( $message['id'] ),
			'status'     => $status,
		);
	}

	/**
	 * Limit message text without requiring the mbstring extension.
	 *
	 * @param string $text   Message text.
	 * @param int    $length Maximum length.
	 * @return string
	 */
	private function limit_text( $text, $length ) {
		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $text, 0, $length );
		}

		return substr( $text, 0, $length );
	}
}
