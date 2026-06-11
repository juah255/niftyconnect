import type { Dispatch, SetStateAction } from 'react';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

import { clone, orderedChannels, parseRecipients } from '../utils';
import { sendTestNotification } from '../api';
import type { ChannelSettings, Payload, UpdateSettings } from '../types';
import { getChannelIcon, IconBubble } from '../components/FeatureVisuals';
import Field from '../components/Field';
import SectionTitle from '../components/SectionTitle';
import Toggle from '../components/Toggle';
import Button from '../components/ui/Button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../components/ui/Card';

interface Notice {
	type: 'success' | 'error';
	message: string;
}

interface SettingsTabProps {
	payload: Payload;
	updateSettings: UpdateSettings;
	setPayload: Dispatch< SetStateAction< Payload | null > >;
	setNotice: Dispatch< SetStateAction< Notice | null > >;
}

const channelFields: Record< string, Array< [ string, string, string ] > > = {};

export default function SettingsTab( {
	payload,
	updateSettings,
	setPayload,
	setNotice,
}: SettingsTabProps ) {
	const channels = orderedChannels( payload.features.channels );
	const [ activeChannelKey, setActiveChannelKey ] = useState(
		channels[ 0 ]?.key || 'email'
	);

	useEffect( () => {
		if (
			! channels.some( ( channel ) => channel.key === activeChannelKey )
		) {
			setActiveChannelKey( channels[ 0 ]?.key || 'email' );
		}
	}, [ activeChannelKey, channels ] );

	const activeChannel =
		payload.features.channels[ activeChannelKey ] || channels[ 0 ];
	const activeSettings = payload.settings.channels[ activeChannelKey ] || {
		enabled: false,
		config: {},
		events: {},
	};
	const ActiveChannelIcon = getChannelIcon( activeChannel?.key || 'email' );

	return (
		<>
			<SectionTitle
				title={ __( 'Settings', 'niftyconnect' ) }
				description={ __(
					'Manage delivery, channel setup, and test notifications.',
					'niftyconnect'
				) }
			/>
			<div className="grid gap-4 lg:grid-cols-2 mb-5">
				<Card>
					<CardContent className="p-4 pt-4">
						<Toggle
							checked={ payload.settings.general.enabled }
							id="nh-enable-notifications"
							label={ __(
								'Enable notifications',
								'niftyconnect'
							) }
							onChange={ ( value ) => {
								updateSettings( ( draft ) => {
									draft.general.enabled = value;
								} );
							} }
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 pt-4">
						<Field
							id="nh-daily-limit"
							label={ __(
								'Daily notification limit',
								'niftyconnect'
							) }
							type="number"
							value={ String(
								payload.settings.general.daily_limit
							) }
							help={ __(
								'Set 0 for unlimited sending.',
								'niftyconnect'
							) }
							onChange={ ( value ) => {
								updateSettings( ( draft ) => {
									draft.general.daily_limit = Math.max(
										0,
										parseInt( value, 10 ) || 0
									);
								} );
							} }
						/>
					</CardContent>
				</Card>
			</div>
			<div className="space-y-4">
				<div
					className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
					role="tablist"
					aria-label={ __( 'Channel settings', 'niftyconnect' ) }
				>
					{ channels.map( ( channel ) => (
						<button
							key={ channel.key }
							type="button"
							role="tab"
							aria-selected={ activeChannelKey === channel.key }
							className={ `inline-flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
								activeChannelKey === channel.key
									? 'bg-slate-900 text-white'
									: 'text-slate-700 hover:bg-slate-50'
							}` }
							onClick={ () => setActiveChannelKey( channel.key ) }
						>
							<span className="flex items-center gap-3">
								<IconBubble
									className={
										activeChannelKey === channel.key
											? 'h-9 w-9 bg-white/10 text-white'
											: 'h-9 w-9 bg-slate-100 text-slate-600'
									}
									icon={ getChannelIcon( channel.key ) }
									iconClassName="h-4 w-4"
								/>
								<span>{ channel.label }</span>
							</span>
						</button>
					) ) }
				</div>
				<Card>
					<CardHeader>
						<div className="flex items-start gap-4">
							<IconBubble
								className="bg-slate-100 text-slate-700"
								icon={ ActiveChannelIcon }
							/>
							<div>
								<CardTitle>{ activeChannel?.label }</CardTitle>
								<CardDescription>
									{ activeChannel?.description }
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<Toggle
							checked={ activeSettings.enabled }
							id={ `nh-channel-${ activeChannelKey }` }
							label={ __( 'Enable channel', 'niftyconnect' ) }
							onChange={ ( value ) => {
								updateSettings( ( draft ) => {
									draft.channels[ activeChannelKey ].enabled =
										value;
								} );
							} }
						/>
						<ChannelSetupFields
							channelKey={ activeChannelKey }
							payload={ payload }
							settings={ activeSettings }
							updateSettings={ updateSettings }
						/>
						<ChannelTest
							channelKey={ activeChannelKey }
							payload={ payload }
							setPayload={ setPayload }
							setNotice={ setNotice }
						/>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

function ChannelSetupFields( {
	channelKey,
	payload,
	settings,
	updateSettings,
}: {
	channelKey: string;
	payload: Payload;
	settings: ChannelSettings;
	updateSettings: UpdateSettings;
} ) {
	if ( channelKey === 'email' ) {
		return (
			<div className="space-y-4">
				<h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
					{ __( 'Setup', 'niftyconnect' ) }
				</h4>
				<Field
					id="nh-recipients"
					label={ __( 'Email recipients', 'niftyconnect' ) }
					textarea
					value={ payload.settings.general.recipients.join( '\n' ) }
					help={ __(
						'Use one email per line or separate addresses with commas.',
						'niftyconnect'
					) }
					onChange={ ( value ) => {
						updateSettings( ( draft ) => {
							draft.general.recipients = parseRecipients( value );
						} );
					} }
				/>
				<Field
					id="nh-from-name"
					label={ __( 'From name', 'niftyconnect' ) }
					value={ payload.settings.general.from_name }
					onChange={ ( value ) => {
						updateSettings( ( draft ) => {
							draft.general.from_name = value;
						} );
					} }
				/>
				<Field
					id="nh-from-email"
					label={ __( 'From email', 'niftyconnect' ) }
					type="email"
					value={ payload.settings.general.from_email }
					onChange={ ( value ) => {
						updateSettings( ( draft ) => {
							draft.general.from_email = value;
						} );
					} }
				/>
			</div>
		);
	}

	if ( channelKey === 'telegram' ) {
		return (
			<TelegramSetupFields
				settings={ settings }
				updateSettings={ updateSettings }
			/>
		);
	}

	if ( channelKey === 'whatsapp' ) {
		return (
			<WhatsAppSetupFields
				settings={ settings }
				updateSettings={ updateSettings }
			/>
		);
	}

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
				{ __( 'Setup', 'niftyconnect' ) }
			</h4>
			{ ( channelFields[ channelKey ] || [] ).map( ( field ) => (
				<Field
					key={ field[ 0 ] }
					id={ `nh-${ channelKey }-${ field[ 0 ] }` }
					label={ field[ 1 ] }
					type={ field[ 2 ] }
					value={ settings.config?.[ field[ 0 ] ] || '' }
					onChange={ ( value ) => {
						updateSettings( ( draft ) => {
							if ( ! draft.channels[ channelKey ].config ) {
								draft.channels[ channelKey ].config = {};
							}
							draft.channels[ channelKey ].config![ field[ 0 ] ] =
								value;
						} );
					} }
				/>
			) ) }
		</div>
	);
}

function WhatsAppSetupFields( {
	settings,
	updateSettings,
}: {
	settings: ChannelSettings;
	updateSettings: UpdateSettings;
} ) {
	const configValue = settings.config || {};
	const messageType = configValue.message_type || 'template';
	let messageTypeHelp = __(
		'Free-form text requires an open customer-service conversation window. To test without one, use an approved template such as hello_world with no body variables.',
		'niftyconnect'
	);

	if ( messageType === 'template' ) {
		messageTypeHelp = __(
			'Recommended for automated notifications. The template must already be approved in WhatsApp Manager.',
			'niftyconnect'
		);
	}

	function updateConfig( key: string, value: string ) {
		updateSettings( ( draft ) => {
			if ( ! draft.channels.whatsapp.config ) {
				draft.channels.whatsapp.config = {};
			}

			draft.channels.whatsapp.config[ key ] = value;
		} );
	}

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
				{ __( 'Setup', 'niftyconnect' ) }
			</h4>
			<Field
				id="nh-whatsapp-access-token"
				label={ __( 'Access token', 'niftyconnect' ) }
				type="password"
				value={ configValue.access_token || '' }
				help={ __(
					'Use a system user access token with the whatsapp_business_messaging permission. You may instead define NIFTYCONNECT_WHATSAPP_ACCESS_TOKEN in wp-config.php.',
					'niftyconnect'
				) }
				onChange={ ( value ) => updateConfig( 'access_token', value ) }
			/>
			<Field
				id="nh-whatsapp-phone-number-id"
				label={ __( 'Phone number ID', 'niftyconnect' ) }
				value={ configValue.phone_number_id || '' }
				help={ __(
					'Use the numeric phone number ID shown in your Meta WhatsApp API setup, not the visible business phone number.',
					'niftyconnect'
				) }
				onChange={ ( value ) =>
					updateConfig( 'phone_number_id', value )
				}
			/>
			<Field
				id="nh-whatsapp-recipient-phone"
				label={ __( 'Default recipient phone', 'niftyconnect' ) }
				type="tel"
				value={ configValue.recipient_phone || '' }
				help={ __(
					'Enter an international WhatsApp number with country code. Role-based delivery uses the WhatsApp phone saved on each WordPress user profile and falls back to this number.',
					'niftyconnect'
				) }
				onChange={ ( value ) =>
					updateConfig( 'recipient_phone', value )
				}
			/>
			<Field
				id="nh-whatsapp-api-version"
				label={ __( 'Graph API version', 'niftyconnect' ) }
				value={ configValue.api_version || 'v23.0' }
				help={ __(
					'Use a supported Meta Graph API version such as v23.0.',
					'niftyconnect'
				) }
				onChange={ ( value ) => updateConfig( 'api_version', value ) }
			/>
			<div className="space-y-4 rounded-xl border border-slate-200 p-4">
				<h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
					{ __( 'Message options', 'niftyconnect' ) }
				</h4>
				<Field
					id="nh-whatsapp-message-type"
					label={ __( 'Message type', 'niftyconnect' ) }
					value={ messageType }
					options={ [
						{
							label: __( 'Approved template', 'niftyconnect' ),
							value: 'template',
						},
						{
							label: __( 'Free-form text', 'niftyconnect' ),
							value: 'text',
						},
					] }
					help={ messageTypeHelp }
					onChange={ ( value ) =>
						updateConfig( 'message_type', value )
					}
				/>
				{ messageType === 'template' && (
					<>
						<Field
							id="nh-whatsapp-template-name"
							label={ __( 'Template name', 'niftyconnect' ) }
							value={ configValue.template_name || '' }
							help={ __(
								'Enter the fallback approved template name. An event-specific template configured in the Templates tab overrides it.',
								'niftyconnect'
							) }
							onChange={ ( value ) =>
								updateConfig( 'template_name', value )
							}
						/>
						<Field
							id="nh-whatsapp-template-language"
							label={ __(
								'Template language code',
								'niftyconnect'
							) }
							value={ configValue.template_language || 'en_US' }
							help={ __(
								'Use the language code of the approved template, for example en_US.',
								'niftyconnect'
							) }
							onChange={ ( value ) =>
								updateConfig( 'template_language', value )
							}
						/>
						<Field
							id="nh-whatsapp-template-parameters"
							label={ __(
								'Template body variables',
								'niftyconnect'
							) }
							value={
								configValue.template_parameters ||
								'subject_body'
							}
							options={ [
								{
									label: __(
										'Two variables: subject, body',
										'niftyconnect'
									),
									value: 'subject_body',
								},
								{
									label: __(
										'One variable: full message',
										'niftyconnect'
									),
									value: 'message',
								},
								{
									label: __( 'No variables', 'niftyconnect' ),
									value: 'none',
								},
							] }
							help={ __(
								'This must match the number and order of variables in the approved template body.',
								'niftyconnect'
							) }
							onChange={ ( value ) =>
								updateConfig( 'template_parameters', value )
							}
						/>
					</>
				) }
				{ messageType === 'text' && (
					<Field
						id="nh-whatsapp-preview-url"
						label={ __( 'Link preview', 'niftyconnect' ) }
						value={ configValue.preview_url || '' }
						options={ [
							{
								label: __( 'Disabled', 'niftyconnect' ),
								value: '',
							},
							{
								label: __( 'Enabled', 'niftyconnect' ),
								value: '1',
							},
						] }
						onChange={ ( value ) =>
							updateConfig( 'preview_url', value )
						}
					/>
				) }
				<p className="text-sm leading-6 text-slate-500">
					<a
						className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
						href="https://developers.facebook.com/docs/whatsapp/cloud-api/"
						rel="noreferrer noopener"
						target="_blank"
					>
						{ __(
							'Open Meta Cloud API documentation',
							'niftyconnect'
						) }
					</a>
				</p>
			</div>
		</div>
	);
}

