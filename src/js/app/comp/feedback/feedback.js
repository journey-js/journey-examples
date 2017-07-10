import template from './feedback.html';
import css from './feedback.css';
import Ractive from 'Ractive.js';
import journey from 'lib/journey/journey.js';

let ractive;

// Check if we are already scrolling feedback into view
let busyScrolling = false;

journey.on( 'beforeenter', function () {

	// When transitioning to new route clear the feedback
	feedback.clear();
} );

// public API
let feedback = {

	init( options ) {
		
		ractive = createFeedback( options.target );
	},
	
	setError( array ) {
		return feedback.setMessages( 'error', array );
	},
	
	setWarning( array ) { 
		return feedback.setMessages( 'warning', array );
	},
	
	setInfo( array ) { 
		return feedback.setMessages( 'info', array );
	},
	
	setSuccess( array ) { 
		return feedback.setMessages( 'success', array );
	},

	addError( msg ) { 
		return feedback.addMessage( 'error', msg );
	},

	addWarning( msg ) {
		return feedback.addMessage( 'warning', msg );
	},

	addInfo( msg ) {
		return feedback.addMessage( 'info', msg );
	},

	addSuccess( msg ) {
		return feedback.addMessage( 'success', msg );
	},

	addMessage( type, msg ) {
		let promise = ractive.push( type, { msg: msg } );
		scrollToFeedback();
		return promise;
	},
	
	setMessages( type, array ) {
		if (array == null) return;
		
		if (typeof array === 'string') {
			array = [array];
		}
		
		let preparedArray = [];
		
		array.forEach(function(val, idx) {

			preparedArray.push( { msg: val } );
		});

		let promise = ractive.set( type, preparedArray );
		scrollToFeedback();
		return promise;
	},

	clear() {
		feedback.clearComp(ractive);
	},
	
	clearComp(comp) {
		if (comp == null) return;
		
		comp.set( 'error', [ ] );
		comp.set( 'info', [ ] );
		comp.set( 'warning', [ ] );
		comp.set( 'success', [ ] );
		
	}
};

function scrollToFeedback() {
	if ( ! busyScrolling ) {
		busyScrolling = true;

		$( "html, body" ).animate( { scrollTop: 0 }, 200, function () {
			busyScrolling = false;
		} );
	}
}

function createFeedback( target ) {

	// css can only be declared with .extend. 
	let Comp = Ractive.extend( { css: css } );

	let comp = new Comp( {
		el: target,
		//css: css,

		template: template,

		data: {
			error: [ ],
			info: [ ],
			warning: [ ],
			success: [ ]
		}
	} );
	return comp;
}

export default feedback;