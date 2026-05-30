import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

import type { Payload, TemplateMode, UpdateSettings } from '../types';
import { eventCategoryLabel, orderedEventCategories } from '../utils';
import {
	getEventIcon,
	getGroupMeta,
	IconBubble,
} from '../components/FeatureVisuals';
import Field from '../components/Field';
import SectionTitle from '../components/SectionTitle';
import Badge from '../components/ui/Badge';
import Switch from '../components/ui/Switch';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../components/ui/Accordion';
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from '../components/ui/Card';

interface TemplatesTabProps {
	payload: Payload;
	updateSettings: UpdateSettings;
}

export default function TemplatesTab( {
	payload,
	updateSettings,
}: TemplatesTabProps ) {
	const { settings } = payload;
	const templateKeys = Object.keys( settings.templates ).filter( ( key ) => {
		const eventDef = payload.features.events[ key ];

		return (
			payload.meta.woocommerceActive ||
			! eventDef ||
			eventDef.category !== 'woocommerce'
		);
	} );
	const description = payload.meta.woocommerceActive
		? __(
				'Customize subject and body copy with variables like {{site_name}}, {{post_title}}, {{order_number}}, and {{customer_email}}.',
				'niftyconnect'
		  )
		: __(
				'Customize subject and body copy with variables like {{site_name}}, {{post_title}}, {{comment_author}}, and {{user_email}}.',
				'niftyconnect'
		  );
	const templateGroups = orderedEventCategories(
		templateKeys.map(
			( key ) => payload.features.events[ key ]?.category || 'system'
		)
	)
		.map( ( category ) => ( {
			key: category,
			label: eventCategoryLabel( category ),
			items: templateKeys.filter(
				( key ) =>
					( payload.features.events[ key ]?.category || 'system' ) ===
					category
			),
		} ) )
		.filter( ( group ) => group.items.length );
	const [ openGroups, setOpenGroups ] = useState< Record< string, boolean > >(
		{}
	);

	useEffect( () => {
		if ( ! templateGroups.length ) {
			if ( Object.keys( openGroups ).length ) {
				setOpenGroups( {} );
			}
			return;
		}

		setOpenGroups( ( current ) => {
			const next: Record< string, boolean > = {};

			templateGroups.forEach( ( group ) => {
				if ( current[ group.key ] ) {
					next[ group.key ] = true;
				}
			} );

			return Object.keys( next ).length === Object.keys( current ).length
				? current
				: next;
		} );
	}, [ openGroups, templateGroups ] );

	function toggleGroup( value: string ) {
		setOpenGroups( ( current ) => ( {
			...current,
			[ value ]: ! current[ value ],
		} ) );
	}

	return (
		<>
			<SectionTitle
				title={ __( 'Notification Templates', 'niftyconnect' ) }
				description={ description }
			/>
			<Accordion>
				{ templateGroups.map( ( group ) => {
					const groupMeta = getGroupMeta( group.key );
					const open = !! openGroups[ group.key ];

					return (
						<AccordionItem
							key={ group.key }
							open={ open }
							value={ group.key }
						>
							<AccordionTrigger
								className="px-5 py-3"
								onToggle={ () => toggleGroup( group.key ) }
								open={ open }
							>
								<TemplateGroupHeader
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
								<div className="border-t border-slate-200 bg-slate-50/40 p-4">
									<div className="space-y-4">
										{ group.items.map( ( key ) => {
											const eventDef = payload.features
												.events[ key ] || {
												key,
												label: key,
												description: __(
													'System template.',
													'niftyconnect'
												),
											};
											const template =
												settings.templates[ key ];
											const defaultTemplate =
												payload.meta.defaultTemplates[
													key
												] || template;
											const supportsTemplateMode =
												!! payload.meta
													.templateModeEvents[ key ];
											const templateMode =
												settings.template_modes[
													key
												] || 'custom';
											const useDefaultTemplate =
												supportsTemplateMode &&
												templateMode === 'default';
											const displayedTemplate =
												useDefaultTemplate
													? defaultTemplate
													: template;
											const EventIcon = getEventIcon(
												key,
												eventDef.category
											);

											return (
												<Card key={ key }>
													<div className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-4 p-6">
														<IconBubble
															className="h-9 w-9 shrink-0 bg-slate-100 text-slate-500"
															icon={ EventIcon }
															iconClassName="h-4 w-4"
														/>
														<div className="min-w-0 flex-1">
															<CardTitle className="min-w-0 truncate text-base leading-6">
																{
																	eventDef.label
																}
															</CardTitle>
															<CardDescription className="text-sm leading-6 text-slate-500">
																{
																	eventDef.description
																}
															</CardDescription>
														</div>
													</div>
													<CardContent className="space-y-4">
														{ supportsTemplateMode && (
															<TemplateModeControl
																category={
																	eventDef.category ||
																	'wordpress'
																}
																eventKey={ key }
																value={
																	templateMode
																}
																onChange={ (
																	value
																) => {
																	updateSettings(
																		(
																			draft
																		) => {
																			draft.template_modes[
																				key
																			] =
																				value;
																		}
																	);
																} }
															/>
														) }
														<Field
															id={ `nh-template-subject-${ key }` }
															label={ __(
																'Subject',
																'niftyconnect'
															) }
															disabled={
																useDefaultTemplate
															}
															value={
																displayedTemplate.subject
															}
															onChange={ (
																value
															) => {
																updateSettings(
																	(
																		draft
																	) => {
																		draft.templates[
																			key
																		].subject =
																			value;
																	}
																);
															} }
														/>
														<Field
															id={ `nh-template-body-${ key }` }
															label={ __(
																'Body',
																'niftyconnect'
															) }
															textarea
															disabled={
																useDefaultTemplate
															}
															value={
																displayedTemplate.body
															}
															onChange={ (
																value
															) => {
																updateSettings(
																	(
																		draft
																	) => {
																		draft.templates[
																			key
																		].body =
																			value;
																	}
																);
															} }
														/>
													</CardContent>
												</Card>
											);
										} ) }
									</div>
								</div>
							</AccordionContent>
						</AccordionItem>
					);
				} ) }
			</Accordion>
		</>
	);
}

