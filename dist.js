var rollup = require( 'rollup' );
var buble = require( 'rollup-plugin-buble' );
var rollupConfig = require( './rollup.config.js' );
const pkg = require( './package.json' );
var path = require( 'path' );
var uglify = require( 'rollup-plugin-uglify' );
var CleanCSS = require( 'clean-css' );
var fs = require( 'fs-extra' );
var glob = require( 'glob' );
var replaceInFile = require( 'replace-in-file' );
var versioning = require( 'node-version-assets' );

const distFolder = 'docs';
const srcFolder = 'src';

// Start the distribution
start( );

// start() drives all the logic
function start( ) {

    clean()
		.then( copyAssets )
		.then(compileJS)
		.then( compileCss )
		.then( uncommentCDN )
		.then( versionAssets )

		.catch( ( e ) => {
			console.log( e );
		} );
}

// Remove the previous distribution folder
function clean() {
    fs.removeSync( distFolder );

    // Ensure the build folder exists
    fs.ensureDirSync( distFolder );
	 return Promise.resolve(); // This function is synchronous so we return a resolved promise
}

// Copy all the assets to the distribution folder
function copyAssets( ) {
    fs.copySync( srcFolder, distFolder );
	 return Promise.resolve(); // This function is synchronous so we return a resolved promise
}

// Compile, bundle and uglify the JS to the distribution folder
// Setup Rollup to transpile and bundle our ES6 JS into ES5 JS.
function compileJS( ) {
    let p = new Promise( function ( resolve, reject ) {

        // Note that findRollupPlugin looks up a Rollup plugin with the same name in order
        // for us to further configure the plugin before running the production build.
        let ractiveCompiler = findRollupPlugin( "ractive-compiler" );

        ractiveCompiler.compile = true; // We want to precompile Ractive templates

        rollupConfig.plugins.push( uglify( ) ); // Add uglify plugin to minimize JS

        rollup.rollup( rollupConfig )
            .then( function ( bundle ) {
                // Generate bundle + sourcemap

                bundle.write( {
                    dest: distFolder + '/js/app/app.js', // Output file
                    format: rollupConfig.targets[0].format, // output format IIFE, CJS etc.
                    sourceMap: true // Yes we want a sourcemap

                } ).then( function ( ) {
                    // JS compilation step completed, so we continue to the next section.
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

// When building for production we want to change some of the plugin options, eg. precompile
// templates, uglify etc. This function allow us to return plugins based on their names, so
// we can futher configure them before running rollup
function findRollupPlugin( name ) {

    for ( let i = 0; i < rollupConfig.plugins.length; i ++ ) {

        let plugin = rollupConfig.plugins[i];
        if ( plugin.name === name ) {
            return plugin;
        }

        return null;
	}
}

// Bundle and uglify the CSS to the dsitrbution folder
function compileCss( ) {
	let source = path.join( srcFolder, 'css', 'site.css' );
	let result = new CleanCSS( { rebaseTo: path.join( srcFolder, 'css' ) } ).minify( [ source ] );

	let compiledCss = result.styles;

	let cssFolder = path.join( distFolder, 'css' );
	fs.ensureDirSync( cssFolder );

	let target = path.join( cssFolder, 'site.css' );
	fs.writeFileSync( target, compiledCss, 'utf-8' );
	return Promise.resolve();
}

// Replace comments in index.html so that external libraries are served from CDN
function uncommentCDN( ) {

	let pathToHtml = path.join( distFolder, 'index.html' );

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
		return Promise.reject( error );
    }

    return Promise.resolve();
}

// Version the JS and CSS so that future updates won't be cached by browser
function versionAssets( ) {

    let htmlPath = path.join( distFolder, 'index.html' );

    var version = new versioning( {
        assets: [ distFolder + '/css/site.css', distFolder + '/js/app/app.js' ],
        grepFiles: [ htmlPath ]
    } );

    var promise = new Promise( function ( resolve, reject ) {

        version.run( function () {
            resolve();
        } );
    } );

    return promise;
}
