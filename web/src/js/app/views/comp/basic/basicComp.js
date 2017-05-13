import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./basicComp.html";

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

	var component = Ractive.extend( {
		template: '<div on-click="@.activate()" class="comp" style="cursor: pointer">{{message}}</div>',

		activate () {
			// We reference the parent ractive instance through "comp.parent" and set the parent data variables, hidden and feedback
			this.root.set( "hidden", false );
			this.root.set( "feedback", "Component clicked!" );
		}
	} );

	var view = new Ractive( {
		el: options.target,
		template: template,
		data: { hidden: true },

		// We register our component as "simple"
		components: {
			simple: component
		}
	} );
	
	//view.attachChild(component, {target: "simple"});

	return view;
}

export default basicComp;
