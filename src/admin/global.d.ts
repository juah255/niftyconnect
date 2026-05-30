import type { AdminConfig } from './types';

declare global {
	interface Window {
		NiftyConnect?: AdminConfig;
	}
}

export {};