function TemplateModeControl( {
	category,
	eventKey,
	onChange,
	value,
}: {
	category: string;
	eventKey: string;
	onChange: ( value: TemplateMode ) => void;
	value: TemplateMode;
} ) {
	const label =
		category === 'woocommerce'
			? __( 'Use default WooCommerce template', 'niftyconnect' )
			: __( 'Use default WordPress template', 'niftyconnect' );

	return (
		<label
			className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3"
			htmlFor={ `nh-template-mode-${ eventKey }` }
		>
			<span className="text-sm font-semibold text-slate-800">
				{ label }
			</span>
			<Switch
				checked={ value === 'default' }
				id={ `nh-template-mode-${ eventKey }` }
				onCheckedChange={ ( checked ) =>
					onChange( checked ? 'default' : 'custom' )
				}
			/>
		</label>
	);
}

function TemplateGroupHeader( {
	description,
	icon: Icon,
	label,
	totalCount,
}: {
	description: string;
	icon: ReturnType< typeof getGroupMeta >[ 'icon' ];
	label: string;
	totalCount: number;
} ) {
	const badgeLabel =
		totalCount === 1
			? __( 'template', 'niftyconnect' )
			: __( 'templates', 'niftyconnect' );

	return (
		<div className="flex min-w-0 flex-1 items-center justify-between gap-4">
			<div className="flex min-w-0 items-center gap-4">
				<IconBubble
					className="h-9 w-9 bg-indigo-50 text-indigo-600"
					icon={ Icon }
					iconClassName="h-4 w-4"
				/>
				<div className="min-w-0">
					<h4 className="text-base font-semibold text-slate-900">
						{ label }
					</h4>
					<p className="mt-0.5 text-sm text-slate-500">
						{ description }
					</p>
				</div>
			</div>
			<Badge className="border-slate-200 bg-slate-100 font-semibold normal-case tracking-normal text-slate-600">
				{ totalCount } { badgeLabel }
			</Badge>
		</div>
	);
}
