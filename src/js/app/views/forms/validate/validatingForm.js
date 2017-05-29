import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./validatingForm.html";
import "lib/parsley.js";

let parsley;

var validatingForm = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = new Ractive( {
			el: options.target,
			template: template,
			
			oncomplete: function() {
				console.log("FORM: oncomplete!")
				setupParsley();
			},
			
			onteardown: function() {
				console.log("FORM: onteardown!")
			},
			
			ondestruct: function() {
				console.log("FORM: ondestruct!")
			},

			submit: function () {
				var valid = parsley.validate();
				return false;
			},
			resetData: function () {
				$( '.bs-callout-info' ).addClass( 'hidden' );
				$( '.bs-callout-warning' ).addClass( 'hidden' );
			}
		} );


	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

export default validatingForm


//
//define( function ( require ) {
//var $ = require( "jquery" );
//		var kudu = require( "kudu" );
//		var parsley = require( "parsley" );
//		var template = require( "rvc!./validating-form" );
//		function ValidatingForm( ) {
//
//		var that = {};
//				var parsley;
//				/*
//				 that.onInit = function (options) {
//				 var view = createView();
//				 return view;
//				 };
//				 
//				 that.onRender = function (options) {
//				 parsley = $('form').parsley({
//				 /*
//				 // This comment shows how to use bootstrap's error highlighting
//				 }
//				 successClass: "has-success",
//				 errorClass: "has-error",
//				 classHandler: function (field) {
//				 return field.$element.closest(".form-group");
//				 },
//				 errorsWrapper: "<span class='help-block parsley-errors-list'></span>",
//				 errorTemplate: "<span></span>"
//				 */
//		} );
//		parsley.on( 'form:validated', function ( form ) {
//
//		// If you want all fields automatically tracked for errors after form submission, uncomment line below
//		//setFieldsInvalid(form);
//		showFormValidationFeedback( form );
//		} );
//		parsley.on( 'field:validated', function ( field ) {
//		showFormValidationFeedback( field.parent );
//		} );
//}; 
//		
		function setupParsley( ) {
		parsley = $( 'form' ).parsley( {
		/*
		 // This comment shows how to use bootstrap's error highlighting
		 }
		 successClass: "has-success",
		 errorClass: "has-error",
		 classHandler: function (field) {
		 return field.$element.closest(".form-group");
		 },
		 errorsWrapper: "<span class='help-block parsley-errors-list'></span>",
		 errorTemplate: "<span></span>"
		 */
		} );
				parsley.on( 'form:validated', function ( form ) {

				// If you want all fields automatically tracked for errors after form submission, uncomment line below
				//setFieldsInvalid(form);
				showFormValidationFeedback( form );
				} );
				parsley.on( 'field:validated', function ( field ) {
				showFormValidationFeedback( field.parent );
				} );
		}

function setFieldsInvalid( form ) {
for ( var n = 0; n < form.fields.length; n++ ) {
var field = form.fields[n];
		ParsleyUI.manageFailingFieldTrigger( field );
}
}

function showFormValidationFeedback( form ) {
var ok = form.isValid( );
		$( '.bs-callout-info' ).toggleClass( 'hidden', !ok );
		$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
}
