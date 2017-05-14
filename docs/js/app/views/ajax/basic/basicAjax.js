import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./basicAjax.html";

let config;

let rejectRequest = false;

var basicAjax = {
	
	beforeenter: function ( route, prevRoute, options ) {
		// Return promise for beforeenter
		return $.getJSON( "data/hello.json?delay=2000&reject=" + rejectRequest ).then( function ( response ) {
			return route.data = JSON.stringify( response );

		} ).catch( ( err ) => {
			return route.data = "Could not load data for BasicAjax: [" + err.status + ":" + err.statusText + "]";
		} );
	},

	enter: function ( route, prevRoute, options ) {
		
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
		data: { response: json },
		template: template,
		reload: function ( ) {
			journey.go( "/basicAjax", {forceReload: true} );
		}
	} );

	return view;
}

export default basicAjax;