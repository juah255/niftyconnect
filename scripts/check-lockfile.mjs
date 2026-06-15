import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const lockfileUrl = new URL( '../package-lock.json', import.meta.url );
const before = await readFile( lockfileUrl, 'utf8' );
const result = spawnSync(
	'npm',
	[
		'install',
		'--package-lock-only',
		'--ignore-scripts',
		'--no-audit',
		'--no-fund',
	],
	{
		cwd: new URL( '..', import.meta.url ),
		stdio: 'inherit',
		shell: process.platform === 'win32',
	}
);

if ( result.error ) {
	throw result.error;
}

if ( result.status !== 0 ) {
	process.exit( result.status ?? 1 );
}

const after = await readFile( lockfileUrl, 'utf8' );

if ( before !== after ) {
	console.error(
		'package-lock.json was out of date. Review and commit the regenerated lockfile.'
	);
	process.exit( 1 );
}

console.log( 'package-lock.json is synchronized.' );
