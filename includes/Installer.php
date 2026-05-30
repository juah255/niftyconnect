<?php
/**
 * Activation routines.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect;

use NiftyConnect\Notifications\Activity_Log;
use NiftyConnect\Support\Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Installer class.
 */
final class Installer {
	/**
	 * Run on plugin activation.
	 *
	 * @return void
	 */
	public static function activate() {
		Settings::ensure_defaults();
		Activity_Log::create_table();
		update_option( 'niftyconnect_version', NIFTYCONNECT_VERSION, false );
	}

	/**
	 * Ensure new schema exists for already-active installs.
	 *
	 * @return void
	 */
	public static function maybe_upgrade() {
		Settings::ensure_defaults();

		if ( self::needs_activity_table_upgrade() ) {
			Activity_Log::create_table();
		}

		if ( NIFTYCONNECT_VERSION !== get_option( 'niftyconnect_version' ) ) {
			update_option( 'niftyconnect_version', NIFTYCONNECT_VERSION, false );
		}
	}

	/**
	 * Check whether the activity table needs to be created or updated.
	 *
	 * @return bool
	 */
	private static function needs_activity_table_upgrade() {
		return Activity_Log::TABLE_VERSION !== get_option( 'niftyconnect_activity_table_version' );
	}
}
