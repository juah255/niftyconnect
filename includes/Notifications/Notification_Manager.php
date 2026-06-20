<?php
/**
 * Notification manager.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications;

use NiftyConnect\Notifications\Providers\Email_Provider;
use NiftyConnect\Notifications\Providers\Discord_Provider;
use NiftyConnect\Notifications\Providers\Provider_Interface;
use NiftyConnect\Notifications\Providers\Telegram_Provider;
use NiftyConnect\Notifications\Providers\WhatsApp_Provider;
use NiftyConnect\Support\Settings;
use NiftyConnect\Support\Telegram_Chat;
use NiftyConnect\Support\WhatsApp_Number;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Coordinates event rendering, channel providers, and limits.
 */
final class Notification_Manager {
	/**
	 * Registered providers.
	 *
	 * @var Provider_Interface[]
	 */
	private $providers = array();

	/**
	 * Template engine.
	 *
	 * @var Template_Engine
	 */
	private $templates;

	/**
	 * Daily limiter.
	 *
	 * @var Daily_Limiter
	 */
	private $limiter;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->templates = new Template_Engine();
		$this->limiter   = new Daily_Limiter();

		$this->register_provider( new Email_Provider() );
		$this->register_provider( new Discord_Provider() );
		$this->register_provider( new Telegram_Provider() );
		$this->register_provider( new WhatsApp_Provider() );

