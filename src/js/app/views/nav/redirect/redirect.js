import journey from "lib/journey/journey";
import Ractive from "Ractive.js";
import template from "./redirect.html";

var redirect = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		console.log("redirect.enter() from: ", prevRoute.pathname, " to:", route.pathname);

		if ( route.query.typeId == null ) {

			// if typeId is missing from query parameters, route users to the '/invalid' page.
			// It we don't want the URL to change to '/invalid', we can pass the 'invisible' property to goto()
			// Navigating to a new route during the enter phase of another route, would cause Journey to emit
			// 'routeAbuseStart' event because it detects the user is changing routes too quickly. However in this
			// case the user is not abusing routes, she is simply redirecting. By passing the property 'redirect'
			// Journey is notified this is a redirect and should not raise the 'routeAbuseStart' event.
			console.log("Redirect.enter() GOTO Invalid start")
			journey.goto( "/invalid", { redirect: true, invisible: true });
			console.log("Redirect.enter() GOTO Invalid complete")
			return;

		} else {

			route.view = new Ractive( {
				el: options.target,
				template: template
			} );
		}
	},

	leave: function ( route, nextRoute, options ) {
		console.log("Redirect.leave() from:", route.pathname, " to:", nextRoute.pathname);
		if ( route.view == null ) {
			return;
		}		
		route.view.teardown();
	}
};

export default redirect;
