import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	BellRing,
	ChartColumn,
	FileText,
	Settings2,
	SlidersHorizontal,
} from 'lucide-react';

import { clone } from './utils';
import { getSettings, saveSettings } from './api';
import type { Payload } from './types';
import Header from './components/Header';
import Button from './components/ui/Button';
import OverviewTab from './tabs/OverviewTab';
import ChannelsTab from './tabs/ChannelsTab';
import RulesTab from './tabs/RulesTab';
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
		key: 'rules',
		label: __( 'Rules', 'niftyconnect' ),
		icon: SlidersHorizontal,
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

		const visible = tabs.some(
			( tab ) =>
				tab.key === activeTab &&
				( tab.key !== 'rules' ||
					Array.isArray( payload.settings.rules ) )
		);

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

	const visibleTabs = tabs.filter(
		( tab ) =>
			tab.key !== 'rules' || Array.isArray( payload.settings.rules )
	);

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

				<div className="nh-dashboard grid min-h-[calc(100vh-10rem)] grid-cols-[270px_minmax(0,1fr)] gap-6 items-stretch">
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

					<main className="nh-main-panel">
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
						{ activeTab === 'rules' &&
							Array.isArray( payload.settings.rules ) && (
								<RulesTab
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
				</div>
			</div>
		</div>
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
