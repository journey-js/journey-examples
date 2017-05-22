import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./basicTransition.html";
import fade from "lib/fade.js";

var basicTransition = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = new Ractive( {
			el: options.target,
			template: template, loadView: function () {
				journey.goto( "/basicTransition", { forceReload: true } );
			},
			transitions: {
				fade: fade
			}
		} );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

export default basicTransition;
