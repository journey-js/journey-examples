import journey from "lib/journey/journey.js";
import events from "lib/journey/utils/events";
import Ractive from "Ractive.js";
import template from "./events.html";

let isListening = false;

let view;

var lifecycleEvents = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/

		// example of a Ractive instance events (oninit and onrender)
		view = route.view = new Ractive( {
			template: template,
			el: options.target,
			journey: journey,

			data: { isListening: isListening },

			updateView: function () {
				var random = Math.random() * 1000;
				journey.goto( "/events?random=" + random );
			},

			onrender: function () {
				// apply code highlighting as soon as DOM is ready, before animation finish
				Prism.highlightAll();
			}
		} );


		route.view.observe( "isListening", function ( newValue, oldValue, keypath ) {
			isListening = newValue;
			isListening ? startListening() : stopListening();
		}, { init: false } );
	},

	leave: function ( route, nextRoute, options ) {
		return route.view.teardown();
	},

	beforeenter: function ( route, prevRoute, options ) {
		// Noop method for demo purposes
	},

	update: function ( route, options ) {
		// Noop method for demo purposes
		console.log("View updated with :", route.query);
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


export default lifecycleEvents;