import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./basicForm.html";

var basicForm = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = new Ractive( {

			el: options.target,

			template: template,

			data: {
				check: true
			},

			submit: function () {				
				this.set("submitted", true);
				return false;
			},

			resetData: function () {
				this.set("submitted", false);
			}
		} );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

export default basicForm
