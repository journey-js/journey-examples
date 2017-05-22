import journey from "lib/journey/journey.js";
import template from "./sortable.html";
import Ractive from "Ractive.js";
import "lib/ractive-decorators-sortable.js";

var sortable = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = new Ractive( {
			el: options.target,
			template: template,
			data: {
				list: [
					{ name: 'Firefox', icon: 'firefox_64x64.png' },
					{ name: 'Chrome', icon: 'chrome_64x64.png' },
					{ name: 'Safari', icon: 'safari_64x64.png' },
					{ name: 'Opera', icon: 'opera_64x64.png' },
					{ name: 'Maxthon', icon: 'maxthon_64x64.png' },
					{ name: 'Internet Explorer', icon: 'ie10_64x64.png' }
				]
			}
		} );
	},
	leave: function ( route, nextRoute ) {
		route.view.teardown( );
	}
};
export default sortable;
