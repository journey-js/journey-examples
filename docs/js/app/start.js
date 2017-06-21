import journey from 'lib/journey/journey.js';
import events from "lib/journey/utils/events";
import Ractive from "Ractive.js";
import fade from "lib/fade.js";
import slide from "lib/slide.js";
import 'lib/prism.js';
import "./config/routes.js";
import menu from "./menu/menu.js";
import "lib/bootstrap.js";
import "./animationMonitor.js";

Ractive.defaults.data = { 'journey': journey };

//let contextPath = "/build";
let contextPath = "/journey-examples/";
//let contextPath = "";

menu.init( { target: "#menu", fallbackMenu: "#menu-home" } );

Ractive.transitions = {
	fade,
	slide
};

journey.on( events.ENTERED, function ( options ) {
	Prism.highlightAll();
} );

journey.start( {
	target: "#container",
	debug: Ractive.DEBUG = true,
	fallback: '/notFound',
	base: contextPath,
	defaultRoute: '/home',
	//useHash: false,
	//hash: '#!'
} );
