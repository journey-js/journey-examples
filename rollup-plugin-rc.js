var createFilter = require( 'rollup-pluginutils' ).createFilter;
var ractive = require( './ractive' );
module.exports = function ractiveCompiler( options = {} ) {

	let excludeArray = ensureArray( options.exclude );

	let includeTextArray = ensureArray( options.includeText ); 

	excludeArray = excludeArray.concat( includeTextArray ); // exclude text files from being parsed

	const compileFilter = createFilter( options.include, excludeArray );

	const textFilter = createFilter( options.includeText, options.exclude );

	return obj = {
		compile: options.compile,

		name: 'ractiveCompiler',

		transform( code, id ) {
			
			if ( compileFilter( id ) ) {
				let result = handleTemplate( code, id );
				return result;
			}
			
			if ( textFilter( id ) ) {
				let result = handleText( code, id );
				return result;
			}
			
			return null;
		}
	};


	function handleText( code, id ) {
		let result = JSON.stringify( code );
		return {
			code: "export default " + result,
			map: { mappings: '' }
		};
	}

	function handleTemplate( code, id ) {
		let result = code;
		
		if ( obj.compile ) {
			result = ractive.parse( code );
		}

		result = JSON.stringify( result );
		return {
			code: "export default " + result,
			map: { mappings: '' }
		};
	}

	function ensureArray( thing ) {
		if ( Array.isArray( thing ) )
			return thing;
		if ( thing == undefined )
			return [ ];
		return [ thing ];
}
};
