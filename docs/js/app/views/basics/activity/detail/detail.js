import template from "./detail.html";
import Ractive from "Ractive.js";
import feedback from "app/comp/feedback/feedback.js";
import commentPartial from "./comment/comment.html";
import documentPartial from "./document/document.html";

let shop;
let detail;

let module = {

	start( ) {
		console.log( "START DETAIL" )

		detail = new Ractive( {
			el: '#rc-av-detail',
			template: template,
			partials:
					{
						comment: commentPartial,
						document: documentPartial
					},

			setActivity( newActivity ) {

				shop.setActivity( newActivity );

				detail.set( "opacity", 0 );
				detail.set( "activity", newActivity ).then( function () {
					var el = document.getElementById( 'commentList' );
					//var sortable = Sortable.create( el, { group: {name: 'test', put: false, pull:'clone'} });
//					interact('.draggable') .draggable({
//						 onend: function (event) {
//							 console.log("onend", event)
//						 }						
//					});

					let node = $( '.drag' );

					makeDraggable();

					makeMasterDroppable();

					let received = false;
					let fromIndex;
					let receiveFromItem;

					//$( ".shopsort" ).sortable( {

					makeShopDroppable();

					/*
					 $( ".shopsort" ).sortable( {
					 revert: false,
					 receive: function ( event, ui ) {
					 console.log("MOOOOOOOOOOOOOO")
					 let fromIndex = ui.item.index();
					 receiveFromItem = detail.get('activity.comments[' + fromIndex + ']');
					 received = true;
					 //let newItem = { name: ui.item.text() };
					 //shop.splice( 'activity.documents', 1, 0, fromItem );
					 },
					 start: function ( event, ui ) {
					 fromIndex = ui.item.index();
					 },
					 update: function ( event, ui ) {
					 
					 let toIndex = ui.item.index();
					 
					 if ( received ) {
					 ui.item.remove();
					 shop.splice( 'activity.documents', toIndex, 0, receiveFromItem );
					 received = false;
					 return;
					 }
					 
					 let removedItem = shop.splice( 'activity.documents', fromIndex, 1 ).result[0];
					 shop.splice( 'activity.documents', toIndex, 0, removedItem );
					 }
					 } );*/

//					$( ".shopso" ).droppable( {
//						accept: ".drag",
//						classes: {
//							"ui-droppable-hover": "highlight",
//							//"ui-droppable-active": "ui-state-highlight"
//						},
//						drop: function ( event, ui ) {
//							//deleteImage( ui.draggable );
//							blink( $( this ) );
//						}
//					} );

					detail.animate( "opacity", 1.0, { duration: 200 } ).then( function () {
					} );
				} );
				/*
				 // hack: Set to null so dom is destroyed and recreated. This will retrigger the fade animation
				 detail.set( "activity", null ).then( function () {
				 detail.set( "activity", newActivity ).then( function () {
				 var el = document.getElementById( 'commentList' );
				 var sortable = Sortable.create( el );
				 } )
				 } )
				 
				 */
			},

			addToCart( activity ) {
				alert( "ok" )
			},

			setShop( arg ) {
				shop = arg;
			},

			makeDraggable() {
				makeDraggable();
			},
			
			makeMasterDroppable() {
				makeMasterDroppable();
			},

			makeShopDroppable() {
				makeShopDroppable();
			}


		} );
		addTabListener( detail );
		return detail;
	}

};

function highlight( $el ) {
	$el.highlight();
	return;

	$el.fadeTo( 100, 0.1, function () {
		$el.addClass( "ui-state-highlight" );
		$el.fadeTo( 1600, 0.8, function () {
			$el.delay( 100 ).fadeTo( 1300, 0.1, function () {
				$el.removeClass( 'ui-state-highlight' );
				$el.fadeTo( 0, 1.0, function () {
				} )
			} );
		} )
	} );
}

function makeDraggable() {
	// Let the gallery items be draggable
	$( ".drag" ).draggable( {
		scroll: false,
		appendTo: 'body',
		containment: 'window', // document
		connectToSortable: ".shopsort",
		cancel: "a.ui-icon", // clicking an icon won't initiate dragging
		revert: "invalid", // when not dropped, the item will revert back to its initial position

		helper: "clone",
		cursor: "move",
		handle: ".handle"
	} );
}

function makeMasterDroppable() {
	// Let the trash be droppable, accepting the gallery items
	$( ".drop" ).droppable( {
		accept: ".drag",
		classes: {
			"ui-droppable-hover": "highlight"
					//"ui-droppable-active": "ui-state-highlight"
		},
		drop: function ( event, ui ) {
			console.log( "WTFD" );
			//deleteImage( ui.draggable );
			highlight( $( this ) );
		}
	} );
}

function makeShopDroppable() {
	$( ".shopdrop" ).droppable( {
		revert: false,
		accept: '#commentList .drag',
		drop: function ( event, ui ) {
			let fromIndex = ui.draggable.index();
			let dropItem = detail.get( 'activity.comments[' + fromIndex + ']' );
			let insertAt = shop.get( 'activity.documents' ).length;
			shop.splice( 'activity.documents', insertAt, 0, dropItem ).then( function () {
				// We have to manually make the new item draggable it seems. TODO only make the new item draggable, not every item with .drag class
				makeDraggable();
				/*
				 $( ".drag" ).draggable( {
				 connectToSortable: ".shopsort",
				 cancel: "a.ui-icon", // clicking an icon won't initiate dragging
				 revert: "invalid", // when not dropped, the item will revert back to its initial position
				 containment: "document",
				 helper: "clone",
				 cursor: "move",
				 handle: ".handle"
				 } );
				 */
			} )

			//deleteImage( ui.draggable );
			highlight( $( this ) );

		}

	} );
}

function addTabListener( detail ) {

	$( '.nav-tabs a' ).on( 'shown.bs.tab', function ( event ) {
		var href = $( event.target ).attr( 'href' ); // active tab
		var y = $( event.relatedTarget ).text( ); // previous tab
	} );

//	$( document ).on( 'click', '.nav-tabs a', function () {
//		var $link = $( 'li.active a[data-toggle="tab"]' );
//		debugger;		
//		$link.parent().removeClass( 'active' );
//		var tabLink = $link.attr( 'href' );
//		$( '#mainTabs a[href="' + tabLink + '"]' ).tab( 'show' );
//	} );
}

export default module;
