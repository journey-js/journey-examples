import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./basicForm.html";

var basicForm = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = new Ractive( {

			el: options.target,

			template: template,

			data: {
				
				form: {
					contactMe: true					
				}
			},

			submit: function () {
				this.set("submitted", true);
				
				let formValues = this.get( 'form' );
				let filename = this.get( 'form.file[0].name' );
				formValues.filename= filename;
				delete formValues.file; // we don't want to render the file detail
				
				let values = JSON.stringify(formValues, null, 2);
				this.set("values", values);
				return false;
			},

			resetData: function () {
				this.set("submitted", false);
			}
		} );
	},

	leave: function ( route, nextRoute, options ) {
		route.view.teardown();
	}
};

export default basicForm
