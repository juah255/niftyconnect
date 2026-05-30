import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	Bell,
	CalendarDays,
	CheckCircle2,
	Clock3,
	ChevronLeft,
	ChevronRight,
	RadioTower,
	Route,
	XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { objectValues } from '../utils';
import type { ActivityItem, Payload } from '../types';
import SectionTitle from '../components/SectionTitle';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../components/ui/Card';
import { Select } from '../components/ui/Select';

interface OverviewTabProps {
	payload: Payload;
}

type TimeRange = 'today' | 'last_week' | 'last_month';

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_PAGE_SIZE = 5;

export default function OverviewTab( { payload }: OverviewTabProps ) {
	const [ timeRange, setTimeRange ] = useState< TimeRange >( 'today' );
	const [ channelFilter, setChannelFilter ] = useState( 'all' );
	const [ activityPage, setActivityPage ] = useState( 1 );
	const channels = objectValues( payload.features.channels );
	const events = objectValues( payload.features.events );
	const activity = payload.stats.activity || {
		total_sent: 0,
		recent: [],
	};
	const enabledChannels = channels.filter(
		( channel ) => payload.settings.channels[ channel.key ]?.enabled
	);
	const enabledTriggers = events.filter(
		( eventDef ) => payload.settings.triggers[ eventDef.key ]
	);
	const routes = channels.reduce( ( total, channel ) => {
		const channelRoutes =
			payload.settings.channels[ channel.key ]?.events || {};

		return (
			total +
			Object.keys( channelRoutes ).filter(
				( key ) => channelRoutes[ key ]
			).length
		);
	}, 0 );
	const channelOptions = [
		{ label: __( 'All channels', 'niftyconnect' ), value: 'all' },
		...channels.map( ( channel ) => ( {
			label: channel.label,
			value: channel.key,
		} ) ),
	];
	const filteredActivity = activity.recent.filter(
		( item ) =>
			isInRange( item, timeRange ) &&
			( 'all' === channelFilter || item.channel === channelFilter )
	);
	const totalActivityPages = Math.max(
		1,
		Math.ceil( filteredActivity.length / ACTIVITY_PAGE_SIZE )
	);
	const currentActivityPage = Math.min( activityPage, totalActivityPages );
	const paginatedActivity = filteredActivity.slice(
		( currentActivityPage - 1 ) * ACTIVITY_PAGE_SIZE,
		currentActivityPage * ACTIVITY_PAGE_SIZE
	);

	useEffect( () => {
		setActivityPage( 1 );
	}, [ timeRange, channelFilter ] );

	return (
		<>
			<SectionTitle
				title={ __( 'Overview', 'niftyconnect' ) }
				description={ __(
					'Current notification activity and configuration status.',
					'niftyconnect'
				) }
			/>
			<div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard
					icon={ <CheckCircle2 size={ 20 } /> }
					label={ __( 'Total sent', 'niftyconnect' ) }
					value={ formatNumber( activity.total_sent ) }
				/>
				<StatCard
					icon={ <RadioTower size={ 20 } /> }
					label={ __( 'Enabled channels', 'niftyconnect' ) }
					value={ `${ enabledChannels.length } / ${ channels.length }` }
				/>
				<StatCard
					icon={ <Bell size={ 20 } /> }
					label={ __( 'Enabled triggers', 'niftyconnect' ) }
					value={ `${ enabledTriggers.length } / ${ events.length }` }
				/>
				<StatCard
					icon={ <Route size={ 20 } /> }
					label={ __( 'Channel routes', 'niftyconnect' ) }
					value={ formatNumber( routes ) }
				/>
			</div>
			<Card className="nh-activity-card">
				<CardHeader className="nh-activity-header">
					<div>
						<CardTitle>
							{ __( 'Recent activity', 'niftyconnect' ) }
						</CardTitle>
						<CardDescription>
							{ __(
								'Review recent notification deliveries by time range and channel.',
								'niftyconnect'
							) }
						</CardDescription>
					</div>
					<div
						className="nh-activity-filter-shell"
						aria-label={ __( 'Activity filters', 'niftyconnect' ) }
					>
						<div className="nh-activity-filters">
							<Select
								id="nh-activity-time-range"
								label={ __( 'Time range', 'niftyconnect' ) }
								value={ timeRange }
								icon={ <CalendarDays size={ 16 } /> }
								options={ [
									{
										label: __( 'Today', 'niftyconnect' ),
										value: 'today',
									},
									{
										label: __(
											'Last week',
											'niftyconnect'
										),
										value: 'last_week',
									},
									{
										label: __(
											'Last month',
											'niftyconnect'
										),
										value: 'last_month',
									},
								] }
								onChange={ ( value ) => {
									setTimeRange( value as TimeRange );
								} }
							/>
							<Select
								id="nh-activity-channel"
								label={ __(
									'Notification channel',
									'niftyconnect'
								) }
								value={ channelFilter }
								icon={ <RadioTower size={ 16 } /> }
								options={ channelOptions }
								onChange={ setChannelFilter }
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{ filteredActivity.length ? (
						<>
							<div className="nh-activity-list">
								{ paginatedActivity.map( ( item ) => (
									<ActivityRow
										key={ item.id }
										item={ item }
										payload={ payload }
									/>
								) ) }
							</div>
							<ActivityPagination
								currentPage={ currentActivityPage }
								totalPages={ totalActivityPages }
								totalItems={ filteredActivity.length }
								onPageChange={ setActivityPage }
							/>
						</>
					) : (
						<div className="nh-activity-empty">
							<Clock3 size={ 22 } />
							<strong>
								{ __( 'No activity found', 'niftyconnect' ) }
							</strong>
							<span>
								{ __(
									'Try a wider time range or choose all channels.',
									'niftyconnect'
								) }
							</span>
						</div>
					) }
				</CardContent>
			</Card>
		</>
	);
}

