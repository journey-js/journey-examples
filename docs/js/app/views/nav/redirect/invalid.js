import journey from "lib/journey/journey";
import Ractive from "Ractive.js";
import template from "./invalid.html";

var invalid = {
	
	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		console.log("invalid.enter() from: ", prevRoute.pathname, " to:", route.pathname);
		
		route.view = new Ractive( {
			el: options.target,
			template: template
		} );
	},
	
	leave: function ( route, nextRoute, options ) {
		console.log("invalid.leave() from:", route.pathname, " to:", nextRoute.pathname);
		route.view.teardown();
	}
};

export default invalid
