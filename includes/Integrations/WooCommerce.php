<?php
/**
 * WooCommerce integration.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Integrations;

use NiftyConnect\Notifications\Notification_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Captures WooCommerce events.
 */
final class WooCommerce {
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
	 * Register WooCommerce hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'woocommerce_new_order', array( $this, 'on_new_order' ), 10, 2 );
		add_action( 'woocommerce_order_status_completed', array( $this, 'on_order_completed' ), 10, 2 );
		add_action( 'woocommerce_order_status_changed', array( $this, 'on_order_status_changed' ), 10, 4 );
		add_action( 'woocommerce_created_customer', array( $this, 'on_customer_created' ), 10, 3 );
		add_action( 'woocommerce_low_stock', array( $this, 'on_low_stock' ), 10, 1 );
		add_action( 'woocommerce_product_set_stock_status', array( $this, 'on_stock_status_changed' ), 10, 3 );
		add_action( 'woocommerce_variation_set_stock_status', array( $this, 'on_stock_status_changed' ), 10, 3 );
	}

	/**
	 * Trigger on new order.
	 *
	 * @param int             $order_id Order ID.
	 * @param \WC_Order|false $order    Order object.
	 * @return void
	 */
	public function on_new_order( $order_id, $order = false ) {
		$order = $this->get_order( $order_id, $order );

		if ( ! $order ) {
			return;
		}

		$this->notifications->send_event( 'wc_new_order', $this->order_context( $order ) );
	}

	/**
	 * Trigger when an order becomes completed.
	 *
	 * @param int             $order_id Order ID.
	 * @param \WC_Order|false $order    Order object.
	 * @return void
	 */
	public function on_order_completed( $order_id, $order = false ) {
		$order = $this->get_order( $order_id, $order );

		if ( ! $order ) {
			return;
		}

		$this->notifications->send_event( 'wc_order_completed', $this->order_context( $order ) );
	}

	/**
	 * Trigger when an order changes status.
	 *
	 * @param int             $order_id   Order ID.
	 * @param string          $old_status Previous status.
	 * @param string          $new_status New status.
	 * @param \WC_Order|false $order      Order object.
	 * @return void
	 */
	public function on_order_status_changed( $order_id, $old_status, $new_status, $order = false ) {
		if ( $old_status === $new_status ) {
			return;
		}

		$order = $this->get_order( $order_id, $order );

		if ( ! $order ) {
			return;
		}

		$context = array_merge(
			$this->order_context( $order ),
			array(
				'old_status' => wc_get_order_status_name( $old_status ),
				'new_status' => wc_get_order_status_name( $new_status ),
			)
		);

		$this->notifications->send_event( 'wc_order_status', $context );
	}

	/**
	 * Trigger when WooCommerce creates a customer account.
	 *
	 * @param int   $customer_id        Customer user ID.
	 * @param array $new_customer_data  Customer data from WooCommerce.
	 * @param bool  $password_generated Whether WooCommerce generated the password.
	 * @return void
	 */
	public function on_customer_created( $customer_id, $new_customer_data = array(), $password_generated = false ) {
		unset( $password_generated );

		$user = get_userdata( $customer_id );

		if ( ! $user ) {
			return;
		}

		$first_name     = get_user_meta( $customer_id, 'first_name', true );
		$last_name      = get_user_meta( $customer_id, 'last_name', true );
		$customer_name  = trim( $first_name . ' ' . $last_name );
		$customer_email = isset( $new_customer_data['user_email'] ) && is_email( $new_customer_data['user_email'] )
			? sanitize_email( $new_customer_data['user_email'] )
			: sanitize_email( $user->user_email );

		if ( '' === $customer_name ) {
			$customer_name = $user->display_name;
		}

		$this->notifications->send_event(
			'wc_new_customer',
			array(
				'customer_id'    => absint( $customer_id ),
				'customer_name'  => $customer_name,
				'customer_email' => $customer_email,
				'customer_url'   => admin_url( 'user-edit.php?user_id=' . absint( $customer_id ) ),
			)
		);
	}

	/**
	 * Trigger when WooCommerce reports low stock.
	 *
	 * @param \WC_Product|int $product Product object or ID.
	 * @return void
	 */
	public function on_low_stock( $product ) {
		$product = $this->get_product( $product );

		if ( ! $product ) {
			return;
		}

		$this->notifications->send_event( 'wc_low_stock', $this->product_context( $product ) );
	}

	/**
	 * Trigger when a product returns to in-stock status.
	 *
	 * @param int                 $product_id   Product ID.
	 * @param string              $stock_status New stock status.
	 * @param \WC_Product|false   $product      Product object.
	 * @return void
	 */
	public function on_stock_status_changed( $product_id, $stock_status, $product = false ) {
		if ( 'instock' !== $stock_status ) {
			return;
		}

		$product = $this->get_product( $product_id, $product );

		if ( ! $product ) {
			return;
		}

		$this->notifications->send_event( 'wc_back_in_stock', $this->product_context( $product ) );
	}

	/**
	 * Resolve an order object.
	 *
	 * @param int             $order_id Order ID.
	 * @param \WC_Order|false $order    Existing order object.
	 * @return \WC_Order|false
	 */
	private function get_order( $order_id, $order = false ) {
		if ( is_object( $order ) && method_exists( $order, 'get_id' ) ) {
			return $order;
		}

		if ( function_exists( 'wc_get_order' ) ) {
			return wc_get_order( $order_id );
		}

		return false;
	}

	/**
	 * Resolve a product object.
	 *
	 * @param int|\WC_Product     $product_id Product ID or object.
	 * @param \WC_Product|false   $product    Existing product object.
	 * @return \WC_Product|false
	 */
	private function get_product( $product_id, $product = false ) {
		if ( is_object( $product_id ) && method_exists( $product_id, 'get_id' ) ) {
			return $product_id;
		}

		if ( is_object( $product ) && method_exists( $product, 'get_id' ) ) {
			return $product;
		}

		if ( function_exists( 'wc_get_product' ) ) {
			return wc_get_product( $product_id );
		}

		return false;
	}

	/**
	 * Build WooCommerce order context.
	 *
	 * @param \WC_Order $order Order object.
	 * @return array
	 */
	private function order_context( $order ) {
		$order_id       = (int) $order->get_id();
		$billing_name   = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
		$customer_name  = '' !== $billing_name ? $billing_name : $order->get_formatted_billing_full_name();
		$payment_method = $order->get_payment_method_title();
		$order_total    = function_exists( 'wc_price' ) ? wp_strip_all_tags( wc_price( $order->get_total(), array( 'currency' => $order->get_currency() ) ) ) : $order->get_total();

		return array(
			'order_id'       => $order_id,
			'order_number'   => $order->get_order_number(),
			'order_status'   => $order->get_status(),
			'order_total'    => $order_total,
			'order_total_raw' => $order->get_total(),
			'order_currency' => $order->get_currency(),
			'customer_name'  => $customer_name,
			'customer_email' => $order->get_billing_email(),
			'payment_method' => $payment_method,
			'order_url'      => admin_url( 'post.php?post=' . $order_id . '&action=edit' ),
			'billing_country' => $order->get_billing_country(),
		);
	}

	/**
	 * Build WooCommerce product context.
	 *
	 * @param \WC_Product $product Product object.
	 * @return array
	 */
	private function product_context( $product ) {
		$product_id     = (int) $product->get_id();
		$stock_quantity = $product->get_stock_quantity();

		return array(
			'product_id'       => $product_id,
			'product_name'     => $product->get_name(),
			'product_sku'      => $product->get_sku(),
			'product_url'      => get_edit_post_link( $product_id, '' ),
			'stock_quantity'   => null === $stock_quantity ? '' : $stock_quantity,
			'stock_status'     => $product->get_stock_status(),
			'low_stock_amount' => $product->get_low_stock_amount(),
		);
	}
}
