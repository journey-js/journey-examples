var buble = require( 'rollup-plugin-buble' );
//var importText = require( 'rollup-plugin-string' );
//var string = require( './string' );
var replacePathComment = require( './rollup-plugin-replacetPath' );
var templateCompiler = require( './rollup-plugin-rc' );
var includePaths = require( 'rollup-plugin-includepaths' );

const pkg = require( './package.json' );

let includePathOptions = {
	include: { },
	paths: [ '../journey/src/js', './web/src/js', '../../ractive/src' ],
	external: [ ],
	extensions: [ '.js', '.json', '.html' ]
};

module.exports = {
	entry: 'web/src/js/app/start.js',
	plugins: [
//		ractive( {
//			include: '**/home.html'
//		} ),
		templateCompiler( {
			include: [ '**/*.html' ],
			compile: false,
			includeText: [ '**/*text.html' ]
		} ),
//
//		importText( {
//			// Required to be specified
//			include: '**/*.text.html',
//
//			// Undefined by default
//			exclude: [ '**/index.html', '**/home.html' ]
//		} ),

		buble( {
			exclude: [ '**/*.html' ],
			transforms: {
				dangerousForOf: true
			}
		} ),

		replacePathComment( {
			include: '**/*.js'
		} ),

//		parseRactive({
//			include: '**/home.html'
//		}),

		includePaths( includePathOptions )
	],
	moduleName: 'journey',

	targets: [
		{
			dest: pkg.main,
			format: 'iife',
			sourceMap: true
		}
		//{ dest: pkg.module, format: 'es' }
	]
};
