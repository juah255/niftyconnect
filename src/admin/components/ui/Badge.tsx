import type { ReactNode } from 'react';

interface BadgeProps {
	children: ReactNode;
	className?: string;
}

export default function Badge( { children, className = '' }: BadgeProps ) {
	return (
		<span
			className={ `inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 ${ className }`.trim() }
		>
			{ children }
		</span>
	);
}
