<?php
/**
 * Optional daily notification limit handling.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications;

use NiftyConnect\Support\Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enforces the user-configured daily sending limit. A limit below 1 is unlimited.
 */
final class Daily_Limiter {
	/**
	 * Get current limit status.
	 *
	 * @return array
	 */
	public function status() {
		$settings = $this->normalized_settings();
		$limit    = $this->limit( $settings );
		$sent     = absint( $settings['limits']['sent'] );

		return array(
			'date'      => $settings['limits']['date'],
			'sent'      => $sent,
			'limit'     => $limit,
			'remaining' => $limit > 0 ? max( 0, $limit - $sent ) : null,
			'unlimited' => $limit < 1,
		);
	}

	/**
	 * Check if another notification may be sent.
	 *
	 * @return bool
	 */
	public function can_send() {
		$status = $this->status();

		return $status['unlimited'] || $status['sent'] < $status['limit'];
	}

	/**
	 * Increment sent count.
	 *
	 * @return void
	 */
	public function increment() {
		$settings = $this->normalized_settings();

		if ( $this->limit( $settings ) < 1 ) {
			return;
		}

		$settings['limits']['sent'] = absint( $settings['limits']['sent'] ) + 1;
		update_option( Settings::OPTION, $settings, false );
	}

	/**
	 * Get normalized settings, resetting stale daily counters.
	 *
	 * @return array
	 */
	private function normalized_settings() {
		$settings = Settings::get_all();
		$today    = current_time( 'Y-m-d' );

		if ( ! isset( $settings['limits']['date'] ) || $today !== $settings['limits']['date'] ) {
			$settings['limits'] = array(
				'date' => $today,
				'sent' => 0,
			);
			update_option( Settings::OPTION, $settings, false );
		}

		return $settings;
	}

	/**
	 * Get effective daily limit.
	 *
	 * @param array $settings Settings.
	 * @return int Zero means unlimited.
	 */
	private function limit( array $settings ) {
		$limit = isset( $settings['general']['daily_limit'] ) ? absint( $settings['general']['daily_limit'] ) : 0;

		return (int) apply_filters( 'niftyconnect_daily_limit', $limit, $settings );
	}
}
