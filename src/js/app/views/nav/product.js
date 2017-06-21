import journey from "lib/journey/journey";
import template from "./product.html";
import Ractive from "Ractive.js";
import session from "./session.js";

var product = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/

		route.view = new Ractive( {
			el: options.target,
			template: template,
			data: {
				params: route.params,
				data: session.data,
				query: route.query
			},
			start: function ( ) {
				journey.goto( "/basic", { x: "1234" } );
			}
		} );
		
		// clear the session data, we already retrieved it
		session.data = '';
	},
	leave: function ( route, nextRoute ) {
		route.view.teardown( );
	}
};

export default product;