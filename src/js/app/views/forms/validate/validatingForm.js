import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./validatingForm.html";
import "lib/parsley.js";

let view;

let parsley;

var validatingForm = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		view  = new Ractive( {
			el: options.target,
			template: template,
			data: { validationFail: false, validationSuccess: false, doSlide: true },

			onrender: function () {
				setupParsley();
			},

			submit: function () {
				
				var valid = parsley.validate();
				return false;
			},
			resetData: function () {
				//$( '.bs-callout-info' ).addClass( 'hidden' );
				//$( '.bs-callout-warning' ).addClass( 'hidden' );
				view.set('doSlide', true)
				view.set('validationFail', false);
				view.set('validationSuccess', false);
			}
		} );


	},

	leave: function ( route, nextRoute, options ) {
		view.teardown();
	}
};

function setupParsley( ) {
	parsley = $( 'form' ).parsley( {
		// Uncomment below to start validating when input blurs
		//trigger: 'blur',
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
		view.set('doSlide', false);
	} );
	parsley.on( 'field:validated', function ( field ) {
		showFormValidationFeedback( field.parent );
	} );
}

function setFieldsInvalid( form ) {
	for ( var n = 0; n < form.fields.length; n ++ ) {
		var field = form.fields[n];
		ParsleyUI.manageFailingFieldTrigger( field );
	}
}

function showFormValidationFeedback( form ) {
	var ok = form.isValid( );

	view.set('validationFail', !ok);
	view.set('validationSuccess', ok);
	//$( '.bs-callout-info' ).toggleClass( 'hidden', ! ok );
	//$( '.bs-callout-warning' ).toggleClass( 'hidden', ok );
}

export default validatingForm;