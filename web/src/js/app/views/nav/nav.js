define(function (require) {
	var $ = require("jquery");
	var kudu = require("kudu");
	var template = require("rvc!./nav");
	var  navTargetWithParams = require("./nav-target-params");

	function nav() {

		var that = {};

		that.onInit = function (options) {
			var view = createView();
			return view;
		};

		function createView() {
			var routes;
			require(["app/config/routes"], function (arg) {
				routes = arg;
			});

			var view = new template({
				data: {
					example1: "js/app/views/nav/nav1-example.js",
					example2: ""
				},
				gotoTargetWithParams: function (routeName) {
					// Navigate to the route specified
					var params = {'id': 1, 'name': 'Bob'};
					var args = {'myargs': ['one', 'two', 'three']};
					kudu.go({ctrl: navTargetWithParams, routeParams: params, args: args});

					// Cancel the click event by returning false, otherwise the link function would execute ie. follow the link href
					return false;
				}

				/*
				 goto: function (routeName, params, args) {
				 // Retrieve the route from routes
				 var route = routes[routeName];
				 
				 // Navigate to the route specified
				 kudu.go({ctrl: route.ctrl, routeParams: params, args: args});
				 
				 // Cancel the click event by returning false, otherwise the link function would execute ie. follow the link href
				 return false;
				 }*/
			});

			return view;
		}

		return that;
	}
	return nav;
});
