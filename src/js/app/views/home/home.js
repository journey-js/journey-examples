import journey from "lib/journey/journey.js";
import template from "./home.html";
import Ractive from "Ractive.js";

var home = {

	// this function is called when we enter the route
	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		// Create our view, and assign it to the route under the property 'view'.
		route.view = new Ractive( {
			el: options.target,
			template: template,
					
			onrender: function() {
				// We want a funky intro for our text, so after 500ms we display the node with id='home-demo'
				// and add the class rollIn.
				setTimeout(function() {
				$('#home-demo').removeClass('invisible').addClass("rollIn");
			}, 500);
			}
		} );
	},

	// this function is called when we leave the route
	leave: function ( route, nextRoute, options ) {

		// Remove the view from the DOM
		route.view.teardown();
	}
};

export default home;
