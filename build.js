var rollup = require( 'rollup' );
var buble = require( 'rollup-plugin-buble' );
var string = require( 'rollup-plugin-string' );
var rollupConfig = require( './rollup.config.js' );
const pkg = require( './package.json' );
var path = require( 'path' );
var uglify = require( 'rollup-plugin-uglify' );
var ractive = require( './rollup-plugin-rc' );
var CleanCSS = require( 'clean-css' );
var fs = require( 'fs-plus' );
var glob = require( 'glob' );

function start( ) {
	let src = path.join("web", "src");
	let dest = pkg.docsFolder;
	copyAssets( src, dest );

	compileJS( ).then( compileCss( ) ).catch( ( e ) => {
		console.log( e );
	} );
}

function copyAssets( source, target ) {
	fs.copySync(source, target);
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
//	rollupConfig.plugins[1] = ( ractive( {
//			include: [ '**/home.html', '**/nav.html' ]
//	}) );
//	rollupConfig.plugins.unshift(
//			parseRactive( {
//				// By default, all .html files are compiled
//				include: [ '**/home.html', '**/nav.html' ]
//			} ) );

		rollup.rollup( rollupConfig )
				.then( function ( bundle ) {
					// Generate bundle + sourcemap

					bundle.write( {
						dest: pkg.mainDocs,
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
	let source = path.join( "web", "src", "css", "site.css" );
	let result = new CleanCSS( { rebaseTo: path.join( "web/src/css" ) } ).minify( [ source ] );

	let compiledCss = result.styles;

	let target = path.join( pkg.docsFolder, "css", "site.css" );
	fs.writeFileSync( target, compiledCss, "utf-8" );
	return Promise.resolve();
}

/*
 function versionAssets(rConfig) {
 
 var version = new versioning({
 assets: [rConfig.dir + '/css/site.css', rConfig.dir + '/js/lib/require.js'],
 grepFiles: [rConfig.dir + '/index.html']
 });
 
 var promise = new Promise(function (resolve, reject) {
 
 version.run(function () {
 resolve();
 });
 });;
 }*/

start( );
