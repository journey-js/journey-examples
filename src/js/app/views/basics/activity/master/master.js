import template from "./master.html";
import Ractive from "Ractive.js";
import feedback from "app/comp/feedback/feedback.js";
let master = {

	start( detail ) {

		var master = new Ractive( {
			el: '#rc-av-master',
			template: template,
			selectActivity( newActivity ) {
				let currentActivity = detail.get( "activity" );
				if ( currentActivity ) {
					currentActivity.rowactive = false;
				}

				detail.setActivity( newActivity );
				newActivity.rowactive = true;
				this.update( );
				console.log( this )
			},
			observe: {
				'activities': {
					handler( value ) {
						detail.makeMasterDroppable( );
					},
					defer: true,
					init: false
				}
			}
		} );
		let el = $( '#droptarget' );
		//var sortable = Sortable.create( el, { group: {name: 'test', pull: false} });
		/*
		 interact( '.dropzone' ).dropzone( {
		 // only accept elements matching this CSS selector
		 accept: '.draggable',
		 // Require a 75% element overlap for a drop to be possible
		 overlap: 0.5,
		 ondragenter: function ( event ) {
		 console.log("ondragenter", event)
		 },
		 ondrop: function ( event ) {
		 console.log( "ondrop", event );
		 },
		 } );*/


		return master;
	}
};
export default master;
