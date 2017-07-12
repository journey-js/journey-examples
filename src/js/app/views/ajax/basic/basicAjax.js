import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./basicAjax.html";
import feedback from '../../../comp/feedback/feedback.js';
import utils from 'app/utils/utils.js';

let config;

//let rejectRequest = false;

let ajaxOptions = { throwError: false };

var basicAjax = {

	beforeenter: function ( route, prevRoute, options ) {

		let promise = $.ajax( {
			url: 'data/hello.json?delay=2000&reject=' + ajaxOptions.throwError
					// global: false // set global: false to override default error handling defined in start.js
		} );

		promise.then( function ( response ) {
			if ( ajaxOptions.throwError ) {
				throw new Error( 'this is an error' );
			}
			feedback.setSuccess( "Data loaded successfully" );
			route.data = JSON.stringify( response );

		} ).catch( ( jqXHR, textStatus, errorThrown ) => {
			feedback.setError( "Error: could not fetch data for BasicAjax", jqXHR );
		} );

		return promise;
	},

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		config = options;

		route.view = createView( route.data );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown( );
	}
};

function createView( json ) {

	// Convert the JSON data object to a string representation
	var view = new Ractive( {
		el: config.target,
		data: { response: json, ajaxOptions: ajaxOptions },
		template: template,
		reload: function ( ) {
			journey.goto( "/basicAjax", { forceReload: true } );
		}
	} );

	return view;
}

export default basicAjax;