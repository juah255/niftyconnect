<?php
/**
 * User profile Telegram settings.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Admin;

use NiftyConnect\Support\Telegram_Chat;
use NiftyConnect\Support\WhatsApp_Number;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Adds channel destination fields to user profiles.
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
	 * Render channel destination fields.
	 *
	 * @param \WP_User $user User object.
	 * @return void
	 */
	public function render( $user ) {
		if ( ! $user instanceof \WP_User ) {
			return;
		}

		$chat_id        = Telegram_Chat::for_user( $user->ID );
		$whatsapp_phone = WhatsApp_Number::for_user( $user->ID );
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
			<tr>
				<th><label for="niftyconnect-whatsapp-phone"><?php esc_html_e( 'WhatsApp Phone', 'niftyconnect' ); ?></label></th>
				<td>
					<input
						type="tel"
						name="niftyconnect_whatsapp_phone"
						id="niftyconnect-whatsapp-phone"
						value="<?php echo esc_attr( $whatsapp_phone ); ?>"
						class="regular-text"
						autocomplete="tel"
					/>
					<p class="description">
						<?php esc_html_e( 'Enter the international phone number with country code. This is used for role-based WhatsApp delivery.', 'niftyconnect' ); ?>
					</p>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save channel destination fields.
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
		$whatsapp_phone = isset( $_POST['niftyconnect_whatsapp_phone'] )
			? WhatsApp_Number::sanitize( wp_unslash( $_POST['niftyconnect_whatsapp_phone'] ) )
			: '';

		if ( '' === $chat_id ) {
			delete_user_meta( $user_id, Telegram_Chat::USER_META_KEY );
		} else {
			update_user_meta( $user_id, Telegram_Chat::USER_META_KEY, $chat_id );
		}

		if ( '' === $whatsapp_phone ) {
			delete_user_meta( $user_id, WhatsApp_Number::USER_META_KEY );
		} else {
			update_user_meta( $user_id, WhatsApp_Number::USER_META_KEY, $whatsapp_phone );
		}
	}
}
