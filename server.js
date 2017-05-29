var express = require( 'express' );
let fsPath = require( 'path' );
var open = require( 'open' );
var chokidar = require( 'chokidar' );
var fs = require( 'fs-extra' );
var cmd = require( 'node-cmd' );
const execSync = require( 'child_process' ).execSync;
const exec = require( 'child_process' ).exec;
var rollup = require( 'rollup' );
var buble = require( 'rollup-plugin-buble' );
var string = require( 'rollup-plugin-string' );
var watch = require( 'rollup-watch' );
var rollupConfig = require( './rollup.config.js' );
const pkg = require( './package.json' );

let starting = true;

const contextPath = 'build';
const useContextPath = false;

const buildFolder = 'build';
const srcFolder = 'src';

watchAssets();

transpileJS();

function transpileJS() {

	watch( rollup, rollupConfig )
			.on( 'event', e => {

				if ( e.code === 'ERROR' ) {
					console.log( e );
				}

				if ( e.code == 'BUILD_END' ) {
					if ( starting ) {
						setupServer();
						starting = false; // We don't want setupServer to be called every time a rollup completes a build ie everytime a file is changed.
					}
				}
			} )
}

function setupServer() {
	startServer();
	// Only start server once
}

function watchAssets() {

	chokidar.watch( srcFolder + '/**/*', { ignored: [ '' ] } ).on( 'all', ( event, path ) => {

		if ( ! fs.lstatSync( path ).isDirectory() ) {

			writeToDest( path );
		}
	} );
}

function writeToDest( path ) {

	let srcStr = fsPath.normalize( srcFolder );
	let buildStr = fsPath.normalize( buildFolder );
	let buildPath = path.replace( srcStr, buildStr );

	let buildDir = fsPath.dirname( buildPath );

	// Ensure the build folder exists
	fs.ensureDirSync( buildDir );

	var content = fs.readFileSync( path, 'binary' );
	content = removeInjectPathComment( content );
	fs.writeFileSync( buildPath, content, 'binary' );
}

function removeInjectPathComment( content ) {
	content = content.replace( '/*%injectPath%*/', '' ); // remove the indexPath comment
	return content;
}

function startServer() {

	var app = express();

	app.get( [ '/data/hello.json', '/' + buildFolder + '/data/hello.json' ], function ( req, res ) {
		var sleep = req.query.delay || 0;
		var reject = req.query.reject;
		if ( reject === 'true' ) {
			throw new Error( 'Rejected!' );
		}

		setTimeout( function () {
			res.sendFile( __dirname + '/src' + '/data/hello.json' );
		}, sleep );
	} );

	app.post( [ '/data/submitForm', '/' + buildFolder + '/data/submitForm' ], function ( req, res ) {
		var sleep = req.query.delay || 0;

		setTimeout( function () {
			res.send( '{"msg": "Successfully uploaded file"}' );
		}, sleep );
	} );

	// requests with . in them is passed to original request eg: my.js -> my.js, my.css -> my.css etc. Requests without an extension
	// are handled below
	app.get( '*.*', function ( req, res, next ) {
		let idx = req.url.indexOf( '?' );
		let path = req.url.substring( 0, idx != - 1 ? idx : req.url.length );

		if ( useContextPath ) {
			res.sendFile( fsPath.join( __dirname, path ) );

		} else {
			res.sendFile( fsPath.join( __dirname, contextPath, path ) );
		}
	} );

	// Catchall request: always return index.html. Thus we can support PUSHSTATE requests such as host/a and host/b. If user refresh browser
	// express will return index.html and the JS router can route to the neccessary controller
	app.get( '*', function ( req, res, next ) {

		let pathToIndex = fsPath.join( __dirname, buildFolder, 'index.html' );

		var content = fs.readFileSync( pathToIndex, 'binary' );

		if ( useContextPath ) {
			content = content.replace( /\/css\//g, '\/' + buildFolder + '\/css\/' );
			content = content.replace( /\/js\//g, '\/' + buildFolder + '\/js\/' );
		}
		res.send( content );
	} );

	if ( useContextPath ) {
		app.use( express.static( __dirname ) );

	} else {
		app.use( express.static( __dirname + contextPath ) );
	}
	app.listen( 9988 );

	console.log( '*** Server started ***' );

	if ( useContextPath ) {
		open( 'http://localhost:9988/' + contextPath + '/' );
	} else {
		open( 'http://localhost:9988/' );
	}
}
