import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { useEffect, useState } from '@wordpress/element';
import type { LucideIcon } from 'lucide-react';
import {
	BellRing,
	ChartColumn,
	ChevronDown,
	Crown,
	FileText,
	Globe2,
	Mail,
	MessageCircle,
	MessageSquare,
	Send,
	Settings2,
} from 'lucide-react';

import { clone } from './utils';
import { getSettings, saveSettings } from './api';
import type { Payload } from './types';
import Header from './components/Header';
import Button from './components/ui/Button';
import OverviewTab from './tabs/OverviewTab';
import ChannelsTab from './tabs/ChannelsTab';
import SettingsTab from './tabs/SettingsTab';
import TemplatesTab from './tabs/TemplatesTab';

const tabs = [
	{
		key: 'overview',
		label: __( 'Overview', 'niftyconnect' ),
		icon: ChartColumn,
	},
	{
		key: 'channels',
		label: __( 'Triggers', 'niftyconnect' ),
		icon: BellRing,
	},
	{
		key: 'templates',
		label: __( 'Templates', 'niftyconnect' ),
		icon: FileText,
	},
	{
		key: 'settings',
		label: __( 'Settings', 'niftyconnect' ),
		icon: Settings2,
	},
];

interface Notice {
	type: 'success' | 'error';
	message: string;
}

interface SupportLink {
	label: string;
	href: string;
	icon: LucideIcon;
	className: string;
}

const DEFAULT_UPGRADE_URL = 'https://wordpress.org/plugins/niftyconnect/';
const DEFAULT_SUPPORT_URL =
	'https://wordpress.org/support/plugin/niftyconnect/';

export default function App() {
	const hashTab = window.location.hash
		? window.location.hash.replace( '#', '' )
		: '';
	const initialTab =
		hashTab === 'general' ? 'overview' : hashTab || 'overview';
	const [ payload, setPayload ] = useState< Payload | null >( null );
	const [ activeTab, setActiveTab ] = useState( initialTab );
	const [ saving, setSaving ] = useState( false );
	const [ dirty, setDirty ] = useState( false );
	const [ notice, setNotice ] = useState< Notice | null >( null );

	useEffect( () => {
		getSettings()
			.then( setPayload )
			.catch( ( error: Error ) => {
				setNotice( {
					type: 'error',
					message:
						error.message ||
						__( 'Could not load settings.', 'niftyconnect' ),
				} );
			} );
	}, [] );

	useEffect( () => {
		if ( ! payload ) {
			return;
		}

		const visible = tabs.some( ( tab ) => tab.key === activeTab );

		if ( ! visible ) {
			setActiveTab( 'overview' );
			window.location.hash = 'overview';
		}
	}, [ payload, activeTab ] );

	function updateSettings(
		updater: ( draft: Payload[ 'settings' ] ) => void
	) {
		setPayload( ( current ) => {
			if ( ! current ) {
				return current;
			}

			const next = clone( current );
			updater( next.settings );
			return next;
		} );
		setDirty( true );
	}

	function save() {
		if ( ! payload ) {
			return;
		}

		setSaving( true );
		setNotice( null );

		saveSettings( payload.settings )
			.then( ( response ) => {
				setPayload( response );
				setDirty( false );
				setNotice( {
					type: 'success',
					message: __( 'Settings saved.', 'niftyconnect' ),
				} );
			} )
			.catch( ( error: Error ) => {
				setNotice( {
					type: 'error',
					message:
						error.message ||
						__( 'Could not save settings.', 'niftyconnect' ),
				} );
			} )
			.finally( () => setSaving( false ) );
	}

	function switchTab( tab: string ) {
		setActiveTab( tab );
		window.location.hash = tab;
	}

	if ( ! payload ) {
		return (
			<div className="nh-app bg-slate-50">
				<div className="nh-shell mx-auto max-w-[1240px]">
					<div className="nh-panel rounded-lg border border-slate-200 bg-white shadow-sm">
						{ __( 'Loading niftyConnect…', 'niftyconnect' ) }
					</div>
				</div>
			</div>
		);
	}

	const visibleTabs = tabs;

	return (
		<div className="nh-app bg-slate-50">
			<div className="nh-shell mx-auto max-w-[1240px]">
				<Header />

				{ notice && (
					<div
						className={
							'nh-notice ' +
							( notice.type === 'error' ? 'nh-notice-error' : '' )
						}
					>
						{ notice.message }
					</div>
				) }

				{ shouldShowUpgrade() && <UpgradeBanner /> }

				<div className="nh-dashboard grid min-h-[calc(100vh-10rem)] grid-cols-1 gap-6 items-stretch lg:grid-cols-[270px_minmax(0,1fr)]">
					<nav
						className="nh-tabs flex h-full min-h-[calc(100vh-10rem)] flex-col gap-2 self-stretch border-r border-slate-200 bg-white px-4 py-6 shadow-none rounded-none"
						aria-label={ __(
							'niftyConnect settings sections',
							'niftyconnect'
						) }
					>
						{ visibleTabs.map( ( tab ) => (
							<TabButton
								key={ tab.key }
								active={ activeTab === tab.key }
								icon={ tab.icon }
								label={ tab.label }
								onClick={ () => switchTab( tab.key ) }
							/>
						) ) }
					</nav>

					<div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_256px]">
						<main className="nh-main-panel min-w-0">
							{ activeTab === 'overview' && (
								<OverviewTab payload={ payload } />
							) }
							{ activeTab === 'channels' && (
								<ChannelsTab
									payload={ payload }
									updateSettings={ updateSettings }
								/>
							) }
							{ activeTab === 'templates' && (
								<TemplatesTab
									payload={ payload }
									updateSettings={ updateSettings }
								/>
							) }
							{ activeTab === 'settings' && (
								<SettingsTab
									payload={ payload }
									updateSettings={ updateSettings }
									setPayload={ setPayload }
									setNotice={ setNotice }
								/>
							) }
							{ activeTab !== 'overview' && (
								<div className="nh-actions">
									<Button
										disabled={ saving || ! dirty }
										onClick={ save }
									>
										{ saving
											? __( 'Saving…', 'niftyconnect' )
											: __(
													'Save Settings',
													'niftyconnect'
											  ) }
									</Button>
								</div>
							) }
						</main>

						<SupportPanel />
					</div>
				</div>
			</div>
		</div>
	);
}

