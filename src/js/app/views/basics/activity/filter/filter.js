import template from "./filter.html";
import Ractive from "Ractive.js";
import feedback from "app/comp/feedback/feedback.js";

let filter = {

	start() {

		var filter = new Ractive( {
			el: '#rc-av-filter',
			template: template
		} );
		return filter;
	}
};

export default filter;
