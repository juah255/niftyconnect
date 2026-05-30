import type { ReactNode } from 'react';

interface CardProps {
	children: ReactNode;
	className?: string;
}

function classes( ...items: Array< string | undefined > ) {
	return items.filter( Boolean ).join( ' ' );
}

export function Card( { children, className = '' }: CardProps ) {
	return (
		<section
			className={ classes(
				'rounded-xl border border-slate-200 bg-white shadow-sm',
				className
			) }
		>
			{ children }
		</section>
	);
}

export function CardHeader( { children, className = '' }: CardProps ) {
	return (
		<div
			className={ classes(
				'flex items-start justify-between gap-4 p-6',
				className
			) }
		>
			{ children }
		</div>
	);
}

export function CardTitle( { children, className = '' }: CardProps ) {
	return (
		<h3
			className={ classes(
				'text-lg font-semibold tracking-normal text-slate-900',
				className
			) }
		>
			{ children }
		</h3>
	);
}

export function CardDescription( { children, className = '' }: CardProps ) {
	return (
		<p
			className={ classes(
				'mt-1 text-sm leading-6 text-slate-500',
				className
			) }
		>
			{ children }
		</p>
	);
}

export function CardContent( { children, className = '' }: CardProps ) {
	return (
		<div className={ classes( 'p-6 pt-0', className ) }>{ children }</div>
	);
}
