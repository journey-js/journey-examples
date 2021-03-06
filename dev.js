let fsPath = require( 'path' );
var chokidar = require( 'chokidar' );
var fs = require( 'fs-extra' );
var rollup = require( 'rollup' );
var watch = require( 'rollup-watch' );
var rollupConfig = require( './rollup.config.js' );
let server = require( './server' );

// Set source/build folders
const buildFolder = 'build';
const srcFolder = 'src';

// Set the destination where Rollup will write the transpiled Javascript bundle to
const rollupDest = buildFolder + '/js/app/app.js';

// Start the development environment
start( );

// start() drives the logic
function start() {
	
	// Watch files for changes and copy changed files to the build folder
	watchAssets()
		.then( compileJS )	 // Start transpiling and bundling our ES6 JS into ES5 JS.
		.then( startServer ) // We can start a Node based server such as Express to view our application.
							 // Or we can setup an external server to serve content from the
							 // 'build' folder.

		.catch( ( e ) => {      // catch any error and log to console
            console.log( e );   // Log errors to console
        } );
}

// Setup a watcher on our 'src' so that modified files are
// copied tro the build folder
function watchAssets() {

	// Watch all files for changes and when a file is created, updated or deleted the 'all' events is fired.
	chokidar.watch( srcFolder + '/**/*' ).on( 'all', ( event, path ) => {

		// No need to copy directories
		if ( ! fs.lstatSync( path ).isDirectory() ) {

			// We copy the changed file to the build folder
			writeToDest( path );
		}
	} );

	return Promise.resolve();
}

// Copy the changed file to the build folder
function writeToDest( path ) {

	// Set buildPath by replacing 'src' string with 'build' string
	let buildPath = buildFolder + path.slice( srcFolder.length );

	// Ensure the build folder exists
	let buildDir = fsPath.dirname( buildPath );
	fs.ensureDirSync( buildDir );

	var content = fs.readFileSync( path, 'binary' );
	content = removeInjectPathComment( content );
	fs.writeFileSync( buildPath, content, 'binary' );

	return Promise.resolve(); // All our functions return a promise
}

// Setup Rollup to transpile and bundle our ES6 JS into ES5 JS.
function compileJS() {
	
	let p = new Promise( function ( resolve, reject ) {
		
		// Set the destination where Rollup should write the ES5 bundle to.
		rollupConfig.targets[0].dest = rollupDest; // Output file

		// setup rollup' watcher in order to run rollup
		// whenever a JS file is changed
		let watcher = watch( rollup, rollupConfig );

		// We setup a listener for certain Rollup events
		watcher.on( 'event', e => {

			// Note: every time a file changes Rollup will tire a 'BUILD_END' event
			if ( e.code == 'BUILD_END' ) {

				// At this point our JS has been transpiled and bundled into ES5 code
				// so we can resolve the promise.				
				resolve();
			}

			// If Rollup encounters an error, we reject the promise and eventually log the error in start()
			if ( e.code === 'ERROR' ) {
				console.log( e );   // Log Rollup errors to console so we can debug.
				reject( e );
			}
		} );
	} );

	return p;
}

// Start Express server so we can view our application in the browser
function startServer() {
	
	server.start( {
		buildFolder: buildFolder,
		srcFolder: srcFolder
	} );

	return Promise.resolve(); // All our functions return a promise
}

function removeInjectPathComment( content ) {
	content = content.replace( '/*%injectPath%*/', '' ); // remove the indexPath comment
	return content;
}