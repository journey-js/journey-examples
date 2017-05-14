import journey from "lib/journey/journey.js";
import {events} from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./ractiveEvents.html";

let listening = false;

let view;

var ractiveEvents = {

	enter: function ( route, prevRoute, options ) {
		

		// example of a Ractive instance events (oninit and onrender)
		view = route.view = new Ractive( {
			template: template,
			el: options.target,
			data: {"type": listening},

			toggleListeners: function () {
				view.toggle("type");
				listening = view.get("type");
				listening ? startListening() : stopListening();
			},

			reloadView: function () {
				journey.goto( "/ractiveEvents", { forceReload: true } );
			},

			onrender: function() {
				Prism.highlightAll();
			}
		} );
	},

	leave: function ( route, nextRoute, options ) {
		return route.view.teardown();
	}
};

function startListening() {

	journey.on( events.BEFORE_ENTER, function ( options ) {
		console.log( "onBeforeenter", options );
	} );

	journey.on( events.BEFORE_ENTER_COMPLETE, function ( options ) {
		console.log( "onBeforeenterComplete", options );
	} );

	journey.on( events.ENTER, function ( options ) {
		console.log( "onEnter:", options );
	} );

	journey.on( events.ENTERED, function ( options ) {
		console.log( "onEntered", options );
	} );

	journey.on( events.UPDATE, function ( options ) {
		console.log( "onUpdate", options );
	} );

	journey.on( events.UPDATED, function ( options ) {
		console.log( "onUpdated", options );
	} );

	journey.on( events.LEAVE, function ( options ) {
		console.log( "onLeave", options );
	} );

	journey.on( events.LEFT, function ( options ) {
		console.log( "onLeft", options );
	} );

	journey.on( events.ERROR, function ( options ) {
		console.log( "onError", options );
	} );
}

function stopListening() {
	journey.off( events.BEFORE_ENTER );
	journey.off( events.BEFORE_ENTER_COMLETE );
	journey.off( events.ENTER );
	journey.off( events.ENTERED );
	journey.off( events.UPDATE );
	journey.off( events.UPDATED );
	journey.off( events.LEAVE );
	journey.off( events.LEFT );
	journey.off( events.ERROR );
}


export default ractiveEvents;