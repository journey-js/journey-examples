define(function (require) {
	var $ = require("jquery");
	var kudu = require("kudu");
	var template = require("rvc!./nav-target");

	function navTarget() {

		var that = {};

		that.onInit = function (options) {
			var routes;
			require(["app/config/routes"], function(arg) {
				routes = arg;
			});

			var view = createView();
			return view;
		};

		function createView() {

			var view = new template({
				goto: function (routeName) {
					// Retrieve the route from routes
					var route = routes[routeName];

					// Navigate to the route specified
					kudu.go({ctrl: route.ctrl});

					// Cancel the click event by returning false, otherwise the link function would execute ie. follow the link href
					return false;
				}
			});
			return view;
		}

		return that;
	}
	return navTarget;
});
