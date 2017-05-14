import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./multipleComp.html";

var multipleComp = {

	enter: function ( route, prevRoute, options ) {
		

		route.view = createView( options );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView( options ) {

	var compA = new Ractive( {
		template: '<div class="comp">I am component A</div>'
	} );

	var compB = new Ractive( {
		template: '<div class="comp compB">I am component B</div>'
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

export default multipleComp;