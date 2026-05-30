import { __ } from '@wordpress/i18n';
export default function Header() {
	return (
		<header className="nh-hero mb-4 border-b border-slate-200 bg-transparent px-0 py-2 shadow-none">
			<h1 className="nh-title text-3xl font-semibold tracking-normal text-slate-900">
				{ __( 'niftyConnect', 'niftyconnect' ) }
			</h1>
		</header>
	);
}
