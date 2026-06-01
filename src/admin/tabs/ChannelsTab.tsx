import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { Plus, Trash2 } from 'lucide-react';

import {
	eventCategoryGroups,
	orderedChannels,
	parseRecipients,
} from '../utils';
import type {
	ChannelSettings,
	FeatureDefinition,
	Payload,
	RuleOperator,
	SmartRule,
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
import Button from '../components/ui/Button';
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

interface RuleFieldOption {
	label: string;
	value: string;
}

const operatorOptions: Array< { label: string; value: RuleOperator } > = [
	{ label: __( 'is exactly', 'niftyconnect' ), value: 'equals' },
	{ label: __( 'contains', 'niftyconnect' ), value: 'contains' },
	{ label: __( 'is greater than', 'niftyconnect' ), value: 'greater_than' },
	{ label: __( 'is less than', 'niftyconnect' ), value: 'less_than' },
	{ label: __( 'is one of', 'niftyconnect' ), value: 'in' },
];

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
														{ Array.isArray(
															payload.settings
																.rules
														) && (
															<TriggerConditions
																eventDef={
																	eventDef
																}
																payload={
																	payload
																}
																updateSettings={
																	updateSettings
																}
															/>
														) }
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

function TriggerConditions( {
	eventDef,
	payload,
	updateSettings,
}: {
	eventDef: FeatureDefinition;
	payload: Payload;
	updateSettings: UpdateSettings;
} ) {
	const eventRules = ( payload.settings.rules || [] )
		.map( ( rule, index ) => ( { index, rule } ) )
		.filter(
			( item ) =>
				item.rule.event === eventDef.key && item.rule.enabled !== false
		);
	const enabled = eventRules.length > 0;

	function addCondition() {
		updateSettings( ( draft ) => {
			if ( ! draft.rules ) {
				draft.rules = [];
			}

			draft.rules.push( defaultRuleForEvent( eventDef.key ) );
		} );
	}

	function updateCondition( index: number, patch: Partial< SmartRule > ) {
		updateSettings( ( draft ) => {
			if ( ! draft.rules?.[ index ] ) {
				return;
			}

			draft.rules[ index ] = {
				...draft.rules[ index ],
				...patch,
			};
		} );
	}

	function removeCondition( index: number ) {
		updateSettings( ( draft ) => {
			if ( ! draft.rules ) {
				return;
			}

			draft.rules = draft.rules.filter(
				( _rule, ruleIndex ) => ruleIndex !== index
			);
		} );
	}

	function setConditionsEnabled( value: boolean ) {
		updateSettings( ( draft ) => {
			if ( ! draft.rules ) {
				draft.rules = [];
			}

			if ( value ) {
				const hasRule = draft.rules.some(
					( rule ) =>
						rule.event === eventDef.key && rule.enabled !== false
				);

				if ( ! hasRule ) {
					draft.rules.push( defaultRuleForEvent( eventDef.key ) );
				}

				return;
			}

			draft.rules = draft.rules.filter(
				( rule ) => rule.event !== eventDef.key
			);
		} );
	}

	return (
		<div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-3.5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
						{ __( 'Conditions', 'niftyconnect' ) }
					</h5>
					<p className="mt-1 text-sm text-slate-500">
						{ enabled
							? __(
									'Only send when every condition matches.',
									'niftyconnect'
							  )
							: __(
									'Always send when this trigger fires.',
									'niftyconnect'
							  ) }
					</p>
				</div>
				<label
					className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
					htmlFor={ `nh-trigger-${ eventDef.key }-conditions-enabled` }
				>
					<span>{ __( 'Only send when', 'niftyconnect' ) }</span>
					<Switch
						checked={ enabled }
						id={ `nh-trigger-${ eventDef.key }-conditions-enabled` }
						onCheckedChange={ setConditionsEnabled }
					/>
				</label>
			</div>

			{ enabled && (
				<div className="space-y-3">
					{ eventRules.map( ( { index, rule } ) => {
						const fieldOptions = fieldOptionsForRule( rule );

						return (
							<div
								key={ rule.id || index }
								className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_1fr_1fr_auto]"
							>
								<Field
									id={ `nh-trigger-${ eventDef.key }-rule-${ index }-field` }
									label={
										fieldOptions.length
											? __( 'Field', 'niftyconnect' )
											: __(
													'Advanced field key',
													'niftyconnect'
											  )
									}
									value={ rule.field }
									options={ fieldOptions }
									placeholder="order_total_raw"
									help={
										fieldOptions.length
											? ''
											: __(
													'Use the internal field key supplied by the custom event.',
													'niftyconnect'
											  )
									}
									onChange={ ( field ) =>
										updateCondition( index, { field } )
									}
								/>
								<Field
									id={ `nh-trigger-${ eventDef.key }-rule-${ index }-operator` }
									label={ __( 'Condition', 'niftyconnect' ) }
									value={ rule.operator }
									options={ operatorOptions }
									onChange={ ( operator ) =>
										updateCondition( index, {
											operator: operator as RuleOperator,
										} )
									}
								/>
								<Field
									id={ `nh-trigger-${ eventDef.key }-rule-${ index }-value` }
									label={ __( 'Value', 'niftyconnect' ) }
									value={ rule.value }
									onChange={ ( value ) =>
										updateCondition( index, { value } )
									}
								/>
								<div className="flex items-end">
									<Button
										aria-label={ __(
											'Delete condition',
											'niftyconnect'
										) }
										onClick={ () =>
											removeCondition( index )
										}
										variant="secondary"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						);
					} ) }
					<Button onClick={ addCondition } variant="secondary">
						<Plus className="mr-2 h-4 w-4" />
						{ __( 'Add Condition', 'niftyconnect' ) }
					</Button>
				</div>
			) }
		</div>
	);
}

