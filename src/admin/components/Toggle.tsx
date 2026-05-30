import Label from './ui/Label';
import Switch from './ui/Switch';

interface ToggleProps {
	checked: boolean;
	disabled?: boolean;
	id: string;
	label: string;
	onChange: ( checked: boolean ) => void;
}

export default function Toggle( {
	checked,
	disabled = false,
	id,
	label,
	onChange,
}: ToggleProps ) {
	return (
		<Label
			className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
			htmlFor={ id }
		>
			<span className="text-sm font-medium text-slate-800">
				{ label }
			</span>
			<Switch
				checked={ checked }
				disabled={ disabled }
				id={ id }
				onCheckedChange={ onChange }
			/>
		</Label>
	);
}
