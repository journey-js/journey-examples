import journey from "lib/journey/journey.js";
import "lib/pace.js";
import template from "./menu.html";
import Ractive from "lib/ractive.js";
import sidePanel from "../panel/side-panel/sidePanel.js";
import menuSlider from "./menuSlider.js";

let sidePanelObj;

var menu = {

	init: function ( options ) {

		// Create menu view instance
		new Ractive( {
			el: options.target,

			template: template,

			gotoEvents: function ( e ) {
				journey.goto( "/events" );
				e.preventDefault();
			},

			showJavascript: function ( routeName ) {

				sidePanelObj.show( {
					ext: "js"
				} );
				// Cancel the click event by returning false, otherwise the link function would execute ie. follow the link href
				return false;
			},

			showHtml: function ( routeName ) {
				sidePanelObj.show( {
					ext: "html"

				} );
				// Cancel the click event by returning false, otherwise the link function would execute ie. follow the link href
				return false;
			}
		} );

		// Create sidePanel instance

		sidePanelObj = sidePanel( '#side-panel' );

		// Add highlighting slider to menu
		menuSlider.init( { fallbackMenu: options.fallbackMenu } );

		Pace.stop();

		journey.on( "entered", () => {
			Pace.stop();
		} );
	},

	updateSlider: selector => {
		let $li = $( selector );
		menuSlider.updateSlider( $li );
	}
};

export default menu;
