import journey from 'lib/journey/journey.js';
import events from "lib/journey/event/events.js";
import Ractive from "Ractive.js";
import fade from "lib/fade.js";
import slide from "lib/slide.js";
import 'lib/prism.js';
import "./config/routes.js";
import menu from "./menu/menu.js";
import "lib/bootstrap.js";
import "./animationMonitor.js";
import feedback from 'comp/feedback/feedback.js';
import config from './config/config.js';

//let contextPath = "/build";
let contextPath = "/journey-examples/";
//let contextPath = "";

menu.init( { target: "#menu", fallbackMenu: "#menu-home" } );
feedback.init({target: '#feedback'});

journey.on( events.ENTERED, function ( options ) {
	Prism.highlightAll();
} );

// Set a default ajax error handler
$( document ).ajaxError( function ( event, jqjqXHR, ajaxSettings, thrownError ) {
	// Default message
	feedback.addError( "Sorry, an unkonwn error occurred. Please try again later." );
} );

journey.start( {
	target: config.el,
	debug: Ractive.DEBUG = true,
	fallback: '/notFound',
	base: contextPath,
	defaultRoute: '/home'
	//useHash: false,
	//hash: '#!'
} );
