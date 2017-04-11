import journey from "lib/journey/journey";
import "lib/pace";
import template from "./menu.html";
import Ractive from "lib/ractive";
//import sidePanel from "app/panel/side-panel/sidePanel";
//import ctrlEvents from "app/views/lifecycle/ctrl-events/ctrl-events";

let sidePanelObj;

var menu = {

	init: function ( options ) {

		// Create menu view instance
		new Ractive( {
			el: options.target,

			template: template,

			gotoCtrlEvents: function () {
				journey.goto( "ctrlEvents" );
				return false;
			},

			showJavascript: function ( routeName ) {
				/*
				 sidePanelObj.show( {
				 ext: "js"
				 } );*/
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
		/*
		 sidePanelObj = sidePanel( {
		 el: '#side-panel'
		 } );*/

		// Add highlight to menu
		highlightActiveMenu();

		Pace.stop();
	}
};

function highlightActiveMenu() {
	$( ".nav a" ).on( "click", function () {
		var $el = $( this );

		var navId = $el.attr( "id" );

		// Don't highlight showJavascript and showHtml menu items since they trigger a slide panel, not an actual new view
		if ( navId === "showJs" || navId === "showHtml" ) {
			return;
		}

		// If we click on dropdown do not change to active
		if ( $el.parent().hasClass( "dropdown" ) ) {
			return;
		}
		$( ".nav" ).find( ".active" ).removeClass( "active" );
		$( this ).parent().addClass( "active" );
		$( '.active' ).closest( 'li.dropdown' ).addClass( 'active' );
	} );
}

export default menu;
