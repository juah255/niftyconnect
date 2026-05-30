<?php
/**
 * Notification value object.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Immutable notification data passed to providers.
 */
final class Notification {
	/**
	 * Event key.
	 *
	 * @var string
	 */
	private $event_key;

	/**
	 * Subject.
	 *
	 * @var string
	 */
	private $subject;

	/**
	 * Body.
	 *
	 * @var string
	 */
	private $body;

	/**
	 * Recipients.
	 *
	 * @var array
	 */
	private $recipients;

	/**
	 * Event context.
	 *
	 * @var array
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @param string $event_key  Event key.
	 * @param string $subject    Subject.
	 * @param string $body       Body.
	 * @param array  $recipients Recipients.
	 * @param array  $context    Context.
	 */
	public function __construct( $event_key, $subject, $body, array $recipients, array $context ) {
		$this->event_key  = $event_key;
		$this->subject    = $subject;
		$this->body       = $body;
		$this->recipients = $recipients;
		$this->context    = $context;
	}

	/**
	 * Get event key.
	 *
	 * @return string
	 */
	public function event_key() {
		return $this->event_key;
	}

	/**
	 * Get subject.
	 *
	 * @return string
	 */
	public function subject() {
		return $this->subject;
	}

	/**
	 * Get body.
	 *
	 * @return string
	 */
	public function body() {
		return $this->body;
	}

	/**
	 * Get recipients.
	 *
	 * @return array
	 */
	public function recipients() {
		return $this->recipients;
	}

	/**
	 * Get context.
	 *
	 * @return array
	 */
	public function context() {
		return $this->context;
	}
}
