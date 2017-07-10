import Ractive from "Ractive.js";
import config from '../config/config.js';
import template from './base.html';

let base = Ractive.extend({
	target: config.el,
	template: template
});

export default base;