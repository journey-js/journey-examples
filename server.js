var express = require( 'express' );
var open = require( 'open' );
let fsPath = require( 'path' );
var fs = require( 'fs-extra' );

module.exports = {};

let contextPath = 'build';
let useContextPath = false;
let buildFolder;
let srcFolder;

module.exports.start = function(options) {
	buildFolder = options.buildFolder;
	srcFolder = options.srcFolder;
	contextPath = options.contextPath || 'build';

	var app = express();

	app.get( [ '/data/hello.json', '/' + buildFolder + '/data/hello.json' ], function ( req, res ) {
		var sleep = req.query.delay || 0;
		var reject = req.query.reject;
		if ( reject === 'true' ) {
			throw new Error( 'Rejected!' );
		}

		setTimeout( function () {
			res.sendFile( __dirname + '/' + srcFolder + '/data/hello.json' );
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

//module.exports.start( { buildFolder: 'docs', srcFolder: 'src', contextPath: 'docs'});