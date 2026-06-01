export interface AdminConfig {
	restUrl?: string;
	nonce?: string;
	adminUrl?: string;
	woocommerceActive?: boolean;
}

export interface FeatureDefinition {
	key: string;
	label: string;
	description: string;
	category?: string;
	routeable?: boolean;
}

export interface Template {
	subject: string;
	body: string;
}

export type TemplateMode = 'custom' | 'default';

export interface ChannelSettings {
	enabled: boolean;
	config?: Record< string, string >;
	events?: Record< string, boolean >;
}

export interface RoleDefinition {
	key: string;
	label: string;
}

export interface TriggerRecipientSettings {
	roles: string[];
	custom: string[];
}

export interface GeneralSettings {
	enabled: boolean;
	recipients: string[];
	from_name: string;
	from_email: string;
	daily_limit: number;
}

export type RuleOperator =
	| 'equals'
	| 'contains'
	| 'greater_than'
	| 'less_than'
	| 'in';

export interface SmartRule {
	id: string;
	enabled: boolean;
	event: string;
	field: string;
	operator: RuleOperator;
	value: string;
}

export interface ActivityItem {
	id: number;
	eventKey: string;
	channel: string;
	status: 'success' | 'failed';
	subject: string;
	message: string;
	recipientCount: number;
	createdAt: string;
	timestamp: number;
}

export interface Settings {
	general: GeneralSettings;
	channels: Record< string, ChannelSettings >;
	triggers: Record< string, boolean >;
	trigger_recipients: Record< string, TriggerRecipientSettings >;
	templates: Record< string, Template >;
	template_modes: Record< string, TemplateMode >;
	rules?: SmartRule[];
}

export interface Payload {
	settings: Settings;
	features: {
		channels: Record< string, FeatureDefinition >;
		events: Record< string, FeatureDefinition >;
	};
	providers: Record< string, { key: string; label: string } >;
	stats: {
		activity: {
			total_sent: number;
			recent: ActivityItem[];
		};
		limit: {
			date: string;
			sent: number;
			limit: number;
			remaining: number | null;
			unlimited: boolean;
		};
	};
	meta: {
		version: string;
		woocommerceActive: boolean;
		defaultTemplates: Record< string, Template >;
		templateModeEvents: Record< string, boolean >;
		roles: RoleDefinition[];
	};
}

export type UpdateSettings = ( updater: ( draft: Settings ) => void ) => void;
