import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { useEffect, useState } from '@wordpress/element';
import type { ReactNode } from 'react';

import {
	eventCategoryGroups,
	orderedChannels,
	parseRecipients,
} from '../utils';
import type {
	ChannelSettings,
	FeatureDefinition,
	Payload,
	TriggerRecipientSettings,
	UpdateSettings,
} from '../types';
import {
	getChannelIcon,
	getEventIcon,
	getGroupMeta,
	IconBubble,
} from '../components/FeatureVisuals';
import Field from '../components/Field';
import SectionTitle from '../components/SectionTitle';
import Badge from '../components/ui/Badge';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../components/ui/Accordion';
import Switch from '../components/ui/Switch';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../components/ui/Card';

interface ChannelsTabProps {
	payload: Payload;
	updateSettings: UpdateSettings;
}

export default function ChannelsTab( {
	payload,
	updateSettings,
}: ChannelsTabProps ) {
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
		events: {},
	};
	const ActiveChannelIcon = getChannelIcon( activeChannel?.key || 'email' );

	return (
		<>
			<SectionTitle
				title={ __( 'Triggers', 'niftyconnect' ) }
				description={ __(
					'Choose which notifications are routed to each channel.',
					'niftyconnect'
				) }
			/>
			<div className="space-y-3">
				<div
					className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
					role="tablist"
					aria-label={ __( 'Notification channels', 'niftyconnect' ) }
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
					<CardHeader className="items-center border-b border-slate-100 px-5 py-4">
						<div className="flex min-w-0 items-center gap-3.5">
							<IconBubble
								className="h-10 w-10 shrink-0 bg-slate-100 text-slate-700"
								icon={ ActiveChannelIcon }
								iconClassName="h-5 w-5"
							/>
							<div className="min-w-0">
								<CardTitle>{ activeChannel?.label }</CardTitle>
								<CardDescription>
									{ activeChannel?.description }
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4 pt-3">
						<ChannelEventRoutes
							channelKey={ activeChannelKey }
							payload={ payload }
							settings={ activeSettings }
							updateSettings={ updateSettings }
						/>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

function ChannelEventRoutes( {
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
	const eventGroups = eventCategoryGroups( payload.features );
	const visibleGroups = eventGroups.filter( ( group ) => group.items.length );
	const [ openGroups, setOpenGroups ] = useState< Record< string, boolean > >(
		{}
	);

	useEffect( () => {
		if ( ! visibleGroups.length ) {
			if ( Object.keys( openGroups ).length ) {
				setOpenGroups( {} );
			}
			return;
		}

		setOpenGroups( ( current ) => {
			const next: Record< string, boolean > = {};

			visibleGroups.forEach( ( group ) => {
				if ( current[ group.key ] ) {
					next[ group.key ] = true;
				}
			} );

			return Object.keys( next ).length === Object.keys( current ).length
				? current
				: next;
		} );
	}, [ openGroups, visibleGroups ] );

	function toggleGroup( value: string ) {
		setOpenGroups( ( current ) => ( {
			...current,
			[ value ]: ! current[ value ],
		} ) );
	}

	const routeValue = settings.events || {};

	function updateEventRoute( eventKey: string, value: boolean ) {
		updateSettings( ( draft ) => {
			if ( ! draft.channels[ channelKey ].events ) {
				draft.channels[ channelKey ].events = {};
			}

			draft.channels[ channelKey ].events![ eventKey ] = value;
			draft.triggers[ eventKey ] =
				value ||
				Object.keys( draft.channels ).some( ( key ) => {
					if ( key === channelKey ) {
						return false;
					}

					return !! draft.channels[ key ].events?.[ eventKey ];
				} );
		} );
	}

	return (
		<div className="space-y-3">
			<Accordion>
				{ visibleGroups.map( ( group ) => {
					const groupMeta = getGroupMeta( group.key );
					const activeCount = group.items.filter(
						( item ) => !! routeValue[ item.key ]
					).length;
					const open = !! openGroups[ group.key ];

					return (
						<AccordionItem
							key={ group.key }
							open={ open }
							value={ group.key }
						>
							<AccordionTrigger
								className="px-4 py-2.5"
								onToggle={ () => toggleGroup( group.key ) }
								open={ open }
							>
								<GroupHeader
									activeCount={ activeCount }
									description={ groupMeta.description }
									icon={ groupMeta.icon }
									label={ group.label }
									totalCount={ group.items.length }
								/>
							</AccordionTrigger>
							<AccordionContent
								className="px-0 pb-0"
								open={ open }
							>
								<div className="border-t border-slate-200">
									{ group.items.map( ( eventDef ) => {
										const EventIcon = getEventIcon(
											eventDef.key,
											eventDef.category
										);

										return (
											<div
												key={ eventDef.key }
												className="border-t border-slate-200 first:border-t-0"
											>
												<div className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3.5">
													<IconBubble
														className="h-8 w-8 shrink-0 bg-slate-100 text-slate-500"
														icon={ EventIcon }
														iconClassName="h-4 w-4"
													/>
													<div className="min-w-0 flex-1">
														<h5 className="min-w-0 truncate text-base font-semibold leading-6 text-slate-900">
															{ eventDef.label }
														</h5>
														<p className="text-sm leading-6 text-slate-500">
															{
																eventDef.description
															}
														</p>
													</div>
													<div className="flex shrink-0 items-center gap-2">
														<Switch
															checked={
																!! routeValue[
																	eventDef.key
																]
															}
															id={ `nh-channel-${ channelKey }-event-${ eventDef.key }` }
															onCheckedChange={ (
																value
															) =>
																updateEventRoute(
																	eventDef.key,
																	value
																)
															}
														/>
													</div>
													<div className="col-start-2 col-end-4">
														<TriggerRecipients
															eventDef={
																eventDef
															}
															payload={ payload }
															updateSettings={
																updateSettings
															}
														/>
														<TriggerExtensionPanels
															eventDef={
																eventDef
															}
															payload={ payload }
															updateSettings={
																updateSettings
															}
														/>
													</div>
												</div>
											</div>
										);
									} ) }
								</div>
							</AccordionContent>
						</AccordionItem>
					);
				} ) }
			</Accordion>
		</div>
	);
}

function GroupHeader( {
	activeCount,
	description,
	icon: Icon,
	label,
	totalCount,
}: {
	activeCount?: number;
	description: string;
	icon: ReturnType< typeof getGroupMeta >[ 'icon' ];
	label: string;
	totalCount: number;
} ) {
	let badgeLabel = `${ totalCount } ${ __( 'templates', 'niftyconnect' ) }`;

	if ( totalCount === 1 ) {
		badgeLabel = `${ totalCount } ${ __( 'template', 'niftyconnect' ) }`;
	}

	if ( typeof activeCount === 'number' ) {
		badgeLabel = `${ activeCount }/${ totalCount } ${ __(
			'active',
			'niftyconnect'
		) }`;
	}

	return (
		<div className="flex min-w-0 flex-1 items-center justify-between gap-3">
			<div className="flex min-w-0 items-center gap-3">
				<IconBubble
					className="h-8 w-8 bg-indigo-50 text-indigo-600"
					icon={ Icon }
					iconClassName="h-4 w-4"
				/>
				<div className="min-w-0">
					<h4 className="text-[15px] font-semibold text-slate-900">
						{ label }
					</h4>
					<p className="mt-0.5 text-sm leading-5 text-slate-500">
						{ description }
					</p>
				</div>
			</div>
			<Badge className="border-slate-200 bg-slate-100 font-semibold normal-case tracking-normal text-slate-600">
				{ badgeLabel }
			</Badge>
		</div>
	);
}

function TriggerExtensionPanels( {
	eventDef,
	payload,
	updateSettings,
}: {
	eventDef: FeatureDefinition;
	payload: Payload;
	updateSettings: UpdateSettings;
} ) {
	const panels = applyFilters< ReactNode[] >(
		'niftyconnect.admin.triggerPanels',
		[],
		{
			eventDef,
			payload,
			updateSettings,
		}
	);

	if ( ! panels.length ) {
		return null;
	}

	return <>{ panels }</>;
}

function TriggerRecipients( {
	eventDef,
	payload,
	updateSettings,
}: {
	eventDef: FeatureDefinition;
	payload: Payload;
	updateSettings: UpdateSettings;
} ) {
	const roles = payload.meta.roles || [];
	const fallbackRole = roles[ 0 ]?.key || 'administrator';
	const recipients: TriggerRecipientSettings = payload.settings
		.trigger_recipients[ eventDef.key ] || {
		roles: [ fallbackRole ],
		custom: [],
	};
	const selectedRoles = recipients.roles.length ? recipients.roles : [];
	const [ customEnabled, setCustomEnabled ] = useState(
		recipients.custom.length > 0
	);

	useEffect( () => {
		if ( recipients.custom.length > 0 ) {
			setCustomEnabled( true );
		}
	}, [ recipients.custom.length ] );

	return (
		<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
			<h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
				{ __( 'Recipients', 'niftyconnect' ) }
			</h5>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{ roles.map( ( role ) => {
					const inputId = `nh-trigger-${ eventDef.key }-role-${ role.key }`;

					return (
						<label
							key={ role.key }
							className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
							htmlFor={ inputId }
						>
							<input
								id={ inputId }
								type="checkbox"
								checked={ selectedRoles.includes( role.key ) }
								onChange={ ( event ) => {
									updateSettings( ( draft ) => {
										const current =
											draft.trigger_recipients[
												eventDef.key
											]?.roles || [];
										const next = event.target.checked
											? [ ...current, role.key ]
											: current.filter(
													( key ) => key !== role.key
											  );

										draft.trigger_recipients[
											eventDef.key
										] = {
											roles: Array.from(
												new Set( next )
											),
											custom:
												draft.trigger_recipients[
													eventDef.key
												]?.custom || [],
										};
									} );
								} }
							/>
							<span>{ role.label }</span>
						</label>
					);
				} ) }
				<label
					className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
					htmlFor={ `nh-trigger-${ eventDef.key }-custom-enabled` }
				>
					<input
						id={ `nh-trigger-${ eventDef.key }-custom-enabled` }
						type="checkbox"
						checked={ customEnabled }
						onChange={ ( event ) => {
							setCustomEnabled( event.target.checked );
							updateSettings( ( draft ) => {
								const currentCustom =
									draft.trigger_recipients[ eventDef.key ]
										?.custom || [];

								draft.trigger_recipients[ eventDef.key ] = {
									roles:
										draft.trigger_recipients[ eventDef.key ]
											?.roles || [],
									custom: event.target.checked
										? currentCustom
										: [],
								};
							} );
						} }
					/>
					<span>{ __( 'Custom recipients', 'niftyconnect' ) }</span>
				</label>
			</div>
			{ customEnabled && (
				<Field
					id={ `nh-trigger-${ eventDef.key }-custom` }
					label={ __( 'Custom recipient emails', 'niftyconnect' ) }
					textarea
					value={ recipients.custom.join( '\n' ) }
					onChange={ ( value ) => {
						updateSettings( ( draft ) => {
							draft.trigger_recipients[ eventDef.key ] = {
								roles:
									draft.trigger_recipients[ eventDef.key ]
										?.roles || [],
								custom: parseRecipients( value ),
							};
						} );
					} }
				/>
			) }
		</div>
	);
}