function ActivityPagination( {
	currentPage,
	totalPages,
	totalItems,
	onPageChange,
}: {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	onPageChange: ( page: number ) => void;
} ) {
	if ( totalPages <= 1 ) {
		return null;
	}

	return (
		<nav
			className="nh-activity-pagination"
			aria-label={ __( 'Activity pagination', 'niftyconnect' ) }
		>
			<span>
				{ sprintf(
					/* translators: 1: current page, 2: total pages, 3: total activity count. */
					__( 'Page %1$d of %2$d (%3$d activities)', 'niftyconnect' ),
					currentPage,
					totalPages,
					totalItems
				) }
			</span>
			<div>
				<button
					type="button"
					disabled={ currentPage <= 1 }
					onClick={ () => onPageChange( currentPage - 1 ) }
				>
					<ChevronLeft size={ 16 } />
					{ __( 'Previous', 'niftyconnect' ) }
				</button>
				<button
					type="button"
					disabled={ currentPage >= totalPages }
					onClick={ () => onPageChange( currentPage + 1 ) }
				>
					{ __( 'Next', 'niftyconnect' ) }
					<ChevronRight size={ 16 } />
				</button>
			</div>
		</nav>
	);
}

function StatCard( {
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: string;
} ) {
	return (
		<Card>
			<CardContent className="flex min-h-[126px] flex-col gap-3 px-6 pb-6 pt-4">
				<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
					{ icon }
				</span>
				<span className="block text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
					{ label }
				</span>
				<strong className="mt-auto block text-4xl font-black leading-none tracking-[-0.04em] text-slate-900">
					{ value }
				</strong>
			</CardContent>
		</Card>
	);
}

function ActivityRow( {
	item,
	payload,
}: {
	item: ActivityItem;
	payload: Payload;
} ) {
	const StatusIcon = item.status === 'success' ? CheckCircle2 : XCircle;
	const statusLabel =
		item.status === 'success'
			? __( 'Sent', 'niftyconnect' )
			: __( 'Failed', 'niftyconnect' );

	return (
		<article className="nh-activity-row">
			<span
				className={ `nh-activity-status is-${ item.status }` }
				aria-label={ statusLabel }
			>
				<StatusIcon size={ 18 } />
			</span>
			<div className="nh-activity-main">
				<strong>
					{ item.subject || eventLabel( payload, item.eventKey ) }
				</strong>
				<span>
					{ eventLabel( payload, item.eventKey ) }
					{ ' - ' }
					{ channelLabel( payload, item.channel ) }
				</span>
				{ item.message && <p>{ item.message }</p> }
			</div>
			<div className="nh-activity-meta">
				<time dateTime={ item.createdAt }>
					{ formatActivityTime( item.timestamp ) }
				</time>
				<span>
					{ sprintf(
						/* translators: %d: recipient count. */
						_n(
							'%d recipient',
							'%d recipients',
							item.recipientCount,
							'niftyconnect'
						),
						item.recipientCount
					) }
				</span>
			</div>
		</article>
	);
}

function isInRange( item: ActivityItem, range: TimeRange ) {
	if ( ! item.timestamp ) {
		return false;
	}

	const now = Date.now();

	if ( 'today' === range ) {
		return (
			new Date( item.timestamp ).toDateString() ===
			new Date( now ).toDateString()
		);
	}

	return item.timestamp >= now - ( 'last_week' === range ? 7 : 30 ) * DAY_MS;
}

function eventLabel( payload: Payload, eventKey: string ) {
	if ( 'test' === eventKey ) {
		return __( 'Test notification', 'niftyconnect' );
	}

	return payload.features.events[ eventKey ]?.label || eventKey;
}

function channelLabel( payload: Payload, channel: string ) {
	return payload.features.channels[ channel ]?.label || channel;
}

function formatNumber( value: number ) {
	return new Intl.NumberFormat().format( value );
}

function formatActivityTime( timestamp: number ) {
	if ( ! timestamp ) {
		return __( 'Unknown time', 'niftyconnect' );
	}

	return new Intl.DateTimeFormat( undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	} ).format( new Date( timestamp ) );
}
