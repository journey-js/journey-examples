import Ractive from "Ractive.js";
import template from  "./binding.html";

var binding = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = createView( options.target );
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown( );
	}
};

function createView( target ){

	var view = new Ractive( {
		el: target,
		template: template,

		data: { "name": "World!" },
		resetData: function ( ) {
			this.set( "name", "World!" );
		}
	} );
	return view;
}

export default binding;


