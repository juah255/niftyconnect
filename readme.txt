=== niftyConnect: Telegram and Email Notifications ===
Contributors: juah255
Tags: notifications, email notifications, woocommerce, comments, users
Requires at least: 6.2
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Receive important WordPress and WooCommerce event notifications with customizable email and Telegram templates.

== Description ==

niftyConnect helps site users receive timely notifications for important WordPress and WooCommerce events.

niftyConnect includes email and Telegram notification channels, customizable templates, per-channel notification routing, trigger-specific role and custom recipients, manual test notifications, Telegram message controls, and an optional administrator-configured daily sending limit. Set the daily limit to `0` for unlimited sending.

= Features =

* Email notification channel.
* Telegram notification channel with bot, chat, formatting, and link preview settings.
* Per-channel notification routing for WordPress and WooCommerce events.
* Trigger-specific role recipients and custom email recipients.
* Custom templates for each event.
* Manual test notification.
* New post published notifications.
* Post updated notifications.
* New comment notifications.
* Pending comment moderation notifications.
* New user registration notifications.
* WooCommerce new order notifications.
* WooCommerce completed order notifications.
* WooCommerce order status change notifications.
* WooCommerce new customer notifications.
* WooCommerce low stock notifications.
* WooCommerce back in stock notifications.
* Optional daily notification sending limit.

== Installation ==

1. Upload the `niftyconnect` folder to `/wp-content/plugins/`.
2. Activate `niftyConnect` from the Plugins screen.
3. Go to `niftyConnect` in the WordPress admin menu.
4. Configure recipients, templates, channels, and event triggers.
5. Send a manual test notification.

== Screenshots ==

1. Overview screen with notification activity and configuration status.
2. Trigger routing screen for Telegram and email event notifications.
3. Notification template screen for WordPress, WooCommerce, and system messages.
4. Settings screen for global delivery controls and channel setup.

== Frequently Asked Questions ==

= Does niftyConnect send real notifications? =

Yes. niftyConnect sends email notifications through WordPress' `wp_mail()` system and Telegram notifications through the Telegram Bot API.

= Does WooCommerce need to be installed? =

No. WooCommerce hooks are registered safely and only send order notifications when WooCommerce is active.

= Can developers add custom channels? =

Yes. Use the `niftyconnect_register_providers` action and implement the `Provider_Interface` contract.

== Third-party services ==

niftyConnect can send Telegram notifications only after an administrator enters a Telegram bot token and chat ID. When Telegram is enabled, the plugin sends the notification subject, notification body, and configured chat ID to the Telegram Bot API so Telegram can deliver the message. Depending on the enabled triggers and templates, the notification message may include site, post, comment, user, and WooCommerce order details selected in your notification template.

Telegram service: https://telegram.org/
Telegram Bot API: https://core.telegram.org/bots/api
Telegram Terms of Service: https://telegram.org/tos
Telegram Privacy Policy: https://telegram.org/privacy

== Changelog ==

= 1.0.1 =

* Added admin login alert notification.
* Added support links for easier help and contact.
* Improved plugin admin settings page.

= 1.0.0 =

* Initial release.
