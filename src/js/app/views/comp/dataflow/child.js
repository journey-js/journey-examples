import journey from "lib/journey/journey.js";
import Ractive from "Ractive.js";
import template from "./child.html";

var child = Ractive.extend( {
	template: template
} );

export default child;
