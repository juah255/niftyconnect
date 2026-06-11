<?php
/**
 * Settings repository and sanitization.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Support;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings storage.
 */
final class Settings {
	const OPTION = 'niftyconnect_settings';

	/**
	 * Ensure options exist.
	 *
	 * @return void
	 */
	public static function ensure_defaults() {
		if ( false === get_option( self::OPTION, false ) ) {
			add_option( self::OPTION, self::defaults(), '', false );
		}
	}

	/**
	 * Get all settings merged with current defaults.
	 *
	 * @return array
	 */
	public static function get_all() {
		$stored   = get_option( self::OPTION, array() );
		$defaults = self::defaults();

		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		return array_intersect_key( Arr::merge_defaults( $defaults, $stored ), $defaults );
	}

	/**
	 * Persist sanitized settings.
	 *
	 * @param array $input Raw settings input.
	 * @return array
	 */
	public static function update_all( array $input ) {
		$settings = self::sanitize( $input );
		update_option( self::OPTION, $settings, false );

		return self::get_all();
	}

	/**
	 * Get default settings.
	 *
	 * @return array
	 */
	public static function defaults() {
		$email       = sanitize_email( get_option( 'admin_email' ) );
		$daily_limit = (int) apply_filters( 'niftyconnect_default_daily_limit', 0 );

		$settings = array(
			'general'   => array(
				'enabled'     => true,
				'recipients'  => array_filter( array( $email ) ),
				'from_name'   => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
				'from_email'  => $email,
				'daily_limit' => max( 0, $daily_limit ),
			),
			'channels'  => array(
				'email'    => array(
					'enabled' => true,
					'events'  => self::default_channel_events(),
				),
				'telegram' => array(
					'enabled' => false,
					'config'  => array(
						'bot_token'                 => '',
						'chat_id'                   => '',
						'parse_mode'                => '',
						'disable_web_page_preview'  => '',
					),
					'events'  => self::default_channel_events(),
				),
				'whatsapp' => array(
					'enabled' => false,
					'config'  => array(
						'access_token'        => '',
						'phone_number_id'     => '',
						'recipient_phone'     => '',
						'api_version'         => 'v23.0',
						'message_type'        => 'template',
						'template_name'       => '',
						'template_language'   => 'en_US',
						'template_parameters' => 'subject_body',
						'preview_url'         => '',
					),
					'events'  => self::default_channel_events(),
				),
			),
			'triggers'            => self::default_channel_events(),
			'trigger_recipients' => self::default_trigger_recipients(),
			'templates'           => self::default_templates(),
			'template_modes'      => self::default_template_modes(),
			'whatsapp_templates' => self::default_whatsapp_templates(),
			'limits'              => array(
				'date' => current_time( 'Y-m-d' ),
				'sent' => 0,
			),
		);

		/**
		 * Filter default settings.
		 *
		 * Extensions can add their own settings buckets here so they are preserved
		 * by get_all() and can be sanitized through niftyconnect_sanitize_settings.
		 *
		 * @param array $settings Default settings.
		 */
		return apply_filters( 'niftyconnect_default_settings', $settings );
	}

