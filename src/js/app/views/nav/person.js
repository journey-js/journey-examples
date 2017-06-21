import journey from "lib/journey/journey";
import template from "./person.html";
import Ractive from "Ractive.js";

var person = {
	
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

export default person


