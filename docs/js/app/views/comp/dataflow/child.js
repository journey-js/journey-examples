import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./child.html";

var child = Ractive.extend( {
	template: template,
	onrender: function () {

		// rowAdded and rowRemoved are public events that subscribers can listen to,
		// even the child component itself
	},

	// Here we subscribe to the remove event
	removeRow: function ( ctx, id, index ) {
		var row = this.get( 'rows' )[index];
		// The component can listen on the public remove event
		console.log( '[component] removeRow invoked with arguments: [id: ', id, '], [index: ', index, ']' );
		this.splice( "rows", index, 1 );
		this.fire( "rowRemoved", row );
	},

	// Unlike subscribing to the remove event, we declare an 'add' method
	// for the template to call and then 'fire' the public.addRow event
	addRow: function ( row ) {
		console.log( "[component] addRow(row) method invoked wih arguments:", row );
		this.push( "rows", row );
		console.log( "[component] firing 'rowAdded' event for subscribers, with arguments:", row );
		// Fire event for listeners to act upon
		this.fire( "rowAdded", row );
	}
} );

export default child;
