define(function (require) {
	var $ = require("jquery");
	var kudu = require("kudu");
	var template = require("rvc!./redirect");
	var target = require("../redirect/redirect-target");

	function redirect() {

		var that = {};

		that.onInit = function (options) {
			if (options.routeParams.typeId == null) {
				kudu.go({ctrl: target, updateUrl: false});
				return null;
			}
			
			return createView();
		};

		function createView() {
			var view = new template();

			return view;
		}

		return that;
	}
	return redirect;
});
