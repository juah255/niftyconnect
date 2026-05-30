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
	const [ sending, setSending ] = useState( false );
	const isEmail = channelKey === 'email';
	const isTelegram = channelKey === 'telegram';

	function sendTest() {
		setSending( true );
		setNotice( null );

		sendTestNotification(
			isEmail ? recipient : '',
			channelKey,
			isTelegram ? telegramTestChatId : ''
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
			<Button disabled={ sending } onClick={ sendTest }>
				{ sending
					? __( 'Sending…', 'niftyconnect' )
					: __( 'Send Test', 'niftyconnect' ) }
			</Button>
		</div>
	);
}
