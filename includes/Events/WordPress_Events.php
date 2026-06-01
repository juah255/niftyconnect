<?php
/**
 * WordPress event hooks.
 *
 * @package NiftyConnect
 */

namespace NiftyConnect\Events;

use NiftyConnect\Notifications\Notification_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Captures core WordPress events.
 */
final class WordPress_Events {
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
		add_action( 'transition_post_status', array( $this, 'on_transition_post_status' ), 10, 3 );
		add_action( 'post_updated', array( $this, 'on_post_updated' ), 10, 3 );
		add_action( 'comment_post', array( $this, 'on_comment_post' ), 10, 3 );
		add_action( 'user_register', array( $this, 'on_user_register' ), 10, 1 );
		add_action( 'wp_login', array( $this, 'on_wp_login' ), 10, 2 );
	}

	/**
	 * Trigger when a post is first published.
	 *
	 * @param string   $new_status New status.
	 * @param string   $old_status Old status.
	 * @param \WP_Post $post       Post object.
	 * @return void
	 */
	public function on_transition_post_status( $new_status, $old_status, $post ) {
		if ( 'publish' !== $new_status || 'publish' === $old_status || ! $this->is_supported_post( $post ) ) {
			return;
		}

		$this->notifications->send_event( 'post_published', $this->post_context( $post ) );
	}

	/**
	 * Trigger when a published post is updated.
	 *
	 * @param int      $post_id     Post ID.
	 * @param \WP_Post $post_after  Updated post.
	 * @param \WP_Post $post_before Previous post.
	 * @return void
	 */
	public function on_post_updated( $post_id, $post_after, $post_before ) {
		unset( $post_id );

		if ( ! $this->is_supported_post( $post_after ) || 'publish' !== $post_after->post_status || 'publish' !== $post_before->post_status ) {
			return;
		}

		if ( wp_is_post_autosave( $post_after ) || wp_is_post_revision( $post_after ) ) {
			return;
		}

		$this->notifications->send_event( 'post_updated', $this->post_context( $post_after ) );
	}

	/**
	 * Trigger on approved or pending comments.
	 *
	 * @param int        $comment_id       Comment ID.
	 * @param int|string $comment_approved Approval status.
	 * @param array      $commentdata      Comment data.
	 * @return void
	 */
	public function on_comment_post( $comment_id, $comment_approved, $commentdata ) {
		unset( $commentdata );

		$comment = get_comment( $comment_id );

		if ( ! $comment instanceof \WP_Comment ) {
			return;
		}

		if ( 1 === (int) $comment_approved ) {
			$this->notifications->send_event( 'comment_new', $this->comment_context( $comment ) );
			return;
		}

		if ( '0' === (string) $comment_approved || 0 === (int) $comment_approved ) {
			$this->notifications->send_event( 'comment_pending', $this->comment_context( $comment ) );
		}
	}

	/**
	 * Trigger on user registration.
	 *
	 * @param int $user_id User ID.
	 * @return void
	 */
	public function on_user_register( $user_id ) {
		$user = get_userdata( $user_id );

		if ( ! $user ) {
			return;
		}

		$roles = is_array( $user->roles ) ? $user->roles : array();

		$this->notifications->send_event(
			'user_registered',
			array(
				'user_id'    => $user->ID,
				'user_login' => $user->user_login,
				'user_email' => $user->user_email,
				'user_role'  => implode( ', ', array_map( 'translate_user_role', $roles ) ),
				'user_url'   => admin_url( 'user-edit.php?user_id=' . absint( $user->ID ) ),
			)
		);
	}

	/**
	 * Trigger when an administrator logs in.
	 *
	 * @param string   $user_login Username.
	 * @param \WP_User $user       User object.
	 * @return void
	 */
	public function on_wp_login( $user_login, $user ) {
		unset( $user_login );

		if ( ! $user instanceof \WP_User || ! user_can( $user, 'manage_options' ) ) {
			return;
		}

		$this->notifications->send_event( 'admin_login', $this->user_context( $user ) );
	}

	/**
	 * Check if a post should trigger post events.
	 *
	 * @param mixed $post Post value.
	 * @return bool
	 */
	private function is_supported_post( $post ) {
		return $post instanceof \WP_Post
			&& 'post' === $post->post_type
			&& ! wp_is_post_autosave( $post )
			&& ! wp_is_post_revision( $post );
	}

	/**
	 * Build post template context.
	 *
	 * @param \WP_Post $post Post object.
	 * @return array
	 */
	private function post_context( \WP_Post $post ) {
		$author = get_userdata( (int) $post->post_author );

		return array(
			'post_id'     => $post->ID,
			'post_title'  => get_the_title( $post ),
			'post_url'    => get_permalink( $post ),
			'post_author' => $author ? $author->display_name : '',
			'post_type'   => $post->post_type,
			'edit_url'    => get_edit_post_link( $post->ID, '' ),
		);
	}

	/**
	 * Build comment template context.
	 *
	 * @param \WP_Comment $comment Comment object.
	 * @return array
	 */
	private function comment_context( \WP_Comment $comment ) {
		$post = get_post( $comment->comment_post_ID );

		return array(
			'comment_id'      => $comment->comment_ID,
			'comment_author'  => $comment->comment_author,
			'comment_email'   => $comment->comment_author_email,
			'comment_content' => wp_trim_words( wp_strip_all_tags( $comment->comment_content ), 60 ),
			'comment_url'     => get_comment_link( $comment ),
			'moderation_url'  => admin_url( 'comment.php?action=editcomment&c=' . absint( $comment->comment_ID ) ),
			'post_id'         => $post ? $post->ID : 0,
			'post_title'      => $post ? get_the_title( $post ) : '',
			'post_url'        => $post ? get_permalink( $post ) : '',
		);
	}

	/**
	 * Build user template context.
	 *
	 * @param \WP_User $user User object.
	 * @return array
	 */
	private function user_context( \WP_User $user ) {
		$roles      = is_array( $user->roles ) ? $user->roles : array();
		$remote_ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';

		return array(
			'user_id'           => $user->ID,
			'user_login'        => $user->user_login,
			'user_email'        => $user->user_email,
			'user_display_name' => $user->display_name,
			'user_role'         => implode( ', ', array_map( 'translate_user_role', $roles ) ),
			'user_url'          => admin_url( 'user-edit.php?user_id=' . absint( $user->ID ) ),
			'login_time'        => wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ) ),
			'login_ip'          => $remote_ip,
			'login_user_agent'  => $user_agent,
		);
	}
}
