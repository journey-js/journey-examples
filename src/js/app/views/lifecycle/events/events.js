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
};

function startListening() {

	journey.on( events.BEFORE_LEAVE, function ( e ) {
		console.log( "onBeforeleave", e, e.options.hasHandler );
	} );

	journey.on( events.BEFORE_LEAVE_COMPLETE, function ( e ) {
		console.log( "onBeforeleaveComplete", e, e.options.hasHandler );
	} );

	journey.on( events.BEFORE_ENTER, function ( e ) {
		console.log( "onBeforeenter", e, e.options.hasHandler );
	} );

	journey.on( events.BEFORE_ENTER_COMPLETE, function ( e ) {
		console.log( "onBeforeenterComplete", e, e.options.hasHandler );
	} );

	journey.on( events.ENTER, function ( e ) {
		console.log( "onEnter:", e, e.options.hasHandler );
	} );

	journey.on( events.ENTERED, function ( e ) {
		console.log( "onEntered", e, e.options.hasHandler );
	} );

	journey.on( events.UPDATE, function ( e ) {
		console.log( "onUpdate", e, e.options.hasHandler );
	} );

	journey.on( events.UPDATED, function ( e ) {
		console.log( "onUpdated", e, e.options.hasHandler );
	} );

	journey.on( events.LEAVE, function ( e ) {
		console.log( "onLeave", e, e.options.hasHandler );
	} );

	journey.on( events.LEFT, function ( e ) {
		console.log( "onLeft", e, e.options.hasHandler );
	} );

	journey.on( events.ERROR, function ( e ) {
		console.log( "onError", e, e.options.hasHandler );
	} );
}

function stopListening() {
	journey.off( events.BEFORE_LEAVE );
	journey.off( events.BEFORE_LEAVE_COMPLETE );
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