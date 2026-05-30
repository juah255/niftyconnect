<?php
/**
 * Feature registry for notification channels and events.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Support;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Centralized feature metadata.
 */
final class Feature_Registry {
	/**
	 * Check if WooCommerce is active and loaded.
	 *
	 * @return bool
	 */
	public static function is_woocommerce_active() {
		return (bool) apply_filters(
			'niftyconnect_woocommerce_active',
			class_exists( '\WooCommerce' ) || function_exists( 'WC' ) || defined( 'WC_VERSION' )
		);
	}

	/**
	 * Get channel definitions.
	 *
	 * @return array
	 */
	public static function channels() {
		$channels = array(
			'email'    => array(
				'key'         => 'email',
				'label'       => __( 'Email', 'niftyconnect' ),
				'description' => __( 'Send event notifications to one or more email recipients.', 'niftyconnect' ),
			),
			'telegram' => array(
				'key'         => 'telegram',
				'label'       => __( 'Telegram', 'niftyconnect' ),
				'description' => __( 'Send Telegram bot notifications with formatting and link preview controls.', 'niftyconnect' ),
			),
		);

		return apply_filters( 'niftyconnect_channel_definitions', $channels );
	}

	/**
	 * Get event definitions.
	 *
	 * @return array
	 */
	public static function events() {
		$events = array(
			'post_published'     => array(
				'key'         => 'post_published',
				'label'       => __( 'New post published', 'niftyconnect' ),
				'category'    => 'wordpress',
				'description' => __( 'Triggered when a standard post is published for the first time.', 'niftyconnect' ),
			),
			'post_updated'       => array(
				'key'         => 'post_updated',
				'label'       => __( 'Post updated', 'niftyconnect' ),
				'category'    => 'wordpress',
				'description' => __( 'Triggered when an already-published post is updated.', 'niftyconnect' ),
			),
			'comment_new'        => array(
				'key'         => 'comment_new',
				'label'       => __( 'New comment', 'niftyconnect' ),
				'category'    => 'wordpress',
				'description' => __( 'Triggered when a new comment is approved.', 'niftyconnect' ),
			),
			'comment_pending'    => array(
				'key'         => 'comment_pending',
				'label'       => __( 'Comment pending moderation', 'niftyconnect' ),
				'category'    => 'wordpress',
				'description' => __( 'Triggered when a new comment is waiting for moderation.', 'niftyconnect' ),
			),
			'user_registered'    => array(
				'key'         => 'user_registered',
				'label'       => __( 'New user registration', 'niftyconnect' ),
				'category'    => 'wordpress',
				'description' => __( 'Triggered when a new WordPress user account is created.', 'niftyconnect' ),
			),
			'wc_new_order'       => array(
				'key'         => 'wc_new_order',
				'label'       => __( 'New WooCommerce order', 'niftyconnect' ),
				'category'    => 'woocommerce',
				'description' => __( 'Triggered when WooCommerce creates a new order.', 'niftyconnect' ),
			),
			'wc_order_completed' => array(
				'key'         => 'wc_order_completed',
				'label'       => __( 'Order completed', 'niftyconnect' ),
				'category'    => 'woocommerce',
				'description' => __( 'Triggered when an order status changes to completed.', 'niftyconnect' ),
			),
			'wc_order_status'    => array(
				'key'         => 'wc_order_status',
				'label'       => __( 'All order status changes', 'niftyconnect' ),
				'category'    => 'woocommerce',
				'description' => __( 'Notify on every WooCommerce order status transition.', 'niftyconnect' ),
				'default'     => false,
			),
			'wc_new_customer'    => array(
				'key'         => 'wc_new_customer',
				'label'       => __( 'New customer registration', 'niftyconnect' ),
				'category'    => 'woocommerce',
				'description' => __( 'Notify when a new WooCommerce customer account is created.', 'niftyconnect' ),
				'default'     => false,
			),
			'wc_low_stock'       => array(
				'key'         => 'wc_low_stock',
				'label'       => __( 'Low stock alerts', 'niftyconnect' ),
				'category'    => 'woocommerce',
				'description' => __( 'Notify when product inventory drops below the low-stock threshold.', 'niftyconnect' ),
				'default'     => false,
			),
			'wc_back_in_stock'   => array(
				'key'         => 'wc_back_in_stock',
				'label'       => __( 'Back in stock alerts', 'niftyconnect' ),
				'category'    => 'woocommerce',
				'description' => __( 'Notify when products return to stock.', 'niftyconnect' ),
				'default'     => false,
			),
		);

		return apply_filters( 'niftyconnect_event_definitions', $events );
	}
}
