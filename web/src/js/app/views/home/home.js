import journey from "lib/journey/journey";
//var basic = require( "../basics/controller/basic" );
import template from "./home.html";
import Ractive from "lib/ractive";

var home = {

	enter: function ( route, from, options ) {

		route.view = new Ractive( {
			el: options.target,
			template: template
		} );

		route.view.start = function () {
			journey.goto( "/basic", {x: "1234"} );
		};
	},

	leave: function ( route, to ) {
		route.view.teardown();
	}

};


var that;
that.onInit = function ( options ) {
	var view = createView();
	return view;
};

that.onRender = function ( options ) {

	const view3 = new Ractive( {
		onrender: function () {
		},
		template: 'bye'
	} );

	const view1 = new Ractive( {
		onrender: function () {
			$( '#c1-demo' ).removeClass( 'invisible' ).addClass( "rollIn" );
		},
		template: 'helllos'
	} );
	const view2 = new Ractive( {
		onrender: function () {
			console.log( "2" )
			$( '#c2-demo' ).removeClass( 'invisible' ).addClass( "rollIn" );
		},
		oncomplete: function () {
			setTimeout( function () {
				view2.attachChild( view3, { target: 'foo' } );

			}, 200 );
		},
		template: '<#foo /> <h1 style="padding-top:30px; padding-bottom:0px;"><span id="c2-welcome" class="animated bounceInLeft">Child</span> <span id="c2-demo" class="animated highlightLetter invisible">2</span></h1>'
	} );

	//options.view.attachChild( view1 , { target: 'c' } );

	setTimeout( function () {
		///options.view.detachChild( view1, {target: 'c'}  );
		console.log( "1" )
		options.view.attachChild( view2, { target: 'c' } );
		/*
		 if (c2Ctrl.then == null) {
		 options.view.attachChild( c2Ctrl , { target: 'c' } );
		 c1.onRender(options);
		 } else {
		 c2Ctrl.then(function(c2Comp) {
		 options.view.attachChild( c2Comp , { target: 'c' } );					
		 c1.onRender(options);
		 });
		 }*/
	}, 2000 );


	setTimeout( function () {
		$( '#home-demo' ).removeClass( 'invisible' ).addClass( "rollIn" );
	}, 500 );
	$( '#home-welcome' ).one( 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
		//$('#home-demo').removeClass('invisible').addClass("zoomInUp");
		//$('#').addClass('animated infinite shake');
	} );
};

function createView() {

	var view = new template( { } );
	view.start = function () {
		journey.goto( "/basic" );
	};
	return view;
}



	setTimeout( function () {
		$( '#home-demo' ).removeClass( 'invisible' ).addClass( "rollIn" );
	}, 500 );
	$( '#home-welcome' ).one( 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
		//$('#home-demo').removeClass('invisible').addClass("zoomInUp");
		//$('#').addClass('animated infinite shake');
	} );

export default home;

//http://localhost:8080/RetailMagnumWeb/src/app/indexTrigger.jsp

//http://localhost:8080/RetailMagnumWeb/rest/magnum/startSession?cacheSlayer=1480682031515&url=RnJvbVN5c3RlbT1QUk9WQ0NOQiZGcm9tU3lzdGVtSWQ9MTY1MDU5NTAxMTMwJkxpZmVJZD03MDg4MjYmUmVzZXRTZXNzaW9uPU4&user=798656
