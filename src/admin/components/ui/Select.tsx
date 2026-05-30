import type { ChangeEvent, ReactNode } from 'react';

interface SelectOption {
	label: string;
	value: string;
}

interface SelectProps {
	id: string;
	label: string;
	value: string;
	options: SelectOption[];
	onChange: ( value: string ) => void;
	icon?: ReactNode;
	disabled?: boolean;
}

export function Select( {
	id,
	label,
	value,
	options,
	onChange,
	icon,
	disabled = false,
}: SelectProps ) {
	const selectPaddingStyle = icon
		? {
				paddingLeft: '2.75rem',
				paddingRight: '2.75rem',
		  }
		: {
				paddingRight: '2.75rem',
		  };

	return (
		<label className="grid gap-2" htmlFor={ id }>
			{ label ? (
				<span className="text-sm font-medium text-slate-700">
					{ label }
				</span>
			) : null }
			<span className="relative block">
				<select
					id={ id }
					value={ value }
					disabled={ disabled }
					className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
					style={ selectPaddingStyle }
					onChange={ ( event: ChangeEvent< HTMLSelectElement > ) =>
						onChange( event.target.value )
					}
				>
					{ options.map( ( option ) => (
						<option key={ option.value } value={ option.value }>
							{ option.label }
						</option>
					) ) }
				</select>
				{ icon && (
					<span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
						{ icon }
					</span>
				) }
				<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
					<svg
						aria-hidden="true"
						className="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
							clipRule="evenodd"
						/>
					</svg>
				</span>
			</span>
		</label>
	);
}
