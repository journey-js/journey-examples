//
// // Place third party dependencies in the lib folder
//
// Configure loading modules from the lib directory,
// except 'app' ones,
requirejs.config({
	"baseUrl": "js/lib", // root folder where all our libraries are located

	"paths": {
		"app": "../app", // path to our application
		//"kudu": "kudulib/src/kudu.0.0.1", // uncomment this line and *comment* the *map* section below to use the optimized version
		//"moment": "moment",
		//"numeral": "numeral",
		//"bootstrap": '../app/plugins/bootstrap',
		//'select2': '../app/plugins/select2',
		"jquery": 'jquery-2.1.4',
				//'ractive': 'http://cdn.ractivejs.org/edge/ractive',
				//@,'jquery': 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min'
	},
	map: {
		'*': {
			'kudu': 'kudulib/src/kudu'
		}
	},
	"shim": {
		 ripples : {
            deps: ["jquery"]
        },
        material: {
            deps: ["bootstrap", 'ripples']
        },
		
		"bootstrap": {
			"deps": ['jquery']
		},
		"prism": {
			"exports": "Prism"
		}
//		"parsley": {
//			"deps": ["jquery"],
//			"exports": "parsley"
//		}
		/*
		 'select2': {
		 deps: ['jquery'],
		 exports: 'Select2'
		 },*/
//
//		, ripples: {
//			deps: ["jquery"]
//		},
//		material: {
//			deps: ["bootstrap", 'ripples']
//		}
	}
});

// onResourceLoad is a requirejs extension to manipulate modules being loaded.
// Here we add a the module ID (which is also the path to the module location)
// as an attribute on the module itself

/*
 requirejs.onError = function (err) {
 if (err.requireType === 'timeout') {
 // tell user
 alert("error: "+err);
 } else {
 throw err;
 }
 };*/

requirejs(["pace"], function (pace) {

	pace.start({
			//ajax: false, // disabled
			document: false, // disabled
			eventLag: false // disabled

	});
	pace.on("stop", function() {
		var e = document.querySelector(".pace");
	e.classList.add("initial");
	//debugger;
	});
	pace.on("hide", function() {
		var e = document.querySelector(".pace");
	e.classList.add("initial");
	//debugger;
	});
;
	pace.on("done", function() {
		var e = document.querySelector(".pace");
	//e.classList.add("initial");
	//debugger;
	});
	var e = document.querySelector(".pace");
	e.classList.add("initial");
});
// Load the addId modules which automatically adds an ID to each loaded module
requirejs(["app/config/addId"], function () {
	// Load the start module to start the application
	requirejs(["app/start"]);
});
