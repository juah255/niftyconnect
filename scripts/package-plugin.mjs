import { spawnSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname( fileURLToPath( import.meta.url ) );
const pluginDir = path.resolve( scriptDir, '..' );
const pluginSlug = path.basename( pluginDir );
const mainFile = path.join( pluginDir, `${ pluginSlug }.php` );
const distDir = path.join( pluginDir, 'dist' );

const requiredFiles = [
	mainFile,
	path.join( pluginDir, 'readme.txt' ),
	path.join( pluginDir, 'build', 'admin.js' ),
	path.join( pluginDir, 'build', 'admin.css' ),
	path.join( pluginDir, 'build', 'admin.asset.php' ),
	path.join( pluginDir, 'languages', `${ pluginSlug }.pot` ),
];

for ( const file of requiredFiles ) {
	if ( ! existsSync( file ) ) {
		throw new Error( `Missing required production file: ${ file }` );
	}
}

const header = readFileSync( mainFile, 'utf8' );
const versionMatch = header.match( /^\s+\*\s+Version:\s+([^\r\n]+)/m );
const version = versionMatch?.[ 1 ]?.trim();

if ( ! version ) {
	throw new Error( `Could not read plugin version from ${ mainFile }.` );
}

rmSync( distDir, { force: true, recursive: true } );
mkdirSync( distDir, { recursive: true } );

const zipPath = path.join( distDir, `${ pluginSlug }-${ version }.zip` );
const excludes = [
	`${ pluginSlug }/.git`,
	`${ pluginSlug }/.git/*`,
	`${ pluginSlug }/.gitignore`,
	`${ pluginSlug }/node_modules`,
	`${ pluginSlug }/node_modules/*`,
	`${ pluginSlug }/dist`,
	`${ pluginSlug }/dist/*`,
	`${ pluginSlug }/package-lock.json`,
	`${ pluginSlug }/.DS_Store`,
	`${ pluginSlug }/core.*`,
	`${ pluginSlug }/npm-debug.log*`,
	`${ pluginSlug }/yarn-error.log*`,
];

const result = spawnSync(
	'zip',
	[ '-rq', zipPath, pluginSlug, '-x', ...excludes ],
	{
		cwd: path.dirname( pluginDir ),
		stdio: 'inherit',
	}
);

if ( result.error ) {
	throw result.error;
}

if ( result.status !== 0 ) {
	process.exit( result.status || 1 );
}

const size = ( statSync( zipPath ).size / 1024 / 1024 ).toFixed( 2 );
console.log( `Created ${ zipPath } (${ size } MB)` );
