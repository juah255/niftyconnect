<?php
/**
 * REST API controller.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\REST;

use NiftyConnect\Notifications\Activity_Log;
use NiftyConnect\Notifications\Notification_Manager;
use NiftyConnect\Support\Feature_Registry;
use NiftyConnect\Support\Settings;
use NiftyConnect\Support\Telegram_Chat;
use NiftyConnect\Support\WhatsApp_Number;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings REST endpoints for the React app.
 */
final class Settings_Controller {
	const NAMESPACE = 'niftyconnect/v1';

	/**
	 * Notification manager.
	 *
	 * @var Notification_Manager
	 */
	private $notifications;

	/**
	 * Constructor.
	 *
	 * @param Notification_Manager $notifications Notification manager.
	 */
	public function __construct( Notification_Manager $notifications ) {
		$this->notifications = $notifications;
	}

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			self::NAMESPACE,
			'/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'settings' => array(
							'type'     => 'object',
							'required' => true,
						),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/test',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'send_test' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'recipient' => array(
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_email',
					),
					'channel'   => array(
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_key',
					),
					'telegram_chat_id' => array(
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => array( Telegram_Chat::class, 'sanitize' ),
					),
					'whatsapp_phone' => array(
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => array( WhatsApp_Number::class, 'sanitize' ),
					),
				),
			)
		);
	}

	/**
	 * Check REST permissions and nonce.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return bool|\WP_Error
	 */
	public function permissions_check( \WP_REST_Request $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'niftyconnect_forbidden',
				__( 'You do not have permission to manage niftyConnect.', 'niftyconnect' ),
				array( 'status' => 403 )
			);
		}

		$nonce = $request->get_header( 'x_wp_nonce' );
		$nonce = is_string( $nonce ) ? sanitize_text_field( wp_unslash( $nonce ) ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new \WP_Error(
				'niftyconnect_invalid_nonce',
				__( 'The request nonce is invalid. Refresh the page and try again.', 'niftyconnect' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Return settings payload.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_settings() {
		return rest_ensure_response( $this->payload() );
	}

	/**
	 * Update settings.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function update_settings( \WP_REST_Request $request ) {
		$params   = $request->get_json_params();
		$settings = isset( $params['settings'] ) && is_array( $params['settings'] ) ? $params['settings'] : array();

		Settings::update_all( $settings );

		return rest_ensure_response( $this->payload() );
	}

	/**
	 * Send a manual test notification.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function send_test( \WP_REST_Request $request ) {
		$recipient        = sanitize_email( $request->get_param( 'recipient' ) );
		$channel          = sanitize_key( $request->get_param( 'channel' ) );
		$telegram_chat_id = $request->has_param( 'telegram_chat_id' )
			? Telegram_Chat::sanitize( $request->get_param( 'telegram_chat_id' ) )
			: null;
		$whatsapp_phone   = $request->has_param( 'whatsapp_phone' )
			? WhatsApp_Number::sanitize( $request->get_param( 'whatsapp_phone' ) )
			: null;
		$result           = $this->notifications->send_test( $recipient, $channel, $telegram_chat_id, $whatsapp_phone );

		if ( is_wp_error( $result ) ) {
			$data = $result->get_error_data();
			$result->add_data(
				array(
					'status' => isset( $data['status'] ) ? absint( $data['status'] ) : 400,
				)
			);

			return $result;
		}

		$message = __( 'Test notification sent.', 'niftyconnect' );

		if (
			$channel
			&& isset( $result['results'][ $channel ]['message'] )
			&& is_string( $result['results'][ $channel ]['message'] )
		) {
			$message = $result['results'][ $channel ]['message'];
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'message' => $message,
				'result'  => $result,
			)
		);
	}

	/**
	 * Build REST payload.
	 *
	 * @return array
	 */
	private function payload() {
		return array(
			'settings' => Settings::get_all(),
			'features' => array(
				'channels' => Feature_Registry::channels(),
				'events'   => Feature_Registry::events(),
			),
			'providers' => $this->notifications->providers(),
			'stats'     => array(
				'activity' => Activity_Log::summary(),
				'limit'    => $this->notifications->limit_status(),
			),
			'meta'      => array(
				'version'            => NIFTYCONNECT_VERSION,
				'woocommerceActive'  => Feature_Registry::is_woocommerce_active(),
				'defaultTemplates'   => Settings::default_templates(),
				'templateModeEvents' => Settings::template_mode_events(),
				'roles'              => $this->roles(),
			),
		);
	}

	/**
	 * Get editable WordPress roles for trigger recipient routing.
	 *
	 * @return array
	 */
	private function roles() {
		$roles    = array();
		$wp_roles = wp_roles();

		if ( ! $wp_roles || ! is_array( $wp_roles->roles ) ) {
			return $roles;
		}

		foreach ( $wp_roles->roles as $key => $role ) {
			$roles[] = array(
				'key'   => sanitize_key( $key ),
				'label' => isset( $role['name'] ) ? translate_user_role( $role['name'] ) : sanitize_text_field( $key ),
			);
		}

		return $roles;
	}
}
