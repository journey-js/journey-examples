import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./basicPartial.html";
import helloPartial from "./partial.html";

var basicPartial = {
	
	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = new Ractive( {
			el: options.target,
			template: template,
			partials: {hello: helloPartial}
		} );
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

export default basicPartial;

