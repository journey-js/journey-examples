import journey from 'lib/journey/journey';
import Ractive from 'lib/ractive';
import fade from "lib/fade";
import 'lib/prism';
import "./config/routes";
import menu from "./menu/menu";
import "lib/bootstrap";
import "./animationMonitor";


let windowResizeTimeoutId;

menu.init( { target: "#menu" } );

Ractive.transitions = {
	fade
};

journey.start( {
	target: "#container",
	debug: Ractive.DEBUG = true,
	fallback: '/notFound'
} );

journey.on( "entered", function () {
	Prism.highlightAll();
	//setupInitialActiveMenu();

	var $activeMenu = $( "#navbar li.active" );

	let index = location.href.lastIndexOf( '/' ) + 1;
	let path = location.href.substr( index );
	if ( path == "" ) {
		path = "home";
	}
	if ( path.indexOf( "#" ) == 0 || path.indexOf( "/" ) == 0 ) {
		path = path.substr( 1 );
	}

	//var $item = $( ".navbar [href='#" + path + "']" ).parent();
	let $liItem = $( ".navbar [href='/" + path + "']" ).parent();
	//var $item = $( "#menu-" + path ).parent();

	$liItem = handleDropdown( $liItem );

	if ( $activeMenu.length > 0 ) {
		let $subLi = $( "#navbar li.active li.sub-active" );
		$subLi.removeClass( "sub-active" );

		let $activeLi = $( "#navbar li.active" );
		$activeLi.removeClass( "active" );
		slideToActive( $liItem );
	} else {
		setInitialActiveMenu( $liItem );
	}
} );

function handleDropdown( $item ) {
	if ( $item.length === 1 ) {

		// If this menu is in a dropdown, we need to reference the top parent menu item to highlight it
		var $dropdown = $item.closest( '.dropdown' );

		if ( $dropdown.length === 1 ) {
			$item.addClass( "sub-active" );

			// store reference to $item 
			$dropdown.child = $item;
			$item = $dropdown;
		}
	}

	return $item;
}

setupWindowResizeListener();

function slideToActive( $liItem ) {
	//let $li = $item.parent();
	$liItem.addClass( 'active' );

	// If this menu is in a dropdown, we need to reference the top parent menu item to highlight it
	if ( $liItem.child ) {
		$liItem.child.addClass( "sub-active" );
	}

	if ( $( "#nav-ind" ).is( ":visible" ) ) {
		// Only navigate to the menu if the menu has not collapsed yet ie is less than 768px
		var location = getActiveMenuLocation( $liItem );
		$( '#nav-ind' ).animate( location, 'fast', 'linear' );
	}
}

function setInitialActiveMenu( $liItem ) {
	//var $item = $( ".navbar [href='#" + path + "']" );
	//let $li = $item.parent();
	$liItem.addClass( "active" );
	var loc = getActiveMenuLocation( $liItem );
	//let $activeMenu = $( "#navbar li.active" );
	//var loc = getActiveMenuLocation( $activeMenu );
	$( '#nav-ind' ).css( loc );
}

function setupWindowResizeListener() {
	$( window ).resize( function () {
		clearTimeout( windowResizeTimeoutId );
		windowResizeTimeoutId = setTimeout( windowResized, 0 );
	} );

	windowResized();
}

function windowResized() {
	if ( window.matchMedia( '(min-width: 768px)' ).matches ) {
		var $activeMenu = $( "#navbar li.active" );
		if ( $activeMenu.length > 0 ) {
			var location = getActiveMenuLocation( $activeMenu );
			$( '#nav-ind' ).css( location );
		}
	}
}

function getActiveMenuLocation( $li ) {
	var offsetTop = 60;
	var $item = $( $li );
	var offsetLeft = 0;
	var offsetLeft = 0;
	if ( $item.length ) {
		let $navbar = $( '#navbar' );
		let navbarOffset = $navbar.offset();
		let itemOffset = $item.offset();
		offsetLeft = itemOffset.left - navbarOffset.left;
	}

	var width = $( '#navbar' ).width();
	var liWidth = $( $li ).width();

	var location = {
		top: offsetTop,
		left: offsetLeft,
		right: width - liWidth - offsetLeft,
		bottom: $( '#navbar' ).height() - $( $li ).height() - offsetTop
	};
	return location;
}