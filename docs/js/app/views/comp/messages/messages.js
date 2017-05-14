import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./messages.html";

var messages = {
	
	enter: function ( route, prevRoute, options ) {
		
		route.view = new Ractive( {
			el: options.target,
			template: template
		} );
	},
	
	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

export default messages;


define( function ( require ) {

	var template = require( "rv!./messages" );

	var velocity = require( "./velocity" );

	var queue = [ ];

	var busy = false;
	
	var view;

	function messages(viewParam) {
		
		var that = { };
		
		view = viewParam;

		that.addMessages = function ( messages ) {
			queue.unshift( messages );
			that.processMessages( queue );
		};

		that.processMessages = function ( queue ) {
			if ( busy ) {

				var errorFields = $( ".error" );
				errorFields.velocity( "finish" );
				velocity.mock = true;
				return;
			}
			busy = true;
			var errors = queue[queue.length - 1];

			view.set( "errors", null ).then( function () {
				//console.log( "MOO", view.get( "errors" ) );
				//var errorFields = $( ".error" );
				//console.log("2 numbner of fields", errorFields.length)
				//errorFields.velocity( "finish" );


				view.set( "errors", errors ).then( function () {
					//console.log( "Done2", errors );
					queue.pop();
					if ( queue.length >= 1 ) {
						busy = false;
						that.processMessages( queue );
					} else {
						setTimeout( function () {
							if ( queue.length === 0 ) {
								velocity.mock = false;
							}
						}, 500 )
						busy = false;
					}
				} );
			} );

		};

		return that;
	}
	return messages;
} );