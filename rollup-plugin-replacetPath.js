var MagicString = require( 'magic-string' );
var createFilter = require( 'rollup-pluginutils' ).createFilter;

module.exports = function injectPath( options = {} ) {

	const filter = createFilter( options.include, options.exclude );

	return {
		name: 'injectPath',

		transform( code, id ) {
			const magicString = new MagicString( code );
			var find = '/*%injectPath%*/';

			let path = getPath( id );
			let replace = 'route.path = "' + path + '"';

			let start = code.indexOf( find );
			if ( start >= 0 ) {
				let end = start + find.length;
				magicString.overwrite( start, end, replace );
			}

			let result = { code: magicString.toString() };
			if ( options.sourceMap !== false )
				result.map = magicString.generateMap( { hires: true } );

			return result;
		}
	};

	function getPath( id ) {
		id = id.replace( /\\/g, "/" ); // normalize id for windows/linux
		let startPath = "/src/";
		let start = id.indexOf( startPath );
		if ( start >= 0 ) {
			id = id.substr( start + startPath.length );
		}
		
		start = id.indexOf(".");
		if (start >= 0) {
			id = id.substring(0, start);
		}
		return id;
}
}