function TelegramSetupFields( {
	settings,
	updateSettings,
}: {
	settings: ChannelSettings;
	updateSettings: UpdateSettings;
} ) {
	const configValue = settings.config || {};

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
				{ __( 'Setup', 'niftyconnect' ) }
			</h4>
			<Field
				id="nh-telegram-bot-token"
				label={ __( 'Bot token', 'niftyconnect' ) }
				type="password"
				value={ configValue.bot_token || '' }
				help={
					<>
						{ __(
							'Create your Telegram bot with @BotFather, then paste the API token BotFather gives you here.',
							'niftyconnect'
						) }{ ' ' }
						<a
							className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
							href="https://youtu.be/6ehNbx6aFtk"
							rel="noreferrer noopener"
							target="_blank"
						>
							{ __( 'Watch setup video', 'niftyconnect' ) }
						</a>
					</>
				}
				onChange={ ( value ) => {
					updateSettings( ( draft ) => {
						if ( ! draft.channels.telegram.config ) {
							draft.channels.telegram.config = {};
						}
						draft.channels.telegram.config.bot_token = value;
					} );
				} }
			/>
			<Field
				id="nh-telegram-chat-id"
				label={ __( 'Chat ID', 'niftyconnect' ) }
				value={ configValue.chat_id || '' }
				help={
					<>
						{ __(
							"This is the default Telegram destination for regular notifications when a recipient does not have a role-based Telegram chat ID. Send a message to your bot from the chat, group, or channel you want to use, then copy that chat's message.chat.id value here.",
							'niftyconnect'
						) }{ ' ' }
						<a
							className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
							href="https://youtu.be/6ehNbx6aFtk"
							rel="noreferrer noopener"
							target="_blank"
						>
							{ __( 'Watch setup video', 'niftyconnect' ) }
						</a>
					</>
				}
				onChange={ ( value ) => {
					updateSettings( ( draft ) => {
						if ( ! draft.channels.telegram.config ) {
							draft.channels.telegram.config = {};
						}
						draft.channels.telegram.config.chat_id = value;
					} );
				} }
			/>
			<div className="space-y-4 rounded-xl border border-slate-200 p-4">
				<div className="flex items-center justify-between gap-3">
					<h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
						{ __( 'Message options', 'niftyconnect' ) }
					</h4>
				</div>
				<Field
					id="nh-telegram-parse-mode"
					label={ __( 'Parse mode', 'niftyconnect' ) }
					value={ configValue.parse_mode || '' }
					options={ [
						{
							label: __( 'Plain text', 'niftyconnect' ),
							value: '',
						},
						{ label: 'Markdown', value: 'Markdown' },
						{ label: 'MarkdownV2', value: 'MarkdownV2' },
						{ label: 'HTML', value: 'HTML' },
					] }
					onChange={ ( value ) => {
						updateSettings( ( draft ) => {
							if ( ! draft.channels.telegram.config ) {
								draft.channels.telegram.config = {};
							}
							draft.channels.telegram.config.parse_mode = value;
						} );
					} }
				/>
				<Field
					id="nh-telegram-disable-preview"
					label={ __( 'Disable link preview', 'niftyconnect' ) }
					value={ configValue.disable_web_page_preview || '' }
					options={ [
						{
							label: __( 'No', 'niftyconnect' ),
							value: '',
						},
						{
							label: __( 'Yes', 'niftyconnect' ),
							value: '1',
						},
					] }
					onChange={ ( value ) => {
						updateSettings( ( draft ) => {
							if ( ! draft.channels.telegram.config ) {
								draft.channels.telegram.config = {};
							}
							draft.channels.telegram.config.disable_web_page_preview =
								value;
						} );
					} }
				/>
			</div>
		</div>
	);
}