function UpgradeBanner() {
	const upgradeUrl = getUpgradeUrl();

	return (
		<section className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
			<p className="m-0 text-sm font-medium text-slate-900">
				{ __(
					'Want unlimited channels, WooCommerce smart rules & priority support?',
					'niftyconnect'
				) }
			</p>
			<a
				className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2 text-sm font-extrabold !text-white no-underline shadow-sm shadow-blue-500/25 ring-1 ring-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:!text-white hover:shadow-md hover:shadow-blue-500/30 focus:!text-white"
				href={ upgradeUrl }
				rel="noreferrer"
				target="_blank"
			>
				<Crown size={ 15 } />
				<span className="text-white">
					{ __( 'Upgrade to Pro', 'niftyconnect' ) }
				</span>
			</a>
		</section>
	);
}

function SupportPanel() {
	const [ open, setOpen ] = useState( true );
	const upgradeUrl = getUpgradeUrl();
	const showUpgrade = shouldShowUpgrade();
	const defaultSupportLinks: SupportLink[] = [
		{
			label: __( 'Email', 'niftyconnect' ),
			href: DEFAULT_SUPPORT_URL,
			icon: Mail,
			className:
				'bg-slate-900 shadow-slate-900/20 ring-slate-700/20 hover:bg-slate-800 hover:shadow-slate-900/30 focus:bg-slate-800',
		},
		{
			label: __( 'Join Telegram', 'niftyconnect' ),
			href: DEFAULT_SUPPORT_URL,
			icon: Send,
			className:
				'bg-sky-500 shadow-sky-500/25 ring-sky-400/30 hover:bg-sky-600 hover:shadow-sky-500/35 focus:bg-sky-600',
		},
		{
			label: __( 'Join Discord', 'niftyconnect' ),
			href: DEFAULT_SUPPORT_URL,
			icon: MessageSquare,
			className:
				'bg-indigo-500 shadow-indigo-500/25 ring-indigo-400/30 hover:bg-indigo-600 hover:shadow-indigo-500/35 focus:bg-indigo-600',
		},
		{
			label: __( 'WhatsApp Group', 'niftyconnect' ),
			href: DEFAULT_SUPPORT_URL,
			icon: MessageCircle,
			className:
				'bg-emerald-500 shadow-emerald-500/25 ring-emerald-400/30 hover:bg-emerald-600 hover:shadow-emerald-500/35 focus:bg-emerald-600',
		},
		{
			label: __( 'Facebook Group', 'niftyconnect' ),
			href: DEFAULT_SUPPORT_URL,
			icon: Globe2,
			className:
				'bg-blue-500 shadow-blue-500/25 ring-blue-400/30 hover:bg-blue-600 hover:shadow-blue-500/35 focus:bg-blue-600',
		},
	];
	const supportLinks = applyFilters< SupportLink[] >(
		'niftyconnect.admin.supportLinks',
		defaultSupportLinks,
		{
			defaultSupportUrl: DEFAULT_SUPPORT_URL,
		}
	);

	const contentId = 'niftyconnect-support-content';

	return (
		<aside className="min-w-0 xl:sticky xl:top-8">
			<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<button
					aria-controls={ contentId }
					aria-expanded={ open }
					className="flex min-h-12 w-full items-center justify-between gap-3 border-0 bg-white px-5 py-3 text-left text-sm font-extrabold text-slate-950 transition-colors hover:bg-slate-50"
					type="button"
					onClick={ () => setOpen( ! open ) }
				>
					<span>{ __( 'Support', 'niftyconnect' ) }</span>
					<ChevronDown
						className={
							'h-4 w-4 shrink-0 text-slate-500 transition-transform' +
							( open ? ' rotate-180' : '' )
						}
					/>
				</button>
				{ open && (
					<div
						className="border-t border-slate-100 px-4 py-4"
						id={ contentId }
					>
						<div className="grid gap-2">
							{ supportLinks.map( ( link ) => (
								<SupportActionLink
									key={ link.label }
									className={ link.className }
									href={ link.href }
									icon={ link.icon }
									label={ link.label }
								/>
							) ) }
						</div>

						{ showUpgrade && (
							<div className="-mx-4 mt-4 flex items-center justify-between gap-3 border-t border-slate-100 px-4 pt-4">
								<span className="text-xs font-medium leading-5 text-slate-500">
									{ __(
										'Need more features?',
										'niftyconnect'
									) }
								</span>
								<a
									className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-extrabold !text-white no-underline shadow-sm shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:!text-white hover:shadow-md focus:!text-white"
									href={ upgradeUrl }
									rel="noreferrer"
									target="_blank"
								>
									<Crown size={ 13 } />
									<span className="text-white">
										{ __(
											'Upgrade to Pro',
											'niftyconnect'
										) }
									</span>
								</a>
							</div>
						) }
					</div>
				) }
			</section>
		</aside>
	);
}

