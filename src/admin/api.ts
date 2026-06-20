import apiFetch from '@wordpress/api-fetch';

import { config } from './config';
import type { Payload, Settings } from './types';

apiFetch.use( apiFetch.createNonceMiddleware( config.nonce || '' ) );

export function getSettings(): Promise< Payload > {
	return apiFetch( { path: '/niftyconnect/v1/settings' } );
}

export function saveSettings( settings: Settings ): Promise< Payload > {
	return apiFetch( {
		path: '/niftyconnect/v1/settings',
		method: 'POST',
		data: { settings },
	} );
}

export function sendTestNotification(
	recipient: string,
	channel = '',
	telegramChatId = '',
	whatsappPhone = '',
	discordThreadId = ''
): Promise< {
	message: string;
	result: { limit: Payload[ 'stats' ][ 'limit' ] };
} > {
	return apiFetch( {
		path: '/niftyconnect/v1/test',
		method: 'POST',
		data: {
			recipient,
			channel,
			telegram_chat_id: telegramChatId,
			whatsapp_phone: whatsappPhone,
			discord_thread_id: discordThreadId,
		},
	} );
}
