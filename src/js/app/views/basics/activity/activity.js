import journey from "lib/journey/journey";
import template from "./activity.html";
import Ractive from "Ractive.js";
import feedback from "app/comp/feedback/feedback.js";

import master from './master/master.js';
import detail from './detail/detail.js';
import filter from './filter/filter.js';
import shop from './shop/shop.js';
import data from "./data.js";
import upload from './upload/upload.js';

var basic = {

	enter: function ( route, prevRoute, options ) {
		/*%injectPath%*/
		route.view = createView( options );
		route.detail = detail.start();
		route.master = master.start(route.detail);
		route.filter = filter.start();
		route.shop = shop.start();
		route.upload = upload.start(route.detail);
		
		route.detail.setShop(route.shop);
		route.shop.setDetail(route.detail);
		
		route.master.set('activities', data.activities);
		
	},

	leave: function ( route, nextRoute, options ) {
		return route.view.teardown();
	}
};

function createView( options ) {
	let view = new Ractive( {

		el: options.target,

		template: template
	} );
	return view;
}

export default basic;
