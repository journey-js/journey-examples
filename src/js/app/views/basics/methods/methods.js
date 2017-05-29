import journey from "lib/journey/journey";
import Ractive from "Ractive.js";
import template from "./methods.html";

var methods = {	
	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = createView( options.target );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

function createView( target ) {

	var view = new Ractive( {

		el: target,
		template: template,

		data: {
			items: [
				{ name: 'Item 1' },
				{ name: 'Item 2' },
				{ name: 'Item 3' },
			]
		},

		test: function ( ) {
			console.log( "test() invoked!" );
			return false; //returning false cancels the original event, the link that was clicked
		},

		testThis: function ( ) {
			// 'this' refers to the Ractive instance
			console.log( "testThis invoked!" );
			console.log( "	[ractive instance]:", this );
			// 'this.event' refers to the Ractive event, see: http://docs.ractivejs.org/latest/proxy-events
			console.log( "	[ractive event]:", this.event );
			// 'this.event.original' refers to the DOM event, the link that was clicked
			console.log( "	[DOM 'click' event]:", this.event.original );
			return false;
		},
		testArgs: function ( currentInstance, event, str, bool, obj ) {
			console.log( "arg currentInstance", currentInstance );
			console.log( "arg event", event );
			console.log( "arg str", str );
			console.log( "arg bool", bool );
			console.log( "arg object", obj );
			return false;
		}
	} );
	return view;
}


export default methods;
