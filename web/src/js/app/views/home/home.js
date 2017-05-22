import journey from "lib/journey/journey.js";
import template from "./home.html";
import Ractive from "Ractive.js";

var home = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = new Ractive( {
			el: options.target,
			template: template,

			start: function () {
				journey.goto( "#basic?b=2#a=b" );
			}
		} );

	},

	leave: function ( route, nextRoute ) {
		route.view.teardown();
	}

};

export default home;