	/**
	 * Default event templates.
	 *
	 * @return array
	 */
	public static function default_templates() {
		$templates = array(
			'test'               => array(
				'subject' => __( 'Test notification from {{site_name}}', 'niftyconnect' ),
				'body'    => __( 'This is a test notification from {{site_name}}. If you received this message, niftyConnect is working.', 'niftyconnect' ),
			),
			'post_published'     => array(
				'subject' => __( 'New post published: {{post_title}}', 'niftyconnect' ),
				'body'    => __( "A new post has been published on {{site_name}}.\n\nTitle: {{post_title}}\nAuthor: {{post_author}}\nURL: {{post_url}}", 'niftyconnect' ),
			),
			'post_updated'       => array(
				'subject' => __( 'Post updated: {{post_title}}', 'niftyconnect' ),
				'body'    => __( "A published post was updated on {{site_name}}.\n\nTitle: {{post_title}}\nAuthor: {{post_author}}\nURL: {{post_url}}", 'niftyconnect' ),
			),
			'comment_new'        => array(
				'subject' => __( 'New comment on {{post_title}}', 'niftyconnect' ),
				'body'    => __( "A new comment was posted on {{site_name}}.\n\nPost: {{post_title}}\nAuthor: {{comment_author}}\nComment: {{comment_content}}\nURL: {{comment_url}}", 'niftyconnect' ),
			),
			'comment_pending'    => array(
				'subject' => __( 'Comment pending moderation on {{post_title}}', 'niftyconnect' ),
				'body'    => __( "A comment is waiting for moderation on {{site_name}}.\n\nPost: {{post_title}}\nAuthor: {{comment_author}}\nComment: {{comment_content}}\nModerate: {{moderation_url}}", 'niftyconnect' ),
			),
			'user_registered'    => array(
				'subject' => __( 'New user registered: {{user_login}}', 'niftyconnect' ),
				'body'    => __( "A new user registered on {{site_name}}.\n\nUsername: {{user_login}}\nEmail: {{user_email}}\nRole: {{user_role}}", 'niftyconnect' ),
			),
			'admin_login'        => array(
				'subject' => __( 'Admin login on {{site_name}}: {{user_login}}', 'niftyconnect' ),
				'body'    => __( "An administrator logged in on {{site_name}}.\n\nUsername: {{user_login}}\nName: {{user_display_name}}\nEmail: {{user_email}}\nRole: {{user_role}}\nTime: {{login_time}}\nIP address: {{login_ip}}\nUser agent: {{login_user_agent}}\nProfile: {{user_url}}", 'niftyconnect' ),
			),
			'wc_new_order'       => array(
				'subject' => __( 'New WooCommerce order #{{order_number}}', 'niftyconnect' ),
				'body'    => __( "A new order was placed on {{site_name}}.\n\nOrder: #{{order_number}}\nCustomer: {{customer_name}}\nTotal: {{order_total}}\nPayment: {{payment_method}}\nView: {{order_url}}", 'niftyconnect' ),
			),
			'wc_order_completed' => array(
				'subject' => __( 'WooCommerce order completed #{{order_number}}', 'niftyconnect' ),
				'body'    => __( "An order was marked completed on {{site_name}}.\n\nOrder: #{{order_number}}\nCustomer: {{customer_name}}\nTotal: {{order_total}}\nView: {{order_url}}", 'niftyconnect' ),
			),
			'wc_order_status'    => array(
				'subject' => __( 'Order #{{order_number}} changed to {{new_status}}', 'niftyconnect' ),
				'body'    => __( 'Order #{{order_number}} changed from {{old_status}} to {{new_status}}.', 'niftyconnect' ),
			),
			'wc_new_customer'    => array(
				'subject' => __( 'New WooCommerce customer: {{customer_name}}', 'niftyconnect' ),
				'body'    => __( "A new WooCommerce customer registered on {{site_name}}.\n\nCustomer: {{customer_name}}\nEmail: {{customer_email}}", 'niftyconnect' ),
			),
			'wc_low_stock'       => array(
				'subject' => __( 'Low stock: {{product_name}}', 'niftyconnect' ),
				'body'    => __( '{{product_name}} is low on stock. Current stock: {{stock_quantity}}.', 'niftyconnect' ),
			),
			'wc_back_in_stock'   => array(
				'subject' => __( 'Back in stock: {{product_name}}', 'niftyconnect' ),
				'body'    => __( '{{product_name}} is back in stock. Current stock: {{stock_quantity}}.', 'niftyconnect' ),
			),
		);

		/**
		 * Filter default notification templates.
		 *
		 * @param array $templates Default templates keyed by event.
		 */
		return apply_filters( 'niftyconnect_default_templates', $templates );
	}

	/**
	 * Default template source modes.
	 *
	 * @return array
	 */
	public static function default_template_modes() {
		$modes = array();

		foreach ( Feature_Registry::events() as $key => $event ) {
			if ( self::event_supports_template_mode( $key, $event ) ) {
				$modes[ $key ] = 'custom';
			}
		}

		return $modes;
	}

	/**
	 * Default per-event WhatsApp approved template settings.
	 *
	 * An empty template name falls back to the global WhatsApp message settings.
	 *
	 * @return array
	 */
	public static function default_whatsapp_templates() {
		$templates = array();

		foreach ( array_keys( self::default_templates() ) as $key ) {
			$templates[ $key ] = array(
				'name'       => '',
				'language'   => 'en_US',
				'parameters' => 'subject_body',
			);
		}

		return $templates;
	}

