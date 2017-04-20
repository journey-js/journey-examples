var buble = require( 'rollup-plugin-buble' );
var string = require( 'rollup-plugin-string' );
var injectPath = require( './rollup-injectPath' );
var includePaths = require( 'rollup-plugin-includepaths' );

const pkg = require( './package.json' );

let includePathOptions = {
	include: { },
	paths: [ '../journey/src/js', './web/src/js' ],
	//paths: [],
	external: [ ],
	extensions: [ '.js', '.json', '.html' ]
};

module.exports = {
	entry: 'web/src/js/app/start.js',
	plugins: [
		buble( {
			exclude: [ '**/*.html' ],
			transforms: {
				dangerousForOf: true
			}
		} ),
		
		injectPath({
			include: '**/*.js'			
		}),

		string( {
			// Required to be specified
			include: '**/*.html',

			// Undefined by default
			exclude: [ '**/index.html' ]
		} ),

		includePaths( includePathOptions )
	],
	moduleName: 'journey',
	globals: {
		'jquery.js': '$'
	},
	targets: [
		{
			dest: pkg.main,
			format: 'iife',
			sourceMap: true
		}
		//{ dest: pkg.module, format: 'es' }
	]
};