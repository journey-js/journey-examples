import template from './upload.html';
import Ractive from 'Ractive.js';

let detail;
let dropzone;

let module = {

	start( detail ) {

		Dropzone.autoDiscover = false;

		let upload = new Ractive( {
			el: '#slide-out-content',
			template: template,
			onrender: function () {
				createSlider();
				detail.makeDraggable();

				createDropzone();

				//$("#slide-out .drag").draggable();
			},
			submit: function () {
				this.set("myName", "MOOOOOOO");
				let files = dropzone.getAcceptedFiles();
				dropzone.processQueue();
				console.log( "Files", files )
				return false;
			}
		} );
	}

};

function createDropzone() {
	dropzone = new Dropzone( "#fileupload-form", {
		withCredentials: true,
		addRemoveLinks: true,
		autoProcessQueue: false,
		dictDefaultMessage: 'Click or drop files here to upload',
		uploadMultiple: true,
		parallelUploads: 100,
		maxFiles: 100,
		//clickable: '.dz-default',
		//clickable: false,
		previewsContainer: ".dropzone-previews",
		paramName: function() { return 'theFiles'; }
	} );

	dropzone.on( "sendingmultiple", function () {
		// Gets triggered when the form is actually being sent.
		// Hide the success button or the complete form.
		console.log("sending multiple files", arguments);
	} );
	dropzone.on( "successmultiple", function ( files, response ) {
		// Gets triggered when the files have successfully been sent.
		// Redirect user or notify of success.
		console.log("Sending Success", arguments);
	} );
	dropzone.on( "errormultiple", function ( files, response ) {
		// Gets triggered when there was an error sending the files.
		// Maybe show form again, and notify user of error
		console.log("sending Fail ", arguments);
	} );
}

/*
 function makeDraggable() {
 // Let the gallery items be draggable
 $( "#slide-out .drag" ).draggable( {
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
 }*/

function createSlider() {
	$( '#slide-out' ).tabSlideOut( {
		tabHandle: '.tabhandle', //class of the element that will become your tab
		//pathToTabImage: 'images/contact_tab.gif', //path to the image for the tab //Optionally can be set using css
		imageHeight: '122px', //height of tab image           //Optionally can be set using css
		imageWidth: '40px', //width of tab image            //Optionally can be set using css
		tabLocation: 'right', //side of screen where tab lives, top, right, bottom, or left
		speed: 300, //speed of animation
		action: 'click', //options: 'click' or 'hover', action to trigger animation
		topPos: '200px', //position from the top/ use if tabLocation is left or right
		leftPos: '20px', //position from left/ use if tabLocation is bottom or top
		fixedPosition: false, //options: true makes it stick(fixed position) on scroll
		clickScreenToClose: false,
		offset: '70px'
	} );
}

export default module;

