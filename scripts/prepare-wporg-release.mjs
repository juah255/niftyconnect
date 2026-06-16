import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname( fileURLToPath( import.meta.url ) );
const pluginDir = path.resolve( scriptDir, '..' );
const releaseDir = path.join( pluginDir, '.wporg-release' );
const pluginSlug = path.basename( pluginDir );
const mainFile = path.join( pluginDir, `${ pluginSlug }.php` );
const readmeFile = path.join( pluginDir, 'readme.txt' );
const packageFile = path.join( pluginDir, 'package.json' );
const requestedVersion = ( process.argv[ 2 ] || '' ).trim();

const runtimePaths = [
	'assets',
	'build',
	'includes',
	'languages',
	'scripts',
	'src',
	'.npmrc',
	'.nvmrc',
	'index.php',
	`${ pluginSlug }.php`,
	'package.json',
	'package-lock.json',
	'postcss.config.js',
	'readme.txt',
	'tsconfig.json',
	'uninstall.php',
	'webpack.config.js',
];

const requiredFiles = [
	mainFile,
	readmeFile,
	path.join( pluginDir, 'build', 'admin.js' ),
	path.join( pluginDir, 'build', 'admin.css' ),
	path.join( pluginDir, 'build', 'admin-rtl.css' ),
	path.join( pluginDir, 'build', 'admin.asset.php' ),
	path.join( pluginDir, 'languages', `${ pluginSlug }.pot` ),
	path.join( pluginDir, 'src', 'admin', 'index.tsx' ),
	path.join( pluginDir, 'package-lock.json' ),
	path.join( pluginDir, 'webpack.config.js' ),
];

const readText = ( file ) => readFileSync( file, 'utf8' );

const matchRequired = ( label, content, pattern ) => {
	const match = content.match( pattern );

	if ( ! match?.[ 1 ] ) {
		throw new Error( `Could not read ${ label }.` );
	}

	return match[ 1 ].trim();
};

const mainFileContents = readText( mainFile );
const readmeContents = readText( readmeFile );
const packageJson = JSON.parse( readText( packageFile ) );

const pluginHeaderVersion = matchRequired(
	'plugin header Version from niftyconnect.php',
	mainFileContents,
	/^\s+\*\s+Version:\s+([^\r\n]+)/m
);
const pluginConstantVersion = matchRequired(
	'NIFTYCONNECT_VERSION from niftyconnect.php',
	mainFileContents,
	/define\(\s*'NIFTYCONNECT_VERSION'\s*,\s*'([^']+)'\s*\)/
);
const readmeStableTag = matchRequired(
	'Stable tag from readme.txt',
	readmeContents,
	/^Stable tag:\s*([^\r\n]+)/im
);
const packageVersion = packageJson.version;
const releaseVersion = requestedVersion || pluginHeaderVersion;

if ( requestedVersion && requestedVersion.startsWith( 'v' ) ) {
	throw new Error(
		`Use a plain WordPress.org version tag like ${ requestedVersion.slice( 1 ) }, not ${ requestedVersion }.`
	);
}

if ( ! /^\d+(?:\.\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test( releaseVersion ) ) {
	throw new Error( `Release version "${ releaseVersion }" is not a valid WordPress.org version tag.` );
}

for ( const [ label, version ] of [
	[ 'plugin header Version', pluginHeaderVersion ],
	[ 'NIFTYCONNECT_VERSION', pluginConstantVersion ],
	[ 'readme.txt Stable tag', readmeStableTag ],
	[ 'package.json version', packageVersion ],
] ) {
	if ( version !== releaseVersion ) {
		throw new Error( `${ label } is "${ version }", expected "${ releaseVersion }".` );
	}
}

for ( const file of requiredFiles ) {
	if ( ! existsSync( file ) ) {
		throw new Error( `Missing required release file: ${ path.relative( pluginDir, file ) }` );
	}
}

const shouldSkip = ( file ) => file === '.DS_Store' || file.startsWith( 'npm-debug.log' ) || file.startsWith( 'yarn-error.log' );

const copyRecursive = ( source, destination ) => {
	const stats = statSync( source );

	if ( stats.isDirectory() ) {
		mkdirSync( destination, { recursive: true } );

		for ( const entry of readdirSync( source ) ) {
			if ( shouldSkip( entry ) ) {
				continue;
			}

			copyRecursive( path.join( source, entry ), path.join( destination, entry ) );
		}

		return;
	}

	writeFileSync( destination, readFileSync( source ) );
};

rmSync( releaseDir, { force: true, recursive: true } );
mkdirSync( releaseDir, { recursive: true } );

for ( const relativePath of runtimePaths ) {
	const source = path.join( pluginDir, relativePath );

	if ( ! existsSync( source ) ) {
		throw new Error( `Missing release path: ${ relativePath }` );
	}

	copyRecursive( source, path.join( releaseDir, relativePath ) );
}

console.log( `Prepared WordPress.org release ${ releaseVersion } in ${ path.relative( pluginDir, releaseDir ) }.` );
