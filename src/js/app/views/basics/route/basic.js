import journey from "lib/journey/journey";
import template from "./basic.html";
import Ractive from "Ractive.js";
import feedback from "app/comp/feedback/feedback.js";

var basic = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = new Ractive( {

			el: options.target,

			template: template,

			reloadRoute: function () {				
				journey.goto( "/basic", {forceReload: true} );
			}
		} );
	},

	leave: function ( route, nextRoute, options ) {
		return route.view.teardown();
	}
};

export default basic;
