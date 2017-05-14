import journey from "lib/journey/journey.js";
import template from "./home.html";
import Ractive from "lib/ractive.js";

var home = {

	enter: function ( route, prevRoute, options ) {
		console.log("HOME enter:", arguments);
		
		route.view = new Ractive( {
			el: options.target,
			template: template,

			start: function () {
				journey.goto( "#basic?b=2#a=b", { x: "1234" } );
			}
		} );

	},

	leave: function ( route, nextRoute ) {
		route.view.teardown();
	}

};

export default home;
