define( function ( require ) {
	var $ = require( "jquery" );
	var kudu = require( "kudu" );
	var template = require( "rvc!./ajax-events" );

	function ajaxEvents() {

		var that = { };

		that.onInit = function ( options ) {

			unregisterEvents();
			registerEvents();

			var promise = new Promise( function ( resolve, reject ) {

				// We load the json data through an Ajax request
				var xhr = $.getJSON( "data/hello.json?delay=2000" );


				options.ajaxTracker.add( xhr );

				xhr.then( function ( data ) {

					// Here we have the data and pass it to the createView method to render
					var view = createView( data );

					// Everything is good, so we resolve the promise, passing in the view
					resolve( view );
					
					setTimeout(function() {
						unregisterEvents();
					});
					
				}, function () {
					// Oops, something went wrong, so we reject the promise
					reject( "Could not load data for AjaxEvents" );
					
					setTimeout(function() {
						unregisterEvents();
					});
				} );
			} );

			return promise;
		};

		function createView( data ) {

			var view = new template();

			// Convert the JSON data objectr to a string representation
			var json = JSON.stringify( data );

			// Set the json data object to render
			view.set( "response", json );

			view.reload = function () {
				kudu.go( { ctrl: ajaxEvents } );
			};
			return view;
		}

		function unregisterEvents() {
			console.log( "unregistered" );
			kudu.off( "global.ajax.start", globalAjaxStart );
			kudu.off( "ajax.start", ajaxStart );
			kudu.off( "ajax.success", ajaxSuccess );
			kudu.off( "ajax.error", ajaxError );
			kudu.off( "ajax.complete", ajaxComplete );
			kudu.off( "ajax.stop", ajaxStop );
			kudu.off( "global.ajax.stop", globalAjaxStop );
		}

		function registerEvents() {
			console.log( "registered" );
			kudu.on( "global.ajax.start", globalAjaxStart );
			kudu.on( "ajax.start", ajaxStart );
			kudu.on( "ajax.success", ajaxSuccess );
			kudu.on( "ajax.error", ajaxError );
			kudu.on( "ajax.complete", ajaxComplete );
			kudu.on( "ajax.stop", ajaxStop );
			kudu.on( "global.ajax.stop", globalAjaxStop );
		}

		return that;
	}

	function globalAjaxStop( options ) {
		console.log( "global.ajax.stop", options );
	}

	function ajaxStop( options ) {
		console.log( "ajax.stop", options );
	}

	function ajaxComplete( options ) {
		console.log( "ajax.complete", options );
	}

	function ajaxError( options ) {
		console.log( "ajax.error", options );
	}

	function ajaxSuccess( options ) {
		console.log( "ajax.success", options );
	}

	function ajaxStart( options ) {
		console.log( "ajax.start", options );
	}

	function globalAjaxStart( options ) {
		console.log( "global.ajax.start", options );
	}

	return ajaxEvents;
} );
