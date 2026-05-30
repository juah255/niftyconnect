import type { ChangeEvent, ReactNode } from 'react';

import Input from './ui/Input';
import Label from './ui/Label';
import { Select } from './ui/Select';
import Textarea from './ui/Textarea';

interface FieldProps {
	id: string;
	label: string;
	value: string;
	onChange: ( value: string ) => void;
	type?: string;
	textarea?: boolean;
	options?: Array< { label: string; value: string } >;
	disabled?: boolean;
	placeholder?: string;
	help?: ReactNode;
}

export default function Field( {
	id,
	label,
	value,
	onChange,
	type = 'text',
	textarea = false,
	options = [],
	disabled = false,
	placeholder = '',
	help = '',
}: FieldProps ) {
	const commonProps = {
		id,
		value: value || '',
		disabled,
		onChange: (
			event: ChangeEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			>
		) => onChange( event.target.value ),
	};
	const inputProps = {
		...commonProps,
		placeholder,
	};
	let control = <Input { ...inputProps } type={ type } />;

	if ( textarea ) {
		control = <Textarea { ...inputProps } />;
	} else if ( options.length ) {
		control = (
			<Select
				id={ id }
				label={ label }
				value={ value || '' }
				options={ options }
				disabled={ disabled }
				onChange={ onChange }
			/>
		);
	}

	return (
		<div className="grid gap-2">
			{ ! options.length && <Label htmlFor={ id }>{ label }</Label> }
			{ control }
			{ help && (
				<p className="text-sm leading-6 text-slate-500">{ help }</p>
			) }
		</div>
	);
}
