declare module '@wordpress/i18n' {
	export function __( text: string, domain?: string ): string;
	export function _n(
		single: string,
		plural: string,
		number: number,
		domain?: string
	): string;
	export function sprintf(
		format: string,
		...args: Array< string | number >
	): string;
}

declare module '@wordpress/api-fetch' {
	type ApiFetchOptions = {
		path?: string;
		url?: string;
		method?: string;
		data?: unknown;
		headers?: Record< string, string >;
	};

	interface ApiFetch {
		< T = unknown >( options: ApiFetchOptions ): Promise< T >;
		use: ( middleware: unknown ) => void;
		createNonceMiddleware: ( nonce: string ) => unknown;
	}

	const apiFetch: ApiFetch;
	export default apiFetch;
}

declare module '@wordpress/element' {
	export { useEffect, useState, createElement, Fragment } from 'react';

	export function createRoot( container: Element | DocumentFragment ): {
		render: ( children: React.ReactNode ) => void;
	};

	export function render(
		element: React.ReactNode,
		container: Element | DocumentFragment
	): void;
}
