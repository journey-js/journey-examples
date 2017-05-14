	import journey from "lib/journey/journey.js";
	var template = require("rvc!./basic-ajax");
	
	import journey from "lib/journey/journey.js";
	import template from "./basicAjax.html";
	
	var basicAjax = {
		
		enter: function ( route, prevRoute, options ) {
			
		},
		
		leave: function ( route, nextRoute, options ) {
			
		}
	};
	
	export default basicAjax

	function basicAjax() {

		var that = {};

		that.onInit = function (options) {

			var promise = new Promise(function (resolve, reject) {

				// We load the json data through an Ajax request
				$.getJSON("data/hello.json?delay=2000").then(function (data) {

					// Here we have the data and pass it to the createView method to render
					var view = createView(data);
					
					// Everything is good, so we resolve the promise, passing in the view
					resolve(view);
				}, function () {
					// Oops, something went wrong, so we reject the promise
					reject("Could not load data for BasicAjax");
				});
			});

			return promise;
		};

		function createView(data) {

			var view = new template();

			// Convert the JSON data objectr to a string representation
			var json = JSON.stringify(data);
			
			// Set the json data object to render
			view.set("response", json);
			
			view.reload = function () {
				journey.go({ctrl: basicAjax});
			};
			return view;
		}

		return that;
	}
	return basicAjax;
});
