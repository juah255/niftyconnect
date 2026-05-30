import { __ } from '@wordpress/i18n';

import type { FeatureDefinition, Payload, UpdateSettings } from '../types';
import Toggle from './Toggle';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/Card';

interface EventGridProps {
	items: FeatureDefinition[];
	payload: Payload;
	updateSettings: UpdateSettings;
}

export default function EventGrid( {
	items,
	payload,
	updateSettings,
}: EventGridProps ) {
	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{ items.map( ( eventDef ) => (
				<Card key={ eventDef.key }>
					<CardHeader>
						<div>
							<CardTitle>{ eventDef.label }</CardTitle>
							<CardDescription>
								{ eventDef.description }
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<Toggle
							checked={
								!! payload.settings.triggers[ eventDef.key ]
							}
							id={ `nh-trigger-${ eventDef.key }` }
							label={ __( 'Enable trigger', 'niftyconnect' ) }
							onChange={ ( value ) => {
								updateSettings( ( draft ) => {
									draft.triggers[ eventDef.key ] = value;

									if ( ! value ) {
										Object.values( draft.channels ).forEach(
											( channel ) => {
												if ( channel.events ) {
													channel.events[
														eventDef.key
													] = false;
												}
											}
										);
										return;
									}

									const hasEnabledRoute = Object.values(
										draft.channels
									).some(
										( channel ) =>
											!! channel.events?.[ eventDef.key ]
									);

									if (
										! hasEnabledRoute &&
										draft.channels.email?.events
									) {
										draft.channels.email.events[
											eventDef.key
										] = true;
									}
								} );
							} }
						/>
					</CardContent>
				</Card>
			) ) }
		</div>
	);
}