	/**
	 * Events that have a matching native WordPress or WooCommerce email template.
	 *
	 * @return array
	 */
	public static function template_mode_events() {
		$events    = Feature_Registry::events();
		$available = array();

		foreach ( self::template_mode_event_categories() as $key => $category ) {
			if ( ! isset( $events[ $key ]['category'] ) || $category !== $events[ $key ]['category'] ) {
				continue;
			}

			$available[ $key ] = true;
		}

		return $available;
	}

	/**
	 * Resolve the template for an event.
	 *
	 * @param string $event_key Event key.
	 * @param array  $settings  Settings.
	 * @return array
	 */
	public static function template_for_event( $event_key, array $settings ) {
		$event_key = sanitize_key( $event_key );
		$defaults  = self::default_templates();
		$template  = isset( $settings['templates'][ $event_key ] ) && is_array( $settings['templates'][ $event_key ] )
			? $settings['templates'][ $event_key ]
			: ( isset( $defaults[ $event_key ] ) ? $defaults[ $event_key ] : $defaults['test'] );
		$events    = Feature_Registry::events();
		$mode      = isset( $settings['template_modes'][ $event_key ] ) ? sanitize_key( $settings['template_modes'][ $event_key ] ) : 'custom';

		if (
			'default' === $mode
			&& isset( $events[ $event_key ], $defaults[ $event_key ] )
			&& self::event_supports_template_mode( $event_key, $events[ $event_key ] )
		) {
			return $defaults[ $event_key ];
		}

		return $template;
	}

	/**
	 * Get the default event delivery map.
	 *
	 * @return array
	 */
	public static function default_channel_events() {
		$events = array();

		foreach ( Feature_Registry::events() as $key => $event ) {
			$events[ $key ] = array_key_exists( 'default', $event ) ? (bool) $event['default'] : true;
		}

		return $events;
	}

	/**
	 * Get default trigger recipient settings.
	 *
	 * @return array
	 */
	public static function default_trigger_recipients() {
		$recipients = array();

		foreach ( Feature_Registry::events() as $key => $event ) {
			$recipients[ $key ] = array(
				'roles'  => self::default_trigger_recipient_roles( $key, $event ),
				'custom' => array(),
			);
		}

		return $recipients;
	}

	/**
	 * Get the default role used by recipient routing.
	 *
	 * @return string
	 */
	public static function default_recipient_role() {
		$roles = self::valid_role_keys();

		if ( in_array( 'administrator', $roles, true ) ) {
			return 'administrator';
		}

		return isset( $roles[0] ) ? sanitize_key( $roles[0] ) : 'administrator';
	}

	/**
	 * Get default roles for an event's recipient routing.
	 *
	 * @param string $event_key Event key.
	 * @param array  $event     Event definition.
	 * @return array
	 */
	private static function default_trigger_recipient_roles( $event_key, array $event ) {
		$fallback = self::default_recipient_role();
		$defaults = array(
			'post_published'     => array( 'administrator', 'editor', 'subscriber' ),
			'post_updated'       => array( 'administrator', 'editor' ),
			'comment_new'        => array( 'administrator', 'editor', 'author' ),
			'comment_pending'    => array( 'administrator', 'editor' ),
			'user_registered'    => array( 'administrator' ),
			'admin_login'        => array( 'administrator' ),
			'wc_new_order'       => array( 'administrator', 'shop_manager' ),
			'wc_order_completed' => array( 'administrator', 'shop_manager' ),
		);
		$roles    = isset( $defaults[ $event_key ] ) ? $defaults[ $event_key ] : array_filter( array( $fallback ) );
		$roles    = self::filter_valid_roles( $roles );

		/**
		 * Filter default recipient roles for a notification trigger.
		 *
		 * @param array  $roles     Default role keys.
		 * @param string $event_key Event key.
		 * @param array  $event     Event definition.
		 */
		$roles = apply_filters( 'niftyconnect_default_trigger_recipient_roles', $roles, $event_key, $event );

		return self::filter_valid_roles( is_array( $roles ) ? $roles : array() );
	}

