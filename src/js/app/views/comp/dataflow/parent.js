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
		route.view.teardown();
	}
};

let data = {};
data.rows = [
		{ name: "Bob", age: 20, id: 11 },
		{ name: "Steve", age: 30, id: 12 },
		{ name: "James", age: 40, id: 13 },
		{ name: "Henry", age: 50, id: 14 }
	];
	
function createView(options) {

	var view = new Ractive( {
		el: options.target,
		template: template,
		data,
		components: {
			child: childComp
		},
		handleAdd: function ( row ) {
			// handleAddRow is called from the template as: on-public.add="handleAdd($1)
			// $1 is a mapping to the first argument that the child component 'public.add' event passed along
			// Other arguments would be mapped as $2, $3 or all with (...arguments)
			console.log( "[in parent] <child on-rowAdded=\"handleAddRow($1)\>: invoked with arguments:", row );

			// Our child component is managed (created) by the parent, so we do not have a reference to the child.
			// We can get a reference through the findComponent method:
			let child = this.findComponent( "child" );
		}
	} );

	// Subscribe to the rowRemoved event fired by the child component, note we use the 'child.' namespace to
	// listen to the public.remove event of the child component
	view.on( "child.rowRemoved", function ( ctx, id, index ) {
		console.log( "[in parent] on('child.rowRemoved') invoked with arguments, id:", id, "index:", index );
	} );

	// We can also subsribe to all remove events from all components using the '*.' notation.
	view.on( "*.rowRemoved", function ( ctx, id, index ) {
		console.log( "[in parent] on('*.remove') invoked with arguments:, id:", id, "index:", index );
	} );


	return view;
}

export default parent;