function ChannelTest( {
	channelKey,
	payload,
	setPayload,
	setNotice,
}: {
	channelKey: string;
	payload: Payload;
	setPayload: Dispatch< SetStateAction< Payload | null > >;
	setNotice: Dispatch< SetStateAction< Notice | null > >;
} ) {
	const [ recipient, setRecipient ] = useState(
		payload.settings.general.recipients[ 0 ] || ''
	);
	const [ telegramTestChatId, setTelegramTestChatId ] = useState( '' );
	const [ whatsappTestPhone, setWhatsAppTestPhone ] = useState( '' );
	const [ sending, setSending ] = useState( false );
	const isEmail = channelKey === 'email';
	const isTelegram = channelKey === 'telegram';
	const isWhatsApp = channelKey === 'whatsapp';

	function sendTest() {
		setSending( true );
		setNotice( null );

		sendTestNotification(
			isEmail ? recipient : '',
			channelKey,
			isTelegram ? telegramTestChatId : '',
			isWhatsApp ? whatsappTestPhone : ''
		)
			.then( ( response ) => {
				setPayload( ( current ) => {
					if ( ! current ) {
						return current;
					}

					const next = clone( current );
					next.stats.limit = response.result.limit;
					return next;
				} );
				setNotice( { type: 'success', message: response.message } );
			} )
			.catch( ( error: Error ) => {
				setNotice( {
					type: 'error',
					message:
						error.message ||
						__(
							'Could not send test notification.',
							'niftyconnect'
						),
				} );
			} )
			.finally( () => setSending( false ) );
	}

	return (
		<div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
			<h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
				{ __( 'Test', 'niftyconnect' ) }
			</h4>
			{ isEmail && (
				<Field
					id="nh-test-recipient"
					label={ __( 'Test recipient', 'niftyconnect' ) }
					type="email"
					value={ recipient }
					onChange={ setRecipient }
				/>
			) }
			{ isTelegram && (
				<Field
					id="nh-telegram-test-chat-id"
					label={ __( 'Test chat ID', 'niftyconnect' ) }
					value={ telegramTestChatId }
					help={ __(
						'Used only for this test message. It does not change the saved Telegram chat ID in Setup.',
						'niftyconnect'
					) }
					onChange={ setTelegramTestChatId }
				/>
			) }
			{ isWhatsApp && (
				<Field
					id="nh-whatsapp-test-phone"
					label={ __( 'Test recipient phone', 'niftyconnect' ) }
					type="tel"
					value={ whatsappTestPhone }
					help={ __(
						'Optional. This test-only number overrides the saved default recipient.',
						'niftyconnect'
					) }
					onChange={ setWhatsAppTestPhone }
				/>
			) }
			<Button disabled={ sending } onClick={ sendTest }>
				{ sending
					? __( 'Sending…', 'niftyconnect' )
					: __( 'Send Test', 'niftyconnect' ) }
			</Button>
		</div>
	);
}
