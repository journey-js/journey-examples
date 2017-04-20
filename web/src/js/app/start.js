import journey from 'lib/journey/journey.js';
import Ractive from 'lib/ractive.js';
import fade from "lib/fade.js";
import 'lib/prism.js';
import "./config/routes.js";
import menu from "./menu/menu.js";
import "lib/bootstrap.js";
import "./animationMonitor.js";

menu.init( { target: "#menu" } );

if (location.pathname == "/"  || location.pathname == "") {
	history.replaceState(null, null, "/home"); // change url to /home as a default
}

Ractive.transitions = {
	fade
};


journey.on( "entered", function ( options ) {
	Prism.highlightAll();
} );


journey.start( {
	target: "#container",
	debug: Ractive.DEBUG = true,
	fallback: '/notFound'
} );
