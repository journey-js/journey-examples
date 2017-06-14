import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./dynamicComp.html";
import compATemplate from "./compA.html";
import compBTemplate from "./compB.html";

var dynamicComp = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/

		route.view = createView( options );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView( options ) {

	var compA = new Ractive( {
		template: compATemplate
	} );

	var compB = new Ractive( {
		template: compBTemplate
	} );

	let components = {
		"compA": compA,
		"compB": compB
	};
	
	let comp;

	var view = new Ractive( {
		el: options.target,
		template: template,

		swap( name ) {

			if (comp) this.detachChild( comp );
			comp = components[name];
			this.attachChild( comp, { target: "components", insertAt: 0 } );
		}
	} );

	return view;
}

export default dynamicComp;