function defaultRuleForEvent( eventKey: string ): SmartRule {
	return {
		id: `rule_${ eventKey }_${ Date.now() }`,
		enabled: true,
		event: eventKey,
		field: fieldOptionsForEvent( eventKey )[ 0 ]?.value || '',
		operator: 'equals',
		value: '',
	};
}

function fieldOptionsForRule( rule: SmartRule ): RuleFieldOption[] {
	const fieldOptions = fieldOptionsForEvent( rule.event );
	const fieldExists = fieldOptions.some(
		( option ) => option.value === rule.field
	);

	if ( ! rule.field || ! fieldOptions.length || fieldExists ) {
		return fieldOptions;
	}

	return [
		...fieldOptions,
		{
			label: `${ __( 'Custom field', 'niftyconnect' ) }: ${ rule.field }`,
			value: rule.field,
		},
	];
}

function fieldOptionsForEvent( eventKey: string ): RuleFieldOption[] {
	const orderFields = [
		{ label: __( 'Order number', 'niftyconnect' ), value: 'order_number' },
		{ label: __( 'Order status', 'niftyconnect' ), value: 'order_status' },
		{
			label: __( 'Order total', 'niftyconnect' ),
			value: 'order_total_raw',
		},
		{ label: __( 'Currency', 'niftyconnect' ), value: 'order_currency' },
		{
			label: __( 'Customer name', 'niftyconnect' ),
			value: 'customer_name',
		},
		{
			label: __( 'Customer email', 'niftyconnect' ),
			value: 'customer_email',
		},
		{
			label: __( 'Payment method', 'niftyconnect' ),
			value: 'payment_method',
		},
		{
			label: __( 'Billing country', 'niftyconnect' ),
			value: 'billing_country',
		},
	];
	const productFields = [
		{ label: __( 'Product name', 'niftyconnect' ), value: 'product_name' },
		{ label: __( 'SKU', 'niftyconnect' ), value: 'product_sku' },
		{
			label: __( 'Stock quantity', 'niftyconnect' ),
			value: 'stock_quantity',
		},
		{ label: __( 'Stock status', 'niftyconnect' ), value: 'stock_status' },
		{
			label: __( 'Low stock amount', 'niftyconnect' ),
			value: 'low_stock_amount',
		},
	];
	const fields: Record< string, RuleFieldOption[] > = {
		post_published: [
			{ label: __( 'Post title', 'niftyconnect' ), value: 'post_title' },
			{
				label: __( 'Post author', 'niftyconnect' ),
				value: 'post_author',
			},
			{ label: __( 'Post type', 'niftyconnect' ), value: 'post_type' },
		],
		post_updated: [
			{ label: __( 'Post title', 'niftyconnect' ), value: 'post_title' },
			{
				label: __( 'Post author', 'niftyconnect' ),
				value: 'post_author',
			},
			{ label: __( 'Post type', 'niftyconnect' ), value: 'post_type' },
		],
		comment_new: [
			{
				label: __( 'Comment author', 'niftyconnect' ),
				value: 'comment_author',
			},
			{
				label: __( 'Comment email', 'niftyconnect' ),
				value: 'comment_email',
			},
			{
				label: __( 'Comment content', 'niftyconnect' ),
				value: 'comment_content',
			},
			{ label: __( 'Post title', 'niftyconnect' ), value: 'post_title' },
		],
		comment_pending: [
			{
				label: __( 'Comment author', 'niftyconnect' ),
				value: 'comment_author',
			},
			{
				label: __( 'Comment email', 'niftyconnect' ),
				value: 'comment_email',
			},
			{
				label: __( 'Comment content', 'niftyconnect' ),
				value: 'comment_content',
			},
			{ label: __( 'Post title', 'niftyconnect' ), value: 'post_title' },
		],
		user_registered: [
			{ label: __( 'Username', 'niftyconnect' ), value: 'user_login' },
			{ label: __( 'User email', 'niftyconnect' ), value: 'user_email' },
			{ label: __( 'User role', 'niftyconnect' ), value: 'user_role' },
		],
		wc_new_order: orderFields,
		wc_order_completed: orderFields,
		wc_order_status: [
			{
				label: __( 'Previous status', 'niftyconnect' ),
				value: 'old_status',
			},
			{ label: __( 'New status', 'niftyconnect' ), value: 'new_status' },
			...orderFields,
		],
		wc_new_customer: [
			{
				label: __( 'Customer name', 'niftyconnect' ),
				value: 'customer_name',
			},
			{
				label: __( 'Customer email', 'niftyconnect' ),
				value: 'customer_email',
			},
		],
		wc_low_stock: productFields,
		wc_back_in_stock: productFields,
		wc_abandoned_cart: [
			{
				label: __( 'Customer name', 'niftyconnect' ),
				value: 'customer_name',
			},
			{
				label: __( 'Customer email', 'niftyconnect' ),
				value: 'customer_email',
			},
			{
				label: __( 'Cart total', 'niftyconnect' ),
				value: 'cart_total_raw',
			},
			{ label: __( 'Cart items', 'niftyconnect' ), value: 'cart_items' },
		],
		wc_abandoned_cart_customer: [
			{
				label: __( 'Customer name', 'niftyconnect' ),
				value: 'customer_name',
			},
			{
				label: __( 'Customer email', 'niftyconnect' ),
				value: 'customer_email',
			},
			{
				label: __( 'Cart total', 'niftyconnect' ),
				value: 'cart_total_raw',
			},
			{ label: __( 'Cart items', 'niftyconnect' ), value: 'cart_items' },
		],
		summary_daily: [
			{
				label: __( 'Summary count', 'niftyconnect' ),
				value: 'summary_count',
			},
			{
				label: __( 'Summary items', 'niftyconnect' ),
				value: 'summary_items',
			},
		],
		summary_weekly: [
			{
				label: __( 'Summary count', 'niftyconnect' ),
				value: 'summary_count',
			},
			{
				label: __( 'Summary items', 'niftyconnect' ),
				value: 'summary_items',
			},
		],
		summary_monthly: [
			{
				label: __( 'Summary count', 'niftyconnect' ),
				value: 'summary_count',
			},
			{
				label: __( 'Summary items', 'niftyconnect' ),
				value: 'summary_items',
			},
		],
	};

	return fields[ eventKey ] || [];
}