		/**
		 * Fires when providers may be registered.
		 *
		 * Extensions should call $manager->register_provider().
		 *
		 * @param Notification_Manager $manager Notification manager.
		 */
		do_action( 'niftyconnect_register_providers', $this );
	}

	/**
	 * Register a provider.
	 *
	 * @param Provider_Interface $provider Provider instance.
	 * @return void
	 */
	public function register_provider( Provider_Interface $provider ) {
		$this->providers[ $provider->key() ] = $provider;
	}

	/**
	 * Get provider labels keyed by provider key.
	 *
	 * @return array
	 */
	public function providers() {
		$providers = array();

		foreach ( $this->providers as $key => $provider ) {
			$providers[ $key ] = array(
				'key'   => $key,
				'label' => $provider->label(),
			);
		}

		return $providers;
	}

	/**
	 * Get daily sending limit status.
	 *
	 * @return array
	 */
	public function limit_status() {
		return $this->limiter->status();
	}

	/**
	 * Send a test notification.
	 *
	 * @param string      $recipient        Test recipient email.
	 * @param string      $channel          Optional channel key.
	 * @param string|null $telegram_chat_id Optional Telegram chat ID override.
	 * @param string|null $whatsapp_phone   Optional WhatsApp recipient override.
	 * @param string|null $discord_thread_id Optional Discord thread ID override.
	 * @return array|\WP_Error
	 */
	public function send_test( $recipient, $channel = '', $telegram_chat_id = null, $whatsapp_phone = null, $discord_thread_id = null ) {
		$channel = sanitize_key( $channel );

		if ( $channel && ! isset( $this->providers[ $channel ] ) ) {
			return new \WP_Error(
				'niftyconnect_invalid_channel',
				__( 'Choose a valid notification channel.', 'niftyconnect' ),
				array( 'status' => 400 )
			);
		}

		if ( ( ! $channel || 'email' === $channel ) && ! is_email( $recipient ) ) {
			return new \WP_Error(
				'niftyconnect_invalid_recipient',
				__( 'Enter a valid test recipient email address.', 'niftyconnect' ),
				array( 'status' => 400 )
			);
		}

		if ( ! is_email( $recipient ) ) {
			$settings  = Settings::get_all();
			$recipient = isset( $settings['general']['recipients'][0] ) ? $settings['general']['recipients'][0] : get_option( 'admin_email' );
		}

		return $this->send_event(
			'test',
			array(
				'test_recipient'           => sanitize_email( $recipient ),
				'telegram_config_chat_id' => null === $telegram_chat_id
					? null
					: Telegram_Chat::sanitize( $telegram_chat_id ),
				'whatsapp_config_recipient' => null === $whatsapp_phone
					? null
					: WhatsApp_Number::sanitize( $whatsapp_phone ),
				'discord_config_thread_id'  => null === $discord_thread_id
					? null
					: preg_replace( '/\D+/', '', sanitize_text_field( $discord_thread_id ) ),
			),
			array(
				'recipients'             => array( sanitize_email( $recipient ) ),
				'ignore_trigger'         => true,
				'channels'               => $channel ? array( $channel ) : array(),
				'ignore_channel_enabled' => (bool) $channel,
			)
		);
	}

	/**
	 * Send a notification for an event.
	 *
	 * @param string $event_key Event key.
	 * @param array  $context   Context.
	 * @param array  $args      Options.
	 * @return array|\WP_Error
	 */
	public function send_event( $event_key, array $context = array(), array $args = array() ) {
		$event_key = sanitize_key( $event_key );
		$settings  = Settings::get_all();

		if ( empty( $settings['general']['enabled'] ) ) {
			return new \WP_Error(
				'niftyconnect_disabled',
				__( 'Notifications are disabled.', 'niftyconnect' )
			);
		}

		if ( empty( $args['ignore_trigger'] ) && empty( $settings['triggers'][ $event_key ] ) ) {
			return new \WP_Error(
				'niftyconnect_trigger_disabled',
				__( 'This notification trigger is disabled.', 'niftyconnect' )
			);
		}

		if ( ! $this->limiter->can_send() ) {
			return new \WP_Error(
				'niftyconnect_daily_limit_reached',
				__( 'The daily notification sending limit has been reached.', 'niftyconnect' )
			);
		}

		$should_send = (bool) apply_filters( 'niftyconnect_should_send_event', true, $event_key, $context, $settings );

		if ( ! $should_send ) {
			return new \WP_Error(
				'niftyconnect_notification_blocked',
				__( 'A notification filter prevented this notification from sending.', 'niftyconnect' )
			);
		}

		$template = Settings::template_for_event( $event_key, $settings );
		$targets  = $this->event_delivery_targets( $event_key, $settings );
		$context  = apply_filters( 'niftyconnect_notification_context', $context, $event_key, $settings );
		$context['telegram_chat_ids'] = isset( $args['telegram_chat_ids'] ) && is_array( $args['telegram_chat_ids'] )
			? array_values( array_filter( array_map( array( Telegram_Chat::class, 'sanitize' ), $args['telegram_chat_ids'] ) ) )
			: $targets['telegram_chat_ids'];
		$context['whatsapp_recipient_phones'] = isset( $args['whatsapp_recipient_phones'] ) && is_array( $args['whatsapp_recipient_phones'] )
			? array_values( array_filter( array_map( array( WhatsApp_Number::class, 'sanitize' ), $args['whatsapp_recipient_phones'] ) ) )
			: $targets['whatsapp_recipient_phones'];
		$subject  = $this->templates->render( $template['subject'], $context );
		$body     = $this->templates->render( $template['body'], $context );

		$recipients = isset( $args['recipients'] ) && is_array( $args['recipients'] ) ? $args['recipients'] : $targets['emails'];
		$recipients = array_values( array_filter( array_map( 'sanitize_email', $recipients ), 'is_email' ) );

		if ( empty( $recipients ) ) {
			return new \WP_Error(
				'niftyconnect_no_recipients',
				__( 'No valid notification recipients are configured.', 'niftyconnect' )
			);
		}

		$notification = new Notification( $event_key, $subject, $body, $recipients, $context );
		$results      = array();
		$sent_count   = 0;
		$channels     = isset( $args['channels'] ) && is_array( $args['channels'] ) ? array_map( 'sanitize_key', $args['channels'] ) : array();

		do_action( 'niftyconnect_before_send', $notification, $settings );

		foreach ( $this->providers as $key => $provider ) {
			$channel_settings = isset( $settings['channels'][ $key ] ) && is_array( $settings['channels'][ $key ] ) ? $settings['channels'][ $key ] : array();

			if ( ! empty( $channels ) && ! in_array( $key, $channels, true ) ) {
				continue;
			}

			if ( empty( $channel_settings['enabled'] ) && empty( $args['ignore_channel_enabled'] ) ) {
				continue;
			}

			if ( isset( $channel_settings['events'][ $event_key ] ) && ! $channel_settings['events'][ $event_key ] ) {
				continue;
			}

			$result  = $provider->send( $notification );
			$success = ! is_wp_error( $result );
			$message = $success
				? ( is_array( $result ) && ! empty( $result['message'] ) ? sanitize_text_field( $result['message'] ) : __( 'Sent successfully.', 'niftyconnect' ) )
				: $result->get_error_message();
			$recipient_count = $this->provider_recipient_count( $key, $recipients, $context );

			$results[ $key ] = array(
				'success' => $success,
				'message' => $message,
			);

			if ( $success && is_array( $result ) ) {
				$results[ $key ] += $result;
			}

			Activity_Log::record(
				$event_key,
				$key,
				$success ? 'success' : 'failed',
				$subject,
				$message,
				$recipient_count
			);

			if ( $success ) {
				++$sent_count;
			}
		}

		if ( 0 === $sent_count ) {
			if ( 1 === count( $results ) ) {
				$result = reset( $results );

				if ( is_array( $result ) && ! empty( $result['message'] ) ) {
					return new \WP_Error(
						'niftyconnect_no_channels_sent',
						$result['message'],
						array( 'results' => $results )
					);
				}
			}

			return new \WP_Error(
				'niftyconnect_no_channels_sent',
				__( 'No enabled notification channels sent this message.', 'niftyconnect' ),
				array( 'results' => $results )
			);
		}

		$this->limiter->increment();

		do_action( 'niftyconnect_after_send', $notification, $results, $settings );

		return array(
			'event'   => $event_key,
			'subject' => $subject,
			'results' => $results,
			'limit'   => $this->limiter->status(),
		);
	}

	/**
	 * Resolve recipient emails for an event.
	 *
	 * @param string $event_key Event key.
	 * @param array  $settings  Current settings.
	 * @return array
	 */
	private function event_delivery_targets( $event_key, array $settings ) {
		$config = isset( $settings['trigger_recipients'][ $event_key ] ) && is_array( $settings['trigger_recipients'][ $event_key ] )
			? $settings['trigger_recipients'][ $event_key ]
			: array();
		$emails           = array();
		$chat_ids         = array();
		$whatsapp_numbers = array();
		$roles            = isset( $config['roles'] ) && is_array( $config['roles'] ) ? array_map( 'sanitize_key', $config['roles'] ) : array();

		if ( ! empty( $roles ) ) {
			$users = get_users(
				array(
					'role__in' => $roles,
					'fields'   => 'all',
				)
			);

			foreach ( $users as $user ) {
				if ( isset( $user->user_email ) && is_email( $user->user_email ) ) {
					$emails[] = sanitize_email( $user->user_email );
				}

				if ( isset( $user->ID ) ) {
					$chat_id = Telegram_Chat::for_user( $user->ID );

					if ( '' !== $chat_id ) {
						$chat_ids[] = $chat_id;
					}

					$whatsapp_number = WhatsApp_Number::for_user( $user->ID );

					if ( '' !== $whatsapp_number ) {
						$whatsapp_numbers[] = $whatsapp_number;
					}
				}
			}
		}

		if ( isset( $config['custom'] ) && is_array( $config['custom'] ) ) {
			foreach ( $config['custom'] as $recipient ) {
				$email = sanitize_email( $recipient );

				if ( is_email( $email ) ) {
					$emails[] = $email;
				}
			}
		}

		if ( empty( $emails ) && isset( $settings['general']['recipients'] ) && is_array( $settings['general']['recipients'] ) ) {
			$emails = $settings['general']['recipients'];
		}

		return array(
			'emails'                    => array_values( array_unique( $emails ) ),
			'telegram_chat_ids'         => array_values( array_unique( $chat_ids ) ),
			'whatsapp_recipient_phones' => array_values( array_unique( $whatsapp_numbers ) ),
		);
	}

	/**
	 * Resolve the destination count recorded for a provider.
	 *
	 * @param string $provider_key Provider key.
	 * @param array  $recipients   Email recipients.
	 * @param array  $context      Notification context.
	 * @return int
	 */
	private function provider_recipient_count( $provider_key, array $recipients, array $context ) {
		if ( 'telegram' === $provider_key ) {
			return ! empty( $context['telegram_chat_ids'] ) && is_array( $context['telegram_chat_ids'] )
				? count( $context['telegram_chat_ids'] )
				: 1;
		}

		if ( 'whatsapp' === $provider_key ) {
			return ! empty( $context['whatsapp_recipient_phones'] ) && is_array( $context['whatsapp_recipient_phones'] )
				? count( $context['whatsapp_recipient_phones'] )
				: 1;
		}

		if ( 'discord' === $provider_key ) {
			return 1;
		}

		return count( $recipients );
	}
}