	/**
	 * Get valid role keys.
	 *
	 * @return array
	 */
	private static function valid_role_keys() {
		$wp_roles = wp_roles();

		return $wp_roles && is_array( $wp_roles->roles )
			? array_map( 'sanitize_key', array_keys( $wp_roles->roles ) )
			: array();
	}

	/**
	 * Keep only valid role keys.
	 *
	 * @param array $roles Role keys.
	 * @return array
	 */
	private static function filter_valid_roles( array $roles ) {
		$valid_roles = self::valid_role_keys();
		$filtered    = array();

		foreach ( $roles as $role ) {
			$role = sanitize_key( $role );

			if ( in_array( $role, $valid_roles, true ) ) {
				$filtered[] = $role;
			}
		}

		return array_values( array_unique( $filtered ) );
	}

	/**
	 * Sanitize settings.
	 *
	 * @param array $input Raw settings.
	 * @return array
	 */
	public static function sanitize( array $input ) {
		$defaults = self::defaults();
		$input    = Arr::merge_defaults( $defaults, $input );
		$current  = get_option( self::OPTION, array() );

		if ( ! is_array( $current ) ) {
			$current = array();
		}

		$current = Arr::merge_defaults( $defaults, $current );

		$recipients = array();
		if ( isset( $input['general']['recipients'] ) && is_array( $input['general']['recipients'] ) ) {
			foreach ( $input['general']['recipients'] as $recipient ) {
				$email = sanitize_email( $recipient );
				if ( is_email( $email ) ) {
					$recipients[] = $email;
				}
			}
		}

		if ( empty( $recipients ) ) {
			$admin_email = sanitize_email( get_option( 'admin_email' ) );
			if ( is_email( $admin_email ) ) {
				$recipients[] = $admin_email;
			}
		}

		$daily_limit = isset( $input['general']['daily_limit'] ) ? absint( $input['general']['daily_limit'] ) : $defaults['general']['daily_limit'];

		$settings = $defaults;

		$settings['general'] = array(
			'enabled'     => ! empty( $input['general']['enabled'] ),
			'recipients'  => array_values( array_unique( $recipients ) ),
			'from_name'   => sanitize_text_field( $input['general']['from_name'] ),
			'from_email'  => is_email( $input['general']['from_email'] ) ? sanitize_email( $input['general']['from_email'] ) : sanitize_email( get_option( 'admin_email' ) ),
			'daily_limit' => $daily_limit,
		);

		$channel_definitions = Feature_Registry::channels();
		foreach ( array_keys( $channel_definitions ) as $key ) {
			$enabled = ! empty( $input['channels'][ $key ]['enabled'] );

			$settings['channels'][ $key ] = array(
				'enabled' => $enabled,
				'config'  => self::sanitize_channel_config( $key, isset( $input['channels'][ $key ]['config'] ) && is_array( $input['channels'][ $key ]['config'] ) ? $input['channels'][ $key ]['config'] : array() ),
				'events'  => self::sanitize_channel_events( isset( $input['channels'][ $key ]['events'] ) && is_array( $input['channels'][ $key ]['events'] ) ? $input['channels'][ $key ]['events'] : array() ),
			);

			if ( 'email' === $key ) {
				unset( $settings['channels'][ $key ]['config'] );
			}
		}

		foreach ( array_keys( Feature_Registry::events() ) as $key ) {
			$enabled = ! empty( $input['triggers'][ $key ] );

			$settings['triggers'][ $key ] = $enabled;
			$settings['trigger_recipients'][ $key ] = self::sanitize_trigger_recipients(
				isset( $input['trigger_recipients'][ $key ] ) && is_array( $input['trigger_recipients'][ $key ] ) ? $input['trigger_recipients'][ $key ] : array()
			);
		}

		foreach ( $defaults['templates'] as $key => $template ) {
			$settings['templates'][ $key ] = array(
				'subject' => isset( $input['templates'][ $key ]['subject'] ) ? sanitize_text_field( $input['templates'][ $key ]['subject'] ) : $template['subject'],
				'body'    => isset( $input['templates'][ $key ]['body'] ) ? wp_kses_post( $input['templates'][ $key ]['body'] ) : $template['body'],
			);
		}

		$settings['template_modes'] = self::sanitize_template_modes(
			isset( $input['template_modes'] ) && is_array( $input['template_modes'] ) ? $input['template_modes'] : array()
		);
		$settings['whatsapp_templates'] = self::sanitize_whatsapp_templates(
			isset( $input['whatsapp_templates'] ) && is_array( $input['whatsapp_templates'] ) ? $input['whatsapp_templates'] : array()
		);

		$settings['limits'] = array(
			'date' => isset( $current['limits']['date'] ) ? sanitize_text_field( $current['limits']['date'] ) : current_time( 'Y-m-d' ),
			'sent' => isset( $current['limits']['sent'] ) ? absint( $current['limits']['sent'] ) : 0,
		);

		/**
		 * Filter sanitized settings.
		 *
		 * Extensions should use this to sanitize settings buckets added through
		 * niftyconnect_default_settings.
		 *
		 * @param array $settings Sanitized settings.
		 * @param array $input    Raw settings input.
		 * @param array $defaults Default settings.
		 * @param array $current  Current stored settings.
		 */
		return apply_filters( 'niftyconnect_sanitize_settings', $settings, $input, $defaults, $current );
	}

