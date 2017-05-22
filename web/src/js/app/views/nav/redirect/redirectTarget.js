import journey from "lib/journey/journey";
import Ractive from "Ractive.js";
import template from "./redirectTarget.html";

var redirectTarget = {
	
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

export default redirectTarget
