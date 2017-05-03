import journey from "lib/journey/journey";
import Ractive from "lib/ractive";
import template from "./redirect.html";

var redirect = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		
		if ( route.query.typeId == null ) {
			journey.goto( "/redirectTarget" );
			return;

		} else {

			route.view = new Ractive( {
				el: options.target,
				template: template
			} );
		}
	},

	leave: function ( route, nextRoute, options ) {
		if ( route.view == null ) {
			return;
		}
		route.view.teardown();
	}
};

export default redirect;
