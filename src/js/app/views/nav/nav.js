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
			gotoNewView: function () {

				var args = { 'myArray': [ 'one', 'two', 'three' ] };
				session.navArgs =  args;
				journey.goto( "/navTargetParams/1?name=Bob" );
			}
		} );

	},

	leave: function ( route, nextRoute ) {
		route.view.teardown();
	}
};

function createView() {

	var view = new template( {
		data: {
			example1: "js/app/views/nav/nav1-example.js",
			example2: ""
		},
		gotoTargetWithParams: function ( routeName ) {
			// Navigate to the route specified
			var params = { 'id': 1, 'name': 'Bob' };
			var args = { 'myargs': [ 'one', 'two', 'three' ] };
			kudu.go( { ctrl: navTargetWithParams, routeParams: params, args: args } );

			// Cancel the click event by returning false, otherwise the link function would execute ie. follow the link href
			return false;
		}
	} );

	return view;
}

export default nav;