import journey from "lib/journey/journey.js";
import events from "lib/journey/event/events";
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
	
	update: function ( route, options ) {
		// noop, just for demo purposes so that the onupdate events are fired
		console.log(route);
	},

	leave: function ( route, nextRoute, options ) {
		return route.view.teardown();
	},
};

function startListening() {

	journey.on( events.BEFORE_LEAVE, function ( event ) {
		console.log( "onBeforeleave", event, event.options.hasHandler );
	} );

	journey.on( events.BEFORE_LEAVE_COMPLETE, function ( event ) {
		console.log( "onBeforeleaveComplete", event, event.options.hasHandler );
	} );

	journey.on( events.BEFORE_ENTER, function ( event ) {
		console.log( "onBeforeenter", event, event.options.hasHandler );
	} );

	journey.on( events.BEFORE_ENTER_COMPLETE, function ( event ) {
		console.log( "onBeforeenterComplete", event, event.options.hasHandler );
	} );

	journey.on( events.ENTER, function ( event ) {
		console.log( "onEnter:", event, event.options.hasHandler );
	} );

	journey.on( events.ENTERED, function ( event ) {
		console.log( "onEntered", event, event.options.hasHandler );
	} );

	journey.on( events.UPDATE, function ( event ) {
		console.log( "onUpdate", event, event.options.hasHandler );
	} );

	journey.on( events.UPDATED, function ( event ) {
		console.log( "onUpdated", event, event.options.hasHandler );
	} );

	journey.on( events.LEAVE, function ( event ) {
		console.log( "onLeave", event, event.options.hasHandler );
	} );

	journey.on( events.LEFT, function ( event ) {
		console.log( "onLeft", event, event.options.hasHandler );
	} );
	
	journey.on( events.TRANSITION_ABORTED, function ( event ) {
		console.log( "onTransitionAborted", event );
	} );

	journey.on( events.ERROR, function ( event ) {
		console.log( "onError", event, event.error );
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
	journey.off( events.TRANSITION_ABORTED );
	journey.off( events.ERROR );
}


export default lifecycleEvents;