import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./basicForm.html";

var basicForm = {

	enter: function ( route, prevRoute, options ) {
		
		route.view = new Ractive( {

			el: options.target,

			template: template,

			data: {
				check: true
			},

			submit: function () {
				$( '.bs-callout-info' ).removeClass( 'hidden' );
				return false;
			},

			resetData: function () {
				$( '.bs-callout-info' ).addClass( 'hidden' );
			}
		} );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

export default basicForm
