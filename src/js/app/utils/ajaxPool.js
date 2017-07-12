// Tracks all created ajax requests, and removes once complete.
// This allows us to abort all active requests when transitioning to anotyher route

let pool = [ ];

let ajaxPool = {

	/**
	 * Abort all ajax requests in pool.
	 */
	abortAll( ) {
		pool.forEach( ( jqXHR, index ) => {   //  cycle through list of recorded connection
			jqXHR.abort( ); //  aborts connection
			pool.splice( index, 1 ); //  removes from list by index
		} );
	}
};

$.ajaxSetup( {
	beforeSend: function ( jqXHR ) {
		pool.push( jqXHR );
	}, //  add connection to list

	complete: function ( jqXHR ) {
		var i = pool.indexOf( jqXHR ); //  get index for current connection completed
		if ( i > - 1 )
			pool.splice( i, 1 ); //  removes from list by index
	}
} );

export default ajaxPool;