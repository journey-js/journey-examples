var buble = require( 'rollup-plugin-buble' );
var ractiveCompiler = require( 'rollup-plugin-ractive-compiler' );
var stringToModule = require( 'rollup-plugin-string' );

module.exports = {
	
	 entry: 'src/js/app.js', // app.js bootstraps our application.
                            // app.js is referenced from index.html <script> tag
	
	plugins: [

		// this plugin allows us to import Ractive templates and optionally compile them
		// for production use. We disable compile by default and switch it back on for
		// production in dist.js
		ractiveCompiler( {
			include: [ '**/*.html' ],

			compile: false,
		} ),
		
		// this plugin allows us to import plain text/json files as ES6 Modules
		stringToModule({
			include: '**/*.text.html'
		}),

		// Setup Buble plugin to transpiler ES6 to ES5
		buble( {
			exclude: [ '**/*.html' ] // Skip HTML files
		} ),

		includePaths( includePathOptions )
	],
	moduleName: 'myApp',

	targets: [
		{
			dest: 'build/js/app/myapp.js', // Rollup output file
			format: 'iife',
			 sourceMap: true // NB: generating a SourceMap allows us to debug
                            // our code in the browser in it's original ES6 format.
		}
	]
};