	/**
	 * Sanitize channel event routing.
	 *
	 * @param array $events Raw event map.
	 * @return array
	 */
	private static function sanitize_channel_events( array $events ) {
		$sanitized = array();

		foreach ( array_keys( Feature_Registry::events() ) as $key ) {
			$enabled = ! empty( $events[ $key ] );

			$sanitized[ $key ] = $enabled;
		}

		return $sanitized;
	}

	/**
	 * Sanitize template source modes.
	 *
	 * @param array $modes Raw mode map.
	 * @return array
	 */
	private static function sanitize_template_modes( array $modes ) {
		$sanitized = self::default_template_modes();

		foreach ( Feature_Registry::events() as $key => $event ) {
			if ( ! self::event_supports_template_mode( $key, $event ) ) {
				continue;
			}

			$mode = isset( $modes[ $key ] ) ? sanitize_key( $modes[ $key ] ) : $sanitized[ $key ];

			$sanitized[ $key ] = in_array( $mode, array( 'custom', 'default' ), true ) ? $mode : 'custom';
		}

		return $sanitized;
	}

	/**
	 * Sanitize per-event WhatsApp approved template settings.
	 *
	 * @param array $templates Raw template settings keyed by event.
	 * @return array
	 */
	private static function sanitize_whatsapp_templates( array $templates ) {
		$sanitized = self::default_whatsapp_templates();

		foreach ( $sanitized as $key => $defaults ) {
			$template   = isset( $templates[ $key ] ) && is_array( $templates[ $key ] ) ? $templates[ $key ] : array();
			$parameters = isset( $template['parameters'] ) ? sanitize_key( $template['parameters'] ) : $defaults['parameters'];

			$sanitized[ $key ] = array(
				'name'       => isset( $template['name'] ) ? sanitize_key( $template['name'] ) : $defaults['name'],
				'language'   => isset( $template['language'] ) && '' !== trim( (string) $template['language'] )
					? sanitize_text_field( $template['language'] )
					: $defaults['language'],
				'parameters' => in_array( $parameters, array( 'none', 'message', 'subject_body' ), true )
					? $parameters
					: $defaults['parameters'],
			);
		}

		return $sanitized;
	}

	/**
	 * Check whether an event can choose between default and custom templates.
	 *
	 * @param string $event_key Event key.
	 * @param array  $event     Event definition.
	 * @return bool
	 */
	private static function event_supports_template_mode( $event_key, array $event ) {
		$event_key  = sanitize_key( $event_key );
		$categories = self::template_mode_event_categories();

		return isset( $categories[ $event_key ], $event['category'] )
			&& $categories[ $event_key ] === $event['category'];
	}

