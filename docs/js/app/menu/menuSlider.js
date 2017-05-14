import journey from "lib/journey/journey.js";
import 'lib/prism.js';

let windowResizeTimeoutId;

let menuSlider = {

	init( options ) {
		setupWindowResizeListener();

		setupMenuListener();
		/*
		 let $fallbackMenu = $( options.fallbackMenu );
		 let $initialLi = $fallbackMenu.parent();
		 setSliderOnActiveMenu( $initialLi );*/
	},

	updateSlider( $li ) {
		// Parent dropdown menus should be skipped and handled by the child menu when selected
		if ( $li.length == 0 ) {
			return;
		}

		updateMenu( $li );

		slideToMenu( $li );
	}
};

function setupMenuListener() {

	journey.on( "entered", options => {
		let viewName = getViewName( options );
		console.log( "viewname:", viewName );

		let $li = getMenu( viewName );

		if ( hasActiveMenu() ) {
			menuSlider.updateSlider( $li );

		} else {
			updateMenu( $li );						
			initializeSlider( $li );
		}
	} );

//	$( '.navbar li' ).click( function ( e ) {
//		var $li = $( this );
//
//		menuSlider.updateSlider( $li );
//	} );
}

function updateMenu( $li ) {

	if ( hasParent( $li ) ) {
		let $parent = getParent( $li );
		updateChild( $parent, $li );
		//slideToActiveMenu( $parent );

	} else {
		updateLeaf( $li );
		//slideToActiveMenu( $li );
	}
	//}

	return $li;
}

function updateLeaf( $li ) {
	$( '.navbar li.active' ).removeClass( 'active' );
	$li.addClass( 'active' );
}

function updateChild( $parent, $leaf ) {
	$( '.navbar li.active' ).removeClass( 'active' );
	$parent.addClass( 'active' );

	$( "#navbar .sub-active" ).removeClass( "sub-active" );
	$leaf.addClass( "sub-active" );
}

function slideToMenu( $li ) {
	if ( hasParent( $li ) ) {
		$li = getParent( $li );
	}

	if ( $( "#nav-ind" ).is( ":visible" ) ) {
		// Only navigate to the menu if the menu has not collapsed yet ie is less than 768px
		var location = getActiveMenuLocation( $li );
		$( '#nav-ind' ).animate( location, 'fast', 'linear' );
	}
}

function initializeSlider( $li ) {
	if ( hasParent( $li ) ) {
		$li = getParent( $li );
	}
	//$liItem.addClass( "active" );
	var loc = getActiveMenuLocation( $li );
	$( '#nav-ind' ).css( loc );
}

function hasActiveMenu() {
	let $li = $( ".navbar li.active" );
	return $li.length > 0;
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

function isParent( $li ) {
	if ( $li.hasClass( "dropdown" ) ) {
		return true;
	}
	return false;
}

function isLeaf( $li ) {
	return ! isParent( $li );
}

function getParent( $li ) {
	let $parent = $li.closest( '.dropdown' );
	return $parent;
}

function hasParent( $li ) {
	let $parent = getParent( $li );
	if ( $parent.length == 1 ) {
		return true;
	}
	return false;
}

function getViewName( options ) {
	let route = options.to;
	let path = route.path;
	if ( path == null ) {
		return "";
	}

	let start = path.lastIndexOf( "/" );
	let name = path.slice( start + 1 );
	return name;
}

function getMenu( viewName ) {
	
	let selector = "#menu-" + viewName;
	let $li = $( selector ).parent();

	if ( $li.length == 0 ) {
		$li = $( ".navbar [href='/" + viewName + "'], .navbar [href='#" + viewName + "'], .navbar [href='" + viewName + "']" ).parent( );
	}
	return $li;
}

export default menuSlider;