var buble = require( 'rollup-plugin-buble' );
var replacePathComment = require( './rollup-plugin-replacetPath' );
var ractiveCompiler = require( 'rollup-plugin-ractive-compiler' );
var stringToModule = require( 'rollup-plugin-string' );
var includePaths = require( 'rollup-plugin-includepaths' );
const pkg = require( './package.json' );

let includePathOptions = {
	paths: [ '../journey/src/js', './src/js',  './src/js/lib/ractive' ]
};

module.exports = {
	entry: 'src/js/app/start.js',

	// Ractive.js is loaded as an external library through index.html <script> tag. However
    // we want to import Ractive in our modules with: import Ractive fcrom 'Ractibe.js'.
    // So we inform Rollup that the 'Ractive.js' import is for an external library
	 external: [
		//'Ractive.js'
	],

	plugins: [

		ractiveCompiler( {
			include: [ '**/*.html' ],

			compile: false
		} ),
		
		stringToModule({
			include: ['**/*.text.html', '**/*.css']
		}),

		buble( {
			exclude: [ '**/*.html' ],
			transforms: {
				dangerousForOf: true
			}
		} ),

		replacePathComment( {
			include: '**/*.js'
		} ),

		includePaths( includePathOptions )
	],
	moduleName: 'journey',

	targets: [
		{
			dest: pkg.main,
			banner: '/* journey-examples version ' + pkg.version + ' */',
			format: 'iife',
			sourceMap: true
		}
	]
};
