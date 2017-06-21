import journey from "lib/journey/journey";
import Ractive from "Ractive.js";
import template from "./methods.html";

var methods = {
	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = createView( options.target );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView( target ) {

	var view = new Ractive( {

		el: target,
		template: template,

		data: {
			items: [
				{ name: 'Item 1' },
				{ name: 'Item 2' },
				{ name: 'Item 3' }
			]
		},

		test: function ( ) {
			console.log( "test() invoked!" );
			return false;  //returning false cancels the original event, effectively calling event.preventDefault() and event.stopPropagation()
		},

		testArgs: function ( context, currentItem ) {
			console.log("--------- item clicked ------------");
			console.log( "current item: ", currentItem );
			console.log( "context", context );
			return false;
		}
	} );
	return view;
}


export default methods;
