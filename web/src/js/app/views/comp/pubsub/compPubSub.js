import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./compPubSub.html";
import gridComponent from "./grid.js";

var compPubSub = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = createView( options );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};


function createView(options) {

	var view = new Ractive( {
		el: options.target,
		template: template,
		components: {
			grid: gridComponent
		},
		handleAdd: function ( row ) {
			// handleAddRow is called from the template as: on-public.add="handleAdd($1)
			// $1 is a mapping to the first argument that the grid component 'public.add' event passed along
			// Other arguments would be mapped as $2, $3 or all with (...arguments)
			console.log( "[parent] <grid on-public.add=\"handleAddRow($1)\>: invoked with arguments:", row );

			// If we want to invoke API on the grid, we can get a reference to the
			// component as follows:
			var comp = this.findComponent( "grid" );
		}
	} );

	// Subscribe to the public.remove event fired by the Grid component, note we use the 'grid.' namespace to
	// listen to the public.remove event of the grid component
	view.on( "grid.public.remove", function ( ctx, id, index ) {
		console.log( "[parent] on('grid.public.remove') invoked with arguments, id:", id, "index:", index );
	} );

	// We can also subsribe to all public.remove events from all components using the '*.' notation.
	view.on( "*.public.remove", function ( ctx, id, index ) {
		console.log( "[parent] on('*.public.remove') invoked with arguments:, id:", id, "index:", index );
	} );


	return view;
}

export default compPubSub;
