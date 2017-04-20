import journey from "lib/journey/journey.js";
import 'lib/prism.js';

let windowResizeTimeoutId;

let menuSlider = {

	init: () => {
		setupWindowResizeListener();
	}


};

journey.on( "entered", function ( options ) {
	slideToActiveMenu( options.to );

} );

function slideToActiveMenu( route ) {

	var $activeMenu = $( "#navbar li.active" );

	let path = route.pathname;

	let $liItem = $( "#menu-" + path ).parent();
	if ( $liItem.length == 0 ) {
		$liItem = $( ".navbar [href='/" + path + "']" ).parent();
	}


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
}

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
	var offsetLeft = 0;
	var offsetLeft = 0;
	if ( $li.length ) {
		let $navbar = $( '#navbar' );
		let navbarOffset = $navbar.offset();
		let itemOffset = $li.offset();
		offsetLeft = itemOffset.left - navbarOffset.left;
	}

	var width = $( '#navbar' ).width();
	var liWidth = $( $li ).width();
	let navbarHeight = $( '#navbar' ).height();
	let liHeight = $li.height();

	var location = {
		top: offsetTop,
		left: offsetLeft,
		right: width - liWidth - offsetLeft,
		bottom: navbarHeight - liHeight - offsetTop
	};
	return location;
}

export default menuSlider;