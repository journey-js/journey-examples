import template from  "./not-found";
import Ractive from "lib/ractive";

var notFound = {

	enter: function (route, prevRoute, options) {
		/*%injectPath%*/
		
		route.view = new Ractive({
			el: options.target,
			template: template
		});
		
		
	},
	
	leave: function (route, nextRoute, options) {
		route.view.teardown();
	}
};
export default notFound;

