import journey from "lib/journey/journey";
import template from "./navTargetParams.html";
import Ractive from "Ractive.js";
import session from "./session.js";

var navTargetParams = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/

		route.view = new Ractive( {
			el: options.target,
			template: template,
			data: {
				params: route.params,
				args: session.navArgs,
				query: route.query
			},
			start: function ( ) {
				journey.goto( "/basic", { x: "1234" } );
			}
		} );
	},
	leave: function ( route, nextRoute ) {
		route.view.teardown( );
	}
};

function createView( params, args ) {

	var view = new template( {
		data: {
			args: args,
			params: params
		}
	} );
	return view;
}

export default navTargetParams;