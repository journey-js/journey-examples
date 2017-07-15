import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./parent.html";
import childComp from "./child.js";
var parent = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = createView( options );
	},
	leave: function ( route, nextRoute, options ) {
		route.view.teardown( );
	}
};
function createView( options ) {

	var view = new Ractive( {

		el: options.target,
		template: template,
		data: createData(),

		components: {
			child: childComp
		},

		addPerson( person ) {
			this.push( "persons", person );
		},

		// Subscribe to the removePerson event fired by the child component, note we use the 'child.' namespace to
		// listen to the public.remove event of the child component
		on: { 'child.removePerson': function ( ctx, person, index ) {

				// Remove the person from the persons array
				this.splice( "persons", index, 1 );

				// Our child component is managed (created) by the parent, so we do not have a reference to the child.
				// We can get a reference through the findComponent method:
				let child = this.findComponent( "child" );
			}
		},
	} );

	return view;
}

function createData() {
	let data = {
		persons: [
			{ name: "Jeff", age: 20, id: 11 },
			{ name: "Steve", age: 30, id: 12 },
			{ name: "James", age: 40, id: 13 },
			{ name: "Henry", age: 50, id: 14 }
		]
	}

	return data;
}

export default parent;
