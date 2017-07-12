import journey from 'lib/journey/journey.js';
import fade from "lib/fade.js";
import slide from "lib/slide.js";
import Ractive from "Ractive.js";

let config = {
	el: '#container'
}


Ractive.defaults.data = { 'journey': journey };

Ractive.transitions = {
	fade,
	slide
};

export default config;