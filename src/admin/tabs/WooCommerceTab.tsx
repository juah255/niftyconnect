import { __ } from '@wordpress/i18n';

import { eventItems } from '../utils';
import type { Payload, UpdateSettings } from '../types';
import EventGrid from '../components/EventGrid';
import SectionTitle from '../components/SectionTitle';

interface WooCommerceTabProps {
	payload: Payload;
	updateSettings: UpdateSettings;
}

export default function WooCommerceTab( {
	payload,
	updateSettings,
}: WooCommerceTabProps ) {
	return (
		<>
			<SectionTitle
				title={ __( 'WooCommerce Notifications', 'niftyconnect' ) }
				description={ __(
					'Enable order, customer, and stock notifications for WooCommerce stores.',
					'niftyconnect'
				) }
			/>
			<EventGrid
				items={ eventItems( payload.features, 'woocommerce' ) }
				payload={ payload }
				updateSettings={ updateSettings }
			/>
		</>
	);
}
