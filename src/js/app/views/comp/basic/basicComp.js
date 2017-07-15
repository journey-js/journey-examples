import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./basicComp.html";
import compTemplate from "./comp.html";

var basicComp = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = createView( options );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView( options ) {

	var component = createComponent();

	var view = new Ractive( {
		el: options.target,
		template: template,
		data: { hidden: true },

		// We register our component under the name "simple"
		components: {
			simple: component
		}
	} );
	return view;
}

function createComponent() {
	let comp = Ractive.extend( {
		template: compTemplate,

		activate() {
			this.set( "hidden", false );
			this.set( "feedback", "Component clicked!" );
		},
		data: {
			// A default message if none is provided
			message: 'No message specified, using the default'
		}
	} );
	return comp;
}

export default basicComp;
