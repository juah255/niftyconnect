<?php
/**
 * User profile Telegram settings.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Admin;

use NiftyConnect\Support\Telegram_Chat;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Adds Telegram chat ID user profile fields.
 */
final class User_Profile {
	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'show_user_profile', array( $this, 'render' ) );
		add_action( 'edit_user_profile', array( $this, 'render' ) );
		add_action( 'personal_options_update', array( $this, 'save' ) );
		add_action( 'edit_user_profile_update', array( $this, 'save' ) );
	}

	/**
	 * Render the Telegram chat ID field.
	 *
	 * @param \WP_User $user User object.
	 * @return void
	 */
	public function render( $user ) {
		if ( ! $user instanceof \WP_User ) {
			return;
		}

		$chat_id = Telegram_Chat::for_user( $user->ID );
		?>
		<h2><?php esc_html_e( 'niftyConnect', 'niftyconnect' ); ?></h2>
		<table class="form-table" role="presentation">
			<tr>
				<th><label for="niftyconnect-telegram-chat-id"><?php esc_html_e( 'Telegram Chat ID', 'niftyconnect' ); ?></label></th>
				<td>
					<?php wp_nonce_field( 'niftyconnect_save_telegram_chat_id', 'niftyconnect_telegram_chat_id_nonce' ); ?>
					<input
						type="text"
						name="niftyconnect_telegram_chat_id"
						id="niftyconnect-telegram-chat-id"
						value="<?php echo esc_attr( $chat_id ); ?>"
						class="regular-text"
					/>
					<p class="description">
						<?php esc_html_e( 'Store the recipient chat ID from message.chat.id after this user starts the bot. This is used for role-based Telegram delivery.', 'niftyconnect' ); ?>
					</p>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save the Telegram chat ID field.
	 *
	 * @param int $user_id User ID.
	 * @return void
	 */
	public function save( $user_id ) {
		$user_id = absint( $user_id );

		if ( ! $user_id || ! current_user_can( 'edit_user', $user_id ) ) {
			return;
		}

		$nonce = isset( $_POST['niftyconnect_telegram_chat_id_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['niftyconnect_telegram_chat_id_nonce'] ) ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'niftyconnect_save_telegram_chat_id' ) ) {
			return;
		}

		$chat_id = isset( $_POST['niftyconnect_telegram_chat_id'] ) ? sanitize_text_field( wp_unslash( $_POST['niftyconnect_telegram_chat_id'] ) ) : '';
		$chat_id = Telegram_Chat::sanitize( $chat_id );

		if ( '' === $chat_id ) {
			delete_user_meta( $user_id, Telegram_Chat::USER_META_KEY );
			return;
		}

		update_user_meta( $user_id, Telegram_Chat::USER_META_KEY, $chat_id );
	}
}
