import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./upload.html";
import feedback from '../../../comp/feedback/feedback.js';

let config;

let view;

var upload = {

	enter: function ( route, prevRoute, options ) {
		config = options;
		/*%injectPath%*/

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
		template: template,
		submit: function ( ) {
			submitForm();
			return false;
		},

		resetData: function () {
			feedback.clear();
		}
	} );

	return view;
}

function submitForm( ) {

	let files = $( "#file" )[0].files;
	if ( files.length === 0 ) {
		feedback.clear().setError( "Please select a file" );
		return;
	}
	feedback.clear().setInfo( "Busy uploading..." );

	let file = files[0];

	// Simulate a large upload
	performUpload( file );
}

function performUpload( file ) {

	let data = new FormData();
	data.append( 0, file );

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
		feedback.clear().setSuccess( "Successfully uploaded file: " + file.name );

	} ).catch( ( jqXHR, textStatus, errorThrown ) => {
		feedback.clear().setError( "Error: could not upload file: " + file.name, jqXHR );
	} );
}

export default upload;