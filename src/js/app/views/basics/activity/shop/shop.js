import template from "./shop.html";
import Ractive from "Ractive.js";
import feedback from "app/comp/feedback/feedback.js";

let detail;

let shop = {

	start() {
		return createShop();

		function createShop() {
			var shop = new Ractive( {
				el: '#rc-av-shop',
				template: template,
				data: {downloads: true},

				setDetail( arg ) {
					detail = arg;
				},

				downloads() {
					this.toggle("downloads");
					detail.makeDraggable();
					detail.makeShopDroppable();
					return false;

				},

				setActivity( newActivity ) {
					shop.set( "activity", newActivity );
				}
			} );
			return shop;
		}

		return shop;
	}
};

export default shop;
