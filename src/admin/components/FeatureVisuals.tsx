import type { LucideIcon } from 'lucide-react';
import {
	BellRing,
	CalendarDays,
	CheckCircle2,
	Clock3,
	Cloud,
	FileText,
	FolderOpen,
	Mail,
	MessageCircle,
	MessageSquare,
	Package,
	RefreshCw,
	Send,
	Shield,
	ShoppingBag,
	ShoppingCart,
	UserPlus,
} from 'lucide-react';

export function IconBubble( {
	className = '',
	icon: Icon,
	iconClassName = '',
}: {
	className?: string;
	icon: LucideIcon;
	iconClassName?: string;
} ) {
	return (
		<span
			className={ `inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ${ className }`.trim() }
		>
			<Icon className={ `h-5 w-5 ${ iconClassName }`.trim() } />
		</span>
	);
}

export function getChannelIcon( key: string ): LucideIcon {
	const icons: Record< string, LucideIcon > = {
		email: Mail,
		discord: Cloud,
		telegram: Send,
		whatsapp: MessageCircle,
	};

	return icons[ key ] || BellRing;
}

export function getGroupMeta( key: string ) {
	const groups: Record<
		string,
		{ description: string; icon: LucideIcon; iconClassName?: string }
	> = {
		wordpress: {
			description: 'Post, comment, and user lifecycle notifications',
			icon: FolderOpen,
		},
		woocommerce: {
			description: 'Order status, inventory, and customer triggers',
			icon: ShoppingBag,
		},
		security: {
			description:
				'Authentication and administrator access notifications',
			icon: Shield,
		},
		system: {
			description:
				'System notifications, summaries, and fallback content',
			icon: Shield,
		},
	};

	return (
		groups[ key ] || {
			description: 'Notification configuration group',
			icon: BellRing,
		}
	);
}

export function getEventIcon( key: string, category?: string ): LucideIcon {
	const icons: Record< string, LucideIcon > = {
		post_published: FileText,
		post_updated: RefreshCw,
		comment_new: MessageSquare,
		comment_pending: Clock3,
		user_registered: UserPlus,
		admin_login: Shield,
		wc_new_order: ShoppingCart,
		wc_order_completed: CheckCircle2,
		wc_order_status: RefreshCw,
		wc_new_customer: UserPlus,
		wc_low_stock: Package,
		wc_back_in_stock: Package,
		wc_abandoned_cart: ShoppingCart,
		wc_abandoned_cart_customer: ShoppingCart,
		summary_daily: CalendarDays,
		summary_weekly: CalendarDays,
		summary_monthly: CalendarDays,
	};

	if ( icons[ key ] ) {
		return icons[ key ];
	}

	return getGroupMeta( category || '' ).icon;
}
