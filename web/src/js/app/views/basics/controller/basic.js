	import journey from "lib/journey/journey";
	import template from "./basic.html";
	import Ractive from "lib/ractive";

	var basic = {
	
		enter: function(route, prevRoute, options) {
			route.view = new Ractive({
				el: options.target,
				template: template,
				loadView: function () {
					var random = new Date().getMilliseconds();
					journey.goto("/basic?random=" + random);
				}
			});
		},
		
		leave: function ( route, nextRoute, options ) {
			return route.view.teardown();
		}
	}
	
	export default basic;
	

