import type { TextareaHTMLAttributes } from 'react';

export default function Textarea( {
	className = '',
	...props
}: TextareaHTMLAttributes< HTMLTextAreaElement > ) {
	return (
		<textarea
			className={ `min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 ${ className }`.trim() }
			{ ...props }
		/>
	);
}
