<?php
/**
 * Uninstall cleanup.
 *
 * @package NiftyConnect
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'niftyconnect_settings' );
delete_option( 'niftyconnect_version' );
delete_option( 'niftyconnect_activity_table_version' );

global $wpdb;

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange -- Removes the plugin-owned activity table during uninstall.
$wpdb->query(
	$wpdb->prepare(
		'DROP TABLE IF EXISTS %i',
		$wpdb->prefix . 'niftyconnect_activity'
	)
);
// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Removes plugin-owned user meta during uninstall.
$wpdb->delete(
	$wpdb->usermeta,
	array(
		'meta_key' => 'niftyconnect_telegram_chat_id',
	),
	array( '%s' )
);
// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.SlowDBQuery.slow_db_query_meta_key
