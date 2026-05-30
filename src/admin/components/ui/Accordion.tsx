import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

function classes( ...items: Array< string | false | null | undefined > ) {
	return items.filter( Boolean ).join( ' ' );
}

export function Accordion( {
	children,
	className = '',
}: {
	children: ReactNode;
	className?: string;
} ) {
	return (
		<div className={ classes( 'space-y-4', className ) }>{ children }</div>
	);
}

export function AccordionItem( {
	children,
	className = '',
	open = false,
	value,
}: {
	children: ReactNode;
	className?: string;
	open?: boolean;
	value: string;
} ) {
	return (
		<section
			className={ classes(
				'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
				className
			) }
			data-state={ open ? 'open' : 'closed' }
			data-value={ value }
		>
			{ children }
		</section>
	);
}

export function AccordionTrigger( {
	children,
	className = '',
	onToggle,
	open = false,
}: {
	children: ReactNode;
	className?: string;
	onToggle: () => void;
	open?: boolean;
} ) {
	return (
		<button
			type="button"
			className={ classes(
				'flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-slate-50',
				className
			) }
			aria-expanded={ open }
			onClick={ onToggle }
		>
			{ children }
			<ChevronDown
				className={ classes(
					'h-4 w-4 shrink-0 text-slate-500 transition-transform',
					open && 'rotate-180'
				) }
			/>
		</button>
	);
}

export function AccordionContent( {
	children,
	className = '',
	open = false,
}: {
	children: ReactNode;
	className?: string;
	open?: boolean;
} ) {
	if ( ! open ) {
		return null;
	}

	return (
		<div className={ classes( 'px-5 pb-5', className ) }>{ children }</div>
	);
}
