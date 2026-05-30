import { __, sprintf } from '@wordpress/i18n';
import { Plus, Trash2 } from 'lucide-react';

import { objectValues } from '../utils';
import type {
	Payload,
	RuleOperator,
	SmartRule,
	UpdateSettings,
} from '../types';
import Field from '../components/Field';
import SectionTitle from '../components/SectionTitle';
import Switch from '../components/ui/Switch';
import Button from '../components/ui/Button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../components/ui/Card';

interface RulesTabProps {
	payload: Payload;
	updateSettings: UpdateSettings;
}

const operatorOptions: Array< { label: string; value: RuleOperator } > = [
	{ label: __( 'Equals', 'niftyconnect' ), value: 'equals' },
	{ label: __( 'Contains', 'niftyconnect' ), value: 'contains' },
	{ label: __( 'Greater than', 'niftyconnect' ), value: 'greater_than' },
	{ label: __( 'Less than', 'niftyconnect' ), value: 'less_than' },
	{ label: __( 'In comma list', 'niftyconnect' ), value: 'in' },
];

export default function RulesTab( { payload, updateSettings }: RulesTabProps ) {
	const rules = payload.settings.rules || [];
	const eventOptions = objectValues( payload.features.events ).map(
		( event ) => ( {
			label: event.label,
			value: event.key,
		} )
	);
	const fallbackEvent = eventOptions[ 0 ]?.value || '';

	function addRule() {
		updateSettings( ( draft ) => {
			if ( ! draft.rules ) {
				draft.rules = [];
			}

			draft.rules.push( {
				id: `rule_${ Date.now() }`,
				enabled: true,
				event: fallbackEvent,
				field: '',
				operator: 'equals',
				value: '',
			} );
		} );
	}

	function updateRule( index: number, patch: Partial< SmartRule > ) {
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

	function removeRule( index: number ) {
		updateSettings( ( draft ) => {
			if ( ! draft.rules ) {
				return;
			}

			draft.rules = draft.rules.filter(
				( _rule, ruleIndex ) => ruleIndex !== index
			);
		} );
	}

	return (
		<>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<SectionTitle
					title={ __( 'Smart Rules', 'niftyconnect' ) }
					description={ __(
						'Filter notifications by values available in each event context.',
						'niftyconnect'
					) }
				/>
				<Button onClick={ addRule }>
					<Plus className="mr-2 h-4 w-4" />
					{ __( 'Add Rule', 'niftyconnect' ) }
				</Button>
			</div>

			{ rules.length ? (
				<div className="space-y-4">
					{ rules.map( ( rule, index ) => (
						<Card key={ rule.id || index }>
							<CardHeader className="items-center justify-between gap-4">
								<div>
									<CardTitle>
										{ sprintf(
											/* translators: %d: Rule number. */
											__( 'Rule %d', 'niftyconnect' ),
											index + 1
										) }
									</CardTitle>
									<CardDescription>
										{ eventLabel( payload, rule.event ) }
									</CardDescription>
								</div>
								<div className="flex items-center gap-3">
									<Switch
										checked={ rule.enabled }
										id={ `nh-rule-${ index }-enabled` }
										onCheckedChange={ ( enabled ) =>
											updateRule( index, { enabled } )
										}
									/>
									<Button
										aria-label={ __(
											'Delete rule',
											'niftyconnect'
										) }
										onClick={ () => removeRule( index ) }
										variant="secondary"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
									<Field
										id={ `nh-rule-${ index }-event` }
										label={ __( 'Event', 'niftyconnect' ) }
										value={ rule.event }
										options={ eventOptions }
										onChange={ ( event ) =>
											updateRule( index, { event } )
										}
									/>
									<Field
										id={ `nh-rule-${ index }-field` }
										label={ __(
											'Context field',
											'niftyconnect'
										) }
										value={ rule.field }
										placeholder="order_total_raw"
										onChange={ ( field ) =>
											updateRule( index, { field } )
										}
									/>
									<Field
										id={ `nh-rule-${ index }-operator` }
										label={ __(
											'Condition',
											'niftyconnect'
										) }
										value={ rule.operator }
										options={ operatorOptions }
										onChange={ ( operator ) =>
											updateRule( index, {
												operator:
													operator as RuleOperator,
											} )
										}
									/>
									<Field
										id={ `nh-rule-${ index }-value` }
										label={ __( 'Value', 'niftyconnect' ) }
										value={ rule.value }
										onChange={ ( value ) =>
											updateRule( index, { value } )
										}
									/>
								</div>
							</CardContent>
						</Card>
					) ) }
				</div>
			) : (
				<Card>
					<CardContent className="p-6">
						<p className="text-sm text-slate-500">
							{ __(
								'No smart rules are configured.',
								'niftyconnect'
							) }
						</p>
					</CardContent>
				</Card>
			) }
		</>
	);
}

function eventLabel( payload: Payload, eventKey: string ) {
	return payload.features.events[ eventKey ]?.label || eventKey;
}
