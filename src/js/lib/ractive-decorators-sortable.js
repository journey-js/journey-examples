import Ractive from "Ractive.js";

var sortableDecorator = (function ( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'ractive' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define([ 'ractive' ], factory );
	}

	// browser global
	else if ( Ractive ) {
		factory( Ractive );
	}

	else {
		throw new Error( 'Could not find Ractive! It must be loaded before the Ractive-decorators-sortable plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function ( Ractive ) {

	'use strict';

	var sortable,
		src,
		dragstartHandler,
		dragenterHandler,
		removeTargetClass,
		preventDefault,
		errorMessage;

	sortable = function ( node ) {
		node.draggable = true;

		node.addEventListener( 'dragstart', dragstartHandler, false );
		node.addEventListener( 'dragenter', dragenterHandler, false );
		node.addEventListener( 'dragleave', removeTargetClass, false );
		node.addEventListener( 'drop', removeTargetClass, false );

		// necessary to prevent animation where ghost element returns
		// to its (old) home
		node.addEventListener( 'dragover', preventDefault, false );

		return {
			teardown: function () {
				node.removeEventListener( 'dragstart', dragstartHandler, false );
				node.removeEventListener( 'dragenter', dragenterHandler, false );
				node.removeEventListener( 'dragleave', removeTargetClass, false );
				node.removeEventListener( 'drop', removeTargetClass, false );
				node.removeEventListener( 'dragover', preventDefault, false );
			}
		};
	};

	sortable.targetClass = 'droptarget';

	errorMessage = 'The sortable decorator only works with elements that correspond to array members';

	dragstartHandler = function ( event ) {
		var context = Ractive.getContext( this );
		src = context;
		
		// this decorator only works with array members!
		if ( !Array.isArray( context.get( '../' ) ) ) {
			throw new Error( errorMessage );
		}

		event.dataTransfer.setData( 'text', '' ); // enables dragging
	};

	dragenterHandler = function ( event ) {
		var dest = Ractive.getContext( this );
		
		event.dataTransfer.dropEffect = 'none';

		// If we strayed into someone else's territory, abort
		if ( dest.ractive.root !== src.ractive.root ) {
			return;
		}

		if ( !Array.isArray( dest.get( '../' ) ) ) {
			throw new Error( errorMessage );
		}

		// if we're dealing with a different array, abort
		if ( dest.get( '../' ) !== src.get( '../' ) ) {
			return;
		}

		var srcIdx = src.get( '@index' ), destIdx = dest.get( '@index' );
		
		this.classList.add( sortable.targetClass );
		event.dataTransfer.dropEffect = 'move';

		// swizzle the array and tell ractive to update
		var array = src.get( '../' );
			
		let removedItem = array.splice( srcIdx, 1 )[0];
		array.splice( destIdx, 0, removedItem );
		src.update( '../' );
		
		// dest is the new src
		src = dest;
	};

	removeTargetClass = function () {
		this.classList.remove( sortable.targetClass );
	};

	preventDefault = function ( event ) { event.preventDefault(); };

	Ractive.decorators.sortable = sortable;

	return sortable;

}));

// Common JS (i.e. browserify) environment
if ( typeof module !== 'undefined' && module.exports) {
	module.exports = sortableDecorator;
}