function getUpgradeUrl() {
	return applyFilters< string >(
		'niftyconnect.admin.upgradeUrl',
		DEFAULT_UPGRADE_URL
	);
}

function shouldShowUpgrade() {
	return applyFilters< boolean >( 'niftyconnect.admin.showUpgrade', true );
}

function SupportActionLink( {
	className,
	href,
	icon: Icon,
	label,
}: {
	className: string;
	href: string;
	icon: LucideIcon;
	label: string;
} ) {
	return (
		<a
			className={ `group inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-2xl px-4 py-2 text-xs font-extrabold !text-white no-underline shadow-sm ring-1 ring-inset transition-all hover:-translate-y-0.5 hover:!text-white hover:shadow-md focus:!text-white ${ className }` }
			href={ href }
			rel="noreferrer"
			target="_blank"
		>
			<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25 transition-colors group-hover:bg-white/25">
				<Icon size={ 14 } />
			</span>
			<span className="min-w-0 truncate text-white">{ label }</span>
		</a>
	);
}

function TabButton( {
	active,
	icon: Icon,
	label,
	onClick,
}: {
	active: boolean;
	icon: typeof ChartColumn;
	label: string;
	onClick: () => void;
} ) {
	return (
		<button
			type="button"
			className={
				'nh-tab flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors ' +
				( active
					? 'is-active bg-slate-900 text-white shadow-none'
					: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900' )
			}
			onClick={ onClick }
		>
			<span
				className={
					'nh-tab-icon inline-flex h-9 w-9 items-center justify-center rounded-md ' +
					( active
						? 'bg-white/10 text-white'
						: 'bg-slate-100 text-slate-500' )
				}
			>
				<Icon size={ 18 } />
			</span>
			<span className="nh-tab-label truncate">{ label }</span>
		</button>
	);
}
