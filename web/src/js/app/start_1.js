var $ = require( "jquery" );
var ractive = require( "ractive" );
require( "bootstrap" );
var prism = require( "prism" );
var routes = require( "app/config/routes" );
var kudu = require( "kudu" );
var menu = require( "./menu/menu" );

menu.init( { target: "#menu" } );

var vf = {
	createView: function ( options ) {
		return kudu.getDefaultViewFactory().createView( options );
	},
	renderView: function ( options ) {
		return kudu.getDefaultViewFactory().renderView( options );
	},
	unrenderView: function ( options ) {
		return kudu.getDefaultViewFactory().unrenderView( options );
	}
};

kudu.init( {
	viewFactory: vf,
	target: "#container",
	routes: routes,
	defaultRoute: routes.home,
	fx: true
			//unknownRouteResolver: null,
} );

kudu.once( "lc.render", setupInitialActiveMenu );

kudu.on( "lc.render", function () {
	prism.highlightAll();
} );

kudu.on( "lc.render", function () {
	console.log( "lc.render" )
} );
kudu.on( "lc.unrender", function () {
	console.log( "lc.unrender" )
} );
kudu.on( "lc.fail", function ( options ) {
	console.log( options )
} );

kudu.on( "global.ajax.start", function ( options ) {
	console.log( "global start", options );
} );

kudu.on( "global.ajax.stop", function ( options ) {
	console.log( "global stop", options );
} );

kudu.on( "global.ajax.error", function ( options ) {
	console.log( "error", options );
} );

kudu.on( "ajax.error", function ( options ) {
	console.log( "error", options.error );
} );

kudu.on( "ajax.success", function ( options ) {
	console.log( "success", options );
} );

function setupInitialActiveMenu( options ) {

	// options.initialRoute;
	var route = kudu.getActiveRoute();
	var path = route.path;
	if ( path == null ) {
		path = '';
	}

	path = path.slice( 1 );
	var $item = $( ".navbar [href='#" + path + "']" );
	$item.closest( 'li' ).addClass( "active" );

}
