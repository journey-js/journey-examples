import journey from "lib/journey/journey";
import template from "./navTarget.html";
import Ractive from "lib/ractive";

var navTarget = {
	
	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		
		route.view = new Ractive({
			el: options.target,
			template: template
		});
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
		
	}
};

export default navTarget


