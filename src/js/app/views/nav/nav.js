import journey from "lib/journey/journey";
import Ractive from "Ractive.js";
import template from "./nav.html";
import session from "./session.js";

var nav = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/

		route.view = new Ractive( {
			el: options.target,
			template: template,

			gotoProduct: function ( ) {
				journey.goto( '/product/2' );
			},

			gotoProductWithData: function ( index ) {

				var data = { 'producsts': [ 'bed', 'chair', 'couch' ] };
				session.data = data;
				journey.goto( '/product/2?index=' + index );
			}
		} );

	},

	leave: function ( route, nextRoute ) {
		route.view.teardown();
	}
};

export default nav;
