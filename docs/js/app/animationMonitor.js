import Ractive from "Ractive.js";
import journey from "lib/journey/journey";

journey.on( "routeAbuseStart", function ( options ) {
	console.log( "** Disabling animation", options );
	Ractive.defaults.transitionsEnabled = false;
} );
journey.on( "routeAbuseEnd", function ( options ) {
	Ractive.defaults.transitionsEnabled = true;
	console.log( "** Renabling animations", options );
} );
