var rollup = require( 'rollup' );
var buble = require( 'rollup-plugin-buble' );
var string = require( 'rollup-plugin-string' );
var rollupConfig = require( './rollup.config.js' );
const pkg = require( './package.json' );
var path = require( 'path' );
var uglify = require( 'rollup-plugin-uglify' );
var ractive = require( './rollup-plugin-ractive-compiler' );
var CleanCSS = require( 'clean-css' );
var fs = require( 'fs-extra' );
var glob = require( 'glob' );
var replaceInFile = require( 'replace-in-file' );
var versioning = require( "node-version-assets" );

let docsFolder = "docs";
let srcFolder = "src";

function start( ) {

	clean();

	copyAssets();

	compileJS( ).
			then( compileCss ).
			then( cdnHtml ).
			then( versionAssets ).
			catch( ( e ) => {
				console.log( e );
			} );
}

function clean() {
	fs.removeSync( docsFolder );

	// Ensure the build folder exists
	fs.ensureDirSync( docsFolder );
}

function copyAssets( ) {
	fs.copySync( srcFolder, docsFolder );
}

// When building for production we want to change some of the plugin options, eg. precompile templates, uglify etc.
// This function allow us to return plugins based on their names, so we can futher configure them before running rollup
function findPlugin( name ) {
	for ( let i = 0; i < rollupConfig.plugins.length; i ++ ) {
		let plugin = rollupConfig.plugins[i];
		if ( plugin.name === name ) {
			return plugin;
		}
		return null;
	}
}

function compileJS( ) {
	let p = new Promise( function ( resolve, reject ) {

		let ractiveCompiler = findPlugin( "ractiveCompiler" );
		ractiveCompiler.compile = true;
		rollupConfig.plugins.push( uglify( ) );

		rollup.rollup( rollupConfig )
				.then( function ( bundle ) {
					// Generate bundle + sourcemap

					bundle.write( {
						dest: pkg.moduleDocs,
						format: rollupConfig.targets[0].format,
						sourceMap: true
					} ).then( function ( ) {
						resolve();

					} ).catch( function ( e ) {
						reject( e );
					} );

				} ).catch( function ( e ) {
			reject( e );
		} );
	} );

	return p;
}

function compileCss( ) {
	let source = path.join( srcFolder, "css", "site.css" );
	let result = new CleanCSS( { rebaseTo: path.join( srcFolder, "css" ) } ).minify( [ source ] );

	let compiledCss = result.styles;

	let cssFolder = path.join( docsFolder, "css" );
	fs.ensureDirSync( cssFolder );

	let target = path.join( cssFolder, "site.css" );
	fs.writeFileSync( target, compiledCss, "utf-8" );
	return Promise.resolve();
}

function cdnHtml( ) {
	let pathToHtml = path.join( docsFolder, "index.html" );

	let options = {
		files: pathToHtml,
		from: [
			/<!-- start PROD imports/g, // 1
			/end PROD imports -->/g, // 2
			/<!-- start DEV imports -->/g, // 3
			/<!-- end DEV imports -->/g ], // 4

		to: [
			'<!-- start PROD imports -->', // 1
			'<!-- end PROD imports -->', // 2
			'<!-- start DEV imports', // 3
			'end DEV imports -->'          // 4
		]
	};

	try {
		replaceInFile.sync( options );
		console.log( 'Updated CDN path for ', pathToHtml );
	} catch ( error ) {
		console.error( 'Error occurred while updating CDN path for ', pathToHtml, error );
	}



	return Promise.resolve();
}

function versionAssets( ) {

	let htmlPath = path.join( docsFolder, 'index.html' );

	var version = new versioning( {
		assets: [ 'docs/css/site.css', 'docs/js/app/app.js' ],
		grepFiles: [ htmlPath ]
	} );

	var promise = new Promise( function ( resolve, reject ) {

		version.run( function () {
			resolve();
		} );
	} );

	return promise;
}

start( );
