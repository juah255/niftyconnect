import type { LabelHTMLAttributes } from 'react';

/* eslint-disable jsx-a11y/label-has-associated-control */
export default function Label( {
	className = '',
	...props
}: LabelHTMLAttributes< HTMLLabelElement > ) {
	return (
		<label
			className={ `block text-sm font-medium text-slate-700 ${ className }`.trim() }
			{ ...props }
		/>
	);
}