	/**
	 * Native-template-capable events keyed to their source category.
	 *
	 * @return array
	 */
	private static function template_mode_event_categories() {
		$categories = array(
			'comment_new'        => 'wordpress',
			'comment_pending'    => 'wordpress',
			'user_registered'    => 'wordpress',
			'wc_new_order'       => 'woocommerce',
			'wc_order_completed' => 'woocommerce',
			'wc_new_customer'    => 'woocommerce',
		);

		/**
		 * Filter native-template-capable event categories.
		 *
		 * @param array $categories Event category map keyed by event.
		 */
		return apply_filters( 'niftyconnect_template_mode_event_categories', $categories );
	}

	/**
	 * Sanitize trigger recipient routing.
	 *
	 * @param array $input Raw recipient settings.
	 * @return array
	 */
	private static function sanitize_trigger_recipients( array $input ) {
		$valid_roles = self::valid_role_keys();
		$roles       = array();

		if ( isset( $input['roles'] ) && is_array( $input['roles'] ) ) {
			foreach ( $input['roles'] as $role ) {
				$role = sanitize_key( $role );

				if ( in_array( $role, $valid_roles, true ) ) {
					$roles[] = $role;
				}
			}
		}

		$roles = array_values( array_unique( $roles ) );

		$custom = array();

		if ( isset( $input['custom'] ) && is_array( $input['custom'] ) ) {
			foreach ( $input['custom'] as $recipient ) {
				$email = sanitize_email( $recipient );

				if ( is_email( $email ) ) {
					$custom[] = $email;
				}
			}
		}

		$custom = array_values( array_unique( $custom ) );

		return array(
			'roles'  => $roles,
			'custom' => $custom,
		);
	}

	/**
	 * Sanitize channel configuration.
	 *
	 * @param string $key    Channel key.
	 * @param array  $config Raw config.
	 * @return array
	 */
	private static function sanitize_channel_config( $key, array $config ) {
		$sanitized = array();

		switch ( $key ) {
			case 'telegram':
				$sanitized['bot_token'] = isset( $config['bot_token'] ) ? sanitize_text_field( $config['bot_token'] ) : '';
				$chat_id                = isset( $config['chat_id'] ) ? $config['chat_id'] : '';
				$sanitized['chat_id']   = Telegram_Chat::sanitize( $chat_id );
				$parse_modes            = array( '', 'Markdown', 'MarkdownV2', 'HTML' );
				$parse_mode             = isset( $config['parse_mode'] ) ? sanitize_text_field( $config['parse_mode'] ) : '';
				$sanitized['parse_mode'] = in_array( $parse_mode, $parse_modes, true ) ? $parse_mode : '';
				$sanitized['disable_web_page_preview'] = ! empty( $config['disable_web_page_preview'] ) ? '1' : '';
				break;

			case 'whatsapp':
				$sanitized['access_token']    = isset( $config['access_token'] ) ? sanitize_text_field( $config['access_token'] ) : '';
				$sanitized['phone_number_id'] = isset( $config['phone_number_id'] ) ? preg_replace( '/\D+/', '', sanitize_text_field( $config['phone_number_id'] ) ) : '';
				$sanitized['recipient_phone'] = WhatsApp_Number::sanitize( isset( $config['recipient_phone'] ) ? $config['recipient_phone'] : '' );
				$api_version                  = isset( $config['api_version'] ) ? sanitize_text_field( $config['api_version'] ) : 'v23.0';
				$sanitized['api_version']     = preg_match( '/^v\d+\.\d+$/', $api_version ) ? $api_version : 'v23.0';
				$message_type                 = isset( $config['message_type'] ) ? sanitize_key( $config['message_type'] ) : 'template';
				$sanitized['message_type']    = in_array( $message_type, array( 'template', 'text' ), true ) ? $message_type : 'template';
				$sanitized['template_name']   = isset( $config['template_name'] ) ? sanitize_key( $config['template_name'] ) : '';
				$sanitized['template_language'] = isset( $config['template_language'] ) ? sanitize_text_field( $config['template_language'] ) : 'en_US';
				$template_parameters          = isset( $config['template_parameters'] ) ? sanitize_key( $config['template_parameters'] ) : 'subject_body';
				$sanitized['template_parameters'] = in_array( $template_parameters, array( 'none', 'message', 'subject_body' ), true ) ? $template_parameters : 'subject_body';
				$sanitized['preview_url']     = ! empty( $config['preview_url'] ) ? '1' : '';
				break;
		}

		return $sanitized;
	}

}
