import journey from "lib/journey/journey.js";
import Ractive from "lib/ractive.js";
import template from "./sidePanel.html";
import 'lib/prism.js';

let panel;

function sidePanel( target ) {

	panel = new Ractive( {

		el: target,

		template: template,

		close: function () {
			var event = this.event.original;
			close( event );
			return false;
		}
	} );

	$( "body" ).off( "click", handleBodyClick );
	$( "body" ).on( "click", handleBodyClick );

	// Public 
	panel.show = function ( options ) {
		show(options);
	};

	return panel;
}

function show( options = {} ) {
	var path = options.path || getUrlPath();
	var ext = options.ext || "";
	panel.set( "visible", true );

	panel.set( "code", path + "." + ext );
	panel.set( "title", path + "." + ext );
	Prism.fileHighlight();
	let $element = $( '.cd-panel-content' );
	//Prism.highlightElement( $element[0] );
}

function close( event ) {
	if ( $( event.target ).is( '.cd-panel' ) || $( event.target ).is( '.cd-panel-close' ) ) {
		panel.set( "visible", false );
	}
}

function getUrlPath() {
	var route = journey.getCurrentRoute();
	return route.path;
}

// Private 
function handleBodyClick( e ) {
	if ( panel.get( "visible" ) === true ) {

		if ( $( e.target ).is( 'a' ) ) {
			panel.set( "visible", false );

			$( ".cd-panel" ).css( "transitionProperty", "none" );
			setTimeout( function () {
				$( ".cd-panel" ).css( "transitionProperty", "all" );
			} );
		}
	}
}

export default sidePanel;