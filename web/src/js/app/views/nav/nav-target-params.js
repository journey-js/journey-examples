define(function (require) {
	var $ = require("jquery");
	var kudu = require("kudu");
		var template = require("rvc!./nav-target-params");

	function navTargetParams() {

		var that = {};

		that.onInit = function (options) {
			var routes;
			require(["app/config/routes"], function(arg) {
				routes = arg;
			});

			var view = createView(options.routeParams, options.args);
			return view;
		};
		
		function createView(params, args) {

			var view = new template({
				data: {
					args: args,
					params: params
				}
			});
			return view;
		}

		return that;
	}
	return navTargetParams;
});
