var buble = require( 'rollup-plugin-buble' );
var string = require( 'rollup-plugin-string' );
var includePaths = require( 'rollup-plugin-includepaths' );

const pkg = require( './package.json' );

let includePathOptions = {
	include: { },
	paths: [ '../journey/src/js', './dist/js'],
	//paths: [],
	external: [ ],
	extensions: [ '.js', '.json', '.html' ]
};

module.exports = {
	entry: 'web/src/js/app/start.js',
	plugins: [
		buble( {
			exclude: [ '**/*.html' ]
		} ),

		string( {
			// Required to be specified
			include: '**/*.html',

			// Undefined by default
			exclude: [ '**/index.html' ]
		} ),
		
		includePaths(includePathOptions)
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