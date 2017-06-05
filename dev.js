let fsPath = require( 'path' );
var chokidar = require( 'chokidar' );
var fs = require( 'fs-extra' );
var rollup = require( 'rollup' );
var watch = require( 'rollup-watch' );
var rollupConfig = require( './rollup.config.js' );
let server = require( './server' );

let starting = true;

const buildFolder = 'build';
const srcFolder = 'src';

watchAssets();

compileJS();

// Setup Rollup to transpile and bundle our ES6 JS into ES5 JS.
function compileJS() {

	// setup rollup' watcher in order to run rollup 
	// whenever a JS file is changed
	let watcher = watch( rollup, rollupConfig );

	// We setup a listener for certain Rollup events
	watcher.on( 'event', e => {

		// If Rollup encounters an error, we log to console so we can debug
		if ( e.code === 'ERROR' ) {
			console.log( e );
		}

		// Once the build is finished we start our server to access app
		if ( e.code == 'BUILD_END' ) {
			startServer();
		}
	} );
}

function startServer() {
	// This function will be called every time Rollup completes a build (ie everytime a file change)
	// so we add a check to only start the server once
	if ( starting ) {
		server.start( {
			buildFolder: buildFolder,
			srcFolder: srcFolder
		} );
		starting = false; // We don't want setupServer to be called every time a rollup completes a build ie everytime a file is changed.
	}
}

function watchAssets() {

	chokidar.watch( srcFolder + '/**/*' ).on( 'all', ( event, path ) => {

		// No need to copy directories
		if ( ! fs.lstatSync( path ).isDirectory() ) {

			writeToDest( path );
		}
	} );
}

function writeToDest( path ) {

	// Set buildPath by replacing 'src' str with 'build' str
	let buildPath = buildFolder + path.slice( srcFolder.length );

	// Ensure the build folder exists
	let buildDir = fsPath.dirname( buildPath );
	fs.ensureDirSync( buildDir );

	var content = fs.readFileSync( path, 'binary' );
	content = removeInjectPathComment( content );
	fs.writeFileSync( buildPath, content, 'binary' );
}

function removeInjectPathComment( content ) {
	content = content.replace( '/*%injectPath%*/', '' ); // remove the indexPath comment
	return content;
}
