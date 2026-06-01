import { __ } from '@wordpress/i18n';

import type { FeatureDefinition } from './types';

export function clone< T >( value: T ): T {
	return JSON.parse( JSON.stringify( value ) ) as T;
}

export function objectValues< T >(
	value: Record< string, T > | undefined
): T[] {
	return value ? Object.keys( value ).map( ( key ) => value[ key ] ) : [];
}

export function orderedChannels(
	value: Record< string, FeatureDefinition > | undefined
): FeatureDefinition[] {
	const priority: Record< string, number > = {
		telegram: 0,
		email: 1,
	};

	return objectValues( value ).sort( ( left, right ) => {
		const leftOrder = priority[ left.key ] ?? Number.MAX_SAFE_INTEGER;
		const rightOrder = priority[ right.key ] ?? Number.MAX_SAFE_INTEGER;

		if ( leftOrder !== rightOrder ) {
			return leftOrder - rightOrder;
		}

		return left.label.localeCompare( right.label );
	} );
}

export function eventItems(
	features: { events: Record< string, FeatureDefinition > },
	category: string
): FeatureDefinition[] {
	return objectValues( features.events ).filter(
		( item ) => item.category === category
	);
}

export function eventCategoryLabel( category: string ): string {
	const labels: Record< string, string > = {
		wordpress: __( 'WordPress events', 'niftyconnect' ),
		woocommerce: __( 'WooCommerce events', 'niftyconnect' ),
		system: __( 'System events', 'niftyconnect' ),
	};

	if ( labels[ category ] ) {
		return labels[ category ];
	}

	return category
		.split( /[_-]+/ )
		.map( ( part ) => part.charAt( 0 ).toUpperCase() + part.slice( 1 ) )
		.join( ' ' );
}

export function orderedEventCategories( categories: string[] ): string[] {
	const priority: Record< string, number > = {
		wordpress: 0,
		woocommerce: 1,
		system: 2,
	};

	return Array.from( new Set( categories ) ).sort( ( left, right ) => {
		const leftOrder = priority[ left ] ?? Number.MAX_SAFE_INTEGER;
		const rightOrder = priority[ right ] ?? Number.MAX_SAFE_INTEGER;

		if ( leftOrder !== rightOrder ) {
			return leftOrder - rightOrder;
		}

		return eventCategoryLabel( left ).localeCompare(
			eventCategoryLabel( right )
		);
	} );
}

export function eventCategoryGroups( features: {
	events: Record< string, FeatureDefinition >;
} ): Array< { key: string; label: string; items: FeatureDefinition[] } > {
	const routeableEvents = objectValues( features.events ).filter(
		( event ) => event.routeable !== false
	);

	return orderedEventCategories(
		routeableEvents.map( ( event ) => event.category || 'system' )
	).map( ( category ) => ( {
		key: category,
		label: eventCategoryLabel( category ),
		items: routeableEvents.filter(
			( event ) => ( event.category || 'system' ) === category
		),
	} ) );
}

export function parseRecipients( value: string ): string[] {
	return value
		.split( /[\n,]+/ )
		.map( ( item ) => item.trim() )
		.filter( Boolean );
}
