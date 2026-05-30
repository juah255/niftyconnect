<?php
/**
 * Notification activity storage.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Notifications;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Stores channel delivery activity for the admin overview.
 */
final class Activity_Log {
	const TABLE_VERSION = '1.0.0';

	/**
	 * Get the activity table name.
	 *
	 * @return string
	 */
	public static function table_name() {
		global $wpdb;

		return $wpdb->prefix . 'niftyconnect_activity';
	}

	/**
	 * Create or update the activity table.
	 *
	 * @return void
	 */
	public static function create_table() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table_name      = self::table_name();
		$charset_collate = $wpdb->get_charset_collate();

		dbDelta(
			"CREATE TABLE {$table_name} (
				id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				event_key varchar(100) NOT NULL,
				channel varchar(60) NOT NULL,
				status varchar(20) NOT NULL,
				subject text NOT NULL,
				message text NOT NULL,
				recipient_count int(11) unsigned NOT NULL DEFAULT 0,
				created_at datetime NOT NULL,
				PRIMARY KEY  (id),
				KEY event_key (event_key),
				KEY channel (channel),
				KEY status (status),
				KEY created_at (created_at)
			) {$charset_collate};"
		);

		update_option( 'niftyconnect_activity_table_version', self::TABLE_VERSION, false );
		wp_cache_set( 'activity_table_exists', true, 'niftyconnect', MINUTE_IN_SECONDS );
	}

	/**
	 * Record a channel delivery attempt.
	 *
	 * @param string $event_key       Event key.
	 * @param string $channel         Channel key.
	 * @param string $status          Delivery status.
	 * @param string $subject         Notification subject.
	 * @param string $message         Result message.
	 * @param int    $recipient_count Recipient count.
	 * @return void
	 */
	public static function record( $event_key, $channel, $status, $subject, $message, $recipient_count ) {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return;
		}

		$status = 'success' === $status ? 'success' : 'failed';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Writes to the plugin-owned activity table.
		$wpdb->insert(
			self::table_name(),
			array(
				'event_key'       => sanitize_key( $event_key ),
				'channel'         => sanitize_key( $channel ),
				'status'          => $status,
				'subject'         => sanitize_text_field( $subject ),
				'message'         => sanitize_text_field( $message ),
				'recipient_count' => absint( $recipient_count ),
				'created_at'      => current_time( 'mysql', true ),
			),
			array( '%s', '%s', '%s', '%s', '%s', '%d', '%s' )
		);

		wp_cache_delete( 'activity_total_sent', 'niftyconnect' );
		wp_cache_delete( 'activity_recent', 'niftyconnect' );
	}

	/**
	 * Get overview activity stats.
	 *
	 * @return array
	 */
	public static function summary() {
		return array(
			'total_sent' => self::total_sent(),
			'recent'     => self::recent(),
		);
	}

	/**
	 * Count successful channel deliveries.
	 *
	 * @return int
	 */
	public static function total_sent() {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return 0;
		}

		$cache_key = 'activity_total_sent';
		$count     = wp_cache_get( $cache_key, 'niftyconnect' );

		if ( false !== $count ) {
			return absint( $count );
		}

		$table_name = self::table_name();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Reads from the plugin-owned activity table.
		$count      = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT COUNT(*) FROM %i WHERE status = %s',
				$table_name,
				'success'
			)
		);

		wp_cache_set( $cache_key, $count, 'niftyconnect', MINUTE_IN_SECONDS );

		return absint( $count );
	}

	/**
	 * Get recent activity rows from the last month.
	 *
	 * @return array
	 */
	public static function recent() {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return array();
		}

		$cache_key = 'activity_recent';
		$cached    = wp_cache_get( $cache_key, 'niftyconnect' );

		if ( false !== $cached ) {
			return is_array( $cached ) ? $cached : array();
		}

		$table_name = self::table_name();
		$since      = gmdate( 'Y-m-d H:i:s', strtotime( '-30 days' ) );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Reads from the plugin-owned activity table.
		$rows       = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, event_key, channel, status, subject, message, recipient_count, created_at
				FROM %i
				WHERE created_at >= %s
				ORDER BY created_at DESC, id DESC
				LIMIT 75",
				$table_name,
				$since
			),
			ARRAY_A
		);

		if ( ! is_array( $rows ) ) {
			wp_cache_set( $cache_key, array(), 'niftyconnect', MINUTE_IN_SECONDS );
			return array();
		}

		$rows = array_map( array( __CLASS__, 'format_row' ), $rows );
		wp_cache_set( $cache_key, $rows, 'niftyconnect', MINUTE_IN_SECONDS );

		return $rows;
	}

	/**
	 * Format a database row for REST.
	 *
	 * @param array $row Activity row.
	 * @return array
	 */
	private static function format_row( array $row ) {
		$timestamp = strtotime( $row['created_at'] . ' UTC' );

		return array(
			'id'             => absint( $row['id'] ),
			'eventKey'       => sanitize_key( $row['event_key'] ),
			'channel'        => sanitize_key( $row['channel'] ),
			'status'         => 'success' === $row['status'] ? 'success' : 'failed',
			'subject'        => sanitize_text_field( $row['subject'] ),
			'message'        => sanitize_text_field( $row['message'] ),
			'recipientCount' => absint( $row['recipient_count'] ),
			'createdAt'      => $timestamp ? gmdate( DATE_ATOM, $timestamp ) : '',
			'timestamp'      => $timestamp ? $timestamp * 1000 : 0,
		);
	}

	/**
	 * Check whether the activity table exists.
	 *
	 * @return bool
	 */
	private static function table_exists() {
		global $wpdb;

		$cache_key = 'activity_table_exists';
		$cached    = wp_cache_get( $cache_key, 'niftyconnect' );

		if ( false !== $cached ) {
			return (bool) $cached;
		}

		$table_name = self::table_name();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Checks the plugin-owned activity table.
		$found      = $wpdb->get_var(
			$wpdb->prepare(
				'SHOW TABLES LIKE %s',
				$table_name
			)
		);

		$exists = $table_name === $found;
		wp_cache_set( $cache_key, $exists, 'niftyconnect', MINUTE_IN_SECONDS );

		return $exists;
	}
}
