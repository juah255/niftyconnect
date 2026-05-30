import type {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	ReactNode,
} from 'react';

type ButtonVariant = 'default' | 'secondary';

interface SharedProps {
	children: ReactNode;
	className?: string;
	variant?: ButtonVariant;
}

type LinkButtonProps = SharedProps &
	AnchorHTMLAttributes< HTMLAnchorElement > & {
		disabled?: boolean;
		href: string;
	};

type NativeButtonProps = SharedProps &
	ButtonHTMLAttributes< HTMLButtonElement > & {
		href?: undefined;
	};

type ButtonProps = LinkButtonProps | NativeButtonProps;

function classes( variant: ButtonVariant, className: string ) {
	const base =
		'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
	const variants: Record< ButtonVariant, string > = {
		default: 'bg-emerald-700 text-white hover:bg-emerald-800',
		secondary:
			'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
	};

	return `${ base } ${ variants[ variant ] } ${ className }`.trim();
}

export default function Button( props: ButtonProps ) {
	if ( 'href' in props && props.href ) {
		const linkProps = props as LinkButtonProps;
		const {
			children,
			className = '',
			disabled = false,
			variant = 'default',
			...rest
		} = linkProps;

		if ( disabled ) {
			return (
				<button
					aria-disabled="true"
					className={ classes( variant, className ) }
					disabled
					type="button"
				>
					{ children }
				</button>
			);
		}

		return (
			<a className={ classes( variant, className ) } { ...rest }>
				{ children }
			</a>
		);
	}

	const buttonProps = props as NativeButtonProps;
	const {
		children,
		className = '',
		type = 'button',
		variant = 'default',
		...rest
	} = buttonProps;

	return (
		<button
			className={ classes( variant, className ) }
			type={ type as 'button' | 'reset' | 'submit' | undefined }
			{ ...rest }
		>
			{ children }
		</button>
	);
}
