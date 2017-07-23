import journey from 'lib/journey/journey.js';
import events from "lib/journey/event/events.js";
import Ractive from "Ractive.js";
import slide from "lib/slide.js";
import 'lib/prism.js';
import "./config/routes.js";
import menu from "./menu/menu.js";
import "lib/bootstrap.js";
import "./animationMonitor.js";
import feedback from 'comp/feedback/feedback.js';
import config from './config/config.js';
import ajaxPool from './utils/ajaxPool.js';
import utils from './utils/utils.js';
import 'lib/dropzone.js';

//let contextPath = "/build";
		let contextPath = "/journey-examples/";
//let contextPath = "";

menu.init( { target: "#menu", fallbackMenu: "#menu-home" } );
feedback.init( { target: '#feedback' } );

journey.on( events.ENTERED, function ( event ) {
	Prism.highlightAll();
} );

journey.on( events.LEFT, function ( event ) {
	// abort active AjaxRequests when leaving route
	ajaxPool.abortAll();
} );

// Set a default ajax error handler
$( document ).ajaxError( function ( event, jqXHR, ajaxSettings, thrownError ) {

	if ( utils.isAborted( jqXHR ) ) {
		// don't display message for aborted requests
		return;
	}

	// Default messages
	if ( utils.isOffline( jqXHR ) ) {
		feedback.addError( "Sorry, you are currently offline. Try again when you are online." );

	} else {
		feedback.addError( "Sorry, an unkonwn error occurred. Please try again later." );
	}
} );

journey.start( {
	target: config.el,
	debug: Ractive.DEBUG = true,
	fallback: '/notFound',
	base: contextPath,
	defaultRoute: '/home'
			//useOnHashChange: true,
			//useHash: false,
			//hash: '#!'
} );
