import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./basicComp.html";

var dynamic = {

	enter: function ( route, prevRoute, options ) {
		
		route.view = createView(options);
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView(options) {

	var componentA = Ractive.extend( {
		template: '<div on-click="activate()" class="comp">{{message}}</div>',
		activate: function () {
			alert( "Active Component A!" );
		}
	} );
	
	var componentB = Ractive.extend( {
		template: '<div on-click="activate()" class="comp">{{message}}</div>',
		activate: function () {
			alert( "Active Component B!" );
		}
	} );
	
	componentA = new componentA();
	componentB = new componentB();

	var view = new Ractive( {
		el: options.target,
		template: template,

		// We register our component as "simple"
//		components: {
//			simple: component
//		}
	} );
	
	view.attachChild(componentA, {target: "simple"});

	return view;
}

export default dynamic;
