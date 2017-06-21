import journey from "lib/journey/journey";
import Ractive from "Ractive.js";
import template from "./invalid.html";

var invalid = {
	
	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		
		route.view = new Ractive( {
			el: options.target,
			template: template
		} );
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

export default invalid
