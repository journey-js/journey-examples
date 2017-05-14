import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./upload.html";

let config;

let view;

var upload = {

	enter: function ( route, prevRoute, options ) {
		config = options;
		

		route.view = createView( route.data );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown( );
	}
};

function createView( json ) {

	// Convert the JSON data objectr to a string representation
	view = new Ractive( {
		el: config.target,
		data: { response: json, msg: "Upload a file" },
		template: template,
		submit: function ( ) {
			submitForm();
			return false;
		}
	} );

	return view;
}

function submitForm( ) {
	view.set("display", false);
	view.set("msg", "Busy uploading...");

	let files = $( "#file" )[0].files;
	if (files.length === 0) {
		view.set("msg", "Please select a file");
		return;
	}

	let data = new FormData();

	$.each( files, function ( key, value ) {
		data.append( key, value );
	} );

	let promise = $.ajax( {
		url: 'data/submitForm?delay=2000',
		type: 'POST',
		data: data,
		cache: false,
		dataType: 'json',
		processData: false, // Don't process the files
		contentType: false // Set content type to false as jQuery will tell the server its a query string request
	} );

	promise.then( ( data, textStatus, jqXHR ) => {
		view.set("display", true);
		view.set("response", data.msg);

	} ).catch( ( jqXHR, textStatus, errorThrown ) => {
		view.set("display", true);
		view.set("response", errorThrown);
	} );
}

export default upload;