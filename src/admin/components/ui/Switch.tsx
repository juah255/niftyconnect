interface SwitchProps {
	checked: boolean;
	className?: string;
	disabled?: boolean;
	id: string;
	onCheckedChange: ( checked: boolean ) => void;
}

export default function Switch( {
	checked,
	className = '',
	disabled = false,
	id,
	onCheckedChange,
}: SwitchProps ) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={ checked }
			aria-disabled={ disabled }
			id={ id }
			disabled={ disabled }
			className={ `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
				checked ? 'bg-emerald-700' : 'bg-slate-300'
			} ${ className }`.trim() }
			onClick={ () => {
				if ( ! disabled ) {
					onCheckedChange( ! checked );
				}
			} }
		>
			<span
				className={ `pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
					checked ? 'translate-x-5' : 'translate-x-0.5'
				}` }
			/>
		</button>
	);
}
