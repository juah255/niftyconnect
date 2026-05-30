import type { ReactNode } from 'react';

interface SectionTitleProps {
	title: string;
	description?: string;
	action?: ReactNode;
}

export default function SectionTitle( {
	title,
	description,
	action,
}: SectionTitleProps ) {
	return (
		<div className="nh-section-title mb-5 flex items-start justify-between gap-4">
			<div>
				<h2 className="text-xl font-semibold tracking-normal text-slate-900">
					{ title }
				</h2>
				{ description && (
					<p className="mt-1 text-sm text-slate-500">
						{ description }
					</p>
				) }
			</div>
			{ action || null }
		</div>
	);
}
